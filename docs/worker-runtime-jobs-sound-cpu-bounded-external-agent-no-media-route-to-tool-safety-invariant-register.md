# WORKER_RUNTIME_JOBS SOUND CPU Bounded No-Media Route-To-Tool Safety Invariant Register

```json worker-runtime-jobs-sound-cpu-bounded-external-agent-no-media-route-to-tool-safety-invariant-register
{
  "decision": "worker_runtime_jobs_sound_cpu_bounded_external_agent_no_media_route_to_tool_execution_unlock_plan_completed_with_warnings_ready_for_route_to_tool_source_gate",
  "invariantsRequiredForSourceGate": {
    "allowlistedToolIdsOnly": true,
    "syntheticOrNoMediaInputOnly": true,
    "staticRuntimeFlagsMustRemainFalse": true,
    "recursiveForbiddenFieldRejection": true,
    "noWorkerDispatch": true,
    "noMediaOpen": true,
    "noProviderModelCall": true,
    "noSupabaseSql": true,
    "noArtifactCreation": true,
    "noDockerCloudRun": true,
    "noBetaProductionUnlock": true
  },
  "stopConditions": [
    "route would need real media bytes",
    "route would need worker dispatch or persistence",
    "route would need service-role or Supabase writes",
    "route would need broad runtime enabled flags",
    "route cannot preserve sideEffects false"
  ]
}
```
