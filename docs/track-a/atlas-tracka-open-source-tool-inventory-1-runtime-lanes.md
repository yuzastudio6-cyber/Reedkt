# Atlas Track A Runtime Lanes

This packet assigns future lanes only. No runtime lane is executed here.

| Runtime lane | Scoped tools | Status |
| --- | --- | --- |
| `cpu_render_worker` | `remotion_render_validation`, `opentimelineio_timeline_validation`, `libass_caption_burnin`, `revideo_render_preview_alternative` | future proof required |
| `cpu_native_container_worker` | `gstreamer_render_pipeline_support`, `bento4_mp4box_packaging_validation`, `mkvtoolnix_container_validation`, `vapoursynth_frame_pipeline` | blocked pending container/native install proof |
| `gpu_vision_worker` | `film_frame_interpolation` | blocked pending model/license/weight review |
| `planning_only` | `hyperframe_render_handoff` | metadata handoff only |
| `e2e_workflow` | `tracka_caption_burnin_policy_e2e`, `tracka_render_export_private_review_path`, `tracka_visual_video_private_e2e` | blocked pending Worker/Supabase gates and core proofs |

## Lane Boundaries

- Track B owns global media tooling such as FFmpeg, FFprobe, Sharp/libvips, OpenColorIO, and OpenImageIO.
- AI Graphics / Worker owns SAM2, Kornia, BiRefNet, Real-ESRGAN, and adjacent creative/model tooling.
- Worker Runtime owns job execution infrastructure.
- Supabase owns schema, RLS, migrations, and database mutation paths.
- Atlas Track A owns only the scoped Track A Render/Export responsibility labels from #544.

No Supabase mutation, SQL execution, Secret Manager payload access, provider call, model call, worker execution, route execution, browser capture, signed URL creation, public artifact creation, credit mutation, Stripe checkout/webhook/payment processing, deployment, internal beta unlock, external beta unlock, production unlock, dependency mutation, raw prompt execution, final render/export, tool installation, media processing, or broad service-role handler was enabled.
