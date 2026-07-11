# Canonical V2 Approval, Credit, Job, And Lease Security Review

Status: `security_review_rejected_not_executable`

This review covers `database/canonical-v2-review-only/003_approval_credit_execution_authority.canonical-v2.draft.sql` and `004_jobs_worker_leases.canonical-v2.draft.sql`.

The tenant-lineage, forced-RLS, service-only RPC, composite foreign-key, and hashed lease-token foundations are useful. They are not sufficient to authorize production execution. The two drafts must not be copied into active migration history, applied to Supabase, or wired into the runtime in their current form.

## Promotion-Blocking Findings

1. Approval authority accepts caller-supplied plan, estimate, snapshot, hashes, and credit amounts instead of deriving them from locked canonical records.
2. Job creation accepts caller-supplied job type and execution input instead of deriving one immutable approved work item from the snapshot.
3. Credit reservations are not funded by a locked wallet/append-only ledger and have no complete conservation-safe spend, release, and refund state machine.
4. Reservation lifecycle and worker claim/heartbeat/release do not share one row-lock order, leaving time-of-check/time-of-use races.
5. Worker completion does not revalidate and settle the exact credit authority in the same transaction.
6. Claim and release are not safely replayable after a committed response is lost.
7. Job idempotency is evaluated after mutable reservation checks and trusts a caller-supplied hash.
8. Heartbeats are not capped by an approved maximum attempt deadline.
9. An expired final attempt can leave a job stuck in `retrying`.
10. A job can be scheduled after its reservation expires.
11. User-readable audit events expose exact worker service principals.
12. Snapshot, execution, event, and result JSON are insufficiently bounded and do not reject secret-like keys.
13. Retry and scheduling policy are not part of the immutable job contract.
14. `pgcrypto` schema assumptions are not safe for an upgrade where the extension is already installed elsewhere.
15. The static verifier does not prove these promotion-critical invariants or execute the SQL in disposable PostgreSQL.

## Required Replacement Contract

The replacement canonical authority must:

- persist backend-created, immutable plan versions and itemized credit estimates;
- record explicit user approval against the exact current plan and estimate;
- verify confirmed output frame, source order/cleanup, timing, trim/meaning, QA, and supersession gates;
- compute snapshot and request hashes from canonical rows in the database;
- copy an approved normalized work graph into immutable approved work items;
- fund reservations by atomically locking a workspace wallet and appending ledger evidence;
- enforce conservation across reserve, spend, release, refund, expiration, and cancellation under concurrency;
- create jobs only from an approved work-item ID and derive input, route, retries, fallback, schedule, and attempt deadline;
- use one reservation-first lock order for job creation, claim, heartbeat, release, and credit lifecycle RPCs;
- use a caller-retained 256-bit claim capability or equally recoverable secure protocol so response-loss replay is safe;
- persist idempotent terminal outcomes and return the original result on an exact replay;
- keep service identity in backend-only operational audit records and expose only sanitized worker-class state to users;
- enforce JSON byte ceilings and forbidden-key checks;
- pass clean-install, upgrade, RLS, cross-tenant, concurrency, token, expiry, response-loss, ledger-conservation, and negative payload tests in an isolated disposable PostgreSQL/Supabase environment.

## Current Runtime Decision

Production worker execution remains fail-closed at `canonical_worker_claim_rpc`. Local/private testing, planning, approval demonstrations, and bounded internal media execution remain available under their existing explicit local-only gates. This document does not authorize SQL application, production provider calls, billing mutation, deployment, or release.
