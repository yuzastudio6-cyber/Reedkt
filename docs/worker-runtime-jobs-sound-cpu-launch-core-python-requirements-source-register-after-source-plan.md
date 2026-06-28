# WORKER_RUNTIME_JOBS SOUND CPU Launch-Core Python Requirements Source Register After Source Plan

```json worker-runtime-jobs-sound-cpu-launch-core-python-requirements-source-register-after-source-plan
{
  "owner": "WORKER_RUNTIME_JOBS",
  "decision": "worker_runtime_jobs_sound_cpu_launch_core_persistent_manifest_source_creation_after_source_plan_completed_with_warnings_ready_for_persistent_manifest_owner_review_no_runtime_no_production",
  "requirementsSource": {
    "path": "server/workers/sound-cpu/requirements.launch-core.txt",
    "createdToday": true,
    "lineCount": 6,
    "sourcePurpose": "persistent launch-core dependency manifest for future SOUND CPU worker validation"
  },
  "requiredPins": [
    {
      "package": "av",
      "version": "17.1.0",
      "proofModule": "av",
      "runtimeUseApprovedToday": false
    },
    {
      "package": "scenedetect",
      "version": "0.7",
      "proofModule": "scenedetect",
      "runtimeUseApprovedToday": false
    },
    {
      "package": "opencv-python-headless",
      "version": "4.13.0.92",
      "proofModule": "cv2",
      "runtimeUseApprovedToday": false
    },
    {
      "package": "duckdb",
      "version": "1.5.4",
      "proofModule": "duckdb",
      "runtimeUseApprovedToday": false
    },
    {
      "package": "polars",
      "version": "1.42.0",
      "proofModule": "polars",
      "runtimeUseApprovedToday": false
    },
    {
      "package": "opentimelineio",
      "version": "0.18.1",
      "proofModule": "opentimelineio",
      "runtimeUseApprovedToday": false
    }
  ],
  "validationOnlyPolicy": {
    "pythonPackageInstallAllowedForValidation": true,
    "mediaFileOpenAllowed": false,
    "ffmpegInvocationAllowed": false,
    "opencvMediaOperationAllowed": false,
    "workerExecutionAllowed": false,
    "artifactCreationAllowed": false
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

The OpenCV persistent package uses `opencv-python-headless==4.13.0.92`; the import module remains `cv2`, matching the controlled proof.
