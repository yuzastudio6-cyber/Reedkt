# WORKER_RUNTIME_JOBS-SOUND-CPU-PHASE139-STATIC-ROUTE-SOURCE-VALIDATION

```json worker-runtime-jobs-sound-cpu-phase139-static-route-source-validation
{
  "label": "worker-runtime-jobs-sound-cpu-phase139-static-route-source-validation",
  "requiredSourceDecision": "worker_runtime_jobs_sound_cpu_phase139_actual_route_source_created_with_warnings_ready_for_static_route_source_validation",
  "expectedDecision": "worker_runtime_jobs_sound_cpu_phase139_static_route_source_validation_passed_with_warnings_ready_for_route_source_owner_review",
  "validationScope": {
    "staticRouteSourceValidationOnly": true,
    "allowRouteRegistration": false,
    "allowRouteExecution": false,
    "allowWorkerDispatchExecution": false,
    "allowSupabaseMutation": false,
    "allowSqlExecution": false,
    "allowStorageObjectCreation": false,
    "allowRealUserMediaBetaEnablement": false,
    "allowPaidProduction": false
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

Validate the disabled route source and schema statically. Do not register or execute the route.
