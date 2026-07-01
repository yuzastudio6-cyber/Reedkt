# WORKER_RUNTIME_JOBS SOUND CPU Phase 81 Idempotency Assertion Owner Review Register

```json worker-runtime-jobs-sound-cpu-phase81-caption-render-runtime-hook-idempotency-assertion-owner-review-register
{
  "label": "worker-runtime-jobs-sound-cpu-phase81-caption-render-runtime-hook-idempotency-assertion-owner-review-register",
  "owner": "WORKER_RUNTIME_JOBS",
  "acceptedAssertions": {
    "oneIdempotencyKeyPerFixtureInstance": true,
    "fixtureInstanceIdsUnique": true,
    "idempotencyKeysUnique": true,
    "fixtureInstanceIdOrdinalMatchesIdempotencyKeyOrdinal": true,
    "retryMustResolveSameFixtureInstance": true,
    "partialCreationRequiresCleanupBeforeRetry": true,
    "keysContainNoSecrets": true,
    "keysContainNoMediaPaths": true,
    "keysContainNoUrls": true
  },
  "acceptedIdempotencyKeyCount": 3,
  "executionState": {
    "fixtureInstanceCreatedToday": false,
    "cleanupExecutedToday": false,
    "supabaseSqlTouchedToday": false
  }
}
```

Idempotency assertions are accepted without executing a create or cleanup operation.
