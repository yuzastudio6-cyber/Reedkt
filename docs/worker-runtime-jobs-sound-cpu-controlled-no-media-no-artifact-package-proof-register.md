# WORKER_RUNTIME_JOBS SOUND CPU Controlled No-Media No-Artifact Package Proof Register

```json worker-runtime-jobs-sound-cpu-controlled-no-media-no-artifact-package-proof-register
{
  "owner": "WORKER_RUNTIME_JOBS",
  "decision": "worker_runtime_jobs_sound_cpu_controlled_no_media_no_artifact_execution_proof_blocked_import_or_synthetic_failure",
  "requirementsPath": "server/workers/sound-oss-tools-controlled-install/requirements.sound-oss-tools.txt",
  "directPinnedPackages": [
    { "package": "librosa", "version": "0.11.0" },
    { "package": "audioread", "version": "3.1.0" },
    { "package": "pydub", "version": "0.25.1" },
    { "package": "scipy", "version": "1.17.1" },
    { "package": "resampy", "version": "0.4.3" },
    { "package": "pyloudnorm", "version": "0.2.0" },
    { "package": "audioflux", "version": "0.1.9" },
    { "package": "music21", "version": "10.3.0" },
    { "package": "pretty_midi", "version": "0.2.11" },
    { "package": "mido", "version": "1.3.3" },
    { "package": "noisereduce", "version": "3.0.3" },
    { "package": "pedalboard", "version": "0.9.23" },
    { "package": "mir_eval", "version": "0.8.2" }
  ],
  "aliasCoveredTools": [
    { "toolId": "pydub_effects", "coveredByPackage": "pydub" },
    { "toolId": "ebu_r128_pyloudnorm", "coveredByPackage": "pyloudnorm" }
  ],
  "counts": {
    "directPinnedPackageCount": 13,
    "aliasCoveredToolCount": 2,
    "totalCandidateCount": 15,
    "expectedImportCount": 14,
    "expectedSyntheticAssertionCount": 5
  },
  "installEvidence": {
    "pipInstallPassed": true,
    "pipInstallDurationSeconds": 41.705,
    "requirementsInstalledIntoDisposableVenvOnly": true,
    "packageLockChanged": false
  },
  "verificationEvidence": {
    "metadataVerified": false,
    "importsVerified": false,
    "syntheticAssertionsVerified": false,
    "blockedReason": "metadata/import/synthetic phase timed out after successful requirements install"
  },
  "approvedForToolCallExecution": false,
  "approvedForWorkerExecution": false,
  "approvedForMediaProcessing": false,
  "approvedForBeta": false
}
```
