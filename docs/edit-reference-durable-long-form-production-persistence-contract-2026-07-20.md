# Edit Reference durable long-form study persistence contract

Date: 2026-07-20
Status: source contract verified; runtime activation blocked
Contract: `edit-reference-production-persistence-contract-v5`

## Outcome

The Edit Reference persistence contract now defines the durable state required to study large and multi-hour reference videos without depending on a browser tab, one Node.js process, or a fixed whole-video timeout.

This change does **not** add an executable migration, remote database call, worker dispatch, provider call, or production authority. It closes the persistence-design gap and fails closed until the canonical migration chain, transaction adapter, authenticated worker dispatch, multi-replica lease recovery, and private-object read path are independently proven.

## Authority boundary

Reference study occurs before an edit has an approved Plan Review snapshot. It therefore uses one explicit authority class:

`pre_plan_edit_reference_long_form_study`

This authority may require the user to approve paid study usage and an internal-cost ceiling before execution. It must not fabricate or reuse:

- an approved edit-plan snapshot;
- an approved edit credit reservation;
- worker authority for the later editing plan;
- customer price, customer-credit mutation, or a ReEditPro service fee.

The later exact-edit planning and execution authorities remain separate and unchanged.

## Durable records

The target persistence model adds six workspace-bound, forced-RLS records:

1. `preference_long_form_study_plans` — immutable source checksum, work graph digest, rate-card snapshot, maximum authorized internal cost, and study-usage approval.
2. `preference_long_form_study_runs` — compare-and-swap run state, pause/cancel intent, and recovery generation.
3. `preference_long_form_study_work_items` — server-derived dependencies, bounded retry state, one active lease, checkpoint cursor, and per-item cost ceiling.
4. `preference_long_form_study_attempts` — append-only outcomes, failures, provider/infrastructure usage, and internal cost.
5. `preference_long_form_study_checkpoints` — append-only monotonic progress paired atomically with lease heartbeat.
6. `preference_long_form_study_work_outputs` — immutable private storage identity, generation/ETag/checksum, and output digest.

Raw media bytes, signed URLs, and provider credentials are prohibited from database records.

## Recovery and reliability

The contract requires:

- serializable work-item claim;
- exactly one active lease per work item;
- lease credentials stored only as digests;
- monotonic checkpoints;
- checkpoint and heartbeat in one transaction;
- terminal outcome and usage in one transaction;
- idempotent response association and lost-response replay;
- expired-lease recovery;
- pause, resume, cancellation, and process-restart continuation;
- bounded work-item timeouts, with no fixed timeout for the whole study;
- independent ready work continuing when unrelated work is blocked;
- immutable completed outputs.

These requirements are compatible with the shared backend transaction and worker spine, but this feature contract does not create a competing queue implementation.

## Cost boundary

Every future study plan and attempt must retain:

- an immutable rate-card snapshot;
- a maximum authorized internal cost;
- provider and infrastructure usage at attempt level;
- failed-attempt cost;
- released unused internal budget after cancellation.

Internal production cost remains separate from future customer price, future customer credits, and any ReEditPro fee.

## Verification

The focused verification is:

```text
npx tsx server/smoke/edit-reference-production-long-form-persistence-contract-smoke.ts
npx tsx server/smoke/edit-reference-production-readiness-smoke.ts
npx tsx server/smoke/edit-reference-production-application-lifecycle-smoke.ts
npx tsx server/smoke/edit-reference-production-planning-context-smoke.ts
```

Production readiness contract V2 also requires same-release live evidence for the six-table transaction shape, pre-plan authority isolation, study-usage approval and cost ceiling, serializable single-lease claims, atomic checkpoint/terminal usage, expired-lease and process-restart recovery, multi-hour full coverage, and exclusion of raw media or credentials from database state. Older generic queue evidence can no longer satisfy the long-form production gate.

The adversarial cases prove that validation rejects:

- a missing checkpoint table;
- execution without approved study usage;
- browser-side work claiming;
- an unverified production runtime flag.

## Remaining production gate

Production remains false until one canonical backend adapter proves all of the following against the approved database foundation:

- executable migration history and clean reset;
- two-user/two-workspace RLS isolation;
- durable enqueue/claim/checkpoint/complete/fail/pause/resume/cancel/recover transactions;
- authenticated worker dispatch and multi-replica lease recovery;
- generation-pinned private-object reads;
- live internal-usage reconciliation;
- browser/backend recovery after process restart;
- large and multi-hour same-source acceptance.

Until then, the existing in-process scheduler and local segmented repository remain private/local evidence only and cannot satisfy this production contract.
