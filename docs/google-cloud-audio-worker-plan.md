# Google Cloud Audio Worker Plan

## Purpose

This document describes the future Google Cloud runtime for ReeditPro SoundSync music generation. The current repository only contains mock/local worker skeletons. Nothing in this plan deploys cloud resources or stores secrets.

## Future Runtime Shape

The future Lyria Pro worker can run as either:

- Cloud Run Job for queued generation work
- Cloud Run service for controlled backend-triggered generation
- Pub/Sub-triggered worker after a generation job is queued

The worker receives a job ID and generation request ID, then loads the rest of its context from the secure backend database.

## Future Flow

1. User approves the music plan and music credit estimate in chat.
2. Backend reserves credits.
3. Backend creates a Lyria music generation request.
4. Backend creates a `soundsync_generation` job for the Lyria worker.
5. Cloud Run worker starts with job context only.
6. Worker loads approved cue, prompt plan, generation request, and credit reservation from Supabase using a backend service role.
7. Worker validates the approval and credit gate.
8. Worker loads Lyria credentials through Secret Manager.
9. Worker calls Lyria Pro in the future.
10. Worker writes generated audio to Cloud Storage.
11. Worker creates generated music track and generated asset records.
12. Worker runs Music QA and mix planning.
13. Worker updates job events and status.
14. If generation fails, backend handles refund/release according to credit policy.

## Future Google Cloud Components

- Cloud Run service or Cloud Run Job
- Pub/Sub topic or task queue for job start events
- Cloud Storage bucket for generated audio assets
- Secret Manager reference for Lyria or Google API access
- Artifact Registry container for worker image
- Supabase service-role backend runtime
- job events and heartbeat records
- generated asset records

## Secrets Rule

Secrets must never be exposed to the frontend, committed to the repo, or stored as raw database values. The database may store secret reference names only.

Placeholder variables for future local configuration:

```text
GOOGLE_CLOUD_PROJECT_ID=
GOOGLE_CLOUD_REGION=
GOOGLE_CLOUD_STORAGE_BUCKET=
GOOGLE_SECRET_LYRIA_API_KEY_NAME=
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
```

Do not commit real values for any of these variables.

## Approval And Credit Gate

The worker must not generate audio unless:

- music cue exists
- Lyria prompt plan exists
- generation request is approved or queued
- credit reservation exists
- credits are reserved
- prompt policy is compatible with the cue

If any gate fails, the worker should mark the job blocked or failed and avoid any provider call.

## Output Storage

Future real outputs should be stored in Cloud Storage with generated asset records that point to secure storage paths. Public URLs or signed URLs should be produced only by backend-controlled preview/export flows.

The current mock worker uses `mock://generated-audio/...` paths and creates no files.

## QA Before Use

Music generation does not mean music is ready. The worker must route the generated asset through:

- track analysis
- Music QA
- mix/ducking planning
- regeneration decision if QA fails

Preview and render systems should only use tracks that pass QA or have an approved mix adjustment.

## What Is Still Mock-Only

- no Cloud Run deployment
- no Pub/Sub
- no Secret Manager access
- no Google SDK imports
- no Lyria API call
- no Cloud Storage write
- no Supabase remote connection
- no real credit spend or refund
