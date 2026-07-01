# WORKER_RUNTIME_JOBS SOUND CPU Phase 95 Private Manifest Persistence Source Path Plan

```json worker-runtime-jobs-sound-cpu-phase95-caption-render-runtime-hook-private-manifest-persistence-source-path-plan
{
  "label": "worker-runtime-jobs-sound-cpu-phase95-caption-render-runtime-hook-private-manifest-persistence-source-path-plan",
  "plannedSourcePath": "server/workers/sound-cpu/runtime/privateManifestPersistence.ts",
  "existingSourceContext": [
    "server/workers/sound-cpu/runtime/privateManifest.ts",
    "server/workers/sound-cpu/runtime/soundCpuSupabaseGuards.ts",
    "server/workers/sound-cpu/runtime/soundCpuJobContracts.ts"
  ],
  "sourcePathPolicy": {
    "createNewSourceFileInLaterGate": true,
    "modifyExistingPrivateManifestSourceToday": false,
    "modifySupabaseGuardSourceToday": false,
    "modifyJobContractSourceToday": false,
    "sourceFileCreatedToday": false,
    "runtimeInterfaceChangedToday": false,
    "publicApiChangedToday": false
  },
  "futureSourceFileResponsibilities": [
    "export_private_manifest_persistence_contract_types",
    "export_no_execution_persistence_adapter_result_types",
    "export_fail_closed_persistence_guard",
    "reference_supabase_guard_state_without_mutation",
    "reject_raw_prompts_paths_signed_urls_secrets_and_public_artifacts"
  ]
}
```

The planned future source file is additive. This packet does not create it and does not modify existing runtime source.
