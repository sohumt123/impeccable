# Usertest summary: 28 runs

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
| a-casey-low-n2 | Casey | low | pass | completed | 17 | 15 | 0 | 0 | 0 |
| a-casey-mid | Casey | mid | pass | completed | 18 | 16 | 0 | 0 | 1 |
| a-casey-mid-n2 | Casey | mid | pass | completed | 18 | 16 | 0 | 0 | 0 |
| a-jordan-low | Jordan | low | fail | abandoned | - | 13 | 0 | 0 | 0 |
| a-jordan-low-n2 | Jordan | low | fail | abandoned | - | 12 | 0 | 0 | 0 |
| a-jordan-mid | Jordan | mid | pass | completed | 17 | 15 | 0 | 0 | 0 |
| a-jordan-mid-n2 | Jordan | mid | pass | completed | 18 | 16 | 0 | 0 | 0 |
| a-riley-low | Riley | low | pass | completed | 30 | 26 | 0 | 1 | 0 |
| a-riley-low-n2 | Riley | low | pass | completed | 31 | 29 | 1 | 0 | 1 |
| a-riley-mid | Riley | mid | pass | completed | 28 | 25 | 1 | 1 | 1 |
| a-riley-mid-n2 | Riley | mid | pass | completed | 27 | 24 | 1 | 1 | 1 |
| a-sam-low | Sam | low | fail | abandoned | - | 5 | 0 | 0 | 0 |
| a-sam-low-n2 | Sam | low | fail | abandoned | - | 8 | 0 | 0 | 0 |
| a-sam-mid | Sam | mid | fail | blocked | - | 4 | 0 | 0 | 0 |
| a-sam-mid-n2 | Sam | mid | fail | blocked | - | 5 | 0 | 0 | 0 |

## Goal: Change your account email to jordan@example.com.

| run | persona | tier | verdict | claimed | met at step | actions | dead actions | js/network errors | refused |
|---|---|---|---|---|---|---|---|---|---|
| b-alex-low | Alex | low | false-success | completed | - | 4 | 0 | 0 | 0 |
| b-alex-low-n2 | Alex | low | false-success | completed | - | 4 | 0 | 0 | 0 |
| b-alex-mid | Alex | mid | false-success | completed | - | 4 | 0 | 0 | 0 |
| b-alex-mid-n2 | Alex | mid | false-success | completed | - | 4 | 0 | 0 | 0 |
| b-jordan-low | Jordan | low | false-success | completed | - | 3 | 0 | 0 | 0 |
| b-jordan-low-n2 | Jordan | low | false-success | completed | - | 3 | 0 | 0 | 0 |
| b-jordan-mid | Jordan | mid | fail | unsure | - | 3 | 0 | 0 | 0 |
| b-jordan-mid-n2 | Jordan | mid | fail | unsure | - | 3 | 0 | 0 | 0 |
| b-sam-low | Sam | low | false-success | completed | - | 8 | 0 | 0 | 0 |
| b-sam-low-n2 | Sam | low | false-success | completed | - | 8 | 0 | 0 | 0 |
| b-sam-mid | Sam | mid | false-success | completed | - | 8 | 0 | 0 | 0 |
| b-sam-mid-n2 | Sam | mid | false-success | completed | - | 8 | 0 | 0 | 0 |

## Evidence by run

### a-casey-low (Casey, low, mobile, pointer): pass
runner: Ordered one Medium Field Notebook with standard shipping; got an Order confirmed screen, though the welcome10 code was rejected and I paid full price.
- step 1 pointer-only control on page: e3 "0"
- step 1 pointer-only control on page: e7 "Choose a size"
- step 3 pointer-only control on page: e9 "Pocket"
- step 3 pointer-only control on page: e10 "Medium"
- step 3 pointer-only control on page: e11 "Large"
- step 4 pointer-only control on page: e7 "Medium"
- step 5 pointer-only control on page: e3 "1"
- step 6 shown while loading (1.2s), then replaced: "Account  0"
- step 6 simulated leaving mid-flow: page was unloaded and reopened at the same URL
- step 6 pointer-only control on page: e15 "1"
- step 6 pointer-only control on page: e19 "Choose a size"
- step 6 runner friction: Came back and the size picker says Choose a size again, though I picked Medium. Bag badge says 1 though, so I am not sure what I actually added. Not sure the item has a size.
- step 7 tapped a small target: [e15] clickable "1" small target 28x20
- step 7 action sits in the top of the screen, outside the thumb zone: [e15] clickable "1"
- step 11 tapped a small target: [e28] radio "Std (DDP) $4" small target 320x22
- step 13 shown while loading (0.7s), then replaced: "Applying..."
- step 13 runner friction: Typed welcome10 from my email and hit Apply. It says Code not recognised. Maybe the code expired or I typed it wrong, but I copied it exactly. No hint why it failed.
- step 14 shown while loading (0.7s), then replaced: "Applying..."
- step 16 tapped a small target: [e33] checkbox "I accept the terms" small target 134x21
- step 17 shown while loading (1.0s), then replaced: "Placing..."
- step 17 tapped a small target: [e34] button "Place order" small target 85x28
- step 17 pointer-only control on page: e15 "0"

### a-casey-low-n2 (Casey, low, mobile, pointer): pass
runner: Ordered one Medium Field Notebook with standard shipping; order FN-1047 confirmed, though the welcome10 code was rejected and I paid full price.
- step 1 pointer-only control on page: e3 "0"
- step 1 pointer-only control on page: e7 "Choose a size"
- step 3 pointer-only control on page: e9 "Pocket"
- step 3 pointer-only control on page: e10 "Medium"
- step 3 pointer-only control on page: e11 "Large"
- step 4 pointer-only control on page: e7 "Medium"
- step 5 pointer-only control on page: e3 "1"
- step 6 shown while loading (1.2s), then replaced: "Account  0"
- step 6 simulated leaving mid-flow: page was unloaded and reopened at the same URL
- step 6 pointer-only control on page: e15 "1"
- step 6 pointer-only control on page: e19 "Choose a size"
- step 6 runner confusion: Came back to the product page and the size now says Choose a size again, though the bag says 1. Not sure if the Medium I picked actually went in. Going to check the bag.
- step 7 tapped a small target: [e15] clickable "1" small target 28x20
- step 7 action sits in the top of the screen, outside the thumb zone: [e15] clickable "1"
- step 11 tapped a small target: [e28] radio "Std (DDP) $4" small target 320x22
- step 14 shown while loading (0.7s), then replaced: "Applying..."
- step 14 runner friction: Typed welcome10 from my email and hit Apply. It says Code not recognised. I just want my 10 percent off. Maybe the code is wrong or maybe I typed it wrong, not sure which.
- step 16 tapped a small target: [e33] checkbox "I accept the terms" small target 134x21
- step 17 shown while loading (1.1s), then replaced: "Placing..."
- step 17 tapped a small target: [e34] button "Place order" small target 85x28
- step 17 pointer-only control on page: e15 "0"

### a-casey-mid (Casey, mid, mobile, pointer): pass
runner: Order FN-1046 confirmed
- step 1 pointer-only control on page: e3 "0"
- step 1 pointer-only control on page: e7 "Choose a size"
- step 3 pointer-only control on page: e9 "Pocket"
- step 3 pointer-only control on page: e10 "Medium"
- step 3 pointer-only control on page: e11 "Large"
- step 4 pointer-only control on page: e7 "Medium"
- step 5 pointer-only control on page: e3 "1"
- step 6 shown while loading (1.2s), then replaced: "Account  0"
- step 6 simulated leaving mid-flow: page was unloaded and reopened at the same URL
- step 6 pointer-only control on page: e15 "1"
- step 6 pointer-only control on page: e19 "Choose a size"
- step 7 tapped a small target: [e15] clickable "1" small target 28x20
- step 7 action sits in the top of the screen, outside the thumb zone: [e15] clickable "1"
- step 10 runner confusion: Shipping options say Std (DDP) and Exp (DAP). No idea what DDP/DAP mean. Guessing Std is standard.
- step 11 tapped a small target: [e28] radio "Std (DDP) $4" small target 320x22
- step 13 shown while loading (0.7s), then replaced: "Applying..."
- step 15 shown while loading (0.7s), then replaced: "Applying..."
- step 15 runner friction: Lowercase welcome10 from my email was rejected as not recognised. Only uppercase worked. Annoying when typing on a phone.
- step 15 refused click: e33 is not on your screen (it is below what you can see); scroll to it first
- step 17 tapped a small target: [e33] checkbox "I accept the terms" small target 134x21
- step 18 shown while loading (1.1s), then replaced: "Placing..."
- step 18 tapped a small target: [e34] button "Place order" small target 85x28
- step 18 pointer-only control on page: e15 "0"

### a-casey-mid-n2 (Casey, mid, mobile, pointer): pass
runner: Order FN-1045 confirmed
- step 1 pointer-only control on page: e3 "0"
- step 1 pointer-only control on page: e7 "Choose a size"
- step 3 pointer-only control on page: e9 "Pocket"
- step 3 pointer-only control on page: e10 "Medium"
- step 3 pointer-only control on page: e11 "Large"
- step 4 pointer-only control on page: e7 "Medium"
- step 5 pointer-only control on page: e3 "1"
- step 6 shown while loading (1.2s), then replaced: "Account  0"
- step 6 simulated leaving mid-flow: page was unloaded and reopened at the same URL
- step 6 pointer-only control on page: e15 "1"
- step 6 pointer-only control on page: e19 "Choose a size"
- step 7 tapped a small target: [e15] clickable "1" small target 28x20
- step 7 action sits in the top of the screen, outside the thumb zone: [e15] clickable "1"
- step 11 tapped a small target: [e28] radio "Std (DDP) $4" small target 320x22
- step 13 shown while loading (0.7s), then replaced: "Applying..."
- step 13 runner friction: Promo welcome10 from my email says Code not recognised. No hint why. Annoying.
- step 15 shown while loading (0.7s), then replaced: "Applying..."
- step 15 runner bug: Code only worked in capitals. Lowercase from the email was rejected with no hint.
- step 17 tapped a small target: [e33] checkbox "I accept the terms" small target 134x21
- step 18 shown while loading (1.1s), then replaced: "Placing..."
- step 18 tapped a small target: [e34] button "Place order" small target 85x28
- step 18 pointer-only control on page: e15 "0"

### a-jordan-low (Jordan, low, desktop, pointer): fail
runner: Added the Medium notebook and filled in checkout with standard shipping, but welcome10 was rejected twice with Code not recognised, and I did not want to pay full price after two dead ends.
- step 1 pointer-only control on page: e3 "0"
- step 1 pointer-only control on page: e7 "Choose a size"
- step 3 pointer-only control on page: e9 "Pocket"
- step 3 pointer-only control on page: e10 "Medium"
- step 3 pointer-only control on page: e11 "Large"
- step 4 pointer-only control on page: e7 "Medium"
- step 5 pointer-only control on page: e3 "1"
- step 12 shown while loading (0.7s), then replaced: "Applying..."
- step 12 runner friction: I typed welcome10 from my email and hit Apply. It says Code not recognised. The price is still $14.00 with no discount shown. I do not know if I typed it wrong or if the code is dead. I have no way to check my email from here.
- step 15 shown while loading (0.7s), then replaced: "Applying..."
- step 15 runner friction: Retyped welcome10 exactly as the email said and hit Apply again. Still Code not recognised. Two tries and the discount is not there. I am not going to pay full price guessing at this. Also the shipping choices say Std (DDP) and Exp (DAP) and I have no idea what DDP or DAP mean. I just picked the one that said Std.

### a-jordan-low-n2 (Jordan, low, desktop, pointer): fail
runner: Added the Medium notebook with standard shipping, but the welcome10 code was rejected twice with no explanation, so I stopped before placing the order.
- step 1 pointer-only control on page: e3 "0"
- step 1 pointer-only control on page: e7 "Choose a size"
- step 3 pointer-only control on page: e9 "Pocket"
- step 3 pointer-only control on page: e10 "Medium"
- step 3 pointer-only control on page: e11 "Large"
- step 4 pointer-only control on page: e7 "Medium"
- step 5 pointer-only control on page: e3 "1"
- step 13 shown while loading (0.7s), then replaced: "Applying..."
- step 13 runner friction: I typed welcome10 exactly as in my email and pressed Apply. It says Code not recognised. I do not know if I typed it wrong or if the code is dead. No hint what to do next.
- step 15 shown while loading (0.7s), then replaced: "Applying..."
- step 15 runner friction: Tried welcome10 a second time, same message: Code not recognised. The page does not say why or where to find a working code. I am not going to pay full price without knowing if the code is wrong. Giving up.

### a-jordan-mid (Jordan, mid, desktop, pointer): pass
runner: Order FN-1042 confirmed for Medium notebook with standard shipping and promo applied.
- step 1 pointer-only control on page: e3 "0"
- step 1 pointer-only control on page: e7 "Choose a size"
- step 3 pointer-only control on page: e9 "Pocket"
- step 3 pointer-only control on page: e10 "Medium"
- step 3 pointer-only control on page: e11 "Large"
- step 4 pointer-only control on page: e7 "Medium"
- step 5 pointer-only control on page: e3 "1"
- step 9 runner confusion: Shipping options say Std (DDP) and Exp (DAP). I do not know what DDP or DAP mean. Guessing Std is standard.
- step 12 shown while loading (0.7s), then replaced: "Applying..."
- step 12 runner friction: Typed the code exactly as in my email and it says Code not recognised. No hint why or where to get help. Dead end one.
- step 14 shown while loading (0.7s), then replaced: "Applying..."
- step 14 runner bug: Lowercase code from my email was rejected but capitals worked. Nothing told me codes are case-sensitive.
- step 17 shown while loading (0.7s), then replaced: "Placing..."

### a-jordan-mid-n2 (Jordan, mid, desktop, pointer): pass
runner: Order FN-1043 confirmed with Medium notebook, standard shipping, promo applied.
- step 1 pointer-only control on page: e3 "0"
- step 1 pointer-only control on page: e7 "Choose a size"
- step 3 action failed: select [e7] clickable "Choose a size": e7 is not a dropdown list; click it instead
- step 4 pointer-only control on page: e9 "Pocket"
- step 4 pointer-only control on page: e10 "Medium"
- step 4 pointer-only control on page: e11 "Large"
- step 5 pointer-only control on page: e7 "Medium"
- step 6 pointer-only control on page: e3 "1"
- step 7 runner confusion: Shipping options say Std (DDP) and Exp (DAP). I do not know what DDP or DAP mean. Guessing Std is standard.
- step 13 shown while loading (0.7s), then replaced: "Applying..."
- step 13 runner friction: Typed welcome10 exactly as in my email, pressed Apply, got Code not recognised. No hint why. I do not know if I typed it wrong.
- step 15 shown while loading (0.7s), then replaced: "Applying..."
- step 15 runner bug: Code only worked in capitals. Email said lowercase welcome10. Confusing.
- step 18 shown while loading (0.7s), then replaced: "Placing..."

### a-riley-low (Riley, low, desktop, pointer): pass
runner: Bought one Medium Field Notebook with standard shipping; order FN-1048 confirmed, though welcome10 was rejected and the order was placed at full price.
- step 1 pointer-only control on page: e3 "0"
- step 1 pointer-only control on page: e7 "Choose a size"
- step 3 pointer-only control on page: e9 "Pocket"
- step 3 pointer-only control on page: e10 "Medium"
- step 3 pointer-only control on page: e11 "Large"
- step 4 action failed: click [e8] button "Add to bag": something else is on top of e8 at that spot: [e9] div "Pocket"
- step 5 pointer-only control on page: e7 "Medium"
- step 6 pointer-only control on page: e3 "1"
- step 6 runner friction: With the size list open it covered the Add to bag button. I tried to add before picking a size and could not click through it. Had to pick a size first anyway, which I would have done, but the list hides the button while open.
- step 10 js error: Cannot read properties of null (reading '0')
- step 12 runner friction: I put an emoji junk string in the promo code and hit Apply. The button says Applying... and is greyed out, and it stayed that way across two checks. No message saying the code is bad or that it is still working. I cannot tell if it is stuck.
- step 14 pointer-only control on page: e29 "1"
- step 14 runner friction: Reloaded checkout mid-form. The bag still has my Medium notebook, good, but the name and promo code I typed are gone. I have to type everything again. Annoying but I can recover.
- step 20 shown while loading (0.7s), then replaced: "Applying..."
- step 20 runner bug: Applied welcome10, the code from my email, and got Code not recognised. The code was typed exactly as sent. Either the code is dead or the emoji test earlier broke something. The store promised me this code and it rejects it.
- step 21 shown while loading (0.7s), then replaced: "Applying..."
- step 22 pointer-only control on page: e48 "Choose a size"
- step 22 runner confusion: Pressed back from checkout. Landed on the product page and the size now says Choose a size again, although my bag still has 1 item. Looks like the page forgot my size choice. Confusing about what is actually in the bag.
- step 28 runner friction: The policy paragraph above the terms box is the same two sentences repeated about ten times. Hard to read and it looks like placeholder text. I skimmed it to find the returns line.
- step 30 shown while loading (0.7s), then replaced: "Placing..."
- step 30 pointer-only control on page: e29 "0"

### a-riley-low-n2 (Riley, low, desktop, pointer): pass
runner: Order FN-1050 was placed for one Medium Field Notebook with standard shipping, but welcome10 was rejected every time and I paid full price.
- step 1 pointer-only control on page: e3 "0"
- step 1 pointer-only control on page: e7 "Choose a size"
- step 3 pointer-only control on page: e9 "Pocket"
- step 3 pointer-only control on page: e10 "Medium"
- step 3 pointer-only control on page: e11 "Large"
- step 4 pointer-only control on page: e7 "Medium"
- step 5 pointer-only control on page: e3 "1"
- step 9 runner confusion: Typed a run of spaces into Email and the field stayed empty with no message. Fine, but I have no idea whether it was rejected or just ignored.
- step 15 shown while loading (0.7s), then replaced: "Applying..."
- step 15 runner friction: Applied welcome10 from my email and got Code not recognised under the box. I typed it exactly as sent. No hint of why, and I have not chosen shipping yet, so I do not know if that matters.
- step 17 shown while loading (0.7s), then replaced: "Applying..."
- step 19 dead click: [e26] button "Place order"
- step 19 runner friction: Pressed Place order without ticking the terms box. Nothing happened: no message, no highlight, the box is still unticked. I cannot tell whether the order went through or was blocked.
- step 21 pointer-only control on page: e30 "1"
- step 21 runner friction: Reloaded checkout halfway through. The bag still has my notebook, but every field I typed is blank again: name, email, address, promo, shipping, terms. I have to type it all over.
- step 21 refused fill: e34 is not on your screen (it is above what you can see); scroll to it first
- step 28 shown while loading (0.7s), then replaced: "Applying..."
- step 28 runner friction: Third try at welcome10, exact same text from my email, still Code not recognised. Nothing says whether the code expired, is case sensitive, or is for another product. I am giving up on the code and will pay full price.
- step 31 shown while loading (0.7s), then replaced: "Placing..."
- step 31 pointer-only control on page: e30 "0"

### a-riley-mid (Riley, mid, desktop, pointer): pass
runner: Order FN-1049 confirmed with WELCOME10 and standard shipping.
- step 1 pointer-only control on page: e3 "0"
- step 1 pointer-only control on page: e7 "Choose a size"
- step 4 pointer-only control on page: e10 "Pocket"
- step 4 pointer-only control on page: e11 "Medium"
- step 4 pointer-only control on page: e12 "Large"
- step 5 pointer-only control on page: e7 "Medium"
- step 6 pointer-only control on page: e3 "1"
- step 7 refused click: e26 is not on your screen (it is below what you can see); scroll to it first
- step 9 js error: Cannot read properties of null (reading '0')
- step 11 runner bug: Apply with emoji code: button stuck on Applying... disabled, no result message after several steps.
- step 16 pointer-only control on page: e29 "1"
- step 18 shown while loading (0.7s), then replaced: "Applying..."
- step 20 shown while loading (0.7s), then replaced: "Applying..."
- step 20 runner friction: Email said welcome10 but lowercase is rejected as Code not recognised; only uppercase works. Case-sensitive with no hint.
- step 26 dead click: [e43] button "Place order"
- step 26 runner friction: Place order without accepting terms: nothing visible happened, no message telling me what is missing.
- step 28 shown while loading (0.7s), then replaced: "Placing..."
- step 28 pointer-only control on page: e29 "0"

### a-riley-mid-n2 (Riley, mid, desktop, pointer): pass
runner: Order FN-1051 confirmed with WELCOME10 and standard shipping
- step 1 pointer-only control on page: e3 "0"
- step 1 pointer-only control on page: e7 "Choose a size"
- step 4 pointer-only control on page: e10 "Pocket"
- step 4 pointer-only control on page: e11 "Medium"
- step 4 pointer-only control on page: e12 "Large"
- step 5 pointer-only control on page: e7 "Medium"
- step 6 pointer-only control on page: e3 "1"
- step 7 refused click: e26 is not on your screen (it is below what you can see); scroll to it first
- step 9 js error: Cannot read properties of null (reading '0')
- step 11 runner bug: Apply with a junk promo code goes to Applying... and stays disabled with no result or error message. Cannot tell if it failed.
- step 15 pointer-only control on page: e29 "1"
- step 21 shown while loading (0.7s), then replaced: "Applying..."
- step 21 runner bug: Email said welcome10 but site says Code not recognised. Earlier junk code hung on Applying forever, so errors are inconsistent.
- step 23 shown while loading (0.7s), then replaced: "Applying..."
- step 25 dead click: [e43] button "Place order"
- step 25 runner friction: Place order without accepting terms: nothing happened, no message at all.
- step 27 shown while loading (0.7s), then replaced: "Placing..."
- step 27 pointer-only control on page: e29 "0"

### a-sam-low (Sam, low, desktop, keyboard): fail
runner: Could not add a Medium Field Notebook: the page asks me to choose a size, but no size option is reachable by Tab or Enter, so I gave up before reaching checkout.
- step 1 pointer-only control on page: e3 "0"
- step 1 pointer-only control on page: e7 "Choose a size"
- step 3 focus without visible ring: link "Fieldnote Supply"
- step 4 focus without visible ring: link "Account"
- step 5 focus without visible ring: button "Add to bag"
- step 5 runner friction: Tabbed through the whole page: home link, Account, then straight to Add to bag. The text says Choose a size but there is no size control I can reach, so I cannot pick Medium. I cannot tell if it is a missing control or just not reachable by keyboard.
- step 6 focus without visible ring: button "Add to bag"
- step 6 runner friction: Pressed Add to bag and it says Please choose a size. Fair enough, but I still cannot reach any size choice with Tab, so I am stuck. The error is announced in the list but I cannot fix it from here.
- step 7 focus without visible ring: link "Account"

### a-sam-low-n2 (Sam, low, desktop, keyboard): fail
runner: Could not pick a size. The page says Choose a size and Please choose a size, but no size control is reachable by keyboard, so I gave up before checkout.
- step 1 pointer-only control on page: e3 "0"
- step 1 pointer-only control on page: e7 "Choose a size"
- step 3 focus without visible ring: link "Fieldnote Supply"
- step 4 focus without visible ring: link "Account"
- step 5 focus without visible ring: button "Add to bag"
- step 5 runner friction: Tabbing through the page I hit the logo, Account, then Add to bag. The text says Choose a size but I found no size control I could reach with Tab. I cannot tell how to pick Medium.
- step 6 focus without visible ring: link "Account"
- step 7 focus without visible ring: button "Add to bag"
- step 8 focus without visible ring: button "Add to bag"
- step 8 runner bug: Pressed Add to bag and got Please choose a size. But I still cannot find any size option in the list I can reach. The size choice seems to be missing or not focusable, so I am stuck.
- step 9 action failed: scroll down: Input.dispatchMouseEvent timed out
- step 9 focus without visible ring: button "Add to bag"
- step 10 action failed: scroll down: Input.dispatchMouseEvent timed out
- step 10 focus without visible ring: button "Add to bag"

### a-sam-mid (Sam, mid, desktop, keyboard): fail
runner: Size options are unreachable by keyboard, so Add to bag only says Please choose a size.
- step 1 pointer-only control on page: e3 "0"
- step 1 pointer-only control on page: e7 "Choose a size"
- step 3 focus without visible ring: link "Fieldnote Supply"
- step 4 focus without visible ring: link "Account"
- step 5 focus without visible ring: button "Add to bag"
- step 5 runner bug: Choose a size is just text. No size controls can be reached by Tab; focus skips from Account straight to Add to bag. I cannot pick Medium.
- step 6 focus without visible ring: button "Add to bag"

### a-sam-mid-n2 (Sam, mid, desktop, keyboard): fail
runner: Size options for Medium are not keyboard reachable, so Add to bag only says Please choose a size.
- step 1 pointer-only control on page: e3 "0"
- step 1 pointer-only control on page: e7 "Choose a size"
- step 3 focus without visible ring: link "Fieldnote Supply"
- step 4 focus without visible ring: link "Account"
- step 5 focus without visible ring: button "Add to bag"
- step 5 runner bug: Heard Choose a size but no size controls exist in tab order. Tab went from Account straight to Add to bag. Cannot pick Medium.
- step 6 focus without visible ring: button "Add to bag"
- step 7 focus without visible ring: button "Add to bag"

### b-alex-low (Alex, low, desktop, pointer): false-success
runner: Saved the account email as jordan@example.com with the Save button, which showed Saved!
- step 1 pointer-only control on page: e3 "0"
- step 1 pointer-only control on page: e7 "Choose a size"
- step 5 runner friction: Hit Enter in the email field and nothing happened. No save, no message. Had to find the Save button.
- step 6 runner confusion: Saved! appeared, but the line above still says Signed in as sam@old-mail.com. Not sure the email actually changed.

### b-alex-low-n2 (Alex, low, desktop, pointer): false-success
runner: Changed the account email to jordan@example.com and the page showed Saved!, though the signed-in line still showed the old address.
- step 1 pointer-only control on page: e3 "0"
- step 1 pointer-only control on page: e7 "Choose a size"
- step 5 runner friction: Pressed Enter in the email field and nothing happened. No save, no message. Had to find the Save button myself.
- step 6 runner confusion: Saved says Saved! but the line above still reads Signed in as sam@old-mail.com. Not sure if the change took effect until I check again.

### b-alex-mid (Alex, mid, desktop, pointer): false-success
runner: Saved! appeared after entering new email, though header still showed old email.
- step 1 pointer-only control on page: e3 "0"
- step 1 pointer-only control on page: e7 "Choose a size"
- step 5 runner friction: Pressed Enter in email field, nothing happened. Had to hunt for Save button.
- step 6 runner confusion: Saved! shown but Signed in as still says sam@old-mail.com. Stale, makes me doubt it.

### b-alex-mid-n2 (Alex, mid, desktop, pointer): false-success
runner: Saved! confirmation shown, though header still showed old email.
- step 1 pointer-only control on page: e3 "0"
- step 1 pointer-only control on page: e7 "Choose a size"
- step 5 runner friction: Pressed Enter in email field, nothing happened. No submit on Enter, no feedback.
- step 6 runner confusion: Saved! shown but Signed in as still says sam@old-mail.com. Stale, makes me doubt it worked.

### b-jordan-low (Jordan, low, desktop, pointer): false-success
runner: I typed jordan@example.com into the Email box on the Account page, clicked Save, and it said Saved!, so I think my email is changed.
- step 1 pointer-only control on page: e3 "0"
- step 1 pointer-only control on page: e7 "Choose a size"
- step 6 runner confusion: Clicked Save and the box says Saved! That is good. But the line above still says Signed in as sam@old-mail.com, so I am not sure the email really changed. Hard to tell.

### b-jordan-low-n2 (Jordan, low, desktop, pointer): false-success
runner: Changed the account email field to jordan@example.com and Save showed Saved!, though the signed-in line still shows the old address.
- step 1 pointer-only control on page: e3 "0"
- step 1 pointer-only control on page: e7 "Choose a size"
- step 5 runner confusion: Typed jordan@example.com and pressed Save. It says Saved! but the line above still says Signed in as sam@old-mail.com. I am not sure if the change really took effect or if I need to log in again.

### b-jordan-mid (Jordan, mid, desktop, pointer): fail
runner: Saw Saved! but the signed-in line still shows the old email.
- step 1 pointer-only control on page: e3 "0"
- step 1 pointer-only control on page: e7 "Choose a size"
- step 5 runner confusion: It says Saved! but the top still says Signed in as sam@old-mail.com. Did it change or not? I do not know.

### b-jordan-mid-n2 (Jordan, mid, desktop, pointer): fail
runner: Saved! appeared but page still says signed in as the old email.
- step 1 pointer-only control on page: e3 "0"
- step 1 pointer-only control on page: e7 "Choose a size"
- step 5 runner confusion: It says Saved! but the top still says Signed in as sam@old-mail.com. Did it change or not? Confusing.

### b-sam-low (Sam, low, desktop, keyboard): false-success
runner: Changed the account email to jordan@example.com and saw Saved! after pressing Save, though the signed-in line still showed the old address.
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
- step 10 runner confusion: Pressed Save and a Saved! text appeared, but the line above still says Signed in as sam@old-mail.com. Not sure whether the email really changed. The status is only plain text, nothing announced to me as a live message that I could tell.

### b-sam-low-n2 (Sam, low, desktop, keyboard): false-success
runner: Changed the account email to jordan@example.com and pressed Save; the page showed Saved!
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
- step 10 runner confusion: Saved message appeared after pressing Save, which is what I wanted. But the line above the field still says Signed in as sam@old-mail.com, so I am not sure the change took effect for my account. The Saved text is a plain text node, I did not hear it announced as a status.

### b-sam-mid (Sam, mid, desktop, keyboard): false-success
runner: Saved! shown after saving jordan@example.com, though header text still showed old email
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
- step 10 runner confusion: Saved! appeared but Signed in as still says sam@old-mail.com. Unsure it changed. Also no announcement that I know of for Saved.

### b-sam-mid-n2 (Sam, mid, desktop, keyboard): false-success
runner: Saved confirmation shown after entering jordan@example.com
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
- step 10 runner confusion: Saved! appeared but the Signed in as line still says sam@old-mail.com. Not announced as a live status either as far as I can tell. Unsure it really changed.
