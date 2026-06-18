# Track A Restricted Beta Included Capabilities

## Included Capability Matrix

| Capability ID | Decision | Evidence | Boundary |
| --- | --- | --- | --- |
| `tracka_private_render_export_review_path` | `included_for_restricted_internal_beta_planning` | Track A render/export study, #475, #488, #492 | private review only; no final delivery |
| `corrected_caption_burnin` | `included_for_restricted_internal_beta_planning` | #426 approved caption copy, #475 corrected burn-in, #488 layout fix, #492 layout acceptance | controlled/private review path only; no transcript accuracy claim |
| `caption_layout_policy` | `included_for_restricted_internal_beta_planning` | #492 configurable caption policy | default `one_line_bottom_safe_area`; production/final delivery blocked |
| `libass_caption_burnin_runtime` | `included_for_restricted_internal_beta_planning` | #463 runtime path, #475 and #488 execution evidence | private Track A sample only |
| `ffmpeg_ffprobe_private_validation` | `included_for_restricted_internal_beta_planning` | #463 runtime path, #475 and #488 validation evidence | private metadata/QA only |
| `remotion_private_preview_path` | `included_if_current_source_evidence_sufficient` | earlier Track A visual review chain and private preview evidence | private preview only; no public artifact or final delivery |
| `private_artifact_manifest_checksums_qa` | `included_for_restricted_internal_beta_planning` | #429 bundle evidence, #475/#488 manifests, checksums, QA reports | private GCS/local artifacts only; no public delivery |

## Caption Policy Required For Included Scope

defaultCaptionPreset: `one_line_bottom_safe_area`

defaultMaxLines: `1`

defaultPlacement: `bottom_center_safe_area`

defaultAvoidFaceObstruction: `true`

defaultSafeMarginsRequired: `true`

defaultTranscriptAccuracyClaim: `false`

configurablePresets: `one_line_bottom_safe_area`, `two_line_subtitle`, `auto_wrap_subtitle`, `creator_large_caption`, `lower_third_caption`, `manual_position_and_size`

## Included-Scope Handoff

The next Track A private E2E revalidation packet may plan only the included capabilities above. It must preserve private-only artifacts, manifests, checksums, QA reports, caption policy evidence, FFprobe validation evidence, human/AI visual review records, observability/cost notes, and compliance/privacy notes.

## Readiness

trackARestrictedInternalBetaScopeDecision: `approved_for_private_e2e_revalidation_planning`

trackAPrivateE2ERevalidationPlanningReady: true

TRACKA-PRIVATE-E2E-REVALIDATION-1 readiness: `ready`

trackAInternalBetaUnlocked: false

## No-Scope Statement

No Supabase mutation, SQL execution, Secret Manager payload access, provider call, model call, worker execution, route execution, browser capture, signed URL creation, public artifact creation, credit mutation, Stripe checkout/webhook/payment processing, deployment, internal beta unlock, external beta unlock, production unlock, dependency mutation, raw prompt execution, final render/export, or broad service-role handler was enabled.
