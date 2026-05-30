import { audioAiToolEvidence } from './audio-ai-tool-evidence'
import type { AudioAiLicenseReview } from './audio-ai-approval-types'

function reviewFor(tool: typeof audioAiToolEvidence[number]): AudioAiLicenseReview {
  if (tool.toolId === 'deepfilternet') {
    return {
      toolId: tool.toolId,
      licenseIdentified: true,
      licenseName: 'MIT OR Apache-2.0',
      commercialUseAllowed: true,
      redistributionAllowed: true,
      modelArtifactUseAllowed: 'unknown',
      requiresHumanLegalReview: false,
      codexReviewDecision: 'blocked_missing_artifact_evidence',
      currentStatus: 'Source/license evidence supports DeepFilterNet as the first staging planning recommendation, but the exact future artifact source/checksum is not selected.',
      evidenceRequired: [
        'Exact official DeepFilterNet artifact source for Phase 36B.',
        'Checksum plan for the selected artifact.',
        'Private staging model storage path.',
        'Runtime constraint review proving no external model download at execution time.',
      ],
    }
  }

  if (tool.toolId === 'rnnoise') {
    return {
      toolId: tool.toolId,
      licenseIdentified: true,
      licenseName: 'BSD-3-Clause',
      commercialUseAllowed: true,
      redistributionAllowed: true,
      modelArtifactUseAllowed: 'unknown',
      requiresHumanLegalReview: false,
      codexReviewDecision: 'blocked_missing_artifact_evidence',
      currentStatus: 'RNNoise is acceptable for fallback planning, but its build-time model download behavior must be pinned and checksummed before use.',
      evidenceRequired: [
        'Exact RNNoise model file source and revision.',
        'Build/runtime plan that disables surprise network model downloads.',
        'Checksum plan and private staging storage path.',
      ],
    }
  }

  return {
    toolId: tool.toolId,
    licenseIdentified: true,
    licenseName: 'MIT for code; pretrained model terms unknown',
    commercialUseAllowed: 'unknown',
    redistributionAllowed: 'unknown',
    modelArtifactUseAllowed: 'unknown',
    requiresHumanLegalReview: true,
    codexReviewDecision: 'blocked_license_provenance',
    currentStatus: 'Demucs code license is identified, but pretrained model artifact terms/provenance remain ambiguous and source separation is not the first voice-cleanup path.',
    evidenceRequired: [
      'Exact Demucs pretrained model artifact source and license.',
      'Commercial-use and redistribution review for the selected artifact.',
      'Source-separation-specific product justification.',
      'Checksum plan and private staging storage path.',
    ],
  }
}

export const audioAiLicenseReviews: AudioAiLicenseReview[] = audioAiToolEvidence.map(reviewFor)
