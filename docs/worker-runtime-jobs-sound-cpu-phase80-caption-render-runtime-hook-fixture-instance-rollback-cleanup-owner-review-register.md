# WORKER_RUNTIME_JOBS SOUND CPU Phase 80 Fixture Instance Rollback Cleanup Owner Review Register

```json worker-runtime-jobs-sound-cpu-phase80-caption-render-runtime-hook-fixture-instance-rollback-cleanup-owner-review-register
{
  "label": "worker-runtime-jobs-sound-cpu-phase80-caption-render-runtime-hook-fixture-instance-rollback-cleanup-owner-review-register",
  "owner": "WORKER_RUNTIME_JOBS",
  "acceptedRollbackPolicy": {
    "futureCreationFailureRequiresOwnerReviewBeforeRetry": true,
    "futurePartialManifestMustBeDeletedBeforeRetry": true,
    "futureIdempotencyReservationMustBeReleasedBeforeRetry": true,
    "futureArtifactWriteMustRemainBlockedUntilMediaArtifactGate": true,
    "futureCleanupMustBeAudited": true
  },
  "acceptedCleanupTargets": [
    "unpersisted_fixture_instance_drafts",
    "idempotency_key_reservations",
    "private_manifest_draft_rows"
  ],
  "executionState": {
    "cleanupExecutedToday": false,
    "fixtureManifestPersistedToday": false,
    "artifactCreatedToday": false,
    "storageTransferToday": false
  }
}
```

Rollback and cleanup are accepted as a future safety policy only.
