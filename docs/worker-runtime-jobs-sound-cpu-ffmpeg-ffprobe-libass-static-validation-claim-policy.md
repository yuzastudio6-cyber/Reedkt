# WORKER_RUNTIME_JOBS SOUND CPU FFmpeg FFprobe Libass Static Validation Claim Policy

```json worker-runtime-jobs-sound-cpu-ffmpeg-ffprobe-libass-static-validation-claim-policy
{
  "owner": "WORKER_RUNTIME_JOBS",
  "decision": "worker_runtime_jobs_sound_cpu_ffmpeg_ffprobe_libass_static_validation_plan_completed_with_warnings_ready_for_static_validation_no_media_no_docker_build",
  "allowedClaims": {
    "staticValidationPlanCreated": true,
    "dockerfileTextChecklistDefined": true,
    "commandCoveragePlanDefined": true,
    "libassFontValidationPlanDefined": true
  },
  "blockedClaims": {
    "staticValidationPassed": false,
    "ffmpegReady": false,
    "ffprobeReady": false,
    "libassReady": false,
    "launchCoreReadinessPassed": false,
    "dockerBuildRunPush": false,
    "runtimeExecution": false,
    "workerExecution": false,
    "routeExecution": false,
    "toolExecution": false,
    "mediaProcessing": false,
    "ffmpegMediaExecution": false,
    "ffprobeMediaExecution": false,
    "gcpCloudRunSecretManager": false,
    "supabaseMutation": false,
    "sqlExecution": false,
    "artifactCreation": false,
    "generated_local_fixture_passed": false,
    "dry_run_passed": false,
    "realUserMediaBetaAllowed": false,
    "paidProductionAllowed": false,
    "productionReady": false
  },
  "requiredNoScopeStatement": "No Supabase mutation, SQL execution, Google Cloud API call, Secret Manager API call, provider call, model call, worker execution, route execution, browser capture, Cloud Run execution, storage transfer, signed URL creation, public artifact creation, credit mutation, Stripe checkout/webhook/payment processing, deployment, internal beta unlock, external beta unlock, production unlock, raw prompt execution, final render/export, or broad service-role handler was enabled. No Docker build, Docker push, Docker run, media processing, FFmpeg media execution, ffprobe media execution, or static validation pass claim was enabled in this static-validation planning prompt.",
  "supabaseClassification": {
    "updateRequired": "no",
    "environmentTouched": "no",
    "sqlExecuted": "no",
    "migrationDeployed": "no",
    "nextAction": "none"
  }
}
```

This packet is a validation plan, not a completed validation proof.
