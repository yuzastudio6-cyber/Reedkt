# WORKER_RUNTIME_JOBS SOUND CPU Phase183 Route Handler No Invocation Policy

```json worker-runtime-jobs-sound-cpu-phase183-route-handler-no-invocation-policy
{
  "label": "worker-runtime-jobs-sound-cpu-phase183-route-handler-no-invocation-policy",
  "policy": {
    "serverStartAllowed": false,
    "httpRequestAllowed": false,
    "expressRouterInstantiationAllowed": false,
    "routeHandlerInvocationAllowed": false,
    "authMiddlewareInvocationAllowed": false,
    "idempotencyMiddlewareInvocationAllowed": false
  },
  "allowedValidation": {
    "readSourceFiles": true,
    "verifyDisabledFlags": true,
    "verifyRouteRegistrationText": true,
    "verifyNoDuplicateRegistrationText": true
  },
  "runtimeReadinessClaimed": false
}
```
