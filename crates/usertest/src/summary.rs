//! `usertest summarize <session>`: the matrix and per-run evidence from every
//! run's trace and sealed result. Verdicts come from the driver's success
//! check, never from the runner's claim.

use std::collections::{BTreeSet, HashMap};
use std::fs;
use std::path::{Path, PathBuf};

use serde_json::Value;

use crate::paths::sealed_path;

/// One vocabulary for the matrix, the HTML, and the playbook.
pub const VERDICTS: [(&str, &str); 6] = [
    ("pass", "goal verified and the runner said it was done"),
    (
        "pass-unclaimed",
        "goal verified, but the runner did not believe it was done (missing confirmation)",
    ),
    (
        "false-success",
        "the runner said it was done; the goal was not met",
    ),
    ("fail", "the runner stopped short; the goal was not met"),
    (
        "unfinished",
        "the run ended without done (crash, turn limit, or idle) and the goal was not met",
    ),
    (
        "unverified",
        "no success check for this goal; the runner's claim stands alone",
    ),
];

pub struct Run {
    pub name: String,
    pub profile: Value,
    pub result: Option<Value>,
    pub has_criterion: bool,
    pub goal_met: bool,
    pub evidence: Vec<(u64, String)>,
    pub dead: usize,
    pub errors: usize,
    pub refused: usize,
}

fn s<'a>(v: &'a Value, key: &str) -> &'a str {
    v.get(key).and_then(Value::as_str).unwrap_or("")
}

fn strs(v: &Value, key: &str) -> Vec<String> {
    v.get(key)
        .and_then(Value::as_array)
        .map(|a| {
            a.iter()
                .filter_map(Value::as_str)
                .map(String::from)
                .collect()
        })
        .unwrap_or_default()
}

fn num(v: &Value, key: &str) -> u64 {
    v.get(key).and_then(Value::as_u64).unwrap_or(0)
}

pub fn read_run(dir: &Path) -> Option<Run> {
    let trace = fs::read_to_string(dir.join("trace.jsonl")).ok()?;
    let sealed_file = sealed_path(dir);
    let sealed: Value = serde_json::from_str(&fs::read_to_string(&sealed_file).ok()?).ok()?;
    let profile = sealed.get("profile").cloned().unwrap_or(Value::Null);
    // Setup runs (sign-in) are not part of the matrix.
    if s(&profile, "persona").is_empty() {
        return None;
    }
    let entries: Vec<Value> = trace
        .lines()
        .filter(|l| !l.is_empty())
        .filter_map(|l| serde_json::from_str(l).ok())
        .collect();
    let result_file = sealed_file.with_file_name(format!(
        "{}.result.json",
        dir.file_name()?.to_string_lossy()
    ));
    let result: Option<Value> = fs::read_to_string(result_file)
        .ok()
        .and_then(|t| serde_json::from_str(&t).ok());
    let steps: Vec<&Value> = entries
        .iter()
        .filter(|e| !matches!(s(e, "action"), "note" | "refused"))
        .collect();
    let mut ev: Vec<(u64, String)> = Vec::new();
    let mut dead = 0;
    let mut errors = 0;
    let mut first_seen: HashMap<&str, Vec<(u64, String)>> = HashMap::new();
    let keyboard = s(&profile, "input") == "keyboard";
    let mut overflow_seen = false;
    for e in &steps {
        let step = num(e, "step");
        if e.get("dead").and_then(Value::as_bool) == Some(true) {
            dead += 1;
            ev.push((step, format!("dead {}: {}", s(e, "action"), s(e, "target"))));
        }
        if let Some(err) = e.get("error").and_then(Value::as_str) {
            let what = if s(e, "target").is_empty() {
                strs(e, "args").join(" ")
            } else {
                s(e, "target").to_string()
            };
            ev.push((
                step,
                format!("action failed: {} {what}: {err}", s(e, "action")),
            ));
        }
        for m in strs(e, "console").into_iter().chain(strs(e, "pageErrors")) {
            errors += 1;
            ev.push((step, format!("js error: {m}")));
        }
        for m in strs(e, "network") {
            errors += 1;
            ev.push((step, format!("network: {m}")));
        }
        for d in e
            .get("dialogs")
            .and_then(Value::as_array)
            .into_iter()
            .flatten()
        {
            ev.push((
                step,
                format!(
                    "dialog: {} \"{}\" ({})",
                    s(d, "type"),
                    s(d, "message"),
                    s(d, "how")
                ),
            ));
        }
        let transient = strs(e, "transient");
        if !transient.is_empty() {
            let secs = e.get("waitedMs").and_then(Value::as_f64).unwrap_or(0.0) / 1000.0;
            let quoted: Vec<String> = transient.iter().map(|t| format!("\"{t}\"")).collect();
            ev.push((
                step,
                format!(
                    "shown while loading ({secs:.1}s), then replaced: {}",
                    quoted.join(", ")
                ),
            ));
        }
        for w in strs(e, "warnings") {
            ev.push((step, w));
        }
        for key in ["pointerOnly", "placeholderOnly", "unlabeled"] {
            let list = first_seen.entry(key).or_default();
            for v in strs(e, key) {
                if !list.iter().any(|(_, m)| *m == v) {
                    list.push((step, v));
                }
            }
        }
        if !overflow_seen && e.get("horizontalOverflow").and_then(Value::as_bool) == Some(true) {
            overflow_seen = true;
            let width = e
                .get("contentWidth")
                .and_then(Value::as_f64)
                .map(|w| format!("{}", w.round() as i64))
                .unwrap_or_else(|| "wider than".into());
            ev.push((
                step,
                format!(
                    "page is {width}px wide on a {} screen; it scrolls sideways",
                    s(&profile, "viewport")
                ),
            ));
        }
        if keyboard {
            if let Some(f) = e.get("focused").filter(|f| !f.is_null()) {
                if f.get("focusRingVisible").and_then(Value::as_bool) != Some(true) {
                    ev.push((
                        step,
                        format!(
                            "focus without visible ring: {} \"{}\"",
                            s(f, "role"),
                            s(f, "name")
                        ),
                    ));
                }
            }
        }
    }
    let labels = [
        ("pointerOnly", "pointer-only control on page"),
        ("placeholderOnly", "field labeled only by placeholder"),
        ("unlabeled", "control with no accessible name"),
    ];
    for (key, label) in labels {
        for (step, m) in first_seen.remove(key).unwrap_or_default() {
            ev.push((step, format!("{label}: {m}")));
        }
    }
    let mut refused = 0;
    for e in entries.iter() {
        match s(e, "action") {
            "refused" => {
                refused += 1;
                ev.push((
                    num(e, "step"),
                    format!("refused {}: {}", s(e, "verb"), s(e, "reason")),
                ));
            }
            "note" => ev.push((
                num(e, "step"),
                format!("runner {}: {}", s(e, "kind"), s(e, "text")),
            )),
            _ => {}
        }
    }
    // Stable sort: same-step evidence keeps the order above.
    ev.sort_by_key(|(step, _)| *step);
    let goal_met = result
        .as_ref()
        .map(|r| {
            r.get("goalMetAtStep")
                .map(|v| !v.is_null())
                .unwrap_or(false)
        })
        .unwrap_or(false)
        || steps
            .iter()
            .any(|e| e.get("goalMet").and_then(Value::as_bool) == Some(true));
    let has_criterion = ["successText", "successUrl"]
        .iter()
        .any(|k| sealed.get(*k).map(|v| !v.is_null()).unwrap_or(false));
    Some(Run {
        name: dir.file_name()?.to_string_lossy().to_string(),
        profile,
        result,
        has_criterion,
        goal_met,
        evidence: ev,
        dead,
        errors,
        refused,
    })
}

pub fn claimed(r: &Run) -> &str {
    r.result
        .as_ref()
        .and_then(|x| x.get("claimed"))
        .and_then(Value::as_str)
        .unwrap_or("none")
}

pub fn verdict(r: &Run) -> &'static str {
    let c = claimed(r);
    if !r.has_criterion {
        "unverified"
    } else if r.goal_met {
        if c == "completed" {
            "pass"
        } else {
            "pass-unclaimed"
        }
    } else if c == "completed" {
        "false-success"
    } else if c == "none" {
        "unfinished"
    } else {
        "fail"
    }
}

fn result_field(r: &Run, key: &str) -> Option<String> {
    r.result
        .as_ref()
        .and_then(|x| x.get(key))
        .filter(|v| !v.is_null())
        .map(|v| match v {
            Value::String(t) => t.clone(),
            other => other.to_string(),
        })
}

pub fn read_session(root: &Path) -> Vec<Run> {
    let mut dirs: Vec<PathBuf> = fs::read_dir(root)
        .map(|it| {
            it.filter_map(Result::ok)
                .map(|e| e.path())
                .filter(|p| p.is_dir())
                .filter(|p| {
                    !p.file_name()
                        .map(|n| n.to_string_lossy().starts_with('_'))
                        .unwrap_or(true)
                })
                .collect()
        })
        .unwrap_or_default();
    dirs.sort();
    dirs.iter().filter_map(|d| read_run(d)).collect()
}

fn goals(runs: &[Run]) -> Vec<String> {
    let mut out: Vec<String> = Vec::new();
    for r in runs {
        let g = s(&r.profile, "goal").to_string();
        if !out.contains(&g) {
            out.push(g);
        }
    }
    out
}

pub fn markdown(runs: &[Run]) -> String {
    let mut lines = vec![
        format!("# Usertest summary: {} runs", runs.len()),
        String::new(),
        "Verdicts come from the driver's success check, not the runner's claim:".into(),
        String::new(),
    ];
    for (k, v) in VERDICTS {
        lines.push(format!("- **{k}**: {v}"));
    }
    lines.push(String::new());
    for goal in goals(runs) {
        lines.push(format!("## Goal: {goal}"));
        lines.push(String::new());
        lines.push("| run | persona | tier | verdict | claimed | met at step | actions | dead actions | js/network errors | refused |".into());
        lines.push("|---|---|---|---|---|---|---|---|---|---|".into());
        for r in runs.iter().filter(|r| s(&r.profile, "goal") == goal) {
            let met = result_field(r, "goalMetAtStep").unwrap_or_else(|| {
                if r.goal_met {
                    "?".into()
                } else {
                    "-".into()
                }
            });
            lines.push(format!(
                "| {} | {} | {} | {} | {} | {met} | {} | {} | {} | {} |",
                r.name,
                s(&r.profile, "persona"),
                s(&r.profile, "tier"),
                verdict(r),
                claimed(r),
                result_field(r, "actions").unwrap_or_else(|| "-".into()),
                r.dead,
                r.errors,
                r.refused
            ));
        }
        lines.push(String::new());
    }
    lines.push("## Evidence by run".into());
    lines.push(String::new());
    for r in runs {
        lines.push(format!(
            "### {} ({}, {}, {}, {}): {}",
            r.name,
            s(&r.profile, "persona"),
            s(&r.profile, "tier"),
            s(&r.profile, "viewport"),
            s(&r.profile, "input"),
            verdict(r)
        ));
        if let Some(summary) = result_field(r, "summary").filter(|t| !t.is_empty()) {
            lines.push(format!("runner: {summary}"));
        }
        for (step, m) in &r.evidence {
            lines.push(format!("- step {step} {m}"));
        }
        if r.evidence.is_empty() {
            lines.push("- nothing recorded".into());
        }
        lines.push(String::new());
    }
    lines.join("\n")
}

fn esc(t: &str) -> String {
    t.replace('&', "&amp;")
        .replace('<', "&lt;")
        .replace('>', "&gt;")
        .replace('"', "&quot;")
}

fn tone(v: &str) -> &'static str {
    match v {
        "pass" => "ok",
        "fail" | "false-success" => "bad",
        _ => "warn",
    }
}

pub fn html(runs: &[Run]) -> String {
    let order = |t: &str| match t {
        "low" => 1,
        "mid" => 2,
        "high" => 3,
        _ => 9,
    };
    let mut personas: Vec<String> = Vec::new();
    for r in runs {
        let p = s(&r.profile, "persona").to_string();
        if !personas.contains(&p) {
            personas.push(p);
        }
    }
    let mut tiers: Vec<String> = runs
        .iter()
        .map(|r| s(&r.profile, "tier").to_string())
        .collect::<BTreeSet<_>>()
        .into_iter()
        .collect();
    tiers.sort_by_key(|t| order(t));
    let mut matrix = String::new();
    for g in goals(runs) {
        matrix.push_str(&format!(
            "\n    <section><h2>{}</h2><div class=\"scroll\"><table><thead><tr><th>Persona</th>{}</tr></thead><tbody>\n    ",
            esc(&g),
            tiers.iter().map(|t| format!("<th>{}</th>", esc(t))).collect::<String>()
        ));
        for p in personas.iter().filter(|p| {
            runs.iter()
                .any(|x| s(&x.profile, "goal") == g && s(&x.profile, "persona") == p.as_str())
        }) {
            matrix.push_str(&format!("<tr><th>{}</th>", esc(p)));
            for t in &tiers {
                let cell: Vec<&Run> = runs
                    .iter()
                    .filter(|x| {
                        s(&x.profile, "goal") == g
                            && s(&x.profile, "persona") == p.as_str()
                            && s(&x.profile, "tier") == t.as_str()
                    })
                    .collect();
                if cell.is_empty() {
                    matrix.push_str("<td class=\"na\">not run</td>");
                    continue;
                }
                let verdicts: Vec<&str> = cell.iter().map(|r| verdict(r)).collect();
                let worst = verdicts
                    .iter()
                    .find(|v| tone(v) == "bad")
                    .or_else(|| verdicts.iter().find(|v| tone(v) == "warn"))
                    .copied()
                    .unwrap_or("pass");
                let links: Vec<String> = cell
                    .iter()
                    .map(|r| format!("<a href=\"#{}\">{}</a>", esc(&r.name), esc(verdict(r))))
                    .collect();
                matrix.push_str(&format!(
                    "<td class=\"{}\">{}<small>{} run{} · {} dead · {} err</small></td>",
                    tone(worst),
                    links.join("<br>"),
                    cell.len(),
                    if cell.len() > 1 { "s" } else { "" },
                    cell.iter().map(|r| r.dead).sum::<usize>(),
                    cell.iter().map(|r| r.errors).sum::<usize>()
                ));
            }
            matrix.push_str("</tr>");
        }
        matrix.push_str("\n    </tbody></table></div></section>");
    }
    let mut detail = String::new();
    for r in runs {
        let marks: String = r
            .evidence
            .iter()
            .map(|(step, m)| {
                format!(
                    "<li><figure><img loading=\"lazy\" src=\"{}/step-{step:02}.png\" alt=\"Screenshot at step {step}\"><figcaption><b>Step {step}</b> {}</figcaption></figure></li>",
                    esc(&r.name),
                    esc(m)
                )
            })
            .collect();
        detail.push_str(&format!(
            "<article id=\"{}\"><h3>{} · {} · {}</h3>\n      <p class=\"goal\">{} · {} · {} · {}</p>\n      {}\n      <ol class=\"marks\">{}</ol></article>",
            esc(&r.name),
            esc(s(&r.profile, "persona")),
            esc(s(&r.profile, "tier")),
            esc(verdict(r)),
            esc(s(&r.profile, "goal")),
            esc(s(&r.profile, "viewport")),
            esc(s(&r.profile, "input")),
            esc(&r.name),
            result_field(r, "summary")
                .filter(|t| !t.is_empty())
                .map(|t| format!("<blockquote>{}</blockquote>", esc(&t)))
                .unwrap_or_default(),
            if marks.is_empty() { "<li class=\"none\">Nothing recorded.</li>".to_string() } else { marks }
        ));
    }
    let legend: String = VERDICTS
        .iter()
        .map(|(k, v)| format!("<dt>{}</dt><dd>{}</dd>", esc(k), esc(v)))
        .collect();
    format!(
        r#"<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Usertest report</title>
<style>
:root{{--bg:#f6f5f2;--fg:#1c1b19;--mute:#6b675f;--line:#dedad2;--ok:#dcefdc;--warn:#f6ecd0;--bad:#f6d9d4;--card:#fff}}
@media (prefers-color-scheme:dark){{:root{{--bg:#161513;--fg:#ecebe7;--mute:#a19c92;--line:#34312c;--ok:#1f3a24;--warn:#3d3420;--bad:#4a2420;--card:#1e1d1a}}}}
body{{margin:0;background:var(--bg);color:var(--fg);font:15px/1.5 ui-sans-serif,system-ui,sans-serif}}
main{{max-width:1100px;margin:0 auto;padding:32px 16px}}
h1{{font-size:28px;margin:0 0 4px}}h2{{font-size:18px;margin:32px 0 8px}}h3{{margin:0 0 4px}}
p.lede,.goal{{color:var(--mute);margin:0 0 16px}}dl{{margin:0 0 16px;font-size:13px;color:var(--mute)}}dt{{display:inline;font-weight:600;color:var(--fg)}}dd{{display:inline;margin:0 12px 0 4px}}
.scroll{{overflow-x:auto}}table{{border-collapse:collapse;width:100%;background:var(--card)}}th,td{{border:1px solid var(--line);padding:8px 10px;text-align:left;vertical-align:top}}
td small{{display:block;color:var(--mute);font-size:12px}}td a{{color:inherit;font-weight:600}}
td.ok{{background:var(--ok)}}td.warn{{background:var(--warn)}}td.bad{{background:var(--bad)}}td.na{{color:var(--mute)}}
article{{background:var(--card);border:1px solid var(--line);padding:16px;margin:16px 0}}
blockquote{{margin:8px 0 12px;padding-left:12px;border-left:3px solid var(--line);color:var(--mute)}}
ol.marks{{list-style:none;padding:0;margin:0;display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:12px}}
figure{{margin:0}}figure img{{width:100%;border:1px solid var(--line);display:block}}figcaption{{font-size:13px;margin-top:4px}}
.none{{color:var(--mute)}}
</style></head><body><main><h1>Usertest report</h1><p class="lede">{} runs. Verdicts come from the driver's success check, not the runner's claim.</p>
<dl>{legend}</dl>{matrix}<h2>Evidence</h2>{detail}</main></body></html>"#,
        runs.len()
    )
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;

    fn run(has: bool, met: bool, claimed: Option<&str>) -> Run {
        Run {
            name: "r".into(),
            profile: json!({}),
            result: claimed.map(|c| json!({ "claimed": c })),
            has_criterion: has,
            goal_met: met,
            evidence: vec![],
            dead: 0,
            errors: 0,
            refused: 0,
        }
    }

    #[test]
    fn verdicts_follow_the_sealed_check() {
        assert_eq!(verdict(&run(true, true, Some("completed"))), "pass");
        assert_eq!(verdict(&run(true, true, Some("unsure"))), "pass-unclaimed");
        assert_eq!(
            verdict(&run(true, false, Some("completed"))),
            "false-success"
        );
        assert_eq!(verdict(&run(true, false, Some("abandoned"))), "fail");
        assert_eq!(verdict(&run(true, false, None)), "unfinished");
        assert_eq!(verdict(&run(false, false, Some("completed"))), "unverified");
    }
}
