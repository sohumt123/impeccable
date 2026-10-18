//! The verbs: what the runner may do to the page, what only the parent may
//! do to the run, the guards in front of both, and the end of a run.

use std::collections::HashMap;
use std::path::Path;

use serde_json::{json, Value};

use super::act::Act;
use super::step::Extra;
use super::{describe, fail_text, first_line, s, strs, truncate, Driver, Role};
use crate::{keys, paths};

/// Verbs the runner's client (`usertest act`) may send.
pub const RUNNER_VERBS: [&str; 14] = [
    "observe",
    "click",
    "fill",
    "select",
    "press",
    "type",
    "scroll",
    "back",
    "reload",
    "interrupt",
    "answer",
    "dialogs",
    "note",
    "done",
];
const POINTER_VERBS: [&str; 3] = ["click", "fill", "select"];
const OUTCOMES: [&str; 4] = ["completed", "abandoned", "blocked", "unsure"];

/// Stand-ins for awkward input, so a runner can type them in one shell argument.
fn adversarial(text: &str) -> String {
    match text {
        "@long" => "A".repeat(260),
        "@emoji" => "Test 🧪 émoji 名前".to_string(),
        "@rtl" => "مرحبا بالعالم".to_string(),
        "@html" => "<b>x</b>\"'; DROP TABLE".to_string(),
        "@spaces" => "   ".to_string(),
        other => other.to_string(),
    }
}

fn is_ref(r: &str) -> bool {
    r.len() > 1 && r.starts_with('e') && r[1..].bytes().all(|c| c.is_ascii_digit())
}

/// A request from a CLI client.
pub(super) struct Request {
    pub role: Role,
    pub verb: String,
    pub positional: Vec<String>,
    pub flags: HashMap<String, String>,
}

impl Request {
    pub fn parse(body: &str) -> Option<Request> {
        let v: Value = serde_json::from_str(body).ok()?;
        let role = match s(&v, "role") {
            "parent" => Role::Parent,
            "runner" => Role::Runner,
            _ => return None,
        };
        let flags = v
            .get("flags")
            .and_then(Value::as_object)
            .map(|o| {
                o.iter()
                    .map(|(k, v)| (k.clone(), v.as_str().unwrap_or("").to_string()))
                    .collect()
            })
            .unwrap_or_default();
        Some(Request {
            role,
            verb: s(&v, "verb").to_string(),
            positional: strs(&v, "positional").map(String::from).collect(),
            flags,
        })
    }
}

/// What the serve loop should do after answering.
pub(super) enum Then {
    Continue,
    Stop,
}

impl Driver {
    fn locate(&self, r: &str) -> Result<Value, String> {
        if !is_ref(r) {
            return Err(format!("expected an element ref like e12, got \"{r}\""));
        }
        self.last
            .as_ref()
            .and_then(|l| l.get("items"))
            .and_then(Value::as_array)
            .and_then(|items| items.iter().find(|i| s(i, "ref") == r).cloned())
            .ok_or_else(|| {
                format!("no element {r} on the current page; use a ref from the latest observation")
            })
    }

    fn pointer_warnings(&self, item: &Value) -> Vec<String> {
        let desc = describe(item);
        let mut w = Vec::new();
        if self.mobile {
            if let Some(small) = strs(item, "flags").find(|f| f.starts_with("small target")) {
                w.push(format!("tapped a small target: {desc} {small}"));
            }
            if item.get("action").and_then(Value::as_bool) == Some(true)
                && item.get("inThumbZone").and_then(Value::as_bool) == Some(false)
            {
                w.push(format!(
                    "action sits in the top of the screen, outside the thumb zone: {desc}"
                ));
            }
        }
        if strs(item, "flags").any(|f| f == "unlabeled") {
            w.push(format!("acted on an unlabeled control: {desc}"));
        }
        w
    }

    /// The target of a pointer verb: it must be in the latest observation
    /// and on the screen, since a person cannot tap, type into, or pick from
    /// what they cannot see. Refused before the step, so it costs no budget.
    fn pointer_target(&mut self, r: &str, warn: bool) -> Result<Extra, String> {
        let item = self.locate(r)?;
        let check = format!(
            "(() => {{ const el = utFind({0}); return el ? utOffScreen(el, {0}) : null; }})()",
            json!(r)
        );
        if let Ok(v) = self.js(&check) {
            if let Some(e) = v.get("error").and_then(Value::as_str) {
                return Err(e.to_string());
            }
        }
        Ok(Extra {
            target: Some(describe(&item)),
            role: Some(s(&item, "role").to_string()),
            ref_: Some(r.to_string()),
            warnings: if warn {
                self.pointer_warnings(&item)
            } else {
                Vec::new()
            },
            skip_noise: false,
        })
    }

    /// Load the start URL: the first observation, or why the page did not load.
    pub fn open(&mut self) -> Result<String, String> {
        let url = s(&self.sealed["profile"], "url").to_string();
        let loaded = self
            .navigate(&url)
            .map_err(fail_text)
            .and_then(|()| self.record("open", vec![url.clone()], Extra::default(), Act::None));
        // Saved local storage applies to the first page only.
        if let Some(id) = self.restore_script.take() {
            let _ = self.call(
                "Page.removeScriptToEvaluateOnNewDocument",
                json!({ "identifier": id }),
            );
        }
        loaded
    }

    fn runner_verb(
        &mut self,
        verb: &str,
        pos: &[String],
        flags: &HashMap<String, String>,
    ) -> Result<String, String> {
        let rest = pos.join(" ");
        let first = pos.first().cloned().unwrap_or_default();
        let tail = pos.get(1..).map(|t| t.join(" ")).unwrap_or_default();
        match verb {
            "observe" => self.record("observe", vec![], Extra::default(), Act::None),
            "click" => {
                let extra = self.pointer_target(&first, true)?;
                let (name, act) = if self.mobile {
                    ("tap", Act::Tap(first.clone()))
                } else {
                    ("click", Act::Click(first.clone()))
                };
                self.record(name, vec![first], extra, act)
            }
            "fill" => {
                let extra = self.pointer_target(&first, true)?;
                let text = adversarial(&tail);
                let shown = truncate(&text, 80);
                self.record(
                    "fill",
                    vec![first.clone(), shown],
                    extra,
                    Act::Fill(first, text),
                )
            }
            "select" => {
                let extra = self.pointer_target(&first, false)?;
                self.record(
                    "select",
                    vec![first.clone(), tail.clone()],
                    extra,
                    Act::Select(first, tail),
                )
            }
            "press" => {
                let k = keys::parse(&first)?;
                self.record("press", vec![first], Extra::default(), Act::Press(k))
            }
            "type" => {
                let text = adversarial(&rest);
                let shown = truncate(&text, 80);
                self.record("type", vec![shown], Extra::default(), Act::Type(text))
            }
            "scroll" if is_ref(&first) => {
                let item = self.locate(&first)?;
                let extra = Extra {
                    target: Some(describe(&item)),
                    ..Extra::default()
                };
                self.record("scroll", vec![first.clone()], extra, Act::ScrollTo(first))
            }
            "scroll" => {
                let dir = if first.is_empty() {
                    "down"
                } else {
                    first.as_str()
                };
                let (w, h) = (self.device.0 as f64, self.device.1 as f64);
                let (dx, dy) = match dir {
                    "up" => (0.0, -0.8 * h),
                    "down" => (0.0, 0.8 * h),
                    "left" => (-0.8 * w, 0.0),
                    "right" => (0.8 * w, 0.0),
                    other => {
                        return Err(format!(
                            "scroll needs down, up, left, right, or a ref; got \"{other}\""
                        ))
                    }
                };
                let act = Act::ScrollBy(dx.round() as i64, dy.round() as i64);
                self.record("scroll", vec![dir.to_string()], Extra::default(), act)
            }
            "back" => self.record("back", vec![], Extra::default(), Act::Back),
            "reload" => self.record("reload", vec![], Extra::default(), Act::Reload),
            "interrupt" => {
                let extra = Extra {
                    warnings: vec!["simulated leaving mid-flow: page was unloaded and reopened at the same URL".into()],
                    ..Extra::default()
                };
                self.record("interrupt", vec![], extra, Act::Interrupt)
            }
            "answer" => {
                let Some(d) = &self.dialog else {
                    return Err("no dialog is open".into());
                };
                if first != "ok" && first != "cancel" {
                    return Err("answer needs ok or cancel".into());
                }
                let accept = first == "ok";
                self.pending.dialogs.push(json!({ "type": d.kind, "message": d.message, "how": if accept { "accept" } else { "dismiss" } }));
                let text = (accept && !tail.is_empty()).then_some(tail);
                let extra = Extra {
                    skip_noise: true,
                    ..Extra::default()
                };
                self.record("answer", vec![first], extra, Act::Answer(accept, text))
            }
            "dialogs" => match first.as_str() {
                "ask" => {
                    self.dialog_policy = None;
                    Ok("you will be asked about each confirm or prompt dialog".into())
                }
                "accept" | "dismiss" => {
                    let accept = first == "accept";
                    self.dialog_policy = Some(accept);
                    Ok(format!(
                        "confirm and prompt dialogs will now be {} without asking",
                        if accept {
                            "accepted (OK)"
                        } else {
                            "dismissed (Cancel)"
                        }
                    ))
                }
                _ => Err("dialogs needs accept, dismiss, or ask".into()),
            },
            "note" => {
                let kind = flags
                    .get("kind")
                    .cloned()
                    .unwrap_or_else(|| "friction".into());
                self.append(&json!({
                    "step": self.step, "action": "note", "kind": kind, "text": rest,
                    "url": self.current_url(), "screenshot": format!("step-{:02}.png", self.step),
                }));
                Ok(format!("noted at step {}", self.step))
            }
            "done" => {
                // `done completed <summary>` reads the same as `--outcome completed`:
                // a runner that forgets the flag still records what it believed.
                let (outcome, summary) = match flags.get("outcome") {
                    Some(o) => (o.clone(), rest),
                    None if OUTCOMES.contains(&first.as_str()) => (first, tail),
                    None => (String::new(), rest),
                };
                if !OUTCOMES.contains(&outcome.as_str()) {
                    return Err("done needs --outcome completed|abandoned|blocked|unsure".into());
                }
                // A confirmation that renders after the last settle still counts.
                if self.dialog.is_none() {
                    let _ = self.settle(self.dom_timeout());
                    if let Ok(snap) = self.snapshot() {
                        self.check_goal(&snap);
                    }
                }
                self.finish(&outcome, &summary);
                Ok(format!("recorded: claimed {outcome}"))
            }
            other => Err(format!("unknown verb \"{other}\"")),
        }
    }

    /// `save-state <file>`: cookies plus the current origin's local storage,
    /// in Playwright's storage-state shape, for signed-in goals.
    fn save_state(
        &mut self,
        file: &str,
        flags: &HashMap<String, String>,
    ) -> Result<String, String> {
        let home = flags.get("__home").map(String::as_str).unwrap_or_default();
        let cwd = flags.get("__cwd").map(String::as_str).unwrap_or_default();
        let auth = paths::auth_dir(Path::new(home));
        let session = self.run_dir.parent().unwrap_or(Path::new("/"));
        let target = paths::absolute(Path::new(cwd), Path::new(file));
        if file.is_empty() || !paths::state_file_allowed(&target, session, &auth) {
            return Err(format!(
                "save-state writes a .json file directly in the session directory, or under {}",
                auth.display()
            ));
        }
        let cookies: Vec<Value> = self
            .call("Network.getAllCookies", json!({}))
            .map_err(fail_text)?
            .get("cookies")
            .and_then(Value::as_array)
            .into_iter()
            .flatten()
            .map(|c| {
                let session_cookie = c.get("session").and_then(Value::as_bool) == Some(true);
                json!({
                    "name": s(c, "name"), "value": s(c, "value"), "domain": s(c, "domain"), "path": s(c, "path"),
                    "expires": if session_cookie { json!(-1) } else { c.get("expires").cloned().unwrap_or(json!(-1)) },
                    "httpOnly": c.get("httpOnly").cloned().unwrap_or(json!(false)),
                    "secure": c.get("secure").cloned().unwrap_or(json!(false)),
                    "sameSite": if s(c, "sameSite").is_empty() { "Lax" } else { s(c, "sameSite") },
                })
            })
            .collect();
        let local = self
            .eval("({ origin: location.origin, items: Object.entries(localStorage) })")
            .map_err(fail_text)?;
        let items: Vec<Value> = local
            .get("items")
            .and_then(Value::as_array)
            .into_iter()
            .flatten()
            .map(|p| json!({ "name": p.get(0), "value": p.get(1) }))
            .collect();
        let origins = if items.is_empty() {
            json!([])
        } else {
            json!([{ "origin": s(&local, "origin"), "localStorage": items }])
        };
        let state = json!({ "cookies": cookies, "origins": origins });
        if let Some(parent) = target.parent() {
            std::fs::create_dir_all(parent).map_err(|e| e.to_string())?;
        }
        paths::write_private(
            &target,
            &serde_json::to_string_pretty(&state).unwrap_or_default(),
        )
        .map_err(|e| e.to_string())?;
        Ok(format!("saved cookies and storage to {}", target.display()))
    }

    /// Record the runner's claim and the sealed verdict. The run directory
    /// gets the claim only; the verdict goes beside the sealed profile.
    fn finish(&mut self, claimed: &str, summary: &str) {
        if self.done {
            return;
        }
        self.done = true;
        let verdict = json!({
            "claimed": claimed, "summary": summary,
            "verified": if self.has_success_check() { json!(self.goal_met_at.is_some()) } else { Value::Null },
            "goalMetAtStep": self.goal_met_at, "steps": self.step, "actions": self.actions,
            "seconds": self.started.elapsed().as_secs(),
        });
        let claim = json!({ "claimed": claimed, "summary": summary, "steps": self.step, "actions": self.actions });
        let pretty = |v: &Value| serde_json::to_string_pretty(v).unwrap_or_default();
        let _ = paths::write_private(&self.result_file, &pretty(&verdict));
        let _ = paths::write_atomic(&self.run_dir.join("result.json"), &pretty(&claim));
    }

    /// Answer one request: refuse what the sender or the run's state does not
    /// allow, run the verb, and log every refusal before the run ends.
    pub(super) fn dispatch(&mut self, req: &Request) -> (u16, String, Then) {
        self.verb_deadline = Some(std::time::Instant::now() + super::VERB_TIMEOUT);
        let out = self.dispatch_now(req);
        self.verb_deadline = None;
        out
    }

    fn dispatch_now(&mut self, req: &Request) -> (u16, String, Then) {
        let verb = req.verb.as_str();
        match (req.role, verb) {
            (_, "ping") => return (200, "pong".into(), Then::Continue),
            (Role::Parent, "stop") => return (200, "stopped".into(), Then::Stop),
            (Role::Parent, "save-state") => {
                let file = req.positional.first().map(String::as_str).unwrap_or("");
                return match self.save_state(file, &req.flags) {
                    Ok(out) => (200, out, Then::Continue),
                    Err(e) => (
                        400,
                        format!("ERROR: {}", first_line(&e, 400)),
                        Then::Continue,
                    ),
                };
            }
            _ => {}
        }
        let guard = if req.role != Role::Runner || !RUNNER_VERBS.contains(&verb) {
            Err(format!("unknown verb \"{verb}\""))
        } else if self.done && verb != "note" {
            Err("run already finished with done".to_string())
        } else if let (Some(d), false) = (&self.dialog, ["answer", "note", "done"].contains(&verb))
        {
            Err(format!(
                "a {} dialog is open: \"{}\". Use answer ok or answer cancel first",
                d.kind, d.message
            ))
        } else if self.keyboard && POINTER_VERBS.contains(&verb) {
            Err(format!(
                "KEYBOARD_ONLY: this persona cannot {verb} with a pointer. Use press (Tab, Shift+Tab, Enter, Space, arrows) and type."
            ))
        } else {
            Ok(())
        };
        match guard.and_then(|()| self.runner_verb(verb, &req.positional, &req.flags)) {
            Ok(out) => (200, out, Then::Continue),
            Err(e) => {
                let reason = first_line(&e, 400);
                // After `done` the run is over; later calls are not evidence.
                if !self.done {
                    self.append(&json!({ "step": self.step, "action": "refused", "verb": verb, "reason": truncate(&reason, 240) }));
                }
                (400, format!("ERROR: {reason}"), Then::Continue)
            }
        }
    }

    /// End a run that never began (its start URL did not load): no verdict
    /// is written, since there is no run to judge.
    pub fn discard(mut self) {
        self.done = true;
        self.shutdown("the start URL did not load");
    }

    /// End the run: a run that never called `done` is recorded as claiming
    /// nothing, then the browser and its profile go.
    pub fn shutdown(mut self, reason: &str) {
        if !self.done {
            self.finish("none", &format!("run ended without done ({reason})"));
        }
        let _ = std::fs::remove_file(self.run_dir.join("driver.json"));
        self.browser.close();
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn refs_are_e_and_digits() {
        assert!(is_ref("e1") && is_ref("e120"));
        assert!(!is_ref("e") && !is_ref("12") && !is_ref("e1x") && !is_ref("é1"));
    }

    #[test]
    fn requests_name_their_sender() {
        let r = Request::parse(
            r#"{"role":"runner","verb":"click","positional":["e3"],"flags":{"run":"x"}}"#,
        )
        .unwrap();
        assert!(r.role == Role::Runner && r.verb == "click" && r.positional == ["e3"]);
        assert!(Request::parse(r#"{"verb":"stop"}"#).is_none());
        assert!(Request::parse("not json").is_none());
    }
}
