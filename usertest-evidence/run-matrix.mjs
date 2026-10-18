// Plays the /impeccable usertest parent for a demo: starts each run's driver,
// then runs the shipped persona-runner prompt as a locked-down headless Claude:
// cwd = its own run directory, tools = Bash + Read, Bash allowed only for
// `impeccable usertest`, Read only under the session directory, no project
// settings, no MCP. Records each runner's cost. The driver is the engine verb,
// reached through the skill's launcher (IMPECCABLE_BIN picks the build).
//
//   node run-matrix.mjs <matrix.json> <session dir> [--parallel 6]
import { execFile, spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { promisify } from 'node:util';

const run = promisify(execFile);
const REPO = process.env.IMPECCABLE_REPO || process.cwd(); // an impeccable checkout
const LAUNCHER = path.join(REPO, 'skill/scripts/impeccable');
const DRIVER = `${LAUNCHER} usertest`;
const driver = (args, opts = {}) => run(LAUNCHER, ['usertest', ...args], opts);
const AGENT = fs.readFileSync(path.join(REPO, 'skill/agents/impeccable-persona-runner.md'), 'utf8').replace(/^---[\s\S]*?---\n/, '');
const MODELS = { low: 'haiku', mid: 'sonnet', high: 'opus' };

// Profile and Behaviors from critique.md, plus the playbook's driving line.
const PERSONAS = {
  Alex: {
    card: 'You are Alex, an impatient power user. Profile: Expert with similar products. Expects efficiency, hates hand-holding. Will find shortcuts or leave. Behaviors: Skips all onboarding and instructions. Looks for keyboard shortcuts immediately. Tries to bulk-select, batch-edit, and automate. Gets frustrated by required steps that feel unnecessary. Abandons if anything feels slow or patronizing. Try keyboard shortcuts, Enter, and Escape first; abandon at anything slow or patronizing.',
    flags: ['--viewport', 'desktop', '--budget', '15'],
  },
  Jordan: {
    card: 'You are Jordan, a confused first-timer. Profile: Never used this type of product. Needs guidance at every step. Will abandon rather than figure it out. Behaviors: Reads all instructions carefully. Hesitates before clicking anything unfamiliar. Looks for help or support constantly. Misunderstands jargon and abbreviations. Takes the most literal interpretation of any label. Read every label literally; abandon after two confusing dead ends.',
    flags: ['--viewport', 'desktop', '--budget', '30'],
  },
  Sam: {
    card: 'You are Sam, an accessibility-dependent user. Profile: Uses a screen reader (VoiceOver/NVDA), keyboard-only navigation. May have low vision, motor impairment, or cognitive differences. Behaviors: Tabs through the interface linearly. Relies on ARIA labels and heading structure. Cannot see hover states or visual-only indicators. Needs adequate color contrast. May use browser zoom up to 200%. Navigate by what the element list announces, as a screen reader would; do not read screenshots.',
    flags: ['--viewport', 'desktop', '--input', 'keyboard', '--budget', '40'],
  },
  Riley: {
    card: 'You are Riley, a deliberate stress tester. Profile: Methodical user who pushes interfaces beyond the happy path. Tests edge cases, tries unexpected inputs, and probes for gaps in the experience. Behaviors: Tests edge cases intentionally (empty states, long strings, special characters). Submits forms with unexpected data (emoji, RTL text, very long values). Tries to break workflows by navigating backwards, refreshing mid-flow, or opening in multiple tabs. Looks for inconsistencies between what the UI promises and what actually happens. Documents problems methodically. Try @emoji, @long, or @spaces in every field the goal depends on (codes, quantities, search) before the real value; submit once before the form is complete; go back and reload mid-flow once each.',
    flags: ['--viewport', 'desktop', '--budget', '35'],
  },
  Casey: {
    card: 'You are Casey, a distracted mobile user. Profile: Using phone one-handed on the go. Frequently interrupted. Possibly on a slow connection. Behaviors: Uses thumb only; prefers bottom-of-screen actions. Gets interrupted mid-flow and returns later. Switches between apps frequently. Has limited attention span and low patience. Types as little as possible, prefers taps and selections. Use interrupt once mid-flow; prefer taps over typing.',
    flags: ['--viewport', 'mobile', '--network', 'slow', '--budget', '25'],
  },
};

const [matrixFile, sessionArg, ...rest] = process.argv.slice(2);
const parallel = Number(rest[rest.indexOf('--parallel') + 1]) || 6;
const { url, goals, cells } = JSON.parse(fs.readFileSync(matrixFile, 'utf8'));
const session = path.resolve(sessionArg);
fs.mkdirSync(path.join(session, '_runner'), { recursive: true });

async function cell({ goal, persona, tier, name }) {
  const g = goals[goal];
  const runDir = path.join(session, name);
  const p = PERSONAS[persona];
  const startArgs = ['start', '--run', runDir, '--url', g.url || url, '--goal', g.text, '--persona', persona, '--tier', tier, ...p.flags];
  if (g.successText) startArgs.push('--success-text', g.successText);
  if (g.successUrl) startArgs.push('--success-url', g.successUrl);
  try {
    await driver(startArgs, { timeout: 120000 });
  } catch (e) {
    return { name, error: `start failed: ${e.stderr || e.message}` };
  }
  const packet = [p.card, `Your goal: ${g.text}`, `Driver: ${DRIVER}`, `Run directory: ${runDir}`].join('\n');
  const args = [
    '-p', packet,
    '--model', MODELS[tier],
    '--system-prompt', AGENT,
    '--tools', 'Bash', 'Read',
    '--allowedTools', `Bash(${DRIVER} *)`, `Read(/${session}/**)`,
    '--setting-sources', '',
    '--strict-mcp-config',
    '--no-session-persistence',
    '--output-format', 'json',
  ];
  const t0 = Date.now();
  const out = await new Promise((resolve) => {
    const child = spawn('claude', args, { cwd: runDir, stdio: ['ignore', 'pipe', 'pipe'] });
    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (c) => (stdout += c));
    child.stderr.on('data', (c) => (stderr += c));
    const kill = setTimeout(() => child.kill('SIGTERM'), 15 * 60 * 1000);
    child.on('close', (code) => { clearTimeout(kill); resolve({ code, stdout, stderr }); });
  });
  fs.writeFileSync(path.join(session, '_runner', `${name}.json`), out.stdout || out.stderr);
  let result = {};
  try { result = JSON.parse(out.stdout); } catch {}
  await driver(['stop', '--run', runDir]).catch(() => {});
  const denials = result.permission_denials?.length ?? null;
  return { name, denials, code: out.code, seconds: Math.round((Date.now() - t0) / 1000), cost: result.total_cost_usd ?? null, turns: result.num_turns ?? null, reply: String(result.result || out.stderr).slice(0, 600) };
}

const queue = [...cells];
const results = [];
await Promise.all(Array.from({ length: parallel }, async () => {
  while (queue.length) {
    const c = queue.shift();
    const r = await cell(c);
    results.push(r);
    console.log(`${r.name}: exit ${r.code} · ${r.seconds}s · $${r.cost ?? '?'} · ${r.turns ?? '?'} turns · ${r.denials ?? '?'} denials`);
  }
}));
fs.writeFileSync(path.join(session, '_runner', 'results.json'), JSON.stringify(results, null, 2));
const total = results.reduce((s, r) => s + (r.cost || 0), 0);
console.log(`total cost $${total.toFixed(2)} across ${results.length} runs`);
