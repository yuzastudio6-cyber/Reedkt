# TRACKA-CAPTION-QUALITY-3R3 Private Artifact Manifest

Status: `blocked_approved_source_ref_access_failed`

## Local Bundle

localBundlePath: `/tmp/reeditpro-tracka-caption-quality-3r3/tracka-caption-quality-3r3-20260617T214049`

privateArtifactsCreated: true

privateVisualArtifactsCreated: false

gcsAccess: false

gcsAccessMode: `none`

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
| approved source local copy | `not_created` | `not_created` | `not_created` | `blocked_approved_source_ref_access_failed:.. ERROR: (gcloud.storage.cp) There was a problem refreshing your current auth tokens: Reauthentication failed. cannot prompt during non-interactive execution. Please run: $ gcloud auth login to obtain new credentials. If you have already logged in with a different account, run: $ gcloud config set account ACCOUNT to select an already authenticated account to use.` |
| corrected ASS sidecar | `/tmp/reeditpro-tracka-caption-quality-3r3/tracka-caption-quality-3r3-20260617T214049/tracka-caption-quality-3r3-corrected-caption.ass` | `97e6891ed389716bdf3da1aba6d65a862f9efa9d19c103093aa15d593678c787` | `1026` | `created` |
| corrected-caption preview MP4 | `not_created` | `not_created` | `not_created` | `not_created` |
| FFprobe metadata JSON | `not_created` | `not_created` | `not_created` | `not_created` |
| QA report JSON | `/tmp/reeditpro-tracka-caption-quality-3r3/tracka-caption-quality-3r3-20260617T214049/tracka-caption-quality-3r3-qa-report.json` | `3149584b331c247666da5a584ef5763687d16e02a05d9033129e2af872db02f9` | `9551` | `created` |
| artifact manifest JSON | `/tmp/reeditpro-tracka-caption-quality-3r3/tracka-caption-quality-3r3-20260617T214049/tracka-caption-quality-3r3-artifact-manifest.json` | `5bdd2ad9aa6fae12afd812d84df7d894ccb70adb64dc7a8c42b5275ecdcc387b` | `3751` | `created` |

## No-Scope Statement

No Supabase mutation, SQL execution, Secret Manager payload access, provider call, model call, worker execution, route execution, browser capture, signed URL creation, public artifact creation, credit mutation, Stripe checkout/webhook/payment processing, deployment, internal beta unlock, external beta unlock, production unlock, dependency mutation, raw prompt execution, final render/export, or broad service-role handler was enabled. Bounded Track A corrected-caption burn-in revalidation used only the approved #452 source ref, the approved #426 caption copy, and the approved #463 repo-owned FFmpeg/libass runtime path, producing private review artifacts only.
