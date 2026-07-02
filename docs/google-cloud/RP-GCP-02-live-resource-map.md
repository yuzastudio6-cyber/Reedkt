# RP-GCP-02 Live Resource Map

## Purpose

This document records the real Google Cloud resource names created by the RP-GCP-01 foundation setup for the `reeditpro` project.

This is a configuration/reference document only. It does not contain secrets, API keys, signed URLs, service-role values, provider credentials, deployment commands, provider calls, rendering execution, or Cloud Run service definitions.

## Project

- Project ID: `reeditpro`
- Project number observed in setup logs: `390722338345`
- Environment: `production`

## Regions

Primary runtime regions:

- US: `us-east1`
- Europe: `europe-west1`

Future global-ready behavior:

- Users should be routed to the nearest healthy runtime region.
- Heavy media, generated assets, previews, exports, QA artifacts, and worker temporary files should stay in the selected runtime region.
- Supabase remains the source of truth for project/job/approval/credit metadata.
- Google Cloud handles region-local heavy media and worker execution.

## Artifact Registry

Docker repositories:

| Region | Repository |
| --- | --- |
| `us-east1` | `reeditpro-runtime` |
| `europe-west1` | `reeditpro-runtime` |

## Service Accounts

| Service Account | Purpose |
| --- | --- |
| `sa-api-orchestrator@reeditpro.iam.gserviceaccount.com` | API orchestration, job creation, approval/credit checks, event publishing. |
| `sa-provider-gateway@reeditpro.iam.gserviceaccount.com` | Future provider gateway; provider secret access and provider event updates. |
| `sa-signed-url-service@reeditpro.iam.gserviceaccount.com` | Future short-lived upload/download URL generation. |
| `sa-media-analysis-worker@reeditpro.iam.gserviceaccount.com` | Future media analysis worker. |
| `sa-ffmpeg-media-worker@reeditpro.iam.gserviceaccount.com` | Future FFmpeg/media preprocessing worker. |
| `sa-audio-soundsync-worker@reeditpro.iam.gserviceaccount.com` | Future SoundSync/audio worker. |
| `sa-browser-capture-worker@reeditpro.iam.gserviceaccount.com` | Future user-authorized browser/app capture worker. |
| `sa-image-asset-worker@reeditpro.iam.gserviceaccount.com` | Future still/keyframe/card image asset worker. |
| `sa-ai-video-asset-worker@reeditpro.iam.gserviceaccount.com` | Future Wan/Hailuo/Premium fallback video asset worker. |
| `sa-remotion-render-worker@reeditpro.iam.gserviceaccount.com` | Future Remotion render worker. |
| `sa-qa-worker@reeditpro.iam.gserviceaccount.com` | Future QA worker. |
| `sa-export-worker@reeditpro.iam.gserviceaccount.com` | Future final export worker. |

## GCS Buckets

### US — `us-east1`

| Purpose | Bucket |
| --- | --- |
| Source media | `reeditpro-prod-reeditpro-us-east1-source-media` |
| Generated assets | `reeditpro-prod-reeditpro-us-east1-generated-assets` |
| Processed media | `reeditpro-prod-reeditpro-us-east1-processed-media` |
| Preview renders | `reeditpro-prod-reeditpro-us-east1-previews` |
| Final exports | `reeditpro-prod-reeditpro-us-east1-exports` |
| Thumbnails | `reeditpro-prod-reeditpro-us-east1-thumbnails` |
| QA artifacts | `reeditpro-prod-reeditpro-us-east1-qa-artifacts` |
| Worker temp | `reeditpro-prod-reeditpro-us-east1-worker-temp` |

### Europe — `europe-west1`

| Purpose | Bucket |
| --- | --- |
| Source media | `reeditpro-prod-reeditpro-europe-west1-source-media` |
| Generated assets | `reeditpro-prod-reeditpro-europe-west1-generated-assets` |
| Processed media | `reeditpro-prod-reeditpro-europe-west1-processed-media` |
| Preview renders | `reeditpro-prod-reeditpro-europe-west1-previews` |
| Final exports | `reeditpro-prod-reeditpro-europe-west1-exports` |
| Thumbnails | `reeditpro-prod-reeditpro-europe-west1-thumbnails` |
| QA artifacts | `reeditpro-prod-reeditpro-europe-west1-qa-artifacts` |
| Worker temp | `reeditpro-prod-reeditpro-europe-west1-worker-temp` |

Canonical object paths should keep using:

```text
workspaces/{workspaceId}/projects/{projectId}/...
```

Do not store signed URLs as canonical storage paths. Store bucket + object path only.

## Secret Manager Placeholders

These secrets exist as empty or placeholder Secret Manager resources. Raw secret values must be added separately and never committed to the repo.

| Secret Name | Purpose |
| --- | --- |
| `reeditpro-prod-supabase-url` | Server-side Supabase URL reference. |
| `reeditpro-prod-supabase-service-role-key` | Server-only Supabase service-role key. Never frontend. |
| `reeditpro-prod-openai-api-key` | Future OpenAI / image route key. |
| `reeditpro-prod-wan-api-key` | Future Wan provider key. |
| `reeditpro-prod-hailuo-api-key` | Future Hailuo provider key. |
| `reeditpro-prod-veo-vertex-config` | Future Veo/Vertex config. |
| `reeditpro-prod-lyria-api-key` | Future Lyria/SoundSync music generation key. |
| `reeditpro-prod-mirelo-api-key` | Future Mirelo SFX V1.5 provider key reference. Backend/worker only. |
| `reeditpro-prod-mmaudio-api-key` | Future MMAudio V2 provider key reference. Backend/worker only. |
| `reeditpro-prod-provider-webhook-signing-secret` | Future provider webhook verification secret. |
| `reeditpro-prod-stripe-webhook-secret` | Future Stripe webhook secret placeholder. |

## Pub/Sub Topics

| Topic |
| --- |
| `projects/reeditpro/topics/reeditpro-job-events` |
| `projects/reeditpro/topics/reeditpro-worker-events` |
| `projects/reeditpro/topics/reeditpro-provider-events` |
| `projects/reeditpro/topics/reeditpro-render-events` |
| `projects/reeditpro/topics/reeditpro-qa-events` |
| `projects/reeditpro/topics/reeditpro-dead-letter` |

## Cloud Tasks Queues

The same queue names exist in both `us-east1` and `europe-west1`.

| Queue | Regions |
| --- | --- |
| `reeditpro-provider-calls` | `us-east1`, `europe-west1` |
| `reeditpro-worker-dispatch` | `us-east1`, `europe-west1` |
| `reeditpro-render-dispatch` | `us-east1`, `europe-west1` |
| `reeditpro-webhooks` | `us-east1`, `europe-west1` |
| `reeditpro-status-sync` | `us-east1`, `europe-west1` |

## Runtime Selection Rule

Future backend/orchestrator code should resolve a runtime region before creating worker jobs.

Initial region policy:

```text
preferred_region = user/workspace/project setting if present
else us-east1 by default
else europe-west1 when user/workspace/audience is EU-focused
```

The selected runtime region controls:

- Cloud Tasks queue location
- Cloud Run service/job target region
- GCS bucket names
- Artifact Registry image region
- worker temp bucket
- preview/export bucket

## Safety Rules

- Frontend never receives service-role keys, provider keys, raw secrets, signed URLs as canonical data, or worker credentials.
- Workers execute approved snapshots, not raw chat.
- Expensive work requires an approved plan, approved credit estimate, and reserved credits.
- Provider keys live in Secret Manager only.
- Browser capture must be user-authorized and must not bypass authentication, paywalls, CAPTCHAs, robots, rate limits, or site restrictions.
- AI APIs and Remotion rendering are not implemented by this resource map.
