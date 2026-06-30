# WORKER_RUNTIME_JOBS-SOUND-CPU-PHASE72-CAPTION-RENDER-RUNTIME-HOOK-CONTROLLED-PRIVATE-MANIFEST-INSTANCE-CREATION

```json worker-runtime-jobs-sound-cpu-phase72-caption-render-runtime-hook-controlled-private-manifest-instance-creation
{
  "label": "worker-runtime-jobs-sound-cpu-phase72-caption-render-runtime-hook-controlled-private-manifest-instance-creation",
  "requiredSourceDecision": "worker_runtime_jobs_sound_cpu_phase71_caption_render_runtime_hook_private_manifest_instance_creation_owner_review_passed_with_warnings_ready_for_controlled_private_manifest_instance_creation_no_media_no_artifacts",
  "creationScope": {
    "sourcePath": "server/workers/sound-cpu/runtime/privateManifest.ts",
    "createControlledPrivateManifestInstance": true,
    "useNoMediaNoArtifactFixtureInputs": true,
    "callValidateSoundCpuPrivateMediaManifest": true,
    "recordSanitizedValidationEvidence": true,
    "useRealMediaToday": false,
    "createArtifactToday": false,
    "dispatchWorkerToday": false,
    "touchSupabaseSqlToday": false,
    "unlockBetaToday": false,
    "unlockProductionToday": false
  },
  "expectedDecision": "worker_runtime_jobs_sound_cpu_phase72_caption_render_runtime_hook_controlled_private_manifest_instance_created_with_warnings_ready_for_instance_creation_owner_review_no_media_no_artifacts",
  "supabaseClassification": {
    "updateRequired": "no",
    "environmentTouched": "no",
    "sqlExecuted": "no",
    "migrationDeployed": "no",
    "nextAction": "none"
  }
}
```

Create only a controlled private manifest instance using no-media/no-artifact fixture inputs and sanitized validation evidence. Do not use real media, write artifacts, dispatch workers, call routes/tools/providers, touch Supabase, unlock beta, or unlock production.
