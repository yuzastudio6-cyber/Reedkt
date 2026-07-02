# Credit UI Lifecycle Cards

RP-CREDITUI-01 adds the first user-facing mock-safe credit lifecycle UI. The cards live on the existing wallet page and use fixture data only.

## Covered Lifecycle

- wallet balance, including available, reserved, spent, refunded, purchased, weekly bonus, and outstanding credits
- edit credit estimate range and required hold
- max-estimate reservation success and insufficient-credit copy
- runtime pause when a revised credit estimate is needed
- revised-credit action choices: Approve & Continue, Choose Lower-Cost Option, and Cancel Extra Work
- final settlement receipt with actual tool cost, ReEditPro service/edit fee, final charge, returned credits, and absorbed overage
- export credit gate, including Export ready and top-up-required states
- mock/test credit top-up packs
- Stripe disabled/test/live readiness display

## Boundaries

The UI is display-only. It does not call credit routes, reserve credits, spend credits, release credits, refund credits, unlock export, call Stripe, create Checkout Sessions, create SetupIntents, create PaymentIntents, process live webhooks, grant live credits, call providers, run workers, render/export media, write Supabase data, mutate production wallets, or write ledgers.

Stripe secret keys and webhook secrets are never shown. The Stripe card displays mode/readiness and safe copy only; live readiness does not enable payment processing.

## Implementation Notes

The adapter in `src/lib/credit-ui-adapter.ts` transforms existing credit and Stripe payload shapes into browser-safe view models. Components under `src/components/credit/` render those view models and import only browser-safe code.

The first integration surface is `/wallet`. Browser fetch/client helpers for the `/v1` credit and Stripe routes are deferred to a future UI-action milestone.
