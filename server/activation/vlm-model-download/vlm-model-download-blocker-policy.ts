export const VLM_MODEL_DOWNLOAD_EXPECTED_ARTIFACTS = [
  'phase_39b_vlm_model_download_plan.json',
  'phase_39b_vlm_exact_revision_manifest.json',
  'phase_39b_vlm_source_evidence.json',
  'phase_39b_vlm_license_evidence.json',
  'phase_39b_vlm_asset_selection_manifest.json',
  'phase_39b_vlm_download_command_plan.json',
  'phase_39b_vlm_checksum_manifest.json',
  'phase_39b_vlm_file_checksums_sha256.txt',
  'phase_39b_vlm_model_tree_manifest.json',
  'phase_39b_vlm_private_gcs_upload_report.json',
  'phase_39b_vlm_runtime_handoff_manifest.json',
  'phase_39b_vlm_cost_risk_update.json',
  'phase_39b_vlm_blocker_report.json',
  'phase_39b_vlm_model_download_report.json',
] as const

export const vlmModelDownloadBlockers = [
  'Qwen3-VL exact revision assets are not downloaded in default plan/report/smoke mode.',
  'Qwen3-VL exact revision assets are not checksummed until guarded Phase 39B execution runs.',
  'Qwen3-VL exact revision assets are not verified in private staging GCS until guarded upload verification passes.',
  'Phase 39C generated VLM runtime verification remains blocked until Phase 39B private asset evidence is verified.',
]

export const vlmModelDownloadWarnings = [
  'Phase 39B stages exact Qwen3-VL model/tokenizer/processor/config files only.',
  'Phase 39B does not run vLLM, Transformers inference, SGLang, GPU jobs, providers, images, video, or media processing.',
  'Phase 39C must use a local private model path and must block runtime auto-download.',
  'Apache-2.0 source/license metadata is staging evidence only and is not production legal approval.',
]

export const vlmModelDownloadNotReadyFor = [
  'VLM runtime execution',
  'vLLM runtime execution',
  'Transformers inference',
  'SGLang runtime execution',
  'runtime model auto-download',
  'generated VLM inference before Phase 39C',
  'controlled real-frame VLM before Phase 39D',
  'VLM planning integration before Phase 39E',
  'GPU jobs',
  'image processing',
  'video processing',
  'real media processing',
  'arbitrary media processing',
  'provider calls',
  'public output',
  'production',
  'internal beta',
  'external beta',
  'paid production',
  'broad real user media',
  'Track A execution/runtime code',
]
