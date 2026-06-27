# WORKER_RUNTIME_JOBS SOUND CPU Image Runtime Import Failure Detail Register

```json worker-runtime-jobs-sound-cpu-image-runtime-import-failure-detail-register
{
  "owner": "WORKER_RUNTIME_JOBS",
  "decision": "worker_runtime_jobs_sound_cpu_image_runtime_import_failure_diagnostics_completed_with_warnings_ready_for_dockerfile_runtime_dependency_fix_plan",
  "failureDetails": [
    {
      "module": "audioflux",
      "status": "failed",
      "errorType": "OSError",
      "sanitizedMessage": "<path>: cannot open shared object file: No such file or directory",
      "sanitizedExceptionOnly": "OSError: <path>: cannot open shared object file: No such file or directory",
      "hints": [
        "No such file or directory",
        "OSError",
        "cannot open shared object file"
      ],
      "pathRedacted": true,
      "recommendedNextAnalysis": "Determine whether the missing shared object is package-internal or a missing system library before changing Dockerfile dependencies."
    },
    {
      "module": "pedalboard",
      "status": "failed",
      "errorType": "ImportError",
      "sanitizedMessage": "libatomic.so.1: cannot open shared object file: No such file or directory",
      "sanitizedExceptionOnly": "ImportError: libatomic.so.1: cannot open shared object file: No such file or directory",
      "hints": [
        "ImportError",
        "No such file or directory",
        "cannot open shared object file"
      ],
      "pathRedacted": false,
      "recommendedNextAnalysis": "Plan a minimal Dockerfile runtime dependency fix for libatomic.so.1, likely Debian libatomic1, then re-run the import proof."
    }
  ],
  "runtimeFlags": {
    "REEDITPRO_SOUND_CPU_RUNTIME_ENABLED": "0",
    "REEDITPRO_WORKER_EXECUTION_ENABLED": "0",
    "REEDITPRO_MEDIA_PROCESSING_ENABLED": "0"
  },
  "executionScope": {
    "mediaOpened": false,
    "workerExecutionAttempted": false,
    "routeExecutionAttempted": false,
    "toolExecutionAttempted": false,
    "artifactCreated": false
  }
}
```
