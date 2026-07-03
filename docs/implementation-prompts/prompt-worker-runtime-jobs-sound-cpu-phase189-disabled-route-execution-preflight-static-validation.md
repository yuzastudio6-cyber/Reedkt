# WORKER_RUNTIME_JOBS-SOUND-CPU-PHASE189-DISABLED-ROUTE-EXECUTION-PREFLIGHT-STATIC-VALIDATION

```json worker-runtime-jobs-sound-cpu-phase189-disabled-route-execution-preflight-static-validation
{
  "label": "worker-runtime-jobs-sound-cpu-phase189-disabled-route-execution-preflight-static-validation",
  "requiredSourceDecision": "worker_runtime_jobs_sound_cpu_phase188_disabled_route_execution_preflight_owner_review_passed_with_warnings_ready_for_preflight_static_validation",
  "expectedDecision": "worker_runtime_jobs_sound_cpu_phase189_disabled_route_execution_preflight_static_validation_passed_with_warnings_ready_for_preflight_static_validation_result_owner_review",
  "goal": "Run source-only static validation for the disabled-route execution preflight plan without starting the server, invoking handlers, dispatching workers, or mutating state.",
  "validationScope": {
    "allowReadRouteSource": true,
    "allowReadServerAppSource": true,
    "allowReadRuntimeGuardSource": true,
    "allowReadSchemaSource": true,
    "allowStaticAssertionsOnly": true,
    "allowServerStart": false,
    "allowHttpRouteRequestExecution": false,
    "allowRouteHandlerInvocation": false,
    "allowExpressRouterInstantiation": false,
    "allowWorkerDispatchExecution": false,
    "allowRouteExecution": false,
    "allowClaimLeaseMutation": false,
    "allowSupabaseMutation": false,
    "allowSqlExecution": false,
    "allowMediaProcessing": false,
    "allowArtifactCreation": false,
    "allowExternalAgentExecutionReadyClaim": false,
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

Validate source text only. Do not start the server, send HTTP requests, instantiate Express routers, invoke route handlers, dispatch workers, touch Supabase, process media, create artifacts, or unlock beta/production.
