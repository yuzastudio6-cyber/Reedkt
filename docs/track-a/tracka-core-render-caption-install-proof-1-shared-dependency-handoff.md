# TRACKA-CORE-RENDER-CAPTION-INSTALL-PROOF-1 Shared Dependency Handoff

Status: `completed_trackb_handoff_boundary`.

Atlas Track A may reference FFmpeg and FFprobe only as Track B-owned shared dependencies. Atlas Track A does not claim FFmpeg/FFprobe ownership, install proof, version proof, runtime proof, media probing, or final export authority.

## Track B-Owned Shared Dependencies

| Dependency | Owner | Atlas Track A use | Atlas Track A claim |
| --- | --- | --- | --- |
| `ffmpeg` | Track B Media OSS Steward, #542 | shared handoff dependency for future caption/render/export planning | `handoff_only_reference_trackb` |
| `ffprobe` | Track B Media OSS Steward, #542 | shared handoff dependency for future export validation planning | `handoff_only_reference_trackb` |
| `sharp_libvips` | Track B Media OSS Steward, #542 | not used by this proof packet | none |
| `opencolorio` | Track B Media OSS Steward, #542 | not used by this proof packet | none |
| `openimageio` | Track B Media OSS Steward, #542 | not used by this proof packet | none |

## Handoff Labels

- `shared_dependency_ffmpeg_trackb_owned`
- `shared_dependency_ffprobe_trackb_owned`
- `tracka_ffmpeg_render_export_handoff_only`
- `tracka_ffprobe_export_validation_handoff_only`
- `tracka_libass_caption_burnin_handoff_only`
- `tracka_opentimelineio_validation_handoff_only`

## Boundary

Track B remains responsible for broad/global FFmpeg and FFprobe media OSS ownership. Any future Track A runtime proof that consumes FFmpeg/FFprobe must remain a handoff to Track B-owned dependencies and must not create a duplicate global Atlas claim.

No FFmpeg command, FFprobe command, media probe, render, export, Docker build, or media processing occurred in this phase.

Product-ready end-to-end local OSS tools: `0`.

No Supabase mutation, SQL execution, Secret Manager payload access, provider call, model call, worker execution, route execution, browser capture, signed URL creation, public artifact creation, credit mutation, Stripe checkout/webhook/payment processing, deployment, internal beta unlock, external beta unlock, production unlock, dependency mutation, raw prompt execution, final render/export, tool installation, tool execution, media processing, or broad service-role handler was enabled.
