# Canonical Pre-Execution Cancellation

Status: authenticated local/private pre-execution cancellation evidence

The canonical cancellation service closes one narrow recovery gap: an authenticated editor can cancel an approved snapshot before dispatch consumption or worker execution begins. The restart-safe saga terminally fences issued-but-unconsumed dispatch and never-started lease authority before atomically releasing the entire unused synthetic reservation, while preserving the approved snapshot, approved work items, derived jobs, execution package, and audit history.

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
2. the plan and estimate remain approved, or the same exact cancellation owns the persisted `cancellation_pending` state;
3. the reservation is still `reserved` and has zero spend, release, and refund activity;
4. the entire reservation is therefore unused and releasable;
5. every dispatch grant is unconsumed and every lease execution fence is `not_started`;
6. the caller's expected authority revision, snapshot hash, reservation identity, and idempotency identity match, or the same exact request is resuming its persisted cancellation saga.

After terminal dispatch/lease fencing, finalization performs one conservation-safe local/private authority transaction:

- returns the unused synthetic credits from reserved to available balance;
- records a `cancel` ledger entry;
- records a `cancelled` reservation event;
- records an append-only cancellation audit event;
- transitions the approved plan and estimate status to `cancelled` without rewriting their content hashes;
- marks the synthetic reservation `cancelled` with its released amount;
- stores an exact idempotency replay response.

The approved snapshot is not deleted or rewritten. Plan and estimate content remain immutable while their lifecycle status becomes `cancelled`. Approved work items, derived jobs, and any already-created execution-package record remain immutable evidence. Planning-input locks reopen for a new plan version, while package reads or later package creation fail because the snapshot is no longer active approved/funded authority.

## Fail-closed boundary

An execution package may already exist. Leases may exist only while every matching execution fence remains `not_started`. Dispatch records may exist only while none has been consumed. Cancellation, lease claim, dispatch authorization/consumption, and worker execution-fence begin/complete transitions use one shared single-host execution-domain fence. The service first persists `cancellation_pending`, then terminally revokes or expires issued-but-unconsumed dispatch grants, releases or expires active never-started leases, and only then releases the unused synthetic reservation and finalizes cancellation. Package, dispatch, and lease records remain immutable audit evidence.

If a dispatch grant was consumed, cancellation returns `canonical_consumed_dispatch_cancellation_and_compensation`. If any lease execution fence started, it returns `canonical_started_execution_cancellation_and_compensation`. It does not cancel consumed dispatches, started attempts, committed artifacts, QA, or reviews. Those stages require a later compensation state machine and durable distributed worker fencing.

The focused smoke proves authentication, exact reservation conservation, snapshot/job/package/dispatch/lease preservation, replay safety, idempotency conflict, post-cancel package denial, unconsumed dispatch revocation, never-started lease release, dispatch/claim/cancellation serialization, worker execution begin/complete serialization and replay, consumed-dispatch denial, and independent started-execution denial.

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
