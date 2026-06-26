# SOUND Runtime Media Gate 2AD Worker Media Supabase Contract Map

```json sound-runtime-media-gate-2ad-worker-media-supabase-contract-map
{
  "decision": "sound_runtime_media_gate_2ad_worker_media_supabase_execution_gate_source_plan_completed_with_warnings_ready_for_execution_gate_source_owner_review",
  "acceptedPlanningSurface": {
    "workerNames": [
      "sound-cpu-analysis-worker",
      "sound-audio-metadata-worker"
    ],
    "jobTypes": [
      "sound.package_import_smoke",
      "sound.numeric_array_analysis",
      "sound.symbolic_midi_analysis",
      "sound.loudness_synthetic_analysis"
    ],
    "sourceContractCategories": [
      "approved_plan_snapshot_reference",
      "idempotency_key",
      "attempt_metadata",
      "runtime_disabled_flags",
      "media_operation_guard",
      "supabase_operation_guard",
      "artifact_policy_guard",
      "observability_audit_event_shape"
    ]
  },
  "rejectedPayloadInputs": [
    "raw_prompt",
    "provider_output_blob",
    "secret_value",
    "service_role_payload",
    "signed_url_as_source_of_truth",
    "model_weight_location",
    "public_artifact_target"
  ],
  "executionApprovedToday": false
}
```
