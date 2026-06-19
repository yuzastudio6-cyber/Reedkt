# Atlas Track A Milestone Plan

## Milestone 1

`TRACKA-CORE-RENDER-CAPTION-INSTALL-PROOF-1`

Scope:

- `libass_caption_burnin`
- `opentimelineio_timeline_validation`
- shared FFmpeg/FFprobe evidence from Track B only
- `tracka_caption_burnin_policy_e2e`

No global FFmpeg/FFprobe ownership.

## Milestone 2

`TRACKA-REMOTION-RENDER-VALIDATION-1`

Scope:

- `remotion_render_validation`
- `hyperframe_render_handoff` if source evidence supports it

## Milestone 3

`TRACKA-CONTAINER-PACKAGING-TOOLS-INSTALL-PROOF-1`

Scope:

- `gstreamer_render_pipeline_support`
- `bento4_mp4box_packaging_validation`
- `mkvtoolnix_container_validation`
- `vapoursynth_frame_pipeline`
- `revideo_render_preview_alternative`

## Milestone 4

`TRACKA-FILM-FRAME-INTERPOLATION-SCOPE-DECISION-1`

Scope:

- `film_frame_interpolation`

GPU lane only. No install until license, model weight, and runtime decisions are complete.

## Milestone 5

`TRACKA-VISUAL-VIDEO-PRIVATE-E2E-1`

Scope:

- restricted private visual-video E2E after Worker/Supabase gates
- consume shared dependencies only through owner evidence

Next recommended milestone: `TRACKA-CORE-RENDER-CAPTION-INSTALL-PROOF-1`.

No Supabase mutation, SQL execution, Secret Manager payload access, provider call, model call, worker execution, route execution, browser capture, signed URL creation, public artifact creation, credit mutation, Stripe checkout/webhook/payment processing, deployment, internal beta unlock, external beta unlock, production unlock, dependency mutation, raw prompt execution, final render/export, tool installation, media processing, or broad service-role handler was enabled.
