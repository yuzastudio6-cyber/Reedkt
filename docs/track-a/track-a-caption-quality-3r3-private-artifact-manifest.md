# TRACKA-CAPTION-QUALITY-3R3 Private Artifact Manifest

Status: `blocked_gcloud_auth_refresh_required`

## Local Bundle

localBundlePath: `/tmp/reeditpro-tracka-caption-quality-3r3/tracka-caption-quality-3r3-gcs-auth1-20260617T221541`

privateArtifactsCreated: true

privateVisualArtifactsCreated: false

gcsAccess: false

gcsAccessMode: `none`

## GCS Source Access Classification

| Field | Value |
| --- | --- |
| confirmationProvided | `true` |
| metadataCheckExecuted | `true` |
| status | `blocked_gcloud_auth_refresh_required` |
| approvedSourceRef | `gs://reeditpro-staging-reeditpro-final-exports/activation-real-video/phase32/phase32-20260528T13330/color-corrected-export.mp4` |
| objectMetadataMatched | `false` |
| gcloudAccount | `aiediting@reeditpro.com` |
| gcloudProject | `reeditpro` |
| activeAccount | `aiediting@reeditpro.com` |
| detail | `ERROR: (gcloud.storage.ls) There was a problem refreshing your current auth tokens: Reauthentication failed. cannot prompt during non-interactive execution. Please run: $ gcloud auth login to obtain new credentials. If you have already logged in with a different account, run: $ gcloud config set account ACCOUNT to select an already authenticated account to use.` |

signedUrlsCreated: false

publicArtifactsCreated: false

finalDeliveryReady: false

internalBetaReady: false

## Runtime

| Field | Value |
| --- | --- |
| runtimePathStatus | `approved_repo_owned_ffmpeg_libass_metadata_only` |
| approvedRuntimePath | `repo_owned_render_worker_ffmpeg_libass_runtime_path` |
| runtimeSourceProvenance | `docker/prod/render-worker/Dockerfile` |
| runtimeImageTag | `reeditpro-tracka-caption-runtime-path-check:local` |
| ffmpegPath | `docker://docker/prod/render-worker/Dockerfile#ffmpeg` |
| ffprobePath | `docker://docker/prod/render-worker/Dockerfile#ffprobe` |
| assFilterPresent | `true` |
| subtitlesFilterPresent | `true` |
| libassIndicated | `true` |

## Artifacts

| Artifact | Path | SHA-256 | Size bytes | Status |
| --- | --- | --- | --- | --- |
| approved source local copy | `not_created` | `not_created` | `not_created` | `blocked_gcloud_auth_refresh_required` |
| corrected ASS sidecar | `/tmp/reeditpro-tracka-caption-quality-3r3/tracka-caption-quality-3r3-gcs-auth1-20260617T221541/tracka-caption-quality-3r3-corrected-caption.ass` | `97e6891ed389716bdf3da1aba6d65a862f9efa9d19c103093aa15d593678c787` | `1026` | `created` |
| corrected-caption preview MP4 | `not_created` | `not_created` | `not_created` | `not_created` |
| FFprobe metadata JSON | `not_created` | `not_created` | `not_created` | `not_created` |
| QA report JSON | `/tmp/reeditpro-tracka-caption-quality-3r3/tracka-caption-quality-3r3-gcs-auth1-20260617T221541/tracka-caption-quality-3r3-qa-report.json` | `3011058e20f98e75dd033851709744b8f30435f6434d7f91df70936d17b7b485` | `10030` | `created` |
| artifact manifest JSON | `/tmp/reeditpro-tracka-caption-quality-3r3/tracka-caption-quality-3r3-gcs-auth1-20260617T221541/tracka-caption-quality-3r3-artifact-manifest.json` | `e74ecd50fd1688a29bb98850032679108a2909484bd5e8d3c57b75beba0935f0` | `4262` | `created` |

## No-Scope Statement

No Supabase mutation, SQL execution, Secret Manager payload access, provider call, model call, worker execution, route execution, browser capture, signed URL creation, public artifact creation, credit mutation, Stripe checkout/webhook/payment processing, deployment, internal beta unlock, external beta unlock, production unlock, dependency mutation, raw prompt execution, final render/export, or broad service-role handler was enabled. Bounded Track A corrected-caption burn-in revalidation used only the approved #452 source ref, the approved #426 caption copy, and the approved #463 repo-owned FFmpeg/libass runtime path, producing private review artifacts only.
