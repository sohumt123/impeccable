# `/impeccable usertest`: evaluation

Two fixture apps with planted, documented defects. All numbers below come from the final driver (`feat/usertest` at `ad4a726`).

## Method

- **Runners** are the shipped `impeccable-persona-runner` prompt, run as locked-down headless Claude Code sessions. Each one:
  - runs from its own run directory;
  - has Bash + Read, with Bash allowed only for `node usertest-driver.mjs ...`;
  - loads no project settings and no MCP.

  Permission denials were zero in every final session. (`run-matrix.mjs` in this folder plays the parent; `clinic-blind/summary.md` and `shop/summary.md` are the driver summaries.)
- **The parent starts every driver.** Success checks and persona constraints are sealed outside the run directory; runners see only the persona card, the goal, and the browser.
- **2 runs per cell**, at Haiku (low) and Sonnet (mid). Then a 2-run Opus ceiling check on every cell that failed at both tiers.
- **Shop:** written alongside the skill, so its prompts may be tuned to it.
- **Clinic:** built **blind** by a separate agent. Its defect list was not read until every clinic run had finished.

## Results

### Clinic (blind): 9 of 12 planted defects found

| Goal | Persona | Haiku | Sonnet | Opus ceiling | Reading |
|---|---|---|---|---|---|
| Book a check-up | Jordan | 2/2 | 2/2 | | passes, with friction |
| Book a check-up | Riley | 2/2 | 2/2 | | passes, with friction |
| Book a check-up | Casey (mobile) | 0/2 | 0/2 | 0/2 | **blocker for mobile**: the page overflows and Continue is off-screen |
| Book a check-up | Sam (keyboard) | 0/2 | 0/2 | 0/2 | **blocker for keyboard**: focus is trapped in the time picker |
| Cancel a booking | Alex | 2/2 | 2/2 | | passes |
| Cancel a booking | Jordan | 2/2 | 2/2 | | passes |
| Cancel a booking | Sam | 1/2 | 2/2 | | passes, with friction |

| Planted defect | Found? | By |
|---|---|---|
| C1 Medicare-only visit type rejected late with "E-17" | missed | no runner picked that type |
| C2 "No appointments" shown while times load | yes | 15 runs; the driver reports it as text shown during loading |
| C3 keyboard trap in the time picker | yes | Sam, 4/4 blocked at every tier |
| C4 weekday names off by one | yes | 14 runs |
| C5 page overflows at 390px, Continue off-screen | yes | driver, on 4/4 Casey runs; Casey blocked at every tier |
| C6 date of birth and phone have no accessible name | yes | driver |
| C7 phone number rejected as formatted | yes | 8 runs |
| C8 details wiped on return to step 3 | yes | Riley |
| C9 notes over 200 characters fail silently | missed | no runner wrote long notes |
| C10 modal does not take focus | yes | Sam, 3 notes |
| C11 inverted "Keep your appointment?" confirm | yes | 11 runs |
| C12 "Done!" toast after keeping the booking | missed | only triggers after pressing OK on C11, and every runner read the dialog and pressed Cancel |

### Shop: 10 of 11 planted defects found

| Goal | Persona | Haiku | Sonnet | Opus ceiling | Reading |
|---|---|---|---|---|---|
| Checkout | Jordan | 0/2 | 2/2 | | **comprehension cost**: Haiku gives up on the case-sensitive promo code, Sonnet retries in capitals |
| Checkout | Casey | 2/2 | 2/2 | | passes, with friction |
| Checkout | Riley | 2/2 | 2/2 | | passes; found the JS crash and the dead Place order |
| Checkout | Sam | 0/2 | 0/2 | 0/2 | **blocker for keyboard**: the size picker is mouse-only |
| Change email | Alex, Jordan, Sam | 0/6 | 0/6 | 0/6 | **false success**: 10 of 12 Haiku and Sonnet runs believed "Saved!" |

Missed: P8, a server error on express shipping. No goal used express. It also found 2 defects that weren't planted: the total ignores the discount, and Enter doesn't submit the email form.

## Cost

| Tier | Median per run | Max |
|---|---|---|
| Haiku | $0.004 | $0.01 |
| Sonnet | $0.055 | $0.11 |
| Opus | $0.14 | $0.39 |

A 28-run matrix costs about $1-2, and the ceiling check about $1-1.50. The final evidence above cost $5.44 in total.

## What the blind test caught in the tool

Each of these was fixed and covered by a test before the final runs:

1. **Confirm dialogs were auto-answered.** The runner never chose; the driver pressed OK. Dialogs now pause the run until the runner answers.
2. **Snapshots were taken mid-fetch.** Playwright's `networkidle` only covers the initial load. The driver now tracks in-flight requests and reports text shown while loading.
3. **Overflow went undetected under mobile emulation.** The layout viewport widens to fit content, so overflow is now measured against the device width.
4. **Native date fields rejected typed dates.**

## Limits

- Runners read an element list and look at screenshots at decision points. Purely visual problems belong to `critique`.
- Two samples per cell. Tier splits are directional, not significant.
- Defects behind choices nobody makes (C1, C9, P8) need goals that make those choices.
