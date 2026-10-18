//! Key definitions for `press` and `type`, from Playwright's US keyboard
//! layout (`usKeyboardLayout`): the `key`, `code`, and Windows virtual key
//! code CDP's `Input.dispatchKeyEvent` needs, plus the text a key inserts.
//! Enter has to carry `"\r"` and Space `" "`, or Chrome never fires the
//! keypress that submits a form or activates a button.

/// One key press, ready for `Input.dispatchKeyEvent`.
#[derive(Debug, Clone, PartialEq)]
pub struct KeyStroke {
    pub key: String,
    pub code: String,
    pub key_code: u32,
    pub text: Option<String>,
    /// CDP modifier bits: Alt 1, Control 2, Meta 4, Shift 8.
    pub modifiers: u32,
    /// The modifier keys to hold down first, in order.
    pub held: Vec<KeyStroke>,
}

fn named(name: &str) -> Option<(&'static str, &'static str, u32, Option<&'static str>)> {
    Some(match name {
        "Enter" | "Return" => ("Enter", "Enter", 13, Some("\r")),
        "Tab" => ("Tab", "Tab", 9, None),
        "Space" | " " => (" ", "Space", 32, Some(" ")),
        "Escape" | "Esc" => ("Escape", "Escape", 27, None),
        "Backspace" => ("Backspace", "Backspace", 8, None),
        "Delete" => ("Delete", "Delete", 46, None),
        "ArrowUp" | "Up" => ("ArrowUp", "ArrowUp", 38, None),
        "ArrowDown" | "Down" => ("ArrowDown", "ArrowDown", 40, None),
        "ArrowLeft" | "Left" => ("ArrowLeft", "ArrowLeft", 37, None),
        "ArrowRight" | "Right" => ("ArrowRight", "ArrowRight", 39, None),
        "Home" => ("Home", "Home", 36, None),
        "End" => ("End", "End", 35, None),
        "PageUp" => ("PageUp", "PageUp", 33, None),
        "PageDown" => ("PageDown", "PageDown", 34, None),
        "Shift" => ("Shift", "ShiftLeft", 16, None),
        "Control" | "Ctrl" => ("Control", "ControlLeft", 17, None),
        "Alt" | "Option" => ("Alt", "AltLeft", 18, None),
        "Meta" | "Command" | "Cmd" => ("Meta", "MetaLeft", 91, None),
        _ => return None,
    })
}

fn modifier_bit(key: &str) -> u32 {
    match key {
        "Alt" => 1,
        "Control" => 2,
        "Meta" => 4,
        "Shift" => 8,
        _ => 0,
    }
}

/// A single printable character as a key: letters and digits get their
/// physical code so pages that listen for `code` see a real key.
pub fn char_key(c: char) -> KeyStroke {
    let (code, key_code) = if c.is_ascii_alphabetic() {
        (
            format!("Key{}", c.to_ascii_uppercase()),
            c.to_ascii_uppercase() as u32,
        )
    } else if c.is_ascii_digit() {
        (format!("Digit{c}"), c as u32)
    } else if c == ' ' {
        ("Space".to_string(), 32)
    } else {
        (String::new(), 0)
    };
    KeyStroke {
        key: c.to_string(),
        code,
        key_code,
        text: Some(c.to_string()),
        modifiers: 0,
        held: Vec::new(),
    }
}

/// Parse `Tab`, `Shift+Tab`, `Control+a`, `Enter`, `a`, ... The last part is
/// the key; the parts before it are held modifiers.
pub fn parse(spec: &str) -> Result<KeyStroke, String> {
    if spec.is_empty() {
        return Err(
            "press needs a key, e.g. Tab, Shift+Tab, Enter, Space, Escape, ArrowDown".into(),
        );
    }
    // `+` alone (or a trailing `+`) is the plus key itself.
    let parts: Vec<&str> = if spec == "+" {
        vec!["+"]
    } else if let Some(head) = spec.strip_suffix("++") {
        head.split('+').chain(std::iter::once("+")).collect()
    } else {
        spec.split('+').collect()
    };
    let (last, mods) = parts.split_last().ok_or("empty key")?;
    let mut held = Vec::new();
    let mut modifiers = 0;
    for m in mods {
        let Some((key, code, key_code, _)) = named(m) else {
            return Err(format!("unknown modifier \"{m}\" in \"{spec}\""));
        };
        let bit = modifier_bit(key);
        if bit == 0 {
            return Err(format!(
                "\"{m}\" is not a modifier (Shift, Control, Alt, Meta)"
            ));
        }
        held.push(KeyStroke {
            key: key.into(),
            code: code.into(),
            key_code,
            text: None,
            modifiers: modifiers | bit,
            held: Vec::new(),
        });
        modifiers |= bit;
    }
    let mut stroke = if let Some((key, code, key_code, text)) = named(last) {
        KeyStroke {
            key: key.into(),
            code: code.into(),
            key_code,
            text: text.map(String::from),
            modifiers: 0,
            held: Vec::new(),
        }
    } else {
        let mut chars = last.chars();
        match (chars.next(), chars.next()) {
            (Some(c), None) => char_key(c),
            _ => {
                return Err(format!(
                    "unknown key \"{last}\"; use Tab, Shift+Tab, Enter, Space, Escape, Backspace, Delete, ArrowUp/Down/Left/Right, Home, End, PageUp, PageDown, or one character"
                ))
            }
        }
    };
    // A shortcut (Control+a) inserts no text; Shift+letter types the capital.
    if modifiers & !8 != 0 {
        stroke.text = None;
    } else if modifiers & 8 != 0 {
        if let Some(t) = &stroke.text {
            if t.len() == 1 && t.chars().all(|c| c.is_ascii_lowercase()) {
                let up = t.to_ascii_uppercase();
                stroke.key = up.clone();
                stroke.text = Some(up);
            }
        }
    }
    stroke.modifiers = modifiers;
    stroke.held = held;
    Ok(stroke)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn enter_and_space_carry_text() {
        assert_eq!(parse("Enter").unwrap().text.as_deref(), Some("\r"));
        let space = parse("Space").unwrap();
        assert_eq!(
            (space.key.as_str(), space.text.as_deref()),
            (" ", Some(" "))
        );
        assert_eq!(parse("Tab").unwrap().text, None);
    }

    #[test]
    fn modifiers_are_held_and_flagged() {
        let s = parse("Shift+Tab").unwrap();
        assert_eq!(s.key, "Tab");
        assert_eq!(s.modifiers, 8);
        assert_eq!(s.held.len(), 1);
        assert_eq!(s.held[0].key, "Shift");
        let c = parse("Control+a").unwrap();
        assert_eq!((c.modifiers, c.text.clone()), (2, None));
        assert_eq!(c.code, "KeyA");
        assert_eq!(parse("Shift+a").unwrap().text.as_deref(), Some("A"));
    }

    #[test]
    fn rejects_unknown_keys() {
        assert!(parse("Banana").is_err());
        assert!(parse("Tab+Enter").is_err());
        assert!(parse("").is_err());
        assert_eq!(parse("+").unwrap().key, "+");
        assert_eq!(parse("Shift++").unwrap().key, "+");
    }
}
