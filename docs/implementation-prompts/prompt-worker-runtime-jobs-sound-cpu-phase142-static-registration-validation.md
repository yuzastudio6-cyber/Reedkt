# WORKER_RUNTIME_JOBS-SOUND-CPU-PHASE142-STATIC-REGISTRATION-VALIDATION

```json worker-runtime-jobs-sound-cpu-phase142-static-registration-validation
{
  "label": "worker-runtime-jobs-sound-cpu-phase142-static-registration-validation",
  "requiredSourceDecision": "worker_runtime_jobs_sound_cpu_phase142_disabled_route_registration_source_created_with_warnings_ready_for_static_registration_validation",
  "expectedDecision": "worker_runtime_jobs_sound_cpu_phase142_static_registration_validation_passed_with_warnings_ready_for_disabled_route_owner_review",
  "validationScope": {
    "staticSourceInspectionOnly": true,
    "allowHttpRouteRequest": false,
    "allowRouteHandlerInvocation": false,
    "allowWorkerDispatchExecution": false,
    "allowSupabaseMutation": false,
    "allowSqlExecution": false,
    "allowMediaProcessing": false,
    "allowArtifactCreation": false
  },
  "supabaseClassification": {
    "updateRequired": "no",
    "environmentTouched": "no",
    "sqlExecuted": "no",
    "migrationDeployed": "no",
    "nextAction": "none"
  }
}
```

Validate the disabled route registration source statically. Do not send HTTP requests.
