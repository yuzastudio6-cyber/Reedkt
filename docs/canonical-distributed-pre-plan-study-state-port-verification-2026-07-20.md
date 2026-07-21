# Canonical Distributed Pre-Plan Study State Port Verification

Date: 2026-07-20

Verdict: `CANONICAL_DISTRIBUTED_PRE_PLAN_STUDY_STATE_PORT_SOURCE_CONTRACT_ACCEPTED_LIVE_RUNTIME_BLOCKED`

## Purpose

This bounded backend slice maps the Edit Reference persistence contract v5 authority
`pre_plan_edit_reference_long_form_study` onto one database-neutral transaction and lease
contract. It does not reuse or fabricate the later approved edit-plan snapshot or credit
reservation required by the edit execution pipeline.

The contract exists because a reference study may run for minutes or hours before an edit
plan exists. Reusing the approved-package queue unchanged would incorrectly claim that a
pre-plan study already had an approved edit snapshot and customer credit reservation.

## Frozen source seam

- `server/distributed-pre-plan-study/canonical-distributed-pre-plan-study-state-port.ts`
- `server/distributed-pre-plan-study/in-memory-canonical-distributed-pre-plan-study-fixture.ts`
- `server/distributed-pre-plan-study/canonical-distributed-pre-plan-study-state-conformance.ts`
- `server/distributed-pre-plan-study/index.ts`
- `server/smoke/canonical-distributed-pre-plan-study-state-port-smoke.ts`

The port defines:

- one immutable tenant/reference/study/source/plan identity and work-graph seed;
- one server-derived dependency-aware work-item claim;
- one active attempt lease with only its SHA-256 credential digest persisted;
- atomic heartbeat plus monotonic private checkpoint commit;
- atomic terminal private-output plus provider/infrastructure internal-cost commit;
- exact idempotency replay and changed-request collision rejection;
- durable pause, resume, cancellation, lease-loss recovery, and checkpoint resumption;
- deterministic timeout retry only after terminal reconciliation;
- provider/model unknown-outcome blocking before any resubmission;
- no browser claim, automatic retry, fixed whole-study timeout, or browser-session dependency.

Attempt cost evidence binds the exact attempt ID, immutable attempt-start hash, start and
finish timestamps, approved study-usage estimate, internal budget, provider usage and rate
card, infrastructure usage and rate card, and retained failed/unknown attempt cost. Customer
price, customer credits, service fee, wallet, billing, and settlement are not part of this
authority.

Private outputs require an immutable object identity, checksum, lineage, bounded metadata,
and create-only readback proof. Provider URLs and local paths are explicitly excluded.

## Conformance evidence

Command:

```sh
npx tsx server/smoke/canonical-distributed-pre-plan-study-state-port-smoke.ts
```

The source fixture currently proves 17 adversarial checks:

1. Process branding and forward live-release gate fail closed.
2. No approved snapshot, credit reservation, or commercial authority is fabricated.
3. Concurrent enqueue produces one commit and one exact replay.
4. An idempotency-key collision with a changed request is rejected.
5. A dependent visual work item cannot be claimed before its dependency.
6. One server-selected claim returns a replayable transient, digest-only lease.
7. A wrong plaintext lease credential is fenced.
8. Heartbeat and checkpoint commit atomically and monotonically.
9. Terminal cost must bind the exact attempt and execution window.
10. Private output and separate internal cost commit in one terminal transaction.
11. A wrong controller cannot pause, cancel, or recover the study.
12. Pause and resume preserve the durable run authority.
13. A provider unknown outcome retains cost and blocks resubmission.
14. An expired deterministic lease is reconciled once before explicit checkpoint resume.
15. An expired provider lease retains provisional cost and requires reconciliation before retry.
16. Cancellation preserves the active lease until one terminal cost receipt.
17. The fixture persists no raw media, signed URL, provider credential, local path, or live claim.

The conformance evidence is `database_neutral_edit_reference_pre_plan_study_contract_fixture`.
It is not database, multi-replica, worker-dispatch, provider, private-object, or production
evidence.

## Honest boundary

The in-memory adapter is a contract fixture only. The process-branded v1 port cannot promote
itself to production even if a caller forges live-looking descriptor flags. No live adapter
factory exists.

Production remains blocked until a forward reviewed implementation provides same-release
evidence for all of the following:

- canonical six-table durable persistence and composite tenant isolation;
- serializable Postgres claim, one-lease enforcement, and durable response replay;
- multi-replica concurrency, process-restart, lost-response, and expired-lease recovery;
- authenticated worker dispatch and server-derived resource admission;
- create-only private-object writes and checksum readback;
- attempt-level provider and infrastructure metering against immutable rate cards;
- provider unknown-outcome reconciliation;
- browser-independent multi-hour execution with no fixed whole-study timeout;
- deployed Auth/RLS/private storage and same-SHA browser/backend acceptance.

No SQL, migration, Supabase call, provider call, Google Cloud mutation, billing action,
customer credit mutation, deployment, public delivery, or production-ready claim was made
by this slice.
