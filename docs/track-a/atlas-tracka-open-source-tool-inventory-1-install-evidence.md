# Atlas Track A Install Evidence

This file records source evidence only. It does not install, execute, or probe tools.

## Already Installed Or Source-Declared

| Scoped tool | Status | Evidence |
| --- | --- | --- |
| `opentimelineio_timeline_validation` | `installed_with_source_evidence` | `docker/prod/render-worker/requirements.render.txt` and `docker/prod/tool-readiness-worker/requirements.readiness.txt` list `opentimelineio`. |
| `libass_caption_burnin` | `installed_with_source_evidence` | `docker/prod/render-worker/Dockerfile` lists `libass9` and `libass-dev`; `docker/prod/tool-readiness-worker/Dockerfile` lists `libass9`. |

## Partially Implemented Or Evidence-Backed

| Scoped tool | Status | Evidence |
| --- | --- | --- |
| `remotion_render_validation` | `implementation_partial` with `not_installed` package evidence | `src/backend/render/remotion-worker/*`, `server/config/env.ts`, and Track A visual review docs reference Remotion contracts, but `package.json` and `package-lock.json` contain no Remotion dependency. |
| `hyperframe_render_handoff` | `implementation_partial` with `planned_only` install status | `server/config/gcp-production-config.ts` and `docker/prod/render-worker/Dockerfile` document Hyperframe metadata handoff. |
| `film_frame_interpolation` | `implementation_partial` with `not_installed` install status | FILM is recorded as evaluated/sample evidence in Track A docs and model-weight metadata, but no install, weight download, or execution is approved. |
| `tracka_caption_burnin_policy_e2e` | `implementation_partial` | Restricted caption policy and private E2E planning docs exist; install/runtime proof remains future. |
| `tracka_render_export_private_review_path` | `implementation_partial` | Restricted private render/export review path is documented; final delivery/export remains blocked. |
| `tracka_visual_video_private_e2e` | `implementation_partial` | Private E2E planning and gates exist; execution remains blocked. |

## Not Installed

- `gstreamer_render_pipeline_support`
- `bento4_mp4box_packaging_validation`
- `mkvtoolnix_container_validation`
- `vapoursynth_frame_pipeline`
- `revideo_render_preview_alternative`

## Shared Evidence Owned Elsewhere

FFmpeg and FFprobe appear in worker Dockerfiles and runtime docs, but they are Track B-owned global media tools. Atlas Track A may reference them only as shared source evidence and handoff dependencies.

Sharp/libvips, OpenColorIO, OpenImageIO, SAM2, BiRefNet, Real-ESRGAN, and Kornia are also owned outside Atlas Track A and must not be claimed, installed, or proven by this packet.

Package-lock status: `unchanged`.

No Supabase mutation, SQL execution, Secret Manager payload access, provider call, model call, worker execution, route execution, browser capture, signed URL creation, public artifact creation, credit mutation, Stripe checkout/webhook/payment processing, deployment, internal beta unlock, external beta unlock, production unlock, dependency mutation, raw prompt execution, final render/export, tool installation, media processing, or broad service-role handler was enabled.
