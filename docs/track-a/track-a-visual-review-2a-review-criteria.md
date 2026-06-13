# Track A Visual Review 2A Review Criteria

Status: `criteria_ready_actual_review_blocked`

These criteria refine #393 for AI-assisted visual review. They may be applied only to uploaded representative frames/clips or explicitly approved private artifacts.

## Criteria

| Capability ID | AI-Assisted Checks |
| --- | --- |
| `birefnet_masking` | subject edge continuity, foreground preservation, haloing, matte holes, text-behind-subject believability |
| `sam2_segmentation` | temporal consistency, subject identity preservation, mask jitter, edge stability across frames |
| `real_esrgan_enhancement` | natural detail, skin/text preservation, no waxy faces, halos, ringing, over-sharpening |
| `film_interpolation` | smooth motion, no warped anatomy, no object melting, no frame blending smear |
| `kornia_pro_color_image` | color stability, transform credibility, no missing evidence blocker |
| `opencolorio_color_pipeline` | consistent transform, skin-tone safety, highlight/shadow retention |
| `openimageio_image_io` | image fidelity, metadata/source consistency, no visible format artifacts |
| `libass_caption_burnin` | caption readability, contrast, safe zones, no face/product/evidence obstruction |
| `remotion_render_preview` | composition hierarchy, layer order, timing, safe zones, professional polish |
| `opentimelineio_validation` | visual/timeline correspondence, missing clip detection, timing consistency |
| `ffmpeg_render_hardening` | visible stream integrity, no corrupt frames, no obvious audio/video mismatch if clip available |
| `ffprobe_export_validation` | metadata consistency with visible sample and expected export properties |
| `full_visual_video_private_e2e` | end-to-end coherence, no unresolved required failures, professional Track A standard |
| `track_a_readiness_closure` | closure only if all reviewed capabilities have sufficient evidence and no blockers |

## Non-Approval Rule

AI-assisted checks may flag likely issues or evidence gaps. They do not approve runtime execution, old PR closure, private E2E replay, public delivery, beta, production, broad media, final delivery, or signed URL source-of-truth.

## No-Scope Statement

No Supabase mutation, SQL execution, Google Cloud API call, Secret Manager API call, provider call, model call, tool execution, worker execution, route execution, browser capture, Docker/Cloud Run execution, storage transfer, signed URL creation, public artifact creation, credit mutation, Stripe checkout/webhook/payment processing, deployment, internal beta unlock, external beta unlock, production unlock, dependency mutation, raw prompt execution, final render/export, or broad service-role handler was enabled.
