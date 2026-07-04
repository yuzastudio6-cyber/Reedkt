# WORKER_RUNTIME_JOBS-SOUND-CPU-CONTROLLED-CLOUD-RUN-NO-MEDIA-IMAGE-REBUILD-DEPLOY-EXECUTION-PROOF

Rebuild and deploy the SOUND CPU Cloud Run Jobs only after the entrypoint source packet with decision `worker_runtime_jobs_sound_cpu_controlled_cloud_run_no_media_entrypoint_source_completed_with_warnings_ready_for_image_rebuild_deploy_execution_proof` is merged.

Required order:
- Re-query the merged source branch and confirm the Dockerfile copies `controlled-tool-execution-runner.py` and uses `CMD ["python", "./controlled-tool-execution-runner.py", "--require-disabled-env"]`.
- Build and push linux/amd64 images for `reeditpro-sound-cpu-analysis-worker` and `reeditpro-sound-audio-metadata-worker`.
- Deploy both Cloud Run Jobs to the new digest with disabled runtime/media/Supabase/artifact/beta/production env flags.
- Execute only the approved controlled no-media Cloud Run proof. Do not run media, providers, Supabase, SQL, Docker run, Docker push beyond the approved image push, storage writes, signed URLs, public artifacts, beta, or production.
- Read back execution status/logs, sanitize evidence, remove any local temporary artifacts, and keep beta/production closed.

If any build, deploy, execution, or safety check fails, stop and record the exact blocker. Do not retry broadly or widen scope.

No Supabase mutation, SQL execution, Secret Manager value write, provider call, model call, route execution, browser capture, storage transfer, signed URL creation, public artifact creation, credit mutation, Stripe checkout/webhook/payment processing, internal beta unlock, external beta unlock, production unlock, raw prompt execution, final render/export, or broad service-role handler may be enabled. Cloud Run Job execution is allowed only for the approved controlled no-media proof.
