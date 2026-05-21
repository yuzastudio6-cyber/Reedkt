# RP-E2E-READY-01 Runtime Database Foundation

Date: 2026-05-21

## Purpose

This milestone adds local, review-ready database and contract foundations for future real end-to-end editing tests. It does not connect to Supabase, run migrations, deploy Google Cloud, add secrets, call providers, add Stripe, render media, or execute workers.

The core rule is unchanged: workers execute approved snapshots, not raw chat. Expensive work must have an approved edit plan, approved credit estimate, and reserved credits before any future backend/worker path can run.

## Runtime Tables

### `approved_plan_snapshots`

Ownership: backend-only writes, user/workspace reads through policy.

The existing approved snapshot table is extended in place with RP-E2E execution fields. It freezes the edit plan, credit approval, source sequence, and timing state that workers should execute. `snapshot_json` is immutable execution contract material and must not contain provider keys, service-role keys, signed URLs, raw secrets, or raw chat-only instructions.

Connects to existing `projects`, `chat_sessions`, `edit_plans`, `credit_estimates`, `credit_approvals`, and `credit_reservations`.

### `api_idempotency_keys`

Ownership: backend-only writes, user-scoped reads.

Prevents duplicate API writes, credit reservations, job creation, provider attempts, render jobs, export requests, and other expensive operations. The unique key is `workspace_id + user_id + idempotency_key`; future backend code should reject the same key with a different request hash.

Connects to all future backend mutation routes.

### `upload_intents`

Ownership: user-facing limited create, backend finalization.

Creates controlled upload records before source clips or references become canonical media assets. Upload intents track expected file metadata and expiration, but signed upload URLs remain temporary and are not stored as source of truth.

Connects to `projects`, `chat_sessions`, future signed upload routes, and `media_assets`.

### `storage_object_records`

Ownership: backend-only writes, workspace reads.

Canonical storage record for source media, generated assets, previews, exports, thumbnails, QA artifacts, and worker temp files. It stores only `bucket_name` and `object_path`, never signed URLs.

Connects to media, generated asset, render, QA, upload intent, and future private storage services.

### `signed_url_events`

Ownership: backend-only writes, workspace reads.

Audits temporary upload/download URL creation without storing the URL itself. Metadata is sanitized JSON only.

Connects to upload intents, canonical storage objects, and future signed URL service routes.

### `worker_job_claims`

Ownership: worker/backend-only writes, workspace reads.

Prevents two workers from executing the same job. A partial unique index allows only one active claim per job, and helper functions check future job readiness before a worker starts.

Connects to `jobs`, worker leases, future Cloud Run jobs, Pub/Sub/Cloud Tasks, provider workers, render workers, media workers, and QA/export workers.

### `tool_runtime_checks`

Ownership: worker/backend-only writes, workspace reads.

Stores tool readiness checks for actual editing workers. Supported tool names include `ffmpeg`, `ffprobe`, `remotion`, `sharp_libvips`, `audioflux`, `signalsmith_stretch`, `opencv`, `vapoursynth`, and `playwright`.

This records readiness only; it does not install or execute any tool.

### `provider_request_attempts`

Ownership: provider gateway/backend-only writes, workspace reads.

Tracks future provider gateway attempts after real provider transport is enabled. It stores route/model, approved snapshot, credit reservation, hashes, status, and normalized errors. It must not store raw provider keys, raw secrets, or full unredacted provider payloads.

Connects to generation requests, jobs, approved plan snapshots, credit reservations, and future provider gateway workers.

### `provider_webhook_events`

Ownership: provider gateway/backend-only writes, workspace reads.

Stores sanitized provider webhook or checkback summaries. The table keeps provider event identity, signature verification status, processing status, and sanitized summary JSON only.

Connects to generation requests, jobs, provider request attempts, and future webhook/checkback handlers.

## Helper Functions

`can_create_approved_plan_snapshot(edit_plan_id, credit_estimate_id, credit_reservation_id)` checks the approved plan and approved/accepted credit estimate with an active/reserved reservation when those records are available.

`active_worker_claim_exists(job_id)` checks whether a job already has an active worker claim.

`can_claim_worker_job(job_id)` combines the existing `can_run_job(job_id)` helper when available with the no-active-claim check.

These helpers are review-ready database guards. Future service-role backend code still owns the actual write paths.

## Access Model

Workspace members can read records scoped to their workspace. Project editors can create upload intents where appropriate. Normal authenticated users cannot directly mutate approved snapshots, provider attempts, webhook events, worker claims, or tool runtime checks.

Privileged writes are reserved for future service-role/backend paths. This milestone does not add credentials, environment values, Secret Manager reads, or deployed handlers.

## What Remains Unimplemented

- Applying and verifying these migrations locally/staging.
- Service-role backend handlers for snapshot creation, idempotency, uploads, signed URLs, worker claims, provider attempts, and webhook events.
- Private GCS/Supabase storage runtime and signed URL generation.
- Real worker dispatch through Cloud Run, Pub/Sub, or Cloud Tasks.
- Real provider transport for OpenAI, Wan, Hailuo, Veo, Lyria, Mirelo, or MMAudio.
- Stripe checkout, webhook runtime, and production credit ledger mutation.
- Real Remotion/FFmpeg/audio/tool execution.
- Full E2E tests with mock workers, then limited real-provider smoke tests behind explicit future flags.

## Next Implementation Order

1. Apply the migration chain locally/staging and run SQL smoke tests.
2. Verify RLS, storage policy behavior, helper functions, advisor output, and rollback plan.
3. Build backend service-role handlers for approved snapshots, idempotency, upload intents, storage records, signed URL events, and worker claims.
4. Connect queue/lease mutation with mock workers only.
5. Connect private storage paths and canonical object records.
6. Add worker lanes one at a time with tool readiness checks before real execution.
7. Enable provider transports only after Secret Manager, credit gates, idempotency, storage, retries/refunds, QA, and logging safety pass.
