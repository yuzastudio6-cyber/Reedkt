# WORKER_RUNTIME_JOBS SOUND CPU Real External-Agent No-Media Harness Invocation Register

```json worker-runtime-jobs-sound-cpu-real-external-agent-no-media-harness-invocation-register
{
  "label": "worker-runtime-jobs-sound-cpu-real-external-agent-no-media-harness-invocation-register",
  "owner": "WORKER_RUNTIME_JOBS",
  "decision": "worker_runtime_jobs_sound_cpu_real_external_agent_no_media_harness_proof_passed_with_warnings_ready_for_harness_owner_review",
  "acceptedInvocation": {
    "harnessKind": "sound_cpu_real_external_agent_no_media_harness",
    "agentOrigin": "external_agent_no_media_harness",
    "agentSessionIdPresent": true,
    "agentRequestIdPresent": true,
    "adapterMode": "bounded_no_real_media_external_agent_local",
    "jobType": "sound.package_import_smoke",
    "acceptedToolCount": 15,
    "externalAgentEnvelopeAccepted": true
  },
  "blockedInvocations": [
    {
      "name": "invalidOrigin",
      "expectedStopReason": "agent_origin_invalid"
    },
    {
      "name": "agentSecret",
      "expectedStopReason": "agentSecret_not_allowed"
    },
    {
      "name": "mediaPath",
      "expectedStopReason": "adapter_mediaFilePath_not_allowed"
    },
    {
      "name": "trueRuntimeFlag",
      "expectedStopReason": "adapter_runtime_flags_must_all_be_false"
    }
  ],
  "toolCoverage": {
    "expectedToolCount": 15,
    "acceptedToolCount": 15,
    "allToolsPreserved": true
  }
}
```

The blocked cases are part of the proof, not bugs: they demonstrate that unsafe external-agent-origin requests stop before any side effect.
