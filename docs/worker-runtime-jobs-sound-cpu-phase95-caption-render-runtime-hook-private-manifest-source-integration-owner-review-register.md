# WORKER_RUNTIME_JOBS SOUND CPU Phase 95 Private Manifest Source Integration Owner Review Register

```json worker-runtime-jobs-sound-cpu-phase95-caption-render-runtime-hook-private-manifest-source-integration-owner-review-register
{
  "label": "worker-runtime-jobs-sound-cpu-phase95-caption-render-runtime-hook-private-manifest-source-integration-owner-review-register",
  "decision": "worker_runtime_jobs_sound_cpu_phase95_caption_render_runtime_hook_private_manifest_persistence_source_owner_review_passed_with_warnings_ready_for_actual_private_manifest_persistence_source_creation_no_execution",
  "acceptedFutureImportsAllowed": [
    "SOUND_CPU_PRIVATE_MANIFEST_RUNTIME_DEFAULTS",
    "SoundCpuPrivateManifestRuntimeDefaults",
    "SoundCpuPrivateManifestWorkerName",
    "SoundCpuPrivateManifestJobType",
    "getSoundCpuSupabaseGuardState",
    "assertSoundCpuSupabaseMutationBlocked"
  ],
  "futureImportsRejected": [
    "supabase_client_instance",
    "service_role_secret",
    "storage_bucket_client",
    "signed_url_creator",
    "media_file_reader",
    "worker_dispatcher",
    "route_handler"
  ],
  "ownerDependencies": {
    "SUPABASE_RLS_STORAGE_DATABASE": "required_before_any_real_persistence",
    "WORKER_RUNTIME_JOBS": "owns_source_creation_and_worker_contract_shape",
    "COMPLIANCE_SECURITY": "required_before_retention_or_public_artifact_policy_changes",
    "PUBLIC_ARTIFACT_DELIVERY_POLICY": "required_before_signed_or_public_artifact_access"
  },
  "currentGateState": {
    "sourceFileCreatedToday": false,
    "runtimeSourceModifiedToday": false,
    "supabaseEnvironmentTouched": false,
    "sqlExecuted": false,
    "migrationDeployed": false,
    "workerDispatchEnabledToday": false
  }
}
```

The accepted integration surface is static-only and must not import live clients, secrets, media readers, dispatchers, route handlers, storage clients, or signed URL creators.
