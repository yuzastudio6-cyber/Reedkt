# Approved Plan Snapshot Service

Prompt 5 adds the limited approved snapshot route/service foundation for ReeditPro. It creates the backend boundary that future workers must depend on, while keeping execution blocked.

## Current Implementation Found

- Existing server routes supported create/read approved snapshot endpoints in `server/routes/approval-routes.ts`.
- Existing service skeleton returned mock snapshots when backend/service-role runtime was unavailable.
- Existing service called the schema-era conflicted `can_create_approved_plan_snapshot` helper, which references older `edit_plans` and `credit_approvals` assumptions.
- Active schema docs and Prompt 2A mark `approval_records`, `approved_plan_snapshots`, `edit_plan_versions`, `credit_estimates`, and `credit_reservations` as canonical targets.

## Prompt 5 Implementation

- `server/services/approved-snapshot-service.ts` now performs explicit canonical gate checks instead of using the legacy helper.
- Creation fails closed with `BACKEND_REQUIRED` when service-role runtime is unavailable.
- Readiness and blocker routes return gate state without pretending production execution is ready.
- Read/get/list/integrity routes require auth and workspace/project access validation.
- Snapshot JSON is rejected when it contains secret-like keys, signed URL fields, service-role terms, provider key terms, or raw chat as execution source.
- Snapshot hash is deterministic SHA-256 over stable JSON with service-added integrity metadata.
- `credit_approval_id` is treated as compatibility-only and left null by creation.

## Canonical Tables Used

- `approval_records`
- `approved_plan_snapshots`
- `edit_plan_versions`
- `credit_estimates`
- `credit_reservations`
- `projects`
- `workspaces`
- `workspace_members`

## Legacy/Draft Tables Avoided

- `credit_approvals` is not canonical for Prompt 5.
- `edit_plans` is not queried as a canonical gate.
- Jobs, workers, providers, renders, tools, Stripe, storage execution, and media analysis tables are not targeted.

## Frontend Responsibilities

- Collect and display approval state, plan summary, estimate summary, blockers, and integrity status.
- Call backend route contracts only.
- Never create approved snapshots directly in Supabase.
- Never send raw chat as the worker execution source.
- Never send provider secrets, service-role data, signed URLs, or private credentials in snapshot JSON.

## Backend API Responsibilities

- Authenticate the user.
- Validate workspace/project access through canonical membership.
- Require idempotency for snapshot creation.
- Validate approved plan version, approved estimate, canonical approval record, active reservation, timing context, QA blockers, and storage object references.
- Persist immutable approved snapshot records only when all gates pass and backend runtime is available.
- Return blocker summaries when gates are not satisfied.

## Supabase Responsibilities

- Persist canonical records and enforce RLS.
- Keep `approved_plan_snapshots.snapshot_json` immutable by policy/trigger in future migration hardening.
- Preserve `approval_records` as the canonical approval record.
- Preserve `credit_reservations` and `credit_estimates` as approved credit gate records.
- Keep normal users from directly mutating execution state.

## Service-Role Boundary

Service-role runtime is required for DB-backed snapshot creation, reads, lists, and integrity verification because the backend must verify project access and canonical gate records. When it is missing, mutation routes fail closed with `BACKEND_REQUIRED`; readiness routes report backend-required blockers.

## Snapshot Creation Flow

1. Auth user calls create route with `Idempotency-Key`.
2. Backend validates body and route `editPlanId`.
3. Project access is checked through `projects.workspace_id` and `workspace_members`.
4. Backend verifies `edit_plan_versions.status = approved` and approval timestamp.
5. Backend verifies `credit_estimates.status in ('approved', 'accepted')`.
6. Backend verifies `approval_records` matches project, session, plan version, estimate, and approver.
7. Backend verifies `credit_reservations` matches workspace/project/estimate and is active/reserved/non-expired.
8. Backend rejects unsafe snapshot JSON and blocking QA state.
9. Backend computes deterministic snapshot hash.
10. Backend inserts `approved_plan_snapshots`.

## What Remains Blocked

- Credit spend/reserve/refund mutation.
- Job creation and worker execution.
- Provider calls.
- Rendering/export.
- Tool execution.
- Storage upload/download execution.
- Media analysis and transcript/timing workers.
- Remote Supabase migration or RLS execution.
- Schema cleanup for compatibility-era columns.

## Validation

Prompt 5 validation is recorded in `docs/prompt-05-validation-results.md`. SQL/RLS validation remains draft-only in `database/test-sql/008_approved_snapshot_rls_smoke_tests.draft.sql`.
