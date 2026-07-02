# WORKER_RUNTIME_JOBS SOUND CPU Phase 127 Limited External-Agent Product Tool-Call Execution Preflight Tool Invocation Plan No Real User Media

```json worker-runtime-jobs-sound-cpu-phase127-limited-external-agent-product-tool-call-execution-preflight-tool-invocation-plan-no-real-user-media
{
  "label": "worker-runtime-jobs-sound-cpu-phase127-limited-external-agent-product-tool-call-execution-preflight-tool-invocation-plan-no-real-user-media",
  "decision": "worker_runtime_jobs_sound_cpu_phase127_limited_external_agent_product_tool_call_execution_preflight_no_real_user_media_completed_with_warnings_ready_for_limited_external_agent_product_tool_call_execution_preflight_owner_review_no_real_user_media",
  "plannedFutureExecutionOnly": {
    "expectedInvocationCount": 4,
    "expectedToolDescriptorCountPerInvocation": 15,
    "invocations": [
      {
        "jobType": "sound.package_import_smoke",
        "workerName": "sound-cpu-analysis-worker",
        "imageName": "reeditpro/sound-cpu-analysis-worker",
        "inputKind": "synthetic_no_real_user_media"
      },
      {
        "jobType": "sound.numeric_array_analysis",
        "workerName": "sound-audio-metadata-worker",
        "imageName": "reeditpro/sound-audio-metadata-worker",
        "inputKind": "synthetic_no_real_user_media"
      },
      {
        "jobType": "sound.symbolic_midi_analysis",
        "workerName": "sound-cpu-analysis-worker",
        "imageName": "reeditpro/sound-cpu-analysis-worker",
        "inputKind": "synthetic_no_real_user_media"
      },
      {
        "jobType": "sound.loudness_synthetic_analysis",
        "workerName": "sound-audio-metadata-worker",
        "imageName": "reeditpro/sound-audio-metadata-worker",
        "inputKind": "synthetic_no_real_user_media"
      }
    ]
  },
  "notExecutedInThisGate": {
    "limitedExternalAgentProductToolCallExecution": true,
    "realExternalAgentExecution": true,
    "realUserMediaExecution": true,
    "workerDispatch": true,
    "routeExecution": true,
    "manifestPersistence": true
  }
}
```

This is a preflight invocation plan only; execution requires the next owner review.
