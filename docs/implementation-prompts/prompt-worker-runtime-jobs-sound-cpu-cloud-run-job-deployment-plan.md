# WORKER_RUNTIME_JOBS-SOUND-CPU-CLOUD-RUN-JOB-DEPLOYMENT-PLAN: deploy SOUND CPU Cloud Run Jobs, no job execution

Repository: `yuzastudio6-cyber/Reedkt`

Goal:
Deploy the two SOUND CPU Cloud Run Jobs from the pushed Artifact Registry images after the image-build/push result `worker_runtime_jobs_sound_cpu_docker_image_build_push_result_completed_with_blockers_ready_for_cloud_run_job_deployment_plan` is merged and rechecked.

Source evidence:
- PR #2411 is merged at `556cd5fb538379ebbecf58fde92a9034d836931c`.
- The CPU worker service account `reeditpro-cpu-worker-sa@reeditpro.iam.gserviceaccount.com` exists and has only the lane-approved logging/monitoring project roles.
- The two SOUND CPU image tags exist in Artifact Registry:
  - `us-central1-docker.pkg.dev/reeditpro/reeditpro-workers/reeditpro-sound-cpu-analysis-worker:source-556cd5fb5`
  - `us-central1-docker.pkg.dev/reeditpro/reeditpro-workers/reeditpro-sound-audio-metadata-worker:source-556cd5fb5`
- Both tags read back at digest `sha256:1ee14f32659f274fd7a829037b6965cf6587e847d8c42cc1df91b12c5dba914b`.

Allowed next target:
- Deploy or update Cloud Run Jobs only:
  - `reeditpro-sound-cpu-analysis-worker`
  - `reeditpro-sound-audio-metadata-worker`
- Use the pushed image digest or the `source-556cd5fb5` tag.
- Use CPU-only settings and the approved CPU worker service account.
- Keep runtime disabled defaults unless a later controlled execution gate explicitly changes them.

Still prohibited until later gates:
- Cloud Run Job execution.
- Docker run, Docker push, or new Docker build.
- Worker/route/tool runtime execution.
- Media processing, FFmpeg/ffprobe execution, Supabase/SQL, Secret Manager value writes, artifacts, signed URLs, external beta unlock, production unlock.

Required result packet:
- Record exact Cloud Run Job names, images, digests, service account, CPU/memory/task settings, env flags, and readback.
- Confirm no job execution count changed for the new jobs.
- Confirm the 15 SOUND CPU tools remain image-installed but not beta-ready until controlled Cloud Run execution and agent cloud tool-call proof pass.

Supabase classification:
update required `no`; environment touched `no`; SQL executed `no`; migration deployed `no`; next action `none`.

No Supabase mutation, SQL execution, Secret Manager value write, provider call, model call, worker execution, route execution, browser capture, Cloud Run execution, storage transfer, signed URL creation, public artifact creation, credit mutation, Stripe checkout/webhook/payment processing, internal beta unlock, external beta unlock, production unlock, raw prompt execution, final render/export, or broad service-role handler may be enabled. Deployment is limited to creating/updating the named SOUND CPU Cloud Run Jobs; no job execution may be enabled.
