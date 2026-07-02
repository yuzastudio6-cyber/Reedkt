# WORKER_RUNTIME_JOBS-SOUND-CPU-PHASE181-DISABLED-ROUTE-REGISTRY-APP-REGISTRATION-STATIC-VALIDATION

```json worker-runtime-jobs-sound-cpu-phase181-disabled-route-registry-app-registration-static-validation
{
  "label": "worker-runtime-jobs-sound-cpu-phase181-disabled-route-registry-app-registration-static-validation",
  "requiredSourceDecision": "worker_runtime_jobs_sound_cpu_phase180_disabled_route_registry_app_registration_static_validation_owner_review_passed_with_warnings_ready_for_actual_static_validation",
  "expectedDecision": "worker_runtime_jobs_sound_cpu_phase181_disabled_route_registry_app_registration_static_validation_passed_with_warnings_ready_for_static_validation_result_owner_review",
  "goal": "Run source-only static validation of existing disabled SOUND CPU app registration without server start, HTTP route request, route handler invocation, or worker dispatch.",
  "validationScope": {
    "allowReadSourceFiles": true,
    "allowCountAppRegistrations": true,
    "allowInspectDisabledRouteFlags": true,
    "allowInspectRegistryExports": true,
    "allowServerAppSourceChange": false,
    "allowDuplicateAppRegistration": false,
    "allowServerStart": false,
    "allowHttpRouteRequestExecution": false,
    "allowRouteHandlerInvocation": false,
    "allowWorkerDispatchExecution": false,
    "allowRouteExecution": false,
    "allowClaimLeaseMutation": false,
    "allowSupabaseMutation": false,
    "allowSqlExecution": false,
    "allowMediaProcessing": false,
    "allowArtifactCreation": false,
    "allowRealUserMediaBeta": false,
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

Run source-only static validation. Do not edit app source, start the server, send HTTP requests, invoke route handlers, dispatch workers, touch Supabase, process media, create artifacts, or unlock beta/production.
