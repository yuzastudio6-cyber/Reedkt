# WORKER_RUNTIME_JOBS SOUND CPU GCP Preflight Blocker Register

```json worker-runtime-jobs-sound-cpu-gcp-preflight-blocker-register
{
  "label": "worker-runtime-jobs-sound-cpu-gcp-preflight-blocker-register",
  "owner": "WORKER_RUNTIME_JOBS",
  "decision": "worker_runtime_jobs_sound_cpu_read_only_gcp_preflight_completed_with_blockers_ready_for_foundation_resource_creation_plan",
  "closedByReadOnlyPreflight": [
    "project_access_readback",
    "core_api_readback",
    "artifact_registry_repository_readback",
    "sound_cpu_image_absence_confirmed",
    "sound_cpu_cloud_run_job_absence_confirmed",
    "cpu_worker_service_account_absence_confirmed"
  ],
  "blockingBeforeCloudExecution": [
    {
      "blocker": "project_environment_tag_missing_or_unverified",
      "severity": "medium",
      "requiredNextAction": "add_or_verify_environment_tag_before_production_mutation"
    },
    {
      "blocker": "containerscanning_api_not_enabled",
      "severity": "medium",
      "requiredNextAction": "decide whether vulnerability scanning is required before image push"
    },
    {
      "blocker": "cpu_worker_service_account_missing",
      "severity": "high",
      "requiredNextAction": "create the least-privilege CPU worker service account or run reviewed service-account script"
    },
    {
      "blocker": "sound_cpu_images_not_pushed",
      "severity": "high",
      "requiredNextAction": "build and push both SOUND CPU images after service account and policy gates"
    },
    {
      "blocker": "sound_cpu_cloud_run_jobs_not_deployed",
      "severity": "high",
      "requiredNextAction": "deploy both Cloud Run Jobs after images exist"
    },
    {
      "blocker": "cloud_run_jobs_not_executed",
      "severity": "high",
      "requiredNextAction": "run a controlled no-media Cloud Run job proof only after deployment owner gate"
    },
    {
      "blocker": "external_beta_not_ready",
      "severity": "high",
      "requiredNextAction": "keep external beta closed until cloud execution, support, rollback, and product beta checks pass"
    }
  ],
  "notClaimed": [
    "cloud_run_ready",
    "google_cloud_execution_ready",
    "worker_ready",
    "runtime_ready",
    "media_ready",
    "external_beta_ready",
    "production_ready",
    "generated_local_fixture_passed",
    "dry_run_passed"
  ]
}
```

The preflight does not block progress; it identifies the exact live cloud gaps that must be closed next.
