# RP-EXTERNALBETA-01 External Beta Credit Launch Gate

RP-EXTERNALBETA-01 adds the final mock/test-safe launch gate for the external-beta credit lifecycle. It does not enable live billing, live Stripe payments, production persistence, provider execution, render/export, checkout/top-up automation, settlement execution, export unlock, or package-lock changes.

## Ready Scope

- Mock credit lifecycle: estimate range, max-estimate reservation, runtime guard, revised-credit actions, final settlement, export lock, mock top-up, wallet UI, and support audit evidence.
- Stripe test-mode beta: customer/setup/checkout/webhook contracts remain test-only, idempotent, and grant mock purchased credits only after verified test checkout completion.
- Live readiness: live Stripe configuration can report `ready_no_charge`, but live Checkout Sessions, SetupIntents, PaymentIntents, webhooks, credit grants, wallet mutation, ledger writes, and payment processing remain disabled.

## Launch Gate Statuses

- `ready_for_mock_external_beta`: mock credit scenarios and required smokes pass.
- `ready_for_stripe_testmode_beta`: mock scenarios plus Stripe test-mode checkout/webhook evidence pass.
- `blocked_for_live_external_beta`: live payment activation remains deferred even when no-charge live readiness passes.
- `blocked`: required smoke failure, package-lock/dependency drift, raw secret exposure, unsafe live behavior, incomplete audit evidence, or broken route/UI boundaries.

## Scenario Matrix

The launch gate covers Normal, Premium, and Ultra Premium edit paths; insufficient credits before reservation; projected runtime overage; approve/lower-cost/cancel revised-credit choices; unused-credit return; absorbed overage; approved-but-unfunded export lock; mock top-up; Stripe test-mode checkout grant; no-charge live readiness; wallet UI display; and support audit trace.

Ultra Premium uses deterministic premium-generation fixture evidence. Real Motion live execution is intentionally not required by this milestone.

## Safety Guarantees

- Max-estimate hold is required before paid work.
- Tool-cost events keep `serviceFeeIncluded = false`.
- ReEditPro service/edit fee stays separate from tool cost.
- User approval is required before projected overage continues.
- ReEditPro absorbs unapproved overage.
- Export is blocked only for `requires_top_up_before_export`.
- Top-up does not automatically retry reservation, resume paid work, or unlock export.
- Reports and routes expose no raw Stripe secrets, webhook payloads, card numbers, CVC, or CVV.

## Operator Checklist

Run the required credit, Stripe, UI, audit, and `smoke:external-beta-credit` smokes, then build, lint, and frontend-boundary checks. Review the report from `GET /v1/credit-audit/beta-readiness`; it returns the existing audit readiness report plus `launchGateReport`.

Known limitations remain: mock/in-memory stores, production persistence deferred, live Stripe activation deferred, production admin/support authorization deferred beyond `requireAuth`, and optional QA/Playwright checks only when available.
