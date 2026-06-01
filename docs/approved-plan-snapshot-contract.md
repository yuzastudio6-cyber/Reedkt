# Approved Plan Snapshot Contract

Approved plan snapshots are the immutable worker execution contract. Workers execute approved snapshots, not raw chat, mutable plan drafts, or frontend state.

## Contract Principle

- Chat is UX input.
- Planning records are editable until approval.
- Approval freezes the worker execution record.
- Expensive work remains blocked until approved plan, approved credit estimate, active reservation, idempotency, and approved snapshot gates pass.

## Canonical Record Chain

```text
project
-> edit_session
-> edit_plan_versions
-> credit_estimates
-> approval_records
-> credit_reservations
-> approved_plan_snapshots
-> future jobs/workers/providers/renders
```

Prompt 5 implements only the approved snapshot service boundary. It does not create jobs or start future execution.

## Required Snapshot Inputs

- `workspaceId`
- `projectId`
- `editPlanId` route compatibility identifier
- `editSessionId`
- `editPlanVersionId`
- `approvalRecordId`
- `creditEstimateId`
- `creditReservationId`
- `snapshotJson`
- `planHash`
- `creditHash`
- `sourceSequenceHash`
- `timingHash`
- `Idempotency-Key` for creation

## Canonical Gate Checks

| Gate | Required condition |
| --- | --- |
| AuthGate | Authenticated user context exists. |
| WorkspaceGate | Project belongs to requested workspace. |
| ProjectAccessGate | User has project access through workspace membership. |
| IdempotencyGate | Mutation request has `Idempotency-Key`. |
| PlanApprovalGate | `edit_plan_versions` row is approved and scoped to project/session. |
| CreditEstimateApprovalGate | `credit_estimates` row is approved or accepted and scoped to the plan version. |
| ApprovalRecordGate | `approval_records` row matches project, session, plan version, estimate, and approver. |
| CreditReservationGate | `credit_reservations` row is active/reserved/non-expired and scoped to workspace/project/estimate. |
| SnapshotJsonSafetyGate | Snapshot JSON contains no secrets, signed URLs, provider keys, service-role data, credentials, or raw chat execution source. |
| TimingValidationGate | Snapshot contains frozen timing context and `timingHash`. |
| QABlockerGate | Snapshot has no blocking QA issue list. |
| StorageObjectGate | Declared storage object record IDs exist in the workspace/project boundary. |
| ToolRuntimeReadinessGate | Tool execution remains future/blocked. |
| ProviderReadinessGate | Provider execution remains future/blocked. |

## Immutability Rules

- `approved_plan_snapshots.snapshot_json` is treated as immutable.
- Material user revisions require a new plan version and a new approved snapshot.
- Future SQL hardening should prevent normal users from inserting, updating, or deleting approved snapshots directly.
- Future status updates must be narrow, audited, and never rewrite execution content.

## Snapshot Hash

The service computes a deterministic SHA-256 hash over stable JSON with service-added integrity metadata. The stored snapshot includes:

- `integrity.contractVersion`
- `integrity.approvalRecordId`
- `integrity.editPlanId`
- `integrity.editPlanVersionId`
- `integrity.creditEstimateId`
- `integrity.creditReservationId`
- `integrity.approvedByUserId`
- `integrity.planHash`
- `integrity.creditHash`
- `integrity.sourceSequenceHash`
- `integrity.timingHash`
- `integrity.snapshotHash`

Integrity verification recomputes the hash after removing the stored `integrity.snapshotHash` field.

## Compatibility Rule

`credit_approval_id` is compatibility-only in Prompt 5. Canonical approval is `approval_records.id`; the service leaves `credit_approval_id` null and does not target `credit_approvals`.

## Forbidden Content

Snapshot JSON must not store:

- provider keys or raw provider payloads
- service-role keys
- signed URLs or upload/download URLs as source of truth
- access or refresh tokens
- passwords or private keys
- raw chat as worker instruction source
- mutable frontend-only state as execution truth

## Forbidden Side Effects

Approved snapshot creation must not:

- reserve, spend, release, or refund credits
- create jobs
- claim workers
- call providers
- render media
- execute tools
- upload/download storage objects
- run media analysis
- deploy or run migrations
