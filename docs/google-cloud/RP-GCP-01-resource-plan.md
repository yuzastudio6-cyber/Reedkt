# RP-GCP-01 Resource Plan

## Purpose

This is a future Google Cloud resource plan only. It is not an executable deployment guide and includes no IAM commands, `gcloud` commands, credentials, or resource creation.

## Future Cloud Run Services

| Service | Intent |
| --- | --- |
| `api-orchestrator-service` | Authenticated orchestration API. Loads Supabase context, validates approvals/credits/dependencies, queues future jobs, and writes events. |
| `provider-gateway-service` | Server-side gateway for future provider calls. Reads provider secrets from Secret Manager and enforces tier/model/fallback rules. |
| `signed-url-service` | Creates short-lived signed URLs for authorized users/workers without storing signed URLs as canonical database state. |

## Future Cloud Run Jobs

| Job | Intent |
| --- | --- |
| `media-analysis-worker-job` | Future transcript, visual, and audio analysis after source media is available. |
| `ffmpeg-media-worker-job` | Future LGPL-reviewed ingest, trim, transcode, audio extraction, and export processing. |
| `audio-soundsync-worker-job` | Future SoundSync analysis, cue planning, mix prep, music fit, and audio QA. |
| `browser-capture-worker-job` | Future user-authorized website/app capture and browser QA. |
| `image-asset-worker-job` | Future still/keyframe/card asset generation or processing. |
| `ai-video-asset-worker-job` | Future Wan/Hailuo/Premium fallback Veo asset generation under approved policy. |
| `remotion-render-worker-job` | Future Remotion composition and render execution. |
| `qa-worker-job` | Future automated QA checks for timing, captions, render integrity, policy, and user intent. |
| `export-worker-job` | Future export packaging after render/preview/QA/export gates. |

## Future GCS Buckets

| Bucket | Purpose | Default Access |
| --- | --- | --- |
| `reeditpro-prod-source-media` | Uploaded/source media | Private |
| `reeditpro-prod-generated-assets` | Generated images, clips, cards, overlays, specs | Private |
| `reeditpro-prod-processed-media` | Trimmed, transcoded, cleaned, or normalized assets | Private |
| `reeditpro-prod-previews` | Preview renders | Private |
| `reeditpro-prod-exports` | Final exports and variants | Private |
| `reeditpro-prod-thumbnails` | Thumbnails and lightweight preview imagery | Private |
| `reeditpro-prod-qa-artifacts` | QA frames, reports, logs, and inspection artifacts | Private |
| `reeditpro-prod-worker-temp` | Temporary worker intermediates | Private, lifecycle-managed |

Canonical object paths should follow:

`workspaces/{workspaceId}/projects/{projectId}/...`

## Other Future Services

- Secret Manager for Supabase service-role key, provider keys, webhook secrets, and service config.
- Artifact Registry for API and worker container images.
- Workflows for higher-level orchestration when a multi-step chain needs a durable state machine.
- Cloud Tasks for idempotent HTTP job dispatch and retry.
- Pub/Sub for event-driven fanout where useful.
- Cloud Logging for sanitized service and worker logs.
- Cloud Monitoring for service health, queues, latency, errors, and worker outcomes.

## Future Service Accounts

| Service Account | Least-Privilege Intent |
| --- | --- |
| `sa-api-orchestrator` | Read/write approved orchestration records, queue jobs, read required Secret Manager references, no provider keys unless needed. |
| `sa-provider-gateway` | Read provider secrets, write generation status/events, read approved context, no broad storage admin. |
| `sa-signed-url-service` | Generate short-lived signed URLs for allowed buckets/objects, no provider secrets. |
| `sa-media-analysis-worker` | Read source media, write analysis metadata/artifacts, update job events. |
| `sa-ffmpeg-media-worker` | Read source/processed media, write processed media/temp/export artifacts, update job events. |
| `sa-audio-soundsync-worker` | Read source/processed audio, write SoundSync/audio artifacts, update job events. |
| `sa-browser-capture-worker` | Write authorized capture artifacts, update job events, no provider secrets by default. |
| `sa-image-asset-worker` | Read approved inputs and image provider references, write generated image assets, update generation events. |
| `sa-ai-video-asset-worker` | Read approved inputs and video provider references, write generated video assets, update generation events. |
| `sa-remotion-render-worker` | Read source/generated/processed media, write previews/exports/temp artifacts, update render events. |
| `sa-qa-worker` | Read render/assets/QA artifacts, write QA reports/artifacts, update job events. |
| `sa-export-worker` | Read approved final render assets, write export variants, update export records. |

No real IAM bindings are added in RP-GCP-01. Exact roles must be reviewed in a later deployment milestone.

