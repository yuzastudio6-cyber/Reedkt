# Stripe Billing Foundation

RP-STRIPE-FOUNDATION-01 adds the production-ready Stripe billing architecture as a mock/config-only foundation. It defines test/live mode separation, Secret Manager reference handling, customer and payment method link contracts, SetupIntent and Checkout Session stubs, webhook idempotency, and a live-mode readiness gate.

## test/live mode separation

Stripe runtime config is explicit: `disabled`, `test`, or `live`. Default local config is disabled and mock-only. Test mode uses only test Stripe secret references. Live mode is blocked unless the app environment is production, live mode is owner-allowed, manual approval is present, live API key and webhook references exist, the webhook endpoint mode is live, and no test references appear in the live config.

The Stripe mode is stored on every Stripe customer, payment method, setup, checkout, and webhook record. Test customer IDs and test payment methods must not be used in live mode, and live records must not be used in test mode.

## Secret Manager reference boundary

Stripe server keys, restricted keys, publishable-key references, and webhook signing secrets are represented as Secret Manager reference names. The foundation rejects raw Stripe-looking secret, restricted-key, live publishable-key, and webhook-secret values in config and route payloads.

The `SecretValueProvider` abstraction has disabled and mock providers for tests. No Google Secret Manager SDK dependency is added in this milestone. Future real secret resolution must happen only in backend runtime, must verify key mode prefixes, and must never log or return secret values.

## Saved payment methods

Customer and payment method link records store Stripe IDs, mode, status, and safe display metadata only. ReEditPro never stores full card numbers, CVC, raw payment credentials, raw provider payloads, Stripe API keys, webhook secrets, or provider headers.

## Checkout and SetupIntent stubs

The mock SetupIntent endpoint can create a local mock setup-intent record for an existing active customer link. It returns no live client secret and makes no Stripe call.

The mock Checkout endpoint validates an existing mock credit wallet and an active credit pack, then creates a local mock checkout-session record. It does not create a real Checkout Session, PaymentIntent, or SetupIntent, and it does not grant credits or mutate the wallet. Webhook-driven credit grants remain future work.

## Test-Mode Real Path

RP-STRIPE-TESTMODE-01 adds explicit `/test` routes for Stripe test customers, SetupIntents, Checkout Sessions, and raw-body webhook processing. Test checkout grants local mock purchased credits only after a verified test webhook and matching pack/wallet metadata. The mock `/mock` routes remain config-only stubs. See `docs/stripe-testmode-billing-path.md` and `smoke:stripe-testmode`.

## Webhook foundation

The mock webhook endpoint records verified mock events idempotently by Stripe event ID. Signature verification is a contract boundary only: future live Stripe verification requires the raw request body before JSON parsing, a `Stripe-Signature` header, and a mode-matched webhook signing secret reference. Parsed JSON body alone is not accepted for live verification.

Duplicate webhook event IDs return the existing mock event and never grant credits.

## Routes

RP-STRIPE-FOUNDATION-01 adds authenticated mock/config routes:

- `GET /v1/billing/stripe/config/status`
- `GET /v1/billing/stripe/live-readiness`
- `GET /v1/billing/stripe/test-readiness`
- `POST /v1/billing/stripe/setup-intents/mock`
- `POST /v1/billing/stripe/setup-intents/test`
- `POST /v1/billing/stripe/checkout-sessions/mock`
- `POST /v1/billing/stripe/checkout-sessions/test`
- `POST /v1/billing/stripe/webhooks/mock`
- `POST /v1/billing/stripe/webhooks/test`

The older `/api/stripe/*` route registry entries remain disabled future live metadata.

## Boundaries

This milestone makes no live Stripe calls, creates no real Checkout Sessions, creates no real SetupIntents, creates no real PaymentIntents, charges no cards, grants no credits from webhooks, performs no checkout/top-up live behavior, writes no Supabase data, has no production wallet mutation, writes no production ledger, calls no providers, and runs no render/export work. See `smoke:stripe-foundation`.
