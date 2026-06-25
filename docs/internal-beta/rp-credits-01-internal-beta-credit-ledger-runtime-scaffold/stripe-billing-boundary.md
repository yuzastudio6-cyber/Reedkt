# RP-CREDITS-01 Stripe And Billing Boundary

Stripe/payment processing remains disabled in this packet.

Subscription access and Reedit Credits remain separate concepts. This packet does not implement checkout, webhooks, paid production billing, purchased-credit fulfillment, weekly bonus grant automation, refunds to payment method, or subscription management.

## Current Phase

- Stripe checkout: `disabled`
- Stripe webhook: `disabled`
- Payment processing: `disabled`
- Paid production billing: `blocked`
- Credit mutation: `false`
- Package-lock: `unchanged`

Any future Stripe sandbox milestone must be separate from this credit ledger scaffold and must preserve no-generation-before-approval, idempotency, auditability, and refund rules.
