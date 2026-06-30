# WORKER_RUNTIME_JOBS SOUND CPU Phase 69 Private Manifest Source Validation Register

```json worker-runtime-jobs-sound-cpu-phase69-caption-render-runtime-hook-private-manifest-source-validation-register
{
  "label": "worker-runtime-jobs-sound-cpu-phase69-caption-render-runtime-hook-private-manifest-source-validation-register",
  "owner": "WORKER_RUNTIME_JOBS",
  "decision": "worker_runtime_jobs_sound_cpu_phase69_caption_render_runtime_hook_actual_private_manifest_source_created_with_warnings_ready_for_private_manifest_source_static_validation_owner_review_no_media_no_artifacts",
  "validationFunction": "validateSoundCpuPrivateMediaManifest",
  "validationScope": {
    "requiredIdsChecked": true,
    "workerNameChecked": true,
    "jobTypeChecked": true,
    "privateMediaAssetIdShapeChecked": true,
    "plannedPrivateArtifactIdShapeChecked": true,
    "runtimeFlagsRequiredFalse": true,
    "pureFunction": true,
    "noManifestInstanceWrite": true,
    "noMediaOpen": true,
    "noArtifactWrite": true
  },
  "todayAllowed": {
    "sourceStaticValidation": true,
    "manifestInstanceCreation": false,
    "realMediaProcessing": false,
    "artifactCreation": false,
    "workerDispatch": false,
    "routeToolProviderExecution": false,
    "supabaseSql": false,
    "externalBetaUnlock": false,
    "productionUnlock": false
  }
}
```

The validation function checks contract shape and false runtime flags. It is not a media/runtime execution path.
