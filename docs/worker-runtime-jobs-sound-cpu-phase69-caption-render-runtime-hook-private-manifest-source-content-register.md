# WORKER_RUNTIME_JOBS SOUND CPU Phase 69 Private Manifest Source Content Register

```json worker-runtime-jobs-sound-cpu-phase69-caption-render-runtime-hook-private-manifest-source-content-register
{
  "label": "worker-runtime-jobs-sound-cpu-phase69-caption-render-runtime-hook-private-manifest-source-content-register",
  "owner": "WORKER_RUNTIME_JOBS",
  "decision": "worker_runtime_jobs_sound_cpu_phase69_caption_render_runtime_hook_actual_private_manifest_source_created_with_warnings_ready_for_private_manifest_source_static_validation_owner_review_no_media_no_artifacts",
  "sourcePath": "server/workers/sound-cpu/runtime/privateManifest.ts",
  "exports": [
    "SoundCpuPrivateMediaManifest",
    "SoundCpuPrivateMediaManifestInput",
    "SoundCpuPrivateMediaManifestValidationIssue",
    "SoundCpuPrivateMediaManifestValidationResult",
    "SOUND_CPU_PRIVATE_MANIFEST_RUNTIME_DEFAULTS",
    "validateSoundCpuPrivateMediaManifest"
  ],
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
  "runtimeDefaults": {
    "soundCpuRuntimeEnabled": false,
    "workerExecutionEnabled": false,
    "mediaProcessingEnabled": false,
    "artifactWriteEnabled": false,
    "storageTransferEnabled": false,
    "signedUrlCreationEnabled": false,
    "publicArtifactCreationEnabled": false,
    "databaseMutationEnabled": false,
    "sqlExecutionEnabled": false,
    "providerCallEnabled": false,
    "modelCallEnabled": false
  },
  "implementationStyle": "typescript_static_types_and_pure_validation",
  "allowedImports": [],
  "prohibitedImports": [
    "fs",
    "node:fs",
    "child_process",
    "node:child_process",
    "@supabase/supabase-js",
    "axios",
    "fetch"
  ]
}
```

The private manifest source keeps only static contract and validation code. Runtime defaults are false by construction.
