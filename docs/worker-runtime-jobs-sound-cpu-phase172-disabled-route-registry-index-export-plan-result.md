# WORKER_RUNTIME_JOBS SOUND CPU Phase172 Disabled Route Registry Index Export Plan Result

```json worker-runtime-jobs-sound-cpu-phase172-disabled-route-registry-index-export-plan-result
{
  "label": "worker-runtime-jobs-sound-cpu-phase172-disabled-route-registry-index-export-plan-result",
  "decision": "worker_runtime_jobs_sound_cpu_phase172_disabled_route_registry_index_export_plan_completed_with_warnings_ready_for_registry_index_export_owner_review",
  "sourceVerification": {
    "sourcePr": 2223,
    "sourceMergeCommit": "7a87b046a8d6a2c869f1c58b728068044b979342",
    "sourceDecision": "worker_runtime_jobs_sound_cpu_phase171_disabled_route_registration_source_owner_review_passed_with_warnings_ready_for_registry_index_export_plan"
  },
  "planResult": {
    "registryIndexExportPlanned": true,
    "candidateIndexPath": "server/workers/sound-cpu/index.ts",
    "candidateRegistryPath": "server/workers/sound-cpu/disabled-route-registry.ts",
    "plannedExports": [
      "SOUND_CPU_DISABLED_ROUTE_REGISTRY_NAME",
      "SOUND_CPU_DISABLED_ROUTE_REGISTRY_STATUS",
      "SOUND_CPU_DISABLED_ROUTE_REGISTRY_EXECUTION_ENABLED",
      "SOUND_CPU_DISABLED_ROUTE_REGISTRY_ENTRY",
      "SOUND_CPU_DISABLED_ROUTE_REGISTRY",
      "listSoundCpuDisabledRouteRegistry",
      "getSoundCpuDisabledRouteRegistryEntry",
      "createSoundCpuDisabledRouteRegistryResult",
      "assertSoundCpuDisabledRouteRegistryExecutionBlocked"
    ],
    "plannedTypeExports": [
      "SoundCpuDisabledRouteRegistryEntry"
    ],
    "indexExportSourceChangeMadeToday": false,
    "existingAdjacentExpressRouteMutatedToday": false,
    "expressRouteRegisteredToday": false,
    "workerDispatchExecutionEnabled": false,
    "routeExecutionEnabled": false,
    "supabaseMutationEnabled": false,
    "sqlExecutionEnabled": false,
    "mediaProcessingEnabled": false,
    "artifactCreationEnabled": false
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
