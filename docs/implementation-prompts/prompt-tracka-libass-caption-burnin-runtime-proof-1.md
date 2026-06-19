# TRACKA-LIBASS-CAPTION-BURNIN-RUNTIME-PROOF-1

Goal: plan the guarded runtime proof for Atlas Track A scoped `libass_caption_burnin` after `TRACKA-CORE-RENDER-CAPTION-INSTALL-PROOF-1`.

Required source:

- `docs/track-a/tracka-core-render-caption-install-proof-1.md`
- `docs/track-a/tracka-core-render-caption-install-proof-1-install-evidence.md`
- `docker/prod/render-worker/Dockerfile`
- `docker/prod/tool-readiness-worker/Dockerfile`
- #544 owner registry source
- #547 inventory source

Current readiness: `ready_for_tracka_libass_caption_burnin_runtime_proof_1`.

Scope boundary: libass remains a scoped Track A caption burn-in responsibility. FFmpeg and FFprobe remain Track B-owned shared dependencies and may be referenced only as handoff dependencies.

Do not install tools, build Docker images, execute libass, run FFmpeg, run FFprobe, process media, mutate Supabase, run SQL, run workers, run routes, create signed URLs, create public artifacts, or unlock beta/production/final delivery unless a future explicit guarded runtime proof packet authorizes it.

No Supabase mutation, SQL execution, Secret Manager payload access, provider call, model call, worker execution, route execution, browser capture, signed URL creation, public artifact creation, credit mutation, Stripe checkout/webhook/payment processing, deployment, internal beta unlock, external beta unlock, production unlock, dependency mutation, raw prompt execution, final render/export, tool installation, tool execution, media processing, or broad service-role handler was enabled.
