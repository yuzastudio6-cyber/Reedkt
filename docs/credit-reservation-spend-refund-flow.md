# Credit Reservation, Spend, Release, And Refund Flow

## Intended Flow

```text
edit plan approved
-> credit estimate approved
-> credits reserved
-> generation/render/worker can queue
-> success spends reservation
-> failure releases or refunds reservation
```

## RP-FIX-09 Implementation

RP-FIX-09 adds mock services for:

- creating reservations after approved estimates;
- validating reservation status and scope;
- spending reserved credits after successful work;
- releasing reserved credits for cancelled/blocked work;
- refunding credits for failed ReeditPro-side work;
- creating mock ledger entries.

## Transaction Safety

The mock services update in-memory records only. Real reservation, spend, release, and refund must be transactional, idempotent, and backend-only. Ledger entries should remain append-only.

## Stripe Status

No Stripe checkout, webhook, subscription, purchase, or money refund flow is implemented. Credit purchase runtime remains a future blocker.
