# WORKER_RUNTIME_JOBS SOUND CPU FFmpeg FFprobe Libass Static Validation Owner Acceptance Register

```json worker-runtime-jobs-sound-cpu-ffmpeg-ffprobe-libass-static-validation-owner-acceptance-register
{
  "owner": "WORKER_RUNTIME_JOBS",
  "decision": "worker_runtime_jobs_sound_cpu_ffmpeg_ffprobe_libass_static_validation_owner_review_passed_with_warnings_ready_for_controlled_launch_core_real_check_proof_no_media_no_production",
  "acceptedEvidence": {
    "staticValidationPassed": true,
    "dockerfileTextInspectionPassed": true,
    "requiredPackagesPresent": ["ffmpeg", "fontconfig", "fonts-dejavu-core", "libass9", "libatomic1"],
    "disabledRuntimeFlagsPresent": true,
    "nonRootUserPresent": true,
    "failClosedCommandPresent": true,
    "forbiddenCopyPatternsFound": false
  },
  "acceptedForNextGate": {
    "controlledLaunchCoreRealCheckProofPlanning": true,
    "commandVersionChecksMayBePlanned": true,
    "nodePackageMetadataChecksMayBePlanned": true,
    "policyManualReviewReadsMayBePlanned": true
  },
  "notAcceptedForToday": {
    "dockerBuildRunPush": false,
    "ffmpegCommandExecution": false,
    "ffprobeCommandExecution": false,
    "mediaProcessing": false,
    "runtimeExecution": false,
    "realUserMediaBetaAllowed": false,
    "paidProductionAllowed": false
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

Acceptance is limited to next-gate planning and controlled local proof review.
