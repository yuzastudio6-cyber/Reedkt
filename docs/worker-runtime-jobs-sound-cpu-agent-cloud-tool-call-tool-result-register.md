# WORKER_RUNTIME_JOBS SOUND CPU Agent Cloud Tool-Call Tool Result Register

```json worker-runtime-jobs-sound-cpu-agent-cloud-tool-call-tool-result-register
{
  "label": "worker-runtime-jobs-sound-cpu-agent-cloud-tool-call-tool-result-register",
  "owner": "WORKER_RUNTIME_JOBS",
  "decision": "worker_runtime_jobs_sound_cpu_agent_cloud_tool_call_proof_passed_with_warnings_ready_for_external_beta_blocker_reconciliation",
  "toolCounts": {
    "attempted": 15,
    "passed": 15,
    "failed": 0
  },
  "tools": [
    {
      "toolId": "librosa",
      "package": "librosa",
      "version": "0.11.0",
      "passed": true
    },
    {
      "toolId": "audioread",
      "package": "audioread",
      "version": "3.1.0",
      "passed": true
    },
    {
      "toolId": "pydub",
      "package": "pydub",
      "version": "0.25.1",
      "passed": true
    },
    {
      "toolId": "scipy",
      "package": "scipy",
      "version": "1.17.1",
      "passed": true
    },
    {
      "toolId": "resampy",
      "package": "resampy",
      "version": "0.4.3",
      "passed": true
    },
    {
      "toolId": "pyloudnorm",
      "package": "pyloudnorm",
      "version": "0.2.0",
      "passed": true
    },
    {
      "toolId": "audioflux",
      "package": "audioflux",
      "version": "0.1.9",
      "passed": true
    },
    {
      "toolId": "music21",
      "package": "music21",
      "version": "10.3.0",
      "passed": true
    },
    {
      "toolId": "pretty_midi",
      "package": "pretty_midi",
      "version": "0.2.11",
      "passed": true
    },
    {
      "toolId": "mido",
      "package": "mido",
      "version": "1.3.3",
      "passed": true
    },
    {
      "toolId": "noisereduce",
      "package": "noisereduce",
      "version": "3.0.3",
      "passed": true
    },
    {
      "toolId": "pedalboard",
      "package": "pedalboard",
      "version": "0.9.23",
      "passed": true
    },
    {
      "toolId": "mir_eval",
      "package": "mir_eval",
      "version": "0.8.2",
      "passed": true
    },
    {
      "toolId": "pydub_effects",
      "package": "pydub",
      "version": "0.25.1",
      "passed": true,
      "aliasCoveredBy": "pydub"
    },
    {
      "toolId": "ebu_r128_pyloudnorm",
      "package": "pyloudnorm",
      "version": "0.2.0",
      "passed": true,
      "aliasCoveredBy": "pyloudnorm"
    }
  ]
}
```

The two alias tools are covered by their owning packages: `pydub_effects` by `pydub`, and `ebu_r128_pyloudnorm` by `pyloudnorm`.
