import type { VlmRuntimeSupportEvidence } from './vlm-model-approval-types'
import { findVlmSourceEvidence } from './vlm-model-source-evidence'

export const vlmRuntimeSupportEvidence: VlmRuntimeSupportEvidence[] = [
  {
    runtimeId: 'vllm',
    runtimeName: 'vLLM',
    role: 'primary',
    qwen3VlSupported: true,
    minVersionEvidence: 'vLLM supported models list includes qwen3_vl; Qwen vLLM docs mention vLLM version/CUDA/Torch caveats, while current Qwen3-VL docs indicate vLLM>=0.11.0 for Qwen3-VL support.',
    localPathRequired: true,
    defaultExternalDownloadRisk: true,
    gpuRequiredForPracticalRuntime: 'expected_for_vllm',
    cpuOnlyPlanningAllowed: false,
    evidence: [
      findVlmSourceEvidence('vllm_supported_models_qwen3_vl'),
      findVlmSourceEvidence('qwen_vllm_docs_runtime_caveats'),
    ],
    blockers: [
      'Phase 39A cannot run vLLM.',
      'Phase 39C must use private local model paths only and fail closed if vLLM attempts Hugging Face or ModelScope downloads.',
      'Phase 39C must pin CUDA/Torch/vLLM compatibility before any GPU runtime.',
    ],
    warnings: [
      'Prompt-provided Qwen vLLM evidence mentions vllm>=0.8.5 for general Qwen3; Qwen3-VL repo deployment currently states vLLM>=0.11.0 for Qwen3-VL support.',
      'vLLM default behavior can download model files from Hugging Face when a valid local directory is not provided.',
    ],
  },
  {
    runtimeId: 'transformers',
    runtimeName: 'local Transformers',
    role: 'fallback_planning_only',
    qwen3VlSupported: 'supported_by_model_definition_only',
    minVersionEvidence: 'Qwen3-VL repository states Qwen3-VL requires Transformers >= 4.57.0; future fallback must pin a current compatible version before use.',
    localPathRequired: true,
    defaultExternalDownloadRisk: true,
    gpuRequiredForPracticalRuntime: true,
    cpuOnlyPlanningAllowed: false,
    evidence: [
      findVlmSourceEvidence('qwen3_vl_repo_multimodal_vlm'),
      findVlmSourceEvidence('transformers_repo_apache2_multimodal'),
    ],
    blockers: [
      'Phase 39A cannot run Transformers.',
      'Fallback runtime remains planning-only unless vLLM is blocked by future generated-fixture evidence.',
      'Future fallback must disable remote Hub downloads and use private local model paths only.',
    ],
    warnings: [
      'Transformers fallback may have higher memory/cost and different structured-output behavior than vLLM.',
    ],
  },
]
