//! `impeccable usertest`: the browser a persona runner drives during
//! `/impeccable usertest`.
//!
//! One daemon per run directory. The PARENT calls `start` with the persona's
//! profile and the goal's success check; the runner only ever gets the run
//! directory and the action verbs, so it cannot read or change either. The
//! daemon writes the ground-truth trace (`trace.jsonl`, `step-NN.png`) itself,
//! and the success check lives in `<session>/_sealed/`, outside the run
//! directory. The browser is the installed Chrome the URL engine already
//! finds (`impeccable_browser::discovery`), driven over CDP; nothing is
//! downloaded.

mod daemon;
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

pub const USAGE: &str = "Usage: impeccable usertest <verb> [args] --run <run dir>

parent:  preflight
         start --run <dir> --url <url> [--viewport desktop|mobile] [--input pointer|keyboard]
               [--network fast|slow] [--budget <n>] [--success-text <text>] [--success-url <path>]
               [--goal <text>] [--persona <name>] [--tier <label>] [--storage-state <file>] [--allow-remote]
         stopall <session dir>
         summarize <session dir> [--html]
runner:  observe, click <ref>, fill <ref> <text>, select <ref> <option>, press <key>, type <text>,
         scroll down|up|left|right|<ref>, back, reload, interrupt, answer ok|cancel [text], dialogs accept|dismiss|ask,
         note <text> --kind friction|bug|confusion|praise, done --outcome completed|abandoned|blocked|unsure <summary>,
         stop
setup:   save-state <file>
";

const OWNER_ENV: &str = "IMPECCABLE_USERTEST_OWNER_PID";
const LOCAL_HOSTS: [&str; 4] = ["localhost", "127.0.0.1", "::1", "[::1]"];

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

fn is_local(host: &str) -> bool {
    LOCAL_HOSTS.contains(&host) || host.ends_with(".localhost")
}

fn host_of(url: &str) -> Option<String> {
    let (scheme, rest) = url.split_once("://")?;
    if scheme != "http" && scheme != "https" {
        return None;
    }
    let authority = rest.split(['/', '?', '#']).next()?;
    let authority = authority.rsplit('@').next()?;
    let host = if authority.starts_with('[') {
        authority.split(']').next().map(|h| format!("{h}]"))?
    } else {
        authority.split(':').next()?.to_string()
    };
    if host.is_empty() {
        None
    } else {
        Some(host.to_ascii_lowercase())
    }
}

fn launch_args(io: &Io) -> Vec<String> {
    match io.env("CI") {
        Some(v) if !v.is_empty() => vec!["--no-sandbox".into(), "--disable-setuid-sandbox".into()],
        _ => Vec::new(),
    }
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
    info.map(|i| {
        matches!(post(i, &json!({ "verb": "ping" }), Duration::from_secs(5)), Ok((_, d)) if d == "pong")
    })
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
        "stopall" => stop_all(&opts, io),
        "summarize" => summarize(&opts, io),
        other => client(other, &opts, io),
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

fn start(opts: &Args, io: &mut Io) -> i32 {
    let (Some(run), Some(url)) = (opts.flags.get("run"), opts.flags.get("url")) else {
        return fail(io, "start needs --run <dir> --url <url>", 1);
    };
    let Some(host) = host_of(url) else {
        return fail(io, &format!("not an http(s) URL: {url}"), 1);
    };
    // Runners click everything. Against a deployed site that means real
    // orders, emails, and deletions, so anything off this machine needs
    // explicit consent.
    let remote = !is_local(&host);
    if remote && !opts.flags.contains_key("allow-remote") {
        return fail(
            io,
            &format!("USERTEST_REMOTE_TARGET: {host} is not local. Runners take real actions (orders, emails, deletes). Get the user's explicit consent for this host, then pass --allow-remote."),
            4,
        );
    }
    let run_dir = paths::absolute(&io.cwd, Path::new(run));
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
    let flag = |k: &str| opts.flags.get(k).cloned().unwrap_or_default();
    let pick = |k: &str, alt: &str, default: &str| {
        if opts.flags.get(k).map(String::as_str) == Some(alt) {
            alt.to_string()
        } else {
            default.to_string()
        }
    };
    let profile = json!({
        "goal": flag("goal"), "persona": flag("persona"), "tier": flag("tier"), "url": url,
        "viewport": pick("viewport", "mobile", "desktop"),
        "input": pick("input", "keyboard", "pointer"),
        "network": pick("network", "slow", "fast"),
        "budget": opts.flags.get("budget").and_then(|b| b.parse::<u64>().ok()).filter(|b| *b > 0).unwrap_or(30),
    });
    let text_flag = |k: &str| match opts.flags.get(k) {
        Some(v) if v != "true" => json!(v),
        _ => Value::Null,
    };
    let sealed = json!({
        "profile": profile, "successText": text_flag("success-text"), "successUrl": text_flag("success-url"),
        "storageState": storage_state, "remote": remote,
    });
    let sealed_file = paths::sealed_path(&run_dir);
    for dir in [
        &run_dir,
        &sealed_file
            .parent()
            .map(Path::to_path_buf)
            .unwrap_or_default(),
    ] {
        if let Err(e) = fs::create_dir_all(dir) {
            return fail(io, &format!("could not create {}: {e}", dir.display()), 2);
        }
    }
    let _ = fs::remove_file(run_dir.join("driver.json"));
    let _ = fs::remove_file(run_dir.join("first.txt"));
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
    let _ = fs::write(
        run_dir.join("profile.json"),
        serde_json::to_string_pretty(&profile).unwrap_or_default(),
    );
    let log_path = run_dir.join("driver.log");
    let log = fs::OpenOptions::new()
        .create(true)
        .append(true)
        .open(&log_path);
    let Ok(exe) = std::env::current_exe() else {
        return fail(io, "cannot locate the impeccable binary", 2);
    };
    let mut cmd = std::process::Command::new(exe);
    cmd.args(["usertest", "__serve", "--run"])
        .arg(&run_dir)
        .current_dir(&io.cwd)
        // The daemon inherits the caller's environment, so test harness
        // markers (and their reapers) reach it.
        .env_clear()
        .envs(&io.env)
        .stdin(std::process::Stdio::null());
    match log.and_then(|l| Ok((l.try_clone()?, l))) {
        Ok((a, b)) => {
            cmd.stdout(a).stderr(b);
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
    let deadline = Instant::now() + Duration::from_secs(90);
    while Instant::now() < deadline {
        if let Ok(first) = fs::read_to_string(run_dir.join("first.txt")) {
            let _ = child.try_wait();
            io.out(&format!("{first}\n"));
            return 0;
        }
        if let Ok(Some(_)) = child.try_wait() {
            break;
        }
        std::thread::sleep(Duration::from_millis(100));
    }
    let tail = fs::read_to_string(&log_path)
        .map(|t| {
            t.chars()
                .rev()
                .take(1200)
                .collect::<Vec<_>>()
                .into_iter()
                .rev()
                .collect::<String>()
        })
        .unwrap_or_default();
    fail(
        io,
        &format!("driver did not start; see {}\n{tail}", log_path.display()),
        2,
    )
}

fn serve(opts: &Args, io: &mut Io) -> i32 {
    let Some(run) = opts.flags.get("run") else {
        return fail(io, "__serve needs --run", 1);
    };
    let run_dir = paths::absolute(&io.cwd, Path::new(run));
    let sealed: Value = match fs::read_to_string(paths::sealed_path(&run_dir))
        .ok()
        .and_then(|t| serde_json::from_str(&t).ok())
    {
        Some(v) => v,
        None => {
            return fail(
                io,
                "no sealed profile for this run; the parent starts it",
                2,
            )
        }
    };
    let exe = match impeccable_browser::discovery::find_browser(&io.env) {
        Ok(p) => p,
        Err(e) => return fail(io, &format!("USERTEST_NO_BROWSER: {e}"), 3),
    };
    let driver = match daemon::Driver::launch(&exe, &launch_args(io), run_dir.clone(), sealed) {
        Ok(d) => d,
        Err(e) => {
            let _ = fs::write(
                run_dir.join("first.txt"),
                format!("ERROR: the browser did not start: {e}"),
            );
            return fail(io, &format!("the browser did not start: {e}"), 3);
        }
    };
    // In tests, die with the owner so no browser outlives a killed test runner.
    let owner = io.env(OWNER_ENV).and_then(|p| p.parse::<i64>().ok());
    daemon::serve(driver, &run_dir, owner)
}

fn client(verb: &str, opts: &Args, io: &mut Io) -> i32 {
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
    let body = json!({ "verb": verb, "positional": opts.positional, "flags": flags });
    match post(&info, &body, Duration::from_secs(120)) {
        Ok((code, data)) => {
            io.out(&format!("{data}\n"));
            if code == 200 {
                0
            } else {
                1
            }
        }
        Err(e) => fail(io, &format!("driver unreachable: {e}"), 2),
    }
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
    let (mut stopped, mut stale) = (0, 0);
    for d in dirs {
        let Some(info) = read_info(&d) else { continue };
        if post(&info, &json!({ "verb": "stop" }), Duration::from_secs(20)).is_ok() {
            stopped += 1;
        } else {
            // Unreachable means already gone (an unverified pid is never killed); clear the record.
            let _ = fs::remove_file(d.join("driver.json"));
            stale += 1;
        }
    }
    let extra = if stale > 0 {
        format!(", cleared {stale} stale record(s)")
    } else {
        String::new()
    };
    io.out(&format!("stopped {stopped} driver(s){extra}\n"));
    0
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
    let runs = summary::read_session(&root);
    if runs.is_empty() {
        return fail(io, &format!("no runs under {}", root.display()), 1);
    }
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
    fn only_loopback_hosts_are_local() {
        assert_eq!(
            host_of("http://127.0.0.1:4790/x").as_deref(),
            Some("127.0.0.1")
        );
        assert_eq!(host_of("http://[::1]:3000/").as_deref(), Some("[::1]"));
        assert_eq!(
            host_of("https://user@Example.com/").as_deref(),
            Some("example.com")
        );
        assert_eq!(host_of("file:///etc/passwd"), None);
        assert!(is_local("localhost") && is_local("app.localhost") && is_local("[::1]"));
        assert!(!is_local("example.com") && !is_local("localhost.example.com"));
    }
}
