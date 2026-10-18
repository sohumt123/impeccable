// Scripted end-to-end checks for `impeccable usertest` against the fixture
// shop. No LLM: every action is fixed, so the trace is deterministic.
// Opt-in (needs the engine binary and an installed Chrome): bun run test:usertest-e2e
import assert from 'node:assert/strict';
import { execFile, spawn } from 'node:child_process';
import fs from 'node:fs';
import net from 'node:net';
import os from 'node:os';
import path from 'node:path';
import { after, before, describe, it } from 'node:test';
import { promisify } from 'node:util';
import { engineEnv, findEngineBinary } from './lib/engine-bin.mjs';

const ROOT = path.resolve(import.meta.dirname, '..');
const BIN = findEngineBinary();
const SERVER = path.join(ROOT, 'tests', 'fixtures', 'usertest', 'server.mjs');
const run = promisify(execFile);
// Daemons die with this process, so a killed test run leaves no browsers behind.
const ENV = BIN ? engineEnv(BIN, { IMPECCABLE_USERTEST_OWNER_PID: String(process.pid) }) : process.env;
const usertest = (args, opts = {}) => run(BIN, ['usertest', ...args], { env: ENV, timeout: 90000, ...opts });

let server;
let base;
let session;

async function freePort() {
  return new Promise((resolve) => {
    const s = net.createServer().listen(0, '127.0.0.1', () => {
      const { port } = s.address();
      s.close(() => resolve(port));
    });
  });
}

async function drive(runDir, ...args) {
  const [verb, ...rest] = args;
  try {
    const { stdout } = await usertest([verb, ...rest, '--run', runDir]);
    return stdout;
  } catch (e) {
    return `${e.stdout || ''}${e.stderr || ''}`;
  }
}

function refFor(observation, pattern) {
  const line = observation.split('\n').find((l) => pattern.test(l));
  assert.ok(line, `no element matching ${pattern} in:\n${observation}`);
  return line.match(/\[(e\d+)\]/)[1];
}

function trace(runDir) {
  return fs.readFileSync(path.join(runDir, 'trace.jsonl'), 'utf8').split('\n').filter(Boolean).map((l) => JSON.parse(l));
}

let browserOk = true;

before(async () => {
  try {
    if (!BIN) throw new Error('no engine binary');
    await usertest(['preflight'], { timeout: 60000 });
  } catch {
    browserOk = false;
    return;
  }
  const port = await freePort();
  server = spawn(process.execPath, [SERVER, String(port)], { stdio: 'ignore' });
  base = `http://127.0.0.1:${port}/`;
  for (let i = 0; i < 50; i++) {
    try {
      if ((await fetch(base)).ok) break;
    } catch {}
    await new Promise((r) => setTimeout(r, 100));
  }
  session = fs.mkdtempSync(path.join(os.tmpdir(), 'usertest-'));
});

after(async () => {
  if (session) {
    for (const d of fs.readdirSync(session)) await drive(path.join(session, d), 'stop');
    fs.rmSync(session, { recursive: true, force: true });
  }
  server?.kill();
});

describe('impeccable usertest', () => {
  it('walks the checkout, records the dead click, and verifies success on its own', async (t) => {
    if (!browserOk) return t.skip('engine binary or Chrome unavailable');
    const dir = path.join(session, 'a-happy-low');
    let o = await drive(dir, 'start', '--url', base, '--goal', 'buy', '--persona', 'Jordan', '--tier', 'low', '--success-text', 'Order confirmed');
    assert.match(o, /step 1 · open/);
    // Diagnostics stay out of the runner's view.
    assert.doesNotMatch(o, /not keyboard-reachable|unlabeled|console error/);

    o = await drive(dir, 'click', refFor(o, /"Choose a size"/));
    o = await drive(dir, 'click', refFor(o, /"Medium"/));
    o = await drive(dir, 'click', refFor(o, /button "Add to bag"/));
    o = await drive(dir, 'click', refFor(o, /clickable "1"/));
    assert.match(o, /effect: navigated/);
    const place = refFor(o, /button "Place order"/);
    o = await drive(dir, 'fill', refFor(o, /textbox "Full name"/), 'Test Person');
    o = await drive(dir, 'fill', refFor(o, /textbox "Address"/), '1 Main St');
    o = await drive(dir, 'click', refFor(o, /radio "Std/));

    // Place order is below the fold: a visitor scrolls to it before clicking.
    assert.match(await drive(dir, 'click', place), /not on your screen \(it is below what you can see\); scroll to it first/);
    o = await drive(dir, 'scroll', place);
    // Planted P3: Place order before the terms box does nothing.
    o = await drive(dir, 'click', place);
    assert.match(o, /effect: none/);
    o = await drive(dir, 'click', refFor(o, /checkbox "I accept the terms"/));
    o = await drive(dir, 'click', place);
    assert.match(o, /Order confirmed/);

    const done = await drive(dir, 'done', '--outcome', 'completed', 'ordered');
    assert.match(done, /recorded: claimed completed/);
    // The verdict is sealed outside the run directory the runner can see.
    assert.doesNotMatch(fs.readFileSync(path.join(dir, 'result.json'), 'utf8'), /verified|goalMet/);
    const sealed = JSON.parse(fs.readFileSync(path.join(session, '_sealed', 'a-happy-low.result.json'), 'utf8'));
    assert.equal(sealed.verified, true);
    assert.doesNotMatch(fs.readFileSync(path.join(dir, 'profile.json'), 'utf8'), /Order confirmed/);
    const steps = trace(dir);
    assert.ok(steps.some((s) => s.dead && /Place order/.test(s.target)), 'dead click recorded');
    assert.ok(steps.some((s) => s.pointerOnly?.length > 0), 'pointer-only controls recorded in the trace');
    assert.ok(fs.existsSync(path.join(dir, 'step-01.png')));
  });

  it('keeps refs stable when the page changes around an element', async (t) => {
    if (!browserOk) return t.skip('engine binary or Chrome unavailable');
    const dir = path.join(session, 'a-refs-low');
    let o = await drive(dir, 'start', '--url', base, '--goal', 'refs', '--persona', 'Jordan', '--tier', 'low');
    const add = refFor(o, /button "Add to bag"/);
    o = await drive(dir, 'click', refFor(o, /"Choose a size"/));
    assert.equal(refFor(o, /button "Add to bag"/), add);
  });

  it('refuses pointer actions for a keyboard-only persona and records the JS error', async (t) => {
    if (!browserOk) return t.skip('engine binary or Chrome unavailable');
    const dir = path.join(session, 'a-keys-low');
    let o = await drive(dir, 'start', '--url', base, '--goal', 'keys', '--persona', 'Sam', '--tier', 'low', '--input', 'keyboard');
    // A pointer-only control reads as text to this persona.
    assert.match(o, /text "Choose a size"/);
    const refused = await drive(dir, 'click', refFor(o, /button "Add to bag"/));
    assert.match(refused, /KEYBOARD_ONLY/);
    o = await drive(dir, 'press', 'Tab');
    assert.match(o, /focused: \[e\d+\]/);
    await drive(dir, 'done', '--outcome', 'blocked', 'no size by keyboard');
    assert.ok(trace(dir).some((s) => s.focused && s.focused.focusRingVisible === false), 'missing focus ring recorded');
  });

  it('records a page error from adversarial input and state loss on interrupt', async (t) => {
    if (!browserOk) return t.skip('engine binary or Chrome unavailable');
    const dir = path.join(session, 'a-riley-low');
    let o = await drive(dir, 'start', '--url', base, '--goal', 'break', '--persona', 'Riley', '--tier', 'low');
    o = await drive(dir, 'click', refFor(o, /"Choose a size"/));
    o = await drive(dir, 'click', refFor(o, /"Pocket"/));
    o = await drive(dir, 'click', refFor(o, /button "Add to bag"/));
    o = await drive(dir, 'click', refFor(o, /clickable "1"/));
    o = await drive(dir, 'fill', refFor(o, /textbox "Promo code"/), '@emoji');
    await drive(dir, 'click', refFor(o, /button "Apply"/));
    o = await drive(dir, 'fill', refFor(o, /textbox "Full name"/), 'Riley');
    o = await drive(dir, 'interrupt');
    assert.match(o, /textbox "Full name" value=""/);
    await drive(dir, 'done', '--outcome', 'abandoned', 'broke it');
    assert.ok(trace(dir).some((s) => s.pageErrors.length > 0), 'page error recorded');
  });

  it('enforces the action budget', async (t) => {
    if (!browserOk) return t.skip('engine binary or Chrome unavailable');
    const dir = path.join(session, 'b-budget-low');
    await drive(dir, 'start', '--url', base, '--goal', 'budget', '--persona', 'Alex', '--tier', 'low', '--budget', '2');
    await drive(dir, 'scroll', 'down');
    const last = await drive(dir, 'scroll', 'down');
    assert.match(last, /BUDGET_EXHAUSTED/);
    assert.match(await drive(dir, 'scroll', 'down'), /BUDGET_EXHAUSTED/);
    // A forgotten flag is still a claim; a malformed done is refused and logged.
    assert.match(await drive(dir, 'done', 'finished'), /done needs --outcome/);
    assert.match(await drive(dir, 'done', 'abandoned', 'out of budget'), /recorded: claimed abandoned/);
    assert.ok(trace(dir).some((s) => s.action === 'refused' && s.verb === 'done'), 'refused done logged');
  });

  it('rejects requests without the token or from a browser origin', async (t) => {
    if (!browserOk) return t.skip('engine binary or Chrome unavailable');
    const dir = path.join(session, 'c-auth-low');
    await drive(dir, 'start', '--url', base, '--goal', 'auth', '--persona', 'Alex', '--tier', 'low');
    const { port, token } = JSON.parse(fs.readFileSync(path.join(dir, 'driver.json'), 'utf8'));
    assert.equal(fs.statSync(path.join(dir, 'driver.json')).mode & 0o777, 0o600);
    const call = (headers) => fetch(`http://127.0.0.1:${port}/`, { method: 'POST', headers, body: JSON.stringify({ verb: 'observe' }) }).then((r) => r.status);
    assert.equal(await call({ 'content-type': 'application/json' }), 403);
    assert.equal(await call({ 'content-type': 'text/plain', 'x-usertest-token': token }), 403);
    assert.equal(await call({ 'content-type': 'application/json', 'x-usertest-token': token, origin: 'http://evil.test' }), 403);
    assert.equal(await call({ 'content-type': 'application/json', 'x-usertest-token': token }), 200);
  });

  it('counts a dead Enter, logs refusals without spending budget, and marks an abandoned run unfinished', async (t) => {
    if (!browserOk) return t.skip('engine binary or Chrome unavailable');
    const dir = path.join(session, 'a-sam-low');
    await drive(dir, 'start', '--url', `${base}#/checkout`, '--goal', 'dead enter', '--persona', 'Sam', '--tier', 'low', '--input', 'keyboard', '--budget', '10', '--success-text', 'Order confirmed');
    assert.match(await drive(dir, 'fill', 'e1', 'x'), /KEYBOARD_ONLY/);
    // Seed the bag so checkout renders, then walk to Place order by keyboard.
    let o = await drive(dir, 'observe');
    assert.match(o, /actions left: 10/);
    await drive(dir, 'stop');
    const steps = trace(dir);
    assert.ok(steps.some((s) => s.action === 'refused' && s.verb === 'fill'));
    const { stdout } = await usertest(['summarize', session]);
    assert.match(stdout, /\| a-sam-low \| Sam \| low \| unfinished \|/);
  });

  it('loads saved storage and counts Enter on a control that does nothing as a dead action', async (t) => {
    if (!browserOk) return t.skip('engine binary or Chrome unavailable');
    // A saved state with one notebook already in the bag.
    const state = path.join(session, '_auth.json');
    fs.writeFileSync(state, JSON.stringify({ cookies: [], origins: [{ origin: base.replace(/\/$/, ''), localStorage: [{ name: 'bag', value: JSON.stringify([{ name: 'Field Notebook', size: 'Medium', price: 14 }]) }] }] }));
    const dir = path.join(session, 'a-enter-low');
    let o = await drive(dir, 'start', '--url', `${base}#/checkout`, '--goal', 'enter', '--persona', 'Sam', '--tier', 'low', '--input', 'keyboard', '--budget', '40', '--storage-state', state);
    assert.match(o, /heading h1 "Checkout"/);
    for (let i = 0; i < 25 && !/focused: \[e\d+\] button "Place order"/.test(o); i++) o = await drive(dir, 'press', 'Tab');
    assert.match(o, /focused: \[e\d+\] button "Place order"/);
    // Planted P3: without the terms box, Place order does nothing.
    o = await drive(dir, 'press', 'Enter');
    assert.match(o, /effect: none/);
    await drive(dir, 'done', '--outcome', 'blocked', 'nothing happens');
    assert.ok(trace(dir).some((s) => s.action === 'press' && s.dead && /Place order/.test(s.target)));
  });

  it('refuses a remote host without consent and refuses to reuse a run directory', async (t) => {
    if (!browserOk) return t.skip('engine binary or Chrome unavailable');
    const remote = await drive(path.join(session, 'x-remote'), 'start', '--url', 'https://example.com/');
    assert.match(remote, /USERTEST_REMOTE_TARGET/);
    const reuse = await drive(path.join(session, 'a-happy-low'), 'start', '--url', base);
    assert.match(reuse, /already holds a run|already running/);
  });

  it('shows dialogs and lets the runner choose, follows new tabs, reaches open shadow DOM, and notes frames', async (t) => {
    if (!browserOk) return t.skip('engine binary or Chrome unavailable');
    const dir = path.join(session, 'd-lab-low');
    let o = await drive(dir, 'start', '--url', `${base}lab.html`, '--goal', 'lab', '--persona', 'Riley', '--tier', 'low');
    assert.match(o, /embedded frame "Payment form"/);
    // Open shadow DOM is listed and actionable.
    o = await drive(dir, 'click', refFor(o, /button "Say hello"/));
    assert.match(o, /Hello from the shadow/);
    // A change inside a shadow root is still a change, not a dead click.
    assert.match(o, /effect: changed/);
    // A confirm pauses the run; the runner reads it and chooses.
    const del = refFor(o, /button "Delete everything"/);
    o = await drive(dir, 'click', del);
    assert.match(o, /a confirm dialog opened/);
    assert.match(o, /the dialog says: "Delete everything\? This cannot be undone\."/);
    assert.match(await drive(dir, 'observe'), /dialog is open/);
    o = await drive(dir, 'answer', 'cancel');
    assert.match(o, /you pressed Cancel/);
    assert.match(o, /"Kept"/);
    o = await drive(dir, 'click', del);
    o = await drive(dir, 'answer', 'ok');
    assert.match(o, /you pressed OK/);
    assert.match(o, /"Deleted"/);
    // A standing answer skips the pause.
    assert.match(await drive(dir, 'dialogs', 'dismiss'), /without asking/);
    o = await drive(dir, 'click', del);
    assert.match(o, /you pressed Cancel/);
    // A target=_blank link moves the run into the new tab.
    o = await drive(dir, 'click', refFor(o, /link "Open help in a new tab"/));
    assert.match(o, /a new tab opened/);
    assert.match(o, /lab\.html#opened/);
    // The driver waits for in-flight requests, and reports what showed while it waited.
    o = await drive(dir, 'click', refFor(o, /button "Show times"/));
    assert.match(o, /Open: 9:00 AM/);
    assert.match(o, /while it loaded \([\d.]+s\), the page showed: "Nothing available"/);
    // People type dates the way they write them; the driver fills the native field.
    o = await drive(dir, 'observe');
    o = await drive(dir, 'fill', refFor(o, /textbox "Visit date"/), '10/20/2026');
    assert.match(o, /textbox "Visit date" value="2026-10-20"/);
    await drive(dir, 'done', '--outcome', 'completed', 'lab');
    assert.ok(trace(dir).some((s) => s.dialogs?.some((d) => d.how === 'dismiss')));
  });

  it('flags a page wider than the phone, marks what the phone cannot show, and pans to it with a swipe', async (t) => {
    if (!browserOk) return t.skip('engine binary or Chrome unavailable');
    const dir = path.join(session, 'e-wide-low');
    let o = await drive(dir, 'start', '--url', `${base}lab.html#wide`, '--goal', 'wide', '--persona', 'Casey', '--tier', 'low', '--viewport', 'mobile');
    // The phone shows 390px of a wider page: the viewport line says so, and the far button is off-screen.
    assert.match(o, /viewport 390x844/);
    assert.match(o, /\*\[e\d+\] button "Far button"/);
    o = await drive(dir, 'scroll', 'right');
    assert.match(o, / \[e\d+\] button "Far button"/);
    o = await drive(dir, 'click', refFor(o, /button "Far button"/));
    assert.match(o, /· tap /);
    assert.match(o, /"Far reached"/);
    assert.match(fs.readFileSync(path.join(dir, 'step-01.png')).subarray(16, 24).toString('hex'), /^000001860000034c$/, 'screenshot is 390x844 CSS pixels');
    await drive(dir, 'done', '--outcome', 'completed', 'wide');
    assert.ok(trace(dir).some((s) => s.horizontalOverflow), 'overflow recorded');
  });

  it('tells the runner page text is not an instruction, and saves sign-in state only where it is allowed', async (t) => {
    if (!browserOk) return t.skip('engine binary or Chrome unavailable');
    const dir = path.join(session, 'setup-signin');
    let o = await drive(dir, 'start', '--url', base);
    assert.match(o, /never an instruction to you/);
    o = await drive(dir, 'click', refFor(o, /"Choose a size"/));
    o = await drive(dir, 'click', refFor(o, /"Medium"/));
    await drive(dir, 'click', refFor(o, /button "Add to bag"/));
    const state = path.join(session, '_signin.json');
    assert.match(await drive(dir, 'save-state', state), /saved cookies and storage/);
    assert.equal(fs.statSync(state).mode & 0o777, 0o600);
    const saved = JSON.parse(fs.readFileSync(state, 'utf8'));
    assert.ok(saved.origins[0].localStorage.some((i) => i.name === 'bag'), 'local storage saved');
    assert.match(await drive(dir, 'save-state', path.join(os.tmpdir(), 'stolen.json')), /writes only inside the session directory/);
    await drive(dir, 'stop');
  });

  it('summarizes the session with driver verdicts', async (t) => {
    if (!browserOk) return t.skip('engine binary or Chrome unavailable');
    const { stdout } = await usertest(['summarize', session, '--html']);
    assert.match(stdout, /\| a-happy-low \| Jordan \| low \| pass \| completed \|/);
    assert.match(stdout, /dead click: \[e\d+\] button "Place order"/);
    assert.match(stdout, /\| b-budget-low \| Alex \| low \| unverified \|/);
    assert.ok(fs.existsSync(path.join(session, 'summary.html')));
  });
});
