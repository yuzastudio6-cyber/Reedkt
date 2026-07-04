# Internal Testing Approval And Credit Gates

## Decision

`internal_testing_approval_credit_gates_passed_ready_for_repeated_local_internal_testing`

## Summary

This milestone makes the approved plan snapshot and credit gate contract visible and repeatable in the internal testing lane.

Internal testers can now see that expensive ReEditPro work is blocked until the flow has all three execution references:

- `approvedPlanSnapshotId`
- `creditEstimateId`
- `creditReservationId`

The smoke test exercises the existing mock credit gate, approved snapshot worker validation, and worker claim dry-run gates. It accepts mock/local evidence only and does not create live billing, worker dispatch, provider calls, media processing, render/export, Supabase writes, external beta, paid production, or product-ready claims.

## Accepted Evidence

- Approved edit plan plus approved credit estimate plus credit reservation passes the mock credit gate.
- Missing credit reservation blocks expensive work.
- Approved snapshot worker validation requires `creditReservationId` when worker execution requires reserved credits.
- Expensive worker dry-run blocks when `approvedPlanSnapshotId` and `creditReservationId` are missing.
- Expensive worker dry-run passes gate validation when approved snapshot and reservation IDs are present.

## Boundaries

- No provider/model call.
- No worker dispatch.
- No media processing.
- No render/export.
- No credit spend, ledger write, Stripe call, or silent billing.
- No Supabase read/write, Storage write, signed URL, SQL, or migration.
- No external beta, real-user-media beta, paid production, or product-ready local OSS claim.

## Command

```bash
npm run smoke:internal-testing-approval-credit-gates
```

The command is also included in:

```bash
npm run qa:internal-testing
```

## Validation

- `npm run smoke:internal-testing-approval-credit-gates`
- `npm run qa:internal-testing`
- `npm run smoke:internal-testing-qa-wrapper`
- `npm run typecheck:server`
- `npm run build`
- `git diff --check`
- `git diff --cached --check`
