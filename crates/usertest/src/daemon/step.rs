//! One recorded step: act, wait for the page, read it, decide what the
//! action did, and append the ground truth to `trace.jsonl`.

use std::collections::HashSet;
use std::fs;
use std::time::{Duration, Instant};

use serde_json::{json, Value};

use super::act::Act;
use super::{first_line, s, strs, Driver, Fail, R};

/// Actions that spend the persona's budget.
const COUNTED: [&str; 10] = [
    "click",
    "tap",
    "fill",
    "select",
    "press",
    "type",
    "scroll",
    "back",
    "reload",
    "interrupt",
];

/// Roles a person activates expecting something to happen.
const ACTIONABLE: [&str; 10] = [
    "button",
    "link",
    "clickable",
    "checkbox",
    "radio",
    "combobox",
    "menuitem",
    "tab",
    "switch",
    "option",
];

/// What a verb knows about its target before acting.
#[derive(Default)]
pub(super) struct Extra {
    pub target: Option<String>,
    pub role: Option<String>,
    pub ref_: Option<String>,
    pub warnings: Vec<String>,
    /// Skip the idle mutation sample (the page is frozen behind a dialog).
    pub skip_noise: bool,
}

/// The page after an action settled.
struct After {
    snap: Value,
    /// Visible text right after the action, before the page settled.
    early: String,
    waited_ms: u64,
}

impl Driver {
    pub(super) fn record(
        &mut self,
        action: &str,
        args: Vec<String>,
        extra: Extra,
        act: Act,
    ) -> Result<String, String> {
        let counted = COUNTED.contains(&action);
        if counted {
            if self.actions >= self.budget {
                return Err("BUDGET_EXHAUSTED: no actions left. Call done.".into());
            }
            self.actions += 1;
        }
        let before = self.last.clone();
        let noise = match self.baseline(before.as_ref(), extra.skip_noise) {
            Ok(n) => n,
            // The page opened a dialog on its own before the action ran:
            // nothing was done, so nothing is spent.
            Err(_) => {
                if counted {
                    self.actions -= 1;
                }
                return Ok(self.dialog_step("observe", &[], &Extra::default(), Some(action)));
            }
        };
        let t0 = Instant::now();
        let error = match self.perform(act) {
            Ok(()) => None,
            Err(Fail::Dialog) => return Ok(self.dialog_step(action, &args, &extra, None)),
            Err(Fail::Msg(m)) => Some(first_line(&m, 240)),
        };
        let after = match self.observe_after(action) {
            Ok(a) => a,
            Err(Fail::Dialog) => return Ok(self.dialog_step(action, &args, &extra, None)),
            // The action happened; the page just never came back to be read.
            Err(Fail::Msg(m)) => return Ok(self.stalled_step(action, &args, &extra, &m)),
        };
        self.step += 1;
        let shot = self.run_dir.join(format!("step-{:02}.png", self.step));
        self.screenshot(&shot);
        let effect = classify_effect(
            before.as_ref(),
            &after.snap,
            noise,
            t0.elapsed(),
            extra.ref_.as_deref(),
        );
        self.check_goal(&after.snap);
        let before_focus = before
            .as_ref()
            .and_then(|b| b.get("focused"))
            .filter(|f| !f.is_null())
            .cloned();
        // A link the run would not follow did nothing because of the driver,
        // not the product.
        let blocked = !self.pending.blocked.is_empty();
        let dead = effect == "none" && error.is_none() && !blocked && {
            let key = args.first().map(String::as_str);
            match action {
                "click" | "tap" => is_actionable(extra.role.as_deref().unwrap_or("")),
                "press" if matches!(key, Some("Enter" | "Space")) => {
                    is_actionable(before_focus.as_ref().map(|f| s(f, "role")).unwrap_or(""))
                }
                _ => false,
            }
        };
        // A key press acts on whatever had focus.
        let target = extra.target.clone().or_else(|| {
            (action == "press")
                .then_some(before_focus.as_ref())
                .flatten()
                .map(|f| format!("[{}] {} \"{}\"", s(f, "ref"), s(f, "role"), s(f, "name")))
        });
        let snap = after.snap;
        let tabs: Vec<&str> = (0..std::mem::take(&mut self.pending.tabs))
            .map(|_| s(&snap, "url"))
            .collect();
        let entry = json!({
            "step": self.step, "action": action, "args": args, "target": target,
            "targetRole": extra.role, "effect": effect, "dead": dead, "error": error,
            "url": s(&snap, "url"), "title": s(&snap, "title"), "ms": t0.elapsed().as_millis() as u64,
            "console": std::mem::take(&mut self.pending.console),
            "pageErrors": std::mem::take(&mut self.pending.page_errors),
            "network": std::mem::take(&mut self.pending.network),
            "dialogs": std::mem::take(&mut self.pending.dialogs),
            "blocked": std::mem::take(&mut self.pending.blocked),
            "tabs": tabs,
            "transient": transient_lines(&after.early, &snap, before.as_ref(), after.waited_ms),
            "waitedMs": after.waited_ms, "warnings": extra.warnings,
            "focused": snap.get("focused").cloned().unwrap_or(Value::Null),
            "horizontalOverflow": snap.get("horizontalOverflow").cloned().unwrap_or(json!(false)),
            "goalMet": self.goal_met_at.is_some(),
            "screenshot": format!("step-{:02}.png", self.step),
            "frames": snap.get("frames").cloned().unwrap_or(json!([])),
            "skipped": snap.get("skipped").cloned().unwrap_or(json!(0)),
            "contentWidth": snap.get("contentWidth").cloned().unwrap_or(Value::Null),
            "unlabeled": flagged(&snap, "unlabeled", false),
            "pointerOnly": flagged(&snap, "not keyboard-reachable", true),
            "placeholderOnly": flagged(&snap, "placeholder-only label", true),
        });
        self.append(&entry);
        let out = self.render(&entry, &snap, &shot, action == "open");
        self.last = Some(snap);
        Ok(out)
    }

    /// The mutation count to measure the action against, and the page's
    /// idle mutation rate.
    fn baseline(&mut self, before: Option<&Value>, skip_noise: bool) -> R<(f64, f64)> {
        let Some(b) = before else {
            return Ok((0.0, 0.0));
        };
        if skip_noise {
            let count = b.get("mutations").and_then(Value::as_f64).unwrap_or(0.0);
            return Ok((count, 0.0));
        }
        match self.noise_rate() {
            Err(Fail::Msg(_)) => Ok((0.0, 0.0)),
            other => other,
        }
    }

    fn observe_after(&mut self, action: &str) -> R<After> {
        // What a person would have seen while the page was still loading.
        let early = if action == "open" {
            String::new()
        } else {
            self.visible_text()?
        };
        let dom_timeout = if action == "open" {
            Duration::from_secs(if self.slow { 60 } else { 15 })
        } else {
            self.dom_timeout()
        };
        let waited_ms = self.settle(dom_timeout)?;
        let snap = self.snapshot_settled()?;
        Ok(After {
            snap,
            early,
            waited_ms,
        })
    }

    /// The page stopped answering after the action: record the step with what
    /// went wrong, so the trace shows the hang and the budget stays spent.
    fn stalled_step(&mut self, action: &str, args: &[String], extra: &Extra, why: &str) -> String {
        self.step += 1;
        // Stop the load that hung, as a person would press stop, so the next
        // verb reads the page instead of waiting out the same hang.
        let sid = self.tab.session.clone();
        let _ = self
            .browser
            .post_raw(Some(&sid), "Page.stopLoading", json!({}));
        self.inflight.clear();
        self.dom_ready = true;
        let error = first_line(why, 240);
        let entry = json!({
            "step": self.step, "action": action, "args": args, "target": extra.target,
            "targetRole": extra.role, "effect": "unknown", "dead": false, "error": error,
            "url": self.current_url(),
            "console": std::mem::take(&mut self.pending.console),
            "pageErrors": std::mem::take(&mut self.pending.page_errors),
            "network": std::mem::take(&mut self.pending.network),
            "dialogs": [], "tabs": [], "warnings": extra.warnings,
            "goalMet": self.goal_met_at.is_some(),
        });
        self.append(&entry);
        let target = extra
            .target
            .as_ref()
            .map(|t| format!(" {t}"))
            .unwrap_or_default();
        [
            format!(
                "step {} · {action}{target} · effect: unknown · ERROR: {error}",
                self.step
            ),
            "the page did not finish responding; observe again, or give up the way this persona would".into(),
            format!("actions left: {}", self.budget.saturating_sub(self.actions)),
        ]
        .join("\n")
    }

    /// The page froze behind a confirm or prompt: record the moment and hand
    /// the choice to the runner. `preempted` names an action the dialog
    /// stopped before it ran.
    pub(super) fn dialog_step(
        &mut self,
        action: &str,
        args: &[String],
        extra: &Extra,
        preempted: Option<&str>,
    ) -> String {
        self.step += 1;
        // A native dialog is not part of the page's pixels, so the page
        // looks as it did at the last step.
        let shot = |n: u64| self.run_dir.join(format!("step-{n:02}.png"));
        let _ = fs::copy(shot(self.step - 1), shot(self.step));
        let (kind, message) = self
            .dialog
            .as_ref()
            .map(|d| (d.kind.clone(), d.message.clone()))
            .unwrap_or_default();
        self.append(&json!({
            "step": self.step, "action": action, "args": args, "target": extra.target,
            "targetRole": extra.role, "effect": "dialog", "dead": false, "error": null,
            "url": self.current_url(), "dialogs": [{ "type": kind, "message": message, "how": "pending" }],
            "console": [], "pageErrors": [], "network": [], "tabs": [], "warnings": extra.warnings,
            "goalMet": self.goal_met_at.is_some(), "screenshot": format!("step-{:02}.png", self.step),
        }));
        let target = extra
            .target
            .as_ref()
            .map(|t| format!(" {t}"))
            .unwrap_or_default();
        let mut lines = vec![format!(
            "step {} · {action}{target} · effect: a {kind} dialog opened",
            self.step
        )];
        if let Some(a) = preempted {
            lines.push(format!(
                "it opened before your {a}, which was not done and cost nothing"
            ));
        }
        lines.push(format!("the dialog says: \"{message}\""));
        lines.push(if kind == "prompt" {
            "answer it: `answer ok <text>` or `answer cancel`".into()
        } else {
            "answer it: `answer ok` or `answer cancel`".into()
        });
        lines.join("\n")
    }
}

fn is_actionable(role: &str) -> bool {
    ACTIONABLE.contains(&role)
}

fn focus_ref(snap: &Value) -> Option<&str> {
    snap.pointer("/focused/ref").and_then(Value::as_str)
}

/// What the action did, from the strongest signal down: the URL changed, the
/// page's text, form, or ARIA state changed, focus moved, or the DOM changed
/// more than the page changes by itself in the same time.
fn classify_effect(
    before: Option<&Value>,
    after: &Value,
    (base, rate): (f64, f64),
    elapsed: Duration,
    acted_on: Option<&str>,
) -> &'static str {
    let Some(b) = before else {
        return "initial";
    };
    let mutations = after
        .get("mutations")
        .and_then(Value::as_f64)
        .unwrap_or(0.0);
    let dom_delta = mutations - base - rate * elapsed.as_millis() as f64;
    let now_focus = focus_ref(after);
    if s(after, "url") != s(b, "url") {
        "navigated"
    } else if s(after, "stateKey") != s(b, "stateKey") {
        "changed"
    // Clicking a control focuses it; that alone is not the control doing anything.
    } else if now_focus != focus_ref(b) && !(acted_on.is_some() && now_focus == acted_on) {
        "focus moved"
    } else if dom_delta > 2.0 {
        "changed"
    } else {
        "none"
    }
}

/// Text that appeared after the action and was gone once the page settled:
/// a loading state the visitor saw. Lines the page already showed before
/// the action are the old page, not a loading state.
fn transient_lines(
    early: &str,
    after: &Value,
    before: Option<&Value>,
    waited_ms: u64,
) -> Vec<String> {
    if waited_ms <= 700 {
        return Vec::new();
    }
    let mut known: HashSet<&str> = s(after, "bodyText").split('\n').map(str::trim).collect();
    if let Some(b) = before {
        known.extend(s(b, "bodyText").split('\n').map(str::trim));
    }
    let mut out: Vec<String> = Vec::new();
    for line in early.split('\n').map(str::trim) {
        let n = line.chars().count();
        if n > 2 && n < 160 && !known.contains(line) && !out.iter().any(|t| t == line) {
            out.push(line.to_string());
            if out.len() == 3 {
                break;
            }
        }
    }
    out
}

/// Listed elements carrying `flag`, as `ref "name"` or `ref role`.
fn flagged(snap: &Value, flag: &str, quote_name: bool) -> Vec<String> {
    snap.get("items")
        .and_then(Value::as_array)
        .into_iter()
        .flatten()
        .filter(|i| strs(i, "flags").any(|f| f == flag))
        .map(|i| {
            if quote_name {
                format!("{} \"{}\"", s(i, "ref"), s(i, "name"))
            } else {
                format!("{} {}", s(i, "ref"), s(i, "role"))
            }
        })
        .collect()
}

#[cfg(test)]
mod tests {
    use super::*;

    fn snap(url: &str, key: &str, focus: Option<&str>, mutations: f64) -> Value {
        json!({ "url": url, "stateKey": key, "focused": focus.map(|r| json!({ "ref": r })), "mutations": mutations })
    }

    #[test]
    fn effects_rank_navigation_over_state_over_focus_over_dom() {
        let b = snap("http://h/a", "k", Some("e1"), 10.0);
        let t = Duration::from_millis(100);
        let noise = (10.0, 0.0);
        assert_eq!(classify_effect(None, &b, noise, t, None), "initial");
        assert_eq!(
            classify_effect(
                Some(&b),
                &snap("http://h/b", "k", Some("e1"), 10.0),
                noise,
                t,
                None
            ),
            "navigated"
        );
        assert_eq!(
            classify_effect(
                Some(&b),
                &snap("http://h/a", "k2", Some("e1"), 10.0),
                noise,
                t,
                None
            ),
            "changed"
        );
        assert_eq!(
            classify_effect(
                Some(&b),
                &snap("http://h/a", "k", Some("e2"), 10.0),
                noise,
                t,
                None
            ),
            "focus moved"
        );
        // Focusing the control that was clicked is not an effect.
        assert_eq!(
            classify_effect(
                Some(&b),
                &snap("http://h/a", "k", Some("e2"), 10.0),
                noise,
                t,
                Some("e2")
            ),
            "none"
        );
        assert_eq!(
            classify_effect(
                Some(&b),
                &snap("http://h/a", "k", Some("e1"), 20.0),
                noise,
                t,
                None
            ),
            "changed"
        );
        // A page that mutates by itself (a clock) at that rate did nothing extra.
        assert_eq!(
            classify_effect(
                Some(&b),
                &snap("http://h/a", "k", Some("e1"), 20.0),
                (10.0, 0.1),
                t,
                None
            ),
            "none"
        );
    }

    #[test]
    fn transient_text_excludes_the_old_and_the_new_page() {
        let before = json!({ "bodyText": "Old page\nShared header" });
        let after = json!({ "bodyText": "Shared header\nOpen: 9:00 AM" });
        let early = "Old page\nShared header\nNo appointments available\nLoading...";
        assert_eq!(
            transient_lines(early, &after, Some(&before), 1900),
            vec!["No appointments available", "Loading..."]
        );
        assert!(transient_lines(early, &after, Some(&before), 700).is_empty());
    }

    #[test]
    fn only_controls_count_as_dead_targets() {
        assert!(is_actionable("button") && is_actionable("tab") && is_actionable("option"));
        assert!(!is_actionable("tabpanel") && !is_actionable("tablist") && !is_actionable("text"));
    }
}
