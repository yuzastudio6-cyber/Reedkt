import type { VlmSourceEvidence } from './vlm-model-approval-types'

export const VLM_MODEL_APPROVAL_REVIEWED_AT = '2026-05-31T00:00:00.000Z'

export const vlmModelSourceEvidence: VlmSourceEvidence[] = [
  {
    evidenceId: 'qwen3_vl_repo_multimodal_vlm',
    sourceName: 'Qwen3-VL GitHub repository',
    sourceUrl: 'https://github.com/QwenLM/Qwen3-VL',
    sourceType: 'github',
    claim: 'Qwen3-VL is a multimodal vision-language model series with image, video, spatial, OCR, and agent capabilities.',
    evidenceSummary: 'Official Qwen3-VL repository describes Qwen3-VL as a vision-language model series with stronger visual perception, spatial reasoning, video understanding, OCR, and agent interaction capabilities.',
    reviewedAt: VLM_MODEL_APPROVAL_REVIEWED_AT,
    confidence: 'high',
    notes: [
      'Phase 39A records capability/source evidence only; it does not run prompts or inspect media.',
      'The official repository currently notes Qwen3-VL deployment with vLLM needs a newer vLLM line than older general Qwen3 text-only docs.',
    ],
  },
  {
    evidenceId: 'qwen3_vl_repo_apache2_license',
    sourceName: 'Qwen3-VL GitHub repository license badge/file',
    sourceUrl: 'https://github.com/QwenLM/Qwen3-VL',
    sourceType: 'github',
    claim: 'Qwen3-VL repository license is Apache-2.0.',
    evidenceSummary: 'The official repository exposes an Apache-2.0 license entry. Exact model-card/license metadata must still be rechecked at the selected Phase 39B revision.',
    reviewedAt: VLM_MODEL_APPROVAL_REVIEWED_AT,
    confidence: 'high',
    notes: ['Legal approval is planning-only until exact model revision/file evidence is selected.'],
  },
  {
    evidenceId: 'qwen3_vl_8b_hf_model_card_identity',
    sourceName: 'Hugging Face model card',
    sourceUrl: 'https://huggingface.co/Qwen/Qwen3-VL-8B-Instruct',
    sourceType: 'huggingface',
    claim: 'The model card identifies Qwen/Qwen3-VL-8B-Instruct with Image-Text-to-Text, Transformers, Safetensors, qwen3_vl, conversational, and apache-2.0 metadata.',
    evidenceSummary: 'The selected candidate exists as a Hugging Face model card with the intended model id, architecture tag, task tag, and Apache-2.0 model-card license metadata.',
    reviewedAt: VLM_MODEL_APPROVAL_REVIEWED_AT,
    confidence: 'high',
    notes: ['Phase 39B must pin the exact revision and file manifest before any download.'],
  },
  {
    evidenceId: 'vllm_supported_models_qwen3_vl',
    sourceName: 'vLLM supported models documentation',
    sourceUrl: 'https://docs.vllm.ai/en/latest/models/supported_models/',
    sourceType: 'docs',
    claim: 'vLLM supported model listings include qwen3_vl.',
    evidenceSummary: 'The vLLM supported-models page lists the qwen3_vl architecture key, making vLLM the primary runtime candidate for future generated-fixture VLM runtime verification.',
    reviewedAt: VLM_MODEL_APPROVAL_REVIEWED_AT,
    confidence: 'high',
    notes: ['Runtime support evidence does not authorize vLLM execution in Phase 39A.'],
  },
  {
    evidenceId: 'qwen_vllm_docs_runtime_caveats',
    sourceName: 'Qwen vLLM deployment documentation',
    sourceUrl: 'https://qwen.readthedocs.io/en/latest/deployment/vllm.html',
    sourceType: 'runtime_docs',
    claim: 'Qwen vLLM docs recommend vLLM, discuss vLLM version/CUDA/Torch caveats, and warn that a non-local model path can trigger Hugging Face Hub downloads.',
    evidenceSummary: 'Qwen vLLM docs support vLLM deployment planning and explicitly create a future no-runtime-download requirement because default behavior can fetch from Hugging Face when no valid local path is provided.',
    reviewedAt: VLM_MODEL_APPROVAL_REVIEWED_AT,
    confidence: 'high',
    notes: [
      'Prompt-specified evidence mentions vllm>=0.8.5 for general Qwen3 notes; current Qwen3-VL repo deployment notes vLLM>=0.11.0 for Qwen3-VL support.',
      'Phase 39B/39C must pin a runtime version after reconciling that version discrepancy.',
    ],
  },
  {
    evidenceId: 'transformers_repo_apache2_multimodal',
    sourceName: 'Transformers GitHub repository',
    sourceUrl: 'https://github.com/huggingface/transformers',
    sourceType: 'github',
    claim: 'Transformers is Apache-2.0 and supports text, computer vision, audio, video, and multimodal model definitions.',
    evidenceSummary: 'Transformers is recorded as fallback runtime planning only, useful for model-definition compatibility checks if vLLM is not viable in future phases.',
    reviewedAt: VLM_MODEL_APPROVAL_REVIEWED_AT,
    confidence: 'high',
    notes: ['Fallback planning does not authorize Phase 39A Transformers execution or model download.'],
  },
  {
    evidenceId: 'qwen_vl_utils_pypi_apache2',
    sourceName: 'qwen-vl-utils PyPI',
    sourceUrl: 'https://pypi.org/project/qwen-vl-utils/',
    sourceType: 'pypi',
    claim: 'qwen-vl-utils is a Qwen vision-language utility package with Apache-2.0 metadata.',
    evidenceSummary: 'qwen-vl-utils is recorded as a future utility-dependency candidate for local private image/frame packaging only after a later runtime phase approves dependencies.',
    reviewedAt: VLM_MODEL_APPROVAL_REVIEWED_AT,
    confidence: 'medium',
    notes: ['PyPI package metadata is useful for planning, but Phase 39C must pin package version and hashes before installation.'],
  },
]

export function findVlmSourceEvidence(evidenceId: string): VlmSourceEvidence {
  const evidence = vlmModelSourceEvidence.find((item) => item.evidenceId === evidenceId)
  if (!evidence) throw new Error(`Unknown VLM source evidence: ${evidenceId}`)
  return evidence
}
