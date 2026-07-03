# WORKER_RUNTIME_JOBS SOUND CPU Phase187 Auth Idempotency Preconditions

```json worker-runtime-jobs-sound-cpu-phase187-auth-idempotency-preconditions
{
  "label": "worker-runtime-jobs-sound-cpu-phase187-auth-idempotency-preconditions",
  "futureSyntheticPreconditions": {
    "authContext": "synthetic-authenticated-request-only",
    "idempotencyKey": "synthetic-non-secret-idempotency-key",
    "approvedPlanSnapshotId": "synthetic-approved-plan-snapshot-id",
    "workspaceId": "synthetic-workspace-id",
    "projectId": "synthetic-project-id",
    "privateMediaManifestId": "synthetic-private-manifest-id",
    "rawPromptAllowed": false,
    "secretPayloadAllowed": false,
    "serviceRolePayloadAllowed": false,
    "signedUrlAsSourceOfTruthAllowed": false
  },
  "currentGateExecution": {
    "authMiddlewareInvoked": false,
    "idempotencyMiddlewareInvoked": false,
    "routeHandlerInvoked": false
  }
}
```
