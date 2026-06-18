# TRACKA-PRIVATE-E2E-REVALIDATION-1 Scope Contract

## Contract Status

scopeContractStatus: `restricted_private_e2e_revalidation_planning_ready`

sourceDecision: `#497`

captionPolicySource: `#492`

sourceRefSource: `#452`

runtimePathSource: `#463`

correctedCaptionEvidence: `#475`, `#488`

missingVisualEvidenceReview: `#434`

trackAInternalBetaUnlocked: false

## Included Scope Matrix

| Capability ID | Included | Required evidence before future execution |
| --- | --- | --- |
| `tracka_private_render_export_review_path` | yes | private review plan, manifest, QA report |
| `corrected_caption_burnin` | yes | #426 copy, #475/#488 corrected burn-in evidence |
| `caption_layout_policy` | yes | #492 configurable caption policy |
| `libass_caption_burnin_runtime` | yes | #463 approved repo-owned runtime path |
| `ffmpeg_ffprobe_private_validation` | yes | private FFprobe validation report in future execution packet |
| `remotion_private_preview_path` | conditional | only if current-source evidence is sufficient |
| `private_artifact_manifest_checksums_qa` | yes | manifest, checksum, QA report, private review bundle |

## Caption Layout Policy

defaultCaptionPreset: `one_line_bottom_safe_area`

defaultMaxLines: `1`

defaultPlacement: `bottom_center_safe_area`

defaultAvoidFaceObstruction: `true`

defaultSafeMarginsRequired: `true`

defaultTranscriptAccuracyClaim: `false`

configurablePresets: `one_line_bottom_safe_area`, `two_line_subtitle`, `auto_wrap_subtitle`, `creator_large_caption`, `lower_third_caption`, `manual_position_and_size`

## Excluded Scope Matrix

| Capability ID | Decision |
| --- | --- |
| `birefnet_text_behind_subject_masking` | `excluded_from_first_restricted_internal_beta` |
| `sam2_segmentation_runtime` | `excluded_from_first_restricted_internal_beta` |
| `real_esrgan_enhancement` | `excluded_from_first_restricted_internal_beta` |
| `film_interpolation_runtime` | `excluded_from_first_restricted_internal_beta` |
| `opencolorio_openimageio_production_color_management` | `deferred_from_first_restricted_internal_beta` |
| `broad_user_media` | `blocked` |
| `public_artifacts` | `blocked` |
| `signed_url_source_of_truth` | `blocked` |
| `final_delivery_export` | `blocked` |
| `external_beta` | `blocked` |
| `paid_production` | `blocked` |
| `production` | `blocked` |

## Contract Boundary

Future private E2E execution may be planned only by `TRACKA-PRIVATE-E2E-REVALIDATION-2`. That future packet must coordinate with Worker Runtime and Tool Route gates before execution. This scope contract does not authorize runtime execution, media processing, public artifacts, signed URLs, internal beta unlock, final delivery, external beta, paid production, or production.

## No-Scope Statement

No Supabase mutation, SQL execution, Secret Manager payload access, provider call, model call, worker execution, route execution, browser capture, signed URL creation, public artifact creation, credit mutation, Stripe checkout/webhook/payment processing, deployment, internal beta unlock, external beta unlock, production unlock, dependency mutation, raw prompt execution, final render/export, or broad service-role handler was enabled.
