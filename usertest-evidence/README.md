# `/impeccable usertest`: evaluation

Two fixture apps with planted, documented defects. All numbers below come from the engine driver, `impeccable usertest` (`feat/usertest` at `436cae4`, plus a cost-guidance commit), with no Node or Playwright involved. Sessions 9 (clinic) and 10 (shop).

## Method

- **Runners** are the shipped `impeccable-persona-runner` prompt, run as locked-down headless Claude Code sessions. Each one:
  - runs from its own run directory;
  - has Bash + Read, with Bash allowed only for `<skill>/scripts/impeccable usertest ...` and Read only under the session directory (the permissions the command reference recommends);
  - loads no project settings and no MCP.

  Permission denials: zero in all 66 runs. (`run-matrix.mjs` plays the parent.)
- **The parent starts every driver.** Success checks and persona constraints are sealed outside the run directory; runners see only the persona card, the goal, and the browser.
- **2 runs per cell**, at Haiku (low) and Sonnet (mid). Then a 2-run Opus ceiling check on every cell that failed at both tiers.
- **Shop:** written alongside the skill, so its prompts may be tuned to it.
- **Clinic:** built **blind** by a separate agent. Its defect list was not read until the first clinic session had finished.

## Results

### Clinic (blind): 10 of 12 planted defects found

| Goal | Persona | Haiku | Sonnet | Opus ceiling | Reading |
|---|---|---|---|---|---|
| Book a check-up | Jordan | 2/2 | 2/2 | | passes, with friction |
| Book a check-up | Riley | 2/2 | 1/2 | | passes, with friction; the miss is the phone field |
| Book a check-up | Casey (mobile) | 1/2 | 1/2 | | passes with friction: the date card overflows the phone and Continue is off the right edge; both misses are the phone field |
| Book a check-up | Sam (keyboard) | 0/2 | 0/2 | 0/2 | **blocker for keyboard**: focus is trapped in the time picker |
| Cancel a booking | Alex | 1/2 | 2/2 | | passes; the miss caught the false "Done!" toast |
| Cancel a booking | Jordan | 2/2 | 1/2 + 1 pass-unclaimed | | passes; the unclaimed run met the goal but mistyped `done` |
| Cancel a booking | Sam | 2/2 | 2/2 | | passes, with friction |

| Planted defect | Found? | By |
|---|---|---|
| C1 Medicare-only visit type rejected late with "E-17" | missed | no runner picked that type |
| C2 "No appointments" shown while times load | yes | 16 runs; the driver reports it as text shown during loading |
| C3 keyboard trap in the time picker | yes | Sam, 6/6 blocked at every tier |
| C4 weekday names off by one | yes | 11 runs |
| C5 page overflows at 390px, Continue off-screen | yes | driver, on 4/4 Casey runs; runners had to scroll sideways to reach Continue |
| C6 date of birth and phone have no accessible name | yes | driver, 12 runs |
| C7 phone number rejected as formatted | yes | 12 runs; it caused every booking failure outside Sam |
| C8 details wiped on return or reload | yes | 6 runs (Riley, Casey) |
| C9 notes over 200 characters fail silently | missed | no runner wrote long notes |
| C10 modal does not take focus | yes | Sam, 5 runs |
| C11 inverted "Keep your appointment?" confirm | yes | 11 runs |
| C12 "Done!" toast after keeping the booking | yes | Alex, the one run that pressed OK |

### Shop: 10 of 11 planted defects found

| Goal | Persona | Haiku | Sonnet | Opus ceiling | Reading |
|---|---|---|---|---|---|
| Checkout | Jordan | 0/2 | 2/2 | | **comprehension cost**: Haiku gives up on the case-sensitive promo code, Sonnet retries in capitals |
| Checkout | Casey | 2/2 | 2/2 | | passes, with friction |
| Checkout | Riley | 2/2 | 2/2 | | passes; found the JS crash and the dead Place order |
| Checkout | Sam | 0/2 | 0/2 | 0/2 | **blocker for keyboard**: the size picker is mouse-only |
| Change email | Alex, Jordan, Sam | 0/6 | 0/6 | 0/6 | **false success**: 10 of 12 Haiku and Sonnet runs believed "Saved!"; 5 of 6 Opus runs noticed the header still showed the old address |

Missed: P8, a server error on express shipping. No goal used express.

## Cost

| Tier | Median per run | Max |
|---|---|---|
| Haiku | $0.008 | $0.02 |
| Sonnet | $0.094 | $0.25 |
| Opus | $0.118 | $0.53 |

A 28-run matrix costs $1-2.20, and a ceiling check about $1. Sessions 9 and 10 cost $5.14 in total. Median run time 55 seconds.

## Changes since the Playwright prototype

The first prototype drove Chromium through a Node + Playwright script. The driver is now an engine verb, and rerunning the clinic on it found two driver faults in the old version:

1. **The mobile "blocker" was partly a Playwright fault.** The Playwright runs reported Casey blocked at every tier. Their traces show the Opus runners swiping sideways to find Continue, then Playwright's tap timing out on it three times. The overflow is real (C5), but on its own it is friction, not a block. The earlier write-up overstated it.
2. **The first engine run overcorrected.** It tapped off-screen buttons for the runner. A person can't tap what they can't see, so click, fill, and select now refuse an element that is entirely off the screen, and the runner has to scroll first.
3. **Selection inside shadow DOM read as "nothing happened".** The clinic's time picker marks the chosen slot with `aria-pressed` inside a shadow root. Pressed, selected, and current are now shown to runners and counted as changes.

The blind clinic run before this also found four bugs in the tool, fixed and tested before these numbers: confirm dialogs were auto-answered, snapshots were taken mid-fetch, overflow went undetected under mobile emulation, and native date fields rejected typed dates.

## Limits

- Runners read an element list and look at screenshots at decision points. Purely visual problems belong to `critique`.
- Two samples per cell. Tier splits are directional, not significant.
- Defects behind choices nobody makes (C1, C9, P8) need goals that make those choices.
- The keyboard persona's input is enforced; screen-reader output is not simulated. Runners read the element list, not what a screen reader would announce.
- Both fixtures were built by AI agents. Neither is a real product.
