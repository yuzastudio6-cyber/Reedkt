# SOUND-RUNTIME-MEDIA-GATE-1A Package Metadata Proof Register

This register records the package metadata and import-only proof from the disposable Gate 1A environment. Import success is package availability evidence only; it is not runtime readiness or media processing readiness.

```json sound-runtime-media-gate-1a-package-metadata-proof-register
{
  "milestone": "SOUND-RUNTIME-MEDIA-GATE-1A",
  "decision": "sound_runtime_media_gate_1a_controlled_cpu_install_proof_passed_with_warnings_ready_for_worker_contract_review",
  "requirementsPath": "server/workers/sound-oss-tools-controlled-install/requirements.sound-oss-tools.txt",
  "directPinnedPackageCount": 13,
  "metadataChecks": [
    {
      "packageName": "librosa",
      "expectedVersion": "0.11.0",
      "installedVersionObserved": "0.11.0",
      "metadataStatus": "passed"
    },
    {
      "packageName": "audioread",
      "expectedVersion": "3.1.0",
      "installedVersionObserved": "3.1.0",
      "metadataStatus": "passed"
    },
    {
      "packageName": "pydub",
      "expectedVersion": "0.25.1",
      "installedVersionObserved": "0.25.1",
      "metadataStatus": "passed"
    },
    {
      "packageName": "scipy",
      "expectedVersion": "1.17.1",
      "installedVersionObserved": "1.17.1",
      "metadataStatus": "passed"
    },
    {
      "packageName": "resampy",
      "expectedVersion": "0.4.3",
      "installedVersionObserved": "0.4.3",
      "metadataStatus": "passed"
    },
    {
      "packageName": "pyloudnorm",
      "expectedVersion": "0.2.0",
      "installedVersionObserved": "0.2.0",
      "metadataStatus": "passed"
    },
    {
      "packageName": "audioflux",
      "expectedVersion": "0.1.9",
      "installedVersionObserved": "0.1.9",
      "metadataStatus": "passed"
    },
    {
      "packageName": "music21",
      "expectedVersion": "10.3.0",
      "installedVersionObserved": "10.3.0",
      "metadataStatus": "passed"
    },
    {
      "packageName": "pretty_midi",
      "expectedVersion": "0.2.11",
      "installedVersionObserved": "0.2.11",
      "metadataStatus": "passed"
    },
    {
      "packageName": "mido",
      "expectedVersion": "1.3.3",
      "installedVersionObserved": "1.3.3",
      "metadataStatus": "passed"
    },
    {
      "packageName": "noisereduce",
      "expectedVersion": "3.0.3",
      "installedVersionObserved": "3.0.3",
      "metadataStatus": "passed"
    },
    {
      "packageName": "pedalboard",
      "expectedVersion": "0.9.23",
      "installedVersionObserved": "0.9.23",
      "metadataStatus": "passed"
    },
    {
      "packageName": "mir_eval",
      "expectedVersion": "0.8.2",
      "installedVersionObserved": "0.8.2",
      "metadataStatus": "passed"
    }
  ],
  "metadataPassedCount": 13,
  "metadataFailedCount": 0,
  "importChecks": [
    {
      "moduleName": "librosa",
      "importStatus": "passed"
    },
    {
      "moduleName": "audioread",
      "importStatus": "passed"
    },
    {
      "moduleName": "pydub",
      "importStatus": "passed"
    },
    {
      "moduleName": "scipy",
      "importStatus": "passed"
    },
    {
      "moduleName": "scipy.signal",
      "importStatus": "passed"
    },
    {
      "moduleName": "resampy",
      "importStatus": "passed"
    },
    {
      "moduleName": "pyloudnorm",
      "importStatus": "passed"
    },
    {
      "moduleName": "audioflux",
      "importStatus": "passed"
    },
    {
      "moduleName": "music21",
      "importStatus": "passed"
    },
    {
      "moduleName": "pretty_midi",
      "importStatus": "passed"
    },
    {
      "moduleName": "mido",
      "importStatus": "passed"
    },
    {
      "moduleName": "noisereduce",
      "importStatus": "passed"
    },
    {
      "moduleName": "pedalboard",
      "importStatus": "passed"
    },
    {
      "moduleName": "mir_eval",
      "importStatus": "passed"
    }
  ],
  "importPassedCount": 14,
  "importFailedCount": 0,
  "failedImports": [],
  "aliasCoveredTools": [
    {
      "toolId": "pydub_effects",
      "coveredByPackage": "pydub"
    },
    {
      "toolId": "ebu_r128_pyloudnorm",
      "coveredByPackage": "pyloudnorm"
    }
  ],
  "proofBoundaries": {
    "metadataOnly": true,
    "importOnly": true,
    "mediaFileOpenAllowed": false,
    "audioreadAudioOpenAllowed": false,
    "pydubMediaOperationAllowed": false,
    "ffmpegFfprobeAllowed": false,
    "runtimeReadinessClaim": "blocked_unclaimed"
  }
}
```
