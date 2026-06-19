# TRACKA-CORE-RENDER-CAPTION-INSTALL-PROOF-1 Blocked Scope Register

Status: `blocked_scope_preserved`.

The following remain blocked:

- tool installation
- tool execution
- libass execution
- OpenTimelineIO execution/import proof
- FFmpeg execution
- FFprobe execution
- Docker builds
- media processing
- private E2E execution
- private artifact access
- GCS/private artifact access
- browser capture
- signed URL creation
- public artifact creation
- final render/export
- internal beta unlock
- external beta unlock
- paid production unlock
- production unlock
- broad media unlock
- Worker Runtime execution
- job claim/lease execution
- Tool Route execution
- provider/model calls
- Supabase mutation
- SQL execution
- migrations/schema/RLS changes
- dependency mutation
- package-lock mutation
- raw prompt execution
- broad service-role handler

## Blocked Decision Values

`tracka_caption_burnin_policy_e2e readiness: ready_for_private_e2e_after_worker_supabase_gates`

`tracka_render_export_private_review_path readiness: blocked_pending_worker_supabase_private_e2e_gates`

Product-ready end-to-end local OSS tools: `0`.

No Supabase mutation, SQL execution, Secret Manager payload access, provider call, model call, worker execution, route execution, browser capture, signed URL creation, public artifact creation, credit mutation, Stripe checkout/webhook/payment processing, deployment, internal beta unlock, external beta unlock, production unlock, dependency mutation, raw prompt execution, final render/export, tool installation, tool execution, media processing, or broad service-role handler was enabled.
