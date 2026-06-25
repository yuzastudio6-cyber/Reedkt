# WORKER_RUNTIME_JOBS SOUND CPU Synthetic Route Source Validation Acceptance Register

```json worker-runtime-jobs-sound-cpu-synthetic-route-source-validation-acceptance-register
{
  "owner": "WORKER_RUNTIME_JOBS",
  "decision": "worker_runtime_jobs_sound_cpu_synthetic_route_source_validation_owner_review_passed_with_warnings_ready_for_controlled_route_execution_planning",
  "acceptedSourceValidationDecision": "sound_runtime_media_gate_2f_controlled_synthetic_route_source_validation_passed_with_warnings_ready_for_validation_owner_review",
  "acceptedValidationProperties": {
    "nodeBuiltinsOnly": true,
    "staticSourceReadOnly": true,
    "sourceImported": false,
    "inMemorySyntheticContractsOnly": true,
    "workerExecutionRun": false,
    "routeExecutionRun": false,
    "toolExecutionRun": false,
    "mediaProcessingRun": false,
    "dockerRun": false,
    "dockerPush": false,
    "gcpTouched": false,
    "supabaseTouched": false,
    "sqlExecuted": false,
    "artifactCreated": false
  },
  "acceptedSourceFiles": [
    "server/workers/sound-cpu/synthetic-route-types.ts",
    "server/workers/sound-cpu/synthetic-route-decision.ts",
    "server/workers/sound-cpu/index.ts"
  ],
  "acceptedJobTypes": [
    "sound.package_import_smoke",
    "sound.numeric_array_analysis",
    "sound.symbolic_midi_analysis",
    "sound.loudness_synthetic_analysis"
  ],
  "acceptedForControlledRouteExecutionPlanning": true,
  "acceptedForControlledRouteExecutionToday": false,
  "acceptedForWorkerExecutionToday": false,
  "acceptedForToolExecutionToday": false,
  "acceptedForBetaUnlockToday": false
}
```
