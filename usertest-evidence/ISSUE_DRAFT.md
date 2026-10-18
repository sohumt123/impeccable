<!-- Draft for you to post yourself at github.com/pbakaus/impeccable/issues/new. Edit freely. -->

# Proposal: `/impeccable usertest`, persona agents that actually walk the flow

**AI disclosure:** I wrote the prototype branch with Claude Code (Opus). I reviewed the design and ran the demo below.

## The gap

`critique` has a persona section (Alex, Jordan, Sam, Riley, Casey), but the personas are imagined: the model pictures each one doing the primary action and lists red flags. Nothing gets clicked. That misses a whole class of problems that only show up when someone tries to finish a task: a control you can't reach by keyboard, a promo code rejected as typed, a "Saved!" toast that never saved, form state lost after a reload.

## The proposal

A new Evaluate command, `usertest [target] [goals]`:

1. Confirm 2-3 goals in the visitor's words, each with a success check the driver can verify (confirmation text or URL).
2. Pick personas with critique's existing selection table. It reuses critique's persona cards and doesn't redefine them.
3. Spawn one fresh sub-agent per goal × persona × model tier (Haiku and Sonnet on Claude Code by default). Each one drives a real browser through a small driver that **enforces** the persona's constraints: Sam is keyboard-only and the driver refuses clicks; Casey gets a 390px touch viewport, slow network, and a mid-flow tab interrupt.
4. The driver writes the ground-truth trace itself: each step's effect (navigated / changed / none), console errors, 4xx/5xx responses, pointer-only and unlabeled controls, small targets, missing focus rings, and whether the success check passed. Runners see only what a visitor would see; the diagnostics stay in the trace.
5. **Ceiling check:** when every tier fails a goal, rerun that cell once at Opus. If Opus also fails, it's an interface blocker; if only the low tier fails, it's a comprehension cost.
6. Report ranked findings with step and screenshot citations, routed to the commands that own the fix (`clarify`, `harden`, `adapt`, `audit`...). The driver also writes a `summary.html` with the verdict matrix and screenshots.

## Evaluation

Two fixture apps with planted, documented defects. Runners were run as locked-down headless sessions that could only call the driver: 2 runs per cell at Haiku and Sonnet, plus an Opus ceiling check.

- **Blind fixture (a clinic, built by a separate agent; I didn't read its defect list until scoring):** **9 of 12** defects found.
  - Mobile users are blocked: the page overflows and Continue sits off-screen. Fails 0/6 across all tiers.
  - Keyboard users are blocked: focus is trapped in the time picker. Fails 0/6.
  - An inverted "Keep your appointment?" confirm was hit in 11 runs.
  - A misleading "No appointments" shows while times load.
  - Formatted phone numbers are rejected.
  - Weekday names are off by one.
- **Shop fixture:** **10 of 11** found.
  - A fake "Saved!" was believed in 10 of 12 runs (false success).
  - A case-sensitive promo code stopped Haiku (0/2) but not Sonnet (2/2), the comprehension-cost signal.
- **Cost:** about $1-2 per 28-run matrix (median $0.004 Haiku, $0.055 Sonnet, $0.14 Opus per run).

The blind run also found four bugs in the tool itself, all fixed and tested before the final numbers:
- confirm dialogs were auto-answered;
- snapshots were taken mid-fetch;
- overflow went undetected under mobile emulation;
- typed dates were rejected.

Full write-up and harness: `usertest-evidence` branch of my fork.

## Prototype

Branch: `feat/usertest` on github.com/sohumt123/impeccable. Happy to open a PR if you want it.

- `skill/reference/usertest.md`: the command playbook
- `skill/agents/impeccable-persona-runner.md`: the runner sub-agent
- `skill/scripts/usertest-driver.mjs`: Playwright driver daemon, one per run, plus `summarize --html`
- Registration in the router table, metadata (both copies), categories, sub-commands, the `pin` list, and the command counts
- `tests/fixtures/usertest/`: the shop and its planted-defect list
- `bun run build`, `bun run test` (against a locally built engine, including the oracle with a new `pin-usertest` case), and the new opt-in `bun run test:usertest-e2e` (12 scripted driver tests) all pass.
- The pinned engine binary rejects `pin usertest` until an engine release includes the `pin.rs` change.

## Open questions for you

1. **Runtime.** The driver is Node + Playwright under `skill/scripts/`, which goes against the "no runtime required" direction, and runner Bash calls prompt unless `node .../usertest-driver.mjs` is allowed. Would you rather have it as an engine verb on top of `crates/browser`'s CDP code? The verb surface is small (start / act / observe / done / summarize).
2. **Playwright dependency.** Right now it resolves from the project, then the skill, then `~/.impeccable/usertest`, and prints an install command if it finds none. Is that acceptable?
3. **Cost.** The default matrix is about 12 sub-agent sessions, most of them cheap tiers. It asks before going above 16 runs.
4. **Cursor `readonly: true`.** The transformer marks the runner read-only because it has no Write or Edit. Does Cursor's readonly mode still allow shell commands? The runner needs them for the driver.
5. **Name.** Is `usertest` the right name? I also considered `walk` and `journey`.
