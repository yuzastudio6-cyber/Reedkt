# Approved Snapshot Route Contract

Prompt 5 route contracts are backend-required planning-domain routes. They validate approved snapshot readiness and persistence boundaries only.

| Route ID | Method/path | Purpose | Caller | Auth | Tables touched | Service role | Idempotency | Status | Forbidden side effects |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `snapshots.readiness.check` | `POST /v1/edit-plans/:editPlanId/approved-snapshots/readiness` | Return readiness gates and blockers without writing a snapshot. | Frontend/backend UI | Required | `projects`, `workspace_members`, `edit_plan_versions`, `credit_estimates`, `approval_records`, `credit_reservations`, `storage_object_records` read-only | Required for DB checks | Reported as blocker if absent | backend_required | No writes, no jobs, no providers, no rendering, no tools, no credits. |
| `snapshots.approved.create` | `POST /v1/edit-plans/:editPlanId/approved-snapshots` | Create immutable approved snapshot after all gates pass. | Frontend approval action through backend | Required | `approved_plan_snapshots` insert; canonical gate tables read | Required | Required | backend_required | No credit mutation, no job creation, no worker claim, no provider call, no render/tool/storage execution. |
| `snapshots.approved.get` | `GET /v1/approved-snapshots/:snapshotId` | Read scoped approved snapshot metadata. | Frontend/backend UI | Required | `approved_plan_snapshots`, project access tables read-only | Required | No | backend_required | No executable payload leak, no mutation. |
| `snapshots.approved.listForProject` | `GET /v1/projects/:projectId/approved-snapshots` | List approved snapshot summaries for a project. | Frontend/backend UI | Required | `approved_plan_snapshots`, project access tables read-only | Required | No | backend_required | No mutation, no worker payload handoff. |
| `snapshots.approved.verifyIntegrity` | `POST /v1/approved-snapshots/:snapshotId/verify-integrity` | Recompute deterministic snapshot hash and compare with stored/expected hash. | Frontend/backend UI | Required | `approved_plan_snapshots`, project access tables read-only | Required | No | backend_required | No status change, no execution readiness change. |
| `snapshots.approved.blockers` | `POST /v1/edit-plans/:editPlanId/approved-snapshots/blockers` | Return readiness blockers in a review-friendly shape. | Frontend/backend UI | Required | Same read-only gate tables as readiness | Required for DB checks | Reported as blocker if absent | backend_required | No writes or execution. |

## Request Body Summary

Readiness, blockers, and creation use the same canonical scope fields:

- `workspaceId`
- `projectId`
- `chatSessionId` optional
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
- `expectedSnapshotHash` optional

Create also uses `snapshotVersion` and requires the `Idempotency-Key` header.

## Response Summary

Readiness responses include:

- `status`
- `ready`
- `gates`
- `blockers`
- `warnings`

Create responses include:

- approved snapshot metadata
- deterministic snapshot hash
- readiness evidence
- warnings that no execution started

Read/list responses return scoped metadata only. Integrity responses return hash comparison results only.

## Fail-Closed Behavior

- Missing auth returns `AUTH_REQUIRED`.
- Missing idempotency for create returns `IDEMPOTENCY_KEY_REQUIRED`.
- Missing backend/service-role runtime returns `BACKEND_REQUIRED` for creation and DB-backed reads.
- Missing project access returns `WORKSPACE_ACCESS_DENIED`.
- Missing approved plan returns `PLAN_NOT_APPROVED`.
- Missing approved estimate returns `CREDIT_ESTIMATE_NOT_APPROVED`.
- Missing active reservation returns `CREDITS_NOT_RESERVED`.
- Missing approved snapshot returns `APPROVED_SNAPSHOT_REQUIRED`.
- Blocking QA returns `QA_BLOCKED_PREVIEW`.

## Current Implementation Status

- Route metadata exists in `src/backend/api/routes/approved-snapshot-api-routes.ts`.
- Express routes exist in `server/routes/approval-routes.ts`.
- Service boundary exists in `server/services/approved-snapshot-service.ts`.
- Request validation exists in `server/validation/approved-snapshot-schemas.ts`.
- Production database execution still requires configured backend/service-role runtime and local/staging RLS validation.
