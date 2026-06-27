# WORKER_RUNTIME_JOBS SOUND CPU Dockerfile Runtime Dependency Fix Plan

```json worker-runtime-jobs-sound-cpu-dockerfile-runtime-dependency-fix-plan
{
  "owner": "WORKER_RUNTIME_JOBS",
  "decision": "worker_runtime_jobs_sound_cpu_dockerfile_runtime_dependency_fix_plan_completed_with_warnings_ready_for_dockerfile_runtime_dependency_source_fix",
  "sourceEvidence": {
    "sourceHead": "a15d72f3bb74868140b0620d8500f54f5da70404",
    "pr1144": {
      "status": "merged",
      "decision": "worker_runtime_jobs_sound_cpu_image_runtime_import_failure_diagnostics_completed_with_warnings_ready_for_dockerfile_runtime_dependency_fix_plan"
    },
    "pr1141": {
      "status": "merged",
      "decision": "worker_runtime_jobs_sound_cpu_controlled_image_runtime_import_proof_fix_blocked_import_failures_ready_for_import_failure_diagnostics"
    }
  },
  "currentReadiness": {
    "metadataPackagesPassed": 13,
    "containerImportModulesPassed": 12,
    "containerImportModulesFailed": 2,
    "failingModules": ["audioflux", "pedalboard"],
    "productToolCallReadyCount": 0,
    "externalBetaReadyCount": 0,
    "productionReadyCount": 0
  },
  "fixPlan": {
    "pedalboard": {
      "classification": "missing_system_runtime_library",
      "missingLibrary": "libatomic.so.1",
      "plannedDebianPackage": "libatomic1",
      "sourceMutationAllowedInNextGate": true
    },
    "audioflux": {
      "classification": "image_architecture_mismatch_for_bundled_shared_libraries",
      "currentImageArchitecture": "linux/arm64",
      "bundledSharedLibraryArchitecture": "x86_64",
      "plannedApproach": "use an explicit linux/amd64 SOUND CPU image lane if all 15 tools must remain in scope",
      "sourceMutationAllowedInNextGate": true,
      "fallbackIfRejected": "keep audioflux blocked or split it out until an arm64-compatible wheel/source-build path is approved"
    }
  },
  "nextPrompt": "WORKER_RUNTIME_JOBS-SOUND-CPU-DOCKERFILE-RUNTIME-DEPENDENCY-SOURCE-FIX: add amd64 image lane and libatomic1, no media/no push/no GCP"
}
```
