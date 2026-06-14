# Track A Visual Review Artifact Bundle 2 Allowlist

Status: `completed_with_expanded_historical_visual_allowlist`

Bundle ID: `tracka-visual-review-artifact-bundle2-20260613T215327`

Source refs are limited to already-recorded Track A evidence from #390, #393, #400, #403, #408, #411, and historical Track A PR bodies #18, #19, #21, #25, #26, #30, #34, #42, #43, #60, #65, #67, #68, #73, #75, #77, #80, #82, and #83.

## Allowlist Summary

- exact visual object allowlist: `14`
- bounded prefix discovery allowlist: `7`
- rejected nonvisual metadata refs: `12`
- rejected missing refs: `1`
- rejected public or signed URL refs: `0`
- rejected broad prefixes: `0`
- copied visual artifacts: `10`
- historical PR body refs discovered: `53`

## Exact Object Allowlist

Expanded historical PR discovery found exact private visual object refs. Every copied object was metadata-checked, size-checked, extension-checked, and copied only to the local `/tmp` bundle.

| groupId | capability | source | operation | safety reason |
| --- | --- | --- | --- | --- |
| `tracka-bundle-birefnet-masking` | `birefnet_masking` | #34 exact frame PNG | `copy_if_small_visual_file` | exact private Track A visual object |
| `tracka-bundle-full-visual-video-private-e2e` | `full_visual_video_private_e2e` | #42 exact Phase 32 MP4 | `copy_if_small_visual_file` | rejected at copy time as `needs_smaller_review_sample` |
| `tracka-bundle-sam2-segmentation` | `sam2_segmentation` | #43 exact Phase 32 MP4 | `copy_if_small_visual_file` | skipped after group copy cap filled by frame PNGs |
| `tracka-bundle-film-interpolation` | `film_interpolation` | #60 exact FILM preview MP4 and Phase 32 MP4 | `copy_if_small_visual_file` | copied FILM preview; Phase 32 MP4 too large |
| `tracka-bundle-kornia-pro-color-image` | `kornia_pro_color_image` | #68 exact contact sheet PNG | `copy_if_small_visual_file` | exact private Track A visual object |
| `tracka-bundle-libass-caption-burnin` | `libass_caption_burnin` | #73 exact libass preview MP4 and Phase 32 MP4 | `copy_if_small_visual_file` | copied libass preview; Phase 32 MP4 too large |
| `tracka-bundle-remotion-render-preview` | `remotion_render_preview` | #75 exact Remotion preview MP4 and Phase 32 MP4 | `copy_if_small_visual_file` | copied Remotion preview; Phase 32 MP4 too large |
| `tracka-bundle-opentimelineio-validation` | `opentimelineio_validation` | #77 exact Phase 32 MP4 | `copy_if_small_visual_file` | rejected at copy time as `needs_smaller_review_sample` |
| `tracka-bundle-ffprobe-export-validation` | `ffprobe_export_validation` | #80 exact hardened review export MP4 and Phase 32 MP4 | `copy_if_small_visual_file` | copied hardened review export; Phase 32 MP4 too large |
| `tracka-bundle-ffmpeg-render-hardening` | `ffmpeg_render_hardening` | #82 exact hardened review export MP4 | `copy_if_small_visual_file` | exact private Track A visual object |

## Bounded Prefix Discovery Allowlist

| groupId | capability | prefix | source | allowed operation | max listed objects | max copied files per group | max file bytes | total bundle bytes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `tracka-bundle-remotion-render-preview` | `remotion_render_preview` | `gs://reeditpro-staging-reeditpro-qa-artifacts/activation-render-hardening/phase45b/phase45b-20260531T19552/` | #390/#400/#75 | `list_only_then_copy_if_small_visual_file` | `25` | `3` | `52428800` | `262144000` |
| `tracka-bundle-sam2-segmentation` | `sam2_segmentation` | `gs://reeditpro-staging-reeditpro-previews/activation-real-video/phase35e/phase35e-20260530T01355/preview-frames/` | #42 | `list_only_then_copy_if_small_visual_file` | `25` | `3` | `52428800` | `262144000` |
| `tracka-bundle-film-interpolation` | `film_interpolation` | `gs://reeditpro-staging-reeditpro-generated-assets/activation-film-runtime/phase38d/phase38d-20260531T00471/` | #60 | `list_only_then_copy_if_small_visual_file` | `25` | `3` | `52428800` | `262144000` |
| `tracka-bundle-film-interpolation` | `film_interpolation` | `gs://reeditpro-staging-reeditpro-previews/activation-film-runtime/phase38d/phase38d-20260531T00471/` | #60 | `list_only_then_copy_if_small_visual_file` | `25` | `3` | `52428800` | `262144000` |
| `tracka-bundle-opencolorio-color-pipeline` | `opencolorio_color_pipeline` | `gs://reeditpro-staging-reeditpro-generated-assets/activation-pro-color-image/phase40b/phase40b-20260531T10390/` | #65 | `list_only_then_copy_if_small_visual_file` | `25` | `3` | `52428800` | `262144000` |
| `tracka-bundle-opencolorio-color-pipeline` | `opencolorio_color_pipeline` | `gs://reeditpro-staging-reeditpro-generated-assets/activation-pro-color-image/phase40c/phase40c-20260531T11504/` | #67 | `list_only_then_copy_if_small_visual_file` | `25` | `3` | `52428800` | `262144000` |
| `tracka-bundle-opencolorio-color-pipeline` | `opencolorio_color_pipeline` | `gs://reeditpro-staging-reeditpro-previews/activation-pro-color-image/phase40c/phase40c-20260531T11504/` | #67 | `list_only_then_copy_if_small_visual_file` | `25` | `3` | `52428800` | `262144000` |

These prefixes are narrow run-scoped Track A prefixes. They were listed with a 25-object cap and never mirrored, recursively copied, or treated as source-of-truth by themselves.

## Rejected Rows

| groupId | capability | ref | reason |
| --- | --- | --- | --- |
| `tracka-bundle-birefnet-masking` | `birefnet_masking` | `gs://.../phase33c-report.json` | `rejected_nonvisual_metadata_ref` |
| `tracka-bundle-sam2-segmentation` | `sam2_segmentation` | `gs://.../phase35f-report.json` | `rejected_nonvisual_metadata_ref` |
| `tracka-bundle-real-esrgan-enhancement` | `real_esrgan_enhancement` | `gs://.../phase34d-report.json` | `rejected_nonvisual_metadata_ref` |
| `tracka-bundle-film-interpolation` | `film_interpolation` | `gs://.../phase38d-report.json` | `rejected_nonvisual_metadata_ref` |
| `tracka-bundle-kornia-pro-color-image` | `kornia_pro_color_image` | `artifact_ref_not_recorded_in_current_source` | `rejected_missing_ref` |
| `tracka-bundle-opencolorio-color-pipeline` | `opencolorio_color_pipeline` | `gs://.../phase40d-report.json` | `rejected_nonvisual_metadata_ref` |
| `tracka-bundle-openimageio-image-io` | `openimageio_image_io` | `gs://.../phase40d-report.json` | `rejected_nonvisual_metadata_ref` |
| `tracka-bundle-libass-caption-burnin` | `libass_caption_burnin` | `gs://.../phase45a-report.json` | `rejected_nonvisual_metadata_ref` |
| `tracka-bundle-opentimelineio-validation` | `opentimelineio_validation` | `gs://.../phase45c-report.json` | `rejected_nonvisual_metadata_ref` |
| `tracka-bundle-ffmpeg-render-hardening` | `ffmpeg_render_hardening` | `gs://.../phase45d-report.json` | `rejected_nonvisual_metadata_ref` |
| `tracka-bundle-ffprobe-export-validation` | `ffprobe_export_validation` | `gs://.../ffprobe-export-validation.json` | `rejected_nonvisual_metadata_ref` |
| `tracka-bundle-full-visual-video-private-e2e` | `full_visual_video_private_e2e` | `gs://.../phase45e-report.json` | `rejected_nonvisual_metadata_ref` |
| `tracka-bundle-track-a-readiness-closure` | `track_a_readiness_closure` | `gs://.../phase45f-report.json` | `rejected_nonvisual_metadata_ref` |

## No-Scope Statement

No Supabase mutation, SQL execution, Secret Manager payload access, provider call, model call, tool execution, worker execution, route execution, browser capture, Docker/Cloud Run execution, signed URL creation, public artifact creation, credit mutation, Stripe checkout/webhook/payment processing, deployment, internal beta unlock, external beta unlock, production unlock, dependency mutation, raw prompt execution, final render/export, or broad service-role handler was enabled. Bounded private GCS metadata/list/read/copy was allowed only for exact or narrowly allowlisted Track A visual review artifact refs from current-source and historical PR evidence.
