# SOUND Runtime Media Gate 2M Evaluator Contract Register

```json sound-runtime-media-gate-2m-evaluator-contract-register
{
  "decision": "sound_runtime_media_gate_2m_route_readiness_evaluator_plan_completed_with_warnings_ready_for_evaluator_owner_review",
  "plannedEvaluatorContract": {
    "inputRecords": [
      "route_contract_id",
      "approved_plan_snapshot_id_placeholder",
      "workspace_id_placeholder",
      "project_id_placeholder",
      "job_id_placeholder",
      "idempotency_key_placeholder",
      "static_runtime_flags_false",
      "fixture_payload_shape",
      "expected_rejection_reason"
    ],
    "outputRecords": [
      "readiness_planning_status",
      "accepted_fixture_count",
      "rejected_payload_field_count",
      "mismatch_case_count",
      "execution_flags_false",
      "owner_review_required"
    ],
    "inputMode": "static_fixture_records_only",
    "outputMode": "planning_only_readiness_report_shape"
  },
  "notAccepted": {
    "rawPrompts": true,
    "signedUrlsAsSourceOfTruth": true,
    "mediaFilePaths": true,
    "providerOutputBlobs": true,
    "secrets": true,
    "serviceRolePayloads": true,
    "modelWeightLocations": true,
    "artifactWriteTargets": true
  }
}
```
