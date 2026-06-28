# WORKER_RUNTIME_JOBS SOUND CPU Bounded Internal Beta Dry Run Input Boundary Owner Review After Planning

```json worker-runtime-jobs-sound-cpu-bounded-internal-beta-dry-run-input-boundary-owner-review-after-planning
{
  "label": "worker-runtime-jobs-sound-cpu-bounded-internal-beta-dry-run-input-boundary-owner-review-after-planning",
  "decision": "worker_runtime_jobs_sound_cpu_bounded_internal_beta_dry_run_plan_owner_review_after_planning_passed_with_warnings_ready_for_controlled_internal_dry_run_execution_prompt",
  "sourceInputBoundaryDecision": "worker_runtime_jobs_sound_cpu_bounded_internal_beta_dry_run_planning_after_operator_review_completed_with_warnings_ready_for_dry_run_plan_owner_review_no_execution",
  "acceptedSyntheticInputCategories": [
    "empty_in_memory_signal_descriptor",
    "small_numeric_array_descriptor",
    "symbolic_midi_descriptor_without_file_io",
    "loudness_metadata_descriptor_without_audio_open",
    "package_import_smoke_descriptor_without_worker_execution"
  ],
  "acceptedStaticFields": [
    "approvedPlanSnapshotId",
    "workspaceId",
    "projectId",
    "jobId",
    "idempotencyKey",
    "workerName",
    "jobType",
    "attempt",
    "runtimeFlags"
  ],
  "requiredFalseRuntimeFlags": [
    "openMediaFile",
    "processMedia",
    "writeArtifact",
    "callProvider",
    "executeWorker",
    "executeRoute",
    "touchSupabase",
    "runSql",
    "createSignedUrl",
    "enableExternalBeta"
  ],
  "ownerReviewOutcome": {
    "inputBoundaryAcceptedForNextControlledPrompt": true,
    "realUserMediaPayloadAccepted": false,
    "workerDispatchPayloadAccepted": false,
    "routeExecutionPayloadAccepted": false,
    "artifactWritePayloadAccepted": false,
    "supabasePayloadAccepted": false,
    "externalBetaPayloadAccepted": false
  },
  "forbiddenInputsStillBlocked": [
    "raw_user_prompt",
    "real_user_media_path",
    "signed_url",
    "public_artifact_url",
    "provider_output_blob",
    "secret",
    "service_role_payload",
    "database_url",
    "supabase_url",
    "model_weight_location",
    "artifact_write_target",
    "credit_mutation_payload"
  ]
}
```

The accepted input boundary remains synthetic and in-memory. A later execution prompt must stop if it needs real media, worker dispatch, routes, artifacts, Supabase, SQL, providers, billing, or external beta.
