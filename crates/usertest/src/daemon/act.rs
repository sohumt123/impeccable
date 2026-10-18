//! Input: what a person does to the page. Pointer and keyboard input go
//! through `Input.dispatch*Event`, as real input does, so the page's own
//! handlers, focus, and default actions run; only fields with no typeable
//! text (dates, colors, ranges) and native dropdowns are set from script.

use std::time::{Duration, Instant};

use serde_json::{json, Value};

use super::{s, Driver, Fail, R};
use crate::keys::{self, KeyStroke};

pub(super) enum Act {
    None,
    Click(String),
    Tap(String),
    Fill(String, String),
    Select(String, String),
    Press(KeyStroke),
    Type(String),
    ScrollBy(i64, i64),
    ScrollTo(String),
    Back,
    Reload,
    Interrupt,
    Answer(bool, Option<String>),
}

impl Driver {
    pub(super) fn navigate(&mut self, url: &str) -> R<()> {
        let res = self.call("Page.navigate", json!({ "url": url }))?;
        let err = s(&res, "errorText");
        if !err.is_empty() && err != "net::ERR_HTTP_RESPONSE_CODE_FAILURE" {
            return Err(Fail::Msg(format!("{err} at {url}")));
        }
        self.dom_ready = false;
        Ok(())
    }

    fn mouse(&mut self, kind: &str, x: f64, y: f64) -> R<()> {
        let (buttons, count) = match kind {
            "mousePressed" => (1, 1),
            "mouseReleased" => (0, 1),
            _ => (0, 0),
        };
        let mut p =
            json!({ "type": kind, "x": x, "y": y, "buttons": buttons, "clickCount": count });
        if kind != "mouseMoved" {
            p["button"] = json!("left");
        }
        self.call("Input.dispatchMouseEvent", p).map(|_| ())
    }

    fn key(&mut self, k: &KeyStroke, down: bool) -> R<()> {
        let kind = if !down {
            "keyUp"
        } else if k.text.is_some() {
            "keyDown"
        } else {
            "rawKeyDown"
        };
        let mut p = json!({
            "type": kind, "key": k.key, "code": k.code, "modifiers": k.modifiers,
            "windowsVirtualKeyCode": k.key_code, "nativeVirtualKeyCode": k.key_code,
        });
        if down {
            if let Some(t) = &k.text {
                p["text"] = json!(t);
                p["unmodifiedText"] = json!(t);
            }
        }
        self.call("Input.dispatchKeyEvent", p).map(|_| ())
    }

    fn press(&mut self, k: &KeyStroke) -> R<()> {
        for h in &k.held {
            self.key(h, true)?;
        }
        self.key(k, true)?;
        self.key(k, false)?;
        for h in k.held.iter().rev() {
            self.key(h, false)?;
        }
        Ok(())
    }

    /// Where a pointer lands on `r`, in input coordinates.
    fn point(&mut self, r: &str) -> R<(f64, f64)> {
        let p = self.js_checked(&format!("utPoint({})", json!(r)))?;
        let f = |k: &str| p.get(k).and_then(Value::as_f64).unwrap_or(0.0);
        Ok((f("x"), f("y")))
    }

    pub(super) fn perform(&mut self, act: Act) -> R<()> {
        match act {
            Act::None => Ok(()),
            Act::Click(r) => {
                let (x, y) = self.point(&r)?;
                self.mouse("mouseMoved", x, y)?;
                self.mouse("mousePressed", x, y)?;
                self.mouse("mouseReleased", x, y)
            }
            Act::Tap(r) => {
                let (x, y) = self.point(&r)?;
                self.call(
                    "Input.dispatchTouchEvent",
                    json!({ "type": "touchStart", "touchPoints": [{ "x": x, "y": y }] }),
                )?;
                self.call(
                    "Input.dispatchTouchEvent",
                    json!({ "type": "touchEnd", "touchPoints": [] }),
                )
                .map(|_| ())
            }
            Act::Fill(r, text) => {
                let prep =
                    self.js_checked(&format!("utFillPrep({}, {})", json!(r), json!(text)))?;
                if prep.get("direct").and_then(Value::as_bool) == Some(true) {
                    return Ok(());
                }
                if text.is_empty() {
                    return self.press(&keys::parse("Delete").map_err(Fail::Msg)?);
                }
                self.call("Input.insertText", json!({ "text": text }))
                    .map(|_| ())
            }
            Act::Select(r, label) => self
                .js_checked(&format!("utSelect({}, {})", json!(r), json!(label)))
                .map(|_| ()),
            Act::Press(k) => self.press(&k),
            // A dialog that opens partway through stops the typing there, as
            // it would for a person.
            Act::Type(text) => {
                for c in text.chars() {
                    let k = keys::char_key(c);
                    if k.key_code == 0 {
                        self.call("Input.insertText", json!({ "text": c.to_string() }))?;
                    } else {
                        self.press(&k)?;
                    }
                }
                Ok(())
            }
            // A swipe on a phone, the wheel on a desktop: either scrolls what
            // is under the finger or cursor, and a swipe also pans a page the
            // phone shows only part of.
            Act::ScrollBy(dx, dy) => {
                let (cx, cy) = (self.device.0 as f64 / 2.0, self.device.1 as f64 / 2.0);
                let (method, params) = if self.mobile {
                    (
                        "Input.synthesizeScrollGesture",
                        json!({ "x": cx, "y": cy, "xDistance": -dx, "yDistance": -dy, "gestureSourceType": "touch", "speed": 2400, "preventFling": true }),
                    )
                } else {
                    (
                        "Input.dispatchMouseEvent",
                        json!({ "type": "mouseWheel", "x": cx, "y": cy, "deltaX": dx, "deltaY": dy }),
                    )
                };
                self.call(method, params).map(|_| ())
            }
            Act::ScrollTo(r) => self
                .js_checked(&format!("utScrollTo({})", json!(r)))
                .map(|_| ()),
            Act::Back => {
                let h = self.call("Page.getNavigationHistory", json!({}))?;
                let i = h.get("currentIndex").and_then(Value::as_u64).unwrap_or(0);
                if i == 0 {
                    return Ok(());
                }
                let id = h
                    .pointer(&format!("/entries/{}/id", i - 1))
                    .cloned()
                    .unwrap_or(Value::Null);
                self.call("Page.navigateToHistoryEntry", json!({ "entryId": id }))?;
                self.dom_ready = false;
                Ok(())
            }
            Act::Reload => {
                self.call("Page.reload", json!({}))?;
                self.dom_ready = false;
                Ok(())
            }
            // Leave for another app and come back: the tab is discarded and restored.
            Act::Interrupt => {
                let url = self.current_url();
                self.navigate("about:blank")?;
                self.settle(Duration::from_secs(2))?;
                self.wait(500)?;
                self.navigate(&url)
            }
            Act::Answer(accept, text) => {
                let mut p = json!({ "accept": accept });
                if let Some(t) = text {
                    p["promptText"] = json!(t);
                }
                self.dialog = None;
                self.call("Page.handleJavaScriptDialog", p)?;
                // The action the dialog interrupted finishes now.
                let deadline = Instant::now() + Duration::from_secs(8);
                while self.blocked_cmd.is_some() && Instant::now() < deadline {
                    self.wait(50)?;
                }
                self.blocked_cmd = None;
                Ok(())
            }
        }
    }
}
