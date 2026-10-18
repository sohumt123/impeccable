### Purpose

Send personas into the running product to complete real goals, at more than one model tier, and report where they got stuck. Critique imagines a persona walking the primary action; usertest makes one walk it, in a real browser, and keeps the trace. The deliverable is a ranked list of pain points and bugs, each tied to the step, screenshot, and personas that hit it.

### Hard Invariants

- Every finding cites evidence from a trace: a run, a step number, and a screenshot or driver line. A finding without a trace reference is critique, not usertest; leave it out or route it to `critique`.
- Success is what the driver verified, not what a runner claimed. Report both when they disagree; the disagreement is itself a finding.
- You start every run's driver; the runner only acts. The persona's constraints (device, keyboard-only, network, budget) and the goal's success check go to `start`, which seals them outside the run directory. A runner never sees a success check, a profile flag, source code, an app file path, or a fixture's planted-defect list.
- Each run is a fresh sub-agent with no forked history. A runner that inherits this conversation knows the code, the success checks, and your hypotheses, and stops being a visitor.
- Runners see what a visitor perceives; the driver keeps the diagnostics (console and network errors, unlabeled and pointer-only controls, target sizes, focus rings) in the trace. Never paste diagnostics into a runner's packet.
- The driver owns the browser. Do not drive runs inline through the harness browser tool: parallel runs need isolated sessions, and the report needs the driver's trace.
- Runners read the page mostly as a list of elements and look at screenshots at decision points. They under-detect purely visual problems (a primary action below the fold, weak contrast, misleading grouping). Route those to `critique`; do not claim usertest covered them.
- The driver cannot list what sits inside an embedded frame (payment widgets, embedded forms); the runner sees a notice and the screenshot. A goal that depends on one is reported as partially observed.
- Usertest is web-only. On `ios`, `android`, or `adaptive`, say so and offer `critique` instead.
- Any local server started for the run is backgrounded with a recorded stop method and stopped before the report, unless the user asks to keep it.
- The question is the LAST thing in the response, as in critique.

### Setup

1. **Preflight the driver** once: `node {{scripts_path}}/usertest-driver.mjs preflight`. The driver needs Node 20+ and Playwright. On `USERTEST_NEEDS_PLAYWRIGHT`, show the user the printed install command and ask before running it (it installs into `~/.impeccable/usertest`, not the project). On `USERTEST_NO_BROWSER`, run `npx --prefix ~/.impeccable/usertest playwright install chromium` with the user's consent. Do not continue without `USERTEST_READY`.
2. **Resolve a start URL.** Use the running dev server if there is one; otherwise start the project's dev or static server in the background. `file://` is not supported. Confirm the URL loads before starting anything.
   - **Local by default.** The driver refuses any host that is not this machine (`USERTEST_REMOTE_TARGET`). Runners click everything: against a staging or production site that means real orders, emails, and deletions. Pass `--allow-remote` only after the user has named that host and agreed, and never against a site that takes real payments. Confirm and prompt dialogs pause the run until the runner answers them, as a visitor would.
   - **Signed-in goals.** When a goal needs an account, sign in once yourself before the matrix: `start` a setup run with no `--persona` on the login page, drive it to the signed-in state with the test credentials the user gives you, then `save-state ~/.impeccable/usertest/auth/<slug>.json` and `stop`. The file holds live cookies; it is written with owner-only permissions and stays outside the project. Every runner's `start` then carries `--storage-state` with that path. Runners never see credentials. Signing up or logging in as the goal itself needs no saved state.
3. **Slug the target** with `{{scripts_path}}/impeccable critique-storage slug "<start url or source path>"`. The session directory is `.impeccable/usertest/<slug>/<YYYYMMDD-HHMM>/`; each run writes to its own subdirectory, named `<goal id>-<persona>-<tier>` (for example `a-jordan-low`), and the driver keeps sealed profiles and verdicts in `_sealed/` beside them.
4. **Permissions.** A matrix makes several hundred driver calls from sub-agents. On a harness that prompts per shell command, tell the user before starting and suggest allowing `node <scripts path>/usertest-driver.mjs` for the session.

### Goals

A goal is something a visitor arrives wanting, in their words, with a check the driver can verify.

- **From the user:** goals passed as arguments win. Rewrite each into the visitor's words without UI vocabulary: "buy a medium notebook," never "click the size dropdown and select Medium."
- **Otherwise, derive 2-3** from PRODUCT.md, the surface brief, and the routes and forms in the code: the primary task on an Operate surface, the conversion on a Persuade surface, finding a specific answer on a Read surface. Present them with their success checks and confirm once before running. {{ask_instruction}}
- **Success check:** for each goal, read the code to find what only a completed goal shows: a confirmation string (`--success-text`), a path or `#hash` fragment (`--success-url`, matched against the path and hash, never the query), or both. Prefer text that only the real end state renders, and never text a failure path or an optimistic toast can render. A goal with no verifiable end state still runs, but its verdict is `unverified`.
- **Data the visitor would have** (a promo code from an email, an account email, an order number) goes in the goal text, written the way the visitor would have it. Do not correct case or format; a code the product rejects as given is a finding.
- **Shared state.** Parallel runs share one backend. A goal that changes state other runs start from (account settings, a single cart, inventory) runs its cells one after another, or each run gets its own seeded account and storage state. Record how state was reset in Run notes.

### Personas and driving profiles

The personas are the five in [critique.md's Persona-Based Design Testing](critique.md#persona-based-design-testing), selected with its interface-type table, plus project-specific personas built with its template when real Design Context exists. Read that section; do not restate the cards from memory. Pass each runner the persona's name, **Profile**, and **Behaviors** only. The Test Questions and Red Flags are reviewer prompts: a runner handed them starts auditing instead of visiting. Keep them for synthesis, where they tell you which failures belong to which persona.

Each persona drives with a profile the driver enforces, so the constraint is real rather than role-played:

| Persona | `start` flags | Runner behavior to add to the card |
|---|---|---|
| Alex, power user | `--viewport desktop --budget 15` | Try keyboard shortcuts, Enter, and Escape first; abandon at anything slow or patronizing. |
| Jordan, first-timer | `--viewport desktop --budget 30` | Read every label literally; abandon after two confusing dead ends. |
| Sam, assistive tech | `--viewport desktop --input keyboard --budget 40` | Navigate by what the element list announces, as a screen reader would; do not read screenshots. |
| Riley, stress tester | `--viewport desktop --budget 35` | Try `@emoji`, `@long`, or `@spaces` in every field the goal depends on (codes, quantities, search) before the real value; submit once before the form is complete; go `back` and `reload` mid-flow once each. |
| Casey, mobile | `--viewport mobile --network slow --budget 25` | Use `interrupt` once mid-flow; prefer taps over typing. |

A project-specific persona takes the flags of the closest predefined persona unless the Design Context names a device or input constraint.

### Tiers

The tier is the runner's model. A stronger model is not a smarter user; it is a more persistent one. Tiers separate interface faults from comprehension cost. That ordering is a working assumption, not a measured fact; the report says so.

- **low:** the cheapest model the harness offers (`haiku` on Claude Code). Closest to a hurried visitor.
- **mid:** the default working model (`sonnet` on Claude Code).
- **high:** the strongest model (`opus` on Claude Code). Used as the ceiling check below, not in the default matrix.

On a harness with no per-agent model choice, run one tier and say so in the report header.

### Run matrix

Default: every confirmed goal × the 2-3 personas the selection table picks × `low` and `mid`. Add Sam whenever a goal involves a form or a custom control. State the matrix, its run count, and its cost before starting. Measured on Claude Code, a run costs about $0.005 at low, $0.06 at mid, and $0.15 at high (up to $0.40), and takes 20-90 seconds; a 28-run default matrix comes to about $1. Above 32 runs, ask first.

For each cell, start its driver yourself, then spawn its runner:

```bash
node {{scripts_path}}/usertest-driver.mjs start --run <session dir>/<run name> --url <start url> \
  --goal "<goal text>" --persona <Name> --tier <tier> <profile flags> \
  [--success-text "..."] [--success-url "..."] [--storage-state <file>]
```

Start runs in parallel, at most six at a time; each driver launches its own browser. Spawn the shipped runner, `impeccable-persona-runner` (`impeccable_persona_runner` in codex; on GitHub Copilot say "Use the impeccable-persona-runner agent"), with the tier as the model override and this packet, and nothing else:

```
You are <persona name>. <Profile and Behaviors from the card, plus the driving-profile behavior line>
Your goal: <goal text in the visitor's words>
Driver: node <absolute path to {{scripts_path}}>/usertest-driver.mjs
Run directory: <absolute session dir>/<run name>
```

Never read the shipped agent's definition file before spawning. On a harness with no sub-agent tool, run each persona sequentially in a fresh context if the harness allows one, and otherwise lead the report with `⚠️ DEGRADED: single-context (<reason>)`.

Wait on runners with one long timeout rather than a loop of short polls. A runner that crashes or returns without calling `done` gets one respawn into a new directory, `<run name>-r2`, with a fresh `start`; the first directory stays as evidence. A second failure is reported as a failed run, not retried.

### Ceiling check

For every goal × persona cell where every tier in the matrix failed verification, run one more pass at `high`. Do it for every such cell, not a sample. This is the only escalation. Then classify:

| Pattern | Reading | Default severity |
|---|---|---|
| All tiers fail, including high | Interface blocker: nobody gets through | P0 when the goal is the surface's primary task, else P1 |
| Low fails, mid or high passes | Comprehension cost: it works if you push | P2, raised to P1 when the low run abandoned at a step most runs also stumbled on |
| Passes, with notes, dead actions, or detours | Friction | P2 or P3 by how many runs hit it |
| `false-success`: claimed complete, driver says not met | The interface signalled completion it did not deliver | P1 |
| `pass-unclaimed`: driver met, runner unsure or gave up | Missing confirmation | P2 |
| JS error, 4xx/5xx, or stuck control, any tier | Bug | P0-P1 when it blocks the goal, else P2 |
| Persona-specific failure (only Sam, only Casey) | Excluded user | Same as the blocker row, scoped to that persona |

Severity follows critique's P0-P3 scale. A failure the low tier hits alone is still a finding: hurried visitors are real visitors.

### Synthesis

Run `node {{scripts_path}}/usertest-driver.mjs stopall <session dir>` first, so no browser outlives the session, then `node {{scripts_path}}/usertest-driver.mjs summarize <session dir> --html`. It prints the verdict legend, the matrix, and the per-run evidence, and writes `summary.md` and `summary.html` (verdict matrix plus a screenshot per marked step) into the session directory. Then build the report from it:

1. **Read the evidence, not the narration.** For each failed or noted run, open the screenshots at the steps the summary marks. Confirm the finding is real: a dead action on an element that should do nothing is not a finding; a runner that misread a clear label is a weak signal unless other runs misread it too.
2. **Merge across runs.** One defect hit by four runs is one finding with four citations, not four findings. Count how many runs and which personas and tiers hit each one; that count is the strongest signal in the report.
3. **Weigh single runs.** Each cell is one sample, and a model can flip between runs. Before ranking a finding P0 or P1, and before reading a low-fails-mid-passes split as comprehension cost, rerun the cell once at the same tier (into `<run name>-r2`) and report `k of n`.
4. **Separate the product from the runner.** If only one runner hit something and its trace shows the model misbehaving (ignoring an obvious control, looping), drop it or list it under Run notes.
5. **Separate who found it.** A defect a persona ran into is stronger evidence than one the driver detected on a page no persona was slowed by. Say which it was.

### Report

The first line declares the method: `Method: <n> runs (<personas> × <tiers>), ceiling check <n> runs, reruns <n>; runners act on an element list with screenshots at decision points` or the degraded banner.

**Matrix.** Goal × persona × tier, each cell the summary's verdict (`pass`, `pass-unclaimed`, `false-success`, `fail`, `unfinished`, `unverified`) and the action count. Include the session's `summary.html` path.

**Findings**, ordered by severity, each with:
- **[P?] Title** naming the defect, not the symptom category.
- **Hit by:** personas and tiers, `k of n` runs; or `driver` when no persona ran into it.
- **Evidence:** run, step, and what the screenshot or driver line shows. Quote the runner's note when it says what the visitor felt.
- **Why it matters:** what this costs the visitor, in one sentence.
- **Fix:** the concrete change, and the command that owns it: `{{command_prefix}}impeccable clarify` for copy and labels, `harden` for errors, empty states and state loss, `adapt` for mobile and target size, `audit` for keyboard and screen-reader gaps, `onboard` for first-run guidance, `distill` for steps that should not exist.

**What worked.** Two or three steps where every run moved through without hesitation. Keep it short and specific.

**Run notes.** Failed or respawned runs, runner misbehavior you discounted, unverifiable or partially observed goals, how shared state was reset, and the server you started and stopped.

### Persist

The session directory already holds every trace, screenshot, and the summary files. Write the final report to `report.md` in the same directory. Do not delete run directories; the screenshots are the evidence a reviewer will ask for. Suggest adding `.impeccable/usertest/` to `.gitignore` if the project has not.

### Close

Ask which findings to fix first, offering the top three by severity with the command each routes to. {{ask_instruction}} The question is the last thing in the response.
