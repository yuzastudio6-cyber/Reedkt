# SOUND-RUNTIME-MEDIA-GATE-1 CPU Worker Contract Plan

This contract is a planning artifact for future owner review. It does not add worker code, routes, schemas, dispatch, storage mutation, or runtime execution.

```json sound-runtime-media-gate-1-cpu-worker-contract-plan
{
  "milestone": "SOUND-RUNTIME-MEDIA-GATE-1",
  "decision": "sound_runtime_media_gate_1_completed_with_warnings_ready_for_controlled_cpu_install_proof",
  "workerNameProposals": [
    "sound-cpu-analysis-worker",
    "sound-audio-metadata-worker"
  ],
  "futureJobTypesAllowedForPlanningOnly": [
    "sound.synthetic_fixture_validate",
    "sound.package_import_smoke",
    "sound.numeric_array_analysis",
    "sound.symbolic_midi_analysis",
    "sound.loudness_synthetic_analysis"
  ],
  "blockedFutureCapabilities": [
    "sound.open_media_file",
    "sound.process_real_audio",
    "sound.pydub_media_operation",
    "sound.ffmpeg_audio_extract",
    "sound.write_audio_artifact",
    "sound.generate_music",
    "sound.generate_sfx",
    "sound.download_model_weights"
  ],
  "allowedNonMediaValidationActions": [
    "requirements manifest hash check",
    "package import smoke",
    "in-memory numeric array synthetic assertions",
    "in-memory symbolic MIDI metadata assertions",
    "synthetic loudness numeric assertions"
  ],
  "inputSchemaCategories": [
    "job metadata",
    "approved snapshot reference",
    "tool manifest version",
    "synthetic fixture selector",
    "runtime disabled flag"
  ],
  "outputSchemaCategories": [
    "validation status",
    "package import summary",
    "synthetic assertion summary",
    "blocked capability summary",
    "audit events"
  ],
  "artifactPolicy": {
    "writeArtifactsNow": false,
    "signedUrlsNow": false,
    "publicArtifactsNow": false,
    "futurePrivateManifestRequired": true
  },
  "supabasePolicy": {
    "updateRequired": "no",
    "environmentTouched": "no",
    "sqlExecuted": "no",
    "migrationDeployed": "no",
    "nextAction": "none"
  },
  "auditPolicy": {
    "recordPlanOnly": true,
    "recordRuntimeExecutionNow": false,
    "preserveBlockedCapabilities": true
  },
  "costPolicy": {
    "creditMutationNow": false,
    "stripeMutationNow": false,
    "futureCreditOwnerGateRequired": true
  },
  "failureTimeoutPolicy": {
    "futureImportSmokeTimeoutSeconds": 120,
    "futureSyntheticSmokeTimeoutSeconds": 120,
    "timeoutClassification": "environment_or_dependency_blocked",
    "runtimeDisabledDefault": true
  },
  "runtimeEnabledNow": false
}
```
