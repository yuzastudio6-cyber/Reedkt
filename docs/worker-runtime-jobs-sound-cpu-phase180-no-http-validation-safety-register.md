# WORKER_RUNTIME_JOBS SOUND CPU Phase180 No HTTP Validation Safety Register

```json worker-runtime-jobs-sound-cpu-phase180-no-http-validation-safety-register
{
  "label": "worker-runtime-jobs-sound-cpu-phase180-no-http-validation-safety-register",
  "safetyRequirementsForNextPhase": {
    "mustNotStartServer": true,
    "mustNotSendHttpRequests": true,
    "mustNotUseSupertest": true,
    "mustNotInvokeRouteHandlers": true,
    "mustNotDispatchWorkers": true,
    "mustNotMutateServerApp": true,
    "mustNotTouchSupabaseOrSql": true,
    "mustNotProcessMedia": true,
    "mustNotCreateArtifacts": true
  },
  "acceptedValidationMode": "source-only static validation"
}
```
