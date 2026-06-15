# Track A Gap Closure Artifact Requirements

Status: `artifact_requirements_recorded`

## Required Exact Artifacts

| Artifact requirement | Capability | Required format | Source-of-truth rule |
| --- | --- | --- | --- |
| corrected caption text source | `libass_caption_burnin`, `remotion_render_preview` | private structured caption text or transcript QA record | approved caption source and QA record are source of truth |
| replacement caption sample proof | `libass_caption_burnin`, `remotion_render_preview` | private review-safe frame, clip, or text QA excerpt | sample visual is review evidence, not public delivery |
| BiRefNet matte/cutout/composite side-by-side | `birefnet_masking` | private review-safe PNG/JPG/WEBP or short clip | exact artifact ref plus checksum required |
| BiRefNet edge closeup | `birefnet_masking` | private review-safe image crop | exact artifact ref plus checksum required |
| Real-ESRGAN before/after comparison | `real_esrgan_enhancement` | private before/after image/contact sheet | exact artifact ref plus checksum required |
| Real-ESRGAN detail crop | `real_esrgan_enhancement` | private crop image | exact artifact ref plus checksum required |
| OpenColorIO/OpenImageIO labeled proof | `opencolorio_color_pipeline`, `openimageio_image_io` | labeled contact sheet or before/after image | expected transform and image-I/O labels required |
| OTIO timeline consistency proof | `opentimelineio_validation` | private structured timeline proof and review-safe visual artifact | exact artifact ref plus checksum required |
| full private E2E review artifact | `full_visual_video_private_e2e` | private review clip or contact sheet | exact artifact ref plus checksum required |

## Rejection Rules

- public URLs are not source of truth.
- signed URLs are not source of truth.
- broad prefixes are not enough.
- raw prompts and provider responses are not source of truth.
- JSON-only metadata is supporting evidence only, not visual proof.
- runtime output cannot be created in this phase.

## No-Scope Statement

No Supabase mutation, SQL execution, Secret Manager payload access, provider call, model call, tool execution, worker execution, route execution, browser capture, Docker/Cloud Run execution, signed URL creation, public artifact creation, credit mutation, Stripe checkout/webhook/payment processing, deployment, internal beta unlock, external beta unlock, production unlock, dependency mutation, raw prompt execution, final render/export, or broad service-role handler was enabled.
