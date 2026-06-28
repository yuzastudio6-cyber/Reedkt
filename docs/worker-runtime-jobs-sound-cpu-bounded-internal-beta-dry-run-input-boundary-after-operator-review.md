# WORKER_RUNTIME_JOBS SOUND CPU Bounded Internal Beta Dry Run Input Boundary After Operator Review

```json worker-runtime-jobs-sound-cpu-bounded-internal-beta-dry-run-input-boundary-after-operator-review
{
  "label": "worker-runtime-jobs-sound-cpu-bounded-internal-beta-dry-run-input-boundary-after-operator-review",
  "decision": "worker_runtime_jobs_sound_cpu_bounded_internal_beta_dry_run_planning_after_operator_review_completed_with_warnings_ready_for_dry_run_plan_owner_review_no_execution",
  "sourceDecision": "worker_runtime_jobs_sound_cpu_bounded_internal_beta_operator_review_after_runbook_passed_with_warnings_ready_for_internal_operator_dry_run_planning_no_execution",
  "allowedSyntheticInputCategories": [
    "empty_in_memory_signal_descriptor",
    "small_numeric_array_descriptor",
    "symbolic_midi_descriptor_without_file_io",
    "loudness_metadata_descriptor_without_audio_open",
    "package_import_smoke_descriptor_without_worker_execution"
  ],
  "requiredStaticFields": [
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
  "runtimeFlagsRequiredFalse": [
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
  "forbiddenInputs": [
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
  ],
  "acceptedForPlanningToday": {
    "syntheticInMemoryPayloadPlan": "yes",
    "realUserMediaPayload": "no",
    "workerDispatchPayload": "no",
    "routeExecutionPayload": "no",
    "artifactWritePayload": "no",
    "supabasePayload": "no",
    "externalBetaPayload": "no"
  }
}
```

The planned dry-run input boundary is synthetic and in-memory only. Any real media, artifact, Supabase, route, worker, provider, billing, or external-beta input must stop the later execution gate.
