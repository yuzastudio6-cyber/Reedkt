# Credit Top-Up Purchased Grants

RP-CREDITPURCHASE-01 adds a mock-safe credit top-up and purchased grant layer for the external-beta credit foundation. It lets local/mock flows add purchased credits to a mock wallet so the user can retry reservation, revised-credit approval, or export gate checks after an insufficient-credit block.

## Packs And Grants

Mock credit packs are fixed for this milestone:

- 100 credits = $10
- 250 credits = $25
- 500 credits = $50
- 1,000 credits = $100
- 2,500 credits = $250

The policy remains `1 credit = $0.10`; pack `priceCents` and `retailValueCents` both use `credits * CREDIT_RETAIL_VALUE_CENTS`. Purchased grants use `sourceType = purchased`, `billingProvider = mock`, and `metadata.mockOnly = true`. They are separate from weekly bonus, promotional, admin, and refund credits.

## Behavior

Completing a mock top-up increases only local mock wallet available credits. It does not reserve credits, spend credits, release credits, write a ledger entry, retry paid work, unlock export, or run checkout. Idempotency returns the same mock top-up/grant and prevents duplicate credit grants.

Top-up suggestions are read-only. They can recommend the smallest active pack for estimate reservation shortfall, revised-credit additional hold shortfall, or approved-but-unfunded export settlement outstanding credits. After top-up, the user must retry reservation, revised-credit approval, or export gate explicitly.

## Boundaries

This is mock-only: no live billing, no Stripe/payment, no real checkout, no provider calls, no Supabase migrations or writes, no production wallet mutation, no production ledger writes, no render/export execution, no export unlock, and no production persistence. See `smoke:credit-purchase`.
