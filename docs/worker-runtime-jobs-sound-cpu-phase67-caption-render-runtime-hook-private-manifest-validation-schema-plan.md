# WORKER_RUNTIME_JOBS SOUND CPU Phase 67 Caption Render Runtime Hook Private Manifest Validation Schema Plan

```json worker-runtime-jobs-sound-cpu-phase67-caption-render-runtime-hook-private-manifest-validation-schema-plan
{
  "label": "worker-runtime-jobs-sound-cpu-phase67-caption-render-runtime-hook-private-manifest-validation-schema-plan",
  "owner": "WORKER_RUNTIME_JOBS",
  "decision": "worker_runtime_jobs_sound_cpu_phase67_caption_render_runtime_hook_private_manifest_source_plan_completed_with_warnings_ready_for_private_manifest_source_owner_review_no_media_no_artifacts",
  "validationSchemaPlan": {
    "futureValidatorName": "validateSoundCpuPrivateMediaManifest",
    "createToday": false,
    "requireApprovedPlanSnapshotId": true,
    "requireWorkspaceProjectJobIds": true,
    "requireIdempotencyKey": true,
    "requirePrivateManifestReferencesOnly": true,
    "requireRuntimeFlagsDisabledByDefault": true,
    "requireNoPublicArtifactDefaults": true,
    "requireNoSignedUrlSourceOfTruth": true,
    "requireNoServiceRolePayload": true,
    "requireNoRawMediaBytes": true,
    "requireNoProviderOutputBlob": true,
    "requireNoModelWeights": true
  },
  "plannedValidationOutcomes": [
    "valid_planning_manifest",
    "blocked_missing_required_identity",
    "blocked_public_artifact_scope",
    "blocked_signed_url_source_of_truth",
    "blocked_service_role_payload",
    "blocked_raw_media_payload",
    "blocked_runtime_flag_enabled",
    "blocked_supabase_or_storage_claim"
  ],
  "allowedToday": {
    "schemaPlanning": true,
    "validatorSourceCreation": false,
    "runtimeValidationExecution": false,
    "mediaValidationExecution": false,
    "artifactValidationExecution": false
  }
}
```

The schema is a future static contract only. No validator source, runtime validation, media read, or artifact write is introduced here.
