# Edit Reference production readiness V3: trusted evidence admission

Date: 2026-07-21

## Outcome

The Edit Reference production-readiness contract is now V3. It cannot report
production-ready from structurally valid caller-created evidence objects.
Every gate remains blocked until one reviewed, same-release server evidence
repository admits the complete evidence set through a module-private authority.

There is intentionally no public qualification function. A later production
adapter must be introduced inside the readiness module after deployed
Auth/RLS/Storage, worker/provider recovery, same-SHA staging, and rollback
evidence exist. Caller assertions, local fixtures, type casts, browser data,
and synthetic receipts cannot add an admission to the private qualification
set.

## New mandatory preparation evidence

The canonical persistence gate now also requires proof that:

- `prepare_edit_reference_application_v1` is server owned;
- the reference, approved DNA, passed QA, and exact-target package are re-read;
- a browser application record is never accepted as authority.

The atomic application lifecycle gate now also requires proof that:

- preparation creates an unconnected application without invalidating a plan;
- a lost preparation response is recovered under the exact idempotency key;
- the prepared application authority is revalidated by the atomic Apply.

These assertions bind the library/study/DNA flow to the exact named-edit
apply/replace/remove lifecycle. They do not activate the production runtime.

## Adversarial verification

`server/smoke/edit-reference-production-readiness-smoke.ts` proves:

- no evidence remains blocked;
- evidence missing any new preparation assertion remains blocked;
- a structurally complete caller-created evidence set remains blocked;
- a forged admission containing all production flags remains blocked;
- deployment-lineage mismatch, evidence reuse, incomplete assertions, and an
  invalid release identity remain blocked;
- local or synthetic evidence is never accepted as live production evidence.

## Current boundary

This is a source-only release-safety improvement. It performs no remote
Supabase, provider, cloud, billing, deployment, public-delivery, or customer
operation. Production readiness remains false until the externally gated live
evidence and trusted admission adapter are implemented and independently
verified.
