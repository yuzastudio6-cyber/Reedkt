# WORKER_RUNTIME_JOBS SOUND CPU Phase 96 Private Manifest Persistence Source Content Register

```json worker-runtime-jobs-sound-cpu-phase96-caption-render-runtime-hook-private-manifest-persistence-source-content-register
{
  "label": "worker-runtime-jobs-sound-cpu-phase96-caption-render-runtime-hook-private-manifest-persistence-source-content-register",
  "decision": "worker_runtime_jobs_sound_cpu_phase96_caption_render_runtime_hook_actual_private_manifest_persistence_source_created_with_warnings_ready_for_private_manifest_persistence_source_static_validation_no_execution",
  "sourcePath": "server/workers/sound-cpu/runtime/privateManifestPersistence.ts",
  "createdExports": [
    "SOUND_CPU_PRIVATE_MANIFEST_PERSISTENCE_SCHEMA_VERSION",
    "SOUND_CPU_PRIVATE_MANIFEST_PERSISTENCE_REJECTED_INPUT_FIELDS",
    "SOUND_CPU_PRIVATE_MANIFEST_PERSISTENCE_BLOCKED_REASONS",
    "SoundCpuPrivateManifestPersistenceBlockedReason",
    "SoundCpuPrivateManifestPersistenceRejectedInputField",
    "SoundCpuPrivateManifestPersistenceContract",
    "SoundCpuPrivateManifestPersistenceInput",
    "SoundCpuPrivateManifestPersistenceAuditShape",
    "SoundCpuPrivateManifestPersistenceResult",
    "createSoundCpuPrivateManifestPersistenceBlockedResult",
    "assertSoundCpuPrivateManifestPersistenceMutationBlocked"
  ],
  "acceptedImports": [
    "SOUND_CPU_PRIVATE_MANIFEST_RUNTIME_DEFAULTS",
    "SoundCpuPrivateManifestRuntimeDefaults",
    "SoundCpuPrivateManifestWorkerName",
    "SoundCpuPrivateManifestJobType",
    "SOUND_CPU_SUPABASE_OWNER_GATE",
    "getSoundCpuSupabaseGuardState",
    "assertSoundCpuSupabaseMutationBlocked",
    "SoundCpuSupabaseGuardState"
  ],
  "rejectedInputs": [
    "rawPromptText",
    "rawMediaPaths",
    "signedUrls",
    "providerOutputBlobs",
    "serviceRolePayloads",
    "secretValues",
    "modelWeightLocations",
    "publicArtifactUrls"
  ]
}
```

The created source contains static contracts and blocked-result helpers only. It has no live client, route, storage, media, provider, model, or worker-dispatch integration.
