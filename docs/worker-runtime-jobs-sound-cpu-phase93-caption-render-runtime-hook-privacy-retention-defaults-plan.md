# WORKER_RUNTIME_JOBS SOUND CPU Phase 93 Privacy Retention Defaults Plan

```json worker-runtime-jobs-sound-cpu-phase93-caption-render-runtime-hook-privacy-retention-defaults-plan
{
  "label": "worker-runtime-jobs-sound-cpu-phase93-caption-render-runtime-hook-privacy-retention-defaults-plan",
  "privacyDefaults": {
    "privateByDefault": true,
    "publicArtifactCreationDefault": false,
    "signedUrlCreationDefault": false,
    "rawPromptPersistenceDefault": false,
    "rawMediaPathPersistenceDefault": false,
    "providerPayloadPersistenceDefault": false,
    "serviceRolePayloadPersistenceDefault": false,
    "secretValuePersistenceDefault": false
  },
  "retentionDefaults": {
    "retentionPolicyOwnerReviewRequired": true,
    "deleteOnProjectDeletionPolicyRequired": true,
    "auditEventRetentionPolicyRequired": true,
    "temporaryManifestCleanupPolicyRequired": true,
    "noRetentionPeriodSelectedToday": true
  }
}
```

Privacy defaults stay fail-closed until retention and storage owners review the persistence design.
