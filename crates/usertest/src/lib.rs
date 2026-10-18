//! `impeccable usertest`: the browser a persona runner drives during
//! `/impeccable usertest`.
//!
//! One daemon per run directory. The PARENT calls `start` with the persona's
//! profile and the goal's success check, which are sealed under
//! `~/.impeccable/usertest/sealed/`, outside the session the runner works in.
//! The RUNNER only ever gets its run directory and `usertest act <verb>`, so
//! it can neither read the check nor reach the parent's verbs. The daemon
//! writes the ground-truth trace (`trace.jsonl`, `step-NN.png`) itself. The
//! browser is the installed Chrome the URL engine already finds
//! (`impeccable_browser::discovery`), driven over CDP; nothing is downloaded.
//!
//! Exit codes: 0 ok, 1 usage or a refused verb, 2 run state (already
//! running, reused directory, daemon unreachable), 3 no browser, 4 remote
//! host without consent, 5 the start URL did not load.

mod daemon;
mod hosts;
mod http;
mod keys;
mod paths;
mod summary;

use std::collections::HashMap;
use std::fs;
use std::path::{Path, PathBuf};
use std::time::{Duration, Instant};

use impeccable_common::Io;
use serde_json::{json, Value};

pub const USAGE: &str = "Usage: impeccable usertest <verb> [args]

parent:  preflight
         start --run <dir> --url <url> [--viewport desktop|mobile] [--input pointer|keyboard]
               [--network fast|slow] [--budget <n>] [--success-text <text>] [--success-url <path or #hash>]
               [--goal <text>] [--persona <name>] [--tier <label>] [--storage-state <file>] [--allow-remote]
         save-state <file> --run <dir>
         stop --run <dir>
         stopall <session dir>
         summarize <session dir> [--html]
runner:  act <verb> [args] --run <dir>, where <verb> is one of:
         observe, click <ref>, fill <ref> <text>, select <ref> <option>, press <key>, type <text>,
         scroll down|up|left|right|<ref>, back, reload, interrupt, answer ok|cancel [text],
         dialogs accept|dismiss|ask, note <text> --kind friction|bug|confusion|praise,
         done --outcome completed|abandoned|blocked|unsure <summary>
";

const OWNER_ENV: &str = "IMPECCABLE_USERTEST_OWNER_PID";
/// The first page load on a slow network can take this long (navigation,
/// DOMContentLoaded, the quiet wait, the snapshot), plus the browser launch.
const START_TIMEOUT: Duration = Duration::from_secs(150);
/// How long the client waits for one verb; the daemon gives each verb 90 s.
const VERB_TIMEOUT: Duration = Duration::from_secs(120);

struct Args {
    positional: Vec<String>,
    flags: HashMap<String, String>,
}

/// `--key value` pairs and bare `--switch`es (value "true"); everything else
/// is positional. A value that starts with `--` is never taken as a value.
fn parse_args(argv: &[String]) -> Args {
    let mut positional = Vec::new();
    let mut flags = HashMap::new();
    let mut i = 0;
    while i < argv.len() {
        let a = &argv[i];
        if let Some(key) = a.strip_prefix("--") {
            match argv.get(i + 1) {
                Some(next) if !next.starts_with("--") => {
                    flags.insert(key.to_string(), next.clone());
                    i += 1;
                }
                _ => {
                    flags.insert(key.to_string(), "true".to_string());
                }
            }
        } else {
            positional.push(a.clone());
        }
        i += 1;
    }
    Args { positional, flags }
}

fn fail(io: &mut Io, msg: &str, code: i32) -> i32 {
    io.err(&format!("{msg}\n"));
    code
}

fn launch_args(io: &Io) -> Vec<String> {
    match io.env("CI") {
        Some(v) if !v.is_empty() => vec!["--no-sandbox".into(), "--disable-setuid-sandbox".into()],
        _ => Vec::new(),
    }
}

fn home(io: &Io) -> Result<PathBuf, String> {
    io.home()
        .ok_or_else(|| "no home directory (HOME or USERPROFILE) to keep sealed run data in".into())
}

fn read_info(run_dir: &Path) -> Option<Value> {
    serde_json::from_str(&fs::read_to_string(run_dir.join("driver.json")).ok()?).ok()
}

fn post(info: &Value, body: &Value, timeout: Duration) -> Result<(u16, String), String> {
    let port = info.get("port").and_then(Value::as_u64).unwrap_or(0) as u16;
    let token = info.get("token").and_then(Value::as_str).unwrap_or("");
    http::post(port, token, &body.to_string(), timeout)
}

fn alive(info: Option<&Value>) -> bool {
    let ping = json!({ "role": "parent", "verb": "ping" });
    info.map(|i| matches!(post(i, &ping, Duration::from_secs(5)), Ok((_, d)) if d == "pong"))
        .unwrap_or(false)
}

pub fn run(args: &[String], io: &mut Io) -> i32 {
    let Some(verb) = args.first().map(String::as_str) else {
        io.out(USAGE);
        return 0;
    };
    let opts = parse_args(&args[1..]);
    match verb {
        "help" | "--help" | "-h" => {
            io.out(USAGE);
            0
        }
        "preflight" => preflight(io),
        "start" => start(&opts, io),
        "__serve" => serve(&opts, io),
        "act" => act(&opts, io),
        "stop" | "save-state" => parent_verb(verb, &opts, io),
        "stopall" => stop_all(&opts, io),
        "summarize" => summarize(&opts, io),
        other => fail(
            io,
            &format!("unknown usertest verb \"{other}\"\n\n{USAGE}"),
            1,
        ),
    }
}

fn preflight(io: &mut Io) -> i32 {
    let exe = match impeccable_browser::discovery::find_browser(&io.env) {
        Ok(p) => p,
        Err(e) => return fail(io, &format!("USERTEST_NO_BROWSER: {e}"), 3),
    };
    match impeccable_browser::cdp::Browser::launch(&exe, &launch_args(io), false) {
        Ok(mut b) => {
            let version = daemon::browser_version(&mut b).unwrap_or_default();
            b.close();
            io.out(&format!("USERTEST_READY: {version} at {}\n", exe.display()));
            0
        }
        Err(e) => fail(io, &format!("USERTEST_NO_BROWSER: {}", e.message), 3),
    }
}

/// The persona's driving profile, from the documented values only: a typo
/// must not quietly turn the keyboard persona into a mouse user.
fn profile(opts: &Args, url: &str) -> Result<Value, String> {
    let pick = |k: &str, allowed: [&str; 2]| -> Result<String, String> {
        match opts.flags.get(k).map(String::as_str) {
            None => Ok(allowed[0].to_string()),
            Some(v) if allowed.contains(&v) => Ok(v.to_string()),
            Some(v) => Err(format!(
                "--{k} must be {} or {}, got \"{v}\"",
                allowed[0], allowed[1]
            )),
        }
    };
    let budget = match opts.flags.get("budget") {
        None => 30,
        Some(b) => b
            .parse::<u64>()
            .ok()
            .filter(|n| (1..=500).contains(n))
            .ok_or_else(|| format!("--budget must be a whole number from 1 to 500, got \"{b}\""))?,
    };
    let text = |k: &str| opts.flags.get(k).cloned().unwrap_or_default();
    Ok(json!({
        "goal": text("goal"), "persona": text("persona"), "tier": text("tier"), "url": url,
        "viewport": pick("viewport", ["desktop", "mobile"])?,
        "input": pick("input", ["pointer", "keyboard"])?,
        "network": pick("network", ["fast", "slow"])?,
        "budget": budget,
    }))
}

fn start(opts: &Args, io: &mut Io) -> i32 {
    let (Some(run), Some(url)) = (opts.flags.get("run"), opts.flags.get("url")) else {
        return fail(io, "start needs --run <dir> --url <url>", 1);
    };
    let Some(host) = hosts::host_of(url) else {
        return fail(io, &format!("not an http(s) URL: {url}"), 1);
    };
    let profile = match profile(opts, url) {
        Ok(p) => p,
        Err(e) => return fail(io, &e, 1),
    };
    let text_flag = |k: &str| match opts.flags.get(k) {
        Some(v) if v != "true" => json!(v),
        Some(_) => Value::Null,
        None => Value::Null,
    };
    for k in ["success-text", "success-url"] {
        if opts.flags.get(k).map(String::as_str) == Some("true") {
            return fail(io, &format!("--{k} needs a value"), 1);
        }
    }
    // Runners click everything. Against a deployed site that means real
    // orders, emails, and deletions, so anything off this machine needs
    // explicit consent, and then only for that one host.
    let remote = !hosts::is_local(&host);
    if remote && !opts.flags.contains_key("allow-remote") {
        return fail(
            io,
            &format!("USERTEST_REMOTE_TARGET: {host} is not local. Runners take real actions (orders, emails, deletes). Get the user's explicit consent for this host, then pass --allow-remote."),
            4,
        );
    }
    let run_dir = paths::absolute(&io.cwd, Path::new(run));
    let (Some(session), Some(name)) = (
        run_dir.parent(),
        run_dir.file_name().map(|n| n.to_string_lossy().to_string()),
    ) else {
        return fail(
            io,
            "--run must name a directory inside a session directory",
            1,
        );
    };
    if !paths::is_simple_name(&name) {
        return fail(
            io,
            &format!("run directory names use letters, digits, '-', '_', '.'; got \"{name}\""),
            1,
        );
    }
    if alive(read_info(&run_dir).as_ref()) {
        return fail(
            io,
            &format!(
                "a driver is already running for {}; stop it first",
                run_dir.display()
            ),
            2,
        );
    }
    if run_dir.join("trace.jsonl").exists() {
        return fail(
            io,
            &format!("{} already holds a run; use a new directory (for a retry, <name>-r2) so earlier evidence survives", run_dir.display()),
            2,
        );
    }
    let storage_state = match opts.flags.get("storage-state") {
        Some(f) => {
            let p = paths::absolute(&io.cwd, Path::new(f));
            if !p.is_file() {
                return fail(
                    io,
                    &format!(
                        "storage state {} does not exist; sign in and save-state first",
                        p.display()
                    ),
                    2,
                );
            }
            Some(p.to_string_lossy().to_string())
        }
        None => None,
    };
    if impeccable_browser::discovery::find_browser(&io.env).is_err() {
        return fail(
            io,
            "USERTEST_NO_BROWSER: run `impeccable usertest preflight` for details",
            3,
        );
    }
    let sealed_file = match home(io).and_then(|h| {
        let id = paths::session_id(session, true).map_err(|e| e.to_string())?;
        Ok(paths::sealed_files(&h, &id, &name).profile)
    }) {
        Ok(f) => f,
        Err(e) => return fail(io, &e, 2),
    };
    let sealed = json!({
        "profile": profile, "successText": text_flag("success-text"), "successUrl": text_flag("success-url"),
        "storageState": storage_state, "allowedHost": if remote { json!(host) } else { Value::Null },
    });
    for dir in [
        run_dir.as_path(),
        sealed_file.parent().unwrap_or(Path::new(".")),
    ] {
        if let Err(e) = fs::create_dir_all(dir) {
            return fail(io, &format!("could not create {}: {e}", dir.display()), 2);
        }
    }
    let _ = fs::remove_file(run_dir.join("driver.json"));
    let _ = fs::remove_file(run_dir.join("first.json"));
    if let Err(e) = paths::write_private(
        &sealed_file,
        &serde_json::to_string_pretty(&sealed).unwrap_or_default(),
    ) {
        return fail(
            io,
            &format!("could not write {}: {e}", sealed_file.display()),
            2,
        );
    }
    spawn_daemon(&run_dir, io)
}

/// Start the run's daemon detached and wait for its first observation.
fn spawn_daemon(run_dir: &Path, io: &mut Io) -> i32 {
    let log_path = run_dir.join("driver.log");
    let Ok(exe) = std::env::current_exe() else {
        return fail(io, "cannot locate the impeccable binary", 2);
    };
    let mut cmd = std::process::Command::new(exe);
    cmd.args(["usertest", "__serve", "--run"])
        .arg(run_dir)
        .current_dir(&io.cwd)
        // The daemon inherits the caller's environment, so test harness
        // markers (and their reapers) reach it.
        .env_clear()
        .envs(&io.env)
        .stdin(std::process::Stdio::null());
    let log = fs::OpenOptions::new()
        .create(true)
        .append(true)
        .open(&log_path);
    match log.and_then(|l| Ok((l.try_clone()?, l))) {
        Ok((out, err)) => {
            cmd.stdout(out).stderr(err);
        }
        Err(_) => {
            cmd.stdout(std::process::Stdio::null())
                .stderr(std::process::Stdio::null());
        }
    }
    impeccable_common::proc::detach(&mut cmd);
    let mut child = match cmd.spawn() {
        Ok(c) => c,
        Err(e) => return fail(io, &format!("could not start the driver: {e}"), 2),
    };
    let deadline = Instant::now() + START_TIMEOUT;
    while Instant::now() < deadline {
        let first = fs::read_to_string(run_dir.join("first.json"))
            .ok()
            .and_then(|t| serde_json::from_str::<Value>(&t).ok());
        if let Some(first) = first {
            let code = first.get("code").and_then(Value::as_i64).unwrap_or(2) as i32;
            let text = first.get("text").and_then(Value::as_str).unwrap_or("");
            if code == 0 {
                io.out(&format!("{text}\n"));
            } else {
                io.err(&format!("{text}\n"));
            }
            return code;
        }
        if let Ok(Some(_)) = child.try_wait() {
            break;
        }
        std::thread::sleep(Duration::from_millis(100));
    }
    // Never leave a daemon (and its browser) behind a start that gave up on it.
    impeccable_common::proc::terminate_group(child.id() as i64);
    let _ = child.wait();
    let tail: String = fs::read_to_string(&log_path)
        .map(|t| {
            let skip = t.chars().count().saturating_sub(1200);
            t.chars().skip(skip).collect()
        })
        .unwrap_or_default();
    fail(
        io,
        &format!("driver did not start; see {}\n{tail}", log_path.display()),
        2,
    )
}

fn serve(opts: &Args, io: &mut Io) -> i32 {
    daemon::catch_signals();
    let Some(run) = opts.flags.get("run") else {
        return fail(io, "__serve needs --run", 1);
    };
    let run_dir = paths::absolute(&io.cwd, Path::new(run));
    let found = home(io).and_then(|h| {
        let session = run_dir.parent().ok_or("no session directory")?;
        let id = paths::session_id(session, false).map_err(|e| e.to_string())?;
        let name = run_dir
            .file_name()
            .ok_or("no run name")?
            .to_string_lossy()
            .to_string();
        Ok(paths::sealed_files(&h, &id, &name))
    });
    let sealed = found
        .as_ref()
        .ok()
        .and_then(|f| serde_json::from_str::<Value>(&fs::read_to_string(&f.profile).ok()?).ok());
    let (Ok(files), Some(sealed)) = (found, sealed) else {
        daemon::write_first(
            &run_dir,
            2,
            "no sealed profile for this run; the parent starts it",
        );
        return 2;
    };
    let exe = match impeccable_browser::discovery::find_browser(&io.env) {
        Ok(p) => p,
        Err(e) => {
            daemon::write_first(&run_dir, 3, &format!("USERTEST_NO_BROWSER: {e}"));
            return 3;
        }
    };
    match daemon::Driver::launch(
        &exe,
        &launch_args(io),
        run_dir.clone(),
        sealed,
        files.result,
    ) {
        Ok(driver) => {
            // In tests, die with the owner so no browser outlives a killed test runner.
            let owner = io.env(OWNER_ENV).and_then(|p| p.parse::<i64>().ok());
            daemon::serve(driver, &run_dir, owner)
        }
        Err(e) => {
            daemon::write_first(
                &run_dir,
                3,
                &format!("USERTEST_NO_BROWSER: the browser did not start: {e}"),
            );
            3
        }
    }
}

/// Send one verb to a run's daemon and print its reply.
fn send(role: &str, verb: &str, opts: &Args, positional: &[String], io: &mut Io) -> i32 {
    let Some(run) = opts.flags.get("run") else {
        return fail(io, &format!("{verb} needs --run <dir>\n\n{USAGE}"), 1);
    };
    let run_dir = paths::absolute(&io.cwd, Path::new(run));
    let Some(info) = read_info(&run_dir) else {
        return fail(
            io,
            &format!("no driver running for {run}; the parent starts it"),
            2,
        );
    };
    let mut flags = opts.flags.clone();
    flags.remove("run");
    // save-state resolves its path where the caller stands, like any CLI path.
    flags.insert("__cwd".into(), io.cwd.to_string_lossy().to_string());
    flags.insert(
        "__home".into(),
        io.home()
            .map(|h| h.to_string_lossy().to_string())
            .unwrap_or_default(),
    );
    let body = json!({ "role": role, "verb": verb, "positional": positional, "flags": flags });
    match post(&info, &body, VERB_TIMEOUT) {
        Ok((200, data)) => {
            io.out(&format!("{data}\n"));
            0
        }
        Ok((_, data)) => {
            io.out(&format!("{data}\n"));
            1
        }
        Err(e) => fail(io, &format!("driver unreachable: {e}"), 2),
    }
}

/// `usertest act <verb>`: the runner's only way in.
fn act(opts: &Args, io: &mut Io) -> i32 {
    let Some(verb) = opts.positional.first() else {
        return fail(io, &format!("act needs a verb\n\n{USAGE}"), 1);
    };
    if !daemon::RUNNER_VERBS.contains(&verb.as_str()) {
        return fail(
            io,
            &format!("\"{verb}\" is not a runner verb\n\n{USAGE}"),
            1,
        );
    }
    send("runner", verb, opts, &opts.positional[1..], io)
}

fn parent_verb(verb: &str, opts: &Args, io: &mut Io) -> i32 {
    send("parent", verb, opts, &opts.positional, io)
}

fn stop_all(opts: &Args, io: &mut Io) -> i32 {
    let root = paths::absolute(
        &io.cwd,
        Path::new(opts.positional.first().map(String::as_str).unwrap_or(".")),
    );
    let Ok(entries) = fs::read_dir(&root) else {
        return fail(io, &format!("no session at {}", root.display()), 1);
    };
    let mut dirs: Vec<PathBuf> = entries.filter_map(Result::ok).map(|e| e.path()).collect();
    dirs.sort();
    let (mut stopped, mut stale, mut busy) = (0, 0, Vec::new());
    let stop = json!({ "role": "parent", "verb": "stop" });
    for d in dirs {
        let Some(info) = read_info(&d) else { continue };
        if post(&info, &stop, Duration::from_secs(30)).is_ok() {
            stopped += 1;
            continue;
        }
        // No reply. A daemon still alive is mid-verb: keep its record so a
        // later stopall reaches it. Only a gone process is stale.
        let pid = info.get("pid").and_then(Value::as_i64).unwrap_or(0);
        if impeccable_common::proc::pid_reachable(pid) {
            busy.push(
                d.file_name()
                    .map(|n| n.to_string_lossy().to_string())
                    .unwrap_or_default(),
            );
        } else {
            let _ = fs::remove_file(d.join("driver.json"));
            stale += 1;
        }
    }
    let mut line = format!("stopped {stopped} driver(s)");
    if stale > 0 {
        line.push_str(&format!(", cleared {stale} stale record(s)"));
    }
    if !busy.is_empty() {
        line.push_str(&format!(
            ", {} still busy (run stopall again): {}",
            busy.len(),
            busy.join(", ")
        ));
    }
    io.out(&format!("{line}\n"));
    if busy.is_empty() {
        0
    } else {
        2
    }
}

fn summarize(opts: &Args, io: &mut Io) -> i32 {
    let Some(dir) = opts
        .positional
        .first()
        .or_else(|| opts.flags.get("session"))
    else {
        return fail(io, "summarize needs <session dir>", 1);
    };
    let root = paths::absolute(&io.cwd, Path::new(dir));
    if !root.is_dir() {
        return fail(io, &format!("no session at {}", root.display()), 1);
    }
    let runs = match home(io).and_then(|h| summary::read_session(&root, &h)) {
        Ok(runs) if !runs.is_empty() => runs,
        Ok(_) => return fail(io, &format!("no runs under {}", root.display()), 1),
        Err(e) => return fail(io, &e, 1),
    };
    let md = summary::markdown(&runs);
    let _ = fs::write(root.join("summary.md"), &md);
    io.out(&format!("{md}\n"));
    if opts.flags.contains_key("html") {
        let out = root.join("summary.html");
        let _ = fs::write(&out, summary::html(&runs));
        io.out(&format!("\nhtml: {}\n", out.display()));
    }
    0
}

#[cfg(test)]
mod tests {
    use super::*;

    fn v(a: &[&str]) -> Vec<String> {
        a.iter().map(|s| s.to_string()).collect()
    }

    #[test]
    fn args_split_flags_from_positionals() {
        let a = parse_args(&v(&[
            "e3", "Priya", "Raman", "--run", "/r", "--html", "--kind", "bug",
        ]));
        assert_eq!(a.positional, v(&["e3", "Priya", "Raman"]));
        assert_eq!(a.flags["run"], "/r");
        assert_eq!(a.flags["html"], "true");
        assert_eq!(a.flags["kind"], "bug");
    }

    #[test]
    fn profiles_accept_only_documented_values() {
        let ok = profile(
            &parse_args(&v(&["--input", "keyboard", "--budget", "40"])),
            "http://localhost/",
        )
        .unwrap();
        assert_eq!(
            (
                ok["input"].as_str(),
                ok["viewport"].as_str(),
                ok["budget"].as_u64()
            ),
            (Some("keyboard"), Some("desktop"), Some(40))
        );
        for bad in [
            &["--input", "keyboard-only"][..],
            &["--viewport", "phone"],
            &["--network", "3g"],
            &["--budget", "abc"],
            &["--budget", "0"],
        ] {
            assert!(
                profile(&parse_args(&v(bad)), "http://localhost/").is_err(),
                "{bad:?}"
            );
        }
    }
}
