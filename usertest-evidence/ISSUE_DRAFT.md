<!-- Draft for you to post yourself at github.com/pbakaus/impeccable/issues/new. Edit freely. -->

# Proposal: `/impeccable usertest`, persona agents that actually walk the flow

**AI disclosure:** I wrote the prototype branch with Claude Code (Opus). I reviewed the design and ran the evaluation below.

## The gap

`critique` has a persona section (Alex, Jordan, Sam, Riley, Casey), but the personas are imagined: the model pictures each one doing the primary action and lists red flags. Nothing gets clicked. That misses problems that only show up when someone tries to finish a task: a control you can't reach by keyboard, a phone number rejected as typed, a "Saved!" toast that never saved, form state lost after a reload.

## The proposal

A new Evaluate command, `usertest [target] [goals]`:

1. Confirm 2-3 goals in the visitor's words, each with a success check the driver can verify (confirmation text or URL).
2. Pick personas with critique's selection table, reusing its persona cards.
3. Spawn one fresh sub-agent per goal × persona × model tier (Haiku and Sonnet on Claude Code). Each one drives a real browser through a driver that **enforces** the persona's constraints: Sam is keyboard-only and clicks are refused; Casey gets a 390px touch screen, a slow network, and a mid-flow interrupt.
4. The driver records the ground truth itself:
   - what each step did (navigated / changed / none);
   - console errors and 4xx/5xx responses;
   - pointer-only and unlabeled controls, small targets, missing focus rings;
   - whether the success check passed.

   Runners see only what a visitor would see; the diagnostics stay in the trace.
5. **Ceiling check:** when every tier fails a goal, rerun that cell at Opus. If Opus fails too, it's an interface blocker; if only the low tier fails, it's a comprehension cost.
6. Report ranked findings with step and screenshot citations, routed to the commands that own the fix (`clarify`, `harden`, `adapt`, `audit`...), plus a `summary.html` with the verdict matrix and screenshots.

**No new runtime.** The driver is an engine verb, `impeccable usertest`, in a new `crates/usertest`. It drives the installed Chrome that `detect <url>` already finds, through the existing CDP client, with two small additive methods on `crates/browser`'s `Browser`. Nothing is downloaded.

## Evaluation

Two fixture apps with planted, documented defects. Runners ran as locked-down headless Claude Code sessions that could only call the driver and read their own screenshots: 2 runs per cell at Haiku and Sonnet, plus an Opus ceiling check. Zero permission denials across 66 runs.

- **Blind fixture (a clinic, built by a separate agent; I didn't read its defect list until scoring): 10 of 12 found.**
  - Keyboard users can't book: focus is trapped in the time picker. Blocked 6/6, Opus included.
  - Formatted phone numbers are rejected with a bare "Invalid input": 12 runs, and the cause of every other booking failure.
  - An inverted "Keep your appointment?" confirm: 11 runs.
  - A misleading "No appointments" shows while times load: 16 runs.
  - Weekday names are off by one; the page overflows a phone and hides Continue off the right edge.
- **Shop fixture: 10 of 11 found.**
  - A fake "Saved!" was believed in 10 of 12 Haiku and Sonnet runs; 5 of 6 Opus runs noticed the header still showed the old address.
  - A case-sensitive promo code stopped Haiku (0/2) but not Sonnet (2/2): the comprehension-cost signal.
- **Missed:** defects behind choices no runner made (a visit type nobody picked, long notes nobody wrote, express shipping no goal asked for).
- **Cost:** $1-2.20 per 28-run matrix (median per run $0.008 Haiku, $0.094 Sonnet, $0.12 Opus).

An earlier Playwright prototype of the driver reported mobile users as blocked at every tier. The traces showed that was Playwright's tap timing out on a button the runners had already found. The current numbers come from the engine driver, which makes runners scroll to anything off-screen before acting on it. Full write-up and harness: `usertest-evidence` branch of my fork.

## Prototype

Branch: `feat/usertest` on github.com/sohumt123/impeccable. Happy to open a PR if you want it.

- `skill/reference/usertest.md`: the command playbook
- `skill/agents/impeccable-persona-runner.md`: the runner sub-agent
- `crates/usertest`: the driver (`preflight`, `start`, runner verbs, `stopall`, `summarize --html`), documented in `docs/CLI-CONTRACT.md`
- Registration in the router table, metadata (both copies), categories, sub-commands, the `pin` list, and the command counts
- `tests/fixtures/usertest/`: the shop and the blind clinic, each with its planted-defect list
- Checks:
  - `bun run build` passes.
  - `bun run test` passes against a locally built engine, including the oracle with 12 new cases: `pin-usertest` and the browser-free `usertest` paths.
  - `cargo test --workspace` passes.
  - The opt-in `bun run test:usertest-e2e` (13 scripted tests in a real Chrome) passes.
- Not done, because it lives in impeccable-site: steps 8-9 of "Adding New Commands" (relationships, site data).
- `pin usertest` and the verb itself need an engine release that includes these crates.

## Open questions for you

1. **Shape.** A new crate, or should the driver live inside `crates/browser`?
2. **Cost.** The default matrix is about 28 sub-agent runs, mostly cheap tiers, and the playbook asks first above 32. Is that the right default?
3. **Harnesses without tiers.** On a harness with no per-agent model choice it runs one tier and says so. Is that acceptable, or should the command be Claude Code-first?
4. **Name.** Is `usertest` the right name? I also considered `walk` and `journey`.
