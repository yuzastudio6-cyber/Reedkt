# WORKER_RUNTIME_JOBS SOUND CPU Dockerfile Runtime Dependency Evidence Register

```json worker-runtime-jobs-sound-cpu-dockerfile-runtime-dependency-evidence-register
{
  "owner": "WORKER_RUNTIME_JOBS",
  "decision": "worker_runtime_jobs_sound_cpu_dockerfile_runtime_dependency_fix_plan_completed_with_warnings_ready_for_dockerfile_runtime_dependency_source_fix",
  "inputFailureEvidence": {
    "containerImportModulesPassed": 12,
    "containerImportModulesFailed": 2,
    "failedModules": [
      {
        "module": "audioflux",
        "errorType": "OSError",
        "sanitizedMessage": "<path>: cannot open shared object file: No such file or directory",
        "sourceRegister": "docs/worker-runtime-jobs-sound-cpu-image-runtime-import-failure-detail-register.md"
      },
      {
        "module": "pedalboard",
        "errorType": "ImportError",
        "sanitizedMessage": "libatomic.so.1: cannot open shared object file: No such file or directory",
        "sourceRegister": "docs/worker-runtime-jobs-sound-cpu-image-runtime-import-failure-detail-register.md"
      }
    ]
  },
  "additionalControlledDiagnostics": {
    "dockerBuildUsed": "cache_only_for_package_layout_diagnostics",
    "dockerNetwork": "none_for_runtime_probes",
    "dockerImageRemoved": true,
    "productExecutionAttempted": false,
    "mediaExecutionAttempted": false,
    "workerExecutionAttempted": false,
    "routeExecutionAttempted": false,
    "artifactCreated": false
  },
  "audiofluxPackageLayout": {
    "packageSpecFound": true,
    "sharedLibraryFilesExist": true,
    "representativeFiles": [
      "audioflux/lib/libaudioflux.so",
      "audioflux/lib/lib/libmkl_core.so.2",
      "audioflux/lib/lib/libomp.so.5"
    ],
    "ldLibraryPathProbePassed": false,
    "ldLibraryPathProbeMessage": "<audioflux>/lib/libaudioflux.so: cannot open shared object file: No such file or directory"
  },
  "elfArchitectureEvidence": {
    "imageArchitecture": "linux/arm64",
    "audiofluxSharedObjects": [
      {"relativePath": "lib/libaudioflux.so", "machineName": "x86_64"},
      {"relativePath": "lib/lib/libmkl_core.so.2", "machineName": "x86_64"},
      {"relativePath": "lib/lib/libomp.so.5", "machineName": "x86_64"}
    ]
  },
  "cleanup": {
    "diagnosticImageTag": "reeditpro-sound-cpu:runtime-dependency-fix-plan-local",
    "postCleanupImagePresent": false
  }
}
```
