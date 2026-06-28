# WORKER_RUNTIME_JOBS-SOUND-CPU-FFMPEG-FFPROBE-LIBASS-POLICY-CLOSURE-PLAN

```json worker-runtime-jobs-sound-cpu-ffmpeg-ffprobe-libass-policy-closure-plan
{
  "prompt": "WORKER_RUNTIME_JOBS-SOUND-CPU-FFMPEG-FFPROBE-LIBASS-POLICY-CLOSURE-PLAN",
  "requiredSourceDecision": "worker_runtime_jobs_sound_cpu_hyperframe_readiness_semantics_fixed_with_warnings_ready_for_ffmpeg_ffprobe_libass_policy_closure_no_runtime_no_production",
  "goal": "Plan the smallest safe closure for remaining launch-core FFmpeg, ffprobe, and libass policy/container evidence after Hyperframe was reclassified as an internal preview boundary warning.",
  "currentLaunchCoreBlockers": [
    "ffmpeg",
    "ffprobe",
    "libass"
  ],
  "allowedScope": {
    "docsDiagnosticsAndPolicyPlan": true,
    "localCommandInspection": true,
    "mediaProcessing": false,
    "ffmpegMediaTranscode": false,
    "ffprobeMediaInspection": false,
    "dockerBuildRunPush": false,
    "gcpCloudRunSecretManager": false,
    "workerExecution": false,
    "routeExecution": false,
    "toolExecution": false,
    "supabaseMutation": false,
    "sqlExecution": false,
    "artifactCreation": false,
    "realUserMediaBetaUnlock": false,
    "productionUnlock": false
  },
  "requiredEvidence": [
    "Hyperframe remains warning and not passed",
    "FFmpeg and ffprobe policy does not rely on GPL-incompatible production assumptions",
    "libass policy and container-source requirements are separated from media execution",
    "real-user media beta and paid production remain blocked until explicit later gates"
  ],
  "supabaseClassification": {
    "updateRequired": "no",
    "environmentTouched": "no",
    "sqlExecuted": "no",
    "migrationDeployed": "no",
    "nextAction": "none"
  }
}
```

This prompt should not run media through FFmpeg or ffprobe. It should only decide the next safe policy/container evidence lane.
