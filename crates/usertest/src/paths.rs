//! Where a run's files live, and the file rules the verbs enforce.
//!
//! A session directory (`.impeccable/usertest/<slug>/<stamp>/`) holds what a
//! runner may see: its run directories, traces, and screenshots. What a
//! runner must never see (the success check, the sealed profile, the
//! verdict) lives under `~/.impeccable/usertest/sealed/<session id>/`, so no
//! permission that lets a runner read its screenshots can reach it.

use std::io::Write;
use std::path::{Component, Path, PathBuf};

fn usertest_home(home: &Path) -> PathBuf {
    home.join(".impeccable").join("usertest")
}

/// Saved sign-in state lives here so it is never inside a project.
pub fn auth_dir(home: &Path) -> PathBuf {
    usertest_home(home).join("auth")
}

/// The session's id, from `<session>/session.json`. With `create`, the first
/// `start` in a session writes it; parallel starts all read the same one.
pub fn session_id(session: &Path, create: bool) -> std::io::Result<String> {
    let file = session.join("session.json");
    let read = || -> std::io::Result<String> {
        let raw = std::fs::read_to_string(&file)?;
        serde_json::from_str::<serde_json::Value>(&raw)
            .ok()
            .and_then(|v| v.get("id").and_then(|i| i.as_str()).map(String::from))
            .filter(|id| is_simple_name(id))
            .ok_or_else(|| std::io::Error::other(format!("{} has no usable id", file.display())))
    };
    if !create || file.exists() {
        return read();
    }
    std::fs::create_dir_all(session)?;
    let body = serde_json::json!({ "id": random_token()[..16] }).to_string();
    match std::fs::OpenOptions::new()
        .write(true)
        .create_new(true)
        .open(&file)
    {
        Ok(mut f) => f.write_all(body.as_bytes())?,
        // Another start won the race; use its id.
        Err(e) if e.kind() == std::io::ErrorKind::AlreadyExists => {}
        Err(e) => return Err(e),
    }
    read()
}

/// The sealed directory for one session.
pub fn sealed_dir(home: &Path, session_id: &str) -> PathBuf {
    usertest_home(home).join("sealed").join(session_id)
}

/// A run's sealed profile and, beside it, its verdict.
pub struct Sealed {
    pub profile: PathBuf,
    pub result: PathBuf,
}

pub fn sealed_files(home: &Path, session_id: &str, run_name: &str) -> Sealed {
    let dir = sealed_dir(home, session_id);
    Sealed {
        profile: dir.join(format!("{run_name}.json")),
        result: dir.join(format!("{run_name}.result.json")),
    }
}

/// A run directory's name: one plain path segment.
pub fn is_simple_name(name: &str) -> bool {
    !name.is_empty()
        && name != "."
        && name != ".."
        && name
            .chars()
            .all(|c| c.is_ascii_alphanumeric() || matches!(c, '-' | '_' | '.'))
}

/// `path.resolve(cwd, p)`: absolute and lexically normalized (no `..`).
pub fn absolute(cwd: &Path, p: &Path) -> PathBuf {
    let joined = if p.is_absolute() {
        p.to_path_buf()
    } else {
        cwd.join(p)
    };
    let mut out = PathBuf::new();
    for c in joined.components() {
        match c {
            Component::ParentDir => {
                out.pop();
            }
            Component::CurDir => {}
            other => out.push(other.as_os_str()),
        }
    }
    out
}

/// True when `file` is strictly inside `dir` (both already absolute).
pub fn within(file: &Path, dir: &Path) -> bool {
    file != dir && file.starts_with(dir)
}

/// Where `save-state` may write: anywhere under the auth directory, or a
/// `.json` file directly in the session directory (never inside a run).
pub fn state_file_allowed(target: &Path, session: &Path, auth: &Path) -> bool {
    let in_session = target.parent() == Some(session)
        && target.extension().map(|e| e == "json").unwrap_or(false)
        && target
            .file_name()
            .map(|n| n != "session.json")
            .unwrap_or(false);
    in_session || within(target, auth)
}

/// Write a file only its owner can read (driver tokens, sealed checks,
/// verdicts, sign-in state), replacing it atomically.
pub fn write_private(path: &Path, contents: &str) -> std::io::Result<()> {
    let tmp = tmp_beside(path);
    let _ = std::fs::remove_file(&tmp);
    let mut opts = std::fs::OpenOptions::new();
    opts.write(true).create_new(true);
    #[cfg(unix)]
    {
        use std::os::unix::fs::OpenOptionsExt;
        opts.mode(0o600);
    }
    opts.open(&tmp)?.write_all(contents.as_bytes())?;
    std::fs::rename(&tmp, path)
}

/// Write a file another process polls for, so it never reads half of it.
pub fn write_atomic(path: &Path, contents: &str) -> std::io::Result<()> {
    let tmp = tmp_beside(path);
    std::fs::write(&tmp, contents)?;
    std::fs::rename(&tmp, path)
}

fn tmp_beside(path: &Path) -> PathBuf {
    let name = path
        .file_name()
        .map(|n| n.to_string_lossy().to_string())
        .unwrap_or_default();
    path.with_file_name(format!(".{name}.{}.tmp", std::process::id()))
}

pub fn random_token() -> String {
    let mut bytes = [0u8; 24];
    if getrandom::getrandom(&mut bytes).is_err() {
        // No OS randomness: fall back to the hasher's per-process random keys.
        use std::hash::{BuildHasher, Hasher};
        for chunk in bytes.chunks_mut(8) {
            let mut h = std::collections::hash_map::RandomState::new().build_hasher();
            h.write_u128(
                std::time::SystemTime::now()
                    .duration_since(std::time::UNIX_EPOCH)
                    .map(|d| d.as_nanos())
                    .unwrap_or(0),
            );
            chunk.copy_from_slice(&h.finish().to_le_bytes()[..chunk.len()]);
        }
    }
    bytes.iter().map(|b| format!("{b:02x}")).collect()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn sealed_files_live_under_home_not_the_session() {
        let s = sealed_files(Path::new("/home/u"), "ab12", "a-sam-low");
        assert_eq!(
            s.profile,
            PathBuf::from("/home/u/.impeccable/usertest/sealed/ab12/a-sam-low.json")
        );
        assert_eq!(
            s.result,
            PathBuf::from("/home/u/.impeccable/usertest/sealed/ab12/a-sam-low.result.json")
        );
    }

    #[test]
    fn session_id_is_created_once_and_shared() {
        let dir = std::env::temp_dir().join(format!("ut-session-{}", random_token()));
        let a = session_id(&dir, true).unwrap();
        assert_eq!(a.len(), 16);
        assert_eq!(session_id(&dir, true).unwrap(), a);
        assert_eq!(session_id(&dir, false).unwrap(), a);
        let _ = std::fs::remove_dir_all(&dir);
        assert!(session_id(&dir, false).is_err());
    }

    #[test]
    fn state_files_stay_out_of_runs() {
        let session = Path::new("/w/.impeccable/usertest/s1");
        let auth = Path::new("/h/.impeccable/usertest/auth");
        assert!(state_file_allowed(
            &session.join("signin.json"),
            session,
            auth
        ));
        assert!(state_file_allowed(&auth.join("shop.json"), session, auth));
        assert!(!state_file_allowed(
            &session.join("a-sam-low/trace.json"),
            session,
            auth
        ));
        assert!(!state_file_allowed(
            &session.join("session.json"),
            session,
            auth
        ));
        assert!(!state_file_allowed(
            &session.join("notes.txt"),
            session,
            auth
        ));
        let cwd = Path::new("/w");
        let escape = absolute(cwd, Path::new(".impeccable/usertest/s1/../../x.json"));
        assert!(!state_file_allowed(&escape, session, auth));
    }

    #[test]
    fn run_names_are_one_segment() {
        assert!(is_simple_name("a-sam-low-r2"));
        assert!(!is_simple_name("../x") && !is_simple_name("a/b") && !is_simple_name(".."));
    }

    #[test]
    fn private_writes_replace_and_restrict() {
        let dir = std::env::temp_dir().join(format!("ut-private-{}", random_token()));
        std::fs::create_dir_all(&dir).unwrap();
        let f = dir.join("x.json");
        write_private(&f, "one").unwrap();
        write_private(&f, "two").unwrap();
        assert_eq!(std::fs::read_to_string(&f).unwrap(), "two");
        #[cfg(unix)]
        {
            use std::os::unix::fs::PermissionsExt;
            assert_eq!(
                std::fs::metadata(&f).unwrap().permissions().mode() & 0o777,
                0o600
            );
        }
        let _ = std::fs::remove_dir_all(&dir);
    }

    #[test]
    fn tokens_are_long_and_distinct() {
        let a = random_token();
        assert_eq!(a.len(), 48);
        assert_ne!(a, random_token());
    }
}
