# SOUND Runtime Media Gate 2R Rejected Payload Field Proof Register

```json sound-runtime-media-gate-2r-rejected-payload-field-proof-register
{
  "decision": "sound_runtime_media_gate_2r_controlled_static_integration_import_proof_passed_with_warnings_ready_for_import_proof_owner_review",
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
  "canonicalRejectedPayloadFieldCount": 14,
  "sourceFix": {
    "fixedCountFrom": 13,
    "fixedCountTo": 14,
    "nonCanonicalFieldsRemoved": [
      "modelWeightLocation",
      "ffmpegInput",
      "supabaseRow",
      "cloudRunJob",
      "workerExecutionLease",
      "billingMutation"
    ],
    "canonicalFieldsCovered": true
  },
  "proofAssertions": {
    "fixtureCount": 9,
    "acceptedFixtureCount": 4,
    "mismatchCaseCount": 5,
    "readinessClaimFalse": true,
    "runtimeFlagsFalse": true
  }
}
```
