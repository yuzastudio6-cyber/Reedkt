# WORKER_RUNTIME_JOBS SOUND CPU Phase 96 Private Manifest Persistence Source Static Instruction Register

```json worker-runtime-jobs-sound-cpu-phase96-caption-render-runtime-hook-private-manifest-persistence-source-static-instruction-register
{
  "label": "worker-runtime-jobs-sound-cpu-phase96-caption-render-runtime-hook-private-manifest-persistence-source-static-instruction-register",
  "decision": "worker_runtime_jobs_sound_cpu_phase96_caption_render_runtime_hook_private_manifest_persistence_source_static_validation_passed_with_warnings_ready_for_private_manifest_persistence_source_owner_review_no_execution",
  "validatedSourcePath": "server/workers/sound-cpu/runtime/privateManifestPersistence.ts",
  "requiredExportsValidated": [
    "SOUND_CPU_PRIVATE_MANIFEST_PERSISTENCE_SCHEMA_VERSION",
    "SOUND_CPU_PRIVATE_MANIFEST_PERSISTENCE_REJECTED_INPUT_FIELDS",
    "SOUND_CPU_PRIVATE_MANIFEST_PERSISTENCE_BLOCKED_REASONS",
    "SoundCpuPrivateManifestPersistenceContract",
    "SoundCpuPrivateManifestPersistenceInput",
    "SoundCpuPrivateManifestPersistenceResult",
    "SoundCpuPrivateManifestPersistenceAuditShape",
    "createSoundCpuPrivateManifestPersistenceBlockedResult",
    "assertSoundCpuPrivateManifestPersistenceMutationBlocked"
  ],
  "requiredFalseResultFieldsValidated": [
    "acceptedForPersistenceToday",
    "acceptedForStorageObjectCreationToday",
    "acceptedForSignedUrlCreationToday",
    "acceptedForWorkerDispatchToday",
    "acceptedForMediaOpenToday",
    "acceptedForBetaUnlockToday",
    "acceptedForProductionUnlockToday"
  ],
  "requiredGuardReferencesValidated": [
    "SOUND_CPU_PRIVATE_MANIFEST_RUNTIME_DEFAULTS",
    "SOUND_CPU_SUPABASE_OWNER_GATE",
    "getSoundCpuSupabaseGuardState",
    "assertSoundCpuSupabaseMutationBlocked"
  ]
}
```

Required source instructions are present and remain static/fail-closed.
