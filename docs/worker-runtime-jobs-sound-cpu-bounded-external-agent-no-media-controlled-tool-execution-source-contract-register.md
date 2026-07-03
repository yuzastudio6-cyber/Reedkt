# WORKER_RUNTIME_JOBS SOUND CPU Controlled Tool Execution Source Contract Register

```json worker-runtime-jobs-sound-cpu-bounded-external-agent-no-media-controlled-tool-execution-source-contract-register
{
  "label": "worker-runtime-jobs-sound-cpu-bounded-external-agent-no-media-controlled-tool-execution-source-contract-register",
  "decision": "worker_runtime_jobs_sound_cpu_bounded_external_agent_no_media_controlled_tool_execution_source_gate_completed_with_warnings_ready_for_controlled_tool_execution_proof",
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
  ],
  "requiredEnvelopeFields": [
    "approvedPlanSnapshotId",
    "workspaceId",
    "projectId",
    "jobId",
    "idempotencyKey",
    "workerName",
    "imageName",
    "jobType",
    "toolId",
    "runtimeFlags",
    "claims"
  ],
  "runtimeFlagsRequiredFalse": [
    "allowRealExternalAgentExecution",
    "allowRealUserMedia",
    "allowWorkerDispatch",
    "allowRouteExecution",
    "allowManifestPersistence",
    "allowMediaOpen",
    "allowProviderCall",
    "allowModelCall",
    "allowSupabaseMutation",
    "allowSqlExecution",
    "allowStorageObjectCreation",
    "allowSignedUrlCreation",
    "allowPublicArtifactCreation",
    "allowBetaUnlock",
    "allowProductionUnlock"
  ],
  "forbiddenPayloadFields": [
    "rawPrompt",
    "mediaFilePath",
    "sourceMediaUrl",
    "signedUrl",
    "publicArtifactUrl",
    "artifactWriteTarget",
    "providerOutputBlob",
    "serviceRolePayload",
    "supabaseWriteIntent",
    "sqlStatement",
    "modelWeightLocation",
    "gcpResourceTarget",
    "dockerRunRequest",
    "betaUserExecutionRequest",
    "realExternalAgentRequest",
    "realUserMediaManifest",
    "manifestPersistenceRequest",
    "workerDispatchRequest",
    "routeExecutionRequest"
  ],
  "acceptedForExecutionInThisGate": false,
  "acceptedForControlledProofNext": true
}
```
