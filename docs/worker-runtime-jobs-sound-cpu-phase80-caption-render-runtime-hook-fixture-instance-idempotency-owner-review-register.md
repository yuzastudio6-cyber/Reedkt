# WORKER_RUNTIME_JOBS SOUND CPU Phase 80 Fixture Instance Idempotency Owner Review Register

```json worker-runtime-jobs-sound-cpu-phase80-caption-render-runtime-hook-fixture-instance-idempotency-owner-review-register
{
  "label": "worker-runtime-jobs-sound-cpu-phase80-caption-render-runtime-hook-fixture-instance-idempotency-owner-review-register",
  "owner": "WORKER_RUNTIME_JOBS",
  "acceptedIdempotencyKeys": [
    "sound-cpu:caption-render:fixture-instance:001:phase80",
    "sound-cpu:caption-render:fixture-instance:002:phase80",
    "sound-cpu:caption-render:fixture-instance:003:phase80"
  ],
  "acceptedIdempotencyPolicy": {
    "oneKeyPerFixtureInstance": true,
    "keysAreDeterministic": true,
    "keysAreUnique": true,
    "keysContainNoSecrets": true,
    "keysContainNoMediaPaths": true,
    "keysContainNoUrls": true,
    "futureCreateMustBeIdempotent": true
  },
  "executionState": {
    "fixtureInstanceCreatedToday": false,
    "storageObjectReadToday": false,
    "signedUrlCreatedToday": false
  }
}
```

The idempotency keys are accepted as static planning strings only.
