# Track A Current-Source Tool Readiness Map

Status: `planning_ready_review_only`

This map records Track A visual/video tool readiness after TRACKA-RECON-0. It does not approve tool execution.

## Tool Readiness Rows

| Capability ID | Tool Or Runtime Family | Current Evidence | Readiness | Execution Flag | Required Before Runtime |
| --- | --- | --- | --- | --- | --- |
| `birefnet_masking` | BiRefNet masking | historical #22-#26 plus current docs | `ready_for_human_visual_review_only` | false | current route contract tests, artifact review, worker/runtime approval |
| `sam2_segmentation` | SAM2 segmentation | historical #35, #42, #43 plus current docs | `ready_for_human_visual_review_only` | false | current route contract tests, artifact review, worker/runtime approval |
| `real_esrgan_enhancement` | Real-ESRGAN enhancement | historical #27-#30, #34 plus current docs | `ready_for_human_visual_review_only` | false | current route contract tests, artifact review, worker/runtime approval |
| `film_interpolation` | FILM interpolation | historical #54, #55, #58, #60 plus policy docs | `ready_for_human_visual_review_only` | false | motion QA, route contract tests, worker/runtime approval |
| `kornia_pro_color_image` | Kornia color/image planning | historical #63, #65, #67, #68 | `requires_current_source_policy_review` | false | dedicated current-source policy and route contract tests |
| `opencolorio_color_pipeline` | OpenColorIO pipeline | #63, #65, #67, #68 plus policy doc | `ready_for_human_visual_review_only` | false | dependency, color QA, route contract tests |
| `openimageio_image_io` | OpenImageIO image IO | #63, #65, #67, #68 plus policy doc | `ready_for_human_visual_review_only` | false | dependency, sandboxing, route contract tests |
| `libass_caption_burnin` | libass caption burn-in | #73 plus policy doc | `ready_for_policy_review_only` | false | font/license QA and render route tests |
| `remotion_render_preview` | Remotion preview/render planning | #75, #364 plus Track A owner study | `current_owner_contract_ready_review_only` | false | worker render approval and route contract tests |
| `opentimelineio_validation` | OpenTimelineIO interchange | #77 plus policy doc | `ready_for_policy_review_only` | false | route contract tests and export QA |
| `ffmpeg_render_hardening` | FFmpeg render hardening | #80 plus policy docs | `ready_for_policy_review_only` | false | LGPL build closure, worker route, QA |
| `ffprobe_export_validation` | FFprobe export validation | #80 plus policy doc | `ready_for_policy_review_only` | false | metadata QA route and worker boundary |
| `full_visual_video_private_e2e` | full private E2E | #82 metadata | `requires_human_visual_review` | false | safe artifact review, current-source revalidation plan |
| `track_a_readiness_closure` | Track A closure | #83, #364, #383 | `blocked_pending_owner_closure_decision` | false | visual review and explicit closure targets |

## Handoff Posture

All handoffs remain review/planning only:

- WORKER_RUNTIME_JOBS receives no executable worker command.
- TRACK_A_RENDER_EXPORT receives no final render/export command.
- TRACK_B_MEDIA_PROCESSING receives no media processing command.
- PROVIDER_GATEWAY_MODELS receives no model/provider call.
- SUPABASE_RLS_STORAGE_DATABASE receives no schema, storage, RLS, or row mutation request.
- BILLING_STRIPE_CREDITS receives no credit or payment mutation request.

## Supabase Classification

Supabase update status: `docs_only`

Milestone sync: `blocked_current_branch_missing_sync_layer`

## No-Scope Statement

No Supabase mutation, SQL execution, Google Cloud API call, Secret Manager API call, provider call, model call, tool execution, worker execution, route execution, browser capture, Docker/Cloud Run execution, storage transfer, signed URL creation, public artifact creation, credit mutation, Stripe checkout/webhook/payment processing, deployment, internal beta unlock, external beta unlock, production unlock, dependency mutation, raw prompt execution, final render/export, or broad service-role handler was enabled.
