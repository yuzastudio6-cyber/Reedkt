# TRACKA-CAPTION-SOURCE-REF-1 Candidate Matrix

Status: `approved`

## Candidate Matrix

| candidateId | source PRs | ref | classification | decision | rationale |
| --- | --- | --- | --- | --- | --- |
| `phase32_color_corrected_source_export` | #67, #75, #77, #80, #82 | `gs://reeditpro-staging-reeditpro-final-exports/activation-real-video/phase32/phase32-20260528T13330/color-corrected-export.mp4` | exact private `gs://` object candidate | `approved_after_metadata_stat` | repeatedly cited as the approved Phase 32 source; metadata/stat result recorded in this packet |
| `phase45a_libass_burnin_preview` | #75, #77, #429 | `gs://reeditpro-staging-reeditpro-previews/activation-render-hardening/phase45a/phase45a-20260531T19033/preview/libass-burnin-preview.mp4` | old-caption rendered output | `rejected_old_caption_burned_output` | already contains historical caption burn-in evidence and must not be used as corrected-caption source |
| `phase45b_remotion_render_preview` | #75, #77, #429 | `gs://reeditpro-staging-reeditpro-previews/activation-render-hardening/phase45b/phase45b-20260531T19552/preview/remotion-render-preview.mp4` | old-caption rendered output | `rejected_old_caption_burned_output` | rendered preview evidence, not a clean source sample |
| `phase45d_hardened_review_export` | #80, #82, #429 | `gs://reeditpro-staging-reeditpro-final-exports/activation-render-hardening/phase45d/phase45d-20260531T22235/review/hardened-review-export.mp4` | old-caption/private review export | `rejected_old_caption_burned_output` | review export evidence, not a clean corrected-caption source input |
| `phase45c_otio_timeline` | #77, #429 | `gs://reeditpro-staging-reeditpro-generated-assets/activation-render-hardening/phase45c/phase45c-20260531T20404/timeline/opentimelineio-timeline.json` | exact nonvisual metadata ref | `rejected_nonvisual_metadata_ref` | timeline proof cannot be used as media source |
| `phase45e_e2e_manifest` | #82, #429 | `gs://reeditpro-staging-reeditpro-generated-assets/activation-render-hardening/phase45e/phase45e-20260531T23580/review/e2e-review-manifest.json` | exact nonvisual metadata ref | `rejected_nonvisual_metadata_ref` | manifest proof cannot be used as media source |
| `phase40d_contact_sheet` | #68, #429 | `gs://reeditpro-staging-reeditpro-previews/activation-pro-color-image/phase40d/phase40d-20260531T12493/contact-sheet/pro-color-image-feature-contact-sheet.png` | still review artifact | `rejected_review_artifact_not_source` | image contact sheet is visual evidence, not a source video ref |
| `current_source_bundle_2_visual_files` | #411, #429 | local copied review files under `/tmp` | local review artifacts | `rejected_local_review_artifacts` | local review files are not private source refs and must not become source-of-truth |

## Rejection Rules

- old-caption-burned outputs are rejected as source.
- rendered previews are rejected as source.
- final review exports are rejected as source for corrected-caption revalidation unless a later owner explicitly approves them as source inputs; this packet does not.
- nonvisual JSON metadata refs are rejected as source.
- prefix-only refs are rejected until narrowed to an exact object.
- public URLs and signed URLs are rejected.
- arbitrary user media is rejected.

## Candidate Status

approvedPrivateSourceRefStatus: `approved`

preferredCandidate: `phase32_color_corrected_source_export`

selectedApprovedCandidate: `phase32_color_corrected_source_export`

sourceRefApproved: true

## No-Scope Statement

No Supabase mutation, SQL execution, Secret Manager payload access, provider call, model call, worker execution, route execution, browser capture, signed URL creation, public artifact creation, credit mutation, Stripe checkout/webhook/payment processing, deployment, internal beta unlock, external beta unlock, production unlock, dependency mutation, raw prompt execution, final render/export, or broad service-role handler was enabled.
