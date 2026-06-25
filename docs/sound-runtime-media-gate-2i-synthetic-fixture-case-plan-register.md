# SOUND Runtime Media Gate 2I Synthetic Fixture Case Plan Register

```json sound-runtime-media-gate-2i-synthetic-fixture-case-plan-register
{
  "milestone": "SOUND-RUNTIME-MEDIA-GATE-2I",
  "decision": "sound_runtime_media_gate_2i_controlled_route_fixture_hardening_plan_completed_with_warnings_ready_for_fixture_hardening_owner_review",
  "fixtureMode": "static_planning_only",
  "plannedValidCases": [
    {
      "jobType": "sound.package_import_smoke",
      "worker": "sound-cpu-analysis-worker",
      "image": "reeditpro/sound-cpu-analysis-worker"
    },
    {
      "jobType": "sound.numeric_array_analysis",
      "worker": "sound-cpu-analysis-worker",
      "image": "reeditpro/sound-cpu-analysis-worker"
    },
    {
      "jobType": "sound.symbolic_midi_analysis",
      "worker": "sound-audio-metadata-worker",
      "image": "reeditpro/sound-audio-metadata-worker"
    },
    {
      "jobType": "sound.loudness_synthetic_analysis",
      "worker": "sound-audio-metadata-worker",
      "image": "reeditpro/sound-audio-metadata-worker"
    }
  ],
  "requiredPayloadFields": [
    "approvedPlanSnapshotId",
    "workspaceId",
    "projectId",
    "jobId",
    "idempotencyKey",
    "jobType",
    "workerName",
    "imageName",
    "attemptMetadata",
    "staticRuntimeFlags"
  ],
  "fixtureOutputPolicy": {
    "writeArtifacts": false,
    "createSignedUrls": false,
    "createPublicArtifacts": false,
    "persistToSupabase": false
  }
}
```
