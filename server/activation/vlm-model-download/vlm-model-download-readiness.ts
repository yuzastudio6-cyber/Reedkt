import { VLM_MODEL_DOWNLOAD_GCS_PATH } from './vlm-model-download-config'
import type { ApprovedVlmModelDownloadEvidence } from './vlm-model-download-types'

export function buildVlmModelDownloadReadiness(evidence: ApprovedVlmModelDownloadEvidence) {
  const ready = evidence.status === 'verified' && evidence.blockers.length === 0
  return {
    phase39BStatus: ready ? 'passed_private_model_staging' : 'blocked_private_model_staging_incomplete',
    phase39CReadyForGeneratedRuntimeVerification: ready,
    reason: ready
      ? `Phase 39B verified pinned Qwen3-VL assets in private GCS at ${VLM_MODEL_DOWNLOAD_GCS_PATH}.`
      : `Phase 39B private staging evidence is incomplete: ${evidence.blockers.join('; ') || 'no verified evidence yet'}.`,
    blockers: ready ? [] : evidence.blockers,
    stillBlocked: [
      'VLM runtime execution remains blocked until Phase 39C.',
      'Generated VLM inference remains blocked until Phase 39C.',
      'Controlled real-frame VLM remains blocked until Phase 39D.',
      'VLM planning integration remains blocked until Phase 39E.',
      'Provider calls, GPU jobs, public output, beta, production, broad media, arbitrary media, Docker push, Cloud Run deploy, and Track A remain blocked.',
    ],
  }
}
