# TRACKA-CAPTION-QUALITY-5 Private Artifact Manifest

Status: `completed_with_caption_layout_fix_revalidation`

## Local Bundle

localBundlePath: `/tmp/reeditpro-tracka-caption-quality-5/tracka-caption-quality-5-layout-fix-20260618T005301`

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
| approved source local copy | `/tmp/reeditpro-tracka-caption-quality-5/tracka-caption-quality-5-layout-fix-20260618T005301/tracka-caption-quality-5-approved-source.mp4` | `78bd798602d221b894a60dfa34ed1528602c9ece7f657e3f9bbea7fd071cc7fa` | `94522751` | `created` |
| corrected ASS sidecar | `/tmp/reeditpro-tracka-caption-quality-5/tracka-caption-quality-5-layout-fix-20260618T005301/tracka-caption-quality-5-layout-fixed-caption.ass` | `1d1a1e72ab89fb6ee1b648ee386925ef92c613132bf2837d547a6903e8dbcd55` | `1065` | `created` |
| layout-fixed corrected-caption preview MP4 | `/tmp/reeditpro-tracka-caption-quality-5/tracka-caption-quality-5-layout-fix-20260618T005301/tracka-caption-quality-5-layout-fixed-caption-preview.mp4` | `150dc68a935c90083f49f6ad329a073c4d1d14dc216c20fe0bb05aa764add02a` | `61220071` | `created` |
| FFprobe metadata JSON | `/tmp/reeditpro-tracka-caption-quality-5/tracka-caption-quality-5-layout-fix-20260618T005301/tracka-caption-quality-5-ffprobe.json` | `75c1913fa5f3ff105b5e0fa7d361478cc87651a98e60e63c69ac3487cf466ca1` | `4338` | `created` |
| QA report JSON | `/tmp/reeditpro-tracka-caption-quality-5/tracka-caption-quality-5-layout-fix-20260618T005301/tracka-caption-quality-5-qa-report.json` | `e301384d33eac53544f16a8c2a5c69cb2bb337dc22f626684c45a594ca4ba363` | `10415` | `created` |
| artifact manifest JSON | `/tmp/reeditpro-tracka-caption-quality-5/tracka-caption-quality-5-layout-fix-20260618T005301/tracka-caption-quality-5-artifact-manifest.json` | `4a1778e2db3c7c6a3d223ea717d7071e07f76acddbd5f50e21ebf7841edd7abd` | `4749` | `created` |

## No-Scope Statement

No Supabase mutation, SQL execution, Secret Manager payload access, provider call, model call, worker execution, route execution, browser capture, signed URL creation, public artifact creation, credit mutation, Stripe checkout/webhook/payment processing, deployment, internal beta unlock, external beta unlock, production unlock, dependency mutation, raw prompt execution, final render/export, or broad service-role handler was enabled. Bounded Track A caption layout fix revalidation used only the approved #452 source ref, the approved #426 caption copy, and the approved #463 repo-owned FFmpeg/libass runtime path, producing private review artifacts only.
