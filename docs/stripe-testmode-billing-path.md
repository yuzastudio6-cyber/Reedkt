# Stripe Test-Mode Billing Path

RP-STRIPE-TESTMODE-01 adds the first real Stripe test-mode path for ReEditPro billing. It reuses the Stripe billing foundation, fixed credit packs, and shared mock wallet/grant store.

## Behavior

- Test readiness is explicit at `GET /v1/billing/stripe/test-readiness`.
- `POST /v1/billing/stripe/setup-intents/test` creates or reuses a test customer, then creates a Stripe test SetupIntent for saved payment methods.
- `POST /v1/billing/stripe/checkout-sessions/test` creates or reuses a test customer, validates a fixed credit pack and mock wallet, then creates a Stripe test Checkout Session.
- `POST /v1/billing/stripe/webhooks/test` verifies the raw request body and Stripe signature before processing test webhook events.

Checkout does not grant credits immediately. A verified test `checkout.session.completed` event must match the stored checkout session, wallet, pack, amount, currency, and metadata before one idempotent purchased grant is added to the local mock wallet.

`setup_intent.succeeded` records only safe payment-method display metadata when Stripe includes it. Full card numbers, CVC, raw provider payloads, provider headers, API keys, webhook secrets, and credentials are never stored.

## Runtime Boundary

The real test-mode client uses native `fetch` plus Node crypto. No Stripe SDK dependency is added and `package-lock.json` remains unchanged.

Real test calls require:

- `REEDITPRO_STRIPE_BILLING_MODE=test`
- `REEDITPRO_STRIPE_SECRET_SOURCE` enabled
- test secret, publishable, and webhook signing secret reference names
- `REEDITPRO_STRIPE_WEBHOOK_ENDPOINT_MODE=test`
- `REEDITPRO_STRIPE_TEST_MODE_REAL_CALLS_ALLOWED=true`

Local smoke coverage uses a mock Stripe client and deterministic signature checks, so no external Stripe API call is made in CI/default validation.

## Live Readiness Separation

RP-STRIPE-LIVE-READINESS-01 keeps live readiness separate from this test-mode path. The `/test` routes reject live mode, and live readiness remains a no-charge report that does not create live Stripe objects, process live webhooks, or grant credits. See `docs/stripe-live-readiness.md`.

## Boundaries

This milestone is test-mode only: no live Stripe call, no live billing, no card charge outside Stripe test mode, no Supabase write, no production wallet mutation, no production ledger write, no provider call, no render/export execution, no export unlock, and no production persistence. See `smoke:stripe-testmode`.
## RP-CREDITAUDIT-01 Note

The audit layer can trace Stripe test-mode checkout and webhook records to purchased mock credit grants. It keeps Stripe IDs and safe amounts only, and excludes raw webhook payloads, secrets, card numbers, and CVC.

## RP-EXTERNALBETA-01 Note

The external beta credit launch gate includes Stripe test-mode checkout and webhook idempotency as scenario evidence. It still requires verified test webhook completion before mock purchased credits are granted and does not enable live Stripe.
