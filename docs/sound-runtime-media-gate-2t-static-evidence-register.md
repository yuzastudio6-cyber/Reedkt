# SOUND Runtime Media Gate 2T Static Evidence Register

```json sound-runtime-media-gate-2t-static-evidence-register
{
  "decision": "sound_runtime_media_gate_2t_bounded_route_readiness_static_review_completed_with_warnings_ready_for_static_review_owner_review",
  "acceptedStaticEvidence": {
    "gate2sPlanAccepted": true,
    "gate2sOwnerReviewAccepted": true,
    "gate2rControlledStaticImportProofAccepted": true,
    "canonicalRejectedPayloadFieldCount": 14,
    "canonicalRejectedPayloadFields": [
      "rawPrompt",
      "uploadedMediaUri",
      "signedUrl",
      "publicArtifactUrl",
      "mediaFilePath",
      "providerOutputBlob",
      "secretValue",
      "serviceRolePayload",
      "modelWeightPath",
      "artifactWriteTarget",
      "supabaseMutation",
      "sqlText",
      "dockerCommand",
      "gcpCommand"
    ],
    "runtimeFlagsFalse": true,
    "readinessClaimsFalse": true
  },
  "evidenceNotAcceptedFor": {
    "routeReadiness": true,
    "workerReadiness": true,
    "runtimeReadiness": true,
    "mediaReadiness": true,
    "betaReadiness": true,
    "productionReadiness": true,
    "routeExecution": true,
    "workerExecution": true
  }
}
```
