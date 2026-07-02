# WORKER_RUNTIME_JOBS SOUND CPU Phase162 Disabled Route Index Export Plan Result

```json worker-runtime-jobs-sound-cpu-phase162-disabled-route-index-export-plan-result
{
  "label": "worker-runtime-jobs-sound-cpu-phase162-disabled-route-index-export-plan-result",
  "decision": "worker_runtime_jobs_sound_cpu_phase162_disabled_route_index_export_plan_completed_with_warnings_ready_for_disabled_route_index_export_owner_review",
  "sourceVerification": {
    "sourcePr": 2200,
    "sourceMergeCommit": "f276f41a3c25f4655db4b8f30c37592bb3381809",
    "sourceDecision": "worker_runtime_jobs_sound_cpu_phase161_disabled_route_source_owner_review_passed_with_warnings_ready_for_disabled_route_index_export_plan"
  },
  "planResult": {
    "indexExportPlanned": true,
    "candidateIndexPath": "server/workers/sound-cpu/index.ts",
    "candidateRoutePath": "server/workers/sound-cpu/disabled-dispatch-route.ts",
    "plannedExports": [
      "SOUND_CPU_DISABLED_DISPATCH_ROUTE_NAME",
      "SOUND_CPU_DISABLED_DISPATCH_ROUTE_STATUS",
      "SOUND_CPU_DISABLED_DISPATCH_ROUTE_BLOCKED_REASON",
      "SOUND_CPU_DISABLED_DISPATCH_ROUTE_INVALID_PAYLOAD_REASON",
      "createSoundCpuDisabledDispatchRouteResult",
      "assertSoundCpuDisabledDispatchRouteExecutionBlocked"
    ],
    "plannedTypeExports": [
      "SoundCpuDisabledDispatchRouteInput",
      "SoundCpuDisabledDispatchRouteInvalidPayloadResult",
      "SoundCpuDisabledDispatchRouteResult"
    ],
    "indexExportAddedToday": false,
    "routeRegisteredToday": false,
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
