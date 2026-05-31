import {
  VLM_MODEL_DOWNLOAD_HF_API_URL,
  VLM_MODEL_DOWNLOAD_HF_MODEL_URL,
  VLM_MODEL_DOWNLOAD_MODEL_ID,
} from './vlm-model-download-config'
import { VLM_MODEL_DOWNLOAD_PHASE39A_COMMIT, VLM_MODEL_DOWNLOAD_PHASE39A_PR } from './vlm-model-phase39a-evidence'
import type { VlmExactRevisionManifest, VlmSourceEvidence } from './vlm-model-download-types'

export function buildVlmModelDownloadSourceEvidence(
  revisionManifest: VlmExactRevisionManifest,
  createdAt = new Date().toISOString(),
): VlmSourceEvidence {
  return {
    phase: '39B',
    collectedAt: createdAt,
    phase39APr: VLM_MODEL_DOWNLOAD_PHASE39A_PR,
    phase39ACommit: VLM_MODEL_DOWNLOAD_PHASE39A_COMMIT,
    modelId: VLM_MODEL_DOWNLOAD_MODEL_ID,
    revision: revisionManifest.revision,
    modelCardUrl: VLM_MODEL_DOWNLOAD_HF_MODEL_URL,
    qwenRepoUrl: 'https://github.com/QwenLM/Qwen3-VL',
    vllmSupportedModelsUrl: 'https://docs.vllm.ai/en/latest/models/supported_models/',
    qwenVllmDocsUrl: 'https://qwen.readthedocs.io/en/latest/deployment/vllm.html',
    sourceVerificationMethod: `Hugging Face model API metadata with blobs enabled: ${VLM_MODEL_DOWNLOAD_HF_API_URL}`,
    exactRevisionResolved: revisionManifest.revisionPinned,
    fileListResolved: revisionManifest.blockers.every((blocker) => !blocker.startsWith('vlm_file_list_unexpected') && !blocker.startsWith('vlm_required_file_missing')),
    authenticationRequired: revisionManifest.authenticationRequired,
    authenticationAvailable: revisionManifest.authenticationAvailable,
    blockers: revisionManifest.blockers.filter((blocker) => blocker.includes('revision') || blocker.includes('file') || blocker.includes('model_id')),
    warnings: [
      'Qwen3-VL repo, Hugging Face model card, vLLM supported-models, and Qwen vLLM docs remain source references for planning and Phase 39C handoff.',
      'Phase 39B does not call vLLM, Transformers, SGLang, provider APIs, or inference endpoints.',
      ...revisionManifest.warnings,
    ],
  }
}
