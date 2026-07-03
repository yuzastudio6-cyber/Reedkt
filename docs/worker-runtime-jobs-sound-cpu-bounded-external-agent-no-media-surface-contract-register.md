# WORKER_RUNTIME_JOBS SOUND CPU Bounded External-Agent No-Media Surface Contract Register

```json worker-runtime-jobs-sound-cpu-bounded-external-agent-no-media-surface-contract-register
{
  "label": "worker-runtime-jobs-sound-cpu-bounded-external-agent-no-media-surface-contract-register",
  "owner": "WORKER_RUNTIME_JOBS",
  "decision": "worker_runtime_jobs_sound_cpu_bounded_external_agent_no_media_execution_surface_plan_completed_with_warnings_ready_for_surface_proof",
  "surfaceContract": {
    "requestKind": "sound_cpu_agent_callable_no_media_tool_call",
    "harnessKind": "sound_cpu_real_external_agent_no_media_harness",
    "agentOrigin": "external_agent_no_media_harness",
    "adapterMode": "bounded_no_real_media_external_agent_local",
    "inputMode": "stdin_or_input_json",
    "outputMode": "stdout_json_only",
    "writesFiles": false,
    "readsMedia": false,
    "dispatchesWorkers": false,
    "executesRoutes": false,
    "requiresCredentials": false,
    "mutatesSupabase": false,
    "createsArtifacts": false
  },
  "requiredIdentityFields": [
    "approvedPlanSnapshotId",
    "workspaceId",
    "projectId",
    "jobId",
    "idempotencyKey",
    "workerName",
    "imageName",
    "jobType"
  ],
  "acceptedWorkers": [
    "sound-cpu-analysis-worker",
    "sound-audio-metadata-worker"
  ],
  "acceptedImages": [
    "reeditpro/sound-cpu-analysis-worker",
    "reeditpro/sound-audio-metadata-worker"
  ],
  "acceptedJobTypes": [
    "sound.package_import_smoke",
    "sound.numeric_array_analysis",
    "sound.symbolic_midi_analysis",
    "sound.loudness_synthetic_analysis"
  ]
}
```

The surface is local and credentialless. It is a bounded execution contract around the existing no-media adapter and harness, not a production route or worker runtime.
