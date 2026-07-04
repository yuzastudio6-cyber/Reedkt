# Project Edit Brief Internal Persistence Backend Skeleton

## Decision

`project_edit_brief_internal_persistence_backend_skeleton_passed_ready_for_internal_route_integration`

## Scope

RP-EDITBRIEF-17 adds the internal backend skeleton for Project Edit Brief persistence. It is the seam future route handlers should use for internal testing. It does not enable production routes or live Supabase.

The skeleton has two internal modes:

- `mock_internal`: uses the existing `MockProjectEditBriefRepository` for internal testing writes.
- `supabase_disabled_internal`: uses the existing disabled Supabase repository and fails closed until real Supabase gates pass.

## Write Policy

Every mutating Project Edit Brief operation requires:

- an idempotency key;
- an audit event type.

If an operation supplies any expensive-work approval field, it must supply all three:

- `approvedPlanSnapshotId`;
- `creditEstimateId`;
- `creditReservationId`.

This keeps internal testing aligned with the future production contract without enabling real worker/provider/render/credit execution.

## Boundary Confirmations

- Live Supabase remains disabled.
- Production routes remain disabled.
- External beta and paid production remain false.
- Providers, media processing, workers, render/export, uploads, and credits remain blocked.

## Next Milestone

`RP-EDITBRIEF-18 - Internal Route Integration`
