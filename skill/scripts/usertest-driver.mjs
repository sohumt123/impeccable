#!/usr/bin/env node
// usertest-driver: the browser a persona runner drives during `/impeccable usertest`.
//
// One driver daemon per run directory. The PARENT calls `start` with the
// persona's profile and the goal's success check; the runner only ever gets
// the run directory and the action verbs, so it cannot read or change either.
// The daemon writes the ground-truth trace (trace.jsonl, step-NN.png) itself,
// and the success check lives in <session>/_sealed/, outside the run directory.
//
//   node usertest-driver.mjs preflight
//   node usertest-driver.mjs start --run <dir> --url <url> [profile flags]      (parent)
//   node usertest-driver.mjs <verb> --run <dir> [args]                          (runner)
//   node usertest-driver.mjs stopall <session-dir>                              (parent)
//   node usertest-driver.mjs summarize <session-dir> [--html]                   (parent)
//
// Profile flags:
//   --viewport desktop|mobile   --input pointer|keyboard   --network fast|slow
//   --budget <n actions>        --success-text <text>       --success-url <path or #hash fragment>
//   --goal <text>  --persona <name>  --tier <label>  --storage-state <file>  --allow-remote

import { spawn } from 'node:child_process';
import { createHash, randomBytes } from 'node:crypto';
import fs from 'node:fs';
import http from 'node:http';
import { createRequire } from 'node:module';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const SELF = fileURLToPath(import.meta.url);
const PW_VERSION = '1.59.1';
const PW_PREFIX = path.join(os.homedir(), '.impeccable', 'usertest');
const AUTH_DIR = path.join(PW_PREFIX, 'auth');
const IDLE_MS = 15 * 60 * 1000;
const MAX_ELEMENTS = 140;
const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '::1', '[::1]']);
const POINTER_VERBS = new Set(['click', 'fill', 'select']);
const COUNTED = new Set(['click', 'fill', 'select', 'press', 'type', 'scroll', 'back', 'reload', 'interrupt']);

const ADVERSARIAL = {
  long: 'A'.repeat(260),
  emoji: 'Test 🧪 émoji 名前',
  rtl: 'مرحبا بالعالم',
  html: '<b>x</b>"\'; DROP TABLE',
  spaces: '   ',
};

// ---------------------------------------------------------------- args

function parseArgs(argv) {
  const out = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith('--')) {
      const key = a.slice(2);
      const next = argv[i + 1];
      if (next === undefined || next.startsWith('--')) out[key] = true;
      else { out[key] = next; i++; }
    } else out._.push(a);
  }
  return out;
}

function fail(msg, code = 1) {
  process.stderr.write(`${msg}\n`);
  process.exit(code);
}

const isLocal = (host) => LOCAL_HOSTS.has(host) || host.endsWith('.localhost');
const within = (file, dir) => {
  const rel = path.relative(dir, file);
  return rel && !rel.startsWith('..') && !path.isAbsolute(rel);
};
const sealedPath = (runDir) => path.join(path.dirname(runDir), '_sealed', `${path.basename(runDir)}.json`);

// ---------------------------------------------------------------- playwright

async function loadPlaywright() {
  const bases = [path.join(process.cwd(), 'package.json'), SELF, path.join(PW_PREFIX, 'package.json')];
  for (const base of bases) {
    for (const name of ['playwright', 'playwright-core']) {
      try {
        const mod = await import(createRequire(base).resolve(name));
        const pw = mod.chromium ? mod : mod.default;
        if (pw?.chromium) return pw;
      } catch {}
    }
  }
  return null;
}

function needsPlaywright() {
  return [
    'USERTEST_NEEDS_PLAYWRIGHT: no playwright package is resolvable from the project, the skill, or the usertest cache.',
    'Install it once into the cache (does not touch the project):',
    `  npm install --prefix ${PW_PREFIX} playwright@${PW_VERSION} && npx --prefix ${PW_PREFIX} playwright install chromium`,
  ].join('\n');
}

async function launchBrowser(pw) {
  const attempts = [{}, { channel: 'chrome' }, { channel: 'msedge' }];
  const errors = [];
  for (const opts of attempts) {
    try {
      return await pw.chromium.launch({ headless: true, ...opts });
    } catch (e) {
      errors.push(`${opts.channel || 'bundled'}: ${String(e.message).split('\n')[0]}`);
    }
  }
  throw new Error(`USERTEST_NO_BROWSER: ${errors.join(' | ')}\nRun: npx --prefix ${PW_PREFIX} playwright install chromium (or install Chrome)`);
}

// ---------------------------------------------------------------- in-page

// Installed before any page script runs: counts DOM mutations so an action
// that only toggles classes, ARIA, or styles still reads as an effect.
function mutationCounter() {
  window.__utMut = 0;
  const start = () => new MutationObserver((list) => { window.__utMut += list.length; })
    .observe(document, { subtree: true, childList: true, attributes: true, characterData: true });
  if (document.documentElement) start();
  else document.addEventListener('DOMContentLoaded', start, { once: true });
}

// Runs in the page. Tags every interactive or meaningful element with a ref and
// returns a reading-order list plus the facts the personas' red flags need.
function pageSnapshot({ maxElements, mobile, keyboard, nextRef, deviceWidth }) {
  // Refs are unique for the whole run (the counter survives navigation via
  // nextRef), so a ref from an old page can never name a new control.
  window.__utNext = Math.max(window.__utNext || 0, nextRef);
  const vw = window.innerWidth;
  const vh = window.innerHeight;
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
    const offscreen = r.bottom < 0 || r.top > vh || r.right < 0 || r.left > vw;
    let value;
    if (['INPUT', 'TEXTAREA'].includes(el.tagName) && !['checkbox', 'radio', 'submit', 'button', 'reset', 'image'].includes(el.type)) value = el.value;
    if (el.tagName === 'SELECT') value = el.options[el.selectedIndex]?.text;
    const placeholder = el.getAttribute?.('placeholder') || undefined;
    if (name.length > 120) name = `${name.slice(0, 117)}...`;
    return {
      ref, role, name, value, placeholder, flags, offscreen, live,
      action: ['button', 'link', 'clickable'].includes(role),
      inThumbZone: mobile ? r.top > vh * 0.45 : undefined,
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
    scroll: [Math.round(scrollY), Math.round(doc.scrollHeight)],
    viewport: [vw, vh],
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

// ---------------------------------------------------------------- daemon

async function serve(runDir, opts) {
  const pw = await loadPlaywright();
  if (!pw) fail(needsPlaywright(), 3);
  fs.mkdirSync(runDir, { recursive: true });
  const sealed = JSON.parse(fs.readFileSync(sealedPath(runDir), 'utf8'));
  const { profile } = sealed;
  const mobile = profile.viewport === 'mobile';
  const keyboard = profile.input === 'keyboard';
  const browser = await launchBrowser(pw);
  const device = mobile ? { ...(pw.devices?.['iPhone 13'] || {}), viewport: { width: 390, height: 844 } } : { viewport: { width: 1280, height: 800 } };
  delete device.defaultBrowserType;
  const context = await browser.newContext({ ...device, reducedMotion: 'no-preference', storageState: sealed.storageState || undefined });
  await context.addInitScript(mutationCounter);

  const pending = { console: [], pageErrors: [], network: [], dialogs: [], tabs: [] };
  // Requests the page is waiting on. Playwright's networkidle only covers the
  // initial load, so after an action the driver tracks fetches itself.
  const inflight = new Set();
  const LONG_LIVED = new Set(['websocket', 'eventsource', 'media', 'manifest', 'other']);
  const state = { step: 0, actions: 0, nextRef: 1, goalMetAt: null, done: null, last: null, startedAt: Date.now(), dialogPolicy: null, dialog: null, onDialog: null, pendingRun: null };
  let page;

  const attach = async (p) => {
    p.setDefaultTimeout(5000);
    p.setDefaultNavigationTimeout(profile.network === 'slow' ? 60000 : 15000);
    p.on('console', (m) => {
      if (m.type() !== 'error' || /\/favicon\.ico$/.test(m.location()?.url || '')) return;
      pending.console.push(m.text().slice(0, 300));
    });
    p.on('pageerror', (e) => pending.pageErrors.push(String(e.message).slice(0, 300)));
    p.on('request', (q) => { if (!LONG_LIVED.has(q.resourceType())) inflight.add(q); });
    p.on('requestfinished', (q) => inflight.delete(q));
    p.on('requestfailed', (q) => inflight.delete(q));
    p.on('response', (r) => { if (r.status() >= 400 && !/\/favicon\.ico$/.test(r.url())) pending.network.push(`${r.status()} ${r.request().method()} ${r.url()}`); });
    p.on('requestfailed', (r) => pending.network.push(`FAILED ${r.method()} ${r.url()} ${r.failure()?.errorText || ''}`));
    p.on('dialog', async (d) => {
      const type = d.type();
      // An alert has one button and an unload prompt is the browser's; answer those.
      // A confirm or prompt is the visitor's decision: hold it until the runner answers,
      // unless the runner chose a standing answer with `dialogs`.
      const auto = type === 'alert' || type === 'beforeunload' ? 'accept' : state.dialogPolicy;
      if (auto) {
        pending.dialogs.push({ type, message: d.message().slice(0, 200), how: auto });
        await (auto === 'accept' ? d.accept() : d.dismiss()).catch(() => {});
        return;
      }
      state.dialog = { d, type, message: d.message().slice(0, 200) };
      state.onDialog?.();
    });
    if (profile.network === 'slow') {
      try {
        const cdp = await context.newCDPSession(p);
        await cdp.send('Network.enable');
        await cdp.send('Network.emulateNetworkConditions', { offline: false, latency: 400, downloadThroughput: 50_000, uploadThroughput: 20_000 });
      } catch {}
    }
  };
  let ready = false;
  context.on('page', async (p) => {
    if (!ready || p === page) return;
    await attach(p);
    pending.tabs.push(p.url());
    page = p;
  });
  page = await context.newPage();
  await attach(page);
  ready = true;

  const trace = path.join(runDir, 'trace.jsonl');
  const append = (entry) => fs.appendFileSync(trace, `${JSON.stringify(entry)}\n`);

  const settle = async () => {
    await page.waitForLoadState('domcontentloaded', { timeout: profile.network === 'slow' ? 30000 : 8000 }).catch(() => {});
    // Quiet means no request in flight for 400ms; give up after the network's patience.
    const deadline = Date.now() + (profile.network === 'slow' ? 15000 : 6000);
    let quietSince = inflight.size ? null : Date.now();
    await page.waitForTimeout(150);
    while (Date.now() < deadline) {
      if (inflight.size) quietSince = null;
      else if (quietSince === null) quietSince = Date.now();
      else if (Date.now() - quietSince >= 400) break;
      await page.waitForTimeout(100);
    }
    await page.waitForTimeout(150);
  };
  const visibleText = () => page.evaluate(() => document.body?.innerText || '').catch(() => '');
  const snapshot = async () => {
    const snap = await page.evaluate(pageSnapshot, { maxElements: MAX_ELEMENTS, mobile, keyboard, nextRef: state.nextRef, deviceWidth: device.viewport.width });
    state.nextRef = snap.nextRef;
    return snap;
  };
  // Mutations per ms while nobody acts: ticking clocks and carousels are not effects.
  const noiseRate = async () => {
    const a = await page.evaluate(() => window.__utMut || 0).catch(() => 0);
    await page.waitForTimeout(250);
    const b = await page.evaluate(() => window.__utMut || 0).catch(() => 0);
    return { base: b, rate: Math.max(0, b - a) / 250 };
  };

  const pathOf = (url) => {
    try { const u = new URL(url); return `${u.pathname}${u.hash}`; } catch { return url; }
  };
  const checkGoal = (snap) => {
    if (state.goalMetAt !== null || !(sealed.successText || sealed.successUrl)) return;
    const textOk = !sealed.successText || snap.bodyText.toLowerCase().includes(sealed.successText.toLowerCase());
    const urlOk = !sealed.successUrl || pathOf(snap.url).includes(sealed.successUrl);
    if (textOk && urlOk) state.goalMetAt = state.step;
  };

  const record = async (action, args, extra = {}) => {
    if (COUNTED.has(action === 'tap' ? 'click' : action)) {
      if (state.actions >= profile.budget) throw new Error('BUDGET_EXHAUSTED: no actions left. Call done.');
      state.actions += 1;
    }
    const before = state.last;
    const noise = before ? (extra.skipNoise ? { base: before.mutations, rate: 0 } : await noiseRate()) : null;
    const t0 = Date.now();
    let error = null;
    const ran = Promise.resolve().then(() => extra.run?.()).then(() => 'ran', (e) => { error = String(e.message).split('\n')[0].slice(0, 240); return 'ran'; });
    const opened = new Promise((res) => { state.onDialog = () => res('dialog'); });
    if ((await Promise.race([ran, opened])) === 'dialog') {
      // The page is frozen behind the dialog: record the moment and hand the choice to the runner.
      state.onDialog = null;
      state.pendingRun = ran;
      state.step += 1;
      const { type, message } = state.dialog;
      append({ step: state.step, action, args, target: extra.target || null, targetRole: extra.role || null, effect: 'dialog', dead: false, error: null,
        url: page.url(), dialogs: [{ type, message, how: 'pending' }], console: [], pageErrors: [], network: [], tabs: [], warnings: extra.warnings || [], goalMet: state.goalMetAt !== null });
      return [`step ${state.step} · ${action}${extra.target ? ` ${extra.target}` : ''} · effect: a ${type} dialog opened`,
        `the dialog says: "${message}"`,
        type === 'prompt' ? 'answer it: `answer ok <text>` or `answer cancel`' : 'answer it: `answer ok` or `answer cancel`'].join('\n');
    }
    state.onDialog = null;
    // What a person would have seen while the page was still loading.
    const early = action === 'open' ? '' : await visibleText();
    const waitStart = Date.now();
    await settle();
    const waited = Date.now() - waitStart;
    let snap;
    try {
      snap = await snapshot();
    } catch {
      await settle();
      snap = await snapshot();
    }
    state.step += 1;
    const shot = path.join(runDir, `step-${String(state.step).padStart(2, '0')}.png`);
    await page.screenshot({ path: shot, scale: 'css' }).catch(() => {});
    let effect = 'initial';
    if (before) {
      const hash = (k) => createHash('sha1').update(k).digest('hex');
      const domDelta = snap.mutations - noise.base - noise.rate * (Date.now() - t0);
      if (snap.url !== before.url) effect = 'navigated';
      else if (hash(snap.stateKey) !== hash(before.stateKey)) effect = 'changed';
      // Clicking a control focuses it; that alone is not the control doing anything.
      else if ((snap.focused?.ref || null) !== (before.focused?.ref || null) && !(extra.ref && snap.focused?.ref === extra.ref)) effect = 'focus moved';
      else if (domDelta > 2) effect = 'changed';
      else effect = 'none';
    }
    checkGoal(snap);
    const finalLines = new Set(snap.bodyText.split('\n').map((l) => l.trim()));
    const transient = waited > 700 ? [...new Set(early.split('\n').map((l) => l.trim()))].filter((l) => l.length > 2 && l.length < 160 && !finalLines.has(l)).slice(0, 3) : [];
    // A dead action: a click on a control, or Enter/Space on a focused control, that changed nothing.
    const actionable = (role) => /^(button|link|clickable|checkbox|radio|combobox|menuitem|tab|switch)/.test(role || '');
    const dead = effect === 'none' && !error && (
      (['click', 'tap'].includes(action) && actionable(extra.role))
      || (action === 'press' && ['Enter', 'Space'].includes(args[0]) && actionable(before?.focused?.role)));
    const dialogs = pending.dialogs.splice(0);
    const tabs = pending.tabs.splice(0);
    const entry = {
      step: state.step, action, args, target: extra.target || (action === 'press' && before?.focused ? `[${before.focused.ref}] ${before.focused.role} "${before.focused.name}"` : null),
      targetRole: extra.role || null, effect, dead, error,
      url: snap.url, title: snap.title, ms: Date.now() - t0,
      console: pending.console.splice(0), pageErrors: pending.pageErrors.splice(0), network: pending.network.splice(0),
      dialogs, tabs, transient, waitedMs: waited, warnings: extra.warnings || [], focused: snap.focused, horizontalOverflow: snap.horizontalOverflow,
      goalMet: state.goalMetAt !== null, screenshot: path.basename(shot), frames: snap.frames, skipped: snap.skipped,
      contentWidth: snap.contentWidth,
      unlabeled: snap.items.filter((i) => i.flags.includes('unlabeled')).map((i) => `${i.ref} ${i.role}`),
      pointerOnly: snap.items.filter((i) => i.flags.includes('not keyboard-reachable')).map((i) => `${i.ref} "${i.name}"`),
      placeholderOnly: snap.items.filter((i) => i.flags.includes('placeholder-only label')).map((i) => `${i.ref} "${i.name}"`),
    };
    append(entry);
    state.last = snap;
    return render(entry, snap, shot);
  };

  // What the runner sees is what a visitor perceives. Diagnostics (console
  // errors, unlabeled or pointer-only controls, target sizes, focus rings) go
  // to the trace only; showing them would hand the runner the answers.
  const PERCEIVED = /^(checked|unchecked|disabled|invalid|required|expanded=)/;
  const render = (entry, snap, shot) => {
    const lines = [];
    lines.push(`step ${entry.step} · ${entry.action}${entry.target ? ` ${entry.target}` : ''} · effect: ${entry.effect}${entry.error ? ` · ERROR: ${entry.error}` : ''}`);
    lines.push(`page: "${snap.title}" ${snap.url}`);
    lines.push(`viewport ${snap.viewport.join('x')} · scrolled ${snap.scroll[0]}/${snap.scroll[1]} · actions left: ${profile.budget - state.actions}`);
    if (entry.action === 'interrupt') lines.push('you left the tab and came back to it later');
    if (entry.transient.length) lines.push(`while it loaded (${(entry.waitedMs / 1000).toFixed(1)}s), the page showed: ${entry.transient.map((t) => `"${t}"`).join(', ')}`);
    for (const t of entry.tabs) lines.push(`a new tab opened (${t}); you are now in it`);
    for (const d of entry.dialogs) lines.push(`a ${d.type} dialog said: "${d.message}" (${d.how === 'accept' ? (d.type === 'alert' ? 'it closed with OK' : 'you pressed OK') : 'you pressed Cancel'})`);
    for (const fr of snap.frames) lines.push(`embedded frame "${String(fr).slice(0, 80)}": its contents are not listed here; read the screenshot to see it`);
    if (snap.focused) lines.push(`focused: [${snap.focused.ref || '?'}] ${snap.focused.role === 'clickable' ? 'text' : snap.focused.role} "${snap.focused.name}"`);
    else if (keyboard) lines.push('focused: nothing (document body)');
    lines.push(keyboard ? 'elements (reading order; you can only reach these with the keyboard; * = outside viewport):' : 'elements (reading order; * = outside viewport):');
    for (const it of snap.items) {
      // A pointer-only control reads as plain text to a keyboard or screen-reader user.
      const role = it.role === 'clickable' ? (keyboard ? 'text' : 'clickable') : it.role;
      const parts = [`${it.offscreen ? '*' : ' '}[${it.ref}] ${role}`];
      parts.push(it.name ? `"${it.name}"` : '""');
      if (it.value !== undefined) parts.push(`value="${String(it.value).slice(0, 60)}"`);
      if (it.placeholder && !it.value) parts.push(`placeholder="${it.placeholder}"`);
      const flags = it.flags.filter((f) => PERCEIVED.test(f));
      if (flags.length) parts.push(`(${flags.join(', ')})`);
      if (it.live) parts.push('[live region]');
      lines.push(parts.join(' '));
    }
    if (snap.skipped) lines.push(`... ${snap.skipped} more elements not listed; scroll to bring them into view`);
    lines.push(`screenshot: ${shot}`);
    if (state.actions >= profile.budget) lines.push('BUDGET_EXHAUSTED: no actions left. Call `done` now.');
    return lines.join('\n');
  };

  const locate = (ref) => {
    if (!ref || !/^e\d+$/.test(ref)) throw new Error(`expected an element ref like e12, got "${ref}"`);
    const item = state.last?.items.find((i) => i.ref === ref);
    if (!item) throw new Error(`no element ${ref} on the current page; use a ref from the latest observation`);
    return { loc: page.locator(`[data-ut-ref="${ref}"]`).first(), item };
  };
  const describe = (item) => `[${item.ref}] ${item.role} "${item.name}"`;
  const pointerWarnings = (item) => {
    const w = [];
    const small = item.flags.find((f) => f.startsWith('small target'));
    if (mobile && small) w.push(`tapped a small target: ${describe(item)} ${small}`);
    if (mobile && item.action && item.inThumbZone === false) w.push(`action sits in the top of the screen, outside the thumb zone: ${describe(item)}`);
    if (item.flags.includes('unlabeled')) w.push(`acted on an unlabeled control: ${describe(item)}`);
    return w;
  };
  const resolveText = (text) => (text.startsWith('@') && ADVERSARIAL[text.slice(1)] ? ADVERSARIAL[text.slice(1)] : text);

  const verbs = {
    async observe() { return record('observe', []); },
    async click({ _: [ref] }) {
      const { loc, item } = locate(ref);
      return record(mobile ? 'tap' : 'click', [ref], { target: describe(item), role: item.role, ref, warnings: pointerWarnings(item), run: () => (mobile ? loc.tap() : loc.click()) });
    },
    async fill({ _: [ref, ...rest] }) {
      const { loc, item } = locate(ref);
      let text = resolveText(rest.join(' '));
      // A native date field takes ISO values; a person would use its picker, so accept what they would type.
      const kind = await loc.evaluate((el) => (el.tagName === 'INPUT' ? el.type : '')).catch(() => '');
      if (['date', 'datetime-local', 'month'].includes(kind) && !/^\d{4}-\d{2}/.test(text)) {
        const t = new Date(text);
        if (!Number.isNaN(t.getTime())) {
          const iso = `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}-${String(t.getDate()).padStart(2, '0')}`;
          text = kind === 'month' ? iso.slice(0, 7) : kind === 'datetime-local' ? `${iso}T${String(t.getHours()).padStart(2, '0')}:${String(t.getMinutes()).padStart(2, '0')}` : iso;
        }
      }
      return record('fill', [ref, text.slice(0, 80)], { target: describe(item), role: item.role, ref, warnings: pointerWarnings(item), run: () => loc.fill(text) });
    },
    async select({ _: [ref, ...rest] }) {
      const { loc, item } = locate(ref);
      const label = rest.join(' ');
      return record('select', [ref, label], { target: describe(item), role: item.role, ref, run: () => loc.selectOption({ label }).catch(() => loc.selectOption(label)) });
    },
    async press({ _: [key] }) {
      if (!key) throw new Error('press needs a key, e.g. Tab, Shift+Tab, Enter, Space, Escape, ArrowDown');
      return record('press', [key], { run: () => page.keyboard.press(key === 'Space' ? ' ' : key) });
    },
    async type({ _: rest }) {
      const text = resolveText(rest.join(' '));
      return record('type', [text.slice(0, 80)], { run: () => page.keyboard.type(text, { delay: 5 }) });
    },
    async scroll({ _: [dir] }) {
      if (dir && /^e\d+$/.test(dir)) {
        const { loc, item } = locate(dir);
        return record('scroll', [dir], { target: describe(item), run: () => loc.scrollIntoViewIfNeeded() });
      }
      const dy = (dir === 'up' ? -0.8 : 0.8) * (mobile ? 844 : 800);
      return record('scroll', [dir || 'down'], { run: () => page.evaluate((y) => window.scrollBy(0, y), Math.round(dy)) });
    },
    async back() { return record('back', [], { run: () => page.goBack() }); },
    async reload() { return record('reload', [], { run: () => page.reload() }); },
    async interrupt() {
      // Leave for another app and come back: the tab is discarded and restored.
      const url = page.url();
      return record('interrupt', [], { warnings: ['simulated leaving mid-flow: page was unloaded and reopened at the same URL'], run: async () => { await page.goto('about:blank'); await page.waitForTimeout(500); await page.goto(url); } });
    },
    async answer({ _: [choice, ...rest] }) {
      if (!state.dialog) throw new Error('no dialog is open');
      if (!['ok', 'cancel'].includes(choice)) throw new Error('answer needs ok or cancel');
      const { d, type, message } = state.dialog;
      pending.dialogs.push({ type, message, how: choice === 'ok' ? 'accept' : 'dismiss' });
      return record('answer', [choice], {
        skipNoise: true,
        run: async () => {
          await (choice === 'ok' ? d.accept(rest.join(' ') || undefined) : d.dismiss()).catch(() => {});
          state.dialog = null;
          await Promise.race([state.pendingRun, page.waitForTimeout(8000)]);
          state.pendingRun = null;
        },
      });
    },
    async dialogs({ _: [how] }) {
      if (!['accept', 'dismiss', 'ask'].includes(how)) throw new Error('dialogs needs accept, dismiss, or ask');
      state.dialogPolicy = how === 'ask' ? null : how;
      return how === 'ask' ? 'you will be asked about each confirm or prompt dialog' : `confirm and prompt dialogs will now be ${how === 'accept' ? 'accepted (OK)' : 'dismissed (Cancel)'} without asking`;
    },
    async 'save-state'({ _: [file] }) {
      const target = path.resolve(file || '');
      if (!file || !(within(target, path.dirname(runDir)) || within(target, AUTH_DIR))) {
        throw new Error(`save-state writes only inside the session directory or ${AUTH_DIR}`);
      }
      fs.mkdirSync(path.dirname(target), { recursive: true });
      await context.storageState({ path: target });
      fs.chmodSync(target, 0o600);
      return `saved cookies and storage to ${target}`;
    },
    async note({ _: rest, kind }) {
      const text = rest.join(' ');
      append({ step: state.step, action: 'note', kind: kind || 'friction', text, url: page.url(), screenshot: `step-${String(state.step).padStart(2, '0')}.png` });
      return `noted at step ${state.step}`;
    },
    async done({ outcome, _: rest }) {
      const allowed = ['completed', 'abandoned', 'blocked', 'unsure'];
      if (!allowed.includes(outcome)) throw new Error(`done needs --outcome ${allowed.join('|')}`);
      // A confirmation that renders after the last settle still counts.
      if (!state.dialog) {
        await settle();
        checkGoal(await snapshot().catch(() => state.last));
      }
      finish(outcome, rest.join(' '));
      return `recorded: claimed ${outcome}`;
    },
  };

  const finish = (claimed, summary) => {
    if (state.done) return;
    state.done = {
      claimed, summary,
      verified: sealed.successText || sealed.successUrl ? state.goalMetAt !== null : null,
      goalMetAtStep: state.goalMetAt, steps: state.step, actions: state.actions,
      seconds: Math.round((Date.now() - state.startedAt) / 1000),
    };
    fs.writeFileSync(path.join(path.dirname(sealedPath(runDir)), `${path.basename(runDir)}.result.json`), JSON.stringify(state.done, null, 2));
    fs.writeFileSync(path.join(runDir, 'result.json'), JSON.stringify({ claimed, summary, steps: state.step, actions: state.actions }, null, 2));
  };

  let idle;
  const touch = () => { clearTimeout(idle); idle = setTimeout(() => shutdown('idle'), IDLE_MS); };
  async function shutdown(reason) {
    if (!state.done) finish('none', `run ended without done (${reason})`);
    try { fs.rmSync(path.join(runDir, 'driver.json'), { force: true }); } catch {}
    await browser.close().catch(() => {});
    process.exit(0);
  }
  touch();
  // In tests, die with the owner so no browser outlives a killed test runner.
  const owner = Number(process.env.USERTEST_OWNER_PID);
  if (owner) setInterval(() => { try { process.kill(owner, 0); } catch { shutdown('owner exited'); } }, 2000).unref();

  const token = randomBytes(24).toString('hex');
  let queue = Promise.resolve();
  const server = http.createServer((req, res) => {
    // Only the CLI client may drive the run: no browser origin, a JSON body, and the token.
    if (req.method !== 'POST' || req.headers.origin || req.headers['sec-fetch-site']
      || !String(req.headers['content-type']).startsWith('application/json') || req.headers['x-usertest-token'] !== token) {
      res.statusCode = 403;
      return res.end('forbidden');
    }
    let body = '';
    req.on('data', (c) => (body += c));
    req.on('end', () => {
      touch();
      // One verb at a time: a chained call never interleaves with the last.
      queue = queue.then(async () => {
        let out;
        let code = 200;
        let verb;
        try {
          const parsed = JSON.parse(body || '{}');
          verb = parsed.verb;
          const args = parsed.args || {};
          if (verb === 'ping') return res.end('pong');
          if (verb === 'stop') {
            res.end('stopped');
            return shutdown('stop');
          }
          const fn = verbs[verb];
          if (!fn) throw new Error(`unknown verb "${verb}"`);
          if (state.done && verb !== 'note' && verb !== 'save-state') throw new Error('run already finished with done');
          if (state.dialog && !['answer', 'note', 'done'].includes(verb)) throw new Error(`a ${state.dialog.type} dialog is open: "${state.dialog.message}". Use answer ok or answer cancel first`);
          if (keyboard && POINTER_VERBS.has(verb)) throw new Error(`KEYBOARD_ONLY: this persona cannot ${verb} with a pointer. Use press (Tab, Shift+Tab, Enter, Space, arrows) and type.`);
          out = await fn(args);
        } catch (e) {
          code = 400;
          out = `ERROR: ${String(e.message).split('\n')[0]}`;
          if (verb && verb !== 'done') append({ step: state.step, action: 'refused', verb, reason: out.slice(7, 240) });
        }
        res.statusCode = code;
        res.end(out);
      });
    });
  });

  server.listen(0, '127.0.0.1', async () => {
    const { port } = server.address();
    let first;
    try {
      await page.goto(profile.url, { waitUntil: 'domcontentloaded' });
      first = await record('open', [profile.url]);
    } catch (e) {
      first = `ERROR: could not open ${profile.url}: ${String(e.message).split('\n')[0]}`;
    }
    const info = path.join(runDir, 'driver.json');
    fs.writeFileSync(info, JSON.stringify({ port, pid: process.pid, token }), { mode: 0o600 });
    fs.writeFileSync(path.join(runDir, 'first.txt'), first);
  });
}

// ---------------------------------------------------------------- client

function post(info, verb, args) {
  return new Promise((resolve, reject) => {
    const req = http.request({
      host: '127.0.0.1', port: info.port, method: 'POST', path: '/',
      headers: { 'content-type': 'application/json', 'x-usertest-token': info.token },
    }, (res) => {
      let data = '';
      res.on('data', (c) => (data += c));
      res.on('end', () => resolve({ code: res.statusCode, data }));
    });
    req.on('error', reject);
    req.setTimeout(120000, () => req.destroy(new Error('driver timed out')));
    req.end(JSON.stringify({ verb, args }));
  });
}

function readInfo(runDir) {
  const file = path.join(runDir, 'driver.json');
  return fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8')) : null;
}

async function alive(info) {
  if (!info) return false;
  try { return (await post(info, 'ping', {})).data === 'pong'; } catch { return false; }
}

async function start(opts) {
  if (!opts.run || !opts.url) fail('start needs --run <dir> --url <url>');
  let host;
  try { host = new URL(opts.url).hostname; } catch { fail(`not a URL: ${opts.url}`); }
  // Runners click everything. Against a deployed site that means real orders,
  // emails, and deletions, so anything off this machine needs explicit consent.
  const remote = !isLocal(host);
  if (remote && !opts['allow-remote']) {
    fail(`USERTEST_REMOTE_TARGET: ${host} is not local. Runners take real actions (orders, emails, deletes). Get the user's explicit consent for this host, then pass --allow-remote.`, 4);
  }
  const runDir = path.resolve(opts.run);
  const existing = readInfo(runDir);
  if (await alive(existing)) fail(`a driver is already running for ${runDir}; stop it first`, 2);
  if (fs.existsSync(path.join(runDir, 'trace.jsonl'))) fail(`${runDir} already holds a run; use a new directory (for a retry, <name>-r2) so earlier evidence survives`, 2);
  let storageState = null;
  if (opts['storage-state']) {
    storageState = path.resolve(opts['storage-state']);
    if (!fs.existsSync(storageState)) fail(`storage state ${storageState} does not exist; sign in and save-state first`, 2);
  }
  fs.mkdirSync(runDir, { recursive: true });
  fs.rmSync(path.join(runDir, 'driver.json'), { force: true });
  fs.rmSync(path.join(runDir, 'first.txt'), { force: true });
  const profile = {
    goal: opts.goal || '',
    persona: opts.persona || '',
    tier: opts.tier || '',
    url: opts.url,
    viewport: opts.viewport === 'mobile' ? 'mobile' : 'desktop',
    input: opts.input === 'keyboard' ? 'keyboard' : 'pointer',
    network: opts.network === 'slow' ? 'slow' : 'fast',
    budget: Number(opts.budget) || 30,
  };
  const sealed = {
    profile,
    successText: typeof opts['success-text'] === 'string' ? opts['success-text'] : null,
    successUrl: typeof opts['success-url'] === 'string' ? opts['success-url'] : null,
    storageState,
    remote,
  };
  fs.mkdirSync(path.dirname(sealedPath(runDir)), { recursive: true });
  fs.writeFileSync(sealedPath(runDir), JSON.stringify(sealed, null, 2), { mode: 0o600 });
  fs.writeFileSync(path.join(runDir, 'profile.json'), JSON.stringify(profile, null, 2));
  const log = fs.openSync(path.join(runDir, 'driver.log'), 'a');
  const child = spawn(process.execPath, [SELF, '__serve', '--run', runDir], { detached: true, stdio: ['ignore', log, log] });
  child.unref();
  const deadline = Date.now() + 90000;
  while (Date.now() < deadline) {
    if (fs.existsSync(path.join(runDir, 'first.txt'))) {
      process.stdout.write(`${fs.readFileSync(path.join(runDir, 'first.txt'), 'utf8')}\n`);
      return;
    }
    if (child.exitCode !== null) break;
    await new Promise((r) => setTimeout(r, 200));
  }
  fail(`driver did not start; see ${path.join(runDir, 'driver.log')}\n${fs.existsSync(path.join(runDir, 'driver.log')) ? fs.readFileSync(path.join(runDir, 'driver.log'), 'utf8').slice(-1200) : ''}`, 2);
}

async function client(verb, opts) {
  if (!opts.run) fail(`${verb} needs --run <dir>`);
  const info = readInfo(path.resolve(opts.run));
  if (!info) fail(`no driver running for ${opts.run}; the parent starts it`, 2);
  const { run, ...args } = opts;
  try {
    const { code, data } = await post(info, verb, args);
    process.stdout.write(`${data}\n`);
    if (code !== 200) process.exitCode = 1;
  } catch (e) {
    fail(`driver unreachable: ${e.message}`, 2);
  }
}

async function stopAll(sessionDir) {
  const root = path.resolve(sessionDir || '.');
  if (!fs.existsSync(root)) fail(`no session at ${root}`);
  let stopped = 0;
  let stale = 0;
  for (const d of fs.readdirSync(root)) {
    const info = readInfo(path.join(root, d));
    if (!info) continue;
    try {
      await post(info, 'stop', {});
      stopped += 1;
    } catch {
      // Unreachable means already gone (an unverified pid is never killed); clear the record.
      fs.rmSync(path.join(root, d, 'driver.json'), { force: true });
      stale += 1;
    }
  }
  process.stdout.write(`stopped ${stopped} driver(s)${stale ? `, cleared ${stale} stale record(s)` : ''}\n`);
}

async function preflight() {
  const pw = await loadPlaywright();
  if (!pw) fail(needsPlaywright(), 3);
  try {
    const b = await launchBrowser(pw);
    const v = b.version();
    await b.close();
    process.stdout.write(`USERTEST_READY: playwright ok, browser ${v}\n`);
  } catch (e) {
    fail(e.message, 3);
  }
}

// ---------------------------------------------------------------- summarize

function readRun(dir) {
  const trace = path.join(dir, 'trace.jsonl');
  const sealedFile = sealedPath(dir);
  if (!fs.existsSync(trace) || !fs.existsSync(sealedFile)) return null;
  const sealed = JSON.parse(fs.readFileSync(sealedFile, 'utf8'));
  const { profile } = sealed;
  if (!profile.persona) return null; // setup runs (sign-in) are not part of the matrix
  const entries = fs.readFileSync(trace, 'utf8').split('\n').filter(Boolean).map((l) => JSON.parse(l));
  const resultFile = sealedFile.replace(/\.json$/, '.result.json');
  const result = fs.existsSync(resultFile) ? JSON.parse(fs.readFileSync(resultFile, 'utf8')) : null;
  const steps = entries.filter((e) => !['note', 'refused'].includes(e.action));
  const notes = entries.filter((e) => e.action === 'note');
  const refused = entries.filter((e) => e.action === 'refused');
  const deadActions = steps.filter((e) => e.dead);
  const errors = steps.flatMap((e) => [...e.console, ...e.pageErrors].map((m) => ({ step: e.step, msg: m })));
  const network = steps.flatMap((e) => e.network.map((m) => ({ step: e.step, msg: m })));
  const warnings = steps.flatMap((e) => e.warnings.map((m) => ({ step: e.step, msg: m })));
  const actionErrors = steps.filter((e) => e.error).map((e) => ({ step: e.step, msg: `${e.action} ${e.target || e.args.join(' ')}: ${e.error}` }));
  const noRing = profile.input === 'keyboard' ? steps.filter((e) => e.focused && !e.focused.focusRingVisible).map((e) => ({ step: e.step, msg: `${e.focused.role} "${e.focused.name}"` })) : [];
  const firstSeen = (key) => {
    const seen = new Map();
    for (const e of steps) for (const v of e[key] || []) if (!seen.has(v)) seen.set(v, e.step);
    return [...seen].map(([msg, step]) => ({ step, msg }));
  };
  const pointerOnly = firstSeen('pointerOnly');
  const unlabeled = firstSeen('unlabeled');
  const overflow = steps.filter((e) => e.horizontalOverflow).slice(0, 1).map((e) => ({ step: e.step, msg: `page is ${e.contentWidth || 'wider than'}px wide on a ${profile.viewport} screen; it scrolls sideways` }));
  const placeholderOnly = firstSeen('placeholderOnly');
  const dialogs = steps.flatMap((e) => (e.dialogs || []).map((d) => ({ step: e.step, msg: `${d.type} "${d.message}" (${d.how})` })));
  const goalMet = result?.goalMetAtStep != null || steps.some((e) => e.goalMet);
  const hasCriterion = !!(sealed.successText || sealed.successUrl);
  return { dir, name: path.basename(dir), profile, result, hasCriterion, steps, notes, refused, deadActions, errors, network, warnings, actionErrors, noRing, pointerOnly, unlabeled, overflow, placeholderOnly, dialogs, goalMet };
}

// One vocabulary for the matrix, the HTML, and the playbook.
const VERDICTS = {
  pass: 'goal verified and the runner said it was done',
  'pass-unclaimed': 'goal verified, but the runner did not believe it was done (missing confirmation)',
  'false-success': 'the runner said it was done; the goal was not met',
  fail: 'the runner stopped short; the goal was not met',
  unfinished: 'the run ended without done (crash, turn limit, or idle) and the goal was not met',
  unverified: 'no success check for this goal; the runner\'s claim stands alone',
};

function verdict(r) {
  const claimed = r.result?.claimed || 'none';
  if (!r.hasCriterion) return 'unverified';
  if (r.goalMet) return claimed === 'completed' ? 'pass' : 'pass-unclaimed';
  if (claimed === 'completed') return 'false-success';
  return claimed === 'none' ? 'unfinished' : 'fail';
}

function summarize(sessionDir, { html }) {
  const root = path.resolve(sessionDir);
  if (!fs.existsSync(root)) fail(`no session at ${root}`);
  const runs = fs.readdirSync(root).filter((d) => !d.startsWith('_')).map((d) => path.join(root, d))
    .filter((d) => fs.statSync(d).isDirectory()).map(readRun).filter(Boolean);
  if (!runs.length) fail(`no runs under ${root}`);
  const goals = [...new Set(runs.map((r) => r.profile.goal))];
  const lines = [`# Usertest summary: ${runs.length} runs`, '', 'Verdicts come from the driver\'s success check, not the runner\'s claim:', ''];
  for (const [k, v] of Object.entries(VERDICTS)) lines.push(`- **${k}**: ${v}`);
  lines.push('');
  for (const goal of goals) {
    lines.push(`## Goal: ${goal}`, '', '| run | persona | tier | verdict | claimed | met at step | actions | dead actions | js/network errors | refused |', '|---|---|---|---|---|---|---|---|---|---|');
    for (const r of runs.filter((x) => x.profile.goal === goal)) {
      lines.push(`| ${r.name} | ${r.profile.persona} | ${r.profile.tier} | ${verdict(r)} | ${r.result?.claimed || 'none'} | ${r.result?.goalMetAtStep ?? (r.goalMet ? '?' : '-')} | ${r.result?.actions ?? '-'} | ${r.deadActions.length} | ${r.errors.length + r.network.length} | ${r.refused.length} |`);
    }
    lines.push('');
  }
  lines.push('## Evidence by run', '');
  for (const r of runs) {
    lines.push(`### ${r.name} (${r.profile.persona}, ${r.profile.tier}, ${r.profile.viewport}, ${r.profile.input}): ${verdict(r)}`);
    if (r.result?.summary) lines.push(`runner: ${r.result.summary}`);
    lines.push(...evidence(r).map(([s, m]) => `- step ${s} ${m}`));
    if (!evidence(r).length) lines.push('- nothing recorded');
    lines.push('');
  }
  const md = lines.join('\n');
  fs.writeFileSync(path.join(root, 'summary.md'), md);
  const out = path.join(root, 'summary.html');
  if (html) fs.writeFileSync(out, renderHtml(runs, goals));
  process.stdout.on('error', () => {});
  process.stdout.write(`${md}\n${html ? `\nhtml: ${out}\n` : ''}`);
}

function evidence(r) {
  return [
    ...r.deadActions.map((e) => [e.step, `dead ${e.action}: ${e.target}`]),
    ...r.actionErrors.map((e) => [e.step, `action failed: ${e.msg}`]),
    ...r.errors.map((e) => [e.step, `js error: ${e.msg}`]),
    ...r.network.map((e) => [e.step, `network: ${e.msg}`]),
    ...r.dialogs.map((e) => [e.step, `dialog: ${e.msg}`]),
    ...r.steps.filter((e) => e.transient?.length).map((e) => [e.step, `shown while loading (${(e.waitedMs / 1000).toFixed(1)}s), then replaced: ${e.transient.map((t) => `"${t}"`).join(', ')}`]),
    ...r.warnings.map((e) => [e.step, e.msg]),
    ...r.pointerOnly.map((e) => [e.step, `pointer-only control on page: ${e.msg}`]),
    ...r.placeholderOnly.map((e) => [e.step, `field labeled only by placeholder: ${e.msg}`]),
    ...r.unlabeled.map((e) => [e.step, `control with no accessible name: ${e.msg}`]),
    ...r.overflow.map((e) => [e.step, e.msg]),
    ...r.noRing.map((e) => [e.step, `focus without visible ring: ${e.msg}`]),
    ...r.refused.map((e) => [e.step, `refused ${e.verb}: ${e.reason}`]),
    ...r.notes.map((n) => [n.step, `runner ${n.kind}: ${n.text}`]),
  ].sort((a, b) => a[0] - b[0]);
}

function esc(s) {
  return String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
}

function renderHtml(runs, goals) {
  const tone = { pass: 'ok', 'pass-unclaimed': 'warn', fail: 'bad', 'false-success': 'bad', unfinished: 'warn', unverified: 'warn' };
  const personas = [...new Set(runs.map((r) => r.profile.persona))];
  const TIER_ORDER = ['low', 'mid', 'high'];
  const tiers = [...new Set(runs.map((r) => r.profile.tier))].sort((a, b) => (TIER_ORDER.indexOf(a) + 1 || 9) - (TIER_ORDER.indexOf(b) + 1 || 9));
  const matrix = goals.map((g) => `
    <section><h2>${esc(g)}</h2><div class="scroll"><table><thead><tr><th>Persona</th>${tiers.map((t) => `<th>${esc(t)}</th>`).join('')}</tr></thead><tbody>
    ${personas.filter((p) => runs.some((x) => x.profile.goal === g && x.profile.persona === p)).map((p) => `<tr><th>${esc(p)}</th>${tiers.map((t) => {
      const cell = runs.filter((x) => x.profile.goal === g && x.profile.persona === p && x.profile.tier === t);
      if (!cell.length) return '<td class="na">not run</td>';
      const worst = cell.map(verdict).find((v) => tone[v] === 'bad') || cell.map(verdict).find((v) => tone[v] === 'warn') || 'pass';
      return `<td class="${tone[worst]}">${cell.map((r) => `<a href="#${esc(r.name)}">${esc(verdict(r))}</a>`).join('<br>')}<small>${cell.length} run${cell.length > 1 ? 's' : ''} · ${cell.reduce((n, r) => n + r.deadActions.length, 0)} dead · ${cell.reduce((n, r) => n + r.errors.length + r.network.length, 0)} err</small></td>`;
    }).join('')}</tr>`).join('')}
    </tbody></table></div></section>`).join('');
  const detail = runs.map((r) => {
    const pad = (n) => `step-${String(n).padStart(2, '0')}.png`;
    const marks = evidence(r);
    return `<article id="${esc(r.name)}"><h3>${esc(r.profile.persona)} · ${esc(r.profile.tier)} · ${esc(verdict(r))}</h3>
      <p class="goal">${esc(r.profile.goal)} · ${esc(r.profile.viewport)} · ${esc(r.profile.input)} · ${esc(r.name)}</p>
      ${r.result?.summary ? `<blockquote>${esc(r.result.summary)}</blockquote>` : ''}
      <ol class="marks">${marks.map(([s, m]) => `<li><figure><img loading="lazy" src="${esc(r.name)}/${pad(s)}" alt="Screenshot at step ${s}"><figcaption><b>Step ${s}</b> ${esc(m)}</figcaption></figure></li>`).join('') || '<li class="none">Nothing recorded.</li>'}</ol></article>`;
  }).join('');
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Usertest report</title>
<style>
:root{--bg:#f6f5f2;--fg:#1c1b19;--mute:#6b675f;--line:#dedad2;--ok:#dcefdc;--warn:#f6ecd0;--bad:#f6d9d4;--card:#fff}
@media (prefers-color-scheme:dark){:root{--bg:#161513;--fg:#ecebe7;--mute:#a19c92;--line:#34312c;--ok:#1f3a24;--warn:#3d3420;--bad:#4a2420;--card:#1e1d1a}}
body{margin:0;background:var(--bg);color:var(--fg);font:15px/1.5 ui-sans-serif,system-ui,sans-serif}
main{max-width:1100px;margin:0 auto;padding:32px 16px}
h1{font-size:28px;margin:0 0 4px}h2{font-size:18px;margin:32px 0 8px}h3{margin:0 0 4px}
p.lede,.goal{color:var(--mute);margin:0 0 16px}dl{margin:0 0 16px;font-size:13px;color:var(--mute)}dt{display:inline;font-weight:600;color:var(--fg)}dd{display:inline;margin:0 12px 0 4px}
.scroll{overflow-x:auto}table{border-collapse:collapse;width:100%;background:var(--card)}th,td{border:1px solid var(--line);padding:8px 10px;text-align:left;vertical-align:top}
td small{display:block;color:var(--mute);font-size:12px}td a{color:inherit;font-weight:600}
td.ok{background:var(--ok)}td.warn{background:var(--warn)}td.bad{background:var(--bad)}td.na{color:var(--mute)}
article{background:var(--card);border:1px solid var(--line);padding:16px;margin:16px 0}
blockquote{margin:8px 0 12px;padding-left:12px;border-left:3px solid var(--line);color:var(--mute)}
ol.marks{list-style:none;padding:0;margin:0;display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:12px}
figure{margin:0}figure img{width:100%;border:1px solid var(--line);display:block}figcaption{font-size:13px;margin-top:4px}
.none{color:var(--mute)}
</style></head><body><main><h1>Usertest report</h1><p class="lede">${runs.length} runs. Verdicts come from the driver's success check, not the runner's claim.</p>
<dl>${Object.entries(VERDICTS).map(([k, v]) => `<dt>${esc(k)}</dt><dd>${esc(v)}</dd>`).join('')}</dl>${matrix}<h2>Evidence</h2>${detail}</main></body></html>`;
}

// ---------------------------------------------------------------- main

const [verb, ...rest] = process.argv.slice(2);
const opts = parseArgs(rest);
switch (verb) {
  case 'preflight': await preflight(); break;
  case 'start': await start(opts); break;
  case '__serve': await serve(path.resolve(opts.run), opts); break;
  case 'stopall': await stopAll(opts._[0]); break;
  case 'summarize': summarize(opts._[0] || opts.session, { html: !!opts.html }); break;
  case undefined:
  case 'help':
    process.stdout.write([
      'parent: preflight, start, stopall, summarize',
      'runner: observe, click, fill, select, press, type, scroll, back, reload, interrupt, answer, dialogs, note, done, stop',
      'setup:  save-state',
      '',
    ].join('\n'));
    break;
  default: await client(verb, opts);
}
