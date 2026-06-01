# Credit Gate Contract

The Prompt 6 credit gate is a reusable backend boundary for checking whether credit-bearing execution may proceed. It is not a mutation engine.

## Required Gates

| Gate | Purpose | Checked by | Required records | Pass condition | Failure status | Audit event style |
| --- | --- | --- | --- | --- | --- | --- |
| `AuthGate` | Ensure the caller is authenticated. | API middleware/service helper | Auth session | User ID exists. | `AUTH_REQUIRED` | `credit.auth.blocked` |
| `WorkspaceGate` | Ensure workspace scope is valid. | Auth/workspace service | `workspaces`, `workspace_members` | User is a member of the workspace. | `WORKSPACE_ACCESS_DENIED` | `credit.workspace.blocked` |
| `ProjectAccessGate` | Ensure project is in the caller workspace. | Project service | `projects`, `workspace_members` | User has project access through workspace membership. | `WORKSPACE_ACCESS_DENIED` or `PROJECT_NOT_FOUND` | `credit.project.blocked` |
| `IdempotencyGate` | Prevent duplicate mutations. | Route middleware | Request idempotency key | Mutating route includes `Idempotency-Key`. | `IDEMPOTENCY_KEY_REQUIRED` | `credit.idempotency.blocked` |
| `CreditEstimateGate` | Require an approved estimate for credit-bearing work. | Credit service | `credit_estimates`, `credit_estimate_items` | Estimate exists, is scoped to project, and has approved/accepted status. | `CREDIT_ESTIMATE_NOT_APPROVED` | `credit.estimate.blocked` |
| `ApprovalRecordGate` | Tie estimate approval to canonical user approval. | Future transactional service | `approval_records` | Approval record references the approved plan/snapshot and estimate. | `PLAN_NOT_APPROVED` | `credit.approval.blocked` |
| `ApprovedSnapshotGate` | Ensure workers execute approved records, not raw chat. | Credit service/snapshot service | `approved_plan_snapshots` | Snapshot exists, is approved/locked, and matches project/estimate scope. | `APPROVED_SNAPSHOT_REQUIRED` | `credit.snapshot.blocked` |
| `CreditReservationGate` | Require active reserved credits before expensive execution. | Credit service | `credit_reservations` | Reservation exists, is active/reserved, scoped, unexpired, and enough credits are reserved. | `CREDITS_NOT_RESERVED` or `INSUFFICIENT_CREDITS` | `credit.reservation.blocked` |
| `NoDoubleSpendGate` | Prevent spending the same reservation twice. | Credit service | `credit_ledger_entries` | No existing spend entry blocks the requested execution. | `CREDITS_NOT_RESERVED` | `credit.double_spend.blocked` |
| `RefundEligibilityGate` | Prevent duplicate release/refund activity. | Credit service | `credit_reservations`, `credit_ledger_entries`, future `refund_records` | No conflicting release/refund activity exists. | `CREDITS_NOT_RESERVED` | `credit.refund.blocked` |
| `MetadataSafetyGate` | Keep secrets out of credit payloads. | Credit schemas/service | Request metadata | Metadata contains no secret, token, provider key, service-role, Stripe, signed URL, or credential-like keys. | `VALIDATION_FAILED` | `credit.metadata.blocked` |
| `TransactionalMutationGate` | Block writes until reviewed backend transaction exists. | Credit service | Future RPC/service transaction | Future only. Prompt 6 always fails closed for writes. | `BACKEND_REQUIRED` | `credit.<action>.backend_required` |

## Response Contract

All credit route responses should be shaped around:

```ts
{
  status: 'ready' | 'blocked' | 'backend_required',
  canProceed: boolean,
  blockers: Array<{ gate: string; code: string; message: string }>,
  warnings: string[],
  requiredRecords: Array<{ table: string; id?: string; status: string; note: string }>,
  nextAction: string,
  creditEstimate?: object | null,
  creditReservation?: object | null,
  wallet?: object | null,
  auditEvent?: object,
}
```

## Prompt 6 Behavior

- Readiness checks are read-only.
- Mutations require idempotency and return `BACKEND_REQUIRED`.
- No route creates jobs, starts providers, renders media, executes tools, calls Stripe, uploads/downloads storage, or mutates approved snapshots.
- Ledger entries are treated as append-only; Prompt 6 does not insert, update, or delete them.

## Future Implementation Notes

Prompt 6 intentionally leaves transactional mutation to a later reviewed prompt. That future prompt must add atomic reserve/spend/release/refund behavior, idempotent replay handling, audit events, RLS/service-role validation, and rollback evidence before any expensive execution can depend on credits.
