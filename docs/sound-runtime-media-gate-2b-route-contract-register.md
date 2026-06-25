# SOUND Runtime Media Gate 2B Route Contract Register

```json sound-runtime-media-gate-2b-route-contract-register
{
  "milestone": "SOUND-RUNTIME-MEDIA-GATE-2B",
  "decision": "sound_runtime_media_gate_2b_synthetic_worker_route_plan_completed_with_warnings_ready_for_route_owner_review",
  "routeContracts": [
    {
      "jobType": "sound.package_import_smoke",
      "plannedWorker": "sound-cpu-analysis-worker",
      "plannedImage": "reeditpro/sound-cpu-analysis-worker",
      "toolCoverage": [
        "librosa",
        "audioread",
        "pydub",
        "pydub_effects",
        "scipy",
        "resampy",
        "pyloudnorm",
        "ebu_r128_pyloudnorm",
        "audioflux",
        "music21",
        "pretty_midi",
        "mido",
        "noisereduce",
        "pedalboard",
        "mir_eval"
      ],
      "payloadCategories": [
        "approvedPlanSnapshotId",
        "workspaceId",
        "projectId",
        "jobId",
        "idempotencyKey",
        "workerName",
        "imageName",
        "jobType",
        "attemptMetadata",
        "staticOnlyRuntimeFlags"
      ],
      "resultCategories": [
        "metadataVersionSummary",
        "importResultSummary",
        "sanitizedWarnings",
        "blockedRuntimeClaims"
      ]
    },
    {
      "jobType": "sound.numeric_array_analysis",
      "plannedWorker": "sound-cpu-analysis-worker",
      "plannedImage": "reeditpro/sound-cpu-analysis-worker",
      "toolCoverage": [
        "librosa",
        "scipy",
        "resampy",
        "pyloudnorm",
        "audioflux",
        "noisereduce",
        "pedalboard",
        "mir_eval"
      ],
      "payloadCategories": [
        "approvedPlanSnapshotId",
        "workspaceId",
        "projectId",
        "jobId",
        "idempotencyKey",
        "workerName",
        "imageName",
        "jobType",
        "attemptMetadata",
        "syntheticArrayFixtureDescriptor",
        "staticOnlyRuntimeFlags"
      ],
      "resultCategories": [
        "rmsSummary",
        "peakSummary",
        "resampleSummary",
        "loudnessSummary",
        "spectralSummary",
        "sanitizedWarnings",
        "blockedRuntimeClaims"
      ]
    },
    {
      "jobType": "sound.symbolic_midi_analysis",
      "plannedWorker": "sound-audio-metadata-worker",
      "plannedImage": "reeditpro/sound-audio-metadata-worker",
      "toolCoverage": [
        "music21",
        "pretty_midi",
        "mido"
      ],
      "payloadCategories": [
        "approvedPlanSnapshotId",
        "workspaceId",
        "projectId",
        "jobId",
        "idempotencyKey",
        "workerName",
        "imageName",
        "jobType",
        "attemptMetadata",
        "syntheticMidiFixtureDescriptor",
        "staticOnlyRuntimeFlags"
      ],
      "resultCategories": [
        "symbolicNoteSummary",
        "midiMessageSummary",
        "sanitizedWarnings",
        "blockedRuntimeClaims"
      ]
    },
    {
      "jobType": "sound.loudness_synthetic_analysis",
      "plannedWorker": "sound-cpu-analysis-worker",
      "plannedImage": "reeditpro/sound-cpu-analysis-worker",
      "toolCoverage": [
        "pyloudnorm",
        "ebu_r128_pyloudnorm",
        "scipy"
      ],
      "payloadCategories": [
        "approvedPlanSnapshotId",
        "workspaceId",
        "projectId",
        "jobId",
        "idempotencyKey",
        "workerName",
        "imageName",
        "jobType",
        "attemptMetadata",
        "syntheticLoudnessFixtureDescriptor",
        "staticOnlyRuntimeFlags"
      ],
      "resultCategories": [
        "integratedLoudnessSummary",
        "sampleRateSummary",
        "sanitizedWarnings",
        "blockedRuntimeClaims"
      ]
    }
  ],
  "routeSourceCreated": false,
  "executionApprovedToday": false
}
```
