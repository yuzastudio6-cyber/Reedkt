# Track A Visual Review Local Bundle Manifest

Status: `not_created_confirmation_missing`

Bundle ID: `tracka-visual-review-artifact-bundle1-20260613T195844`

Local bundle root: `/tmp/reeditpro-tracka-visual-review-bundle/tracka-visual-review-artifact-bundle1-20260613T195844/`

The local bundle was not created because `REEDITPRO_CONFIRM_TRACKA_PRIVATE_ARTIFACT_BUNDLE=true` was not present.

## Allowlist Classification

| groupId | capability | source ref status | execution action |
| --- | --- | --- | --- |
| `tracka-bundle-birefnet-masking` | `birefnet_masking` | `allowed_exact_object` | blocked before metadata/read |
| `tracka-bundle-sam2-segmentation` | `sam2_segmentation` | `allowed_exact_object` | blocked before metadata/read |
| `tracka-bundle-real-esrgan-enhancement` | `real_esrgan_enhancement` | `allowed_exact_object` | blocked before metadata/read |
| `tracka-bundle-film-interpolation` | `film_interpolation` | `allowed_exact_object` | blocked before metadata/read |
| `tracka-bundle-kornia-pro-color-image` | `kornia_pro_color_image` | `rejected_missing_ref` | not copyable |
| `tracka-bundle-opencolorio-color-pipeline` | `opencolorio_color_pipeline` | `allowed_exact_object` | blocked before metadata/read |
| `tracka-bundle-openimageio-image-io` | `openimageio_image_io` | `allowed_exact_object` | blocked before metadata/read |
| `tracka-bundle-libass-caption-burnin` | `libass_caption_burnin` | `allowed_exact_object` | blocked before metadata/read |
| `tracka-bundle-remotion-render-preview` | `remotion_render_preview` | `rejected_prefix_ref` | needs exact object ref |
| `tracka-bundle-opentimelineio-validation` | `opentimelineio_validation` | `allowed_exact_object` | blocked before metadata/read |
| `tracka-bundle-ffmpeg-render-hardening` | `ffmpeg_render_hardening` | `allowed_exact_object` | blocked before metadata/read |
| `tracka-bundle-ffprobe-export-validation` | `ffprobe_export_validation` | `allowed_exact_object` | blocked before metadata/read |
| `tracka-bundle-full-visual-video-private-e2e` | `full_visual_video_private_e2e` | `allowed_exact_object` | blocked before metadata/read |
| `tracka-bundle-track-a-readiness-closure` | `track_a_readiness_closure` | `allowed_exact_object` | blocked before metadata/read |

## Copied File Manifest

Copied file count: `0`

No local files are available for upload from this phase.

## Future Confirmed Execution Requirements

Future execution may use the #400 runner only when both are true:

- `REEDITPRO_CONFIRM_TRACKA_PRIVATE_ARTIFACT_BUNDLE=true`
- the command includes `--execute`

It must copy only exact allowlisted objects, reject missing/prefix refs, and keep copied files out of git.

## No-Scope Statement

No Supabase mutation, SQL execution, Secret Manager payload access, provider call, model call, tool execution, worker execution, route execution, browser capture, Docker/Cloud Run execution, signed URL creation, public artifact creation, credit mutation, Stripe checkout/webhook/payment processing, deployment, internal beta unlock, external beta unlock, production unlock, dependency mutation, raw prompt execution, final render/export, or broad service-role handler was enabled. Bounded private GCS metadata/read/copy was allowed only for exact Track A review artifact refs explicitly allowlisted by the #400 bundle manifest.
