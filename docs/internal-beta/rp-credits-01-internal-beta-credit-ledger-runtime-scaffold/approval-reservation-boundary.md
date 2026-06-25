# RP-CREDITS-01 Approval And Reservation Boundary

The product rule remains: estimate first, user approval second, reservation after approval, generation/render/worker execution only after a valid reservation.

This packet does not reserve credits. It records the backend runtime shape that a later milestone must satisfy before any real reservation, spend, release, or refund is allowed.

## Required Future Runtime Guarantees

- approved plan snapshot required before expensive work;
- approved credit estimate required before reservation;
- credit reservation required before worker/provider/render execution;
- append-only ledger entries for reserve, spend, release, refund, expiration, and admin adjustment;
- idempotency key enforcement for mutating operations;
- job success/failure transactionality before spend or refund;
- no Stripe/payment processing unless a separate sandbox billing milestone is approved.

## Current Phase

- Credit mutation: `false`
- Credit reservation: `not_created`
- Credit spend: `not_run`
- Credit release: `not_run`
- Credit refund: `not_run`
- Stripe/payment processing: `disabled`
- Internal beta end-to-end status: `not_ready`
