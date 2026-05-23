# Staging Real-Video Upload-To-Preview Canary

Status: implementation added, live dispatch not yet run.

This gate is the next staging-only RP-E2E readiness gate after the Cloud Run / Remotion infrastructure canary. It proves one tiny controlled source video can move through the ReeditPro upload-to-preview metadata path and produce a preview through the private Cloud Run `/canary/render` service.

## What It Does

- Generates a synthetic `3s`, `160x90`, `15fps`, muted MP4 fixture with FFmpeg.
- Uploads the fixture to a smoke-scoped GCS source path:
  `workspaces/{workspaceId}/projects/{projectId}/source-media/{smokeRunId}/tiny-source.mp4`.
- Registers the source as a finalized upload intent, media asset, and storage object record in staging Supabase.
- Attaches the finalized source to the chat/source sequence path and uses the approved plan, credit approval, credit reservation, job, render job, worker claim, render, preview storage, and QA metadata path.
- Invokes only the private staging Cloud Run canary endpoint with OIDC/WIF.
- Renders a tiny preview from the uploaded source through Remotion `bundle / selectComposition / renderMedia`.
- Stores the preview under:
  `workspaces/{workspaceId}/projects/{projectId}/previews/{renderId}/{smokeRunId}-tiny-preview.mp4`.
- Cleans up all smoke-tagged Supabase records and both GCS source/preview artifacts, then runs strict leftover detection.

## Safety Rules

The workflow is manual only and fails closed unless all are true:

- `allow_writes=true`
- `allow_render_execution=true`
- `allow_cloud_run=true`
- `cleanup=true`
- `max_wait_seconds` is between `30` and `300`

The canary must remain staging-only. It must not use production resources, Stripe/payment flows, external AI/content providers, customer media, broad E2E suites, broad queue drains, existing user jobs, or service account JSON keys.

## Required Configuration

The workflow uses GitHub OIDC / Workload Identity Federation. It requires the existing staging Cloud Run canary config:

- `GCP_PROJECT_ID`
- `GCP_REGION`
- `GCP_WORKLOAD_IDENTITY_PROVIDER`
- `GCP_SERVICE_ACCOUNT`
- `STAGING_CLOUD_RUN_RENDER_CANARY_URL`
- `STAGING_CLOUD_RUN_RENDER_CANARY_AUDIENCE`
- `STAGING_RENDER_CANARY_OUTPUT_BUCKET_OR_PREFIX`

It also needs the staging canary GCS bucket for source and preview smoke artifacts. If `STAGING_REAL_VIDEO_CANARY_GCS_BUCKET` is not set, the workflow defaults to `reeditpro-staging-render-canary-smoke`.

The GitHub auth action creates an ephemeral WIF credentials file for GCS access and an ID token for Cloud Run. This is not a service account key and must not be printed or committed.

## Dispatch Command

Do not dispatch until the implementation has been reviewed and disabled-mode validation passes.

```powershell
$repo = "yuzastudio6-cyber/Reedkt"
$ref = "codex/reeditpro-e2e-readiness"
$gh = "C:\Program Files\GitHub CLI\gh.exe"

& $gh workflow run "RP E2E Staging Real Video Upload To Preview Canary" `
  -R $repo `
  --ref $ref `
  -f allow_writes=true `
  -f allow_render_execution=true `
  -f allow_cloud_run=true `
  -f cleanup=true `
  -f max_wait_seconds=180 `
  -f smoke_user_id=bb300bde-97fa-438d-ab97-a47dec0ca7d1 `
  -f previous_write_smoke_run_id=rp-e2e-smoke-79ce5e86-b894-4bf4-967d-d702a1c16ccf `
  -f previous_persisted_render_smoke_run_id=rp-e2e-smoke-c60fc032-7fee-4810-bc4e-4d799d2a1438 `
  -f previous_sandbox_render_smoke_run_id=rp-e2e-smoke-5a57ff5e-2017-4cf1-963b-703097fc9ec8
```

## Difference From The Synthetic Infrastructure Canary

The previous canary rendered synthetic Remotion content and proved the private Cloud Run, Remotion, GCS artifact, Supabase render/job metadata, and cleanup path. This canary adds a real uploaded source video object and verifies that the preview is rendered from that uploaded source, while still avoiding providers, Stripe, production, customer media, and queue drains.

## Pass Criteria

The gate passes only if:

- previous smoke leftover checks are clean before invocation;
- source and preview artifacts are smoke-scoped;
- render status reaches `preview_ready`;
- Cloud Run path is `/canary/render`;
- Remotion path is `renderMedia / bundle / selectComposition`;
- source and preview GCS artifacts are deleted;
- Supabase cleanup errors are empty;
- leftover records and leftover query errors are empty.
