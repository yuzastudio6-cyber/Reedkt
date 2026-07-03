# WORKER_RUNTIME_JOBS SOUND CPU Phase191 Synthetic Auth Idempotency Plan

```json worker-runtime-jobs-sound-cpu-phase191-synthetic-auth-idempotency-plan
{
  "label": "worker-runtime-jobs-sound-cpu-phase191-synthetic-auth-idempotency-plan",
  "futureSyntheticRequestContext": {
    "authContext": "synthetic-authenticated-request-only",
    "idempotencyHeader": "synthetic-non-secret-idempotency-key",
    "workspaceScope": "synthetic-workspace-scope",
    "projectScope": "synthetic-project-scope",
    "rawPromptAllowed": false,
    "secretPayloadAllowed": false,
    "serviceRolePayloadAllowed": false,
    "signedUrlAsSourceOfTruthAllowed": false
  },
  "currentGateAuthMiddlewareInvoked": false,
  "currentGateIdempotencyMiddlewareInvoked": false
}
```
