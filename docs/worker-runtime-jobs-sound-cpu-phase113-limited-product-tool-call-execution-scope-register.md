# WORKER_RUNTIME_JOBS SOUND CPU Phase 113 Limited Product Tool-Call Execution Scope Register

```json worker-runtime-jobs-sound-cpu-phase113-limited-product-tool-call-execution-scope-register
{
  "label": "worker-runtime-jobs-sound-cpu-phase113-limited-product-tool-call-execution-scope-register",
  "decision": "worker_runtime_jobs_sound_cpu_phase113_limited_product_tool_call_execution_plan_completed_with_warnings_ready_for_limited_product_tool_call_execution_owner_review_no_real_user_media",
  "limitedToolCallEnvelope": {
    "toolCount": 15,
    "workers": [
      "sound-cpu-analysis-worker",
      "sound-audio-metadata-worker"
    ],
    "images": [
      "reeditpro/sound-cpu-analysis-worker",
      "reeditpro/sound-audio-metadata-worker"
    ],
    "jobTypes": [
      "sound.package_import_smoke",
      "sound.numeric_array_analysis",
      "sound.symbolic_midi_analysis",
      "sound.loudness_synthetic_analysis"
    ],
    "inputPolicy": {
      "syntheticOrNoMediaOnly": true,
      "realUserMediaAllowed": false,
      "rawPromptAllowed": false,
      "signedUrlInputAllowed": false,
      "storageObjectInputAllowed": false,
      "providerOutputBlobAllowed": false,
      "secretPayloadAllowed": false
    },
    "runtimePolicy": {
      "productToolCallExecutionAllowedToday": false,
      "workerDispatchAllowedToday": false,
      "routeExecutionAllowedToday": false,
      "manifestPersistenceAllowedToday": false,
      "mediaOpenAllowedToday": false,
      "artifactWriteAllowedToday": false
    }
  }
}
```

The envelope is the planned boundary for a future owner-approved proof.
