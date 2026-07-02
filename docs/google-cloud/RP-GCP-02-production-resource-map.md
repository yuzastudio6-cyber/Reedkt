# RP-GCP-02 Production Resource Map

## Purpose

RP-GCP-02 records the real Google Cloud foundation resources created for ReeditPro production. This document stores resource names only and points to the typed backend contract for exact values.

This milestone does not deploy Cloud Run services or jobs, call providers, render media, process uploads, connect live Supabase code, or store real secret values.

## Project And Regions

- Project ID: `reeditpro`
- Primary runtime region: `us-east1`
- Secondary runtime region: `europe-west1`
- Artifact Registry repository: `reeditpro-runtime`

## Regional Runtime Policy

ReeditPro should route heavy work to the user's selected or inferred runtime region.

- US/default users: `us-east1`
- European users: `europe-west1`

Future runtime selection should prefer explicit workspace/project region settings. If not available, it may infer region from user location, timezone, organization settings, or upload bucket. The fallback region is `us-east1`.

Supabase remains the source of truth for users, workspaces, projects, approved plan snapshots, credit records, job metadata, previews, QA, revisions, exports, and audit events. Google Cloud handles heavy media storage, workers, provider gateway runtime, queues, topics, logs, and future rendering.

## Artifact Registry

Container image repository roots:

- `us-east1-docker.pkg.dev/reeditpro/reeditpro-runtime`
- `europe-west1-docker.pkg.dev/reeditpro/reeditpro-runtime`

No container images are required by RP-GCP-02.

## Storage

The production setup created regional buckets for these purposes in both runtime regions:

- source media
- generated assets
- processed media
- previews
- exports
- thumbnails
- QA artifacts
- worker temporary files

Canonical object paths should follow:

```text
workspaces/{workspaceId}/projects/{projectId}/...
```

Signed URLs are runtime access artifacts only. They must never become canonical database storage paths.

## Queues And Topics

The production setup created regional Cloud Tasks queues for provider calls, worker dispatch, render dispatch, webhooks, and status sync. Queue names are identical across regions; the selected runtime region determines which queue is used.

The production setup also created Pub/Sub topics for job, worker, provider, render, QA, and dead-letter events.

## Service Accounts

The production setup created separate service accounts for:

- API orchestration
- provider gateway
- signed URL service
- media analysis worker
- FFmpeg media worker
- audio SoundSync worker
- browser capture worker
- image asset worker
- AI video asset worker
- Remotion render worker
- QA worker
- export worker

Future IAM hardening should keep least-privilege boundaries. Do not collapse all workers into one broad service account.

## Secret References

Secret Manager placeholders were created for Supabase backend runtime values, provider credentials, webhook signing, and future billing integration. The exact reference names live in the typed resource map, including future backend-only SFX references `reeditpro-prod-mirelo-api-key` and `reeditpro-prod-mmaudio-api-key`.

Rules:

- Frontend code may not read server-side secret values.
- Database rows may store reference names only.
- Workers and backend services load secret values from Secret Manager at runtime.
- Logs must never contain raw secret values.

## Code Reference

The matching TypeScript resource map lives at:

```text
src/backend/cloud/reeditpro-gcp-production-resource-map.ts
```

Use it from backend/server/worker code only. Do not import server-only resource maps into browser UI code unless the import is type-only and contains no sensitive values.

## Next Milestone

Recommended next milestone:

```text
RP-GCP-03 — Runtime Config Adapter + Secret Version Setup Plan
```

RP-GCP-03 should add a backend-only runtime config adapter that can read these resource references and later load real secret values from Secret Manager inside Cloud Run. It should still avoid provider calls until Provider Gateway skeleton validation is complete.
