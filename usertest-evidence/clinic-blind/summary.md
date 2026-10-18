# Usertest summary: 32 runs

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
| a-casey-high | Casey | high | fail | abandoned | - | 12 | 1 | 0 | 0 |
| a-casey-high-n2 | Casey | high | fail | abandoned | - | 12 | 1 | 0 | 0 |
| a-casey-low | Casey | low | fail | abandoned | - | 11 | 0 | 0 | 0 |
| a-casey-low-n2 | Casey | low | fail | abandoned | - | 10 | 1 | 0 | 0 |
| a-casey-mid | Casey | mid | fail | blocked | - | 14 | 2 | 0 | 0 |
| a-casey-mid-n2 | Casey | mid | fail | blocked | - | 10 | 2 | 0 | 0 |
| a-jordan-low | Jordan | low | pass | completed | 19 | 17 | 1 | 0 | 0 |
| a-jordan-low-n2 | Jordan | low | pass | completed | 19 | 17 | 1 | 0 | 0 |
| a-jordan-mid | Jordan | mid | pass | completed | 18 | 16 | 1 | 0 | 0 |
| a-jordan-mid-n2 | Jordan | mid | pass | completed | 18 | 16 | 1 | 0 | 0 |
| a-riley-low | Riley | low | pass | completed | 34 | 32 | 2 | 0 | 0 |
| a-riley-low-n2 | Riley | low | pass | completed | 33 | 31 | 1 | 0 | 0 |
| a-riley-mid | Riley | mid | pass | completed | 32 | 30 | 0 | 0 | 0 |
| a-riley-mid-n2 | Riley | mid | pass | completed | 32 | 30 | 1 | 0 | 0 |
| a-sam-high | Sam | high | fail | blocked | - | 31 | 3 | 0 | 0 |
| a-sam-high-n2 | Sam | high | fail | blocked | - | 30 | 2 | 0 | 0 |
| a-sam-low | Sam | low | fail | abandoned | - | 22 | 1 | 18 | 0 |
| a-sam-low-n2 | Sam | low | fail | abandoned | - | 22 | 1 | 26 | 1 |
| a-sam-mid | Sam | mid | fail | blocked | - | 28 | 1 | 0 | 1 |
| a-sam-mid-n2 | Sam | mid | fail | blocked | - | 28 | 4 | 0 | 1 |

## Goal: I have a follow-up appointment at Harbor Clinic that I can't make any more, so I want to cancel it. My booking reference is HC-4471 and the booking is under Morgan Lee. The reason is a schedule conflict.

| run | persona | tier | verdict | claimed | met at step | actions | dead actions | js/network errors | refused |
|---|---|---|---|---|---|---|---|---|---|
| b-alex-low | Alex | low | pass | completed | 12 | 9 | 0 | 2 | 0 |
| b-alex-low-n2 | Alex | low | pass | completed | 10 | 7 | 0 | 0 | 0 |
| b-alex-mid | Alex | mid | pass | completed | 10 | 7 | 0 | 0 | 0 |
| b-alex-mid-n2 | Alex | mid | pass | completed | 10 | 7 | 0 | 0 | 0 |
| b-jordan-low | Jordan | low | pass | completed | 12 | 9 | 1 | 0 | 0 |
| b-jordan-low-n2 | Jordan | low | pass | completed | 10 | 7 | 0 | 0 | 0 |
| b-jordan-mid | Jordan | mid | pass | completed | 10 | 7 | 0 | 0 | 0 |
| b-jordan-mid-n2 | Jordan | mid | pass | completed | 10 | 7 | 0 | 0 | 0 |
| b-sam-low | Sam | low | pass | completed | 33 | 30 | 1 | 2 | 0 |
| b-sam-low-n2 | Sam | low | fail | abandoned | - | 18 | 0 | 2 | 0 |
| b-sam-mid | Sam | mid | pass | completed | 37 | 34 | 0 | 0 | 1 |
| b-sam-mid-n2 | Sam | mid | pass | completed | 25 | 22 | 0 | 0 | 1 |

## Evidence by run

### a-casey-high (Casey, high, mobile, pointer): fail
runner: Picked an NP and a 9 AM slot but the Continue button would not respond to three taps, so I gave up.
- step 4 runner confusion: Wanted a yearly physical. Annual Wellness Visit sounded like exactly that so I picked it. The explanation is hidden behind a small link I did not open.
- step 6 page is 564px wide on a mobile screen; it scrolls sideways
- step 6 runner bug: The date card runs off the right edge of my phone and I cannot see a Continue button, only Back. The page looks broken.
- step 7 simulated leaving mid-flow: page was unloaded and reopened at the same URL
- step 8 shown while loading (2.0s), then replaced: "No appointments available on this date."
- step 8 runner bug: Picked Oct 20 which is a Tuesday but it says Wednesday, October 20. Also it flashed No appointments available for two seconds before showing times, I almost left.
- step 9 dead tap: [e65] button "9:00 AM"
- step 9 action sits in the top of the screen, outside the thumb zone: [e65] button "9:00 AM"
- step 10 action failed: tap [e60] button "Continue": locator.tap: Timeout 5000ms exceeded.
- step 11 runner friction: Had to swipe sideways to find Continue, it was hidden off the right edge. My first tap on it failed.
- step 12 action failed: tap [e60] button "Continue": locator.tap: Timeout 5000ms exceeded.
- step 14 action failed: tap [e60] button "Continue": locator.tap: Timeout 5000ms exceeded.
- step 14 runner friction: Tapped Continue three times after picking 9:00 AM and nothing happens. No message, no next step. I am done, I will just call the front desk.

### a-casey-high-n2 (Casey, high, mobile, pointer): fail
runner: Picked a nurse practitioner and a 9 AM slot but the Continue button sat off the edge of my phone screen and never responded to taps, so I gave up.
- step 4 runner confusion: Visit type list says Annual Wellness Visit, which sounds exactly like my yearly physical so I picked it. The explanation is hidden behind a small link I would not tap.
- step 6 page is 564px wide on a mobile screen; it scrolls sideways
- step 7 simulated leaving mid-flow: page was unloaded and reopened at the same URL
- step 7 runner bug: Date page is wider than my phone screen. The date box and card run off the right edge and I cannot see a Continue button, only Back.
- step 8 shown while loading (2.0s), then replaced: "No appointments available on this date."
- step 8 runner confusion: Picked Oct 19. For two seconds it said No appointments available, I almost gave up. Then times appeared but the heading says Tuesday October 19 when I thought the 19th was Monday. Which day am I booking?
- step 9 dead tap: [e65] button "9:00 AM"
- step 9 action sits in the top of the screen, outside the thumb zone: [e65] button "9:00 AM"
- step 10 action failed: tap [e60] button "Continue": locator.tap: Timeout 5000ms exceeded.
- step 12 action failed: tap [e60] button "Continue": locator.tap: Timeout 5000ms exceeded.
- step 12 runner friction: Had to swipe sideways to even find Continue, then tapped it twice and nothing happened at all. No message. I am stuck on the time page.
- step 14 action failed: tap [e60] button "Continue": locator.tap: Timeout 5000ms exceeded.
- step 14 runner friction: Third tap on Continue, still nothing. Page is half off my screen and the button just does not respond. I will call the front desk instead.

### a-casey-low (Casey, low, mobile, pointer): fail
runner: Could not get a date into the date field after several tries, so I could not finish booking the physical.
- step 6 page is 564px wide on a mobile screen; it scrolls sideways
- step 9 runner friction: Date field opened a calendar but typing 10/19/2026 or 10192026 left the field empty. Only tap-friendly way is picking a day in the calendar, and the calendar days have no refs I can tap. Getting annoyed.
- step 11 simulated leaving mid-flow: page was unloaded and reopened at the same URL
- step 13 runner friction: Tried typing the date three different ways and the field stays blank. Calendar pops up but I cannot tap a day in it. I have no idea how to pick a date. I am giving up on this for now.

### a-casey-low-n2 (Casey, low, mobile, pointer): fail
runner: Picked a visit type, date and 8:30 slot, but Continue would not respond to three taps because it sits off-screen to the right, so I gave up.
- step 6 page is 564px wide on a mobile screen; it scrolls sideways
- step 7 shown while loading (2.0s), then replaced: "No appointments available on this date."
- step 8 shown while loading (2.0s), then replaced: "No appointments available on this date."
- step 8 simulated leaving mid-flow: page was unloaded and reopened at the same URL
- step 9 dead tap: [e67] button "8:30 AM"
- step 9 action sits in the top of the screen, outside the thumb zone: [e67] button "8:30 AM"
- step 9 runner friction: The date and time card runs off the right edge of my phone screen. The times on the right are cut off and the date heading is clipped. Annoying one-handed.
- step 10 action failed: tap [e76] button "Continue": locator.tap: Timeout 5000ms exceeded.
- step 11 action failed: tap [e76] button "Continue": locator.tap: Timeout 5000ms exceeded.
- step 11 runner bug: Tapped Continue twice and the tap just times out. The Continue button is off to the right, past the edge of the screen, so I cannot reach it with my thumb. No way to move forward from here yet.
- step 12 action failed: tap [e76] button "Continue": locator.tap: Timeout 5000ms exceeded.

### a-casey-mid (Casey, mid, mobile, pointer): fail
runner: Continue button on the date and time step would not respond to taps after three tries, so I could not get past step 2.
- step 6 page is 564px wide on a mobile screen; it scrolls sideways
- step 8 shown while loading (2.0s), then replaced: "No appointments available on this date."
- step 8 runner confusion: Date picked 10/19 but heading says Tuesday October 19; I thought that was Monday. Slightly confusing.
- step 9 dead tap: [e47] button "9:00 AM"
- step 9 action sits in the top of the screen, outside the thumb zone: [e47] button "9:00 AM"
- step 10 shown while loading (2.0s), then replaced: "No appointments available on this date."
- step 10 simulated leaving mid-flow: page was unloaded and reopened at the same URL
- step 11 dead tap: [e68] button "9:00 AM"
- step 11 action sits in the top of the screen, outside the thumb zone: [e68] button "9:00 AM"
- step 12 action failed: tap [e76] button "Continue": locator.tap: Timeout 5000ms exceeded.
- step 12 runner bug: Page is wider than my phone screen, content cut off on left; Continue tap timed out. 9:00 looks selected though.
- step 13 action failed: tap [e76] button "Continue": locator.tap: Timeout 5000ms exceeded.
- step 16 action failed: tap [e76] button "Continue": locator.tap: Timeout 5000ms exceeded.

### a-casey-mid-n2 (Casey, mid, mobile, pointer): fail
runner: Could not get past the date and time step: Continue could not be tapped on the sideways-shifted page.
- step 6 page is 564px wide on a mobile screen; it scrolls sideways
- step 7 simulated leaving mid-flow: page was unloaded and reopened at the same URL
- step 8 shown while loading (2.0s), then replaced: "No appointments available on this date."
- step 8 runner confusion: Heading says Tuesday October 19 but I think the 19th is a Monday. Confusing which day I am booking.
- step 9 dead tap: [e64] button "8:30 AM"
- step 9 action sits in the top of the screen, outside the thumb zone: [e64] button "8:30 AM"
- step 10 action failed: tap [e60] button "Continue": locator.tap: Timeout 5000ms exceeded.
- step 11 action failed: tap [e60] button "Continue": locator.tap: Timeout 5000ms exceeded.
- step 11 runner bug: Page is wider than the phone screen and sideways-shifted. Tapping Continue times out twice, cannot move on. Very frustrating.
- step 12 dead press: [e64] button "8:30 AM"

### a-jordan-low (Jordan, low, desktop, pointer): pass
runner: Booked a Preventive exam with nurse practitioner Dana Whitfield for 8:30 AM on October 19, 2026, confirmation HC-5201, though the day of the week was shown inconsistently.
- step 8 shown while loading (2.0s), then replaced: "No appointments available on this date."
- step 8 runner confusion: I typed 10/19/2026 and it now says the date is typed as 2026-10-19 and the heading says Tuesday, October 19. I thought the 19th was a Monday. Not sure which day I actually booked. Also it says With Dana Whitfield, NP, which is the nurse practitioner, good.
- step 9 dead click: [e46] button "8:30 AM"
- step 10 field labeled only by placeholder: e63 "MM/DD/YYYY"
- step 10 control with no accessible name: e65 textbox
- step 14 acted on an unlabeled control: [e65] textbox ""
- step 16 runner friction: Clicked Continue and the Mobile phone box says Invalid input. I typed my number exactly as I was given it, (415) 555-0137. It does not say what format it wants or why this is wrong. Confusing.
- step 17 acted on an unlabeled control: [e65] textbox ""
- step 19 shown while loading (1.1s), then replaced: "Step 4 of 4", "1. Visit type", "2. Date and time"
- step 19 runner confusion: The booking is confirmed with reference HC-5201. But the review page said Tuesday, October 19 and the confirmation says Monday, October 19. I do not know which day my appointment is on. I need to know this to not miss it.

### a-jordan-low-n2 (Jordan, low, desktop, pointer): pass
runner: Booked a Preventive exam with a nurse practitioner on October 19, 2026 at 8:30 AM, confirmation HC-5201 emailed to me.
- step 8 shown while loading (2.0s), then replaced: "No appointments available on this date."
- step 8 runner confusion: I typed 2026-10-19 which I thought was a Monday, but the page says Tuesday, October 19. I am not sure which day is right, but any weekday morning works so I will pick a morning time.
- step 9 dead click: [e46] button "8:30 AM"
- step 10 field labeled only by placeholder: e63 "MM/DD/YYYY"
- step 10 control with no accessible name: e65 textbox
- step 14 acted on an unlabeled control: [e65] textbox ""
- step 16 runner friction: Clicked Continue and the mobile phone field says Invalid input. It does not say what format it wants. I typed (415) 555-0137 exactly as I was given it, so I do not know what is wrong.
- step 17 acted on an unlabeled control: [e65] textbox ""
- step 19 shown while loading (1.1s), then replaced: "Step 4 of 4", "1. Visit type", "2. Date and time"
- step 19 runner confusion: The confirmation says Monday, October 19, 2026, but the time slot screen said Tuesday, October 19. I cannot tell which day I actually booked, and I am not sure it matters, but it made me doubt the booking.

### a-jordan-mid (Jordan, mid, desktop, pointer): pass
runner: Booked a preventive exam with an NP on Mon Oct 19 at 9 AM, reference HC-5201.
- step 7 shown while loading (2.0s), then replaced: "No appointments available on this date."
- step 7 runner confusion: I typed 10/19/2026 which I thought was Monday, but the heading says Tuesday, October 19. Which day is it really? I am not sure I can trust it.
- step 8 dead click: [e47] button "9:00 AM"
- step 9 field labeled only by placeholder: e63 "MM/DD/YYYY"
- step 9 control with no accessible name: e65 textbox
- step 13 acted on an unlabeled control: [e65] textbox ""
- step 15 runner friction: Mobile phone says only Invalid input. I typed it exactly as I was given, (415) 555-0137. No hint what format it wants. Confusing.
- step 16 acted on an unlabeled control: [e65] textbox ""
- step 18 shown while loading (1.1s), then replaced: "Step 4 of 4", "1. Visit type", "2. Date and time"

### a-jordan-mid-n2 (Jordan, mid, desktop, pointer): pass
runner: Booked preventive exam with NP Monday Oct 19 9:00 AM, ref HC-5201.
- step 3 runner confusion: Annual Wellness Visit sounds like my yearly physical but mentions Medicare; Preventive exam says routine check-up. Unsure which; picking Preventive exam.
- step 7 shown while loading (2.0s), then replaced: "No appointments available on this date."
- step 7 runner confusion: Heading says Tuesday October 19 but I thought Oct 19 2026 was a Monday. Not sure I can trust the day. Going with it as it is a weekday.
- step 8 dead click: [e47] button "9:00 AM"
- step 9 field labeled only by placeholder: e63 "MM/DD/YYYY"
- step 9 control with no accessible name: e65 textbox
- step 13 acted on an unlabeled control: [e65] textbox ""
- step 15 runner friction: Mobile phone says only Invalid input. with no hint of the format wanted. I typed it exactly as I was given. Guessing digits only.
- step 16 acted on an unlabeled control: [e65] textbox ""
- step 18 shown while loading (1.1s), then replaced: "Step 4 of 4", "1. Visit type", "2. Date and time"

### a-riley-low (Riley, low, desktop, pointer): pass
runner: Booked a preventive exam with Dana Whitfield NP for Oct 20 at 9:00 AM, reference HC-5201, though the weekday shown changed between steps and the phone field and back button misbehaved.
- step 5 runner friction: Picked Preventive exam but the red Choose a visit type message is still showing under the field. Not sure if my pick took.
- step 8 action failed: fill [e43] textbox "Date We're open Monday to Friday.": locator.fill: Error: Malformed value
- step 8 runner friction: Typed an emoji into the date box and got a Malformed value error with no message on the screen. Expected to be told to pick a date.
- step 9 shown while loading (2.0s), then replaced: "No appointments available on this date."
- step 10 dead click: [e49] button "9:00 AM"
- step 11 shown while loading (2.0s), then replaced: "No appointments available on this date."
- step 12 dead click: [e70] button "9:00 AM"
- step 13 field labeled only by placeholder: e91 "MM/DD/YYYY"
- step 13 control with no accessible name: e93 textbox
- step 20 acted on an unlabeled control: [e93] textbox ""
- step 21 acted on an unlabeled control: [e93] textbox ""
- step 24 shown while loading (2.0s), then replaced: "No appointments available on this date."
- step 25 field labeled only by placeholder: e126 "MM/DD/YYYY"
- step 25 control with no accessible name: e128 textbox
- step 25 runner bug: Went Back from Your details to pick a date, then Continue again, and every field I had typed was empty. Name, birthday, phone, email all gone. Annoying and I dont trust the form to keep my info.
- step 29 acted on an unlabeled control: [e128] textbox ""
- step 32 acted on an unlabeled control: [e128] textbox ""
- step 33 runner friction: Phone field said Invalid input for (415) 555-0137 and also for digits only, but Continue let me through anyway. Review shows it as 4155550137. Unclear what format it actually wants.
- step 34 shown while loading (1.1s), then replaced: "Step 4 of 4", "1. Visit type", "2. Date and time"
- step 34 runner bug: Date step said Wednesday, October 20 but the confirmation says Tuesday, October 20. Which day is my appointment on? I cannot tell.

### a-riley-low-n2 (Riley, low, desktop, pointer): pass
runner: Booked a Preventive exam with a nurse practitioner for Oct 20 at 9:00 AM, confirmation HC-5201, though the weekday label was inconsistent and mid-flow back and reload wiped the form.
- step 7 runner friction: I picked Preventive exam and Nurse practitioner, but both fields still show red and say Choose a visit type and Choose who you would like to see. Not sure if my picks registered.
- step 9 action failed: fill [e43] textbox "Date We're open Monday to Friday.": locator.fill: Error: Malformed value
- step 10 shown while loading (2.0s), then replaced: "No appointments available on this date."
- step 10 runner bug: Entered 2026-10-20 and the heading says Wednesday, October 20. October 20 2026 is a Tuesday, so the weekday label looks wrong. I would double check before trusting the day.
- step 11 dead click: [e49] button "9:00 AM"
- step 12 field labeled only by placeholder: e65 "MM/DD/YYYY"
- step 12 control with no accessible name: e67 textbox
- step 18 acted on an unlabeled control: [e67] textbox ""
- step 19 acted on an unlabeled control: [e67] textbox ""
- step 22 field labeled only by placeholder: e89 "MM/DD/YYYY"
- step 22 control with no accessible name: e91 textbox
- step 22 runner friction: Went back to the home page with the browser back button, then clicked Book a visit again. It opened on Your details with every field blank, so my visit type, date, time and the details I typed were all gone. I did not expect that.
- step 24 field labeled only by placeholder: e109 "MM/DD/YYYY"
- step 24 control with no accessible name: e111 textbox
- step 24 runner friction: Reloaded the page on the Your details step and every field went blank again. I had to start re-typing, and I am not sure the visit type and time I picked earlier are still held.
- step 28 acted on an unlabeled control: [e111] textbox ""
- step 30 runner friction: Mobile phone says only Invalid input for (415) 555-0137. It does not say what format it wants, and the field has no hint. I will try digits only.
- step 31 acted on an unlabeled control: [e111] textbox ""
- step 33 shown while loading (1.1s), then replaced: "Step 4 of 4", "1. Visit type", "2. Date and time"
- step 33 runner bug: Confirmation says Tuesday, October 20, 2026 at 9:00 AM, but the time step and review said Wednesday, October 20. The day name changes between screens, so I cannot tell which is right.

### a-riley-mid (Riley, mid, desktop, pointer): pass
runner: Booked preventive exam with NP Dana Whitfield, Oct 21 9:00 AM, ref HC-5201.
- step 6 runner friction: After choosing valid values both fields still show invalid and the error text Choose a visit type until I press Continue. Stale errors are confusing.
- step 8 action failed: fill [e43] textbox "Date We're open Monday to Friday.": locator.fill: Error: Malformed value
- step 9 shown while loading (2.0s), then replaced: "No appointments available on this date."
- step 9 runner bug: Picked 2026-10-24 which is a Saturday, but heading says Sunday, October 24. Weekday name is wrong or off by one. Closed message is good though.
- step 10 shown while loading (2.0s), then replaced: "No appointments available on this date."
- step 13 field labeled only by placeholder: e66 "MM/DD/YYYY"
- step 13 control with no accessible name: e68 textbox
- step 14 runner friction: Phone field has no visible label of its own and its error just says Invalid input., unlike the other helpful messages. No format hint.
- step 19 acted on an unlabeled control: [e68] textbox ""
- step 21 runner friction: Browser Back from step 3 dumped me on the home page, not step 2. Steps are not separate history entries; I feared losing my entries.
- step 23 field labeled only by placeholder: e95 "MM/DD/YYYY"
- step 23 control with no accessible name: e97 textbox
- step 23 runner bug: Returned to Book a visit: still on step 3 but all my typed name, DOB, phone and email were erased. Had to retype everything.
- step 27 acted on an unlabeled control: [e97] textbox ""
- step 30 acted on an unlabeled control: [e97] textbox ""
- step 31 runner friction: Phone (415) 555-0137 rejected with just Invalid input.; plain digits worked on a second try but only after the form re-validated (error was stale). No hint on accepted format.
- step 32 shown while loading (1.1s), then replaced: "Step 4 of 4", "1. Visit type", "2. Date and time"
- step 32 runner bug: Confirmation says Wednesday October 21, while earlier steps said Thursday. Inconsistent weekday. Otherwise clear confirmation.

### a-riley-mid-n2 (Riley, mid, desktop, pointer): pass
runner: Booked preventive exam with NP Dana Whitfield, Mon Oct 26 9:00 AM, ref HC-5201.
- step 6 runner friction: After choosing both values the red Choose a visit type errors and invalid state stayed on screen until Continue. Felt like I was still wrong.
- step 8 action failed: fill [e43] textbox "Date We're open Monday to Friday.": locator.fill: Error: Malformed value
- step 9 shown while loading (2.0s), then replaced: "No appointments available on this date."
- step 9 runner bug: I typed 2026-10-24 which is a Saturday but the heading says Sunday, October 24. Weekend message correct but the day name is wrong, so I do not trust the dates.
- step 10 shown while loading (2.0s), then replaced: "No appointments available on this date."
- step 11 dead click: [e49] button "9:00 AM"
- step 12 field labeled only by placeholder: e65 "MM/DD/YYYY"
- step 12 control with no accessible name: e67 textbox
- step 13 runner friction: Phone error just says Invalid input. while the others say what to enter. Also phone field has no visible label name.
- step 19 acted on an unlabeled control: [e67] textbox ""
- step 21 runner bug: My phone (415) 555-0137 was rejected with just Invalid input. No hint of the expected format. Trying digits only.
- step 22 acted on an unlabeled control: [e67] textbox ""
- step 23 acted on an unlabeled control: [e67] textbox ""
- step 25 field labeled only by placeholder: e110 "MM/DD/YYYY"
- step 25 control with no accessible name: e112 textbox
- step 25 runner bug: Reloaded on the review step. All my details were wiped and I was dropped back to Your details, with the tab title still saying Review. Had to retype everything.
- step 29 acted on an unlabeled control: [e112] textbox ""
- step 32 shown while loading (1.1s), then replaced: "Step 4 of 4", "1. Visit type", "2. Date and time"
- step 32 runner bug: Confirmation says Monday October 26 but earlier steps said Tuesday October 26. Inconsistent day name.

### a-sam-high (Sam, high, desktop, keyboard): fail
runner: Keyboard focus is trapped in the time slot buttons, so I could never reach Continue, and picking a time gave no feedback.
- step 6 runner friction: After choosing Book a visit, my focus stayed on the top navigation link. Nothing announced the new page, I had to tab around to find out I was on step 1.
- step 10 dead press: [e22] combobox "Type of visit"
- step 11 runner friction: Arrow keys and Enter did nothing on the visit type dropdown. Only typing a letter changed it. Also Annual Wellness Visit sounded like my yearly physical until I read it is a Medicare thing.
- step 19 shown while loading (2.0s), then replaced: "No appointments available on this date."
- step 19 runner bug: I entered Monday 10/19/2026 and the times heading says Tuesday, October 19. Which day is it really? Also while loading it briefly said No appointments available on this date, which almost made me pick another day.
- step 20 focus without visible ring: textbox "Date We're open Monday to Friday."
- step 22 dead press: [e46] button "8:30 AM"
- step 22 runner confusion: Pressed Enter on 8:30 AM and nothing was announced. No selected or pressed state, so I cannot tell if my time is chosen.
- step 31 runner bug: Tabbing past 3:30 PM sends me back to 8:30 AM. I am stuck circling the time buttons and cannot reach Continue.
- step 33 dead press: [e47] button "9:00 AM"
- step 33 runner friction: Tab wraps, Escape does nothing, and Enter or Space on a time is silent. I cannot get out of the time list to Continue, so I cannot book by keyboard. I would have to call the front desk.

### a-sam-high-n2 (Sam, high, desktop, keyboard): fail
runner: Keyboard focus is trapped in the time slot buttons, both Tab and Shift+Tab wrap inside them, so I could never reach Continue, and nothing ever told me whether 8:30 AM was selected.
- step 6 runner friction: Pressed Book a visit and the page changed, but my focus stayed on the nav link. Nothing announced the new step, I had to go hunting for where the form starts.
- step 10 runner confusion: I wanted a yearly physical. Annual Wellness Visit sounded right at first because it says yearly, but its description says Medicare. I am 38, so I picked Preventive exam. I had to stop and reread. Arrow down did nothing in the dropdown, typing a letter worked.
- step 18 shown while loading (2.0s), then replaced: "No appointments available on this date."
- step 18 runner bug: I typed October 19 2026, which is a Monday, but the heading reads Tuesday, October 19. Now I am not sure which day I am booking. While it loaded it also said No appointments available on this date before the times appeared, which scared me for a moment. There was no hint about what date format to type either.
- step 19 focus without visible ring: textbox "Date We're open Monday to Friday."
- step 21 dead press: [e46] button "8:30 AM"
- step 21 runner friction: Pressed Enter on 8:30 AM and nothing was announced. The button does not say selected or pressed. I cannot tell if I picked a time.
- step 22 dead press: [e46] button "8:30 AM"
- step 30 runner bug: I tabbed through every time and from 3:30 PM focus jumped back to 8:30 AM. I cannot reach the Continue button with Tab. I am trapped in the time list.
- step 32 runner bug: Shift+Tab also wraps inside the times, and Escape does nothing. I cannot get back to the date or forward to Continue. I would have to call the front desk.

### a-sam-low (Sam, low, desktop, keyboard): fail
runner: Got through visit type and clinician, but the date field kept mangling what I typed after three tries, so I could not pick a morning. Giving up.
- step 10 dead press: [e22] combobox "Type of visit"
- step 19 js error: Failed to load resource: the server responded with a status of 400 (Bad Request)
- step 19 network: 400 GET http://127.0.0.1:4792/api/slots?date=61026-02-02&clinician=np
- step 19 shown while loading (2.0s), then replaced: "No appointments available on this date."
- step 22 js error: Failed to load resource: the server responded with a status of 400 (Bad Request)
- step 22 js error: Failed to load resource: the server responded with a status of 400 (Bad Request)
- step 22 js error: Failed to load resource: the server responded with a status of 400 (Bad Request)
- step 22 js error: Failed to load resource: the server responded with a status of 400 (Bad Request)
- step 22 network: 400 GET http://127.0.0.1:4792/api/slots?date=20261-02-02&clinician=np
- step 22 network: 400 GET http://127.0.0.1:4792/api/slots?date=202610-02-02&clinician=np
- step 22 network: 400 GET http://127.0.0.1:4792/api/slots?date=26102-02-02&clinician=np
- step 22 network: 400 GET http://127.0.0.1:4792/api/slots?date=261026-02-02&clinician=np
- step 22 shown while loading (3.3s), then replaced: "No appointments available on this date."
- step 24 js error: Failed to load resource: the server responded with a status of 400 (Bad Request)
- step 24 js error: Failed to load resource: the server responded with a status of 400 (Bad Request)
- step 24 js error: Failed to load resource: the server responded with a status of 400 (Bad Request)
- step 24 js error: Failed to load resource: the server responded with a status of 400 (Bad Request)
- step 24 network: 400 GET http://127.0.0.1:4792/api/slots?date=10262-02-02&clinician=np
- step 24 network: 400 GET http://127.0.0.1:4792/api/slots?date=102620-02-02&clinician=np
- step 24 network: 400 GET http://127.0.0.1:4792/api/slots?date=26202-02-02&clinician=np
- step 24 network: 400 GET http://127.0.0.1:4792/api/slots?date=262026-02-02&clinician=np
- step 24 shown while loading (3.3s), then replaced: "No appointments available on this date."
- step 24 runner bug: Date field is broken for typing. I typed 2026-10-26 and it became 61026-02-02, then I typed 10/26/2026 and it became 262026-02-02. The heading now says Tuesday, February 2, which I never picked. The field label says open Monday to Friday but gives no date format hint I can hear.
- step 24 runner friction: On the visit type and clinician dropdowns, Enter and ArrowDown did nothing and no list opened. Only typing a word selected the option. Nothing announced that the list was expanded, so I had to guess that typing works.
- step 24 runner confusion: The page said No appointments available on this date while loading, then the heading switched to a different day. I cannot tell from the list whether the times are empty or still loading. I have no idea which date I actually have selected.

### a-sam-low-n2 (Sam, low, desktop, keyboard): fail
runner: Could not enter a date on the Date and time step; typing into the date box keeps rewriting the value, so I could not pick a weekday morning after three tries.
- step 10 dead press: [e22] combobox "Type of visit"
- step 17 refused fill: KEYBOARD_ONLY: this persona cannot fill with a pointer. Use press (Tab, Shift+Tab, Enter, Space, arrows) and type.
- step 19 js error: Failed to load resource: the server responded with a status of 400 (Bad Request)
- step 19 network: 400 GET http://127.0.0.1:4792/api/slots?date=61019-02-02&clinician=np
- step 19 shown while loading (2.0s), then replaced: "No appointments available on this date."
- step 19 runner friction: I typed 2026-10-19 into the date box and it came out as 61019-02-02. The heading now says Wednesday, February 2 and says no appointments. I have no idea what format this box wants.
- step 20 js error: Failed to load resource: the server responded with a status of 400 (Bad Request)
- step 20 js error: Failed to load resource: the server responded with a status of 400 (Bad Request)
- step 20 js error: Failed to load resource: the server responded with a status of 400 (Bad Request)
- step 20 js error: Failed to load resource: the server responded with a status of 400 (Bad Request)
- step 20 js error: Failed to load resource: the server responded with a status of 400 (Bad Request)
- step 20 js error: Failed to load resource: the server responded with a status of 400 (Bad Request)
- step 20 js error: Failed to load resource: the server responded with a status of 400 (Bad Request)
- step 20 js error: Failed to load resource: the server responded with a status of 400 (Bad Request)
- step 20 network: 400 GET http://127.0.0.1:4792/api/slots?date=275760-02-02&clinician=np
- step 20 network: 400 GET http://127.0.0.1:4792/api/slots?date=101910-02-02&clinician=np
- step 20 network: 400 GET http://127.0.0.1:4792/api/slots?date=19101-02-02&clinician=np
- step 20 network: 400 GET http://127.0.0.1:4792/api/slots?date=191019-02-02&clinician=np
- step 20 network: 400 GET http://127.0.0.1:4792/api/slots?date=101920-02-02&clinician=np
- step 20 network: 400 GET http://127.0.0.1:4792/api/slots?date=19202-02-02&clinician=np
- step 20 network: 400 GET http://127.0.0.1:4792/api/slots?date=192026-02-02&clinician=np
- step 20 network: 400 GET http://127.0.0.1:4792/api/slots?date=275760-02-02&clinician=np
- step 20 shown while loading (3.3s), then replaced: "No appointments available on this date."
- step 22 js error: Failed to load resource: the server responded with a status of 400 (Bad Request)
- step 22 js error: Failed to load resource: the server responded with a status of 400 (Bad Request)
- step 22 js error: Failed to load resource: the server responded with a status of 400 (Bad Request)
- step 22 js error: Failed to load resource: the server responded with a status of 400 (Bad Request)
- step 22 network: 400 GET http://127.0.0.1:4792/api/slots?date=10192-02-02&clinician=np
- step 22 network: 400 GET http://127.0.0.1:4792/api/slots?date=101920-02-02&clinician=np
- step 22 network: 400 GET http://127.0.0.1:4792/api/slots?date=19202-02-02&clinician=np
- step 22 network: 400 GET http://127.0.0.1:4792/api/slots?date=192026-02-02&clinician=np
- step 22 shown while loading (3.3s), then replaced: "No appointments available on this date."
- step 24 shown while loading (2.0s), then replaced: "No appointments available on this date."
- step 24 runner friction: Three tries at the date box and every time it rewrote what I typed: 10 became 0010-02-02 and 10/19/2026 became 192026-02-02. Backspace clears it but typing never lands on October 19. The page says that date has passed. No date format hint is announced next to the field beyond Monday to Friday. I cannot get a date in.

### a-sam-mid (Sam, mid, desktop, keyboard): fail
runner: On the time-selection step, Tab cycles only through the time buttons and never reaches Continue or Back, so I cannot go on.
- step 2 refused click: KEYBOARD_ONLY: this persona cannot click with a pointer. Use press (Tab, Shift+Tab, Enter, Space, arrows) and type.
- step 17 shown while loading (2.0s), then replaced: "No appointments available on this date."
- step 17 runner confusion: Typed 10/19/2026 and the heading says Tuesday, October 19. I believe that date is a Monday, so the weekday may be wrong. Also the field format was never announced, and it briefly said No appointments available while loading.
- step 18 focus without visible ring: textbox "Date We're open Monday to Friday."
- step 20 dead press: [e46] button "8:30 AM"
- step 20 runner friction: Pressed Enter on 8:30 AM. Nothing was announced, and the button does not say it is selected. I cannot tell if my choice registered.
- step 29 runner bug: After 3:30 PM, Tab jumped back to 8:30 AM. Back and Continue buttons seem unreachable by keyboard, so I may be stuck.

### a-sam-mid-n2 (Sam, mid, desktop, keyboard): fail
runner: Could not get from the time slots to Continue by keyboard; Tab loops within the times and no selection is announced.
- step 2 refused click: KEYBOARD_ONLY: this persona cannot click with a pointer. Use press (Tab, Shift+Tab, Enter, Space, arrows) and type.
- step 10 dead press: [e22] combobox "Type of visit"
- step 19 shown while loading (2.0s), then replaced: "No appointments available on this date."
- step 19 runner confusion: Heading says Tuesday, October 19 but I entered 10/19/2026 which is a Monday. Date mismatch makes me unsure which day I am booking.
- step 20 focus without visible ring: textbox "Date We're open Monday to Friday."
- step 22 dead press: [e46] button "8:30 AM"
- step 22 runner friction: Pressed Enter on 8:30 AM: no announcement or state (no pressed/selected) so I cannot tell if the time was chosen.
- step 27 dead press: [e47] button "9:00 AM"
- step 28 runner bug: Tabbing from the last time slot (3:30 PM) jumped back to 8:30 AM; I could not reach Back or Continue. Keyboard trap in the time list.
- step 29 dead press: [e48] button "9:30 AM"

### b-alex-low (Alex, low, desktop, pointer): pass
runner: Cancelled follow-up HC-4471 under Morgan Lee; page confirmed Appointment HC-4471 has been cancelled.
- step 6 js error: Failed to load resource: the server responded with a status of 404 (Not Found)
- step 6 network: 404 GET http://127.0.0.1:4792/api/bookings/HC-4471?last=Morgan%20Lee
- step 6 runner friction: Typed HC-4471 and Morgan Lee, hit Find booking, and got "We couldn not find a booking with that reference and last name." The field says Last name, so maybe it wants just Lee? Not sure what is wrong.
- step 8 shown while loading (6.2s), then replaced: "We couldn't find a booking with that reference and last name. Check your confirmation email, or call (555) 010-2200."
- step 8 runner friction: The booking came up after Enter, but the old "couldn not find" error was still on screen while it loaded (6.2s). Unclear whether Lee or Morgan Lee was the fix or it was just slow. Nothing told me which one worked.
- step 11 dialog: confirm "Keep your appointment on Thursday, November 5, 2026 at 10:00 AM?" (pending)
- step 11 runner confusion: Confirm box asks "Keep your appointment on Thursday?" I want it gone, so I have to press Cancel to not keep it. Double negative. OK would keep it, which is the opposite of what I want. Worth a second look at the wording.
- step 12 dialog: confirm "Keep your appointment on Thursday, November 5, 2026 at 10:00 AM?" (dismiss)
- step 12 shown while loading (6.2s), then replaced: "Appointment HC-4471 Booked", "Patient", "Morgan Lee"

### b-alex-low-n2 (Alex, low, desktop, pointer): pass
runner: Cancelled follow-up HC-4471 for Morgan Lee via Manage a booking; page shows Appointment HC-4471 has been cancelled.
- step 9 dialog: confirm "Keep your appointment on Thursday, November 5, 2026 at 10:00 AM?" (pending)
- step 9 runner confusion: Asked Keep your appointment on Thursday? with OK and Cancel. I want it gone, so which button cancels it is unclear. Double negative in the prompt wording.
- step 10 dialog: confirm "Keep your appointment on Thursday, November 5, 2026 at 10:00 AM?" (dismiss)
- step 10 shown while loading (6.2s), then replaced: "Appointment HC-4471 Booked", "Patient", "Morgan Lee"

### b-alex-mid (Alex, mid, desktop, pointer): pass
runner: Appointment HC-4471 cancelled with confirmation shown.
- step 9 dialog: confirm "Keep your appointment on Thursday, November 5, 2026 at 10:00 AM?" (pending)
- step 9 runner confusion: Confirm asks Keep your appointment? Inverted wording; OK would mean keep. Had to stop and think. Pressing Cancel to not keep it.
- step 10 dialog: confirm "Keep your appointment on Thursday, November 5, 2026 at 10:00 AM?" (dismiss)
- step 10 shown while loading (6.2s), then replaced: "Appointment HC-4471 Booked", "Patient", "Morgan Lee"

### b-alex-mid-n2 (Alex, mid, desktop, pointer): pass
runner: Appointment HC-4471 cancelled with confirmation shown.
- step 9 dialog: confirm "Keep your appointment on Thursday, November 5, 2026 at 10:00 AM?" (pending)
- step 9 runner confusion: Confirm popup asks Keep your appointment? Answering OK sounds like keeping it. Backwards and confusing wording for a cancel flow.
- step 10 dialog: confirm "Keep your appointment on Thursday, November 5, 2026 at 10:00 AM?" (dismiss)
- step 10 shown while loading (6.2s), then replaced: "Appointment HC-4471 Booked", "Patient", "Morgan Lee"

### b-jordan-low (Jordan, low, desktop, pointer): pass
runner: Cancelled Morgan Lee's follow-up HC-4471 via Manage a booking; the page confirmed Appointment HC-4471 has been cancelled.
- step 8 dead click: [e38] combobox "Reason for cancelling"
- step 11 dialog: confirm "Keep your appointment on Thursday, November 5, 2026 at 10:00 AM?" (pending)
- step 11 runner confusion: I clicked Continue to cancel, and it asks Keep your appointment on Thursday? I want to cancel, not keep it. Which button cancels it? OK sounds like it agrees to keep it, so I am confused about which one to press.
- step 12 dialog: confirm "Keep your appointment on Thursday, November 5, 2026 at 10:00 AM?" (dismiss)
- step 12 shown while loading (6.2s), then replaced: "Appointment HC-4471 Booked", "Patient", "Morgan Lee"

### b-jordan-low-n2 (Jordan, low, desktop, pointer): pass
runner: Found booking HC-4471 under Morgan Lee, selected Cancel appointment with Schedule conflict as the reason, and got the confirmation that the appointment was cancelled.
- step 9 dialog: confirm "Keep your appointment on Thursday, November 5, 2026 at 10:00 AM?" (pending)
- step 10 dialog: confirm "Keep your appointment on Thursday, November 5, 2026 at 10:00 AM?" (dismiss)
- step 10 shown while loading (6.2s), then replaced: "Appointment HC-4471 Booked", "Patient", "Morgan Lee"
- step 10 runner confusion: The popup asked Keep your appointment on Thursday November 5 at 10 AM? I had to think about which button meant cancel. Cancel seemed to mean I do not keep it, so I pressed Cancel. It worked but the wording was backwards to me.

### b-jordan-mid (Jordan, mid, desktop, pointer): pass
runner: Appointment HC-4471 shows as cancelled.
- step 9 dialog: confirm "Keep your appointment on Thursday, November 5, 2026 at 10:00 AM?" (pending)
- step 9 runner confusion: Pressed Continue and got a box asking Keep your appointment? I want to cancel, so OK sounds like keeping it. Confusing wording, I am guessing Cancel means go ahead and cancel.
- step 10 dialog: confirm "Keep your appointment on Thursday, November 5, 2026 at 10:00 AM?" (dismiss)
- step 10 shown while loading (6.2s), then replaced: "Appointment HC-4471 Booked", "Patient", "Morgan Lee"

### b-jordan-mid-n2 (Jordan, mid, desktop, pointer): pass
runner: Appointment HC-4471 cancelled; confirmation shown.
- step 9 dialog: confirm "Keep your appointment on Thursday, November 5, 2026 at 10:00 AM?" (pending)
- step 9 runner confusion: Dialog asks Keep your appointment? with OK/Cancel. I want to cancel the appointment, so the buttons are backwards and confusing. I will answer Cancel (meaning no, do not keep).
- step 10 dialog: confirm "Keep your appointment on Thursday, November 5, 2026 at 10:00 AM?" (dismiss)
- step 10 shown while loading (6.2s), then replaced: "Appointment HC-4471 Booked", "Patient", "Morgan Lee"

### b-sam-low (Sam, low, desktop, keyboard): pass
runner: Cancelled appointment HC-4471 for Morgan Lee; the page confirmed it was cancelled and emailed a notice.
- step 15 js error: Failed to load resource: the server responded with a status of 404 (Not Found)
- step 15 network: 404 GET http://127.0.0.1:4792/api/bookings/HC-4471?last=Morgan%20Lee
- step 15 runner friction: Typed HC-4471 and Morgan Lee into the fields, pressed Find booking, and got "We couldnt find a booking with that reference and last name." The field is labeled Last name, so I may have typed the wrong thing. Error appeared in an alert, which I heard.
- step 20 shown while loading (6.2s), then replaced: "We couldn't find a booking with that reference and last name. Check your confirmation email, or call (555) 010-2200."
- step 20 runner friction: Found it on the second try with Last name = Lee only. The field is labeled Last name and I had typed my full name, and the error did not say which field was wrong. Lost a few steps.
- step 24 runner friction: Opened Cancel appointment and the dialog appeared, but keyboard focus stayed on the Cancel button behind it. Pressing Tab took me to the Insurance plans link on the page, outside the dialog. I had to hunt for where the dialog was.
- step 28 dead press: [e39] combobox "Reason for cancelling"
- step 32 dialog: confirm "Keep your appointment on Thursday, November 5, 2026 at 10:00 AM?" (pending)
- step 33 dialog: confirm "Keep your appointment on Thursday, November 5, 2026 at 10:00 AM?" (dismiss)
- step 33 shown while loading (6.2s), then replaced: "Appointment HC-4471 Booked", "Patient", "Morgan Lee"
- step 33 runner friction: The confirm asked Keep your appointment on Thursday Nov 5? I wanted to cancel, so I pressed Cancel, and it worked. The wording is backwards from what a button labeled Cancel normally means, and I had to think about it. Later the page said Appointment HC-4471 has been cancelled, which is what I needed.

### b-sam-low-n2 (Sam, low, desktop, keyboard): fail
runner: Could not get past the Find booking lookup: it rejected HC-4471 with Morgan Lee in the Last name field, and I could not clear that field to try just Lee. I would call the front desk at (555) 010-2200 instead.
- step 9 runner friction: Pressed Enter on Find my booking and the page changed, but keyboard focus went back to the top of the document instead of the new heading or the first field. I have to tab through the header links again to reach the form.
- step 18 js error: Failed to load resource: the server responded with a status of 404 (Not Found)
- step 18 network: 404 GET http://127.0.0.1:4792/api/bookings/HC-4471?last=Morgan%20Lee
- step 18 runner friction: Find booking said it could not find a booking with that reference and last name. The field is labeled Last name and I typed Morgan Lee, so I may have entered it wrong. I could not clear the field with Backspace or Ctrl+A to fix it.

### b-sam-mid (Sam, mid, desktop, keyboard): pass
runner: Appointment HC-4471 cancelled with confirmation message.
- step 2 refused click: KEYBOARD_ONLY: this persona cannot click with a pointer. Use press (Tab, Shift+Tab, Enter, Space, arrows) and type.
- step 16 focus without visible ring: text "Care close to home Primary care for adults and families on the waterfront. Same-"
- step 16 runner bug: Skip to content on the Manage page threw me back to the home page instead of skipping to the form. Lost my place.
- step 28 runner bug: Dialog opened but keyboard focus stayed on the Cancel appointment button behind it. Not moved into the dialog.
- step 36 dialog: confirm "Keep your appointment on Thursday, November 5, 2026 at 10:00 AM?" (pending)
- step 36 runner confusion: Confirm asks Keep your appointment? OK/Cancel is backwards and confusing: I want to cancel, so I must press Cancel to not keep it.
- step 37 dialog: confirm "Keep your appointment on Thursday, November 5, 2026 at 10:00 AM?" (dismiss)
- step 37 shown while loading (6.2s), then replaced: "Appointment HC-4471 Booked", "Patient", "Morgan Lee"

### b-sam-mid-n2 (Sam, mid, desktop, keyboard): pass
runner: Appointment HC-4471 cancelled, confirmed on page and live region.
- step 2 refused click: KEYBOARD_ONLY: this persona cannot click with a pointer. Use press (Tab, Shift+Tab, Enter, Space, arrows) and type.
- step 16 runner friction: Dialog opened but keyboard focus stayed on the Cancel appointment button behind it; I had to Tab to find the dialog controls.
- step 24 dialog: confirm "Keep your appointment on Thursday, November 5, 2026 at 10:00 AM?" (pending)
- step 24 runner confusion: Confirm asks Keep your appointment? so OK might mean keep. I want to cancel, so I pick Cancel on the prompt. Inverted and confusing wording.
- step 25 dialog: confirm "Keep your appointment on Thursday, November 5, 2026 at 10:00 AM?" (dismiss)
- step 25 shown while loading (6.2s), then replaced: "Appointment HC-4471 Booked", "Patient", "Morgan Lee"
