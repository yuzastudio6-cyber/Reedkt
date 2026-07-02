# Stripe Live Readiness

RP-STRIPE-LIVE-READINESS-01 adds the production live-mode readiness gate for Stripe without enabling live money movement.

## No-charge dry run

`ready_no_charge` means the live configuration is structurally ready for a future activation milestone. It does not mean ReEditPro can charge cards or process live Stripe events.

The no-charge dry run verifies:

- production app environment
- Stripe mode set to live
- owner live-mode allow flag
- manual approval flag
- approved live secret source
- live secret key, publishable key, and webhook signing secret reference names
- live webhook endpoint mode
- no test references in live config
- no raw Stripe secret values in config
- distinct secret, publishable, and webhook references
- test-mode real-call flags are not used as live approval

## Hard Live Blocks

Even when readiness returns `ready_no_charge`, these capabilities remain false:

- no live Checkout Sessions
- no live SetupIntents
- no live PaymentIntents
- no live webhook processing
- no live credit grants
- no production wallet mutation
- no production ledger writes
- no Supabase writes
- no provider, render, or export execution

The dry run is a readiness report only. It does not call Stripe, create live Stripe objects, process live webhooks, grant credits, unlock export, or mutate production persistence.

## Secret References

Live configuration stores only reference names. Raw API keys, restricted keys, publishable values, and webhook signing values must stay in the approved secret provider and must never appear in repo files, route payloads, logs, or config summaries.

Google Secret Manager is the preferred production source. Environment-variable secret source remains a typed option for controlled development, but production live readiness should use Secret Manager references.

## Rollback

If live readiness must be disabled, set Stripe billing mode back to `disabled` or `test`, remove the live allow flag, and keep live webhook endpoint mode disabled or test-only. This reverts the runtime to non-live readiness without touching wallet, ledger, checkout, or export state.

Future live activation requires a separate milestone that explicitly designs live Checkout, live webhook handling, production wallet persistence, monitoring, rollback, and operator approval.
## RP-CREDITAUDIT-01 Note

Credit beta-readiness evidence includes the Stripe live readiness gate as `ready_no_charge` support evidence only. The audit layer does not enable live Checkout Sessions, SetupIntents, PaymentIntents, live webhooks, live grants, or live Stripe calls.
