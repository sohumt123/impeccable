# Usertest summary: 28 runs

Verdicts come from the driver's success check, not the runner's claim:

- **pass**: goal verified and the runner said it was done
- **pass-unclaimed**: goal verified, but the runner did not believe it was done (missing confirmation)
- **false-success**: the runner said it was done; the goal was not met
- **fail**: the runner stopped short; the goal was not met
- **unfinished**: the run ended without done (crash, turn limit, or idle) and the goal was not met
- **unverified**: no success check for this goal; the runner's claim stands alone

## Goal: I want to book my yearly physical, a routine check-up, with a nurse practitioner. Any weekday morning works for me. My name is Priya Raman, born March 14, 1988. My mobile is (415) 555-0137 and my email is priya.raman@example.com.

| run | persona | tier | verdict | claimed | met at step | actions | dead actions | js/network errors | refused |
|---|---|---|---|---|---|---|---|---|---|
| a-casey-low | Casey | low | pass | completed | 25 | 23 | 0 | 0 | 1 |
| a-casey-low-n2 | Casey | low | fail | abandoned | - | 20 | 0 | 0 | 0 |
| a-casey-mid | Casey | mid | pass | completed | 21 | 19 | 0 | 0 | 1 |
| a-casey-mid-n2 | Casey | mid | fail | abandoned | - | 21 | 0 | 0 | 1 |
| a-jordan-low | Jordan | low | pass | completed | 22 | 20 | 0 | 0 | 1 |
| a-jordan-low-n2 | Jordan | low | pass | completed | 24 | 22 | 2 | 0 | 1 |
| a-jordan-mid | Jordan | mid | pass | completed | 19 | 17 | 0 | 0 | 1 |
| a-jordan-mid-n2 | Jordan | mid | pass | completed | 20 | 18 | 0 | 0 | 1 |
| a-riley-low | Riley | low | pass | completed | 28 | 26 | 0 | 0 | 1 |
| a-riley-low-n2 | Riley | low | pass | completed | 32 | 30 | 0 | 0 | 1 |
| a-riley-mid | Riley | mid | fail | blocked | - | 34 | 0 | 0 | 2 |
| a-riley-mid-n2 | Riley | mid | pass | completed | 35 | 33 | 0 | 0 | 1 |
| a-sam-low | Sam | low | fail | abandoned | - | 31 | 1 | 0 | 1 |
| a-sam-low-n2 | Sam | low | fail | abandoned | - | 20 | 1 | 10 | 0 |
| a-sam-mid | Sam | mid | fail | blocked | - | 27 | 0 | 0 | 1 |
| a-sam-mid-n2 | Sam | mid | fail | blocked | - | 33 | 0 | 18 | 1 |

## Goal: I have a follow-up appointment at Harbor Clinic that I can't make any more, so I want to cancel it. My booking reference is HC-4471 and the booking is under Morgan Lee. The reason is a schedule conflict.

| run | persona | tier | verdict | claimed | met at step | actions | dead actions | js/network errors | refused |
|---|---|---|---|---|---|---|---|---|---|
| b-alex-low | Alex | low | fail | unsure | - | 9 | 0 | 2 | 0 |
| b-alex-low-n2 | Alex | low | pass | completed | 13 | 10 | 0 | 4 | 0 |
| b-alex-mid | Alex | mid | pass | completed | 10 | 7 | 0 | 0 | 0 |
| b-alex-mid-n2 | Alex | mid | pass | completed | 10 | 7 | 0 | 0 | 0 |
| b-jordan-low | Jordan | low | pass | completed | 12 | 9 | 0 | 2 | 0 |
| b-jordan-low-n2 | Jordan | low | pass | completed | 14 | 11 | 1 | 2 | 0 |
| b-jordan-mid | Jordan | mid | pass | completed | 10 | 7 | 0 | 0 | 0 |
| b-jordan-mid-n2 | Jordan | mid | pass-unclaimed | none | 10 | 7 | 0 | 0 | 0 |
| b-sam-low | Sam | low | pass | completed | 35 | 32 | 0 | 2 | 0 |
| b-sam-low-n2 | Sam | low | pass | completed | 26 | 23 | 1 | 0 | 0 |
| b-sam-mid | Sam | mid | pass | completed | 25 | 22 | 0 | 0 | 1 |
| b-sam-mid-n2 | Sam | mid | pass | completed | 25 | 22 | 0 | 0 | 1 |

## Evidence by run

### a-casey-low (Casey, low, mobile, pointer): pass
runner: Booked a Preventive exam with Dana Whitfield NP on Tuesday Oct 20 at 9:00 AM, confirmation HC-5201 shown and emailed.
- step 6 page is 564px wide on a mobile screen; it scrolls sideways
- step 8 shown while loading (2.0s), then replaced: "No appointments available on this date."
- step 10 field labeled only by placeholder: e63 "MM/DD/YYYY"
- step 10 control with no accessible name: e65 textbox
- step 14 acted on an unlabeled control: [e65] textbox ""
- step 15 shown while loading (1.6s), then replaced: "Book a visit Manage a booking"
- step 15 simulated leaving mid-flow: page was unloaded and reopened at the same URL
- step 15 field labeled only by placeholder: e83 "MM/DD/YYYY"
- step 15 control with no accessible name: e85 textbox
- step 15 runner bug: Came back to the form and every field was empty. Date, name, birthday and phone all gone. Really annoying when you are on the go and get interrupted.
- step 19 acted on an unlabeled control: [e85] textbox ""
- step 20 refused click: e89 is not on your screen (it is below what you can see); scroll to it first
- step 22 runner friction: Mobile phone says Invalid input with no hint of what format it wants. I typed it the way I always write it, (415) 555-0137. Had to guess.
- step 23 acted on an unlabeled control: [e85] textbox ""
- step 25 shown while loading (1.2s), then replaced: "Booking..."
- step 25 runner bug: Time slots said Available times for Wednesday, October 20, but the confirmation says Tuesday, October 20. Which is it? Made me pause on whether I picked the right day.

### a-casey-low-n2 (Casey, low, mobile, pointer): fail
runner: Booking stalled at the details step: the mobile phone field rejects every format I tried with Invalid input and gives no hint of the expected format.
- step 6 page is 564px wide on a mobile screen; it scrolls sideways
- step 7 shown while loading (2.0s), then replaced: "No appointments available on this date."
- step 7 runner confusion: Picked 10/20/2026 and the heading says Wednesday, October 20. I thought that was a Tuesday. Not sure which one to trust.
- step 11 shown while loading (3.0s), then replaced: "Book a visit Manage a booking"
- step 11 simulated leaving mid-flow: page was unloaded and reopened at the same URL
- step 13 field labeled only by placeholder: e89 "MM/DD/YYYY"
- step 13 control with no accessible name: e91 textbox
- step 17 acted on an unlabeled control: [e91] textbox ""
- step 20 runner friction: Mobile phone says Invalid input after I typed (415) 555-0137. It does not say what format it wants. I have no idea what is wrong with it.
- step 21 acted on an unlabeled control: [e91] textbox ""
- step 22 acted on an unlabeled control: [e91] textbox ""
- step 22 runner friction: Tried three ways to type my phone (with brackets, digits only, dashes). Each time it still says Invalid input. Nothing tells me what it wants. I give up on this.

### a-casey-mid (Casey, mid, mobile, pointer): pass
runner: Booked preventive exam with Dana Whitfield NP, Mon Oct 19 9:00 AM, ref HC-5201.
- step 6 page is 564px wide on a mobile screen; it scrolls sideways
- step 7 shown while loading (2.0s), then replaced: "No appointments available on this date."
- step 7 runner confusion: I typed Oct 19 and the page calls it Tuesday. Is the day wrong? Made me hesitate about trusting the date.
- step 9 shown while loading (3.0s), then replaced: "Book a visit Manage a booking"
- step 9 simulated leaving mid-flow: page was unloaded and reopened at the same URL
- step 9 refused click: e76 is not on your screen (it is to the right of what you can see); scroll to it first
- step 11 field labeled only by placeholder: e89 "MM/DD/YYYY"
- step 11 control with no accessible name: e91 textbox
- step 15 acted on an unlabeled control: [e91] textbox ""
- step 18 runner friction: Phone number marked Invalid input with no hint on the format wanted. I typed it the normal way. Annoying on a phone.
- step 19 acted on an unlabeled control: [e91] textbox ""
- step 21 shown while loading (1.2s), then replaced: "Booking..."

### a-casey-mid-n2 (Casey, mid, mobile, pointer): fail
runner: Phone field rejected three formats with only Invalid input and no hint, so I could not reach review.
- step 6 shown while loading (1.6s), then replaced: "Book a visit Manage a booking"
- step 6 simulated leaving mid-flow: page was unloaded and reopened at the same URL
- step 6 runner friction: Came back after interruption and my choices were wiped. Had to pick visit type and clinician again. Annoying.
- step 9 page is 564px wide on a mobile screen; it scrolls sideways
- step 10 shown while loading (2.0s), then replaced: "No appointments available on this date."
- step 11 refused click: e71 is not on your screen (it is to the right of what you can see); scroll to it first
- step 13 field labeled only by placeholder: e89 "MM/DD/YYYY"
- step 13 control with no accessible name: e91 textbox
- step 17 acted on an unlabeled control: [e91] textbox ""
- step 20 runner friction: Phone says only Invalid input. No hint of what format it wants, and it is the format I normally type.
- step 21 acted on an unlabeled control: [e91] textbox ""
- step 22 acted on an unlabeled control: [e91] textbox ""

### a-jordan-low (Jordan, low, desktop, pointer): pass
runner: Booked a Preventive exam with a nurse practitioner for Oct 19 2026 at 9 AM, confirmation HC-5201 shown on screen.
- step 8 shown while loading (2.0s), then replaced: "No appointments available on this date."
- step 10 field labeled only by placeholder: e63 "MM/DD/YYYY"
- step 10 control with no accessible name: e65 textbox
- step 14 acted on an unlabeled control: [e65] textbox ""
- step 15 refused click: e69 is not on your screen (it is below what you can see); scroll to it first
- step 18 acted on an unlabeled control: [e65] textbox ""
- step 22 shown while loading (1.1s), then replaced: "Booking..."
- step 22 runner friction: Mobile phone said Invalid input with no hint of what format it wants. I typed it the same way I was given and then digits only, and still got Invalid input. I had no idea what to change.
- step 22 runner confusion: Visit type list had Annual Wellness Visit and Preventive exam. I was not sure which was the yearly physical. Annual Wellness says Medicare Part B and I am not on Medicare, so I picked Preventive exam because it said routine check-up. The help text did not settle it.
- step 22 runner confusion: I picked Tuesday October 19 at 9 AM from the times shown, but the confirmation says Monday October 19. I am not sure which day I actually booked.

### a-jordan-low-n2 (Jordan, low, desktop, pointer): pass
runner: Booked a Preventive exam with a nurse practitioner for 9:00 AM on October 19, 2026, and got booking reference HC-5201, though the weekday shown differed between steps.
- step 4 runner confusion: Two visit types sound like my yearly check-up. Annual Wellness Visit says yearly but mentions Medicare Part B, and I am not on Medicare, so I am not sure it is for me. Preventive exam says routine check-up, which is what I asked for. Nowhere says physical. I will go with Preventive exam.
- step 5 dead click: [e22] combobox "Type of visit"
- step 7 dead click: [e32] combobox "Who would you like to see?"
- step 10 shown while loading (2.0s), then replaced: "No appointments available on this date."
- step 12 field labeled only by placeholder: e63 "MM/DD/YYYY"
- step 12 control with no accessible name: e65 textbox
- step 16 acted on an unlabeled control: [e65] textbox ""
- step 17 runner confusion: The mobile phone box had no label I could read, only an empty box after Mobile phone. I guessed it was the right one. Also the date picker said Tuesday, October 19 even though I typed the 19th, which I thought was a Monday. I am not sure which day I booked.
- step 17 refused click: e69 is not on your screen (it is below what you can see); scroll to it first
- step 19 runner friction: Clicked Continue and it says Invalid input under the phone box. I typed (415) 555-0137 exactly as given. I do not know what it wants. Maybe the brackets or dashes are wrong, and nothing says what format it expects.
- step 20 acted on an unlabeled control: [e65] textbox ""
- step 24 shown while loading (1.1s), then replaced: "Booking..."
- step 24 runner bug: The confirmation says Monday, October 19, 2026 at 9:00 AM, but the review step said Tuesday, October 19. I cannot tell which day I actually booked, and that worries me.

### a-jordan-mid (Jordan, mid, desktop, pointer): pass
runner: Booked preventive exam with NP Dana Whitfield, Mon Oct 19 9:00 AM, ref HC-5201.
- step 7 shown while loading (2.0s), then replaced: "No appointments available on this date."
- step 7 runner confusion: I typed Monday Oct 19 but the heading says Tuesday, October 19. Which day is it really? Confusing, I am not sure I booked the right day.
- step 9 field labeled only by placeholder: e63 "MM/DD/YYYY"
- step 9 control with no accessible name: e65 textbox
- step 13 acted on an unlabeled control: [e65] textbox ""
- step 14 refused click: e69 is not on your screen (it is below what you can see); scroll to it first
- step 16 runner friction: Phone says only Invalid input. I typed my number the normal way with brackets and dash-less. No example of the format shown. I do not know what to change.
- step 17 acted on an unlabeled control: [e65] textbox ""
- step 19 shown while loading (1.1s), then replaced: "Booking..."

### a-jordan-mid-n2 (Jordan, mid, desktop, pointer): pass
runner: Booked a Preventive exam with a nurse practitioner, Monday Oct 19 at 9:00 AM, reference HC-5201.
- step 8 shown while loading (2.0s), then replaced: "No appointments available on this date."
- step 8 runner confusion: I picked October 19 and the page says Tuesday, October 19. I thought that was a Monday. Confusing, not sure which day I am booking.
- step 10 field labeled only by placeholder: e63 "MM/DD/YYYY"
- step 10 control with no accessible name: e65 textbox
- step 14 acted on an unlabeled control: [e65] textbox ""
- step 15 refused click: e69 is not on your screen (it is below what you can see); scroll to it first
- step 17 runner friction: Phone number rejected with just Invalid input. No hint what format it wants. I typed it exactly as I was given it.
- step 18 acted on an unlabeled control: [e65] textbox ""
- step 20 shown while loading (1.1s), then replaced: "Booking..."

### a-riley-low (Riley, low, desktop, pointer): pass
runner: Booked a Preventive exam with Dana Whitfield, NP for Oct 20 2026 at 8:30 AM, confirmation HC-5201, though the weekday shown on screen changed between Wednesday and Tuesday.
- step 5 runner friction: I picked Preventive exam but the red Choose a visit type message is still showing and the field still says invalid. Not sure if my pick took.
- step 8 action failed: fill [e43] textbox "Date We're open Monday to Friday.": Malformed value "Test 🧪 émoji 名前" for a date field
- step 9 shown while loading (2.0s), then replaced: "No appointments available on this date."
- step 9 runner confusion: I typed 2026-10-20 and the heading says Wednesday, October 20. I count that as Tuesday. Either the day is wrong or I am miscounting, and I cannot tell which from the screen.
- step 13 shown while loading (2.0s), then replaced: "No appointments available on this date."
- step 14 field labeled only by placeholder: e129 "MM/DD/YYYY"
- step 14 control with no accessible name: e131 textbox
- step 20 acted on an unlabeled control: [e131] textbox ""
- step 20 runner friction: The Mobile phone box has no label of its own. The words Mobile phone sit above it as plain text, so I am not sure the box is tied to them. It also took emoji without complaint.
- step 21 acted on an unlabeled control: [e131] textbox ""
- step 23 refused click: e135 is not on your screen (it is below what you can see); scroll to it first
- step 25 runner friction: Continue says 1 field needs attention. The phone box has my number (415) 555-0137 and is marked Invalid input, with no hint of what format it wants. Earlier emoji in that box was accepted, so the rule is unclear.
- step 26 acted on an unlabeled control: [e131] textbox ""
- step 28 shown while loading (1.1s), then replaced: "Booking..."
- step 28 runner bug: The review step said Wednesday, October 20 but the confirmation says Tuesday, October 20, 2026. The booking is confirmed for one date, and I cannot tell which weekday is right. That is a real problem for a patient.

### a-riley-low-n2 (Riley, low, desktop, pointer): pass
runner: Booked a preventive exam with a nurse practitioner on Oct 20 at 9:00 AM, confirmation HC-5201, though the weekday shown differs between screens.
- step 5 runner friction: I picked Preventive exam but the red error Choose a visit type still shows under the field and the box is still marked invalid. Not sure if my pick registered.
- step 8 action failed: fill [e43] textbox "Date We're open Monday to Friday.": Malformed value "Test 🧪 émoji 名前" for a date field
- step 9 shown while loading (2.0s), then replaced: "No appointments available on this date."
- step 9 runner confusion: Entered 2026-10-20 and the heading says Wednesday, October 20. By my count that date is a Tuesday, so either the weekday or the date looks wrong. I cannot tell which to trust.
- step 12 shown while loading (2.0s), then replaced: "No appointments available on this date."
- step 13 field labeled only by placeholder: e103 "MM/DD/YYYY"
- step 13 control with no accessible name: e105 textbox
- step 19 acted on an unlabeled control: [e105] textbox ""
- step 20 acted on an unlabeled control: [e105] textbox ""
- step 22 field labeled only by placeholder: e123 "MM/DD/YYYY"
- step 22 control with no accessible name: e125 textbox
- step 22 runner friction: Reloaded the page on the Your details step and every field I typed is blank now. The URL still says book, and the steps above still show as done. Annoying, and I would not trust it to keep my info.
- step 26 acted on an unlabeled control: [e125] textbox ""
- step 27 refused click: e129 is not on your screen (it is below what you can see); scroll to it first
- step 29 runner friction: Mobile phone says only Invalid input after I clicked Continue. It does not say what format it wants. I typed (415) 555-0137 which is a normal US number. Not sure if it is the brackets, the dash or the spaces.
- step 30 acted on an unlabeled control: [e125] textbox ""
- step 32 shown while loading (1.1s), then replaced: "Booking..."
- step 32 runner bug: The review step said Wednesday, October 20 at 9:00 AM, but the confirmation says Tuesday, October 20, 2026. The weekday changes between screens, so I do not know which day I actually booked.

### a-riley-mid (Riley, mid, desktop, pointer): fail
runner: Phone field rejected three common formats with only Invalid input, so I could not reach Review.
- step 6 runner friction: After choosing valid values, the red errors Choose a visit type still show and fields still marked invalid until I continue. Confusing.
- step 8 action failed: fill [e43] textbox "Date We're open Monday to Friday.": Malformed value "Test 🧪 émoji 名前" for a date field
- step 10 shown while loading (2.0s), then replaced: "No appointments available on this date."
- step 10 runner bug: Entered 2026-10-24 (a Saturday) and heading says Sunday, October 24. Day name is off by one, I cannot trust the dates shown.
- step 11 shown while loading (2.0s), then replaced: "No appointments available on this date."
- step 13 runner friction: Browser Back from step 2 threw me all the way to the home page, not step 1. Steps do not have their own history entries.
- step 15 field labeled only by placeholder: e93 "MM/DD/YYYY"
- step 15 control with no accessible name: e95 textbox
- step 17 refused click: e99 is not on your screen (it is below what you can see); scroll to it first
- step 19 runner friction: Phone error just says Invalid input. Other fields give examples; this one does not say what format it wants.
- step 19 refused fill: e90 is not on your screen (it is above what you can see); scroll to it first
- step 22 acted on an unlabeled control: [e95] textbox ""
- step 26 field labeled only by placeholder: e117 "MM/DD/YYYY"
- step 26 control with no accessible name: e119 textbox
- step 26 runner friction: Reload kept me on step 3 but wiped everything I typed in the form. Had to retype all fields.
- step 30 acted on an unlabeled control: [e119] textbox ""
- step 34 acted on an unlabeled control: [e119] textbox ""
- step 35 runner bug: Phone field rejects both (415) 555-0137 and 415-555-0137 with only Invalid input. No format hint, no placeholder. Blocked on a normal US number.
- step 36 acted on an unlabeled control: [e119] textbox ""

### a-riley-mid-n2 (Riley, mid, desktop, pointer): pass
runner: Booked preventive exam with NP Dana Whitfield, Oct 21 9:00 AM, ref HC-5201.
- step 6 runner friction: After choosing both options the red errors Choose a visit type still show and fields still invalid until I press Continue. Confusing stale errors.
- step 8 action failed: fill [e43] textbox "Date We're open Monday to Friday.": Malformed value "Test 🧪 émoji 名前" for a date field
- step 9 shown while loading (2.0s), then replaced: "No appointments available on this date."
- step 9 runner bug: Heading says Sunday, October 24 but I entered 2026-10-24 which should be a Saturday. Day name looks wrong.
- step 10 shown while loading (2.0s), then replaced: "No appointments available on this date."
- step 13 field labeled only by placeholder: e66 "MM/DD/YYYY"
- step 13 control with no accessible name: e68 textbox
- step 13 refused click: e72 is not on your screen (it is below what you can see); scroll to it first
- step 15 runner friction: Phone error just says Invalid input. with no format hint, unlike the other fields and the phone box has no visible label text.
- step 21 acted on an unlabeled control: [e68] textbox ""
- step 25 acted on an unlabeled control: [e68] textbox ""
- step 27 field labeled only by placeholder: e111 "MM/DD/YYYY"
- step 27 control with no accessible name: e113 textbox
- step 27 runner bug: Reload on Review page dropped me back to Your details with every field blank, tab title still says Review. Had to retype everything.
- step 31 acted on an unlabeled control: [e113] textbox ""
- step 35 shown while loading (1.1s), then replaced: "Booking..."
- step 35 runner bug: Review said Thursday October 21 but confirmation says Wednesday October 21. Weekday disagrees between screens.

### a-sam-low (Sam, low, desktop, keyboard): fail
runner: Tab cycles only through the time slot buttons on step 2 and never reaches Back or Continue, so I cannot finish booking the Preventive exam with a nurse practitioner.
- step 10 dead press: [e22] combobox "Type of visit"
- step 11 runner friction: Visit type is a combobox. ArrowDown and Space did nothing, no list opened. Typing Preventive finally set it to Preventive exam. I only guessed typing would work; there is no visible list to pick from by keyboard.
- step 17 refused fill: KEYBOARD_ONLY: this persona cannot fill with a pointer. Use press (Tab, Shift+Tab, Enter, Space, arrows) and type.
- step 19 shown while loading (2.0s), then replaced: "No appointments available on this date."
- step 20 focus without visible ring: textbox "Date We're open Monday to Friday."
- step 32 runner bug: Picked 9:00 AM and it shows pressed, but then Tab only cycles through the time buttons. From 3:30 PM it jumps back to 8:30 AM. I never reached Back or Continue. Shift+Tab goes backward through the same times. I cannot find a keyboard way to move on from here.

### a-sam-low-n2 (Sam, low, desktop, keyboard): fail
runner: Could not enter a date. The Date box garbles typed dates, and Ctrl+A did not clear it, so I gave up after three tries at the same field.
- step 10 dead press: [e22] combobox "Type of visit"
- step 11 runner friction: Arrow keys and Enter did nothing on the Type of visit dropdown. Only typing the word Preventive set it, and nothing told me that would work.
- step 19 js error: Failed to load resource: the server responded with a status of 400 (Bad Request)
- step 19 network: 400 GET http://127.0.0.1:4792/api/slots?date=61019-02-02&clinician=np
- step 19 shown while loading (2.0s), then replaced: "No appointments available on this date."
- step 21 js error: Failed to load resource: the server responded with a status of 400 (Bad Request)
- step 21 js error: Failed to load resource: the server responded with a status of 400 (Bad Request)
- step 21 js error: Failed to load resource: the server responded with a status of 400 (Bad Request)
- step 21 js error: Failed to load resource: the server responded with a status of 400 (Bad Request)
- step 21 network: 400 GET http://127.0.0.1:4792/api/slots?date=10192-02-02&clinician=np
- step 21 network: 400 GET http://127.0.0.1:4792/api/slots?date=101920-02-02&clinician=np
- step 21 network: 400 GET http://127.0.0.1:4792/api/slots?date=19202-02-02&clinician=np
- step 21 network: 400 GET http://127.0.0.1:4792/api/slots?date=192026-02-02&clinician=np
- step 21 shown while loading (3.4s), then replaced: "No appointments available on this date."
- step 21 runner friction: Typing a date into the Date box garbles it. I typed 2026-10-19 and it became 61019-02-02, then 10/19/2026 became 192026-02-02. The page says Wednesday February 2 and I never picked that. No date format hint was shown.

### a-sam-mid (Sam, mid, desktop, keyboard): fail
runner: Keyboard focus cycles through time slots and never reaches Continue, so I could not proceed past step 2.
- step 2 refused click: KEYBOARD_ONLY: this persona cannot click with a pointer. Use press (Tab, Shift+Tab, Enter, Space, arrows) and type.
- step 17 shown while loading (2.0s), then replaced: "No appointments available on this date."
- step 17 runner confusion: Heading says Tuesday October 19 but I typed 10/19/2026 which I thought was a Monday. Confusing; unsure which weekday I am booking. Also date format was not stated, and a No appointments message flashed before times loaded.
- step 18 focus without visible ring: textbox "Date We're open Monday to Friday."
- step 29 runner bug: After picking 9:00 AM I tabbed through all the time buttons and focus loops back to 8:30 AM. Back and Continue buttons are never reachable by keyboard. I am stuck and cannot go on to enter my details.

### a-sam-mid-n2 (Sam, mid, desktop, keyboard): fail
runner: Tab wraps within the time slot buttons so I cannot reach Continue by keyboard.
- step 17 js error: Failed to load resource: the server responded with a status of 400 (Bad Request)
- step 17 network: 400 GET http://127.0.0.1:4792/api/slots?date=61019-02-02&clinician=np
- step 17 shown while loading (2.0s), then replaced: "No appointments available on this date."
- step 17 runner friction: Date field has no format hint. I typed 2026-10-19 and it became year 61019, a garbled date, and the page announced times for February 2 with no warning. Confusing.
- step 17 refused fill: KEYBOARD_ONLY: this persona cannot fill with a pointer. Use press (Tab, Shift+Tab, Enter, Space, arrows) and type.
- step 19 js error: Failed to load resource: the server responded with a status of 400 (Bad Request)
- step 19 js error: Failed to load resource: the server responded with a status of 400 (Bad Request)
- step 19 js error: Failed to load resource: the server responded with a status of 400 (Bad Request)
- step 19 js error: Failed to load resource: the server responded with a status of 400 (Bad Request)
- step 19 network: 400 GET http://127.0.0.1:4792/api/slots?date=61019-02-01&clinician=np
- step 19 network: 400 GET http://127.0.0.1:4792/api/slots?date=61019-02-10&clinician=np
- step 19 network: 400 GET http://127.0.0.1:4792/api/slots?date=19202-02-10&clinician=np
- step 19 network: 400 GET http://127.0.0.1:4792/api/slots?date=192026-02-10&clinician=np
- step 19 shown while loading (3.4s), then replaced: "No appointments available on this date."
- step 22 js error: Failed to load resource: the server responded with a status of 400 (Bad Request)
- step 22 js error: Failed to load resource: the server responded with a status of 400 (Bad Request)
- step 22 js error: Failed to load resource: the server responded with a status of 400 (Bad Request)
- step 22 js error: Failed to load resource: the server responded with a status of 400 (Bad Request)
- step 22 network: 400 GET http://127.0.0.1:4792/api/slots?date=192026-01-10&clinician=np
- step 22 network: 400 GET http://127.0.0.1:4792/api/slots?date=192026-10-10&clinician=np
- step 22 network: 400 GET http://127.0.0.1:4792/api/slots?date=192026-10-01&clinician=np
- step 22 network: 400 GET http://127.0.0.1:4792/api/slots?date=192026-10-19&clinician=np
- step 22 shown while loading (3.4s), then replaced: "No appointments available on this date."
- step 22 runner confusion: Heading says Tuesday, October 19 but I thought the 19th was a Monday. Not sure the day name is right. Also the date field announces as a plain textbox with no format.
- step 23 focus without visible ring: textbox "Date We're open Monday to Friday."
- step 35 runner bug: Keyboard trap: after choosing a time, Tab cycles through the time buttons and wraps from 3:30 PM back to 8:30 AM. I cannot reach Continue or Back. I am stuck on step 2 of 4.

### b-alex-low (Alex, low, desktop, pointer): fail
runner: Cancel flow showed a Done toast, but the appointment still reads Booked with no cancelled status, so I cannot confirm it was cancelled.
- step 6 js error: Failed to load resource: the server responded with a status of 404 (Not Found)
- step 6 network: 404 GET http://127.0.0.1:4792/api/bookings/HC-4471?last=Morgan%20Lee
- step 6 runner friction: Entered HC-4471 and Morgan Lee, pressed Enter, and got "We couldnt find a booking with that reference and last name." Field says Last name, so maybe I typed the wrong thing. Not sure what it wants.
- step 11 dialog: confirm "Keep your appointment on Thursday, November 5, 2026 at 10:00 AM?" (pending)
- step 12 dialog: confirm "Keep your appointment on Thursday, November 5, 2026 at 10:00 AM?" (accept)
- step 12 shown while loading (6.4s), then replaced: "Done! Your request has been processed."
- step 12 runner confusion: Said OK on the confirm, and a toast flashed Done! Your request has been processed. But the appointment card still says Booked with the Nov 5 time and both buttons still there. Did it cancel or not? Nothing says Cancelled.

### b-alex-low-n2 (Alex, low, desktop, pointer): pass
runner: Appointment HC-4471 shows as cancelled with a cancellation email sent.
- step 6 js error: Failed to load resource: the server responded with a status of 404 (Not Found)
- step 6 network: 404 GET http://127.0.0.1:4792/api/bookings/HC-4471?last=Morgan%20Lee
- step 6 runner friction: Typed HC-4471 and Morgan Lee, hit Enter, got told no booking matches that reference and last name. Booking reference was right from my email. Not sure if the name format is the issue.
- step 7 js error: Failed to load resource: the server responded with a status of 404 (Not Found)
- step 7 network: 404 GET http://127.0.0.1:4792/api/bookings/HC-4471?last=Morgan%20Lee
- step 9 runner friction: Full name Morgan Lee failed but just Lee worked. Nobody told me the last name field wants only the surname. Wasted three steps on that.
- step 12 dialog: confirm "Keep your appointment on Thursday, November 5, 2026 at 10:00 AM?" (pending)
- step 12 runner confusion: Confirm box asks Keep your appointment on Thursday? and I have no idea which button cancels. I am cancelling, so I will pick Cancel but the wording is backwards.
- step 13 dialog: confirm "Keep your appointment on Thursday, November 5, 2026 at 10:00 AM?" (dismiss)

### b-alex-mid (Alex, mid, desktop, pointer): pass
runner: Appointment HC-4471 cancelled with confirmation shown.
- step 9 dialog: confirm "Keep your appointment on Thursday, November 5, 2026 at 10:00 AM?" (pending)
- step 9 runner confusion: Confirm asks Keep your appointment? after I clicked Continue to cancel. OK/Cancel is backwards and confusing; I guess Cancel means do not keep.
- step 10 dialog: confirm "Keep your appointment on Thursday, November 5, 2026 at 10:00 AM?" (dismiss)

### b-alex-mid-n2 (Alex, mid, desktop, pointer): pass
runner: Appointment HC-4471 cancelled with confirmation shown.
- step 9 dialog: confirm "Keep your appointment on Thursday, November 5, 2026 at 10:00 AM?" (pending)
- step 9 runner confusion: Confirm asks Keep your appointment? I want to cancel, so OK/Cancel is backwards and confusing. Picking Cancel = do not keep.
- step 10 dialog: confirm "Keep your appointment on Thursday, November 5, 2026 at 10:00 AM?" (dismiss)

### b-jordan-low (Jordan, low, desktop, pointer): pass
runner: The page says Appointment HC-4471 has been cancelled, with an emailed cancellation notice, so my follow-up with Morgan Lee is cancelled.
- step 6 js error: Failed to load resource: the server responded with a status of 404 (Not Found)
- step 6 network: 404 GET http://127.0.0.1:4792/api/bookings/HC-4471?last=Morgan%20Lee
- step 6 runner friction: I typed the reference HC-4471 and the name Morgan Lee, then Find booking. It says it could not find a booking with that reference and last name. I am not sure if I typed the wrong thing or the booking is wrong. It says check the email or call the front desk.
- step 8 runner friction: The booking came up after I changed the last name to just Lee. The error had not said the last name was the problem, so I guessed. Found it: Appointment HC-4471, Follow-up visit, Thursday November 5 at 10 AM with Dr Elena Park.
- step 11 dialog: confirm "Keep your appointment on Thursday, November 5, 2026 at 10:00 AM?" (pending)
- step 12 dialog: confirm "Keep your appointment on Thursday, November 5, 2026 at 10:00 AM?" (dismiss)
- step 12 runner confusion: The last box asked Keep your appointment on Thursday November 5 at 10 AM? I wanted to cancel, so I had to think about whether OK or Cancel meant cancel. I pressed Cancel because it means I do not keep it. The wording of that question is backwards to me.

### b-jordan-low-n2 (Jordan, low, desktop, pointer): pass
runner: The page says Appointment HC-4471 has been cancelled, so I am done.
- step 6 js error: Failed to load resource: the server responded with a status of 404 (Not Found)
- step 6 network: 404 GET http://127.0.0.1:4792/api/bookings/HC-4471?last=Morgan%20Lee
- step 6 runner confusion: Found booking page. I typed HC-4471 and Morgan Lee into Last name, and got we could not find a booking. The field says Last name, so I am not sure if I should have put only Lee. Confusing.
- step 10 dead click: [e39] combobox "Reason for cancelling"
- step 13 dialog: confirm "Keep your appointment on Thursday, November 5, 2026 at 10:00 AM?" (pending)
- step 14 dialog: confirm "Keep your appointment on Thursday, November 5, 2026 at 10:00 AM?" (dismiss)
- step 14 runner friction: The Keep your appointment prompt was confusing. I pressed Cancel because I wanted to cancel, and it did cancel. The word Cancel meant the opposite of what I expected, so I had to think about it.

### b-jordan-mid (Jordan, mid, desktop, pointer): pass
runner: Appointment HC-4471 shown as cancelled.
- step 9 dialog: confirm "Keep your appointment on Thursday, November 5, 2026 at 10:00 AM?" (pending)
- step 9 runner confusion: Asked Keep your appointment? after I chose to cancel. OK/Cancel is backwards and confusing; I guess Cancel means do not keep.
- step 10 dialog: confirm "Keep your appointment on Thursday, November 5, 2026 at 10:00 AM?" (dismiss)

### b-jordan-mid-n2 (Jordan, mid, desktop, pointer): pass-unclaimed
runner: run ended without done (stop)
- step 9 dialog: confirm "Keep your appointment on Thursday, November 5, 2026 at 10:00 AM?" (pending)
- step 9 runner confusion: Dialog asks Keep your appointment? with OK/Cancel. I want to cancel the appointment so this is backwards and confusing. Guessing Cancel means no do not keep.
- step 10 dialog: confirm "Keep your appointment on Thursday, November 5, 2026 at 10:00 AM?" (dismiss)

### b-sam-low (Sam, low, desktop, keyboard): pass
runner: Cancelled follow-up HC-4471 for Morgan Lee with reason Schedule conflict; the page confirmed Appointment HC-4471 has been cancelled.
- step 15 js error: Failed to load resource: the server responded with a status of 404 (Not Found)
- step 15 network: 404 GET http://127.0.0.1:4792/api/bookings/HC-4471?last=Morgan%20Lee
- step 15 runner friction: I typed HC-4471 and Morgan Lee and pressed Find booking. An alert says no booking matches that reference and last name. Focus dropped to the top of the page, so I had to tab all the way back. I do not know if I mistyped or the booking is not there. Last name field asked only for last name, I entered full name Morgan Lee, maybe that is the problem.
- step 27 runner friction: Pressed Cancel appointment and a dialog appeared, but keyboard focus stayed on the Cancel button behind it. Tab then jumped to the Insurance plans link at the bottom of the page, outside the dialog. I could not tell the dialog was open except by reading the list. Felt lost.
- step 34 dialog: confirm "Keep your appointment on Thursday, November 5, 2026 at 10:00 AM?" (pending)
- step 35 dialog: confirm "Keep your appointment on Thursday, November 5, 2026 at 10:00 AM?" (dismiss)
- step 35 runner confusion: The final confirm asked Keep your appointment on Thursday November 5 at 10 AM? I wanted to cancel, so I pressed Cancel, which felt backwards. OK would have kept it. The wording is a double negative for someone listening to a screen reader. Would be clearer as Cancel this appointment? with Yes and No.

### b-sam-low-n2 (Sam, low, desktop, keyboard): pass
runner: Cancelled appointment HC-4471 for Morgan Lee with reason Schedule conflict; the page confirmed the cancellation.
- step 13 runner friction: After Find booking, the result loaded but keyboard focus dropped to the page body, so I had to tab from the top to reach the appointment. A screen reader user would expect focus to land on the new Appointment heading or result.
- step 17 runner friction: The Cancel appointment dialog opened, but keyboard focus did not move into it. Tab took me out to the footer link, and the page scrolled away from the dialog. I had to keep tabbing to find the reason field.
- step 21 dead press: [e38] combobox "Reason for cancelling"
- step 25 dialog: confirm "Keep your appointment on Thursday, November 5, 2026 at 10:00 AM?" (pending)
- step 26 dialog: confirm "Keep your appointment on Thursday, November 5, 2026 at 10:00 AM?" (dismiss)
- step 26 runner confusion: The confirm asked Keep your appointment on Thursday November 5 at 10 AM? I had to think about which button cancels it. Cancel answered it, and the page then said Appointment HC-4471 has been cancelled. The wording of the question was backwards for me.
- step 26 runner praise: Once cancelled, the heading and the live region both confirmed Appointment HC-4471 has been cancelled, with a cancellation email. Clear confirmation I could hear.

### b-sam-mid (Sam, mid, desktop, keyboard): pass
runner: Appointment HC-4471 was cancelled and the page confirmed it.
- step 2 refused click: KEYBOARD_ONLY: this persona cannot click with a pointer. Use press (Tab, Shift+Tab, Enter, Space, arrows) and type.
- step 12 runner friction: Submitted search with Enter; results appeared below but focus stayed in the Last name field and no announcement. A screen reader user would not know anything happened.
- step 16 runner friction: Dialog opened but focus stayed on the Cancel appointment button behind it. Unsure where I am; have to Tab to find the dialog.
- step 24 dialog: confirm "Keep your appointment on Thursday, November 5, 2026 at 10:00 AM?" (pending)
- step 24 runner confusion: Confirm asks Keep your appointment? with OK/Cancel. Inverted: I want to cancel the appointment, so is Cancel the right button? Double negative, confusing.
- step 25 dialog: confirm "Keep your appointment on Thursday, November 5, 2026 at 10:00 AM?" (dismiss)

### b-sam-mid-n2 (Sam, mid, desktop, keyboard): pass
runner: Appointment HC-4471 cancelled with reason schedule conflict; confirmation shown and announced.
- step 2 refused click: KEYBOARD_ONLY: this persona cannot click with a pointer. Use press (Tab, Shift+Tab, Enter, Space, arrows) and type.
- step 12 runner friction: After pressing Enter, results appeared below but focus stayed in the Last name field and nothing announced the result. A screen reader user would not know anything happened.
- step 17 runner bug: Cancel dialog opened but focus stayed on the page button, and Tab went to the footer link behind the dialog. Dialog does not trap or receive focus; I had to hunt for it.
- step 24 dialog: confirm "Keep your appointment on Thursday, November 5, 2026 at 10:00 AM?" (pending)
- step 24 runner confusion: Confirm asks Keep your appointment? with OK/Cancel. Inverted: to cancel my appointment I must press Cancel. Very confusing double negative.
- step 25 dialog: confirm "Keep your appointment on Thursday, November 5, 2026 at 10:00 AM?" (dismiss)
