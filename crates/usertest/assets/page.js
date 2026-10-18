// In-page helpers for `impeccable usertest`. The engine evaluates
// `(() => { <this file>; return <call>; })()` in the page's main world, so
// every function here is plain browser JS with no imports.

// Installed before any page script runs (Page.addScriptToEvaluateOnNewDocument):
// counts DOM mutations so an action that only toggles classes, ARIA, or styles
// still reads as an effect.
function mutationCounter() {
  window.__utMut = 0;
  const start = () => new MutationObserver((list) => { window.__utMut += list.length; })
    .observe(document, { subtree: true, childList: true, attributes: true, characterData: true });
  if (document.documentElement) start();
  else document.addEventListener('DOMContentLoaded', start, { once: true });
}

// Deep lookup by ref: refs can sit inside open shadow roots, which
// document.querySelector does not enter.
function utFind(ref) {
  const sel = `[data-ut-ref="${ref}"]`;
  const walk = (root) => {
    const hit = root.querySelector(sel);
    if (hit) return hit;
    for (const el of root.querySelectorAll('*')) {
      if (el.shadowRoot) {
        const h = walk(el.shadowRoot);
        if (h) return h;
      }
    }
    return null;
  };
  return walk(document);
}

function utDeepFromPoint(x, y) {
  let el = document.elementFromPoint(x, y);
  while (el && el.shadowRoot) {
    const inner = el.shadowRoot.elementFromPoint(x, y);
    if (!inner || inner === el) break;
    el = inner;
  }
  return el;
}

function utDescribe(el) {
  if (!el) return 'nothing';
  const ref = el.closest?.('[data-ut-ref]')?.getAttribute('data-ut-ref');
  const text = (el.getAttribute?.('aria-label') || el.innerText || el.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 60);
  return `${ref ? `[${ref}] ` : ''}${el.tagName.toLowerCase()}${text ? ` "${text}"` : ''}`;
}

// Where a pointer would land on ref, after scrolling it into view the way
// Playwright's actionability checks do. Returns viewport coordinates for
// Input.dispatch*Event, or the reason a person could not hit it.
function utPoint(ref) {
  const el = utFind(ref);
  if (!el || !el.isConnected) return { error: `${ref} is no longer on the page; observe again` };
  if (el.disabled || el.getAttribute('aria-disabled') === 'true') return { error: `${ref} is disabled; clicking it does nothing` };
  const vv = window.visualViewport;
  const seen = () => (vv ? { l: vv.offsetLeft, t: vv.offsetTop, r: vv.offsetLeft + vv.width, b: vv.offsetTop + vv.height } : { l: 0, t: 0, r: innerWidth, b: innerHeight });
  let r = el.getBoundingClientRect();
  let v = seen();
  if (r.top < v.t || r.left < v.l || r.bottom > v.b || r.right > v.r) {
    el.scrollIntoView({ block: 'center', inline: 'center', behavior: 'instant' });
    r = el.getBoundingClientRect();
    v = seen();
  }
  if (!r.width || !r.height) return { error: `${ref} is not visible` };
  const cx = Math.min(Math.max(r.left + r.width / 2, v.l + 1), v.r - 1);
  const cy = Math.min(Math.max(r.top + r.height / 2, v.t + 1), v.b - 1);
  const hit = utDeepFromPoint(cx, cy);
  const within = (n, target) => {
    for (; n; n = n.parentNode || n.host) if (n === target) return true;
    return false;
  };
  const viaLabel = [...(el.labels || [])].some((l) => within(hit, l));
  if (!within(hit, el) && !viaLabel) return { error: `something else is on top of ${ref} at that spot: ${utDescribe(hit)}` };
  // Input events take visual-viewport coordinates; they differ from layout
  // coordinates when a mobile page is pinch-zoomed or scaled to fit.
  const scale = vv ? vv.scale : 1;
  return { x: (cx - (vv ? vv.offsetLeft : 0)) * scale, y: (cy - (vv ? vv.offsetTop : 0)) * scale };
}

// Focus a field and select its contents so typed text replaces it, as
// Playwright's fill does. Date, time, color, and range inputs have no
// typeable text, so they are set directly (also what Playwright does).
function utFillPrep(ref, text) {
  const el = utFind(ref);
  if (!el || !el.isConnected) return { error: `${ref} is no longer on the page; observe again` };
  const tag = el.tagName;
  const type = tag === 'INPUT' ? (el.type || 'text') : '';
  if (el.disabled) return { error: `${ref} is disabled` };
  if (tag === 'INPUT' && ['checkbox', 'radio', 'submit', 'button', 'reset', 'image', 'file'].includes(type)) return { error: `${ref} is a ${type}, not a text field; click it instead` };
  if (tag !== 'INPUT' && tag !== 'TEXTAREA' && !el.isContentEditable) return { error: `${ref} is not a text field` };
  if (el.readOnly) return { error: `${ref} is read-only` };
  el.scrollIntoView({ block: 'center', inline: 'center', behavior: 'instant' });
  el.focus();
  if (['date', 'time', 'datetime-local', 'month', 'week', 'color', 'range'].includes(type)) {
    let value = text;
    // A person would use the picker, so accept what they would type.
    if (['date', 'datetime-local', 'month'].includes(type) && !/^\d{4}-\d{2}/.test(text)) {
      const t = new Date(text);
      if (!Number.isNaN(t.getTime())) {
        const p = (n) => String(n).padStart(2, '0');
        const iso = `${t.getFullYear()}-${p(t.getMonth() + 1)}-${p(t.getDate())}`;
        value = type === 'month' ? iso.slice(0, 7) : type === 'datetime-local' ? `${iso}T${p(t.getHours())}:${p(t.getMinutes())}` : iso;
      }
    }
    el.value = value;
    if (value !== '' && el.value === '') return { error: `Malformed value "${text}" for a ${type} field` };
    el.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
    return { direct: true, value };
  }
  if (el.isContentEditable) {
    const range = document.createRange();
    range.selectNodeContents(el);
    const sel = getSelection();
    sel.removeAllRanges();
    sel.addRange(range);
  } else {
    el.select();
  }
  return { direct: false };
}

function utSelect(ref, label) {
  const el = utFind(ref);
  if (!el || !el.isConnected) return { error: `${ref} is no longer on the page; observe again` };
  if (el.tagName !== 'SELECT') return { error: `${ref} is not a dropdown list; click it instead` };
  if (el.disabled) return { error: `${ref} is disabled` };
  const want = label.trim();
  const opts = [...el.options];
  const o = opts.find((x) => x.label.trim() === want || x.text.trim() === want) || opts.find((x) => x.value === want);
  if (!o) return { error: `no option "${want}" in that list; it offers: ${opts.map((x) => `"${x.text.trim()}"`).join(', ').slice(0, 400)}` };
  if (o.disabled) return { error: `option "${want}" is disabled` };
  el.focus();
  for (const x of opts) x.selected = x === o;
  el.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
  el.dispatchEvent(new Event('change', { bubbles: true }));
  return { ok: true };
}

function utScrollTo(ref) {
  const el = utFind(ref);
  if (!el) return { error: `${ref} is no longer on the page; observe again` };
  const r = el.getBoundingClientRect();
  const vv = window.visualViewport;
  const l = vv ? vv.offsetLeft : 0;
  const t = vv ? vv.offsetTop : 0;
  if (r.top < t || r.left < l || r.bottom > t + (vv ? vv.height : innerHeight) || r.right > l + (vv ? vv.width : innerWidth)) el.scrollIntoView({ block: 'center', inline: 'center', behavior: 'instant' });
  return { ok: true };
}

function utKind(ref) {
  const el = utFind(ref);
  return el && el.tagName === 'INPUT' ? el.type : '';
}

// Runs in the page. Tags every interactive or meaningful element with a ref and
// returns a reading-order list plus the facts the personas' red flags need.
function pageSnapshot({ maxElements, mobile, keyboard, nextRef, deviceWidth }) {
  // Refs are unique for the whole run (the counter survives navigation via
  // nextRef), so a ref from an old page can never name a new control.
  window.__utNext = Math.max(window.__utNext || 0, nextRef);
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  // What the screen shows. On a phone the layout viewport widens to fit wide
  // content, but the visitor still sees only the device's width of it.
  const vv = window.visualViewport;
  const seen = vv ? { left: vv.offsetLeft, top: vv.offsetTop, width: vv.width, height: vv.height } : { left: 0, top: 0, width: vw, height: vh };
  const NATIVE = new Set(['A', 'BUTTON', 'INPUT', 'SELECT', 'TEXTAREA', 'SUMMARY', 'OPTION']);
  const ROLE_INTERACTIVE = new Set(['button', 'link', 'checkbox', 'radio', 'switch', 'tab', 'menuitem', 'option', 'combobox', 'textbox', 'slider', 'listbox', 'searchbox', 'spinbutton']);
  const TEXT_TAGS = new Set(['P', 'LI', 'LABEL', 'SPAN', 'DIV', 'TD', 'TH', 'DT', 'DD', 'SMALL', 'STRONG', 'EM', 'LEGEND', 'FIGCAPTION', 'B', 'I']);

  const clean = (t) => (t || '').replace(/\s+/g, ' ').trim();
  const style = (el) => getComputedStyle(el);
  const visible = (el) => {
    const s = style(el);
    if (s.display === 'none' || s.visibility === 'hidden' || Number(s.opacity) === 0) return false;
    const r = el.getBoundingClientRect();
    return r.width > 0 && r.height > 0;
  };
  const byId = (el, id) => el.getRootNode().getElementById?.(id) || document.getElementById(id);
  const accName = (el) => {
    const lb = el.getAttribute('aria-labelledby');
    if (lb) {
      const t = lb.split(/\s+/).map((id) => byId(el, id)?.textContent || '').join(' ');
      if (clean(t)) return clean(t);
    }
    if (el.getAttribute('aria-label')) return clean(el.getAttribute('aria-label'));
    if (el.id) {
      const l = el.getRootNode().querySelector?.(`label[for="${CSS.escape(el.id)}"]`);
      if (l && clean(l.textContent)) return clean(l.textContent);
    }
    const wrap = el.closest('label');
    if (wrap && clean(wrap.textContent)) return clean(wrap.textContent);
    if (el.tagName === 'IMG') return clean(el.getAttribute('alt'));
    if (el.tagName === 'INPUT' && ['submit', 'button', 'reset'].includes(el.type)) return clean(el.value);
    if (el.tagName === 'FIELDSET') return clean(el.querySelector('legend')?.textContent);
    if (!['INPUT', 'TEXTAREA', 'SELECT'].includes(el.tagName)) {
      const txt = clean(el.innerText || el.textContent);
      if (txt) return txt;
      const img = el.querySelector('img[alt], svg title');
      if (img) return clean(img.getAttribute?.('alt') || img.textContent);
    }
    return clean(el.getAttribute('title')) || clean(el.getAttribute('placeholder')) || '';
  };
  const roleOf = (el) => {
    const r = el.getAttribute('role');
    if (r) return r;
    const t = el.tagName;
    if (t === 'A' && el.hasAttribute('href')) return 'link';
    if (t === 'BUTTON' || t === 'SUMMARY') return 'button';
    if (t === 'SELECT') return 'combobox';
    if (t === 'TEXTAREA') return 'textbox';
    if (t === 'INPUT') {
      const ty = el.type;
      if (['checkbox', 'radio'].includes(ty)) return ty;
      if (['submit', 'button', 'reset', 'image'].includes(ty)) return 'button';
      if (ty === 'range') return 'slider';
      return 'textbox';
    }
    if (/^H[1-6]$/.test(t)) return `heading h${t[1]}`;
    if (t === 'IMG') return 'img';
    return 'text';
  };
  const isPointerOnly = (el) => {
    if (NATIVE.has(el.tagName) || el.hasAttribute('tabindex') || el.isContentEditable) return false;
    if (ROLE_INTERACTIVE.has(el.getAttribute('role'))) return false;
    if (style(el).cursor !== 'pointer') return false;
    // Only the outermost pointer element of a pointer subtree counts.
    const p = el.parentElement;
    return !(p && style(p).cursor === 'pointer' && !NATIVE.has(p.tagName));
  };
  const focusable = (el) => el.tabIndex >= 0 && !el.disabled;
  const hitBox = (el) => {
    // A checkbox or radio is hit through its label too; measure both.
    const r = el.getBoundingClientRect();
    const label = el.labels?.[0];
    if (!label) return r;
    const l = label.getBoundingClientRect();
    const left = Math.min(r.left, l.left);
    const top = Math.min(r.top, l.top);
    return { left, top, width: Math.max(r.right, l.right) - left, height: Math.max(r.bottom, l.bottom) - top, bottom: Math.max(r.bottom, l.bottom), right: Math.max(r.right, l.right) };
  };

  // Element walk in document order, descending into open shadow roots.
  const picked = [];
  let skipped = 0;
  const visit = (root, hidden, faded) => {
    for (const el of root.children) {
      if (el.inert) continue;
      const transparent = faded || Number(style(el).opacity) === 0;
      const ariaHidden = hidden || el.getAttribute('aria-hidden') === 'true';
      // Content hidden from assistive tech is invisible to a keyboard/screen-reader persona.
      const skipSelf = keyboard && ariaHidden;
      if (!visible(el) && !el.shadowRoot && style(el).display === 'none') continue;
      const tag = el.tagName;
      const role = el.getAttribute('role');
      const interactive = (NATIVE.has(tag) && !(tag === 'A' && !el.hasAttribute('href'))) || ROLE_INTERACTIVE.has(role) || (el.hasAttribute('tabindex') && el.tabIndex >= 0);
      const shown = !skipSelf && !transparent && visible(el);
      const pointerOnly = shown && !interactive && isPointerOnly(el);
      const heading = /^H[1-6]$/.test(tag);
      const live = ['alert', 'status', 'dialog', 'alertdialog'].includes(role) || el.hasAttribute('aria-live') || (tag === 'DIALOG' && el.open);
      const leafText = !interactive && !pointerOnly && !heading && TEXT_TAGS.has(tag)
        && [...el.childNodes].some((c) => c.nodeType === 3 && clean(c.textContent).length > 1)
        && !el.closest('a,button,label');
      const img = tag === 'IMG' && !el.closest('a,button');
      const take = shown && (interactive || pointerOnly || heading || live || leafText || img);
      if (take) {
        if (picked.length < maxElements) picked.push({ el, interactive, pointerOnly, live });
        else skipped += 1;
      }
      if (!(take && (interactive || pointerOnly))) visit(el, ariaHidden, transparent);
      if (el.shadowRoot) visit(el.shadowRoot, ariaHidden, transparent);
    }
  };
  visit(document.body, false, false);

  const items = picked.map(({ el, interactive, pointerOnly, live }) => {
    let ref = el.getAttribute('data-ut-ref');
    if (!ref) {
      ref = `e${window.__utNext++}`;
      el.setAttribute('data-ut-ref', ref);
    }
    const r = el.getBoundingClientRect();
    const role = pointerOnly ? 'clickable' : roleOf(el);
    const flags = [];
    let name = accName(el);
    const ownName = el.getAttribute('aria-label') || el.getAttribute('aria-labelledby') || (el.id && el.getRootNode().querySelector?.(`label[for="${CSS.escape(el.id)}"]`)) || el.closest('label');
    if ((interactive || pointerOnly) && !name) flags.push('unlabeled');
    if (['INPUT', 'TEXTAREA'].includes(el.tagName) && !ownName && el.getAttribute('placeholder')) flags.push('placeholder-only label');
    if (pointerOnly) flags.push('not keyboard-reachable');
    if (interactive && !focusable(el) && !el.disabled) flags.push('not focusable');
    if (el.disabled || el.getAttribute('aria-disabled') === 'true') flags.push('disabled');
    if (el.type === 'checkbox' || el.type === 'radio') flags.push(el.checked ? 'checked' : 'unchecked');
    else if (el.getAttribute('aria-checked')) flags.push(el.getAttribute('aria-checked') === 'true' ? 'checked' : 'unchecked');
    if (el.getAttribute('aria-expanded')) flags.push(`expanded=${el.getAttribute('aria-expanded')}`);
    if (el.getAttribute('aria-invalid') === 'true') flags.push('invalid');
    if (el.required || el.getAttribute('aria-required') === 'true') flags.push('required');
    const hb = hitBox(el);
    if ((interactive || pointerOnly) && mobile && (hb.width < 44 || hb.height < 44)) flags.push(`small target ${Math.round(hb.width)}x${Math.round(hb.height)}`);
    const offscreen = r.bottom < seen.top || r.top > seen.top + seen.height || r.right < seen.left || r.left > seen.left + seen.width;
    let value;
    if (['INPUT', 'TEXTAREA'].includes(el.tagName) && !['checkbox', 'radio', 'submit', 'button', 'reset', 'image'].includes(el.type)) value = el.value;
    if (el.tagName === 'SELECT') value = el.options[el.selectedIndex]?.text;
    const placeholder = el.getAttribute?.('placeholder') || undefined;
    if (name.length > 120) name = `${name.slice(0, 117)}...`;
    return {
      ref, role, name, value, placeholder, flags, offscreen, live,
      action: ['button', 'link', 'clickable'].includes(role),
      inThumbZone: mobile ? r.top - seen.top > seen.height * 0.45 : undefined,
    };
  });

  let f = document.activeElement;
  while (f?.shadowRoot?.activeElement) f = f.shadowRoot.activeElement;
  let focused = null;
  if (f && f !== document.body && f !== document.documentElement) {
    const s = style(f);
    const ring = (s.outlineStyle !== 'none' && parseFloat(s.outlineWidth) > 0) || (s.boxShadow && s.boxShadow !== 'none');
    focused = { ref: f.getAttribute('data-ut-ref'), role: roleOf(f), name: accName(f).slice(0, 80), focusRingVisible: !!ring, tag: f.tagName, type: f.type || null };
  }
  const frames = [...document.querySelectorAll('iframe')].filter(visible).map((fr) => fr.title || fr.name || fr.getAttribute('src') || 'untitled');
  const doc = document.documentElement;
  const formState = [...document.querySelectorAll('input,select,textarea')].map((e) => (e.type === 'checkbox' || e.type === 'radio' ? e.checked : e.value)).join('|');
  const ariaState = [...document.querySelectorAll('[aria-expanded],[aria-checked],[aria-selected],[aria-pressed],[aria-hidden],details,dialog')]
    .map((e) => [e.getAttribute('aria-expanded'), e.getAttribute('aria-checked'), e.getAttribute('aria-selected'), e.getAttribute('aria-pressed'), e.getAttribute('aria-hidden'), e.open].join(',')).join('|');
  return {
    title: document.title,
    url: location.href,
    items,
    skipped,
    nextRef: window.__utNext,
    focused,
    scroll: [Math.round(vv ? vv.pageTop : scrollY), Math.round(doc.scrollHeight)],
    viewport: [Math.round(seen.width), Math.round(seen.height)],
    // Mobile emulation widens the layout viewport to fit wide content, so compare
    // against the device's width, not innerWidth.
    horizontalOverflow: Math.max(doc.scrollWidth, vw) > deviceWidth + 2,
    contentWidth: Math.max(doc.scrollWidth, vw),
    frames,
    mutations: window.__utMut || 0,
    stateKey: `${document.body.innerText || ''}#${formState}#${ariaState}`,
    bodyText: (document.body.innerText || '').slice(0, 50000),
  };
}
