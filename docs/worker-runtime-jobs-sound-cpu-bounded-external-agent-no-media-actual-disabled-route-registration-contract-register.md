# WORKER_RUNTIME_JOBS SOUND CPU Bounded External-Agent No-Media Actual Disabled Route Registration Contract Register

```json worker-runtime-jobs-sound-cpu-bounded-external-agent-no-media-actual-disabled-route-registration-contract-register
{
  "label": "worker-runtime-jobs-sound-cpu-bounded-external-agent-no-media-actual-disabled-route-registration-contract-register",
  "decision": "worker_runtime_jobs_sound_cpu_bounded_external_agent_no_media_actual_disabled_route_registration_source_gate_completed_with_warnings_ready_for_disabled_route_registration_source_owner_review",
  "acceptedTools": [
    "librosa",
    "audioread",
    "pydub",
    "scipy",
    "resampy",
    "pyloudnorm",
    "audioflux",
    "music21",
    "pretty_midi",
    "mido",
    "noisereduce",
    "pedalboard",
    "mir_eval",
    "pydub_effects",
    "ebu_r128_pyloudnorm"
  ],
  "acceptedWorkers": [
    "sound-cpu-analysis-worker",
    "sound-audio-metadata-worker"
  ],
  "acceptedImages": [
    "reeditpro/sound-cpu-analysis-worker",
    "reeditpro/sound-audio-metadata-worker"
  ],
  "acceptedNoMediaJobTypes": [
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
    "attemptMetadata",
    "staticOnlyRuntimeFlags"
  ],
  "failClosedBehavior": {
    "blockedStatusCode": 409,
    "explicitToolIdRequired": true,
    "unsafeEnvelopeFieldsRejected": true,
    "runtimeFlagTrueRejected": true,
    "readinessClaimsRejected": true,
    "acceptedForExecution": false
  }
}
```

The registration source preserves the no-media contract and still rejects unsafe execution envelopes.
