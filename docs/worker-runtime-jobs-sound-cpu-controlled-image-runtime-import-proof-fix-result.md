# WORKER_RUNTIME_JOBS SOUND CPU Controlled Image Runtime Import Proof Fix Result

```json worker-runtime-jobs-sound-cpu-controlled-image-runtime-import-proof-fix-result
{
  "owner": "WORKER_RUNTIME_JOBS",
  "decision": "worker_runtime_jobs_sound_cpu_controlled_image_runtime_import_proof_fix_blocked_import_failures_ready_for_import_failure_diagnostics",
  "sourceVerification": {
    "sourceHead": "99cd5368bc61fc42ac36ba4e7022d1acba317616",
    "pr1139": {
      "status": "merged",
      "mergeCommit": "99cd5368bc61fc42ac36ba4e7022d1acba317616",
      "decision": "worker_runtime_jobs_sound_cpu_controlled_image_runtime_import_proof_blocked_probe_invocation_no_output_ready_for_fix"
    },
    "pr1137": {
      "status": "merged",
      "mergeCommit": "1365e0db50c554491f741089128e87465b6ef85b"
    },
    "samePurposeOpenPrFoundBeforeCreation": false
  },
  "proofResult": {
    "dockerVersion": "29.5.2",
    "dockerDaemonAvailable": true,
    "dockerServerVersion": "29.5.2",
    "dockerOsType": "linux",
    "dockerArchitecture": "aarch64",
    "diskPreflightFreeApprox": "25Gi",
    "imageTag": "reeditpro-sound-cpu:controlled-image-runtime-import-proof-local",
    "dockerBuildPassed": true,
    "dockerBuildUsedCache": true,
    "dockerRunInvoked": true,
    "dockerRunUsedStdinSafeProbe": true,
    "dockerRunNetwork": "none",
    "probeJsonProduced": true,
    "metadataPassedCount": 13,
    "metadataFailedCount": 0,
    "importPassedCount": 12,
    "importFailedCount": 2,
    "aliasCoveredToolCount": 2,
    "failedImportModules": [
      {
        "module": "audioflux",
        "errorType": "OSError"
      },
      {
        "module": "pedalboard",
        "errorType": "ImportError"
      }
    ],
    "pydubFfmpegWarningObserved": true,
    "pydubFfmpegWarningClassification": "accepted_warning_no_media_operation",
    "imageInspectPassed": true,
    "imageRemoved": true,
    "localTagRemoved": true,
    "containerRuntimeImportProofPassed": false,
    "productToolCallExecutionReadyCount": 0,
    "externalBetaReadyCount": 0,
    "productionReadyCount": 0,
    "blocker": "audioflux_and_pedalboard_import_failures"
  },
  "nextPrompt": "WORKER_RUNTIME_JOBS-SOUND-CPU-IMAGE-RUNTIME-IMPORT-FAILURE-DIAGNOSTICS: capture sanitized audioflux/pedalboard import failure detail, no media/no push/no GCP"
}
```
