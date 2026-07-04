# WORKER_RUNTIME_JOBS SOUND CPU Controlled Cloud Run No-Media Image Rebuild Deploy Execution Proof

```json worker-runtime-jobs-sound-cpu-controlled-cloud-run-no-media-image-rebuild-deploy-execution-proof
{
  "label": "worker-runtime-jobs-sound-cpu-controlled-cloud-run-no-media-image-rebuild-deploy-execution-proof",
  "owner": "WORKER_RUNTIME_JOBS",
  "decision": "worker_runtime_jobs_sound_cpu_controlled_cloud_run_no_media_image_rebuild_deploy_execution_proof_blocked_gcloud_reauth_readback",
  "sourceEvidence": {
    "entrypointSourcePr": 2415,
    "entrypointSourceMergeCommit": "a1c6fdb13d8c1d7d5259940f688d59ae5996702f",
    "entrypointSourceDecision": "worker_runtime_jobs_sound_cpu_controlled_cloud_run_no_media_entrypoint_source_completed_with_warnings_ready_for_image_rebuild_deploy_execution_proof",
    "sourceHead": "a1c6fdb13d8c1d7d5259940f688d59ae5996702f"
  },
  "toolScope": {
    "toolCount": 15,
    "directPinnedPackageCount": 13,
    "aliasCoveredToolCount": 2,
    "tools": [
      "librosa",
      "audioread",
      "pydub",
      "scipy",
      "resampy",
      "pyloudnorm",
      "audioflux",
      "music21",
      "pretty_midi",
      "mido",
      "noisereduce",
      "pedalboard",
      "mir_eval",
      "pydub_effects",
      "ebu_r128_pyloudnorm"
    ]
  },
  "result": {
    "dockerfilePermissionFixApplied": true,
    "fixedImageBuildPushPassed": true,
    "cloudRunJobsRedeployedToFixedDigest": true,
    "cloudRunExecutionCreated": true,
    "cloudRunExecutionName": "reeditpro-sound-cpu-analysis-worker-rdxcv",
    "cloudRunExecutionFinalStateVerified": false,
    "cloudRunLogsVerified": false,
    "allFifteenToolsPassedInCloudRun": "unverified",
    "blocker": "gcloud_noninteractive_reauth_required_before_execution_readback",
    "nextAction": "Refresh non-interactive gcloud auth for aiediting@reeditpro.com, then read execution reeditpro-sound-cpu-analysis-worker-rdxcv status and logs before any rerun."
  },
  "acceptedForToday": {
    "dockerBuild": "yes_fixed_image_only",
    "dockerPush": "yes_fixed_image_only",
    "cloudRunJobDeployment": "yes_fixed_digest_only",
    "cloudRunJobExecution": "one_analysis_job_attempt_created",
    "dockerRun": "no",
    "cloudRunJobRerunBeforeReadback": "no",
    "mediaProcessing": "no",
    "workerRouteExecution": "no_user_route",
    "providerModelCall": "no",
    "supabaseSql": "no",
    "artifactWrite": "no",
    "externalBetaUnlock": "no",
    "productionUnlock": "no"
  },
  "supabaseClassification": {
    "updateRequired": "no",
    "environmentTouched": "no",
    "sqlExecuted": "no",
    "migrationDeployed": "no",
    "nextAction": "none"
  }
}
```

The fixed Cloud Run image was built and pushed after the first Cloud Run execution showed the non-root user could not read the copied runner file. Both SOUND CPU jobs were redeployed to the fixed digest. A new controlled no-media execution was created, but final status and logs could not be read because the active `aiediting@reeditpro.com` gcloud credential required interactive reauthentication during polling.

This packet keeps the proof incomplete until the exact execution readback is recovered. Do not rerun the Cloud Run job before reading `reeditpro-sound-cpu-analysis-worker-rdxcv` unless that execution is unavailable and the rerun is explicitly recorded as the replacement proof attempt.
