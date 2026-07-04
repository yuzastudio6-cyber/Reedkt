# WORKER_RUNTIME_JOBS-SOUND-CPU-DOCKER-IMAGE-BUILD-PUSH-PLAN: build and push SOUND CPU worker images, no Cloud Run execution

Repository: `yuzastudio6-cyber/Reedkt`

Goal:
Build and push the SOUND CPU worker images only after the IAM result `worker_runtime_jobs_sound_cpu_gcp_iam_role_binding_result_completed_with_blockers_ready_for_docker_image_build_push_plan` is merged and rechecked.

Source evidence:
- PR #2409 is merged at `06945b26b21802c8de30e451c9945300d75d358e`.
- `reeditpro-cpu-worker-sa@reeditpro.iam.gserviceaccount.com` exists.
- The CPU worker service account has only `roles/logging.logWriter` and `roles/monitoring.metricWriter` from this lane.
- SOUND CPU Cloud Run Job templates expect these images:
  - `us-central1-docker.pkg.dev/reeditpro/reeditpro-workers/reeditpro-sound-cpu-analysis-worker`
  - `us-central1-docker.pkg.dev/reeditpro/reeditpro-workers/reeditpro-sound-audio-metadata-worker`

Allowed next target:
- Build and push the two SOUND CPU images from the reviewed `server/workers/sound-cpu/Dockerfile`.
- Record image digests, sizes, tags, build logs summary, and push readback.
- Do not run the images.

Still prohibited until later gates:
- Cloud Run deployment or execution.
- Docker run.
- Worker/route/tool runtime execution.
- Media processing, FFmpeg/ffprobe execution, Supabase/SQL, Secret Manager value writes, artifacts, signed URLs, external beta unlock, production unlock.

Supabase classification:
update required `no`; environment touched `no`; SQL executed `no`; migration deployed `no`; next action `none`.

No Supabase mutation, SQL execution, Secret Manager value write, provider call, model call, worker execution, route execution, browser capture, Cloud Run execution, storage transfer, signed URL creation, public artifact creation, credit mutation, Stripe checkout/webhook/payment processing, deployment, internal beta unlock, external beta unlock, production unlock, raw prompt execution, final render/export, or broad service-role handler may be enabled. Docker action must be limited to controlled local build and Artifact Registry push for the named SOUND CPU images; no Docker run may be enabled.
