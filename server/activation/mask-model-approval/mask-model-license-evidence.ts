import { MASK_MODEL_APPROVAL_REVIEWED_AT } from './mask-model-candidate-registry'
import type { MaskModelLicenseEvidence } from './mask-model-approval-types'

export const maskModelLicenseEvidenceRegistry: MaskModelLicenseEvidence[] = [
  {
    evidenceId: 'birefnet_hf_model_card_mit',
    modelCandidateId: 'zhengpeng7_birefnet',
    sourceName: 'Hugging Face model card: ZhengPeng7/BiRefNet',
    sourceUrl: 'https://huggingface.co/ZhengPeng7/BiRefNet',
    sourceType: 'huggingface',
    licenseClaim: 'mit',
    commercialUseClaim: 'likely_allowed',
    redistributionClaim: 'likely_allowed',
    attributionRequirements: ['Preserve MIT license notice, model source URL, and citation/source attribution in review records.'],
    fetchedAt: MASK_MODEL_APPROVAL_REVIEWED_AT,
    reviewedAt: MASK_MODEL_APPROVAL_REVIEWED_AT,
    confidence: 'high',
    notes: [
      'Hugging Face metadata lists License: mit.',
      'Model tags include image segmentation, background-removal, and mask-generation.',
      'Model card states the repo holds the official model weights for BiRefNet.',
      'This evidence supports staging single-frame background-removal planning only.',
    ],
  },
  {
    evidenceId: 'birefnet_github_mit',
    modelCandidateId: 'zhengpeng7_birefnet',
    sourceName: 'GitHub repository: ZhengPeng7/BiRefNet',
    sourceUrl: 'https://github.com/ZhengPeng7/BiRefNet',
    sourceType: 'github',
    licenseClaim: 'mit',
    commercialUseClaim: 'likely_allowed',
    redistributionClaim: 'likely_allowed',
    attributionRequirements: ['Preserve MIT license notice and citation/source attribution.'],
    fetchedAt: MASK_MODEL_APPROVAL_REVIEWED_AT,
    reviewedAt: MASK_MODEL_APPROVAL_REVIEWED_AT,
    confidence: 'high',
    notes: [
      'Official GitHub repository shows an MIT license.',
      'Code/repository license is recorded separately from model-weight evidence.',
    ],
  },
  {
    evidenceId: 'sam2_hiera_tiny_hf_apache',
    modelCandidateId: 'facebook_sam2_hiera_tiny',
    sourceName: 'Hugging Face model card: facebook/sam2-hiera-tiny',
    sourceUrl: 'https://huggingface.co/facebook/sam2-hiera-tiny',
    sourceType: 'huggingface',
    licenseClaim: 'apache-2.0',
    commercialUseClaim: 'likely_allowed',
    redistributionClaim: 'likely_allowed',
    attributionRequirements: ['Preserve Apache-2.0 license notices if separately approved later.'],
    fetchedAt: MASK_MODEL_APPROVAL_REVIEWED_AT,
    reviewedAt: MASK_MODEL_APPROVAL_REVIEWED_AT,
    confidence: 'high',
    notes: [
      'Hugging Face metadata lists License: apache-2.0.',
      'Model tags include mask generation and segmentation.',
      'SAM2 is evaluated-only and execution-blocked in Phase 33A.',
    ],
  },
  {
    evidenceId: 'sam2_official_github_apache_checkpoints',
    modelCandidateId: 'meta_sam2_official_checkpoints',
    sourceName: 'GitHub repository: facebookresearch/sam2',
    sourceUrl: 'https://github.com/facebookresearch/sam2',
    sourceType: 'github',
    licenseClaim: 'apache-2.0',
    commercialUseClaim: 'likely_allowed',
    redistributionClaim: 'likely_allowed',
    attributionRequirements: [
      'Preserve Apache-2.0 notices for SAM2 model checkpoints, demo code, and training code if separately approved later.',
      'Preserve separate SIL Open Font License notices for demo fonts if demo code/assets are used.',
      'Preserve optional third-party code license notices such as LICENSE_cctorch if used.',
    ],
    fetchedAt: MASK_MODEL_APPROVAL_REVIEWED_AT,
    reviewedAt: MASK_MODEL_APPROVAL_REVIEWED_AT,
    confidence: 'high',
    notes: [
      'Official repository states SAM2 checkpoints, demo code, and training code are Apache 2.0.',
      'Repository also notes third-party font licenses and optional third-party code licensing.',
      'This is upstream evidence only; no SAM2 execution is approved in Phase 33A.',
    ],
  },
]

export function listMaskModelLicenseEvidence(): MaskModelLicenseEvidence[] {
  return [...maskModelLicenseEvidenceRegistry]
}

export function maskEvidenceForCandidate(candidateId: string): MaskModelLicenseEvidence[] {
  return maskModelLicenseEvidenceRegistry.filter((evidence) => evidence.modelCandidateId === candidateId)
}
