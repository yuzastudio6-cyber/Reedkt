# Canonical Pre-Execution Cancellation

Status: authenticated local/private pre-execution cancellation evidence

The canonical cancellation service closes one narrow recovery gap: an authenticated editor can cancel an approved snapshot before any execution package exists. The operation atomically releases the entire unused synthetic reservation while preserving the approved snapshot, approved work items, derived jobs, and audit history.

## Authenticated route

`POST /v1/approved-snapshots/:snapshotId/cancel`

The strict request requires:

- workspace identity;
- the current canonical authority revision;
- the exact immutable snapshot hash;
- the exact reservation identity;
- the fixed `user_cancelled_before_execution` reason;
- an Idempotency-Key.

The route is available only in the explicit local/private internal-test runtime and requires authenticated workspace editor access.

## Atomic invariants

Cancellation succeeds only when:

1. snapshot, plan, estimate, approval, reservation, and derived-job lineage are complete and exact;
2. the plan and estimate remain approved;
3. the reservation is still `reserved` and has zero spend, release, and refund activity;
4. the entire reservation is therefore unused and releasable;
5. no execution package exists for the snapshot;
6. the caller's expected authority revision, snapshot hash, reservation identity, and idempotency identity match.

The mutation performs one conservation-safe local/private transaction:

- returns the unused synthetic credits from reserved to available balance;
- records a `cancel` ledger entry;
- records a `cancelled` reservation event;
- records an append-only cancellation audit event;
- transitions the approved plan and estimate status to `cancelled` without rewriting their content hashes;
- marks the synthetic reservation `cancelled` with its released amount;
- stores an exact idempotency replay response.

The approved snapshot is not deleted or rewritten. Plan and estimate content remain immutable while their lifecycle status becomes `cancelled`. Approved work items, derived jobs, and any already-created execution-package record remain immutable evidence. Planning-input locks reopen for a new plan version, while package reads or later package creation fail because the snapshot is no longer active approved/funded authority.

## Fail-closed boundary

An execution package may already exist only when no lease or dispatch record has ever existed for its snapshot. Cancellation and lease claim use one shared single-host execution-domain fence, preventing a claim from racing between the absence check and the authority transaction. The package record is preserved as audit evidence.

If any lease or dispatch authority exists, cancellation returns the `canonical_post_lease_cancellation_and_worker_fencing` gate. It does not cancel leases, dispatches, attempts, workers, artifacts, QA, or reviews. Those stages require a later coordinated in-flight cancellation state machine and durable worker fencing.

The focused smoke proves authentication, exact reservation conservation, snapshot/job/package preservation, replay safety, idempotency conflict, post-cancel package denial, packaged-but-never-leased cancellation, execution-domain serialization, and post-lease cancellation denial.

## Non-authority

This is a synthetic private-internal wallet mutation only. It does not mutate customer credits or a customer wallet, charge or refund money, call Stripe, write Supabase, call providers, execute tools, render, deliver publicly, deploy, or grant production authority.

## Verification

- `npm run typecheck:server`
- `npm run lint`
- `npm run smoke:edit-planning-authority`
- `npm run smoke:canonical-private-tool-dispatch`
- `npm run smoke:proven-tool-identities`
- `npm run qa:internal-pipeline`
- `npm run check:frontend-boundary`
