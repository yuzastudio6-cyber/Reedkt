# TRACKA-CAPTION-QUALITY-5 Burn-In Revalidation Execution

Status: `completed_with_caption_layout_fix_revalidation`

## Execution

Run ID: `tracka-caption-quality-5-layout-fix-20260618T005301`

Execution: `completed_with_caption_layout_fix_revalidation`

Confirmation env: `REEDITPRO_CONFIRM_TRACKA_CAPTION_BURNIN_REVALIDATION=true`

Layout fix confirmation env: `REEDITPRO_CONFIRM_TRACKA_CAPTION_LAYOUT_FIX_REVALIDATION=true`

Source GCS read env: `REEDITPRO_CONFIRM_TRACKA_CAPTION_APPROVED_SOURCE_GCS_READ=true`

GCS access repair env: `REEDITPRO_CONFIRM_TRACKA_CAPTION_GCS_ACCESS_REPAIR=true` (optional legacy repair context)

Optional runtime image build env: `REEDITPRO_CONFIRM_TRACKA_CAPTION_RUNTIME_IMAGE_BUILD=true`

confirmationProvided: true

layoutFixConfirmationProvided: true

sourceGcsReadConfirmationProvided: true

gcsAccessRepairConfirmationProvided: false

gcsMetadataCheckStatus: `completed`

approvedSourceRef: `gs://reeditpro-staging-reeditpro-final-exports/activation-real-video/phase32/phase32-20260528T13330/color-corrected-export.mp4`

sourceRefApproved: true

approvedRuntimePath: `repo_owned_render_worker_ffmpeg_libass_runtime_path`

runtimePathApproved: true

captionBurninRevalidationExecuted: true

correctedCaptionVisualPreviewCreated: true

assSidecarCreated: true

approvedSourceCopied: true

libassBurninExecuted: true

remotionPreviewExecuted: false

ffmpegValidationExecuted: true

ffprobeValidationExecuted: true

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

productionReady: false

externalBetaReady: false

## Source-Of-Truth Audit

| PR | Merge SHA | Evidence |
| --- | --- | --- |
| #419 | `01e19cf6bd975b6ac9168c2d226638d211849886` | visual review outcome pass_with_warnings_sample_level |
| #422 | `cc49487f56e2c30f8f77af84b856da0453a07e1d` | visual gap closure packet |
| #426 | `58a3f87a6fc07e3afc6fb699c40c8b744cc75eab` | approved controlled-test caption source |
| #429 | `e4ccb582aadaa9e32607e5a1ae2bbec0719ddc1f` | missing visual evidence bundle |
| #434 | `2bb01b188aeb636c4234ecd4a9bf6a12ad87eee3` | missing visual evidence review outcome partial_pass_with_warnings |
| #440 | `ea238ad8ffc28c277ea36ba66b8488cb37cf66cc` | caption burn-in revalidation planning |
| #443 | `e268a9e8afd5360df91653e9d2c060c05e270e43` | guarded burn-in execution packet ready_for_guarded_execution |
| #447 | `ce4b2feac22247581ba361e71df33feb1e667507` | 3R failed closed on blocked_missing_approved_private_source_ref |
| #452 | `422bbcade670646963257f5b7b2ddc6681748f0b` | approved exact private controlled-test source ref |
| #459 | `1a52c5a604b175bbd95c8e96294d963636ee8db0` | 3R2 loaded approved source and failed closed on missing runtime path |
| #463 | `c2d40f1b6e32330142d5d6b74f18ee37050b4fe3` | approved repo-owned FFmpeg/libass runtime path |
| #475 | `374e1795d0a7a74d88517591349984ff1727429d` | completed corrected-caption burn-in execution |
| #484 | `cb974c7fe8c8350cfa7522ec7e736140af58583a` | fail_caption_layout_quality; caption style/layout fix required |

## Result

The guarded run used the approved #452 private source ref, the approved #426 controlled-test caption copy, and the approved #463 repo-owned Docker FFmpeg/libass runtime path to create a private layout-fixed corrected-caption preview and FFprobe metadata. The preview is private review evidence only and is not final delivery, internal beta, external beta, or production readiness.

## Layout Fix Profile

| Field | Value |
| --- | --- |
| layoutProfile | `tracka_caption_layout_fix_v1` |
| PlayResX | `2160` |
| PlayResY | `3840` |
| Alignment | `2` |
| MarginL | `190` |
| MarginR | `190` |
| MarginV | `250` |
| Fontsize | `132` |
| Outline | `6` |
| Shadow | `2` |
| Max lines | `2` |

## No-Scope Statement

No Supabase mutation, SQL execution, Secret Manager payload access, provider call, model call, worker execution, route execution, browser capture, signed URL creation, public artifact creation, credit mutation, Stripe checkout/webhook/payment processing, deployment, internal beta unlock, external beta unlock, production unlock, dependency mutation, raw prompt execution, final render/export, or broad service-role handler was enabled. Bounded Track A caption layout fix revalidation used only the approved #452 source ref, the approved #426 caption copy, and the approved #463 repo-owned FFmpeg/libass runtime path, producing private review artifacts only.
