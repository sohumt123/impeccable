//! Which hosts a run may visit. Runners click everything, and against a
//! deployed site that means real orders, emails, and deletions, so a run
//! stays on this machine unless the user consented to one other host.
//!
//! URLs are parsed with the URL standard (`url`), the same way Chrome parses
//! them, so `http://example.com\@127.0.0.1/` is example.com here too.

use std::net::{Ipv4Addr, Ipv6Addr};

use url::{Host, Url};

/// The host of an http(s) URL, lowercased (IPv6 in brackets), or `None` for
/// anything else.
pub fn host_of(raw: &str) -> Option<String> {
    let u = Url::parse(raw).ok()?;
    if u.scheme() != "http" && u.scheme() != "https" {
        return None;
    }
    u.host_str().map(str::to_ascii_lowercase)
}

/// Loopback addresses, `localhost`, and `*.localhost`.
pub fn is_local(host: &str) -> bool {
    let bare = host.trim_start_matches('[').trim_end_matches(']');
    if let Ok(ip) = bare.parse::<Ipv4Addr>() {
        return ip.is_loopback();
    }
    if let Ok(ip) = bare.parse::<Ipv6Addr>() {
        return ip.is_loopback();
    }
    host == "localhost" || host.ends_with(".localhost")
}

/// Whether a page may navigate to `raw`: a local http(s) host, the one
/// remote host the user allowed, or a URL that loads nothing from a network
/// (`about:`, `data:`, `blob:`).
pub fn may_visit(raw: &str, allowed: Option<&str>) -> bool {
    let Ok(u) = Url::parse(raw) else {
        return false;
    };
    match u.scheme() {
        "about" | "data" | "blob" => true,
        "http" | "https" => match u.host() {
            Some(Host::Domain(d)) => is_local(d) || allowed == Some(d),
            Some(Host::Ipv4(ip)) => ip.is_loopback() || allowed == Some(ip.to_string().as_str()),
            Some(Host::Ipv6(ip)) => ip.is_loopback() || allowed == Some(format!("[{ip}]").as_str()),
            None => false,
        },
        _ => false,
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn parses_hosts_the_way_chrome_does() {
        assert_eq!(
            host_of("http://127.0.0.1:4790/x").as_deref(),
            Some("127.0.0.1")
        );
        assert_eq!(host_of("http://[::1]:3000/").as_deref(), Some("[::1]"));
        assert_eq!(
            host_of("https://user@Example.com/").as_deref(),
            Some("example.com")
        );
        // A backslash ends the authority for http(s), so the host is example.com.
        assert_eq!(
            host_of("http://example.com\\@127.0.0.1/").as_deref(),
            Some("example.com")
        );
        assert_eq!(host_of("http://2130706433/").as_deref(), Some("127.0.0.1"));
        assert_eq!(host_of("file:///etc/passwd"), None);
        assert_eq!(host_of("not a url"), None);
    }

    #[test]
    fn only_loopback_hosts_are_local() {
        for h in [
            "localhost",
            "app.localhost",
            "127.0.0.1",
            "127.8.0.1",
            "[::1]",
        ] {
            assert!(is_local(h), "{h}");
        }
        for h in ["example.com", "localhost.example.com", "10.0.0.1", "[::2]"] {
            assert!(!is_local(h), "{h}");
        }
    }

    #[test]
    fn navigation_stays_local_unless_one_host_is_allowed() {
        assert!(may_visit("http://localhost:3000/checkout", None));
        assert!(may_visit("about:blank", None));
        assert!(!may_visit("https://example.com/", None));
        assert!(!may_visit("http://example.com\\@127.0.0.1/", None));
        assert!(may_visit(
            "https://staging.example.com/x",
            Some("staging.example.com")
        ));
        assert!(!may_visit(
            "https://prod.example.com/x",
            Some("staging.example.com")
        ));
        assert!(!may_visit("file:///etc/passwd", None));
    }
}
