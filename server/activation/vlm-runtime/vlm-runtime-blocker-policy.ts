export const VLM_RUNTIME_EXPECTED_ARTIFACTS = [
  'phase_39c_vlm_runtime_plan.json',
  'phase_39c_vlm_model_asset_verification.json',
  'phase_39c_generated_fixture_manifest.json',
  'phase_39c_prompt_template_manifest.json',
  'phase_39c_vlm_runtime_results.json',
  'phase_39c_vlm_output_schema_validation_report.json',
  'phase_39c_vlm_object_region_qa_report.json',
  'phase_39c_vlm_safe_zone_qa_report.json',
  'phase_39c_vlm_hallucination_safety_report.json',
  'phase_39c_vlm_runtime_cost_memory_report.json',
  'phase_39c_vlm_l4_tuning_matrix_report.json',
  'phase_39c_private_artifact_manifest.json',
  'phase_39c_generated_vlm_runtime_report.json',
] as const

export const vlmRuntimeBlockedScopes = [
  'Phase 39D controlled real-frame VLM until Phase 39C passes and a separate bounded private sample gate is approved.',
  'Phase 39E structured VLM planning integration until Phase 39D and a separate integration gate pass.',
  'Provider calls and OpenAI-compatible VLM endpoints.',
  'Raw prompt execution.',
  'Real media, broad media, arbitrary images, arbitrary videos, and arbitrary uploaded files.',
  'Public output, public buckets, signed URLs as source of truth, beta, and production.',
  'Docker push or Cloud Run Job outside the explicitly guarded staging path.',
  'GPU types other than L4.',
  'Track A execution/runtime/render stack.',
]

export const vlmRuntimeSafetyGates = [
  'phase39a_approval_evidence',
  'phase39b_private_model_assets',
  'checksum_verification',
  'local_model_path_only',
  'runtime_auto_download_blocked',
  'generated_fixture_integrity',
  'bounded_prompt_templates',
  'structured_json_schema',
  'object_region_qa',
  'safe_zone_qa',
  'hallucination_safety_qa',
  'private_artifacts',
  'blocked_features',
] as const
