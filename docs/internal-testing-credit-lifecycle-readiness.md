# Internal Testing Credit Lifecycle Readiness

## Decision

`internal_testing_credit_lifecycle_readiness_passed_ready_for_repeated_local_internal_testing`

## Summary

This milestone makes the post-reservation credit lifecycle visible and repeatable in the internal testing lane.

The approval and credit gate answers whether expensive work is allowed to start. This lifecycle packet answers what must happen after a reserved job outcome:

- successful work spends the reserved credits;
- cancelled or blocked work releases the unused reservation;
- ReEditPro-side failed work creates a credit refund record;
- all lifecycle evidence remains mock/local until real transactional backend persistence is explicitly approved.

## Accepted Evidence

- `spendReservedCreditsMock` moves a reservation to `spent` and creates a `spend` ledger entry.
- `releaseReservedCreditsMock` moves a reservation to `released` and creates a `reservation_release` ledger entry.
- `refundCreditsForFailedJobMock` moves a reservation to `refunded`, creates a `failed_generation_refund` ledger entry, and records a completed refund record.
- The internal testing UI explains success, release, and refund paths without presenting live billing as enabled.
- The QA wrapper runs the lifecycle smoke as part of `npm run qa:internal-testing`.

## Boundaries

- No provider/model call.
- No worker dispatch.
- No media processing.
- No render/export.
- No real credit spend, wallet mutation, ledger write, Stripe call, or silent billing.
- No Supabase read/write, Storage write, signed URL, SQL, or migration.
- No external beta, real-user-media beta, paid production, or product-ready local OSS claim.

## Command

```bash
npm run smoke:internal-testing-credit-lifecycle-readiness
```

The command is also included in:

```bash
npm run qa:internal-testing
```

## Validation

- `npm run smoke:internal-testing-credit-lifecycle-readiness`
- `npm run smoke:internal-testing-approval-credit-gates`
- `npm run qa:internal-testing`
- `npm run smoke:internal-testing-qa-wrapper`
- `npm run typecheck:server`
- `npm run build`
- `git diff --check`
- `git diff --cached --check`
