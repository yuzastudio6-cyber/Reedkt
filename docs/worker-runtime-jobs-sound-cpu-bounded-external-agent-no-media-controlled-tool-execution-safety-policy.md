# WORKER_RUNTIME_JOBS SOUND CPU Controlled Tool Execution Safety Policy

```json worker-runtime-jobs-sound-cpu-bounded-external-agent-no-media-controlled-tool-execution-safety-policy
{
  "label": "worker-runtime-jobs-sound-cpu-bounded-external-agent-no-media-controlled-tool-execution-safety-policy",
  "decision": "worker_runtime_jobs_sound_cpu_bounded_external_agent_no_media_controlled_tool_execution_source_gate_completed_with_warnings_ready_for_controlled_tool_execution_proof",
  "allowedInNextProof": {
    "syntheticInMemoryNumericArrays": true,
    "syntheticInMemoryMidiObjects": true,
    "syntheticSilentPydubSegments": true,
    "packageImports": true,
    "metadataVersionChecks": true
  },
  "blocked": {
    "realUserMedia": false,
    "mediaFileOpen": false,
    "ffmpegOrFfprobe": false,
    "workerDispatch": false,
    "routeExecution": false,
    "providerCall": false,
    "modelCall": false,
    "supabaseMutation": false,
    "sqlExecution": false,
    "storageObjectCreation": false,
    "signedUrlCreation": false,
    "publicArtifactCreation": false,
    "dockerOrCloudRunExecution": false,
    "betaUnlock": false,
    "productionUnlock": false
  },
  "stopInsteadOfForce": true
}
```
