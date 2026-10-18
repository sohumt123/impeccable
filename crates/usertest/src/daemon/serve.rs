//! The control channel: one verb at a time on 127.0.0.1, until the parent
//! stops the run, it sits idle, its owner exits, or it is signalled.

use std::net::TcpListener;
use std::path::Path;
use std::sync::atomic::{AtomicBool, Ordering};
use std::time::{Duration, Instant};

use serde_json::json;

use super::verbs::{Request, Then};
use super::Driver;
use crate::{http, paths};

const IDLE: Duration = Duration::from_secs(15 * 60);

static INTERRUPTED: AtomicBool = AtomicBool::new(false);

/// What `start` is waiting for: the first observation (`code` 0), or why the
/// run could not begin (`USERTEST_*` exit codes, see lib.rs).
pub fn write_first(run_dir: &Path, code: i32, text: &str) {
    let body = json!({ "code": code, "text": text }).to_string();
    let _ = paths::write_atomic(&run_dir.join("first.json"), &body);
}

/// Serve one run. `owner` is a pid the run should not outlive (tests).
pub fn serve(mut driver: Driver, run_dir: &Path, owner: Option<i64>) -> i32 {
    impeccable_common::proc::on_interrupt(&INTERRUPTED);
    let listener = match TcpListener::bind("127.0.0.1:0") {
        Ok(l) => l,
        Err(e) => {
            write_first(run_dir, 2, &format!("could not listen on 127.0.0.1: {e}"));
            driver.shutdown("listen failed");
            return 2;
        }
    };
    let port = listener.local_addr().map(|a| a.port()).unwrap_or(0);
    let token = paths::random_token();
    let first = match driver.open() {
        Ok(first) => first,
        Err(e) => {
            write_first(run_dir, 5, &format!("USERTEST_TARGET_UNREACHABLE: {e}"));
            driver.shutdown("the start URL did not load");
            return 5;
        }
    };
    let info = json!({ "port": port, "pid": std::process::id(), "token": token });
    if let Err(e) = paths::write_private(&run_dir.join("driver.json"), &info.to_string()) {
        write_first(run_dir, 2, &format!("could not write driver.json: {e}"));
        driver.shutdown("could not write driver.json");
        return 2;
    }
    write_first(run_dir, 0, &first);
    let _ = listener.set_nonblocking(true);
    let mut last_touch = Instant::now();
    let mut last_owner_check = Instant::now();
    loop {
        match listener.accept() {
            Ok((mut stream, _)) => {
                let _ = stream.set_nonblocking(false);
                last_touch = Instant::now();
                let Some(req) = http::read_request(&mut stream) else {
                    continue;
                };
                // Only the CLI client may drive the run: no browser origin, a JSON body, and the token.
                let allowed = req.method == "POST"
                    && req.header("origin").is_none()
                    && req.header("sec-fetch-site").is_none()
                    && req
                        .header("content-type")
                        .map(|c| c.starts_with("application/json"))
                        .unwrap_or(false)
                    && req.header("x-usertest-token") == Some(token.as_str());
                let parsed = allowed.then(|| Request::parse(&req.body)).flatten();
                let Some(parsed) = parsed else {
                    http::respond(&mut stream, 403, "forbidden");
                    continue;
                };
                let (code, out, then) = driver.dispatch(&parsed);
                http::respond(&mut stream, code, &out);
                if let Then::Stop = then {
                    driver.shutdown("stop");
                    return 0;
                }
            }
            Err(e) if e.kind() == std::io::ErrorKind::WouldBlock => {
                // Keep reading the page between verbs so its events (and any
                // dialog it opens on a timer) are current when the next one arrives.
                let _ = driver.wait(50);
            }
            Err(_) => std::thread::sleep(Duration::from_millis(50)),
        }
        if INTERRUPTED.load(Ordering::SeqCst) {
            driver.shutdown("signalled");
            return 0;
        }
        if last_touch.elapsed() > IDLE {
            driver.shutdown("idle");
            return 0;
        }
        if let Some(pid) = owner {
            if last_owner_check.elapsed() > Duration::from_secs(2) {
                last_owner_check = Instant::now();
                if !impeccable_common::proc::pid_reachable(pid) {
                    driver.shutdown("owner exited");
                    return 0;
                }
            }
        }
    }
}
