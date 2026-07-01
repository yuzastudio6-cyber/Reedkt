# WORKER_RUNTIME_JOBS SOUND CPU Phase 84 Proof Runner Input Validation Static Register

```json worker-runtime-jobs-sound-cpu-phase84-caption-render-runtime-hook-proof-runner-input-validation-static-register
{
  "label": "worker-runtime-jobs-sound-cpu-phase84-caption-render-runtime-hook-proof-runner-input-validation-static-register",
  "owner": "WORKER_RUNTIME_JOBS",
  "validatedInputLogic": {
    "readsPhase82InputPlan": true,
    "requiresThreeInputs": true,
    "requiresUniqueFixtureInstanceIds": true,
    "requiresUniqueIdempotencyKeys": true,
    "requiresApprovedPlanSnapshotId": "phase82-controlled-proof-plan-only",
    "rejectsUrls": true,
    "rejectSignedUrls": true,
    "rejectsFilesystemPaths": true,
    "rejectsRelativeTraversal": true,
    "rejectsSecretsByPolicy": true
  },
  "executionState": {
    "runnerExecutedToday": false,
    "inputValidationExecutedToday": false,
    "fixtureInstanceCreatedToday": false
  }
}
```

Input validation was checked statically from source text.
