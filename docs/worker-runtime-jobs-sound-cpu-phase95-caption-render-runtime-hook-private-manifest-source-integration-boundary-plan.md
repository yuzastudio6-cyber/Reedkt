# WORKER_RUNTIME_JOBS SOUND CPU Phase 95 Private Manifest Source Integration Boundary Plan

```json worker-runtime-jobs-sound-cpu-phase95-caption-render-runtime-hook-private-manifest-source-integration-boundary-plan
{
  "label": "worker-runtime-jobs-sound-cpu-phase95-caption-render-runtime-hook-private-manifest-source-integration-boundary-plan",
  "futureImportsAllowed": [
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

Future source integration may import existing static guard types and blocked-state helpers only. It may not import live clients, secrets, media readers, dispatchers, or route handlers in the source-creation planning gate.
