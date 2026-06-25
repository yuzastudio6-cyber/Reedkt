# SOUND Runtime Media Gate 2J Accepted Fixture Register

```json sound-runtime-media-gate-2j-accepted-fixture-register
{
  "milestone": "SOUND-RUNTIME-MEDIA-GATE-2J",
  "decision": "sound_runtime_media_gate_2j_controlled_route_fixture_validation_passed_with_warnings_ready_for_fixture_validation_owner_review",
  "validatedFixtures": [
    {
      "jobType": "sound.package_import_smoke",
      "worker": "sound-cpu-analysis-worker",
      "image": "reeditpro/sound-cpu-analysis-worker",
      "descriptor": "synthetic-package-import-smoke-v1"
    },
    {
      "jobType": "sound.numeric_array_analysis",
      "worker": "sound-cpu-analysis-worker",
      "image": "reeditpro/sound-cpu-analysis-worker",
      "descriptor": "synthetic-numeric-array-analysis-v1"
    },
    {
      "jobType": "sound.symbolic_midi_analysis",
      "worker": "sound-audio-metadata-worker",
      "image": "reeditpro/sound-audio-metadata-worker",
      "descriptor": "synthetic-symbolic-midi-analysis-v1"
    },
    {
      "jobType": "sound.loudness_synthetic_analysis",
      "worker": "sound-audio-metadata-worker",
      "image": "reeditpro/sound-audio-metadata-worker",
      "descriptor": "synthetic-loudness-analysis-v1"
    }
  ],
  "fixtureCount": 4,
  "acceptedFixtureCount": 4,
  "fixtureOutputPolicy": {
    "writeArtifacts": false,
    "createSignedUrls": false,
    "createPublicArtifacts": false,
    "persistToSupabase": false
  }
}
```
