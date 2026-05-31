import type { ApprovedVlmRuntimeEvidence } from './vlm-runtime-types'

export const approvedVlmRuntimeEvidence: ApprovedVlmRuntimeEvidence = {
  "phase": "39C",
  "status": "blocked",
  "runId": "phase39c-20260531T111759",
  "modelId": "Qwen/Qwen3-VL-8B-Instruct",
  "revision": "0c351dd01ed87e9c1b53cbc748cba10e6187ff3b",
  "modelGcsPath": "gs://reeditpro-staging-reeditpro-generated-assets/model-weights/qwen3-vl/qwen3-vl-8b-instruct/0c351dd01ed87e9c1b53cbc748cba10e6187ff3b/",
  "aggregateSha256": "3574ebc03f40a6891db0bdb99e7f1802cd58aa7d15055c260eba196b167a7908",
  "runtime": "vllm",
  "fallbackRuntime": "transformers_fallback",
  "fixtureIds": [
    "generated-object-layout",
    "generated-ui-safe-zone",
    "generated-ocr-vlm-comparison",
    "generated-ambiguous-scene",
    "generated-spatial-reasoning"
  ],
  "artifactPrefix": "gs://reeditpro-staging-reeditpro-qa-artifacts/activation/phase39c/generated-vlm-runtime/phase39c-20260531T111759/",
  "qaReportUri": "gs://reeditpro-staging-reeditpro-qa-artifacts/activation/phase39c/generated-vlm-runtime/phase39c-20260531T111759/phase_39c_generated_vlm_runtime_report.json",
  "vlmToolFamilyBetaStatus": "blocked",
  "phase39DReadiness": {
    "readyForControlledRealFrameVlm": false,
    "reason": "Phase 39D remains blocked because Phase 39C generated VLM runtime verification did not pass."
  },
  "blockers": [
    "phase39c_l4_or_local_gpu_runtime_unavailable",
    "local_model_payload_checksum_verification_not_run"
  ],
  "warnings": [
    "Phase 39C verifies generated synthetic VLM fixtures only.",
    "Passing Phase 39C does not approve controlled real-frame VLM until Phase 39D or planning integration until Phase 39E.",
    "No local NVIDIA GPU is available and the guarded staging L4 Cloud Run Job path is not fully confirmed; skipping 17.5GB model copy and vLLM startup.",
    "metadata_only_verification_for:README.md",
    "metadata_only_verification_for:chat_template.json",
    "metadata_only_verification_for:config.json",
    "metadata_only_verification_for:generation_config.json",
    "metadata_only_verification_for:merges.txt",
    "metadata_only_verification_for:model-00001-of-00004.safetensors",
    "metadata_only_verification_for:model-00002-of-00004.safetensors",
    "metadata_only_verification_for:model-00003-of-00004.safetensors",
    "metadata_only_verification_for:model-00004-of-00004.safetensors",
    "metadata_only_verification_for:model.safetensors.index.json",
    "metadata_only_verification_for:preprocessor_config.json",
    "metadata_only_verification_for:tokenizer.json",
    "metadata_only_verification_for:tokenizer_config.json",
    "metadata_only_verification_for:video_preprocessor_config.json",
    "metadata_only_verification_for:vocab.json"
  ]
}

export function getApprovedVlmRuntimeEvidence(): ApprovedVlmRuntimeEvidence {
  return {
    ...approvedVlmRuntimeEvidence,
    fixtureIds: [...approvedVlmRuntimeEvidence.fixtureIds],
    phase39DReadiness: { ...approvedVlmRuntimeEvidence.phase39DReadiness },
    blockers: [...approvedVlmRuntimeEvidence.blockers],
    warnings: [...approvedVlmRuntimeEvidence.warnings],
  }
}
