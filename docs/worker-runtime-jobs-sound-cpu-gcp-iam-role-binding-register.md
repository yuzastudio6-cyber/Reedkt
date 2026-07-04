# WORKER_RUNTIME_JOBS SOUND CPU GCP IAM Role Binding Register

```json worker-runtime-jobs-sound-cpu-gcp-iam-role-binding-register
{
  "label": "worker-runtime-jobs-sound-cpu-gcp-iam-role-binding-register",
  "owner": "WORKER_RUNTIME_JOBS",
  "decision": "worker_runtime_jobs_sound_cpu_gcp_iam_role_binding_result_completed_with_blockers_ready_for_docker_image_build_push_plan",
  "serviceAccount": "reeditpro-cpu-worker-sa@reeditpro.iam.gserviceaccount.com",
  "bindings": [
    {
      "scope": "project",
      "projectId": "reeditpro",
      "role": "roles/logging.logWriter",
      "condition": "None",
      "reason": "matches repo worker-service-account logging pattern"
    },
    {
      "scope": "project",
      "projectId": "reeditpro",
      "role": "roles/monitoring.metricWriter",
      "condition": "None",
      "reason": "matches repo worker-service-account monitoring pattern"
    }
  ],
  "notBound": [
    "roles/storage.objectViewer",
    "roles/storage.objectCreator",
    "roles/secretmanager.secretAccessor",
    "roles/run.invoker",
    "roles/run.developer",
    "roles/iam.serviceAccountUser",
    "roles/artifactregistry.writer"
  ],
  "bindingReadback": {
    "rolesLoggingLogWriterPresent": true,
    "rolesMonitoringMetricWriterPresent": true,
    "unexpectedBroadRolesForCpuWorkerObserved": false
  }
}
```

The broad production IAM script also includes storage and secret access paths for other milestones. Those paths were intentionally not used for this SOUND CPU no-media lane.
