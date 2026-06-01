import {
  VLM_MODEL_DOWNLOAD_HF_MODEL_URL,
  VLM_MODEL_DOWNLOAD_MODEL_ID,
} from './vlm-model-download-config'
import type { VlmExactRevisionManifest, VlmLicenseEvidence } from './vlm-model-download-types'

export function buildVlmModelDownloadLicenseEvidence(
  revisionManifest: VlmExactRevisionManifest,
  createdAt = new Date().toISOString(),
): VlmLicenseEvidence {
  const blockers = revisionManifest.licenseTagPresent ? [] : ['vlm_license_review_required: Hugging Face license tag is missing or changed from apache-2.0.']
  return {
    phase: '39B',
    collectedAt: createdAt,
    modelId: VLM_MODEL_DOWNLOAD_MODEL_ID,
    revision: revisionManifest.revision,
    licenseName: revisionManifest.licenseTagPresent ? 'apache-2.0' : 'missing_or_changed',
    licenseTagPresent: revisionManifest.licenseTagPresent,
    modelCardEvidenceUrl: VLM_MODEL_DOWNLOAD_HF_MODEL_URL,
    qwenRepoEvidenceUrl: 'https://github.com/QwenLM/Qwen3-VL',
    codexLicenseDecision: revisionManifest.licenseTagPresent ? 'staging_download_approved_by_codex' : 'vlm_license_review_required',
    humanLegalReviewRequiredBeforePhase39C: !revisionManifest.licenseTagPresent,
    productionLegalApprovalComplete: false,
    blockers,
    warnings: [
      'Apache-2.0 metadata supports private staging evidence only; production legal approval remains incomplete.',
      'Human legal/source review is required before broad production use, provider use, or any redistribution decision.',
    ],
  }
}
