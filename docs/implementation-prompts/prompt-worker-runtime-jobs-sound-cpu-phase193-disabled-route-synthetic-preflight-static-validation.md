# WORKER_RUNTIME_JOBS-SOUND-CPU-PHASE193-DISABLED-ROUTE-SYNTHETIC-PREFLIGHT-STATIC-VALIDATION

```json worker-runtime-jobs-sound-cpu-phase193-disabled-route-synthetic-preflight-static-validation
{
  "label": "worker-runtime-jobs-sound-cpu-phase193-disabled-route-synthetic-preflight-static-validation",
  "requiredSourceDecision": "worker_runtime_jobs_sound_cpu_phase192_disabled_route_synthetic_preflight_owner_review_passed_with_warnings_ready_for_synthetic_preflight_static_validation",
  "expectedDecision": "worker_runtime_jobs_sound_cpu_phase193_disabled_route_synthetic_preflight_static_validation_passed_with_warnings_ready_for_synthetic_preflight_static_validation_result_owner_review",
  "goal": "Run source-only static validation of the disabled-route synthetic preflight plan without starting a server, sending requests, invoking handlers, or mutating state.",
  "validationScope": {
    "allowReadSyntheticPayloadPlan": true,
    "allowReadSyntheticAuthPlan": true,
    "allowReadExpectedDisabledResponsePlan": true,
    "allowReadNoSideEffectPlan": true,
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

Validate the plan text only. Do not start a server, send HTTP requests, instantiate routers, invoke route handlers, dispatch workers, touch Supabase, process media, create artifacts, or claim external agent execution readiness.
