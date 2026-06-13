# Track A Visual Review Local Bundle Manifest

Status: `created_bounded_allowlist`

Bundle ID: `tracka-visual-review-artifact-bundle1-20260613T195844`

Local bundle root: `/tmp/reeditpro-tracka-visual-review-bundle/tracka-visual-review-artifact-bundle1-20260613T195844/`

The local bundle was created by the #400 runner with inline `REEDITPRO_CONFIRM_TRACKA_PRIVATE_ARTIFACT_BUNDLE=true` and `--execute`.

## Allowlist Classification

| groupId | capability | source ref status | execution action |
| --- | --- | --- | --- |
| `tracka-bundle-birefnet-masking` | `birefnet_masking` | `allowed_exact_object` | copied |
| `tracka-bundle-sam2-segmentation` | `sam2_segmentation` | `allowed_exact_object` | copied |
| `tracka-bundle-real-esrgan-enhancement` | `real_esrgan_enhancement` | `allowed_exact_object` | copied |
| `tracka-bundle-film-interpolation` | `film_interpolation` | `allowed_exact_object` | copied |
| `tracka-bundle-kornia-pro-color-image` | `kornia_pro_color_image` | `rejected_missing_ref` | not copyable |
| `tracka-bundle-opencolorio-color-pipeline` | `opencolorio_color_pipeline` | `allowed_exact_object` | copied |
| `tracka-bundle-openimageio-image-io` | `openimageio_image_io` | `allowed_exact_object` | copied |
| `tracka-bundle-libass-caption-burnin` | `libass_caption_burnin` | `allowed_exact_object` | copied |
| `tracka-bundle-remotion-render-preview` | `remotion_render_preview` | `rejected_prefix_ref` | needs exact object ref |
| `tracka-bundle-opentimelineio-validation` | `opentimelineio_validation` | `allowed_exact_object` | copied |
| `tracka-bundle-ffmpeg-render-hardening` | `ffmpeg_render_hardening` | `allowed_exact_object` | copied |
| `tracka-bundle-ffprobe-export-validation` | `ffprobe_export_validation` | `allowed_exact_object` | copied |
| `tracka-bundle-full-visual-video-private-e2e` | `full_visual_video_private_e2e` | `allowed_exact_object` | copied |
| `tracka-bundle-track-a-readiness-closure` | `track_a_readiness_closure` | `allowed_exact_object` | copied |

## Copied File Manifest

Copied file count: `12`

Local temp files are available for upload from this phase. Do not commit these files.

| local file | artifact group | capability | source artifact type |
| --- | --- | --- | --- |
| `/tmp/reeditpro-tracka-visual-review-bundle/tracka-visual-review-artifact-bundle1-20260613T195844/tracka-bundle-birefnet-masking-phase33c-report.json` | `tracka-bundle-birefnet-masking` | `birefnet_masking` | QA report JSON |
| `/tmp/reeditpro-tracka-visual-review-bundle/tracka-visual-review-artifact-bundle1-20260613T195844/tracka-bundle-sam2-segmentation-phase35f-report.json` | `tracka-bundle-sam2-segmentation` | `sam2_segmentation` | QA report JSON |
| `/tmp/reeditpro-tracka-visual-review-bundle/tracka-visual-review-artifact-bundle1-20260613T195844/tracka-bundle-real-esrgan-enhancement-phase34d-report.json` | `tracka-bundle-real-esrgan-enhancement` | `real_esrgan_enhancement` | QA report JSON |
| `/tmp/reeditpro-tracka-visual-review-bundle/tracka-visual-review-artifact-bundle1-20260613T195844/tracka-bundle-film-interpolation-phase38d-report.json` | `tracka-bundle-film-interpolation` | `film_interpolation` | QA report JSON |
| `/tmp/reeditpro-tracka-visual-review-bundle/tracka-visual-review-artifact-bundle1-20260613T195844/tracka-bundle-opencolorio-color-pipeline-phase40d-report.json` | `tracka-bundle-opencolorio-color-pipeline` | `opencolorio_color_pipeline` | QA report JSON |
| `/tmp/reeditpro-tracka-visual-review-bundle/tracka-visual-review-artifact-bundle1-20260613T195844/tracka-bundle-openimageio-image-io-phase40d-report.json` | `tracka-bundle-openimageio-image-io` | `openimageio_image_io` | QA report JSON |
| `/tmp/reeditpro-tracka-visual-review-bundle/tracka-visual-review-artifact-bundle1-20260613T195844/tracka-bundle-libass-caption-burnin-phase45a-report.json` | `tracka-bundle-libass-caption-burnin` | `libass_caption_burnin` | QA report JSON |
| `/tmp/reeditpro-tracka-visual-review-bundle/tracka-visual-review-artifact-bundle1-20260613T195844/tracka-bundle-opentimelineio-validation-phase45c-report.json` | `tracka-bundle-opentimelineio-validation` | `opentimelineio_validation` | QA report JSON |
| `/tmp/reeditpro-tracka-visual-review-bundle/tracka-visual-review-artifact-bundle1-20260613T195844/tracka-bundle-ffmpeg-render-hardening-phase45d-report.json` | `tracka-bundle-ffmpeg-render-hardening` | `ffmpeg_render_hardening` | QA report JSON |
| `/tmp/reeditpro-tracka-visual-review-bundle/tracka-visual-review-artifact-bundle1-20260613T195844/tracka-bundle-ffprobe-export-validation-ffprobe-export-validation.json` | `tracka-bundle-ffprobe-export-validation` | `ffprobe_export_validation` | export metadata JSON |
| `/tmp/reeditpro-tracka-visual-review-bundle/tracka-visual-review-artifact-bundle1-20260613T195844/tracka-bundle-full-visual-video-private-e2e-phase45e-report.json` | `tracka-bundle-full-visual-video-private-e2e` | `full_visual_video_private_e2e` | QA report JSON |
| `/tmp/reeditpro-tracka-visual-review-bundle/tracka-visual-review-artifact-bundle1-20260613T195844/tracka-bundle-track-a-readiness-closure-phase45f-report.json` | `tracka-bundle-track-a-readiness-closure` | `track_a_readiness_closure` | readiness report JSON |

## Review Limitation

This bundle does not include representative frames, videos, rendered previews, or media exports. It gives TRACKA-VISUAL-REVIEW-2B checksum-backed metadata/report context only. A visual pass/fail decision still requires uploaded representative frames/videos or exact review-safe visual artifacts.

## No-Scope Statement

No Supabase mutation, SQL execution, Secret Manager payload access, provider call, model call, tool execution, worker execution, route execution, browser capture, Docker/Cloud Run execution, signed URL creation, public artifact creation, credit mutation, Stripe checkout/webhook/payment processing, deployment, internal beta unlock, external beta unlock, production unlock, dependency mutation, raw prompt execution, final render/export, or broad service-role handler was enabled. Bounded private GCS metadata/read/copy was allowed only for exact Track A review artifact refs explicitly allowlisted by the #400 bundle manifest.
