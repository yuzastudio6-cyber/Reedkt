# SOUND Runtime Media Gate 2C Route Decision Proof Register

```json sound-runtime-media-gate-2c-route-decision-proof-register
{
  "milestone": "SOUND-RUNTIME-MEDIA-GATE-2C",
  "decision": "sound_runtime_media_gate_2c_controlled_synthetic_worker_route_proof_passed_with_warnings_ready_for_route_proof_owner_review",
  "routeDecisions": [
    {
      "jobType": "sound.package_import_smoke",
      "worker": "sound-cpu-analysis-worker",
      "image": "reeditpro/sound-cpu-analysis-worker",
      "fixture": "package-import-smoke-no-media",
      "accepted": true
    },
    {
      "jobType": "sound.numeric_array_analysis",
      "worker": "sound-cpu-analysis-worker",
      "image": "reeditpro/sound-cpu-analysis-worker",
      "fixture": "numeric-array-analysis-no-media",
      "accepted": true
    },
    {
      "jobType": "sound.symbolic_midi_analysis",
      "worker": "sound-audio-metadata-worker",
      "image": "reeditpro/sound-audio-metadata-worker",
      "fixture": "symbolic-midi-in-memory-no-file",
      "accepted": true
    },
    {
      "jobType": "sound.loudness_synthetic_analysis",
      "worker": "sound-cpu-analysis-worker",
      "image": "reeditpro/sound-cpu-analysis-worker",
      "fixture": "loudness-synthetic-array-no-media",
      "accepted": true
    }
  ],
  "routeDecisionCount": 4,
  "routeExecutionRun": false,
  "workerExecutionRun": false
}
```
