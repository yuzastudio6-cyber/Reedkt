# WORKER_RUNTIME_JOBS SOUND CPU Controlled Launch Core Python Proof Register After Plan

```json worker-runtime-jobs-sound-cpu-controlled-launch-core-python-proof-register-after-plan
{
  "label": "worker-runtime-jobs-sound-cpu-controlled-launch-core-python-proof-register-after-plan",
  "owner": "WORKER_RUNTIME_JOBS",
  "sourceDecision": "worker_runtime_jobs_sound_cpu_launch_core_dependency_install_plan_after_controlled_proof_completed_with_warnings_ready_for_controlled_dependency_install_proof_no_runtime_no_production",
  "sourcePr": 1435,
  "sourceMergeCommit": "70c37bbee038b46bb67785e16d489a506ec4b1df",
  "decision": "worker_runtime_jobs_sound_cpu_controlled_launch_core_dependency_install_proof_after_plan_passed_required_checks_with_warnings_ready_for_dependency_install_proof_owner_review_no_runtime_no_production",
  "pythonProof": {
    "pythonVersion": "3.13.13",
    "venvPath": "/tmp/reeditpro-launch-core-proof-venv",
    "venvInsideRepo": false,
    "tempVenvRemoved": true,
    "mediaOpened": false,
    "runtimeExecuted": false,
    "installedPackages": [
      {
        "module": "av",
        "version": "17.1.0",
        "status": "passed"
      },
      {
        "module": "scenedetect",
        "version": "0.7",
        "status": "passed"
      },
      {
        "module": "cv2",
        "version": "4.13.0",
        "status": "passed"
      },
      {
        "module": "duckdb",
        "version": "1.5.4",
        "status": "passed"
      },
      {
        "module": "polars",
        "version": "1.42.0",
        "status": "passed"
      },
      {
        "module": "opentimelineio",
        "version": "0.18.1",
        "status": "passed"
      }
    ],
    "nativeWarning": {
      "observed": true,
      "summary": "PyAV and OpenCV wheels both reported AVFoundation receiver classes from bundled FFmpeg dylibs",
      "blocksRuntimeReadiness": true,
      "nextAction": "owner review must decide packaging isolation before runtime/media use"
    }
  },
  "pythonProofConclusion": {
    "requiredPythonImportsPassed": true,
    "requiredPythonImportCount": 6,
    "optionalPythonImportsStillDeferred": 2,
    "runtimeMediaReadApproved": false,
    "productionReady": false
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

The native warning is intentionally preserved. Passing import checks does not mean PyAV/OpenCV packaging is ready for real-user media processing.
