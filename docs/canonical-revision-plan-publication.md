# Canonical Revision Plan Publication

Status: private single-host replacement-plan publication evidence

The canonical revision publisher consumes one completed private-review revision handoff to create the next immutable plan version and a fresh credit estimate. It does not approve, reserve credits for, execute, or render the replacement plan.

## Request boundary

The existing canonical plan-publication route accepts an optional strict `revisionAuthority` only for an edit session that already has an approved plan. The authority contains identities and hashes only:

- review assembly and review decision IDs;
- revision request ID;
- decision-manifest SHA-256;
- prior approved snapshot, plan, and plan version;
- revision-intent SHA-256.

The replacement plan's compiled intent must carry the same revision-intent hash, prior snapshot ID, and review decision ID. Caller-authored paths, URLs, artifacts, jobs, reservations, execution instructions, and delivery authority remain outside the route.

## Server-owned publication chain

Before publication, the planning authority:

1. reopens the completed review decision and verifies its create-only manifest;
2. requires a `request_revision` decision and exact project/edit-session lineage;
3. matches every decision, snapshot, plan-version, manifest, revision-request, and revision-intent identity;
4. rejects a stale or previously consumed review decision;
5. stores a credential-free revision-authority component in the content-addressed plan manifest;
6. includes that component in the replacement plan hash;
7. requires the new plan version to be exactly the prior approved version plus one;
8. creates a new presented estimate without mutating the prior approval or reservation.

The prior approved plan remains approved while plan v2 is presented. It is not superseded merely because a replacement draft was published.

## Approval boundary

Approval of a revision-authored plan now atomically releases only the unused prior synthetic reservation and reserves plan v2's newly approved maximum. It freezes snapshot v2 and derives its jobs while keeping customer wallet and billing authority false. Revised job execution remains a later gate.

## Current executable evidence

The canonical lifecycle smoke proves:

- a mismatched decision manifest cannot publish plan v2;
- the exact revision handoff publishes plan version 2 with a fresh presented estimate;
- identical publication replays without consuming the handoff twice;
- approval atomically reconciles the prior/new synthetic reservations and derives snapshot-v2 jobs;
- the prior snapshot/plan/estimate/reservation/work-item/job/package slice stays hash-identical;
- wallet hash, reservation count, job count, and execution-package count remain unchanged.

## Boundaries

Replacement planning, synthetic fresh approval, revised work-graph execution, a second private review, superseded-review history access, and fully unused pre-lease reservation cancellation are now proven for local/private scope. Post-lease cancellation, broader recovery, real-user browser handoff, providers, Supabase, billing, public delivery, and production remain gated.

## Verification

- `npm run typecheck:server`
- `npm run lint`
- `npm run smoke:canonical-private-tool-dispatch`
- `npm run smoke:proven-tool-identities`
- `npm run qa:internal-pipeline`
- `npm run check:frontend-boundary`
