# WORKER_RUNTIME_JOBS SOUND CPU Image Runtime Import Failure Diagnostics Result

```json worker-runtime-jobs-sound-cpu-image-runtime-import-failure-diagnostics-result
{
  "owner": "WORKER_RUNTIME_JOBS",
  "decision": "worker_runtime_jobs_sound_cpu_image_runtime_import_failure_diagnostics_completed_with_warnings_ready_for_dockerfile_runtime_dependency_fix_plan",
  "sourceVerification": {
    "sourceHead": "2166afddafefa5cb768d6a233d847d585c7642df",
    "pr1141": {
      "status": "merged",
      "mergeCommit": "2166afddafefa5cb768d6a233d847d585c7642df",
      "decision": "worker_runtime_jobs_sound_cpu_controlled_image_runtime_import_proof_fix_blocked_import_failures_ready_for_import_failure_diagnostics"
    },
    "pr1139": {
      "status": "merged",
      "mergeCommit": "99cd5368bc61fc42ac36ba4e7022d1acba317616"
    },
    "samePurposeOpenPrFoundBeforeCreation": false
  },
  "diagnosticsResult": {
    "dockerVersion": "29.5.2",
    "dockerDaemonAvailable": true,
    "dockerServerVersion": "29.5.2",
    "dockerOsType": "linux",
    "dockerArchitecture": "aarch64",
    "diskPreflightFreeApprox": "25Gi",
    "imageTag": "reeditpro-sound-cpu:controlled-image-runtime-import-proof-local",
    "dockerBuildPassed": true,
    "dockerBuildUsedCache": true,
    "diagnosticDockerRunInvoked": true,
    "diagnosticDockerRunNetwork": "none",
    "diagnosticJsonProduced": true,
    "diagnosedModules": [
      "audioflux",
      "pedalboard"
    ],
    "diagnosedFailureCount": 2,
    "imageInspectPassed": true,
    "imageRemoved": true,
    "localTagRemoved": true,
    "containerRuntimeImportProofPassed": false,
    "productToolCallExecutionReadyCount": 0,
    "externalBetaReadyCount": 0,
    "productionReadyCount": 0,
    "nextFixMustBePlannedBeforeDockerfileMutation": true
  },
  "nextPrompt": "WORKER_RUNTIME_JOBS-SOUND-CPU-DOCKERFILE-RUNTIME-DEPENDENCY-FIX-PLAN: plan Dockerfile runtime dependency fix for audioflux/pedalboard imports, no media/no push/no GCP"
}
```
