# RP-CREDITAUDIT-01 Credit Audit Support Timeline

RP-CREDITAUDIT-01 adds a mock-safe support/admin audit layer for the external-beta credit lifecycle. It aggregates existing mock records into a read-only timeline, support receipt, Stripe billing trace, and beta-readiness evidence report.

## What Support Can Trace

- Estimate to approval: minimum, expected, maximum, and required hold credits.
- Reservation: max-estimate hold, spent/released/refunded fields, and wallet balance context.
- Runtime pauses: projected-overage revised-credit actions and user resolution state.
- Tool costs: billable tool events, non-billable absorbed/internal cost, and `serviceFeeIncluded = false`.
- Settlement: actual tool cost, separate ReEditPro service/edit fee, final charge, returned credits, absorbed overage, and outstanding credits.
- Export lock: approved-but-unfunded export readiness only; no export unlock.
- Top-up and grants: mock/test purchased credits and linked grant/payment IDs.
- Stripe trace: safe customer/setup/checkout/webhook/grant references without raw payloads, card data, or secrets.

## Routes

- `GET /v1/credit-audit/projects/:projectId/timeline`
- `GET /v1/credit-audit/wallets/:creditWalletId/timeline`
- `GET /v1/credit-audit/settlements/:creditSettlementId/receipt`
- `GET /v1/credit-audit/wallets/:creditWalletId/stripe-trace`
- `GET /v1/credit-audit/beta-readiness`

Routes use the existing `requireAuth` gate and are mock/internal support-only. Production admin/support authorization is deferred because no dedicated admin middleware exists in the current route surface.

## Safety

The audit layer is read-only. It does not reserve, spend, release, refund, settle, top up, unlock export, call Stripe, call providers, run workers, render/export media, write Supabase data, mutate production wallets, or write ledgers.

Support payloads redact keys such as `secret`, `apiKey`, `token`, `authorization`, `clientSecret`, `cardNumber`, `cvc`, `privateKey`, and `service_role`. Redaction preserves useful key presence with `[redacted]` when safe for support review.

## Validation

Use `npm run smoke:credit-audit` for focused coverage. The smoke seeds isolated mock stores and proves timeline coverage, support receipt answers, Stripe trace redaction, beta-readiness evidence, route read-only shape, and no live side effects.

## RP-EXTERNALBETA-01 Note

The beta-readiness route now returns `launchGateReport` beside the existing audit readiness report. The launch gate reuses audit evidence for the external-beta credit scenario matrix and keeps production admin/support authorization deferred beyond `requireAuth`.
