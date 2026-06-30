# WORKER_RUNTIME_JOBS SOUND CPU Phase 71 Private Manifest Runtime Defaults Policy Register

```json worker-runtime-jobs-sound-cpu-phase71-caption-render-runtime-hook-private-manifest-runtime-defaults-policy-register
{
  "label": "worker-runtime-jobs-sound-cpu-phase71-caption-render-runtime-hook-private-manifest-runtime-defaults-policy-register",
  "owner": "WORKER_RUNTIME_JOBS",
  "decision": "worker_runtime_jobs_sound_cpu_phase71_caption_render_runtime_hook_private_manifest_instance_creation_plan_completed_with_warnings_ready_for_private_manifest_instance_creation_owner_review_no_media_no_artifacts",
  "requiredRuntimeDefaults": {
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
  "plannedEnforcement": {
    "reuseSourceConstant": "SOUND_CPU_PRIVATE_MANIFEST_RUNTIME_DEFAULTS",
    "rejectTrueRuntimeFlags": true,
    "rejectMissingRequiredFieldsBeforeExecution": true,
    "keepExecutionFlagsFalseAfterValidation": true
  },
  "todayAllowed": {
    "runtimeDefaultPlanning": true,
    "runtimeEnablement": false,
    "workerExecution": false,
    "mediaProcessing": false,
    "artifactWrite": false,
    "supabaseSql": false
  }
}
```

The future creation boundary must use the source constant and keep all runtime flags false.
