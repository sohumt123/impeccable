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
const SERVER = path.join(ROOT, 'tests', 'fixtures', 'usertest', 'server.mjs');
const BIN = findEngineBinary();
const run = promisify(execFile);

// Sealed run data goes under HOME; keep it in a temp dir, not the developer's.
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'usertest-'));
const HOME = path.join(tmp, 'home');
fs.mkdirSync(HOME);
// Daemons and the fixture server die with this process, so a killed test run
// leaves no browsers or servers behind.
const ENV = BIN
  ? engineEnv(BIN, { HOME, USERPROFILE: HOME, IMPECCABLE_USERTEST_OWNER_PID: String(process.pid) })
  : process.env;

let server;
let base;
let browserOk = true;

/** One `impeccable usertest` call; output (stdout + stderr) and exit code. */
async function usertest(args) {
  try {
    const { stdout, stderr } = await run(BIN, ['usertest', ...args], { env: ENV, timeout: 180000 });
    return { out: `${stdout}${stderr}`, code: 0 };
  } catch (e) {
    return { out: `${e.stdout || ''}${e.stderr || ''}`, code: e.code };
  }
}

/** A session directory of its own, so no test depends on another's runs. */
function newSession(name) {
  const dir = path.join(tmp, 'sessions', name);
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

const start = async (dir, ...flags) => (await usertest(['start', '--run', dir, ...flags])).out;
const act = async (dir, verb, ...args) => (await usertest(['act', verb, ...args, '--run', dir])).out;

function refFor(observation, pattern) {
  const line = observation.split('\n').find((l) => pattern.test(l));
  assert.ok(line, `no element matching ${pattern} in:\n${observation}`);
  return line.match(/\[(e\d+)\]/)[1];
}

function trace(runDir) {
  return fs.readFileSync(path.join(runDir, 'trace.jsonl'), 'utf8').split('\n').filter(Boolean).map((l) => JSON.parse(l));
}

function sealedResult(session, name) {
  const { id } = JSON.parse(fs.readFileSync(path.join(session, 'session.json'), 'utf8'));
  return JSON.parse(fs.readFileSync(path.join(HOME, '.impeccable', 'usertest', 'sealed', id, `${name}.result.json`), 'utf8'));
}

/** Every file under `dir`, as text. */
function allText(dir) {
  return fs.readdirSync(dir, { recursive: true })
    .map((f) => path.join(dir, f))
    .filter((f) => fs.statSync(f).isFile() && !f.endsWith('.png'))
    .map((f) => fs.readFileSync(f, 'utf8'))
    .join('\n');
}

async function freePort() {
  return new Promise((resolve) => {
    const s = net.createServer().listen(0, '127.0.0.1', () => {
      const { port } = s.address();
      s.close(() => resolve(port));
    });
  });
}

before(async () => {
  if (!BIN || (await usertest(['preflight'])).code !== 0) {
    browserOk = false;
    return;
  }
  const port = await freePort();
  server = spawn(process.execPath, [SERVER, String(port)], { stdio: 'ignore', env: ENV });
  base = `http://127.0.0.1:${port}/`;
  for (let i = 0; i < 50; i++) {
    try {
      if ((await fetch(base)).ok) break;
    } catch {}
    await new Promise((r) => setTimeout(r, 100));
  }
});

after(async () => {
  if (BIN) {
    for (const s of fs.existsSync(path.join(tmp, 'sessions')) ? fs.readdirSync(path.join(tmp, 'sessions')) : []) {
      await usertest(['stopall', path.join(tmp, 'sessions', s)]);
    }
  }
  server?.kill();
  fs.rmSync(tmp, { recursive: true, force: true });
});

describe('impeccable usertest', () => {
  it('walks the checkout, records the dead click, and verifies success on its own', async (t) => {
    if (!browserOk) return t.skip('engine binary or Chrome unavailable');
    const session = newSession('checkout');
    const dir = path.join(session, 'a-jordan-low');
    let o = await start(dir, '--url', base, '--goal', 'buy', '--persona', 'Jordan', '--tier', 'low', '--success-text', 'Order confirmed');
    assert.match(o, /step 1 · open/);
    // Diagnostics stay out of the runner's view.
    assert.doesNotMatch(o, /not keyboard-reachable|unlabeled|console error/);

    o = await act(dir, 'click', refFor(o, /"Choose a size"/));
    o = await act(dir, 'click', refFor(o, /"Medium"/));
    o = await act(dir, 'click', refFor(o, /button "Add to bag"/));
    o = await act(dir, 'click', refFor(o, /clickable "1"/));
    assert.match(o, /effect: navigated/);
    const place = refFor(o, /button "Place order"/);
    o = await act(dir, 'fill', refFor(o, /textbox "Full name"/), 'Test Person');
    o = await act(dir, 'fill', refFor(o, /textbox "Address"/), '1 Main St');
    o = await act(dir, 'click', refFor(o, /radio "Std/));

    // Place order is below the fold: a visitor scrolls to it before clicking.
    assert.match(await act(dir, 'click', place), /not on your screen \(it is below what you can see\); scroll to it first/);
    o = await act(dir, 'scroll', place);
    // Planted P3: Place order before the terms box does nothing.
    o = await act(dir, 'click', place);
    assert.match(o, /effect: none/);
    o = await act(dir, 'click', refFor(o, /checkbox "I accept the terms"/));
    o = await act(dir, 'click', place);
    assert.match(o, /Order confirmed/);
    assert.match(await act(dir, 'done', '--outcome', 'completed', 'ordered'), /recorded: claimed completed/);

    // The verdict and the success check are sealed outside the session.
    assert.equal(sealedResult(session, 'a-jordan-low').verified, true);
    assert.doesNotMatch(allText(session), /Order confirmed|verified|goalMetAtStep/);
    const steps = trace(dir);
    assert.ok(steps.some((s) => s.dead && /Place order/.test(s.target)), 'dead click recorded');
    assert.ok(steps.some((s) => s.action === 'refused' && /not on your screen/.test(s.reason)), 'off-screen refusal recorded');
    assert.ok(steps.some((s) => s.pointerOnly?.length > 0), 'pointer-only controls recorded in the trace');
    assert.ok(fs.existsSync(path.join(dir, 'step-01.png')));
  });

  it('keeps refs stable when the page changes around an element', async (t) => {
    if (!browserOk) return t.skip('engine binary or Chrome unavailable');
    const dir = path.join(newSession('refs'), 'a-jordan-low');
    let o = await start(dir, '--url', base, '--goal', 'refs', '--persona', 'Jordan', '--tier', 'low');
    const add = refFor(o, /button "Add to bag"/);
    o = await act(dir, 'click', refFor(o, /"Choose a size"/));
    assert.equal(refFor(o, /button "Add to bag"/), add);
  });

  it('refuses pointer verbs for a keyboard-only persona and records a missing focus ring', async (t) => {
    if (!browserOk) return t.skip('engine binary or Chrome unavailable');
    const dir = path.join(newSession('keys'), 'a-sam-low');
    let o = await start(dir, '--url', base, '--goal', 'keys', '--persona', 'Sam', '--tier', 'low', '--input', 'keyboard', '--budget', '10');
    // A pointer-only control reads as text to this persona.
    assert.match(o, /text "Choose a size"/);
    assert.match(await act(dir, 'click', refFor(o, /button "Add to bag"/)), /KEYBOARD_ONLY/);
    assert.match(await act(dir, 'fill', 'e1', 'x'), /KEYBOARD_ONLY/);
    o = await act(dir, 'press', 'Tab');
    assert.match(o, /focused: \[e\d+\]/);
    // Refusals cost nothing: one press spent.
    assert.match(o, /actions left: 9/);
    await act(dir, 'done', '--outcome', 'blocked', 'no size by keyboard');
    const steps = trace(dir);
    assert.equal(steps.filter((s) => s.action === 'refused').length, 2);
    assert.ok(steps.some((s) => s.focused && s.focused.focusRingVisible === false), 'missing focus ring recorded');
  });

  it('records a page error from adversarial input and state loss on interrupt', async (t) => {
    if (!browserOk) return t.skip('engine binary or Chrome unavailable');
    const dir = path.join(newSession('riley'), 'a-riley-low');
    let o = await start(dir, '--url', base, '--goal', 'break', '--persona', 'Riley', '--tier', 'low');
    o = await act(dir, 'click', refFor(o, /"Choose a size"/));
    o = await act(dir, 'click', refFor(o, /"Pocket"/));
    o = await act(dir, 'click', refFor(o, /button "Add to bag"/));
    o = await act(dir, 'click', refFor(o, /clickable "1"/));
    o = await act(dir, 'fill', refFor(o, /textbox "Promo code"/), '@emoji');
    await act(dir, 'click', refFor(o, /button "Apply"/));
    o = await act(dir, 'fill', refFor(o, /textbox "Full name"/), 'Riley');
    o = await act(dir, 'interrupt');
    assert.match(o, /textbox "Full name" value=""/);
    await act(dir, 'done', '--outcome', 'abandoned', 'broke it');
    assert.ok(trace(dir).some((s) => s.pageErrors.length > 0), 'page error recorded');
  });

  it('enforces the action budget and accepts the outcome as a plain word', async (t) => {
    if (!browserOk) return t.skip('engine binary or Chrome unavailable');
    const dir = path.join(newSession('budget'), 'b-alex-low');
    await start(dir, '--url', base, '--goal', 'budget', '--persona', 'Alex', '--tier', 'low', '--budget', '2');
    await act(dir, 'scroll', 'down');
    assert.match(await act(dir, 'scroll', 'down'), /BUDGET_EXHAUSTED/);
    assert.match(await act(dir, 'scroll', 'down'), /BUDGET_EXHAUSTED/);
    // A forgotten flag is still a claim; a malformed done is refused and logged.
    assert.match(await act(dir, 'done', 'finished'), /done needs --outcome/);
    assert.match(await act(dir, 'done', 'abandoned', 'out of budget'), /recorded: claimed abandoned/);
    assert.ok(trace(dir).some((s) => s.action === 'refused' && s.verb === 'done'), 'refused done logged');
    assert.match(await act(dir, 'observe'), /run already finished/);
  });

  it('rejects requests without the token, from a browser origin, or without a role', async (t) => {
    if (!browserOk) return t.skip('engine binary or Chrome unavailable');
    const dir = path.join(newSession('auth'), 'c-alex-low');
    await start(dir, '--url', base, '--goal', 'auth', '--persona', 'Alex', '--tier', 'low');
    const { port, token } = JSON.parse(fs.readFileSync(path.join(dir, 'driver.json'), 'utf8'));
    assert.equal(fs.statSync(path.join(dir, 'driver.json')).mode & 0o777, 0o600);
    const call = (headers, body = { role: 'runner', verb: 'observe' }) =>
      fetch(`http://127.0.0.1:${port}/`, { method: 'POST', headers, body: JSON.stringify(body) }).then((r) => r.status);
    const json = { 'content-type': 'application/json' };
    assert.equal(await call(json), 403);
    assert.equal(await call({ 'content-type': 'text/plain', 'x-usertest-token': token }), 403);
    assert.equal(await call({ ...json, 'x-usertest-token': token, origin: 'http://evil.test' }), 403);
    assert.equal(await call({ ...json, 'x-usertest-token': token }, { verb: 'observe' }), 403);
    // A runner cannot reach the parent's verbs even with the token.
    assert.equal(await call({ ...json, 'x-usertest-token': token }, { role: 'runner', verb: 'stop' }), 400);
    assert.equal(await call({ ...json, 'x-usertest-token': token }), 200);
  });

  it('counts Enter on a control that does nothing as a dead action, with saved storage loaded', async (t) => {
    if (!browserOk) return t.skip('engine binary or Chrome unavailable');
    const session = newSession('enter');
    // A saved state with one notebook already in the bag.
    const state = path.join(session, 'signin.json');
    fs.writeFileSync(state, JSON.stringify({ cookies: [], origins: [{ origin: base.replace(/\/$/, ''), localStorage: [{ name: 'bag', value: JSON.stringify([{ name: 'Field Notebook', size: 'Medium', price: 14 }]) }] }] }));
    const dir = path.join(session, 'a-sam-low');
    let o = await start(dir, '--url', `${base}#/checkout`, '--goal', 'enter', '--persona', 'Sam', '--tier', 'low', '--input', 'keyboard', '--budget', '40', '--storage-state', state);
    assert.match(o, /heading h1 "Checkout"/);
    for (let i = 0; i < 25 && !/focused: \[e\d+\] button "Place order"/.test(o); i++) o = await act(dir, 'press', 'Tab');
    assert.match(o, /focused: \[e\d+\] button "Place order"/);
    // Planted P3: without the terms box, Place order does nothing.
    o = await act(dir, 'press', 'Enter');
    assert.match(o, /effect: none/);
    await act(dir, 'done', '--outcome', 'blocked', 'nothing happens');
    assert.ok(trace(dir).some((s) => s.action === 'press' && s.dead && /Place order/.test(s.target)));
  });

  it('refuses a remote host, a reused run directory, and a start URL that does not load', async (t) => {
    if (!browserOk) return t.skip('engine binary or Chrome unavailable');
    const session = newSession('refusals');
    const remote = await usertest(['start', '--run', path.join(session, 'x-remote'), '--url', 'https://example.com/']);
    assert.equal(remote.code, 4);
    const dir = path.join(session, 'a-alex-low');
    await start(dir, '--url', base, '--persona', 'Alex');
    await act(dir, 'done', 'completed', 'ok');
    await usertest(['stop', '--run', dir]);
    const reuse = await usertest(['start', '--run', dir, '--url', base]);
    assert.equal(reuse.code, 2);
    assert.match(reuse.out, /already holds a run/);
    const closed = await freePort();
    const down = await usertest(['start', '--run', path.join(session, 'a-down-low'), '--url', `http://127.0.0.1:${closed}/`, '--persona', 'Alex']);
    assert.equal(down.code, 5);
    assert.match(down.out, /USERTEST_TARGET_UNREACHABLE/);
    assert.ok(!fs.existsSync(path.join(session, 'a-down-low', 'driver.json')), 'no daemon left behind');
  });

  it('shows dialogs and lets the runner choose, follows and leaves new tabs, reaches open shadow DOM, and notes frames', async (t) => {
    if (!browserOk) return t.skip('engine binary or Chrome unavailable');
    const dir = path.join(newSession('lab'), 'd-riley-low');
    let o = await start(dir, '--url', `${base}lab.html`, '--goal', 'lab', '--persona', 'Riley', '--tier', 'low');
    assert.match(o, /embedded frame "Payment form"/);
    // Open shadow DOM is listed and actionable, and a change inside it is a change.
    o = await act(dir, 'click', refFor(o, /button "Say hello"/));
    assert.match(o, /Hello from the shadow/);
    assert.match(o, /effect: changed/);
    // A confirm pauses the run; the runner reads it and chooses.
    const del = refFor(o, /button "Delete everything"/);
    o = await act(dir, 'click', del);
    assert.match(o, /a confirm dialog opened/);
    assert.match(o, /the dialog says: "Delete everything\? This cannot be undone\."/);
    assert.match(await act(dir, 'observe'), /dialog is open/);
    o = await act(dir, 'answer', 'cancel');
    assert.match(o, /you pressed Cancel/);
    assert.match(o, /"Kept"/);
    o = await act(dir, 'click', del);
    o = await act(dir, 'answer', 'ok');
    assert.match(o, /you pressed OK/);
    assert.match(o, /"Deleted"/);
    // A standing answer skips the pause.
    assert.match(await act(dir, 'dialogs', 'dismiss'), /without asking/);
    o = await act(dir, 'click', del);
    assert.match(o, /you pressed Cancel/);
    // A target=_blank link moves the run into the new tab; closing it returns to the opener.
    o = await act(dir, 'click', refFor(o, /link "Open help in a new tab"/));
    assert.match(o, /a new tab opened/);
    assert.match(o, /lab\.html#opened/);
    await act(dir, 'click', refFor(o, /button "Close this tab"/));
    o = await act(dir, 'observe');
    assert.match(o, /page: "Driver lab" http:\/\/127\.0\.0\.1:\d+\/lab\.html\n/);
    // The driver waits for in-flight requests, and reports what showed while it waited.
    o = await act(dir, 'click', refFor(o, /button "Show times"/));
    assert.match(o, /Open: 9:00 AM/);
    assert.match(o, /while it loaded \([\d.]+s\), the page showed: "Nothing available"/);
    // People type dates the way they write them; the driver fills the native field.
    o = await act(dir, 'fill', refFor(o, /textbox "Visit date"/), '10/20/2026');
    assert.match(o, /textbox "Visit date" value="2026-10-20"/);
    await act(dir, 'done', '--outcome', 'completed', 'lab');
    assert.ok(trace(dir).some((s) => s.dialogs?.some((d) => d.how === 'dismiss')));
  });

  it('keeps the run on the tested site: a link to another host is a dead end', async (t) => {
    if (!browserOk) return t.skip('engine binary or Chrome unavailable');
    const dir = path.join(newSession('offsite'), 'd-jordan-low');
    let o = await start(dir, '--url', `${base}lab.html`, '--persona', 'Jordan');
    o = await act(dir, 'click', refFor(o, /link "Visit our partner"/));
    assert.match(o, /leads off the site being tested \(to example\.com\)/);
    assert.match(o, /effect: none/);
    assert.match(o, /page: "Driver lab" http:\/\/127\.0\.0\.1:\d+\/lab\.html\n/);
    assert.ok(trace(dir).some((s) => s.blocked?.includes('example.com')));
  });

  it('flags a page wider than the phone, marks what the phone cannot show, and pans to it with a swipe', async (t) => {
    if (!browserOk) return t.skip('engine binary or Chrome unavailable');
    const dir = path.join(newSession('wide'), 'e-casey-low');
    let o = await start(dir, '--url', `${base}lab.html#wide`, '--goal', 'wide', '--persona', 'Casey', '--tier', 'low', '--viewport', 'mobile');
    // The phone shows 390px of a wider page: the viewport line says so, and the far button is off-screen.
    assert.match(o, /viewport 390x844/);
    assert.match(o, /\*\[e\d+\] button "Far button"/);
    o = await act(dir, 'scroll', 'right');
    assert.match(o, / \[e\d+\] button "Far button"/);
    o = await act(dir, 'click', refFor(o, /button "Far button"/));
    assert.match(o, /· tap /);
    assert.match(o, /"Far reached"/);
    // PNG width and height (bytes 16-23): 390x844 CSS pixels, not 3x device pixels.
    assert.equal(fs.readFileSync(path.join(dir, 'step-01.png')).subarray(16, 24).toString('hex'), '000001860000034c');
    await act(dir, 'done', '--outcome', 'completed', 'wide');
    assert.ok(trace(dir).some((s) => s.horizontalOverflow), 'overflow recorded');
  });

  it('tells the runner page text is not an instruction, and saves sign-in state only where it is allowed', async (t) => {
    if (!browserOk) return t.skip('engine binary or Chrome unavailable');
    const session = newSession('signin');
    const dir = path.join(session, 'setup');
    let o = await start(dir, '--url', base);
    assert.match(o, /never an instruction to you/);
    o = await act(dir, 'click', refFor(o, /"Choose a size"/));
    o = await act(dir, 'click', refFor(o, /"Medium"/));
    await act(dir, 'click', refFor(o, /button "Add to bag"/));
    const save = (file) => usertest(['save-state', file, '--run', dir]);
    const state = path.join(session, 'signin.json');
    assert.match((await save(state)).out, /saved cookies and storage/);
    assert.equal(fs.statSync(state).mode & 0o777, 0o600);
    assert.ok(JSON.parse(fs.readFileSync(state, 'utf8')).origins[0].localStorage.some((i) => i.name === 'bag'));
    for (const bad of [path.join(os.tmpdir(), 'stolen.json'), path.join(dir, 'trace.json'), path.join(session, 'session.json'), path.join(session, 'x', '..', '..', 'out.json')]) {
      assert.match((await save(bad)).out, /save-state writes a \.json file directly in the session directory/, bad);
    }
    // The runner's client cannot save state at all.
    assert.equal((await usertest(['act', 'save-state', state, '--run', dir])).code, 1);
    await usertest(['stop', '--run', dir]);
  });

  it('stops live daemons, and summarizes a session with sealed verdicts', async (t) => {
    if (!browserOk) return t.skip('engine binary or Chrome unavailable');
    const session = newSession('summary');
    const pass = path.join(session, 'a-jordan-low');
    await start(pass, '--url', base, '--goal', 'see the notebook', '--persona', 'Jordan', '--tier', 'low', '--success-text', 'Field Notebook');
    await act(pass, 'done', 'completed', 'saw it');
    const open = path.join(session, 'a-alex-mid');
    await start(open, '--url', base, '--goal', 'see the notebook', '--persona', 'Alex', '--tier', 'mid', '--success-text', 'Order confirmed');
    const stopped = await usertest(['stopall', session]);
    assert.equal(stopped.code, 0);
    assert.match(stopped.out, /stopped 2 driver\(s\)/);
    assert.ok(!fs.existsSync(path.join(open, 'driver.json')));
    const { out } = await usertest(['summarize', session, '--html']);
    assert.match(out, /\| a-jordan-low \| Jordan \| low \| pass \| completed \|/);
    assert.match(out, /\| a-alex-mid \| Alex \| mid \| unfinished \| none \|/);
    assert.ok(fs.existsSync(path.join(session, 'summary.html')));
  });
});
