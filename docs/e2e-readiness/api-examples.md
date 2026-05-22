# RP-E2E Backend Runtime API Examples

These examples are for the local/server-only skeleton. They do not call providers, Stripe, render workers, or Google Cloud.

## Create Project

```http
POST /v1/projects
Authorization: Bearer <token>
Idempotency-Key: project-create-001
```

```json
{
  "workspaceId": "workspace_123",
  "name": "Lake Como launch edit",
  "description": "Project shell only"
}
```

## Create Upload Intent

```http
POST /v1/projects/project_123/upload-intents
Authorization: Bearer <token>
Idempotency-Key: upload-intent-001
```

```json
{
  "workspaceId": "workspace_123",
  "uploadPurpose": "source_media",
  "originalFileName": "clip-001.mp4",
  "mimeType": "video/mp4",
  "expectedSizeBytes": 12345678
}
```

Example response shape:

```json
{
  "ok": true,
  "data": {
    "uploadIntent": {
      "id": "upload_intent_123",
      "targetBucket": "source-media",
      "targetPath": "workspaces/workspace_123/projects/project_123/source-media/upload_intent_123/clip-001.mp4",
      "status": "signed"
    },
    "uploadTarget": {
      "uploadMethod": "PUT",
      "uploadUrl": "/v1/upload-intents/upload_intent_123/local-object",
      "temporary": true
    }
  }
}
```

## Local PUT Upload

```http
PUT /v1/upload-intents/upload_intent_123/local-object
Authorization: Bearer <token>
Content-Type: video/mp4
```

Raw request body is the file bytes. Local mode stores bytes under the backend storage root and does not expose a filesystem path.

## Finalize Upload

```http
POST /v1/upload-intents/upload_intent_123/finalize
Authorization: Bearer <token>
Idempotency-Key: upload-finalize-001
```

```json
{
  "workspaceId": "workspace_123",
  "sizeBytes": 12345678
}
```

The response includes `uploadIntent`, `storageObjectRecord`, and `mediaAsset`. It does not include a signed URL.

## Attach Finalized Media To Chat

```http
POST /v1/chat-sessions/chat_session_123/attachments/clips
Authorization: Bearer <token>
Idempotency-Key: attach-clips-001
```

```json
{
  "workspaceId": "workspace_123",
  "projectId": "project_123",
  "mediaAssetIds": ["media_asset_001", "media_asset_002"]
}
```

This preserves source order and does not start AI planning, provider calls, or rendering.

## Read Storage Object Metadata

```http
GET /v1/storage-objects/storage_object_123?workspaceId=workspace_123
Authorization: Bearer <token>
```

The response returns canonical metadata only: bucket name, object path, MIME type, checksum, status, and related IDs.

## Create Download Target

```http
POST /v1/storage-objects/storage_object_123/download-target
Authorization: Bearer <token>
Idempotency-Key: download-target-001
```

```json
{
  "workspaceId": "workspace_123",
  "urlPurpose": "download"
}
```

Local mode returns a temporary backend route such as `/v1/storage-objects/storage_object_123/local-object?workspaceId=workspace_123`. GCS mode can later return a signed URL from the backend adapter. The URL itself is never stored as canonical truth.

## Create Approved Snapshot

```http
POST /v1/edit-plans/edit_plan_123/approved-snapshots
Authorization: Bearer <token>
Idempotency-Key: approved-snapshot-001
```

```json
{
  "workspaceId": "workspace_123",
  "projectId": "project_123",
  "chatSessionId": "chat_session_123",
  "creditEstimateId": "credit_estimate_123",
  "creditApprovalId": "credit_approval_123",
  "creditReservationId": "credit_reservation_123",
  "snapshotVersion": 1,
  "snapshotJson": {
    "approvedPlan": "sanitized execution contract",
    "timingPlan": "approved timing only"
  },
  "planHash": "plan_hash_123",
  "creditHash": "credit_hash_123",
  "sourceSequenceHash": "source_hash_123",
  "timingHash": "timing_hash_123"
}
```

## Create Job

```http
POST /v1/jobs
Authorization: Bearer <token>
Idempotency-Key: job-create-001
```

```json
{
  "workspaceId": "workspace_123",
  "projectId": "project_123",
  "jobType": "render_preview",
  "approvedPlanSnapshotId": "approved_snapshot_123",
  "creditReservationId": "credit_reservation_123",
  "payloadJson": {
    "renderType": "preview"
  }
}
```

## Claim Job

```http
POST /v1/jobs/job_123/claim
Authorization: Bearer <token>
Idempotency-Key: job-claim-001
```

```json
{
  "workspaceId": "workspace_123",
  "projectId": "project_123",
  "workerType": "render_worker",
  "workerInstanceId": "local-render-worker-001",
  "leaseExpiresAt": "2026-05-21T16:00:00.000Z"
}
```

## Create Render Job

```http
POST /v1/render-jobs
Authorization: Bearer <token>
Idempotency-Key: render-job-001
```

```json
{
  "workspaceId": "workspace_123",
  "projectId": "project_123",
  "approvedPlanSnapshotId": "approved_snapshot_123",
  "creditReservationId": "credit_reservation_123",
  "renderType": "preview",
  "renderQualityLevel": "draft"
}
```

## Run Basic Smoke Preview

```http
POST /v1/render-jobs/render_job_123/basic-smoke-preview
Authorization: Bearer <token>
Idempotency-Key: render-smoke-001
```

```json
{
  "workspaceId": "workspace_123",
  "projectId": "project_123",
  "sourceStorageObjectId": "storage_object_123",
  "approvedPlanSnapshotId": "approved_snapshot_123",
  "creditReservationId": "credit_reservation_123",
  "workerInstanceId": "local-worker-1",
  "strict": false
}
```

Missing FFmpeg/FFprobe response in non-strict mode:

```json
{
  "ok": true,
  "data": {
    "result": {
      "ok": false,
      "status": "skipped",
      "error": {
        "code": "RENDER_SMOKE_SKIPPED",
        "message": "Basic render smoke skipped because required FFmpeg/FFprobe tools are unavailable."
      }
    }
  }
}
```

Successful render smoke result shape:

```json
{
  "ok": true,
  "data": {
    "renderSmoke": {
      "ok": true,
      "status": "preview_ready",
      "renderId": "render_123",
      "previewStorageObjectId": "storage_object_preview_123",
      "qaReportId": "qa_report_123",
      "outputObjectPath": "workspaces/workspace_123/projects/project_123/previews/render_123/basic-smoke-preview.mp4",
      "checksumSha256": "..."
    }
  }
}
```

Local/Docker command:

```bash
npm run smoke:render
npm run smoke:render:test
npm run docker:worker:render-smoke
```

## Supabase Table Readiness

CLI:

```bash
npm run smoke:supabase:tables
```

Route:

```http
GET /health/supabase/tables
```

Disabled or missing-env result shape:

```json
{
  "ok": true,
  "status": "skipped",
  "smokeMode": "disabled",
  "warnings": [
    "Supabase E2E smoke mode is disabled; no live connection was attempted."
  ]
}
```

Missing table result shape:

```json
{
  "ok": false,
  "status": "failed",
  "error": {
    "code": "missing_tables",
    "message": "Supabase is reachable, but required RP-E2E runtime tables are missing."
  },
  "tableReadiness": {
    "ok": false,
    "missingTables": ["approved_plan_snapshots"]
  }
}
```
```

## Supabase Write/Read Smoke

CLI:

```bash
npm run smoke:supabase:write
```

Route:

```http
POST /v1/e2e/supabase/write-smoke
Authorization: Bearer <token>
```

Live write mode is blocked unless `SUPABASE_E2E_SMOKE_MODE=live` and `SUPABASE_E2E_ALLOW_WRITES=true` are set in server-only env. The smoke creates temporary workspace/project/chat/upload/storage/edit-plan/credit/snapshot/job/render/QA metadata and cleans up smoke-owned rows when cleanup is enabled.

Success shape:

```json
{
  "ok": true,
  "status": "passed",
  "records": {
    "workspaceId": "...",
    "projectId": "...",
    "approvedPlanSnapshotId": "...",
    "creditReservationId": "...",
    "renderJobId": "..."
  },
  "cleanup": {
    "attempted": true,
    "deleted": []
  }
}
```

## Supabase Persisted Render Smoke

CLI:

```bash
npm run smoke:e2e:persisted-render
```

Route:

```http
POST /v1/e2e/supabase/persisted-render-smoke
Authorization: Bearer <token>
```

This runs the no-AI FFmpeg/FFprobe preview path only in live write mode with local storage. It writes and reads Supabase metadata for the source, approved snapshot, credit reservation, render job, worker claim, preview storage object, render, QA report, and job events.

Successful result shape:

```json
{
  "ok": true,
  "status": "passed",
  "records": {
    "sourceStorageObjectId": "...",
    "renderJobId": "...",
    "renderId": "...",
    "previewStorageObjectId": "...",
    "qaReportId": "..."
  },
  "renderSmoke": {
    "status": "completed",
    "output": {
      "status": "preview_ready"
    }
  }
}
```

Blocked because live writes are disabled:

```json
{
  "ok": true,
  "status": "skipped",
  "error": {
    "code": "disabled",
    "message": "Set SUPABASE_E2E_SMOKE_MODE=live and SUPABASE_E2E_ALLOW_WRITES=true to run persisted smoke."
  }
}
```

## Provider Gateway Blocked Real Call

```http
POST /v1/provider-gateway/requests
Authorization: Bearer <token>
Idempotency-Key: provider-request-001
```

```json
{
  "workspaceId": "workspace_123",
  "projectId": "project_123",
  "providerRoute": "mirelo_sfx_v1_5",
  "providerModel": "mirelo-sfx-v1.5",
  "generationRequestId": "generation_request_123",
  "jobId": "job_123",
  "approvedPlanSnapshotId": "approved_snapshot_123",
  "creditReservationId": "credit_reservation_123",
  "requestPayload": {
    "promptSummary": "sanitized prompt summary only"
  }
}
```

Expected skeleton response:

```json
{
  "error": {
    "code": "REAL_PROVIDER_CALLS_DISABLED",
    "message": "Real provider calls are disabled in the RP-E2E backend runtime skeleton.",
    "status": 403,
    "request_id": "..."
  }
}
```

## Run Tool Checks

```http
POST /v1/workers/tool-readiness/check
Authorization: Bearer <token>
```

```json
{
  "workspaceId": "workspace_123",
  "workerType": "tool_readiness_worker",
  "recordResults": true
}
```

This runs safe version/package/import checks only. It does not process media, open browsers, render, or call providers.

## Tool Summary CLI

```bash
npm run tools:summary
```

Example output shape:

```json
{
  "prompt6Ready": false,
  "required": {
    "ffmpeg": "unavailable",
    "ffprobe": "unavailable"
  },
  "optional": {
    "remotion": "unavailable",
    "sharp_libvips": "unavailable"
  },
  "notes": [
    "Prompt 6 is blocked until FFmpeg and FFprobe are available on the host or in the Docker worker image."
  ]
}
```

## Strict Prompt 6 Readiness

```bash
STRICT_PROMPT6_TOOL_READINESS=true npm run smoke:prompt6-ready
```

When strict mode is true, the smoke test exits nonzero if `ffmpeg` or `ffprobe` is unavailable. With strict mode false, it warns and exits cleanly for local host development.

## Docker Tool Readiness

```bash
npm run docker:worker:build
npm run docker:worker:tools
npm run docker:worker:smoke
docker run --rm --env API_ALLOW_MOCK_WITHOUT_SUPABASE=true --env E2E_RUNTIME_MODE=local --env WORKER_RUNTIME_MODE=local --env STRICT_PROMPT6_TOOL_READINESS=true reeditpro-worker-dev npm run smoke:prompt6-ready
```

The Docker worker path is the reproducible fallback when host tools are missing. It remains local/dev/test only and does not render, call providers, or deploy.

## Run Dry-Run Worker Job

```http
POST /v1/workers/jobs/job_123/run
Authorization: Bearer <token>
```

```json
{
  "workspaceId": "workspace_123",
  "projectId": "project_123",
  "workerType": "noop_worker",
  "workerInstanceId": "local-worker-1",
  "idempotencyKey": "worker-run-001",
  "jobType": "other",
  "dryRun": true
}
```

Dry run evaluates gates and readiness without claiming or executing the worker handler.

## Worker Blocked: Missing Approved Snapshot

```json
{
  "workspaceId": "workspace_123",
  "projectId": "project_123",
  "workerType": "noop_worker",
  "idempotencyKey": "worker-run-render-001",
  "jobType": "render_preview"
}
```

Expected: blocked because render jobs require `approvedPlanSnapshotId` and `creditReservationId`.

## Probe Media Job

```http
POST /v1/workers/jobs/job_media_probe_123/probe-media
Authorization: Bearer <token>
```

```json
{
  "workspaceId": "workspace_123",
  "projectId": "project_123",
  "workerType": "media_probe_worker",
  "workerInstanceId": "local-worker-1",
  "idempotencyKey": "probe-media-001",
  "mediaAssetId": "media_asset_123",
  "storageObjectRecordId": "storage_object_123",
  "payloadJson": {
    "bucketName": "source-media",
    "objectPath": "workspaces/workspace_123/projects/project_123/source-media/upload_intent_123/clip-001.mp4"
  }
}
```

Expected failure modes:

- Missing `ffprobe`: worker blocks before probing.
- Missing finalized storage metadata: worker fails safely.
- Non-local storage mode: worker fails with mock/local-only message.

## Supabase RPC Readiness

```bash
npm run smoke:supabase:rpcs
```

Disabled default:

```json
{
  "ok": true,
  "status": "skipped",
  "error": {
    "code": "disabled",
    "message": "Set SUPABASE_E2E_SMOKE_MODE=live to run service-role RPC readiness checks."
  }
}
```

Live missing RPCs:

```json
{
  "ok": false,
  "status": "failed",
  "error": {
    "code": "E2E_RPC_MISSING",
    "message": "E2E service-role RPCs are not applied to Supabase.",
    "details": {
      "missingRpcs": ["e2e_create_approved_plan_snapshot"]
    }
  }
}
```

## RPC Persisted Render Smoke

```bash
SUPABASE_E2E_SMOKE_MODE=live SUPABASE_E2E_ALLOW_WRITES=true npm run smoke:e2e:rpc-persisted-render
```

Skipped default:

```json
{
  "ok": true,
  "status": "skipped",
  "error": {
    "code": "disabled",
    "message": "Set SUPABASE_E2E_SMOKE_MODE=live and SUPABASE_E2E_ALLOW_WRITES=true to run persisted smoke."
  }
}
```

Success shape:

```json
{
  "ok": true,
  "status": "passed",
  "renderSmoke": {
    "ok": true,
    "status": "preview_ready",
    "jobId": "job_uuid",
    "renderJobId": "render_job_uuid",
    "previewStorageObjectId": "storage_object_uuid",
    "qaReportId": "qa_report_uuid",
    "outputObjectPath": "workspaces/.../previews/.../rpc-basic-smoke-preview.mp4"
  }
}
```

Worker claim conflict:

```json
{
  "ok": false,
  "status": "failed",
  "error": {
    "code": "E2E_WORKER_CLAIM_CONFLICT",
    "message": "An active worker claim already exists for this job."
  }
}
```

Credit reservation missing:

```json
{
  "ok": false,
  "status": "failed",
  "error": {
    "code": "E2E_CREDIT_RESERVATION_MISSING",
    "message": "Credit reservation is required before preview-ready completion."
  }
}
```

## Prompt 9 Local Full Editing Flow

```bash
npm run smoke:e2e:local-full
```

Route:

```http
POST /v1/e2e/local/full-editing-flow
Idempotency-Key: local-full-001
```

```json
{
  "workspaceId": "workspace_local_full",
  "projectName": "No-AI local full flow"
}
```

Success shape:

```json
{
  "ok": true,
  "status": "preview_ready",
  "mode": "local",
  "providerCallsAttempted": false,
  "remotionUsed": false,
  "signedUrlStoredAsCanonical": false,
  "previewStorageObjectId": "storage_object_preview",
  "qaReportId": "qa_report",
  "steps": [
    { "name": "create_upload_intent", "status": "passed" },
    { "name": "create_approved_snapshot", "status": "passed" },
    { "name": "run_basic_render_worker", "status": "passed" }
  ]
}
```

## Prompt 9 Supabase Full Editing Flow

```bash
npm run smoke:e2e:supabase-full
```

Default skipped result:

```json
{
  "ok": true,
  "status": "skipped",
  "mode": "supabase",
  "error": {
    "code": "supabase_full_flow_disabled",
    "message": "Set SUPABASE_E2E_SMOKE_MODE=live and SUPABASE_E2E_ALLOW_WRITES=true to run Supabase full E2E flow."
  }
}
```

Live mode requires server-only Supabase env, write permission, required tables, Prompt 8/9 RPCs, FFmpeg/FFprobe, and local storage mode. Missing pieces return a structured failure instead of fake success.

## Prompt 9 Readiness Summary

```bash
npm run e2e:readiness
```

```json
{
  "ok": false,
  "localFullFlowReady": true,
  "supabaseFullFlowReady": false,
  "providerRealCallsDisabled": true,
  "remotionDisabled": true,
  "blockers": [
    "Live Supabase full flow is disabled until SUPABASE_E2E_SMOKE_MODE=live is set."
  ]
}
```
