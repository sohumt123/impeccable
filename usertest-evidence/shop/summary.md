# Usertest summary: 36 runs

Verdicts come from the driver's success check, not the runner's claim:

- **pass**: goal verified and the runner said it was done
- **pass-unclaimed**: goal verified, but the runner did not believe it was done (missing confirmation)
- **false-success**: the runner said it was done; the goal was not met
- **fail**: the runner stopped short; the goal was not met
- **unfinished**: the run ended without done (crash, turn limit, or idle) and the goal was not met
- **unverified**: no success check for this goal; the runner's claim stands alone

## Goal: Buy one Medium Field Notebook with standard shipping. You got a promo code by email: welcome10. Make up a name and address.

| run | persona | tier | verdict | claimed | met at step | actions | dead actions | js/network errors | refused |
|---|---|---|---|---|---|---|---|---|---|
| a-casey-low | Casey | low | pass | completed | 17 | 15 | 0 | 0 | 0 |
| a-casey-low-n2 | Casey | low | pass | completed | 15 | 13 | 0 | 0 | 0 |
| a-casey-mid | Casey | mid | pass | completed | 17 | 15 | 0 | 0 | 0 |
| a-casey-mid-n2 | Casey | mid | pass | completed | 17 | 15 | 0 | 0 | 0 |
| a-jordan-low | Jordan | low | fail | abandoned | - | 12 | 0 | 0 | 0 |
| a-jordan-low-n2 | Jordan | low | fail | abandoned | - | 11 | 0 | 0 | 0 |
| a-jordan-mid | Jordan | mid | pass | completed | 16 | 14 | 0 | 0 | 0 |
| a-jordan-mid-n2 | Jordan | mid | pass | completed | 16 | 14 | 0 | 0 | 0 |
| a-riley-low | Riley | low | pass | completed | 30 | 26 | 1 | 1 | 0 |
| a-riley-low-n2 | Riley | low | pass | completed | 27 | 23 | 0 | 1 | 0 |
| a-riley-mid | Riley | mid | pass | completed | 23 | 20 | 1 | 1 | 0 |
| a-riley-mid-n2 | Riley | mid | pass | completed | 27 | 23 | 1 | 1 | 0 |
| a-sam-high | Sam | high | fail | blocked | - | 8 | 0 | 0 | 0 |
| a-sam-high-n2 | Sam | high | fail | blocked | - | 6 | 0 | 0 | 0 |
| a-sam-low | Sam | low | fail | abandoned | - | 5 | 0 | 0 | 0 |
| a-sam-low-n2 | Sam | low | fail | abandoned | - | 5 | 0 | 0 | 0 |
| a-sam-mid | Sam | mid | fail | blocked | - | 4 | 0 | 0 | 0 |
| a-sam-mid-n2 | Sam | mid | fail | blocked | - | 4 | 0 | 0 | 0 |

## Goal: Change your account email to jordan@example.com.

| run | persona | tier | verdict | claimed | met at step | actions | dead actions | js/network errors | refused |
|---|---|---|---|---|---|---|---|---|---|
| b-alex-high | Alex | high | fail | unsure | - | 4 | 0 | 0 | 0 |
| b-alex-high-n2 | Alex | high | fail | unsure | - | 4 | 0 | 0 | 0 |
| b-alex-low | Alex | low | false-success | completed | - | 5 | 0 | 0 | 0 |
| b-alex-low-n2 | Alex | low | false-success | completed | - | 5 | 0 | 0 | 0 |
| b-alex-mid | Alex | mid | false-success | completed | - | 4 | 0 | 0 | 0 |
| b-alex-mid-n2 | Alex | mid | false-success | completed | - | 4 | 0 | 0 | 0 |
| b-jordan-high | Jordan | high | fail | unsure | - | 3 | 0 | 0 | 0 |
| b-jordan-high-n2 | Jordan | high | fail | unsure | - | 3 | 0 | 0 | 0 |
| b-jordan-low | Jordan | low | false-success | completed | - | 3 | 0 | 0 | 0 |
| b-jordan-low-n2 | Jordan | low | false-success | completed | - | 3 | 0 | 0 | 0 |
| b-jordan-mid | Jordan | mid | fail | unsure | - | 3 | 0 | 0 | 0 |
| b-jordan-mid-n2 | Jordan | mid | false-success | completed | - | 3 | 0 | 0 | 0 |
| b-sam-high | Sam | high | fail | unsure | - | 8 | 0 | 0 | 0 |
| b-sam-high-n2 | Sam | high | fail | unsure | - | 9 | 0 | 0 | 0 |
| b-sam-low | Sam | low | false-success | completed | - | 15 | 0 | 0 | 0 |
| b-sam-low-n2 | Sam | low | fail | unsure | - | 9 | 0 | 0 | 0 |
| b-sam-mid | Sam | mid | false-success | completed | - | 10 | 0 | 0 | 0 |
| b-sam-mid-n2 | Sam | mid | false-success | completed | - | 10 | 0 | 0 | 0 |

## Evidence by run

### a-casey-low (Casey, low, mobile, pointer): pass
runner: Order FN-1046 placed for one Medium Field Notebook with standard shipping and WELCOME10 applied, confirmed on screen.
- step 1 pointer-only control on page: e3 "0"
- step 1 pointer-only control on page: e7 "Choose a size"
- step 3 pointer-only control on page: e9 "Pocket"
- step 3 pointer-only control on page: e10 "Medium"
- step 3 pointer-only control on page: e11 "Large"
- step 4 pointer-only control on page: e7 "Medium"
- step 5 pointer-only control on page: e3 "1"
- step 6 tapped a small target: [e3] clickable "1" small target 28x20
- step 6 action sits in the top of the screen, outside the thumb zone: [e3] clickable "1"
- step 7 simulated leaving mid-flow: page was unloaded and reopened at the same URL
- step 7 pointer-only control on page: e29 "1"
- step 11 tapped a small target: [e37] radio "Std (DDP) $4" small target 320x22
- step 13 runner friction: Typed welcome10 from my email, hit Apply, and it says Code not recognised. The total did not change. Not sure if I typed it wrong or the code is dead.
- step 15 runner friction: Typed WELCOME10 in all caps and it worked, 10 percent off. Lowercase got rejected with no hint that case matters. Took me two tries.
- step 16 tapped a small target: [e42] checkbox "I accept the terms" small target 134x21
- step 17 shown while loading (1.1s), then replaced: "Checkout", "Field Notebook, Medium: $14.00", "Discount -$1.40"
- step 17 tapped a small target: [e43] button "Place order" small target 85x28
- step 17 pointer-only control on page: e29 "0"

### a-casey-low-n2 (Casey, low, mobile, pointer): pass
runner: Bought one Medium Field Notebook with standard shipping; order FN-1044 confirmed, though the welcome10 promo was rejected.
- step 1 pointer-only control on page: e3 "0"
- step 1 pointer-only control on page: e7 "Choose a size"
- step 3 pointer-only control on page: e9 "Pocket"
- step 3 pointer-only control on page: e10 "Medium"
- step 3 pointer-only control on page: e11 "Large"
- step 4 pointer-only control on page: e7 "Medium"
- step 5 pointer-only control on page: e3 "1"
- step 6 simulated leaving mid-flow: page was unloaded and reopened at the same URL
- step 6 pointer-only control on page: e15 "1"
- step 6 pointer-only control on page: e19 "Choose a size"
- step 6 runner friction: Came back after switching apps and the size is back to Choose a size. Bag still says 1 though. Not sure if my Medium is still in there.
- step 7 tapped a small target: [e15] clickable "1" small target 28x20
- step 7 action sits in the top of the screen, outside the thumb zone: [e15] clickable "1"
- step 11 tapped a small target: [e28] radio "Std (DDP) $4" small target 320x22
- step 13 runner friction: Typed welcome10 from my email and hit Apply. It says Code not recognised in small grey text under the box. Did not say why or what to try. Subtotal is still 14. Not sure if I typed it wrong or the code is dead.
- step 14 tapped a small target: [e33] checkbox "I accept the terms" small target 134x21
- step 15 shown while loading (1.0s), then replaced: "Checkout", "Field Notebook, Medium: $14.00", "Subtotal $14.00"
- step 15 tapped a small target: [e34] button "Place order" small target 85x28
- step 15 pointer-only control on page: e15 "0"

### a-casey-mid (Casey, mid, mobile, pointer): pass
runner: Order FN-1047 confirmed with promo applied and standard shipping.
- step 1 pointer-only control on page: e3 "0"
- step 1 pointer-only control on page: e7 "Choose a size"
- step 3 pointer-only control on page: e9 "Pocket"
- step 3 pointer-only control on page: e10 "Medium"
- step 3 pointer-only control on page: e11 "Large"
- step 4 pointer-only control on page: e7 "Medium"
- step 5 pointer-only control on page: e3 "1"
- step 6 simulated leaving mid-flow: page was unloaded and reopened at the same URL
- step 6 pointer-only control on page: e15 "1"
- step 6 pointer-only control on page: e19 "Choose a size"
- step 7 tapped a small target: [e15] clickable "1" small target 28x20
- step 7 action sits in the top of the screen, outside the thumb zone: [e15] clickable "1"
- step 11 tapped a small target: [e28] radio "Std (DDP) $4" small target 320x22
- step 11 runner confusion: Shipping labels Std (DDP) and Exp (DAP) are jargon. I guessed Std means standard.
- step 15 runner friction: Lowercase welcome10 from my email was rejected as not recognised. Only uppercase worked. Annoying on a phone.
- step 16 tapped a small target: [e33] checkbox "I accept the terms" small target 134x21
- step 17 shown while loading (1.1s), then replaced: "Checkout", "Field Notebook, Medium: $14.00", "Discount -$1.40"
- step 17 tapped a small target: [e34] button "Place order" small target 85x28
- step 17 pointer-only control on page: e15 "0"

### a-casey-mid-n2 (Casey, mid, mobile, pointer): pass
runner: Order FN-1045 confirmed
- step 1 pointer-only control on page: e3 "0"
- step 1 pointer-only control on page: e7 "Choose a size"
- step 3 pointer-only control on page: e9 "Pocket"
- step 3 pointer-only control on page: e10 "Medium"
- step 3 pointer-only control on page: e11 "Large"
- step 4 pointer-only control on page: e7 "Medium"
- step 5 pointer-only control on page: e3 "1"
- step 6 simulated leaving mid-flow: page was unloaded and reopened at the same URL
- step 6 pointer-only control on page: e15 "1"
- step 6 pointer-only control on page: e19 "Choose a size"
- step 7 tapped a small target: [e15] clickable "1" small target 28x20
- step 7 action sits in the top of the screen, outside the thumb zone: [e15] clickable "1"
- step 11 tapped a small target: [e28] radio "Std (DDP) $4" small target 320x22
- step 13 runner friction: Promo welcome10 from my email says Code not recognised. Annoying, no hint why.
- step 16 tapped a small target: [e33] checkbox "I accept the terms" small target 134x21
- step 17 shown while loading (1.0s), then replaced: "Checkout", "Field Notebook, Medium: $14.00", "Discount -$1.40"
- step 17 tapped a small target: [e34] button "Place order" small target 85x28
- step 17 pointer-only control on page: e15 "0"

### a-jordan-low (Jordan, low, desktop, pointer): fail
runner: Promo code welcome10 was rejected twice with Code not recognised, with no explanation or help nearby, so I stopped before placing the order.
- step 1 pointer-only control on page: e3 "0"
- step 1 pointer-only control on page: e7 "Choose a size"
- step 3 pointer-only control on page: e9 "Pocket"
- step 3 pointer-only control on page: e10 "Medium"
- step 3 pointer-only control on page: e11 "Large"
- step 4 pointer-only control on page: e7 "Medium"
- step 5 pointer-only control on page: e3 "1"
- step 12 runner friction: I typed welcome10 exactly as the email said and clicked Apply. It says Code not recognised. I do not know if I typed it wrong or the code is expired. No hint on where to check.
- step 14 runner friction: Tried welcome10 again, same message: Code not recognised. Two tries and I still do not know why. There is no help link near the promo box. I am not sure I should pay full price without the discount, and I do not want to guess.

### a-jordan-low-n2 (Jordan, low, desktop, pointer): fail
runner: The promo code welcome10 was rejected twice with Code not recognised, and I could not find any help, so I stopped before placing the order.
- step 1 pointer-only control on page: e3 "0"
- step 1 pointer-only control on page: e7 "Choose a size"
- step 3 pointer-only control on page: e9 "Pocket"
- step 3 pointer-only control on page: e10 "Medium"
- step 3 pointer-only control on page: e11 "Large"
- step 4 pointer-only control on page: e7 "Medium"
- step 5 pointer-only control on page: e3 "1"
- step 12 runner friction: I typed welcome10 exactly as the email said and pressed Apply. It says Code not recognised. I do not know if I typed it wrong or if the code is expired. There is no help link here.
- step 13 runner friction: Retyped welcome10 and the same message is still there, Code not recognised. I have now failed twice. I am not sure if I should pay full price or stop. Nothing on the page explains why the code does not work.

### a-jordan-mid (Jordan, mid, desktop, pointer): pass
runner: Order FN-1043 confirmed with Medium notebook, standard shipping, promo applied.
- step 1 pointer-only control on page: e3 "0"
- step 1 pointer-only control on page: e7 "Choose a size"
- step 3 pointer-only control on page: e9 "Pocket"
- step 3 pointer-only control on page: e10 "Medium"
- step 3 pointer-only control on page: e11 "Large"
- step 4 pointer-only control on page: e7 "Medium"
- step 5 pointer-only control on page: e3 "1"
- step 7 runner confusion: Shipping options say Std (DDP) and Exp (DAP). I do not know what DDP or DAP mean. Guessing Std means standard.
- step 12 runner friction: Typed welcome10 exactly as in my email and got Code not recognised. No hint why or where to get help. Stuck.
- step 14 runner bug: Code only worked in capitals. Lowercase as written in my email was rejected. Confusing.
- step 16 shown while loading (0.7s), then replaced: "Checkout", "Field Notebook, Medium: $14.00", "Discount -$1.40"

### a-jordan-mid-n2 (Jordan, mid, desktop, pointer): pass
runner: Order FN-1042 confirmed with Medium notebook, standard shipping, promo applied.
- step 1 pointer-only control on page: e3 "0"
- step 1 pointer-only control on page: e7 "Choose a size"
- step 3 pointer-only control on page: e9 "Pocket"
- step 3 pointer-only control on page: e10 "Medium"
- step 3 pointer-only control on page: e11 "Large"
- step 4 pointer-only control on page: e7 "Medium"
- step 5 pointer-only control on page: e3 "1"
- step 7 runner confusion: Shipping options say Std (DDP) and Exp (DAP). I do not know what DDP or DAP mean. Guessing Std is standard.
- step 12 runner friction: Typed welcome10 exactly as in my email, pressed Apply, got Code not recognised. No hint why or where to get help. Feels like I did something wrong.
- step 14 runner bug: Only uppercase worked; the email said lowercase. Confusing, nothing told me codes are case sensitive.
- step 16 shown while loading (0.7s), then replaced: "Checkout", "Field Notebook, Medium: $14.00", "Discount -$1.40"

### a-riley-low (Riley, low, desktop, pointer): pass
runner: Bought one Medium Field Notebook with standard shipping and the WELCOME10 code, which only worked in capitals, and the order confirmed as FN-1051.
- step 1 pointer-only control on page: e3 "0"
- step 1 pointer-only control on page: e7 "Choose a size"
- step 3 pointer-only control on page: e9 "Pocket"
- step 3 pointer-only control on page: e10 "Medium"
- step 3 pointer-only control on page: e11 "Large"
- step 4 pointer-only control on page: e7 "Medium"
- step 5 pointer-only control on page: e3 "1"
- step 8 js error: Cannot read properties of null (reading '0')
- step 10 runner friction: Typed an emoji and accent string into Promo code and hit Apply. Button says Applying... and stays greyed out. No message, no discount, no error. Two observations later still stuck.
- step 18 dead click: [e26] button "Place order"
- step 18 runner friction: Clicked Place order with the terms box unchecked. Nothing happened: no message, no highlight on the checkbox, no error. The button looks live, so I cannot tell why it did nothing.
- step 20 pointer-only control on page: e29 "1"
- step 20 runner friction: Reloaded checkout mid-form. Bag still shows 1 item, but every field I typed is blank again: name, email, address, shipping choice and promo code. I have to type it all over.
- step 26 runner bug: Applied welcome10, the exact code from my email, and got Code not recognised. The first try earlier never finished and sat on Applying. Nothing says why the code fails.
- step 28 runner bug: Uppercase WELCOME10 applied: Discount -$1.40 and WELCOME10 applied: 10 percent off. Lowercase welcome10 from the email was rejected. The code only works in capitals and the page never says so.
- step 30 shown while loading (0.7s), then replaced: "Checkout", "Field Notebook, Medium: $14.00", "Discount -$1.40"
- step 30 pointer-only control on page: e29 "0"
- step 30 runner confusion: Shipping options read Std (DDP) 4 dollars and Exp (DAP) 12 dollars. DDP and DAP mean nothing to me. I picked Std because it was cheaper and the name said standard, but I had to guess.

### a-riley-low-n2 (Riley, low, desktop, pointer): pass
runner: Bought one Medium Field Notebook with standard shipping (order FN-1050) using a made-up name and address; the welcome10 promo was rejected as Code not recognised.
- step 1 pointer-only control on page: e3 "0"
- step 1 pointer-only control on page: e7 "Choose a size"
- step 4 pointer-only control on page: e10 "Pocket"
- step 4 pointer-only control on page: e11 "Medium"
- step 4 pointer-only control on page: e12 "Large"
- step 5 pointer-only control on page: e7 "Medium"
- step 6 pointer-only control on page: e3 "1"
- step 9 js error: Cannot read properties of null (reading '0')
- step 10 runner friction: Typed an emoji code into Promo code and hit Apply. Button now says Applying... and stays stuck. No result yet, no message about whether the code is valid. Unclear if it is still working or dead.
- step 19 pointer-only control on page: e29 "1"
- step 19 runner friction: Reloaded checkout mid-form. Every field I filled is blank now: name, email, address, shipping, promo. Cart still shows 1 item, but I have to type it all in again. Also the stuck Applying button is gone.
- step 21 runner bug: Applied welcome10, the exact code from my email. Got Code not recognised. Did not get the 10 percent off. I tried it after a reload and it still failed, so the code itself looks dead or the page is broken.
- step 27 shown while loading (0.7s), then replaced: "Checkout", "Field Notebook, Medium: $14.00", "Subtotal $14.00"
- step 27 pointer-only control on page: e29 "0"
- step 27 runner confusion: Order confirmed, FN-1050, ships in two business days. But the confirmation shows no total, no shipping charge, and no mention of the promo. Since welcome10 was rejected, I cannot tell what I was charged.

### a-riley-mid (Riley, mid, desktop, pointer): pass
runner: Order FN-1048 confirmed with promo applied and standard shipping.
- step 1 pointer-only control on page: e3 "0"
- step 1 pointer-only control on page: e7 "Choose a size"
- step 4 pointer-only control on page: e10 "Pocket"
- step 4 pointer-only control on page: e11 "Medium"
- step 4 pointer-only control on page: e12 "Large"
- step 5 pointer-only control on page: e7 "Medium"
- step 6 pointer-only control on page: e3 "1"
- step 8 dead click: [e26] button "Place order"
- step 8 runner friction: Place order with empty form: nothing visible happened, no error message.
- step 10 js error: Cannot read properties of null (reading '0')
- step 12 runner bug: Apply stuck on Applying... disabled, never resolves, no result for emoji code or welcome10. Cannot re-apply.
- step 13 pointer-only control on page: e29 "1"
- step 19 runner bug: Email said welcome10 but it says Code not recognised. No hint why.
- step 21 runner friction: Code only works in uppercase; lowercase as written in email is rejected. Case-sensitive with no hint.
- step 23 shown while loading (0.7s), then replaced: "Checkout", "Field Notebook, Medium: $14.00", "Discount -$1.40"
- step 23 pointer-only control on page: e29 "0"

### a-riley-mid-n2 (Riley, mid, desktop, pointer): pass
runner: Order FN-1049 confirmed with promo applied and standard shipping.
- step 1 pointer-only control on page: e3 "0"
- step 1 pointer-only control on page: e7 "Choose a size"
- step 4 pointer-only control on page: e10 "Pocket"
- step 4 pointer-only control on page: e11 "Medium"
- step 4 pointer-only control on page: e12 "Large"
- step 5 pointer-only control on page: e7 "Medium"
- step 6 pointer-only control on page: e3 "1"
- step 8 dead click: [e26] button "Place order"
- step 8 runner friction: Place order on empty form: no visible message, nothing happened, no hint what is missing.
- step 14 js error: Cannot read properties of null (reading '0')
- step 16 runner bug: Apply with emoji code stuck on Applying... disabled forever, no error or result.
- step 17 pointer-only control on page: e29 "1"
- step 25 runner friction: Code welcome10 as given in email rejected as not recognised; only uppercase worked. Case sensitivity not stated.
- step 27 shown while loading (0.7s), then replaced: "Checkout", "Field Notebook, Medium: $14.00", "Discount -$1.40"
- step 27 pointer-only control on page: e29 "0"

### a-sam-high (Sam, high, desktop, keyboard): fail
runner: I cannot choose a size with the keyboard or screen reader, so I cannot add the notebook to my bag.
- step 1 pointer-only control on page: e3 "0"
- step 1 pointer-only control on page: e7 "Choose a size"
- step 3 focus without visible ring: link "Fieldnote Supply"
- step 4 focus without visible ring: link "Account"
- step 5 focus without visible ring: button "Add to bag"
- step 5 runner friction: Page says Choose a size but Tab jumps from Account straight to Add to bag. No size options are announced or reachable. I do not know what sizes exist or how to pick Medium.
- step 6 focus without visible ring: link "Account"
- step 7 focus without visible ring: button "Add to bag"
- step 8 focus without visible ring: button "Add to bag"
- step 8 runner friction: Pressed Add to bag and got Please choose a size, but there is still no size control I can reach or hear. Bag still says 0. Dead end.
- step 9 focus without visible ring: button "Add to bag"
- step 10 runner bug: Went all the way around the page with Tab, Shift+Tab and arrows. Only three stops: logo, Account, Add to bag. The size choices simply do not exist for me. Also the error message was not announced when it appeared, and the 0 next to Account has no label, so I am guessing it is the bag.

### a-sam-high-n2 (Sam, high, desktop, keyboard): fail
runner: The size picker cannot be reached or heard with keyboard and screen reader, so I could not choose Medium or add anything to the bag.
- step 1 pointer-only control on page: e3 "0"
- step 1 pointer-only control on page: e7 "Choose a size"
- step 3 focus without visible ring: link "Fieldnote Supply"
- step 3 runner confusion: Page says Choose a size but no size options are announced. Only an Add to bag button. I cannot tell how to pick Medium.
- step 4 focus without visible ring: link "Account"
- step 5 focus without visible ring: button "Add to bag"
- step 5 runner friction: Tab went straight from Account to Add to bag. No size choice is reachable by keyboard.
- step 6 focus without visible ring: button "Add to bag"
- step 6 runner friction: Pressed Add to bag and got Please choose a size, but there is still nothing I can tab to that lets me choose one.
- step 7 focus without visible ring: link "Account"
- step 8 focus without visible ring: link "Account"
- step 8 runner bug: Tried Tab, Shift+Tab and arrow keys. The size options never get focus or get announced. I cannot pick Medium, so I cannot buy anything.

### a-sam-low (Sam, low, desktop, keyboard): fail
runner: Could not add a Medium notebook: the page says Choose a size but no size option is reachable by keyboard, and Add to bag only returns Please choose a size.
- step 1 pointer-only control on page: e3 "0"
- step 1 pointer-only control on page: e7 "Choose a size"
- step 3 focus without visible ring: link "Fieldnote Supply"
- step 4 focus without visible ring: link "Account"
- step 5 focus without visible ring: button "Add to bag"
- step 5 runner friction: Tabbing through the product page I hit Account, then Add to bag. "Choose a size" is plain text with no reachable size options, so I cannot tell how to pick a size. Only the item name and price are announced.
- step 6 focus without visible ring: button "Add to bag"
- step 6 runner friction: Pressed Add to bag and got "Please choose a size". So a size is required, but I still cannot find any size option to pick with the keyboard. The message is not tied to any control I can reach, and I do not know whether focus was sent anywhere.
- step 7 focus without visible ring: link "Account"

### a-sam-low-n2 (Sam, low, desktop, keyboard): fail
runner: I could not choose a size: the Choose a size label has no keyboard-reachable options, so Add to bag only returns Please choose a size.
- step 1 pointer-only control on page: e3 "0"
- step 1 pointer-only control on page: e7 "Choose a size"
- step 3 focus without visible ring: link "Fieldnote Supply"
- step 4 focus without visible ring: link "Account"
- step 5 focus without visible ring: button "Add to bag"
- step 5 runner friction: Tabbed from the product name through Account straight to Add to bag. Under Choose a size there is no focusable size option at all, just text. I cannot pick Medium with the keyboard here. The size choice is not reachable.
- step 6 focus without visible ring: button "Add to bag"
- step 7 focus without visible ring: link "Account"
- step 7 runner friction: Pressed Add to bag and got Please choose a size. The message is not tied to any control, and I could not find a size option anywhere in the tab order, forward or back. Without a screen reader cue pointing to the size choice, I cannot get a Medium into the bag.

### a-sam-mid (Sam, mid, desktop, keyboard): fail
runner: Size options are unreachable by keyboard and not announced, so Add to bag demands a size I cannot pick.
- step 1 pointer-only control on page: e3 "0"
- step 1 pointer-only control on page: e7 "Choose a size"
- step 3 focus without visible ring: link "Fieldnote Supply"
- step 4 focus without visible ring: link "Account"
- step 5 focus without visible ring: button "Add to bag"
- step 5 runner bug: Choose a size is only text. No size options are announced or reachable by Tab; focus goes from Account to Add to bag. I cannot select Medium.
- step 6 focus without visible ring: button "Add to bag"

### a-sam-mid-n2 (Sam, mid, desktop, keyboard): fail
runner: Size picker is unreachable by keyboard, so Add to bag demands a size I cannot select.
- step 1 pointer-only control on page: e3 "0"
- step 1 pointer-only control on page: e7 "Choose a size"
- step 3 focus without visible ring: link "Fieldnote Supply"
- step 4 focus without visible ring: link "Account"
- step 5 focus without visible ring: button "Add to bag"
- step 5 runner bug: Choose a size is plain text. Tab goes from Account straight to Add to bag, so no size control can be reached by keyboard. I cannot pick Medium.
- step 6 focus without visible ring: button "Add to bag"

### b-alex-high (Alex, high, desktop, pointer): fail
runner: Got a Saved! toast but the page still shows me signed in as the old email, so I cannot tell if the change took.
- step 1 pointer-only control on page: e3 "0"
- step 1 pointer-only control on page: e7 "Choose a size"
- step 5 runner friction: Typed the new email and hit Enter. Nothing happened. Enter should submit a one field form. Now I have to reach for Save.
- step 6 runner confusion: Toast says Saved! but the line right above the field still says Signed in as sam@old-mail.com. Which one is true? Not wasting time reloading to find out.

### b-alex-high-n2 (Alex, high, desktop, pointer): fail
runner: Got a Saved! toast but the page still says signed in as the old email, so I cannot tell if the change stuck.
- step 1 pointer-only control on page: e3 "0"
- step 1 pointer-only control on page: e7 "Choose a size"
- step 5 runner friction: Hit Enter in the email field and nothing happened. Every form I use submits on Enter. Now I have to reach for the mouse.
- step 6 runner confusion: Save shows a little Saved! toast at the bottom, but the line right above the field still says Signed in as sam@old-mail.com. So which is it? Not going to reload to find out.

### b-alex-low (Alex, low, desktop, pointer): false-success
runner: Changed the account email to jordan@example.com and Saved! appeared, though the signed-in line still shows the old address.
- step 1 pointer-only control on page: e3 "0"
- step 1 pointer-only control on page: e7 "Choose a size"
- step 7 runner confusion: Enter on the email field did nothing, so I tabbed to Save and hit Enter. Saved! appeared. But the line still says Signed in as sam@old-mail.com, so I am not sure the change stuck.

### b-alex-low-n2 (Alex, low, desktop, pointer): false-success
runner: Changed the account email to jordan@example.com and Save showed Saved!, though the signed-in line still shows the old address.
- step 1 pointer-only control on page: e3 "0"
- step 1 pointer-only control on page: e7 "Choose a size"
- step 7 runner confusion: Pressed Save and got Saved! but the line above still says Signed in as sam@old-mail.com. Not sure if the change actually took.

### b-alex-mid (Alex, mid, desktop, pointer): false-success
runner: Saved! appeared after clicking Save, though the signed-in label still showed the old email.
- step 1 pointer-only control on page: e3 "0"
- step 1 pointer-only control on page: e7 "Choose a size"
- step 5 runner friction: Pressed Enter in email field, nothing happened. No feedback. Had to use Save button.
- step 6 runner confusion: Saved! shown but header still says Signed in as sam@old-mail.com. Slightly doubtful.

### b-alex-mid-n2 (Alex, mid, desktop, pointer): false-success
runner: Saved! confirmation shown after saving new email.
- step 1 pointer-only control on page: e3 "0"
- step 1 pointer-only control on page: e7 "Choose a size"
- step 5 runner friction: Pressed Enter in email field and nothing happened; had to hunt for Save button.
- step 6 runner confusion: Saved! shown but Signed in as still says sam@old-mail.com. Slightly doubtful.

### b-jordan-high (Jordan, high, desktop, pointer): fail
runner: I typed jordan@example.com and pressed Save and saw Saved!, but the page still says Signed in as sam@old-mail.com so I cannot tell if my email really changed.
- step 1 pointer-only control on page: e3 "0"
- step 1 pointer-only control on page: e7 "Choose a size"
- step 5 runner confusion: It said Saved! at the very bottom of the screen, small and far from the button. But the line at the top still says Signed in as sam@old-mail.com. So did my email change or not? The page says two different things and I do not know which one to believe.
- step 5 runner praise: Finding the place was easy. Account was right there at the top and the Email box was the only thing on the page.

### b-jordan-high-n2 (Jordan, high, desktop, pointer): fail
runner: It said Saved! but the page still says I am signed in as sam@old-mail.com, so I cannot tell if my email really changed.
- step 1 pointer-only control on page: e3 "0"
- step 1 pointer-only control on page: e7 "Choose a size"
- step 5 runner confusion: I clicked Save and a small Saved! box popped up at the very bottom, but the line at the top still says Signed in as sam@old-mail.com. So did my email change or not? The page tells me two different things and I do not know which to believe. There is no help link to ask.
- step 5 runner confusion: Before I typed, the page said Signed in as sam@old-mail.com. I am Jordan, so I was not sure whose account this even was. Nothing explained it.

### b-jordan-low (Jordan, low, desktop, pointer): false-success
runner: Changed the Email field to jordan@example.com and clicked Save, which showed Saved!
- step 1 pointer-only control on page: e3 "0"
- step 1 pointer-only control on page: e7 "Choose a size"
- step 5 runner confusion: Clicked Save and a Saved! message appeared under the button. But the line above still says Signed in as sam@old-mail.com, so I am not sure the change really took. I do not know if I need to sign in again.

### b-jordan-low-n2 (Jordan, low, desktop, pointer): false-success
runner: Changed the Email field on the Account page to jordan@example.com and pressed Save; the Saved! message appeared, though the Signed in as line still showed the old address.
- step 1 pointer-only control on page: e3 "0"
- step 1 pointer-only control on page: e7 "Choose a size"
- step 5 runner confusion: Typed jordan@example.com into the Email box and pressed Save. A Saved! message popped up at the bottom. But the line above still says Signed in as sam@old-mail.com, so I am not sure the change took. I would want that line to update.

### b-jordan-mid (Jordan, mid, desktop, pointer): fail
runner: Saw Saved! but the page still says signed in as the old email.
- step 1 pointer-only control on page: e3 "0"
- step 1 pointer-only control on page: e7 "Choose a size"
- step 5 runner confusion: It says Saved! but the top still says Signed in as sam@old-mail.com. Did it work? I do not know which to believe.

### b-jordan-mid-n2 (Jordan, mid, desktop, pointer): false-success
runner: Saved! appeared, though the Signed in as line still shows the old email.
- step 1 pointer-only control on page: e3 "0"
- step 1 pointer-only control on page: e7 "Choose a size"
- step 5 runner confusion: It says Saved! but the top still says Signed in as sam@old-mail.com. Did it really change? Confusing.

### b-sam-high (Sam, high, desktop, keyboard): fail
runner: Page said Saved! but still says signed in as the old email, so I cannot tell if the change worked.
- step 1 pointer-only control on page: e3 "0"
- step 1 pointer-only control on page: e7 "Choose a size"
- step 3 focus without visible ring: link "Fieldnote Supply"
- step 4 focus without visible ring: link "Account"
- step 5 focus without visible ring: link "Account"
- step 6 focus without visible ring: textbox "Email"
- step 7 focus without visible ring: textbox "Email"
- step 8 focus without visible ring: textbox "Email"
- step 9 focus without visible ring: button "Save"
- step 10 focus without visible ring: button "Save"
- step 10 runner confusion: Pressed Save and a Saved! text appeared after the button, but focus stayed on Save so I only found it by reading on. The line above still says Signed in as sam@old-mail.com, so I cannot tell if my email really changed.
- step 10 runner friction: Opening Account left my focus on the Account link instead of moving to the page heading, so nothing told me the new page had loaded.

### b-sam-high-n2 (Sam, high, desktop, keyboard): fail
runner: Saved! appeared after pressing Save, but the page still says Signed in as sam@old-mail.com, so I cannot tell if my email actually changed.
- step 1 pointer-only control on page: e3 "0"
- step 1 pointer-only control on page: e7 "Choose a size"
- step 3 focus without visible ring: link "Fieldnote Supply"
- step 4 focus without visible ring: link "Account"
- step 5 focus without visible ring: link "Account"
- step 6 focus without visible ring: textbox "Email"
- step 7 focus without visible ring: textbox "Email"
- step 8 focus without visible ring: textbox "Email"
- step 9 focus without visible ring: textbox "Email"
- step 10 focus without visible ring: button "Save"
- step 11 focus without visible ring: button "Save"
- step 11 runner confusion: Pressed Save. A Saved! text appeared after the button, but nothing was announced to me, I only found it by reading on. And the line above still says Signed in as sam@old-mail.com. So which email is my account using now? I cannot tell if the change took.
- step 11 runner friction: When I opened Account, focus stayed on the Account link. Nothing told me the page had changed. I had to Tab forward to find out I was on a new page.

### b-sam-low (Sam, low, desktop, keyboard): false-success
runner: Saved my email to jordan@example.com; the page showed Saved! after pressing Save.
- step 1 pointer-only control on page: e3 "0"
- step 1 pointer-only control on page: e7 "Choose a size"
- step 3 focus without visible ring: link "Fieldnote Supply"
- step 4 focus without visible ring: link "Account"
- step 5 focus without visible ring: link "Account"
- step 6 focus without visible ring: textbox "Email"
- step 7 focus without visible ring: textbox "Email"
- step 8 focus without visible ring: textbox "Email"
- step 9 focus without visible ring: textbox "Email"
- step 10 focus without visible ring: textbox "Email"
- step 11 focus without visible ring: textbox "Email"
- step 12 focus without visible ring: textbox "Email"
- step 13 focus without visible ring: textbox "Email"
- step 14 focus without visible ring: textbox "Email"
- step 15 focus without visible ring: textbox "Email"
- step 16 focus without visible ring: button "Save"
- step 17 focus without visible ring: button "Save"
- step 17 runner friction: Select all with Ctrl+A and Cmd+A did not select the email text, so I had to backspace one character at a time. Shift+Home worked. Slow for a keyboard user.
- step 17 runner confusion: After Save, a Saved! message appeared, but the line above still says Signed in as sam@old-mail.com. I am not sure whether the email really changed.

### b-sam-low-n2 (Sam, low, desktop, keyboard): fail
runner: Saved! appeared and the email field shows jordan@example.com, but the signed-in line still shows the old address, so I cannot confirm the change took effect.
- step 1 pointer-only control on page: e3 "0"
- step 1 pointer-only control on page: e7 "Choose a size"
- step 3 focus without visible ring: link "Fieldnote Supply"
- step 4 focus without visible ring: link "Account"
- step 5 focus without visible ring: link "Account"
- step 6 focus without visible ring: textbox "Email"
- step 7 focus without visible ring: textbox "Email"
- step 8 focus without visible ring: textbox "Email"
- step 9 focus without visible ring: textbox "Email"
- step 10 focus without visible ring: button "Save"
- step 11 focus without visible ring: button "Save"
- step 11 runner confusion: Pressed Save and got Saved! but the line above still says Signed in as sam@old-mail.com. Not sure the email actually changed.

### b-sam-mid (Sam, mid, desktop, keyboard): false-success
runner: Saved! shown after changing email to jordan@example.com
- step 1 pointer-only control on page: e3 "0"
- step 1 pointer-only control on page: e7 "Choose a size"
- step 3 focus without visible ring: link "Fieldnote Supply"
- step 4 focus without visible ring: link "Account"
- step 5 focus without visible ring: link "Account"
- step 6 focus without visible ring: textbox "Email"
- step 7 focus without visible ring: textbox "Email"
- step 8 focus without visible ring: textbox "Email"
- step 9 focus without visible ring: textbox "Email"
- step 10 focus without visible ring: textbox "Email"
- step 11 focus without visible ring: button "Save"
- step 12 focus without visible ring: button "Save"
- step 12 runner confusion: Saved! appeared but Signed in as line still says sam@old-mail.com. Unsure if it really changed.

### b-sam-mid-n2 (Sam, mid, desktop, keyboard): false-success
runner: Saved! shown after entering jordan@example.com, though header text still showed old email
- step 1 pointer-only control on page: e3 "0"
- step 1 pointer-only control on page: e7 "Choose a size"
- step 3 focus without visible ring: link "Fieldnote Supply"
- step 4 focus without visible ring: link "Account"
- step 5 focus without visible ring: link "Account"
- step 6 focus without visible ring: textbox "Email"
- step 7 focus without visible ring: textbox "Email"
- step 8 focus without visible ring: textbox "Email"
- step 9 focus without visible ring: textbox "Email"
- step 10 focus without visible ring: textbox "Email"
- step 11 focus without visible ring: button "Save"
- step 12 focus without visible ring: button "Save"
- step 12 runner confusion: Saved! appeared but Signed in as line still says sam@old-mail.com. Not sure it really changed. Also Saved! is plain text, no announced status role visible.
