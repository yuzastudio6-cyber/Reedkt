# Track A Visual Review Artifact Bundle 2 Allowlist

Status: `manifest_only_confirmation_absent`

Bundle ID: `tracka-visual-review-artifact-bundle2-20260613T215327`

Source refs are limited to already-recorded Track A evidence from #390, #393, #400, #403, and #408. The #403 bundle copied metadata only; #408 recorded `metadata_only` and `blocked_missing_visual_artifacts`.

## Allowlist Summary

- exact visual object allowlist: `0`
- bounded prefix discovery allowlist: `1`
- rejected nonvisual metadata refs: `12`
- rejected missing refs: `1`
- rejected public or signed URL refs: `0`
- rejected broad prefixes: `0`

## Exact Object Allowlist

No exact private `gs://` object ref with an allowed visual extension is recorded in current-source docs.

All exact current-source object refs point to JSON QA/report metadata. Those refs were valid for #403 metadata integrity, but they are rejected for BUNDLE-2 visual pass/fail input as `rejected_nonvisual_metadata_ref`.

## Bounded Prefix Discovery Allowlist

| groupId | capability | prefix | source | allowed operation | max listed objects | max copied files per group | max file bytes | total bundle bytes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `tracka-bundle-remotion-render-preview` | `remotion_render_preview` | `gs://reeditpro-staging-reeditpro-qa-artifacts/activation-render-hardening/phase45b/phase45b-20260531T19552/` | #390/#400 | `list_only_then_copy_if_small_visual_file` | `25` | `3` | `52428800` | `262144000` |

This prefix is the only narrow current-source prefix candidate. It may be listed only in confirmed mode. It must not be mirrored, recursively copied, or treated as source-of-truth by itself.

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

No Supabase mutation, SQL execution, Secret Manager payload access, provider call, model call, tool execution, worker execution, route execution, browser capture, Docker/Cloud Run execution, signed URL creation, public artifact creation, credit mutation, Stripe checkout/webhook/payment processing, deployment, internal beta unlock, external beta unlock, production unlock, dependency mutation, raw prompt execution, final render/export, or broad service-role handler was enabled. Bounded private GCS metadata/list/read/copy was allowed only for exact or narrowly allowlisted Track A visual review artifact refs from current-source evidence.
