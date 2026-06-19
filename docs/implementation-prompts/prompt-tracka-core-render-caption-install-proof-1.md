# TRACKA-CORE-RENDER-CAPTION-INSTALL-PROOF-1

Goal: plan the first proof packet for Atlas Track A core render/caption scoped tools after `TRACKA-OPEN-SOURCE-TOOL-INVENTORY-1`.

Scope:

- `libass_caption_burnin`
- `opentimelineio_timeline_validation`
- shared FFmpeg/FFprobe evidence from Track B only
- `tracka_caption_burnin_policy_e2e`

Required source checks:

- #544 owner registry source
- `docs/track-a/atlas-tracka-open-source-tool-inventory-1-tool-matrix.md`
- `docker/prod/render-worker/Dockerfile`
- `docker/prod/render-worker/requirements.render.txt`
- `docker/prod/tool-readiness-worker/Dockerfile`
- `docker/prod/tool-readiness-worker/requirements.readiness.txt`

Do not claim global FFmpeg or FFprobe ownership. Do not install, execute, process media, mutate Supabase, run SQL, or unlock beta/production/final delivery.

No Supabase mutation, SQL execution, Secret Manager payload access, provider call, model call, worker execution, route execution, browser capture, signed URL creation, public artifact creation, credit mutation, Stripe checkout/webhook/payment processing, deployment, internal beta unlock, external beta unlock, production unlock, dependency mutation, raw prompt execution, final render/export, tool installation, media processing, or broad service-role handler was enabled.
