# WORKER_RUNTIME_JOBS SOUND CPU Phase 83 Proof Runner Output Manifest Schema Plan

```json worker-runtime-jobs-sound-cpu-phase83-caption-render-runtime-hook-proof-runner-output-manifest-schema-plan
{
  "label": "worker-runtime-jobs-sound-cpu-phase83-caption-render-runtime-hook-proof-runner-output-manifest-schema-plan",
  "owner": "WORKER_RUNTIME_JOBS",
  "plannedOutputManifestSchema": {
    "manifestVersion": "phase83-proof-runner-source-plan-v1",
    "requiredTopLevelFields": [
      "decision",
      "sourceDecision",
      "fixtureInstances",
      "counts",
      "executionState",
      "cleanupRequired"
    ],
    "requiredFixtureInstanceFields": [
      "fixtureInstanceId",
      "sourceFixtureId",
      "privateMediaAssetId",
      "plannedPrivateArtifactId",
      "idempotencyKey",
      "approvedPlanSnapshotId",
      "creationGate"
    ],
    "disallowedFields": [
      "rawPrompt",
      "mediaFilePath",
      "signedUrl",
      "publicArtifactUrl",
      "providerOutputBlob",
      "secret",
      "serviceRolePayload"
    ]
  },
  "executionState": {
    "manifestSchemaSourceCreatedToday": false,
    "manifestWrittenToday": false,
    "artifactCreatedToday": false
  }
}
```

The manifest schema is planned for a future disposable local proof only.
