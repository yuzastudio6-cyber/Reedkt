# Sound/Music/Audio Open-Source Tool Binary Import Proof Matrix

This matrix records package metadata and no-op import proof for the approved SOUND-OSS-TOOLS-3 manifest only. Every row keeps `mediaProcessingRun` and `runtimeExecutionRun` false.

```json sound-oss-tools-4-binary-import-proof-matrix
{
  "phase": "SOUND-OSS-TOOLS-4",
  "decision": "sound_oss_tools_4_binary_import_proof_passed_with_warnings_ready_for_synthetic_fixture_validation_plan",
  "requirementsManifest": "server/workers/sound-oss-tools-controlled-install/requirements.sound-oss-tools.txt",
  "matrixCount": 14,
  "proofRows": [
    {
      "packageName": "librosa",
      "requiredVersion": "0.11.0",
      "installedVersionObserved": "0.11.0",
      "moduleName": "librosa",
      "importStatus": "passed",
      "metadataStatus": "passed",
      "notes": "No-op import only.",
      "mediaProcessingRun": false,
      "runtimeExecutionRun": false
    },
    {
      "packageName": "audioread",
      "requiredVersion": "3.1.0",
      "installedVersionObserved": "3.1.0",
      "moduleName": "audioread",
      "importStatus": "passed",
      "metadataStatus": "passed",
      "notes": "No-op import only.",
      "mediaProcessingRun": false,
      "runtimeExecutionRun": false
    },
    {
      "packageName": "pydub",
      "requiredVersion": "0.25.1",
      "installedVersionObserved": "0.25.1",
      "moduleName": "pydub",
      "importStatus": "passed",
      "metadataStatus": "passed",
      "notes": "No-op import only; import emitted an FFmpeg/avconv availability warning, but no FFmpeg command or media operation ran.",
      "mediaProcessingRun": false,
      "runtimeExecutionRun": false
    },
    {
      "packageName": "scipy",
      "requiredVersion": "1.17.1",
      "installedVersionObserved": "1.17.1",
      "moduleName": "scipy",
      "importStatus": "passed",
      "metadataStatus": "passed",
      "notes": "No-op import only.",
      "mediaProcessingRun": false,
      "runtimeExecutionRun": false
    },
    {
      "packageName": "scipy",
      "requiredVersion": "1.17.1",
      "installedVersionObserved": "1.17.1",
      "moduleName": "scipy.signal",
      "importStatus": "passed",
      "metadataStatus": "passed",
      "notes": "No-op submodule import only.",
      "mediaProcessingRun": false,
      "runtimeExecutionRun": false
    },
    {
      "packageName": "resampy",
      "requiredVersion": "0.4.3",
      "installedVersionObserved": "0.4.3",
      "moduleName": "resampy",
      "importStatus": "passed",
      "metadataStatus": "passed",
      "notes": "No-op import only.",
      "mediaProcessingRun": false,
      "runtimeExecutionRun": false
    },
    {
      "packageName": "pyloudnorm",
      "requiredVersion": "0.2.0",
      "installedVersionObserved": "0.2.0",
      "moduleName": "pyloudnorm",
      "importStatus": "passed",
      "metadataStatus": "passed",
      "notes": "No-op import only.",
      "mediaProcessingRun": false,
      "runtimeExecutionRun": false
    },
    {
      "packageName": "audioflux",
      "requiredVersion": "0.1.9",
      "installedVersionObserved": "0.1.9",
      "moduleName": "audioflux",
      "importStatus": "passed",
      "metadataStatus": "passed",
      "notes": "No-op import only; no audio feature extraction ran.",
      "mediaProcessingRun": false,
      "runtimeExecutionRun": false
    },
    {
      "packageName": "music21",
      "requiredVersion": "10.3.0",
      "installedVersionObserved": "10.3.0",
      "moduleName": "music21",
      "importStatus": "passed",
      "metadataStatus": "passed",
      "notes": "No-op import only.",
      "mediaProcessingRun": false,
      "runtimeExecutionRun": false
    },
    {
      "packageName": "pretty_midi",
      "requiredVersion": "0.2.11",
      "installedVersionObserved": "0.2.11",
      "moduleName": "pretty_midi",
      "importStatus": "passed",
      "metadataStatus": "passed",
      "notes": "No-op import only.",
      "mediaProcessingRun": false,
      "runtimeExecutionRun": false
    },
    {
      "packageName": "mido",
      "requiredVersion": "1.3.3",
      "installedVersionObserved": "1.3.3",
      "moduleName": "mido",
      "importStatus": "passed",
      "metadataStatus": "passed",
      "notes": "No-op import only.",
      "mediaProcessingRun": false,
      "runtimeExecutionRun": false
    },
    {
      "packageName": "noisereduce",
      "requiredVersion": "3.0.3",
      "installedVersionObserved": "3.0.3",
      "moduleName": "noisereduce",
      "importStatus": "passed",
      "metadataStatus": "passed",
      "notes": "No-op import only; no noise reduction ran.",
      "mediaProcessingRun": false,
      "runtimeExecutionRun": false
    },
    {
      "packageName": "pedalboard",
      "requiredVersion": "0.9.23",
      "installedVersionObserved": "0.9.23",
      "moduleName": "pedalboard",
      "importStatus": "passed",
      "metadataStatus": "passed",
      "notes": "No-op import only; no plugin or media operation ran.",
      "mediaProcessingRun": false,
      "runtimeExecutionRun": false
    },
    {
      "packageName": "mir_eval",
      "requiredVersion": "0.8.2",
      "installedVersionObserved": "0.8.2",
      "moduleName": "mir_eval",
      "importStatus": "passed",
      "metadataStatus": "passed",
      "notes": "No-op import only.",
      "mediaProcessingRun": false,
      "runtimeExecutionRun": false
    }
  ]
}
```
