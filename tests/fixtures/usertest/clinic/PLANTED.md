# Planted defects: Harbor Clinic

Ground truth for scoring a `/impeccable usertest` run against `clinic/`. Do not show this file to the orchestrator or the personas. Start with `node tests/fixtures/usertest/clinic/server.mjs` (port 4792). Static files are served from `clinic/public/` only, so this file is not reachable over HTTP.

Goals (as given in README.md):

- **A. Book a check-up:** yearly physical with a nurse practitioner, weekday morning, as Priya Raman (DOB 03/14/1988, phone (415) 555-0137, priya.raman@example.com). Success text: `Your appointment is confirmed`.
- **B. Cancel:** booking HC-4471, last name Lee, reason schedule conflict. Success text: `Appointment HC-4471 has been cancelled`.

Personas: **Alex** power user, **Jordan** confused first-timer, **Sam** keyboard/screen-reader, **Riley** stress tester, **Casey** mobile on slow network.

| ID | Defect | Where | Personas expected to hit it | Kind |
|---|---|---|---|---|
| C1 | "Annual Wellness Visit" is the obvious match for "yearly physical", but it is Medicare-only (65+). Nothing says so up front (the help text says only "for eligible members"), and the rejection arrives at the very last step as "Something went wrong (E-17). Please try again." Retrying never works; the fix is to go back and pick "Preventive exam". | Step 1 visit select, step 4 submit, `POST /api/bookings` returns 422 `{code:"E-17"}` | Jordan, Casey, Alex (anyone who maps "physical" to "Annual") | copy / comprehension + unhelpful late validation |
| C2 | While times load (~1.4 s server delay), the panel says "No appointments available on this date." before real slots appear. On a slow network users conclude the day is full and switch days or give up. | Step 2 time panel | Casey (strongly), Jordan | misleading empty state / slow network |
| C3 | Keyboard trap: inside the `<hc-slot-picker>` open shadow root, Tab and Shift+Tab are captured and cycle among the time buttons forever. Focus can never reach Continue by keyboard. | Step 2 `<hc-slot-picker>` | Sam (blocker for goal A) | a11y keyboard trap |
| C4 | Weekday names are off by one: `WEEKDAYS` starts at Monday but is indexed with `getDay()` (0 = Sunday), so Monday Oct 26 shows as "Tuesday, October 26" in the times heading and on the review step. The confirmation page (server-formatted) shows the correct day, so they disagree. | Step 2 heading, step 4 review | Alex, Riley (anyone cross-checking dates); Jordan may doubt they picked the right day | logic bug |
| C5 | At 390px wide, the date/time card has `min-width: 34rem` (544px). The page scrolls horizontally and the Continue button sits off-screen to the right. | Step 2 card | Casey | mobile layout overflow |
| C6 | Date of birth and mobile phone have no programmatic label. The visible "Date of birth" / "Mobile phone" text is a `div` with `aria-hidden`; DOB's only name is its "MM/DD/YYYY" placeholder and phone has none at all. | Step 3 | Sam | a11y missing labels |
| C7 | Phone accepts only 10 bare digits. "(415) 555-0137", "415-555-0137", "415 555 0137" and "+1 415..." are all rejected with "Invalid input." and no hint at the expected format. Workaround: type `4155550137`. | Step 3 phone | Everyone on goal A (the visitor's phone number is given formatted) | validation rejects reasonable input / unhelpful error |
| C8 | Your-details fields are never prefilled. Any return to step 3 (Back from review, or "Change" on review then Continue through) wipes name, DOB, phone, email and notes. Hits anyone recovering from C1. | Step 3/4 | Alex, Jordan, Riley; everyone who recovers from C1 | state loss |
| C9 | Notes longer than 200 characters: server returns 422 `{error:"notes too long"}` with no `code`, and the client only renders errors that carry a code. The button flips back to "Confirm booking" and nothing else happens. There is no character limit shown. | Step 3 notes, step 4 submit | Riley (pastes long text), occasionally Jordan | silent failure |
| C10 | Cancel modal is a `div role="dialog"`: focus is not moved into it (it stays on "Cancel appointment" behind the scrim), no `aria-modal`, Escape does nothing, focus is not trapped or returned on close. | Manage, cancel modal | Sam | a11y focus management |
| C11 | The destructive confirm is inverted: `window.confirm("Keep your appointment on ...?")`. OK keeps the appointment; the browser's "Cancel" button is what actually cancels it. | Manage, after modal Continue | Everyone on goal B (Alex and Jordan especially, who click OK by reflex) | destructive confirm with unclear wording |
| C12 | Clicking OK in C11 shows a toast "Done! Your request has been processed." although nothing changed; the booking stays Booked. Only re-running "Find booking" reveals it. | Manage | Everyone who clicks OK in C11 | false success |

Blocks for everyone unless worked around: C7 (goal A), C11 + C12 (goal B). C1 blocks anyone who picks Annual Wellness Visit. Both goals are completable on desktop with a mouse by a careful user: pick Preventive exam, enter the phone as digits only, and press the confirm dialog's Cancel button. Verified with a Playwright script on desktop Chrome.

## Control cases (done right; a run should not flag these)

- Native `<select>` for visit type, clinician type and cancel reason, each with a real `<label>`.
- Native `<input type="date">` with a label, a visible "We're open Monday to Friday" hint wired via `aria-describedby`, and `min` set to today.
- Weekend or past dates get a clear message ("We're closed on weekends. Please pick a weekday.").
- Step changes move focus to the new step's `<h1>` and announce "Step N of 4: ..." in a polite `aria-live` region; the stepper marks the current step with `aria-current="step"`.
- Field errors for name, DOB and email are specific ("Enter your date of birth as MM/DD/YYYY, for example 07/04/1990.", "Enter an email address like name@example.com."), set `aria-invalid`, and are linked by `aria-describedby`; the error count is announced.
- Step 1 and 2 choices (visit, clinician, date, time) survive Back and a page reload (sessionStorage).
- "What should I bring?" uses a native `<dialog>` with `showModal()` (correct focus handling, Escape closes).
- The footer insurance link opens a new tab, says so in its text, and uses `rel="noopener"`.
- Booking lookup trims whitespace and is case-insensitive for both reference and last name; a wrong reference gets a clear, actionable not-found message.
- Cancellation API failures are shown, not swallowed.
- Visible `:focus-visible` outline everywhere, a skip link, 44px minimum button height.
- Confirm button is disabled with "Booking..." while the request is in flight (no double booking).
- Success texts appear only after the server confirms (booking 201, cancel 200).
