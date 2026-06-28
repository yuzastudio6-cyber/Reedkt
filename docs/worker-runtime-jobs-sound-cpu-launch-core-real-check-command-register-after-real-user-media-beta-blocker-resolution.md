# WORKER_RUNTIME_JOBS SOUND CPU Launch Core Real Check Command Register After Real User Media Beta Blocker Resolution

```json worker-runtime-jobs-sound-cpu-launch-core-real-check-command-register-after-real-user-media-beta-blocker-resolution
{
  "label": "worker-runtime-jobs-sound-cpu-launch-core-real-check-command-register-after-real-user-media-beta-blocker-resolution",
  "owner": "WORKER_RUNTIME_JOBS",
  "sourceDecision": "worker_runtime_jobs_sound_cpu_real_user_media_beta_blocker_resolution_after_bounded_external_beta_completed_with_warnings_ready_for_launch_core_real_check_plan_no_runtime_no_production",
  "sourcePr": 1425,
  "sourceMergeCommit": "b1fb65a130dbbf352a15a16b7bf1e775fb0a8e3a",
  "decision": "worker_runtime_jobs_sound_cpu_launch_core_real_check_plan_after_real_user_media_beta_blocker_resolution_completed_with_warnings_ready_for_controlled_real_check_proof_no_runtime_no_production",
  "plannedRunner": {
    "sourceFunction": "runProductionToolReadiness",
    "mode": "realCheckMode",
    "strict": false,
    "coreToolFunction": "runCoreCpuRenderReadinessChecks",
    "actualExecutionInThisPacket": false
  },
  "commandChecks": [
    {
      "toolId": "ffmpeg",
      "command": "ffmpeg",
      "args": [
        "-version"
      ],
      "expectedPattern": "ffmpeg version",
      "manualReviewRequired": false,
      "allowedFutureProof": true
    },
    {
      "toolId": "ffprobe",
      "command": "ffprobe",
      "args": [
        "-version"
      ],
      "expectedPattern": "ffprobe version",
      "manualReviewRequired": false,
      "allowedFutureProof": true
    },
    {
      "toolId": "libass",
      "command": "ffmpeg",
      "args": [
        "-filters"
      ],
      "expectedPattern": "ass_or_subtitle",
      "manualReviewRequired": true,
      "allowedFutureProof": true
    }
  ],
  "pythonImportChecks": [
    "av",
    "scenedetect",
    "cv2",
    "duckdb",
    "polars",
    "opentimelineio",
    "OpenImageIO",
    "PyOpenColorIO"
  ],
  "nodePackageMetadataChecks": [
    "sharp/package.json",
    "remotion/package.json",
    "hyperframe/package.json"
  ],
  "policyChecks": [
    "ffmpeg_lgpl_safe_build_manual_review",
    "revideo_evaluation_only_policy"
  ],
  "commandRegisterConclusion": {
    "plannedChecksTotal": 16,
    "realChecksExecutedToday": false,
    "futureProofMustCaptureSanitizedOutputOnly": true,
    "futureProofMustKeepPackageLockUnchanged": true
  }
}
```

The register names the planned checks exactly so the future proof cannot expand into media processing or product tool execution.
