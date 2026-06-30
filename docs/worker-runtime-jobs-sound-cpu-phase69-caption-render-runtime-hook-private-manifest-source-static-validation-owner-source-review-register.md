# WORKER_RUNTIME_JOBS SOUND CPU Phase 69 Private Manifest Source Static Validation Owner Source Review Register

```json worker-runtime-jobs-sound-cpu-phase69-caption-render-runtime-hook-private-manifest-source-static-validation-owner-source-review-register
{
  "label": "worker-runtime-jobs-sound-cpu-phase69-caption-render-runtime-hook-private-manifest-source-static-validation-owner-source-review-register",
  "owner": "WORKER_RUNTIME_JOBS",
  "decision": "worker_runtime_jobs_sound_cpu_phase69_caption_render_runtime_hook_private_manifest_source_static_validation_owner_review_passed_with_warnings_ready_for_private_manifest_instance_plan_no_media_no_artifacts",
  "sourcePath": "server/workers/sound-cpu/runtime/privateManifest.ts",
  "requiredExports": [
    "SoundCpuPrivateMediaManifest",
    "SoundCpuPrivateMediaManifestInput",
    "SoundCpuPrivateMediaManifestValidationIssue",
    "SoundCpuPrivateMediaManifestValidationResult",
    "SOUND_CPU_PRIVATE_MANIFEST_RUNTIME_DEFAULTS",
    "validateSoundCpuPrivateMediaManifest"
  ],
  "validatedContract": {
    "acceptedWorkers": [
      "sound-cpu-analysis-worker",
      "sound-audio-metadata-worker"
    ],
    "acceptedJobTypes": [
      "sound.package_import_smoke",
      "sound.numeric_array_analysis",
      "sound.symbolic_midi_analysis",
      "sound.loudness_synthetic_analysis"
    ],
    "requiredIdsChecked": true,
    "privateMediaAssetIdShapeChecked": true,
    "plannedPrivateArtifactIdShapeChecked": true,
    "runtimeFlagsMustRemainFalse": true
  },
  "prohibitedSourceFeatures": {
    "imports": true,
    "fileSystemReads": true,
    "networkCalls": true,
    "supabaseClient": true,
    "workerDispatch": true,
    "mediaOpen": true,
    "artifactWrite": true,
    "signedUrlCreation": true,
    "publicArtifactCreation": true
  }
}
```

The static source contract is validated by text inspection and package TypeScript checks only. The next gate may plan an instance shape, but may not create one yet.
