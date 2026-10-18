//! The run daemon: one headless browser per run directory, driven over CDP,
//! answering one verb at a time on a token-protected local port.
//!
//! The runner never sees what this process knows about the page beyond what a
//! visitor perceives. Diagnostics (console errors, failed requests, unlabeled
//! or pointer-only controls, target sizes, focus rings) go to `trace.jsonl`
//! only; the success check is sealed outside the session directory
//! (`paths::sealed_files`), and only this process reads it.
//!
//! - `mod.rs`: state, the protocol loop, and browser setup
//! - `page.rs`: settling, snapshots, screenshots, the success check
//! - `act.rs`: input (mouse, touch, keys, scrolling, navigation)
//! - `step.rs`: one recorded step, and how its effect is classified
//! - `render.rs`: the observation the runner reads
//! - `verbs.rs`: the verbs, their guards, and the end of a run
//! - `serve.rs`: the control channel

mod act;
mod page;
mod render;
mod serve;
mod step;
mod verbs;

pub use serve::{serve, write_first};
pub use verbs::RUNNER_VERBS;

use std::collections::{HashMap, HashSet};
use std::fs;
use std::path::{Path, PathBuf};
use std::time::{Duration, Instant};

use impeccable_browser::cdp::{client_error_message, Browser};
use serde_json::{json, Value};

use crate::hosts;

const PAGE_JS: &str = include_str!("../../assets/page.js");
const COMMAND_TIMEOUT: Duration = Duration::from_secs(30);
/// Requests that never settle on their own; waiting on them would stall every action.
const LONG_LIVED: [&str; 8] = [
    "WebSocket",
    "EventSource",
    "Media",
    "Manifest",
    "Other",
    "Ping",
    "CSPViolationReport",
    "Prefetch",
];
/// Playwright's iPhone 13 descriptor.
const IPHONE_UA: &str = "Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1";

/// Why a protocol step stopped: a JavaScript dialog opened (the page is now
/// frozen until someone answers it), or anything else.
enum Fail {
    Dialog,
    Msg(String),
}

type R<T> = Result<T, Fail>;

#[derive(Clone)]
struct Tab {
    session: String,
    target: String,
    main_frame: String,
}

struct OpenDialog {
    kind: String,
    message: String,
}

/// What happened since the last step, emptied into the next trace entry.
#[derive(Default)]
struct Pending {
    console: Vec<String>,
    page_errors: Vec<String>,
    network: Vec<String>,
    dialogs: Vec<Value>,
    blocked: Vec<String>,
    tabs: usize,
}

/// Who sent a verb. The runner's client (`usertest act`) can only drive the
/// page; stopping a run and saving sign-in state belong to the parent.
#[derive(PartialEq, Eq, Clone, Copy)]
pub enum Role {
    Parent,
    Runner,
}

pub struct Driver {
    browser: Browser,
    tab: Tab,
    opener_stack: Vec<Tab>,
    popups: Vec<(String, String)>,
    run_dir: PathBuf,
    sealed: Value,
    result_file: PathBuf,
    /// The one remote host the user consented to, if any.
    allowed_host: Option<String>,
    mobile: bool,
    keyboard: bool,
    slow: bool,
    budget: u64,
    device: (u32, u32, f64),
    pending: Pending,
    inflight: HashSet<String>,
    requests: HashMap<String, (String, String)>,
    dom_ready: bool,
    step: u64,
    actions: u64,
    next_ref: u64,
    goal_met_at: Option<u64>,
    done: bool,
    last: Option<Value>,
    started: Instant,
    dialog_policy: Option<bool>,
    dialog: Option<OpenDialog>,
    blocked_cmd: Option<u64>,
    restore_script: Option<String>,
}

fn s<'a>(v: &'a Value, key: &str) -> &'a str {
    v.get(key).and_then(Value::as_str).unwrap_or("")
}

fn strs<'a>(v: &'a Value, key: &str) -> impl Iterator<Item = &'a str> {
    v.get(key)
        .and_then(Value::as_array)
        .into_iter()
        .flatten()
        .filter_map(Value::as_str)
}

fn first_line(m: &str, max: usize) -> String {
    m.split('\n')
        .next()
        .unwrap_or("")
        .chars()
        .take(max)
        .collect()
}

fn truncate(t: &str, max: usize) -> String {
    t.chars().take(max).collect()
}

fn is_favicon(url: &str) -> bool {
    url.split(['?', '#'])
        .next()
        .unwrap_or("")
        .ends_with("/favicon.ico")
}

fn describe(item: &Value) -> String {
    format!(
        "[{}] {} \"{}\"",
        s(item, "ref"),
        s(item, "role"),
        s(item, "name")
    )
}

fn fail_text(f: Fail) -> String {
    match f {
        Fail::Dialog => "a dialog opened during setup".into(),
        Fail::Msg(m) => m,
    }
}

impl Driver {
    // ------------------------------------------------------------ protocol

    fn handle(&mut self, msg: Value) {
        if let Some(id) = msg.get("id").and_then(Value::as_u64) {
            if Some(id) == self.blocked_cmd {
                self.blocked_cmd = None;
            }
            return;
        }
        let method = s(&msg, "method").to_string();
        let session = s(&msg, "sessionId").to_string();
        let p = msg.get("params").cloned().unwrap_or(Value::Null);
        match method.as_str() {
            "Target.attachedToTarget" if session.is_empty() => {
                let new_session = s(&p, "sessionId").to_string();
                let info = p.get("targetInfo").cloned().unwrap_or(Value::Null);
                let ours = s(&info, "type") == "page"
                    && s(&info, "openerId") == self.tab.target
                    && s(&info, "targetId") != self.tab.target;
                if ours {
                    self.popups
                        .push((new_session, s(&info, "targetId").to_string()));
                } else {
                    let _ = self.browser.post_raw(
                        Some(&new_session),
                        "Runtime.runIfWaitingForDebugger",
                        json!({}),
                    );
                }
                return;
            }
            "Target.detachedFromTarget" => {
                // The tab closed itself (window.close): back to the one that opened it.
                if s(&p, "sessionId") == self.tab.session {
                    if let Some(prev) = self.opener_stack.pop() {
                        self.tab = prev;
                        self.inflight.clear();
                        self.dom_ready = true;
                    }
                }
                return;
            }
            // Every session this run opened has interception on, including a
            // new tab not yet adopted, so a paused request is always answered.
            "Fetch.requestPaused" => {
                self.guard_navigation(&session, &p);
                return;
            }
            _ => {}
        }
        if session != self.tab.session {
            return;
        }
        match method.as_str() {
            "Page.javascriptDialogOpening" => {
                let kind = s(&p, "type").to_string();
                let message = truncate(s(&p, "message"), 200);
                // An alert has one button and an unload prompt is the browser's;
                // answer those. A confirm or prompt is the visitor's decision:
                // hold it until the runner answers, unless the runner chose a
                // standing answer with `dialogs`.
                let auto = if kind == "alert" || kind == "beforeunload" {
                    Some(true)
                } else {
                    self.dialog_policy
                };
                if let Some(accept) = auto {
                    let sid = self.tab.session.clone();
                    let _ = self.browser.post_raw(
                        Some(&sid),
                        "Page.handleJavaScriptDialog",
                        json!({ "accept": accept }),
                    );
                    self.pending.dialogs.push(json!({ "type": kind, "message": message, "how": if accept { "accept" } else { "dismiss" } }));
                } else {
                    self.dialog = Some(OpenDialog { kind, message });
                }
            }
            "Runtime.consoleAPICalled" if s(&p, "type") == "error" => {
                let text: Vec<String> = p
                    .get("args")
                    .and_then(Value::as_array)
                    .into_iter()
                    .flatten()
                    .map(|arg| match arg.get("value") {
                        Some(Value::String(v)) => v.clone(),
                        Some(v) if !v.is_null() => v.to_string(),
                        _ => s(arg, "description").to_string(),
                    })
                    .collect();
                self.pending.console.push(truncate(&text.join(" "), 300));
            }
            // A failed response is already in `network`; the browser's own
            // "Failed to load resource" line would count it twice.
            "Log.entryAdded" => {
                let entry = p.get("entry").cloned().unwrap_or(Value::Null);
                if s(&entry, "level") == "error"
                    && s(&entry, "source") != "network"
                    && !is_favicon(s(&entry, "url"))
                {
                    self.pending.console.push(truncate(s(&entry, "text"), 300));
                }
            }
            "Runtime.exceptionThrown" => {
                if let Some(d) = p.get("exceptionDetails") {
                    self.pending
                        .page_errors
                        .push(truncate(&client_error_message(d), 300));
                }
            }
            "Network.requestWillBeSent" => {
                let id = s(&p, "requestId").to_string();
                let req = p.get("request").cloned().unwrap_or(Value::Null);
                self.requests.insert(
                    id.clone(),
                    (s(&req, "method").to_string(), s(&req, "url").to_string()),
                );
                if !LONG_LIVED.contains(&s(&p, "type")) {
                    self.inflight.insert(id);
                }
            }
            "Network.responseReceived" => {
                let res = p.get("response").cloned().unwrap_or(Value::Null);
                let status = res.get("status").and_then(Value::as_f64).unwrap_or(0.0) as u64;
                let url = s(&res, "url");
                if status >= 400 && !is_favicon(url) {
                    let method = self
                        .requests
                        .get(s(&p, "requestId"))
                        .map(|r| r.0.clone())
                        .unwrap_or_else(|| "GET".into());
                    self.pending
                        .network
                        .push(format!("{status} {method} {url}"));
                }
            }
            "Network.loadingFinished" => {
                self.inflight.remove(s(&p, "requestId"));
            }
            "Network.loadingFailed" => {
                let id = s(&p, "requestId");
                self.inflight.remove(id);
                let (method, url) = self.requests.get(id).cloned().unwrap_or_default();
                if !is_favicon(&url) {
                    self.pending
                        .network
                        .push(format!("FAILED {method} {url} {}", s(&p, "errorText")));
                }
            }
            "Page.frameNavigated" => {
                let frame = p.get("frame").cloned().unwrap_or(Value::Null);
                if frame.get("parentId").is_none() {
                    self.tab.main_frame = s(&frame, "id").to_string();
                }
            }
            "Page.frameStartedLoading" if s(&p, "frameId") == self.tab.main_frame => {
                self.dom_ready = false;
            }
            "Page.frameStoppedLoading" if s(&p, "frameId") == self.tab.main_frame => {
                self.dom_ready = true;
            }
            "Page.lifecycleEvent" if s(&p, "frameId") == self.tab.main_frame => {
                match s(&p, "name") {
                    // A new document: whatever the old one was waiting on is gone.
                    "init" => {
                        self.dom_ready = false;
                        self.inflight.clear();
                    }
                    "DOMContentLoaded" => self.dom_ready = true,
                    _ => {}
                }
            }
            _ => {}
        }
    }

    /// Answer a paused document request: a tab's own page may go only where
    /// the run may go (`hosts::may_visit`). Frames inside the page (payment
    /// widgets, embeds) load wherever the page points them.
    fn guard_navigation(&mut self, session: &str, p: &Value) {
        let id = s(p, "requestId");
        let url = p
            .pointer("/request/url")
            .and_then(Value::as_str)
            .unwrap_or("");
        // A tab's main frame id is its target id.
        let frame = s(p, "frameId");
        let top = frame == self.tab.target
            || self.opener_stack.iter().any(|t| t.target == frame)
            || self.popups.iter().any(|(_, t)| t == frame);
        if top && !hosts::may_visit(url, self.allowed_host.as_deref()) {
            // A navigation answered with 204 No Content leaves the current
            // page in place, which is what a dead-end link feels like.
            let _ = self.browser.post_raw(
                Some(session),
                "Fetch.fulfillRequest",
                json!({ "requestId": id, "responseCode": 204, "body": "" }),
            );
            let host = hosts::host_of(url).unwrap_or_else(|| truncate(url, 80));
            self.pending.blocked.push(host);
        } else {
            let _ = self.browser.post_raw(
                Some(session),
                "Fetch.continueRequest",
                json!({ "requestId": id }),
            );
        }
    }

    /// Read whatever arrives before `deadline`, handling each message.
    fn pump(&mut self, deadline: Instant) -> R<()> {
        loop {
            match self.browser.next_message(deadline) {
                Ok(Some(m)) => self.handle(m),
                Ok(None) => break,
                Err(e) => return Err(Fail::Msg(e.message)),
            }
        }
        self.adopt_popups()?;
        if self.dialog.is_some() {
            return Err(Fail::Dialog);
        }
        Ok(())
    }

    fn wait(&mut self, ms: u64) -> R<()> {
        self.pump(Instant::now() + Duration::from_millis(ms))
    }

    fn call_on(&mut self, session: Option<&str>, method: &str, params: Value) -> R<Value> {
        let id = self
            .browser
            .post_raw(session, method, params)
            .map_err(|e| Fail::Msg(e.message))?;
        let deadline = Instant::now() + COMMAND_TIMEOUT;
        loop {
            let msg = match self.browser.next_message(deadline) {
                Ok(Some(m)) => m,
                Ok(None) => return Err(Fail::Msg(format!("{method} timed out"))),
                Err(e) => return Err(Fail::Msg(e.message)),
            };
            if msg.get("id").and_then(Value::as_u64) == Some(id) {
                if let Some(err) = msg.get("error") {
                    return Err(Fail::Msg(
                        format!("{} {}", s(err, "message"), s(err, "data"))
                            .trim()
                            .to_string(),
                    ));
                }
                return Ok(msg.get("result").cloned().unwrap_or(Value::Null));
            }
            self.handle(msg);
            // The page is frozen behind a dialog; this command answers only
            // once it closes, so leave it pending and hand the choice back.
            if self.dialog.is_some() && method != "Page.handleJavaScriptDialog" {
                self.blocked_cmd = Some(id);
                return Err(Fail::Dialog);
            }
        }
    }

    fn call(&mut self, method: &str, params: Value) -> R<Value> {
        let sid = self.tab.session.clone();
        self.call_on(Some(&sid), method, params)
    }

    fn eval(&mut self, expression: &str) -> R<Value> {
        let res = self.call(
            "Runtime.evaluate",
            json!({ "expression": expression, "returnByValue": true, "awaitPromise": false, "userGesture": true }),
        )?;
        if let Some(d) = res.get("exceptionDetails") {
            return Err(Fail::Msg(client_error_message(d)));
        }
        Ok(res.pointer("/result/value").cloned().unwrap_or(Value::Null))
    }

    /// Call one of the helpers in `assets/page.js`.
    fn js(&mut self, call: &str) -> R<Value> {
        self.eval(&format!("(() => {{\n{PAGE_JS}\nreturn {call};\n}})()"))
    }

    /// [`Driver::js`] for a helper that reports a refusal as `{ error }`.
    fn js_checked(&mut self, call: &str) -> R<Value> {
        let v = self.js(call)?;
        if let Some(e) = v.get("error").and_then(Value::as_str) {
            return Err(Fail::Msg(e.to_string()));
        }
        Ok(v)
    }

    // ------------------------------------------------------------ setup

    pub fn launch(
        exe: &Path,
        launch_args: &[String],
        run_dir: PathBuf,
        sealed: Value,
        result_file: PathBuf,
    ) -> Result<Driver, String> {
        let mut browser = Browser::launch(exe, launch_args, false).map_err(|e| e.message)?;
        let profile = sealed.get("profile").cloned().unwrap_or(Value::Null);
        let mobile = s(&profile, "viewport") == "mobile";
        let created = sync_call(
            &mut browser,
            None,
            "Target.createTarget",
            json!({ "url": "about:blank" }),
        )?;
        let target = s(&created, "targetId").to_string();
        let attached = sync_call(
            &mut browser,
            None,
            "Target.attachToTarget",
            json!({ "targetId": target, "flatten": true }),
        )?;
        let session = s(&attached, "sessionId").to_string();
        let allowed_host = sealed
            .get("allowedHost")
            .and_then(Value::as_str)
            .map(String::from);
        let mut d = Driver {
            browser,
            tab: Tab {
                session: session.clone(),
                target,
                main_frame: String::new(),
            },
            opener_stack: Vec::new(),
            popups: Vec::new(),
            run_dir,
            result_file,
            allowed_host,
            mobile,
            keyboard: s(&profile, "input") == "keyboard",
            slow: s(&profile, "network") == "slow",
            budget: profile.get("budget").and_then(Value::as_u64).unwrap_or(30),
            device: if mobile {
                (390, 844, 3.0)
            } else {
                (1280, 800, 1.0)
            },
            sealed,
            pending: Pending::default(),
            inflight: HashSet::new(),
            requests: HashMap::new(),
            dom_ready: true,
            step: 0,
            actions: 0,
            next_ref: 1,
            goal_met_at: None,
            done: false,
            last: None,
            started: Instant::now(),
            dialog_policy: None,
            dialog: None,
            blocked_cmd: None,
            restore_script: None,
        };
        d.setup_tab(&session, false).map_err(fail_text)?;
        d.restore_storage().map_err(fail_text)?;
        // New tabs the page opens start paused, so they are configured like
        // this one before their first script runs.
        d.call_on(
            None,
            "Target.setAutoAttach",
            json!({ "autoAttach": true, "waitForDebuggerOnStart": true, "flatten": true }),
        )
        .map_err(fail_text)?;
        Ok(d)
    }

    /// Enable the domains, the navigation guard, the mutation counter, and
    /// the device on a tab. A tab the page just opened is paused before its
    /// first script and does not answer until resumed, so its setup is written
    /// without waiting (the browser applies a session's commands in order)
    /// and then resumed.
    fn setup_tab(&mut self, session: &str, paused: bool) -> R<()> {
        let (w, h, dsf) = self.device;
        let mut cmds: Vec<(&str, Value)> = vec![
            ("Page.enable", json!({})),
            ("Runtime.enable", json!({})),
            ("Network.enable", json!({})),
            ("Log.enable", json!({})),
            ("Page.setLifecycleEventsEnabled", json!({ "enabled": true })),
            (
                "Fetch.enable",
                json!({ "patterns": [{ "urlPattern": "*", "resourceType": "Document", "requestStage": "Request" }] }),
            ),
            (
                "Page.addScriptToEvaluateOnNewDocument",
                json!({ "source": format!("(() => {{\n{PAGE_JS}\nmutationCounter();\n}})()") }),
            ),
            (
                "Emulation.setDeviceMetricsOverride",
                json!({ "width": w, "height": h, "deviceScaleFactor": dsf, "mobile": self.mobile,
                        "screenWidth": w, "screenHeight": h,
                        "screenOrientation": { "angle": 0, "type": "portraitPrimary" } }),
            ),
        ];
        if self.mobile {
            cmds.push((
                "Emulation.setTouchEmulationEnabled",
                json!({ "enabled": true, "maxTouchPoints": 5 }),
            ));
            cmds.push((
                "Network.setUserAgentOverride",
                json!({ "userAgent": IPHONE_UA, "platform": "iPhone" }),
            ));
        }
        if self.slow {
            cmds.push((
                "Network.emulateNetworkConditions",
                json!({ "offline": false, "latency": 400, "downloadThroughput": 50_000, "uploadThroughput": 20_000 }),
            ));
        }
        for (method, params) in cmds {
            if paused {
                self.browser
                    .post_raw(Some(session), method, params)
                    .map_err(|e| Fail::Msg(e.message))?;
            } else {
                self.call_on(Some(session), method, params)?;
            }
        }
        if paused {
            self.browser
                .post_raw(Some(session), "Runtime.runIfWaitingForDebugger", json!({}))
                .map_err(|e| Fail::Msg(e.message))?;
        }
        let tree = self.call_on(Some(session), "Page.getFrameTree", json!({}))?;
        let main = tree
            .pointer("/frameTree/frame/id")
            .and_then(Value::as_str)
            .unwrap_or("")
            .to_string();
        if session == self.tab.session {
            self.tab.main_frame = main;
        }
        Ok(())
    }

    fn adopt_popups(&mut self) -> R<()> {
        while let Some((session, target)) = self.popups.pop() {
            let saved = self.tab.clone();
            self.tab = Tab {
                session: session.clone(),
                target,
                main_frame: String::new(),
            };
            match self.setup_tab(&session, true) {
                Ok(()) => {
                    self.opener_stack.push(saved);
                    self.inflight.clear();
                    self.dom_ready = false;
                    self.pending.tabs += 1;
                }
                Err(e) => {
                    self.tab = saved;
                    return Err(e);
                }
            }
        }
        Ok(())
    }

    /// Cookies and local storage from `--storage-state` (Playwright's file
    /// shape, so a state saved by either tool loads here).
    fn restore_storage(&mut self) -> R<()> {
        let Some(file) = self.sealed.get("storageState").and_then(Value::as_str) else {
            return Ok(());
        };
        let raw = fs::read_to_string(file)
            .map_err(|e| Fail::Msg(format!("could not read {file}: {e}")))?;
        let state: Value = serde_json::from_str(&raw)
            .map_err(|e| Fail::Msg(format!("{file} is not a storage-state file: {e}")))?;
        let cookies: Vec<Value> = state
            .get("cookies")
            .and_then(Value::as_array)
            .into_iter()
            .flatten()
            .map(|c| {
                let mut out = json!({
                    "name": s(c, "name"), "value": s(c, "value"), "domain": s(c, "domain"),
                    "path": if s(c, "path").is_empty() { "/" } else { s(c, "path") },
                    "httpOnly": c.get("httpOnly").and_then(Value::as_bool).unwrap_or(false),
                    "secure": c.get("secure").and_then(Value::as_bool).unwrap_or(false),
                });
                if let Some(e) = c
                    .get("expires")
                    .and_then(Value::as_f64)
                    .filter(|e| *e > 0.0)
                {
                    out["expires"] = json!(e);
                }
                if !s(c, "sameSite").is_empty() {
                    out["sameSite"] = json!(s(c, "sameSite"));
                }
                out
            })
            .collect();
        if !cookies.is_empty() {
            self.call("Network.setCookies", json!({ "cookies": cookies }))?;
        }
        let mut by_origin = serde_json::Map::new();
        for o in state
            .get("origins")
            .and_then(Value::as_array)
            .into_iter()
            .flatten()
        {
            let items: Vec<Value> = o
                .get("localStorage")
                .and_then(Value::as_array)
                .into_iter()
                .flatten()
                .map(|i| json!([s(i, "name"), s(i, "value")]))
                .collect();
            by_origin.insert(s(o, "origin").to_string(), Value::Array(items));
        }
        if !by_origin.is_empty() {
            // Applied to the first page only: removed again once `open` settles.
            let source = format!(
                "(() => {{ const items = ({})[location.origin]; if (items) for (const [k, v] of items) {{ try {{ localStorage.setItem(k, v); }} catch {{}} }} }})()",
                Value::Object(by_origin)
            );
            let res = self.call(
                "Page.addScriptToEvaluateOnNewDocument",
                json!({ "source": source }),
            )?;
            self.restore_script = Some(s(&res, "identifier").to_string());
        }
        Ok(())
    }
}

/// A browser-level command before a `Driver` exists.
fn sync_call(
    browser: &mut Browser,
    session: Option<&str>,
    method: &str,
    params: Value,
) -> Result<Value, String> {
    let id = browser
        .post_raw(session, method, params)
        .map_err(|e| e.message)?;
    let deadline = Instant::now() + COMMAND_TIMEOUT;
    loop {
        match browser.next_message(deadline).map_err(|e| e.message)? {
            Some(m) if m.get("id").and_then(Value::as_u64) == Some(id) => {
                if let Some(err) = m.get("error") {
                    return Err(format!("{method}: {}", s(err, "message")));
                }
                return Ok(m.get("result").cloned().unwrap_or(Value::Null));
            }
            Some(_) => {}
            None => return Err(format!("{method} timed out")),
        }
    }
}

/// The browser's product string, for `preflight`.
pub fn browser_version(browser: &mut Browser) -> Result<String, String> {
    sync_call(browser, None, "Browser.getVersion", json!({})).map(|v| s(&v, "product").to_string())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn favicon_noise_is_ignored() {
        assert!(is_favicon("http://localhost/favicon.ico"));
        assert!(is_favicon("http://localhost/favicon.ico?v=2"));
        assert!(!is_favicon("http://localhost/api/order"));
    }
}
