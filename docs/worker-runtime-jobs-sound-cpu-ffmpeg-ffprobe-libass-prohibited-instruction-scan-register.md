# WORKER_RUNTIME_JOBS SOUND CPU FFmpeg FFprobe Libass Prohibited Instruction Scan Register

```json worker-runtime-jobs-sound-cpu-ffmpeg-ffprobe-libass-prohibited-instruction-scan-register
{
  "owner": "WORKER_RUNTIME_JOBS",
  "decision": "worker_runtime_jobs_sound_cpu_ffmpeg_ffprobe_libass_static_validation_passed_with_warnings_ready_for_static_validation_owner_review_no_media_no_docker_build",
  "dockerfilePath": "server/workers/sound-cpu/Dockerfile",
  "prohibitedInstructionScan": {
    "mediaFixturesCopied": false,
    "secretOrServiceAccountCopied": false,
    "supabaseCredentialCopied": false,
    "providerCredentialCopied": false,
    "modelWeightsCopied": false,
    "dockerComposeOrCloudRunConfigCopied": false,
    "workerRuntimeEntrypointEnabled": false,
    "publicArtifactPathCreated": false,
    "signedUrlSourceConfigured": false
  },
  "blockedExecutionScope": {
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
    "artifactCreation": false
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

No prohibited source-copy or execution-enabling instruction is approved by this gate.
