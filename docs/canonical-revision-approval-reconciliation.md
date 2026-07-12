# Canonical Revision Approval Reconciliation

Status: private single-host synthetic reservation reconciliation evidence

The canonical approval authority can now approve revision-bound plan v2 by reconciling the unused portion of plan v1's synthetic private reservation and reserving plan v2's newly approved maximum in one checksum-protected authority mutation.

This is not customer credit charging, billing, settlement, Stripe, or a production wallet.

## Atomic transaction

Revision approval revalidates the exact review decision, revision handoff, plan-v2 hash, fresh estimate hash, planning-input authority, source authority, and current authority revision. Inside one mutation it then:

1. loads the prior approved snapshot, plan, estimate, and active synthetic reservation;
2. computes only the unused prior amount: reserved minus spent, released, and refunded;
3. proves the wallet can fund plan v2 after that exact release;
4. releases the unused prior synthetic amount to the private test wallet;
5. marks the prior plan/estimate superseded and prior reservation released;
6. reserves plan v2's approved maximum;
7. freezes a new immutable snapshot and approved asset/source manifests;
8. derives plan-v2 jobs from approved work items;
9. appends release and reserve ledger/event evidence;
10. persists one idempotent approval response.

Any validation or insufficient-credit failure leaves the aggregate unchanged because the release and reserve occur inside the same locked mutation.

## Immutability and conservation

The prior snapshot bytes, approved work items, and derived jobs remain unchanged. Only policy-approved status/audit fields and the unused reservation balance transition. Wallet conservation remains:

`funded = available + reserved + spent`

An idempotent replay creates no second release, reservation, snapshot, approval, ledger movement, or job set.

## Current executable evidence

The canonical lifecycle smoke proves:

- plan v2 approval creates snapshot version 2 and a fresh reservation;
- the response identifies the prior/new snapshots and reservations and exact released/reserved credit amounts;
- the prior snapshot/work items/jobs remain hash-identical;
- the prior plan/estimate become superseded and prior reservation becomes released;
- wallet conservation holds;
- reservation count increases by exactly one and jobs increase by exactly plan v2's approved work-item count;
- execution-package count does not change at approval;
- approval replay leaves ledger count unchanged;
- `customerWalletMutation` and `billingExecuted` remain false.

## Boundaries

This milestone uses only the repository's synthetic private-internal test wallet. It does not spend customer credits, charge a wallet, add ReeditPro fees, settle tool cost, call Stripe, write Supabase, execute plan-v2 jobs, render a revised review, restore superseded-review download history, publish an artifact, or authorize beta/production.

The next canonical gate is plan-v2 execution through its derived work graph, followed by a second private review and revision-history/recovery evidence.

## Verification

- `npm run typecheck:server`
- `npm run lint`
- `npm run smoke:canonical-private-tool-dispatch`
- `npm run smoke:proven-tool-identities`
- `npm run qa:internal-pipeline`
- `npm run check:frontend-boundary`
