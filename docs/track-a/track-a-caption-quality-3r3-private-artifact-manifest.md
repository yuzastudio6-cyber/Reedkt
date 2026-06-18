# TRACKA-CAPTION-QUALITY-3R3 Private Artifact Manifest

Status: `completed_with_corrected_caption_burnin_revalidation`

## Local Bundle

localBundlePath: `/tmp/reeditpro-tracka-caption-quality-3r3/tracka-caption-quality-3r3-gcs-auth1-20260617T225221`

privateArtifactsCreated: true

privateVisualArtifactsCreated: true

gcsAccess: true

gcsAccessMode: `exact_private_source_read_copy_only`

## GCS Source Access Classification

| Field | Value |
| --- | --- |
| confirmationProvided | `true` |
| metadataCheckExecuted | `true` |
| status | `completed` |
| approvedSourceRef | `gs://reeditpro-staging-reeditpro-final-exports/activation-real-video/phase32/phase32-20260528T13330/color-corrected-export.mp4` |
| objectMetadataMatched | `true` |
| gcloudAccount | `aiediting@reeditpro.com` |
| gcloudProject | `reeditpro` |
| activeAccount | `aiediting@reeditpro.com` |
| detail | `exact approved source metadata check passed` |

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
| approved source local copy | `/tmp/reeditpro-tracka-caption-quality-3r3/tracka-caption-quality-3r3-gcs-auth1-20260617T225221/tracka-caption-quality-3r3-approved-source.mp4` | `78bd798602d221b894a60dfa34ed1528602c9ece7f657e3f9bbea7fd071cc7fa` | `94522751` | `created` |
| corrected ASS sidecar | `/tmp/reeditpro-tracka-caption-quality-3r3/tracka-caption-quality-3r3-gcs-auth1-20260617T225221/tracka-caption-quality-3r3-corrected-caption.ass` | `97e6891ed389716bdf3da1aba6d65a862f9efa9d19c103093aa15d593678c787` | `1026` | `created` |
| corrected-caption preview MP4 | `/tmp/reeditpro-tracka-caption-quality-3r3/tracka-caption-quality-3r3-gcs-auth1-20260617T225221/tracka-caption-quality-3r3-corrected-caption-preview.mp4` | `ad3557848ae1b23d6767b99a6e27ffa40bdd4ba5bb47c15a13c1e0f74e1b947b` | `53919506` | `created` |
| FFprobe metadata JSON | `/tmp/reeditpro-tracka-caption-quality-3r3/tracka-caption-quality-3r3-gcs-auth1-20260617T225221/tracka-caption-quality-3r3-ffprobe.json` | `e2f2976859033261ffc83fa2a87acdd86c884e37afbc20de4f477c678e902562` | `4337` | `created` |
| QA report JSON | `/tmp/reeditpro-tracka-caption-quality-3r3/tracka-caption-quality-3r3-gcs-auth1-20260617T225221/tracka-caption-quality-3r3-qa-report.json` | `83a7d92b95e069fb867195bddd435c25053d9ee5bf83d822d1e8e1b641796b63` | `9916` | `created` |
| artifact manifest JSON | `/tmp/reeditpro-tracka-caption-quality-3r3/tracka-caption-quality-3r3-gcs-auth1-20260617T225221/tracka-caption-quality-3r3-artifact-manifest.json` | `69a95201e9a580f6dc8686ebf8668eed0b6f4f81a882ef63d3cc454d3816c89d` | `4663` | `created` |

## No-Scope Statement

No Supabase mutation, SQL execution, Secret Manager payload access, provider call, model call, worker execution, route execution, browser capture, signed URL creation, public artifact creation, credit mutation, Stripe checkout/webhook/payment processing, deployment, internal beta unlock, external beta unlock, production unlock, dependency mutation, raw prompt execution, final render/export, or broad service-role handler was enabled. Bounded Track A corrected-caption burn-in revalidation used only the approved #452 source ref, the approved #426 caption copy, and the approved #463 repo-owned FFmpeg/libass runtime path, producing private review artifacts only.
