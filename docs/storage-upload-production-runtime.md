# Storage Upload Production Runtime

Prompt 4 creates the first bounded storage/upload route and service foundation for private project media. It does not enable media analysis, planning, approved snapshots, credits, jobs, workers, providers, rendering, tools, Stripe, deployment, or remote Supabase migration.

## Current Implementation Found

- `server/routes/upload-routes.ts` exposes guarded `/v1` upload/storage routes behind `requireAuth`; mutation routes require idempotency except the local raw byte upload helper.
- `server/services/upload-service.ts` creates upload intents, local/mock upload targets, storage object records, signed URL event records, and source media boundary records.
- `server/storage/storage-paths.ts` builds canonical paths with `workspace/{workspaceId}/project/{projectId}/...`.
- `server/storage/local-storage-adapter.ts` supports local development byte writes and local temporary download targets.
- `server/storage/gcs-storage-adapter.ts` can create temporary GCS upload/download targets only when configured, but direct backend GCS proxy upload/read remains blocked.
- `server/validation/upload-schemas.ts` validates upload purpose, MIME type, size, UUID IDs, idempotency shape, and signed URL event metadata.
- `src/backend/api/routes/storage-api-routes.ts` and `src/backend/api/routes/media-upload-api-routes.ts` now document the backend-required `/v1` boundary.

## Prompt 4 Changes

- Added project/workspace membership access checks before upload intent creation, local upload, finalization, storage object reads, local object reads, signed URL events, and download target creation.
- Restricted user-created upload intents to `source_media`, `reference_media`, and `thumbnail`; worker/backend-only purposes remain blocked for normal user upload intent creation.
- Hardened storage path normalization to reject empty paths, null bytes, POSIX absolute paths, Windows absolute paths, and traversal escapes.
- Required all private GCS bucket names before allowing `STORAGE_MODE=gcs`.
- Added validation that signed URL event metadata cannot contain signed URL, token, secret, credential, password, or URL-ish source-of-truth keys.
- Added route schemas for upload intent lookup, upload intent route params, storage object lookup, storage object route params, and project upload intent creation.
- Added `BACKEND_REQUIRED` as an explicit API error code for fail-closed backend-required storage access checks.
- Added `scripts/validation/storage-upload-scope-diagnostics.mjs` and `npm run storage:scope:diagnostics`.

## Canonical Concepts Used

- `upload_intents`
- `storage_object_records`
- `signed_url_events`
- `media_assets` only as a source media finalization boundary
- `uploaded_clips` and source order metadata only as future boundary concepts; no analysis or planning starts here
- `projects`
- `workspaces`
- `workspace_members`
- `profiles` only as auth/access context
- `audit_events` remains planned only; Prompt 4 does not add audit writes

## Legacy And Draft Tables Avoided

Prompt 4 must not target legacy `user_profiles`, draft-only tables, planning tables, credit tables, job/worker tables, provider attempt tables, render/export execution tables, tool runtime tables, SFX tables, StoryTiming tables, or Stripe/billing tables.

## Frontend Responsibilities

- Collect file metadata and user intent to upload source/reference/thumbnail media.
- Call backend API routes with authenticated context and idempotency keys for mutations.
- Treat upload targets and download targets as temporary response data.
- Never invent canonical bucket/path records.
- Never store signed URLs as source of truth.
- Never call provider, render, credit, job, worker, or tool routes as part of upload.

## Backend API Responsibilities

- Validate auth and project/workspace access before storage mutations.
- Validate upload purpose, file name, MIME type, expected size, checksum, and idempotency.
- Build canonical private object paths.
- Create upload intents and storage object records.
- Record sanitized signed URL lifecycle events without URL values.
- Fail closed when Supabase admin/storage runtime is unavailable outside local/mock mode.
- Keep source media finalization to boundary records only; do not start analysis.

## Supabase And Storage Responsibilities

- Supabase remains the source of truth for upload/storage records after migrations and RLS are validated.
- Storage buckets remain private by default.
- Canonical records store bucket and object path only.
- Signed URLs are temporary events/response data, not persistent source-of-truth values.
- Workspace/project path scoping must be enforced by backend logic and RLS/storage policies.

## Service-Role Boundary

Production upload intent creation, finalization, signed URL event writes, and storage object reads require backend runtime with service-role/admin capability. The frontend must not receive service-role data or keys. When admin runtime is absent, routes either use local/mock warnings in `STORAGE_MODE=local` with `API_ALLOW_MOCK_WITHOUT_SUPABASE=true` or return `BACKEND_REQUIRED`/blocked errors.

## Workspace And Project Access Boundary

Project-scoped operations resolve access through:

```text
projects.id -> projects.workspace_id -> workspace_members.workspace_id/user_id
```

Cross-workspace project IDs, missing membership, missing auth, and missing backend validation fail closed.

## Upload Intent Lifecycle

```text
authenticated user
-> POST /v1/projects/:projectId/upload-intents
-> validate purpose/MIME/size/file/checksum/idempotency
-> validate project workspace membership
-> backend builds bucket/path
-> backend creates upload_intent-like record
-> backend returns temporary upload target when runtime supports it
```

Allowed user upload purposes in Prompt 4 are `source_media`, `reference_media`, and `thumbnail`.

## Signed Upload Lifecycle

Signed upload targets are backend-issued temporary response data. In local mode the target is `/v1/upload-intents/:uploadIntentId/local-object`; in configured GCS mode it may be a short-lived signed URL. The signed URL value must not be written to `signed_url_events`, metadata JSON, or canonical storage records.

## Signed Download Lifecycle

`POST /v1/storage-objects/:storageObjectRecordId/download-target` validates workspace access and returns a temporary download target. Local mode returns a local development route. Production GCS mode may return a short-lived signed URL after backend validation. The URL value remains response-only.

## Storage Object Record Lifecycle

Finalization verifies the object, then creates or returns a canonical storage object record containing:

- workspace ID
- project ID
- bucket name
- object path
- MIME type
- byte size
- checksum
- object purpose
- metadata without secrets or signed URLs

Storage object records are canonical references; they do not contain signed URL values.

## Source Media Finalization Lifecycle

Source media finalization is limited to upload boundary records such as media/storage references and uploaded order metadata. Prompt 4 does not probe media, align transcripts, generate source sequence maps, create edit plans, estimate credits, or dispatch jobs.

## Storage Path Convention

Project storage uses:

```text
workspace/{workspaceId}/project/{projectId}/{folder}/{uploadIntentId}/{safeFileName}
```

Path guardrails reject traversal, absolute paths, null bytes, empty segments, and user-controlled bucket names.

## Private Bucket Policy

Private buckets remain the default:

- `source-media`
- `generated-assets`
- `processed-media`
- `previews`
- `exports`
- `thumbnails`
- `qa-artifacts`
- `worker-temp`

`worker-temp` remains worker/backend-only and cleanup-required.

## Idempotency Expectations

Mutation routes that create or finalize records require idempotency. The local raw byte upload helper is development-only and is not the production signed upload route. Production direct-upload finalization must remain idempotent.

## Audit Expectations

Prompt 4 does not add audit event writes. Future production runtime should emit sanitized append-only audit events for upload intent creation, signed URL event creation, upload finalization, failed access checks, and storage object download target creation. Audit payloads must not include signed URLs, secrets, provider keys, service-role keys, tokens, or private media bytes.

## Validation Results

See `docs/prompt-04-validation-results.md`.

## What Remains Blocked

- Remote/staging Supabase validation.
- Remote storage upload/download validation.
- Local/staging RLS execution.
- Production signed URL runtime without configured backend credentials.
- Production bucket deployment/policy verification.
- Media analysis, transcript alignment, planning, approved snapshots, credits, jobs, workers, providers, rendering, tools, Stripe, and deployment.
