# Planted defects: Fieldnote Supply

Ground truth for scoring a `/impeccable usertest` run against `shop/`. Start the shop with `node tests/fixtures/usertest/server.mjs` (port 4791).

Goals the fixture is built for:

- **A. Checkout:** "Buy one Medium Field Notebook with standard shipping. Your promo code is welcome10." Success text: `Order confirmed`.
- **B. Account:** "Change your account email to jordan@example.com." Success text: `Signed in as jordan@example.com`.

| ID | Defect | Where | Personas expected to hit it | Kind |
|---|---|---|---|---|
| P1 | Size picker is a div dropdown; mouse only, no keyboard path | product page | Sam (blocker) | a11y blocker |
| P2 | Only route to checkout is an unlabeled, pointer-only bag icon; "Added to bag" toast has no link | header, product page | Jordan, Sam, Casey | discoverability |
| P3 | "Place order" silently does nothing until the terms box, below a long policy block, is checked | checkout | everyone on goal A | dead click |
| P4a | Promo codes are case-sensitive: `welcome10` is rejected | checkout | anyone typing the code as given | copy / validation |
| P4b | Non-ASCII promo input throws a TypeError and leaves Apply stuck on "Applying..." | checkout | Riley | JS bug |
| P5 | Checkout fields are lost on reload or tab restore | checkout | Casey, Riley | state loss |
| P6 | "Place order" is a 4px-padded, ~30px-tall button | checkout | Casey | small target |
| P7 | Shipping options labeled "Std (DDP)" and "Exp (DAP)" | checkout | Jordan | jargon |
| P8 | Express shipping orders return HTTP 500 and the UI shows nothing | checkout, `/api/order` | anyone choosing express | silent failure |
| P9 | `*:focus { outline: none }` removes every focus indicator | global CSS | Sam | a11y |
| P10 | Account "Save" toasts "Saved!" but never saves | account | everyone on goal B | false success |
