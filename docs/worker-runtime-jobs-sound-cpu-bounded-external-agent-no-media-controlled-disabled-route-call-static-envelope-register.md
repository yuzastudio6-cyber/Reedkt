# WORKER_RUNTIME_JOBS SOUND CPU Bounded External-Agent No-Media Controlled Disabled Route Call Static Envelope Register

```json worker-runtime-jobs-sound-cpu-bounded-external-agent-no-media-controlled-disabled-route-call-static-envelope-register
{
  "label": "worker-runtime-jobs-sound-cpu-bounded-external-agent-no-media-controlled-disabled-route-call-static-envelope-register",
  "owner": "WORKER_RUNTIME_JOBS",
  "decision": "worker_runtime_jobs_sound_cpu_bounded_external_agent_no_media_controlled_disabled_route_call_proof_passed_with_warnings_ready_for_disabled_route_call_proof_owner_review",
  "safeEnvelope": {
    "approvedPlanSnapshotId": "approved-plan-snapshot-sound-cpu-disabled-route-call-proof",
    "workspaceId": "workspace-sound-cpu-disabled-route-call-proof",
    "projectId": "project-sound-cpu-disabled-route-call-proof",
    "jobId": "job-sound-cpu-disabled-route-call-proof",
    "idempotencyKey": "sound-cpu-disabled-route-call-proof-2026-07-03",
    "workerName": "sound-cpu-analysis-worker",
    "imageName": "reeditpro/sound-cpu-analysis-worker",
    "jobType": "sound.package_import_smoke",
    "toolId": "librosa",
    "attemptNumber": 1,
    "maxAttempts": 1,
    "runtimeFlagsAllFalse": true
  },
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
  "rejectedEnvelopeInputs": [
    "rawPrompt",
    "mediaFilePath",
    "signedUrl",
    "publicArtifactUrl",
    "serviceRolePayload",
    "providerOutputBlob",
    "modelWeightPath",
    "artifactWriteTarget",
    "supabaseWriteIntent",
    "sqlStatement",
    "dockerRunRequest",
    "workerDispatchRequest"
  ]
}
```

The proof used one explicit tool ID from the 15-tool set and did not include media paths, prompts, secrets, signed URLs, or write targets.
