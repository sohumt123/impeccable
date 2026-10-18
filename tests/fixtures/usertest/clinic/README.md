# Harbor Clinic fixture

A small primary-care clinic site: book a visit, or manage an existing booking.

## Start

```bash
node tests/fixtures/usertest/clinic/server.mjs        # port 4792
node tests/fixtures/usertest/clinic/server.mjs 5000   # any other port
```

Start URL: `http://127.0.0.1:4792/`

No build step and no dependencies. Each browser session (cookie) gets its own fresh copy of the clinic's bookings, so parallel visitors don't affect each other. Restarting the server resets everything.

## Goals

### A. Book a check-up

> "I want to book my yearly physical, a routine check-up, with a nurse practitioner. Any weekday morning works for me. My name is Priya Raman, born March 14, 1988. My mobile is (415) 555-0137 and my email is priya.raman@example.com."

Success text: `Your appointment is confirmed`

### B. Cancel an appointment

> "I have a follow-up appointment at Harbor Clinic that I can't make any more, so I want to cancel it. My booking reference is HC-4471 and the booking is under Morgan Lee. The reason is a schedule conflict."

Success text: `Appointment HC-4471 has been cancelled`
