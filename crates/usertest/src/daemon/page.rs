//! Reading the page: waiting for it to settle, the element snapshot, the
//! screenshot, and the sealed success check.

use std::fs;
use std::io::Write;
use std::path::Path;
use std::time::{Duration, Instant};

use serde_json::{json, Value};

use super::{s, Driver, Fail, R};

const MAX_ELEMENTS: u32 = 140;

impl Driver {
    /// Wait for the main frame's DOMContentLoaded, then until no request the
    /// page is waiting on has been in flight for 400ms, within the network's
    /// patience. Returns how long that took.
    pub(super) fn settle(&mut self, dom_timeout: Duration) -> R<u64> {
        let start = Instant::now();
        self.wait(150)?;
        if std::mem::take(&mut self.check_ready) {
            let state = self.eval("location.href === 'about:blank' ? '' : document.readyState")?;
            if matches!(state.as_str(), Some("interactive" | "complete")) {
                self.dom_ready = true;
            }
        }
        let dom_deadline = Instant::now() + dom_timeout;
        while !self.dom_ready && Instant::now() < dom_deadline {
            self.wait(50)?;
        }
        let deadline = Instant::now() + Duration::from_millis(if self.slow { 15000 } else { 6000 });
        let mut quiet_since: Option<Instant> = None;
        while Instant::now() < deadline {
            if !self.inflight.is_empty() {
                quiet_since = None;
            } else {
                let since = *quiet_since.get_or_insert_with(Instant::now);
                if since.elapsed() >= Duration::from_millis(400) {
                    break;
                }
            }
            self.wait(100)?;
        }
        self.wait(150)?;
        Ok(start.elapsed().as_millis() as u64)
    }

    pub(super) fn dom_timeout(&self) -> Duration {
        Duration::from_secs(if self.slow { 30 } else { 8 })
    }

    pub(super) fn snapshot(&mut self) -> R<Value> {
        let opts = json!({
            "maxElements": MAX_ELEMENTS, "mobile": self.mobile, "keyboard": self.keyboard,
            "nextRef": self.next_ref, "deviceWidth": self.device.0,
        });
        let snap = self.js(&format!("pageSnapshot({opts})"))?;
        if snap.get("items").is_none() {
            return Err(Fail::Msg("the page has no document to read yet".into()));
        }
        if let Some(n) = snap.get("nextRef").and_then(Value::as_u64) {
            self.next_ref = n;
        }
        Ok(snap)
    }

    /// A snapshot, retried once after settling (the page may be mid-navigation).
    pub(super) fn snapshot_settled(&mut self) -> R<Value> {
        match self.snapshot() {
            Err(Fail::Msg(_)) => {
                self.settle(self.dom_timeout())?;
                self.snapshot().map_err(|e| match e {
                    Fail::Msg(m) => Fail::Msg(format!("could not read the page: {m}")),
                    other => other,
                })
            }
            other => other,
        }
    }

    pub(super) fn visible_text(&mut self) -> R<String> {
        match self.eval("document.body ? document.body.innerText : ''") {
            Ok(v) => Ok(v.as_str().unwrap_or("").to_string()),
            Err(Fail::Dialog) => Err(Fail::Dialog),
            Err(Fail::Msg(_)) => Ok(String::new()),
        }
    }

    fn mutations(&mut self) -> R<f64> {
        match self.eval("window.__utMut || 0") {
            Ok(v) => Ok(v.as_f64().unwrap_or(0.0)),
            Err(Fail::Dialog) => Err(Fail::Dialog),
            Err(Fail::Msg(_)) => Ok(0.0),
        }
    }

    /// The mutation count now, and mutations per ms while nobody acts:
    /// ticking clocks and carousels are not effects.
    pub(super) fn noise_rate(&mut self) -> R<(f64, f64)> {
        let a = self.mutations()?;
        self.wait(250)?;
        let b = self.mutations()?;
        Ok((b, (b - a).max(0.0) / 250.0))
    }

    /// The viewport in CSS pixels: what the visitor sees, at a size a model
    /// can read cheaply (a 3x phone capture is 1170px wide).
    pub(super) fn screenshot(&mut self, file: &Path) {
        let clip = match self.call("Page.getLayoutMetrics", json!({})) {
            Ok(m) => {
                let vv = m.get("cssVisualViewport").cloned().unwrap_or(Value::Null);
                let f = |k: &str| vv.get(k).and_then(Value::as_f64).unwrap_or(0.0);
                json!({ "x": f("pageX"), "y": f("pageY"), "width": f("clientWidth"), "height": f("clientHeight"), "scale": 1.0 / self.device.2 })
            }
            Err(_) => return,
        };
        if let Ok(res) = self.call(
            "Page.captureScreenshot",
            json!({ "format": "png", "clip": clip, "captureBeyondViewport": false }),
        ) {
            use base64::Engine as _;
            if let Ok(bytes) = base64::engine::general_purpose::STANDARD.decode(s(&res, "data")) {
                let _ = fs::write(file, bytes);
            }
        }
    }

    pub(super) fn current_url(&self) -> String {
        self.last
            .as_ref()
            .map(|l| s(l, "url").to_string())
            .unwrap_or_default()
    }

    pub(super) fn has_success_check(&self) -> bool {
        ["successText", "successUrl"]
            .iter()
            .any(|k| self.sealed.get(*k).map(|v| !v.is_null()).unwrap_or(false))
    }

    pub(super) fn check_goal(&mut self, snap: &Value) {
        if self.goal_met_at.is_some() || !self.has_success_check() {
            return;
        }
        let text_ok = match self.sealed.get("successText").and_then(Value::as_str) {
            Some(t) => s(snap, "bodyText")
                .to_lowercase()
                .contains(&t.to_lowercase()),
            None => true,
        };
        let url_ok = match self.sealed.get("successUrl").and_then(Value::as_str) {
            Some(u) => url_matches(s(snap, "url"), u),
            None => true,
        };
        if text_ok && url_ok {
            self.goal_met_at = Some(self.step);
        }
    }

    pub(super) fn append(&self, entry: &Value) {
        if let Ok(mut f) = fs::OpenOptions::new()
            .create(true)
            .append(true)
            .open(self.run_dir.join("trace.jsonl"))
        {
            let _ = writeln!(f, "{entry}");
        }
    }
}

/// `--success-url`: a check starting with `#` names the hash, anything else
/// the path. It matches that part exactly or as a whole leading segment, so
/// `/order` matches `/order` and `/order/42`, never `/orders` or `/re/order`.
fn url_matches(page: &str, check: &str) -> bool {
    let Ok(u) = url::Url::parse(page) else {
        return false;
    };
    // The URL keeps the path and hash percent-encoded; the check is written
    // the way a person reads it (`/café`), so compare decoded forms.
    let decoded = |t: &str| {
        percent_encoding::percent_decode_str(t)
            .decode_utf8_lossy()
            .into_owned()
    };
    let part = if check.starts_with('#') {
        u.fragment()
            .map(|f| format!("#{}", decoded(f)))
            .unwrap_or_default()
    } else {
        decoded(u.path())
    };
    let check = &decoded(check);
    let check = check.trim_end_matches('/');
    if check.is_empty() || check == "#" {
        return part.is_empty() || part == "/" || part == "#" || part == "#/";
    }
    part == check
        || part
            .strip_prefix(check)
            .map(|rest| rest.starts_with('/'))
            .unwrap_or(false)
}

#[cfg(test)]
mod tests {
    use super::url_matches;

    #[test]
    fn success_urls_match_whole_segments() {
        let page = "http://127.0.0.1:4790/order/42?ref=x#/done";
        assert!(url_matches(page, "/order"));
        assert!(url_matches(page, "/order/42"));
        assert!(url_matches(page, "#/done"));
        assert!(!url_matches(page, "/ord"));
        assert!(!url_matches("http://h/orders", "/order"));
        assert!(!url_matches("http://h/not-done", "/done"));
        assert!(!url_matches("http://h/#/done-later", "#/done"));
        assert!(url_matches("http://h/#/done/ok", "#/done"));
        assert!(url_matches("http://h/", "/"));
        assert!(!url_matches("not a url", "/done"));
        assert!(url_matches("http://h/caf%C3%A9/menu", "/café"));
        assert!(url_matches("http://h/caf%C3%A9", "/caf%C3%A9"));
    }
}
