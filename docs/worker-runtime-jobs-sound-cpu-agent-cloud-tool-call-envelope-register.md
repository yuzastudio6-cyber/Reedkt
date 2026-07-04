# WORKER_RUNTIME_JOBS SOUND CPU Agent Cloud Tool-Call Envelope Register

```json worker-runtime-jobs-sound-cpu-agent-cloud-tool-call-envelope-register
{
  "label": "worker-runtime-jobs-sound-cpu-agent-cloud-tool-call-envelope-register",
  "owner": "WORKER_RUNTIME_JOBS",
  "decision": "worker_runtime_jobs_sound_cpu_agent_cloud_tool_call_proof_passed_with_warnings_ready_for_external_beta_blocker_reconciliation",
  "adapter": {
    "script": "scripts/validation/worker-runtime-jobs-sound-cpu-agent-callable-no-media-tool-call-adapter.mjs",
    "requestKind": "sound_cpu_agent_callable_no_media_tool_call",
    "adapterMode": "bounded_no_real_media_external_agent_local",
    "selfTestStatus": "passed",
    "invocationCount": 4,
    "acceptedInvocationCount": 4,
    "toolDescriptorCountPerInvocation": 15,
    "runtimeFlagsAllFalse": true
  },
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
  "acceptedToolCount": 15,
  "syntheticBoundary": {
    "syntheticOrNoMediaInput": true,
    "realExternalAgentUsed": false,
    "realUserMediaUsed": false,
    "workerDispatchedByAdapter": false,
    "routeExecutedByAdapter": false,
    "mediaOpenedByAdapter": false,
    "manifestPersistedByAdapter": false,
    "artifactWrittenByAdapter": false,
    "supabaseTouchedByAdapter": false,
    "providerCalledByAdapter": false,
    "modelCalledByAdapter": false
  },
  "rejectedPayloadFields": [
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
  ]
}
```

The envelope proof remains synthetic and no-media. It accepts the four planning-only job categories and rejects raw prompts, real media locations, signed/public URLs, service-role payloads, model-weight locations, Docker run requests, and artifact write targets.
