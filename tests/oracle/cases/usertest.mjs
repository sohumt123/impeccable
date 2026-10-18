/**
 * Corpus for `usertest`. Only the browser-free paths: usage, the refusals
 * that come before any browser is launched, `stopall` over a stale record,
 * and `summarize` over a recorded session (traces, sealed profiles and
 * results written by `setup`). Driving a real page needs an installed Chrome
 * and is covered by `tests/usertest-e2e.test.mjs` instead.
 */

import fs from 'node:fs';
import path from 'node:path';

const WS = 'ctx-empty';
const SESSION = '.impeccable/usertest/shop/20261018-1200';

const write = (ws, rel, body) => {
  const abs = path.join(ws, rel);
  fs.mkdirSync(path.dirname(abs), { recursive: true });
  fs.writeFileSync(abs, typeof body === 'string' ? body : JSON.stringify(body, null, 2));
};

const jsonl = (entries) => `${entries.map((e) => JSON.stringify(e)).join('\n')}\n`;

const profile = (persona, tier, extra = {}) => ({
  goal: 'Buy a medium notebook', persona, tier, url: 'http://127.0.0.1:4790/',
  viewport: 'desktop', input: 'pointer', network: 'fast', budget: 30, ...extra,
});

const step = (n, extra = {}) => ({
  step: n, action: 'click', args: [`e${n}`], target: null, targetRole: null, effect: 'changed', dead: false, error: null,
  url: 'http://127.0.0.1:4790/', console: [], pageErrors: [], network: [], dialogs: [], tabs: [], transient: [],
  waitedMs: 700, warnings: [], focused: null, horizontalOverflow: false, goalMet: false, screenshot: `step-0${n}.png`,
  unlabeled: [], pointerOnly: [], placeholderOnly: [], ...extra,
});

function recordedSession(ws) {
  const run = (name, sealed, entries, result) => {
    write(ws, `${SESSION}/${name}/trace.jsonl`, jsonl(entries));
    write(ws, `${SESSION}/_sealed/${name}.json`, sealed);
    if (result) write(ws, `${SESSION}/_sealed/${name}.result.json`, result);
  };
  // A pass with a dead click on the way, a pointer-only control, and a note.
  run('a-jordan-low',
    { profile: profile('Jordan', 'low'), successText: 'Order confirmed', successUrl: null, storageState: null, remote: false },
    [
      step(1, { action: 'open', args: ['http://127.0.0.1:4790/'], effect: 'initial', pointerOnly: ['e3 "Choose a size"'] }),
      step(2, { target: '[e9] button "Place order"', targetRole: 'button', effect: 'none', dead: true, pointerOnly: ['e3 "Choose a size"'] }),
      { step: 2, action: 'note', kind: 'friction', text: 'Clicked Place order and nothing happened.', url: 'http://127.0.0.1:4790/#/checkout', screenshot: 'step-02.png' },
      step(3, { goalMet: true, network: ['500 POST http://127.0.0.1:4790/api/track'] }),
    ],
    { claimed: 'completed', summary: 'ordered the notebook', verified: true, goalMetAtStep: 3, steps: 3, actions: 2, seconds: 41 });
  // The runner believed a fake "Saved!"; the check never matched.
  run('b-alex-mid',
    { profile: profile('Alex', 'mid', { goal: 'Change my email' }), successText: 'Email updated', successUrl: null, storageState: null, remote: false },
    [
      step(1, { action: 'open', args: ['http://127.0.0.1:4790/#/account'], effect: 'initial' }),
      step(2, { action: 'press', args: ['Enter'], target: '[e4] textbox "Email"', effect: 'none' }),
      { step: 2, action: 'refused', verb: 'fill', reason: 'no element e40 on the current page; use a ref from the latest observation' },
    ],
    { claimed: 'completed', summary: 'saved the new email', verified: false, goalMetAtStep: null, steps: 2, actions: 2, seconds: 30 });
  // A keyboard run that ended without done, on a phone-width overflow, with a confirm answered.
  run('c-sam-low',
    { profile: profile('Sam', 'low', { input: 'keyboard', viewport: 'mobile' }), successText: 'Order confirmed', successUrl: null, storageState: null, remote: false },
    [
      step(1, { action: 'open', args: ['http://127.0.0.1:4790/'], effect: 'initial', horizontalOverflow: true, contentWidth: 564,
        focused: { ref: 'e2', role: 'link', name: 'Account', focusRingVisible: false } }),
      step(2, { action: 'answer', args: ['cancel'], dialogs: [{ type: 'confirm', message: 'Keep your appointment?', how: 'dismiss' }],
        transient: ['No appointments available on this date.'], waitedMs: 1900 }),
    ],
    { claimed: 'none', summary: 'run ended without done (idle)', verified: false, goalMetAtStep: null, steps: 2, actions: 1, seconds: 900 });
  // No success check: the claim stands alone.
  run('d-riley-mid',
    { profile: profile('Riley', 'mid', { goal: 'Browse the catalog' }), successText: null, successUrl: null, storageState: null, remote: false },
    [step(1, { action: 'open', args: ['http://127.0.0.1:4790/'], effect: 'initial' })],
    { claimed: 'completed', summary: '', verified: null, goalMetAtStep: null, steps: 1, actions: 0, seconds: 5 });
  // A sign-in setup run (no persona) is not part of the matrix.
  run('setup-signin',
    { profile: profile('', ''), successText: null, successUrl: null, storageState: null, remote: false },
    [step(1, { action: 'open', effect: 'initial' })], null);
}

const env = () => ({ IMPECCABLE_USERTEST_OWNER_PID: null, CI: null });

const cases = [
  { id: 'usertest-usage', verb: 'usertest', workspace: WS, args: [], env: env() },
  { id: 'usertest-start-needs-run', verb: 'usertest', workspace: WS, args: ['start', '--url', 'http://localhost:3000/'], env: env() },
  { id: 'usertest-start-not-http', verb: 'usertest', workspace: WS, args: ['start', '--run', `${SESSION}/x`, '--url', 'file:///etc/hosts'], env: env() },
  // Runners take real actions, so a deployed host needs explicit consent.
  { id: 'usertest-start-remote-refused', verb: 'usertest', workspace: WS, args: ['start', '--run', `${SESSION}/x`, '--url', 'https://shop.example.com/'], env: env() },
  {
    id: 'usertest-start-reuse-refused', verb: 'usertest', workspace: WS,
    setup: (ws) => write(ws, `${SESSION}/a-jordan-low/trace.jsonl`, '{}\n'),
    args: ['start', '--run', `${SESSION}/a-jordan-low`, '--url', 'http://127.0.0.1:4790/'], env: env(),
  },
  { id: 'usertest-runner-no-driver', verb: 'usertest', workspace: WS, args: ['observe', '--run', `${SESSION}/a-jordan-low`], env: env() },
  { id: 'usertest-runner-needs-run', verb: 'usertest', workspace: WS, args: ['click', 'e3'], env: env() },
  {
    // A record whose daemon is gone is cleared; no process is killed.
    id: 'usertest-stopall-stale', verb: 'usertest', workspace: WS,
    setup: (ws) => write(ws, `${SESSION}/a-jordan-low/driver.json`, { port: 9, pid: 999999, token: 'x' }),
    args: ['stopall', SESSION], files: [`${SESSION}/**`], env: env(),
  },
  {
    id: 'usertest-summarize', verb: 'usertest', workspace: WS, setup: recordedSession,
    args: ['summarize', SESSION, '--html'], files: [`${SESSION}/summary.md`, `${SESSION}/summary.html`], env: env(),
  },
  { id: 'usertest-summarize-no-runs', verb: 'usertest', workspace: WS, setup: (ws) => fs.mkdirSync(path.join(ws, SESSION), { recursive: true }), args: ['summarize', SESSION], env: env() },
  { id: 'usertest-summarize-no-session', verb: 'usertest', workspace: WS, args: ['summarize', '.impeccable/usertest/none'], env: env() },
];

export default cases;
