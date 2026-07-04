# WORKER_RUNTIME_JOBS SOUND CPU GCP IAM Remaining Blocker Register

```json worker-runtime-jobs-sound-cpu-gcp-iam-remaining-blocker-register
{
  "label": "worker-runtime-jobs-sound-cpu-gcp-iam-remaining-blocker-register",
  "owner": "WORKER_RUNTIME_JOBS",
  "decision": "worker_runtime_jobs_sound_cpu_gcp_iam_role_binding_result_completed_with_blockers_ready_for_docker_image_build_push_plan",
  "closedByThisGate": [
    "cpu_worker_service_account_has_no_project_level_roles"
  ],
  "blockingBeforeCloudExecution": [
    {
      "blocker": "project_environment_tag_missing_or_unverified",
      "severity": "medium",
      "requiredNextAction": "verify_or_add_environment_tag_before_broader_production_mutations"
    },
    {
      "blocker": "containerscanning_api_not_enabled",
      "severity": "medium",
      "requiredNextAction": "decide_or_enable_container_scanning_before image hardening or beta readiness"
    },
    {
      "blocker": "sound_cpu_images_not_pushed",
      "severity": "high",
      "requiredNextAction": "build and push SOUND CPU images"
    },
    {
      "blocker": "sound_cpu_cloud_run_jobs_not_deployed",
      "severity": "high",
      "requiredNextAction": "deploy both Cloud Run Jobs only after images exist"
    },
    {
      "blocker": "cloud_run_jobs_not_executed",
      "severity": "high",
      "requiredNextAction": "run controlled no-media Cloud Run job proof only after deployment owner gate"
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

IAM is no longer the immediate blocker for the no-media CPU worker image path. The next concrete blocker is the missing Artifact Registry images.
