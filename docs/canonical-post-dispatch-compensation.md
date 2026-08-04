# Canonical Post-Dispatch Compensation

Status: authenticated local/private quiescent compensation evidence

This authority closes the bounded cancellation gap after canonical dispatch is consumed or a private/internal execution fence completes. It preserves the immutable execution trail, terminally fences remaining unconsumed grants and active quiescent leases, and releases only a fully unused synthetic private-internal reservation.

## Authenticated route

`POST /v1/approved-snapshots/:snapshotId/compensated-cancel`

The strict request requires authenticated workspace write access, the current canonical authority revision, exact snapshot hash, exact reservation ID, the fixed `user_cancelled_after_dispatch` reason, and an Idempotency-Key.

The route is local/private internal-test authority only. It is not a customer cancellation, billing, refund, or production settlement endpoint.

## Accepted states

The service accepts only quiescent post-dispatch states:

1. at least one immutable consumed dispatch exists while every lease fence is `not_started`;
2. at least one lease execution fence is immutable `completed` and every such lease has its create-only canonical job-adapter completion record; or
3. both conditions exist; or
4. one or more leases have an immutable `failed` fence, with no active `started` fence.

These map to `consumed_before_start`, `failed_execution`, `completed_execution`, and `mixed_quiescent` response modes. A request with no consumed dispatch and no failed or completed fence must use the pre-execution cancellation route.

An immutable `failed` execution fence is also quiescent and maps to `failed_execution` when no completed fence exists, or `mixed_quiescent` when combined with completed evidence. It is counted separately from never-started and completed fences. Failed-fence evidence, partial artifact/QA records, and any failed attempt-level internal production-cost evidence remain preserved; no failed attempt is rewritten as completed.

Any `started` execution fence fails closed with `canonical_inflight_execution_quiescence_and_compensation` before edit authority, wallet, dispatch, lease, artifact, or QA state changes. A `completed` fence without its final adapter-completion record fails behind `canonical_adapter_completion_quiescence_evidence`; this prevents compensation during the reconciliation or attempt-cost commit window. This single-host boundary does not claim distributed worker quiescence.

## Restart-safe compensation saga

The service first acquires the same package-level lock used by the private work-graph orchestrator and then acquires the shared execution-domain lock. That lock order prevents both work-graph interleaving and package/execution-lock deadlock. Under those locks, the service:

1. validates exact snapshot, plan, estimate, approval, reservation, derived-job, and execution-package lineage;
2. verifies the reservation remains synthetic, fully unused, and unspent;
3. verifies consumed/completed evidence and rejects any in-flight fence;
4. loads every completed job's create-only adapter-completion record, verifies its final artifact/QA/reconciliation lineage, and hashes both evidence sets without modifying them;
5. persists an exact-request-owned `cancellation_pending` fence;
6. preserves consumed grants and terminally revokes or expires only remaining authorized grants;
7. preserves execution-fence state and releases or expires only active `not_started` or `completed` leases;
8. releases the unused synthetic reserved credits back to the synthetic available balance;
9. appends ledger, reservation-event, audit, and exact idempotency replay evidence; and
10. transitions plan and estimate lifecycle status to `cancelled` without rewriting approved content.

The saga can resume after a local process interruption because the request hash and Idempotency-Key hash own the persisted pending state. Exact replay returns the original response; a changed request under the same key conflicts.

## Preserved evidence

The service never deletes or rewrites:

- the approved snapshot or approved work items;
- derived jobs or execution package;
- consumed dispatch records;
- completed execution fences;
- create-only canonical job-adapter completion records;
- committed private artifacts;
- artifact QA evaluations and reconciliation decisions;
- content-addressed evidence blobs;
- private attempt-level internal-cost evidence; or
- prior audit and idempotency history.

The response reports scoped artifact/QA/reconciliation, adapter-completion, and adapter-attested attempt-cost counts plus content hashes over the preserved execution evidence sets. Attempt-level internal production cost remains separate from synthetic credits and any future customer price.

## Non-authority

This slice does not mutate customer wallets or customer credits, charge or refund money, call Stripe, write Supabase, activate providers, start tools, render, deliver publicly, deploy, or grant external-beta or production authority. A reservation with any actual spend fails closed behind `canonical_spent_credit_settlement_and_refund_policy`.

## Verification

- `npm run typecheck:server`
- `npm run lint`
- `npm run smoke:edit-planning-authority`
- `npm run smoke:canonical-private-tool-dispatch`
- `npm run smoke:proven-tool-identities`
- `npm run qa:internal-pipeline`
- `npm run check:frontend-boundary`
