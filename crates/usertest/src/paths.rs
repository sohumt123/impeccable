//! Where a run's files live, and the few file rules the verbs enforce.

use std::path::{Component, Path, PathBuf};

/// Saved sign-in state lives here so it is never inside a project.
pub fn auth_dir(home: &Path) -> PathBuf {
    home.join(".impeccable").join("usertest").join("auth")
}

/// `<session>/_sealed/<run>.json`: the run's profile and success check,
/// outside the run directory the runner works in.
pub fn sealed_path(run_dir: &Path) -> PathBuf {
    let name = run_dir
        .file_name()
        .map(|n| n.to_string_lossy().to_string())
        .unwrap_or_default();
    run_dir
        .parent()
        .unwrap_or(Path::new("."))
        .join("_sealed")
        .join(format!("{name}.json"))
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

/// Write a file only its owner can read (driver tokens, sealed checks, sign-in state).
pub fn write_private(path: &Path, contents: &str) -> std::io::Result<()> {
    let _ = std::fs::remove_file(path);
    let mut opts = std::fs::OpenOptions::new();
    opts.write(true).create_new(true);
    #[cfg(unix)]
    {
        use std::os::unix::fs::OpenOptionsExt;
        opts.mode(0o600);
    }
    use std::io::Write;
    opts.open(path)?.write_all(contents.as_bytes())
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
    fn sealed_sits_beside_the_run() {
        assert_eq!(
            sealed_path(Path::new("/s/sess/run-1")),
            PathBuf::from("/s/sess/_sealed/run-1.json")
        );
    }

    #[test]
    fn within_rejects_escapes() {
        let cwd = Path::new("/work");
        let session = Path::new("/work/.impeccable/usertest/s1");
        assert!(within(
            &absolute(cwd, Path::new(".impeccable/usertest/s1/auth.json")),
            session
        ));
        assert!(!within(
            &absolute(cwd, Path::new(".impeccable/usertest/s1/../../x.json")),
            session
        ));
        assert!(!within(session, session));
    }

    #[test]
    fn tokens_are_long_and_distinct() {
        let a = random_token();
        assert_eq!(a.len(), 48);
        assert_ne!(a, random_token());
    }
}
