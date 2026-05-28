import { ENHANCEMENT_MODEL_APPROVAL_REVIEWED_AT } from './enhancement-model-candidate-registry'
import type { EnhancementModelLicenseEvidence } from './enhancement-model-approval-types'

export const enhancementModelLicenseEvidenceRegistry: EnhancementModelLicenseEvidence[] = [
  {
    evidenceId: 'real_esrgan_github_bsd_3_clause',
    modelCandidateId: 'xinntao_real_esrgan_x4plus',
    sourceName: 'GitHub repository: xinntao/Real-ESRGAN',
    sourceUrl: 'https://github.com/xinntao/Real-ESRGAN',
    sourceType: 'github',
    licenseClaim: 'BSD-3-Clause',
    commercialUseClaim: 'likely_allowed',
    redistributionClaim: 'likely_allowed',
    attributionRequirements: ['Preserve BSD-3-Clause license notice, model source URL, and citation/source attribution in review records.'],
    fetchedAt: ENHANCEMENT_MODEL_APPROVAL_REVIEWED_AT,
    reviewedAt: ENHANCEMENT_MODEL_APPROVAL_REVIEWED_AT,
    confidence: 'high',
    notes: [
      'GitHub repository metadata and LICENSE identify BSD-3-Clause licensing for the Real-ESRGAN repository.',
      'Repository describes Real-ESRGAN as practical image/video restoration and super-resolution.',
      'Code/repository evidence is recorded separately from release asset/model-weight checksum evidence.',
      'This evidence supports staging sample-first enhancement planning only.',
    ],
  },
  {
    evidenceId: 'real_esrgan_x4plus_release_model_zoo',
    modelCandidateId: 'xinntao_real_esrgan_x4plus',
    sourceName: 'Real-ESRGAN README/model zoo: RealESRGAN_x4plus release asset',
    sourceUrl: 'https://github.com/xinntao/Real-ESRGAN/releases/download/v0.1.0/RealESRGAN_x4plus.pth',
    sourceType: 'release_asset',
    licenseClaim: 'BSD-3-Clause repo evidence; release asset license evidence pending checksum review',
    commercialUseClaim: 'requires_manual_review',
    redistributionClaim: 'requires_manual_review',
    attributionRequirements: ['Preserve Real-ESRGAN source and release asset URL in Phase 34B download evidence.'],
    fetchedAt: ENHANCEMENT_MODEL_APPROVAL_REVIEWED_AT,
    reviewedAt: ENHANCEMENT_MODEL_APPROVAL_REVIEWED_AT,
    confidence: 'medium',
    notes: [
      'Official README lists RealESRGAN_x4plus as the general-image/default model path and provides a release download command.',
      'Phase 34A does not download this asset; Phase 34B must record revision, checksum, total size, and private GCS upload evidence.',
      'Release/model-weight evidence must remain staging-only until separately reviewed.',
    ],
  },
  {
    evidenceId: 'film_github_apache_2',
    modelCandidateId: 'google_research_film',
    sourceName: 'GitHub repository: google-research/frame-interpolation',
    sourceUrl: 'https://github.com/google-research/frame-interpolation',
    sourceType: 'github',
    licenseClaim: 'Apache-2.0',
    commercialUseClaim: 'likely_allowed',
    redistributionClaim: 'likely_allowed',
    attributionRequirements: ['Preserve Apache-2.0 license notices if FILM is separately approved later.'],
    fetchedAt: ENHANCEMENT_MODEL_APPROVAL_REVIEWED_AT,
    reviewedAt: ENHANCEMENT_MODEL_APPROVAL_REVIEWED_AT,
    confidence: 'high',
    notes: [
      'Repository metadata and LICENSE identify Apache-2.0 licensing for the FILM code repository.',
      'Repository describes itself as the official TensorFlow 2 implementation of FILM.',
      'Pre-trained TF2 Saved Models are downloaded separately from Google Drive per the README.',
      'FILM is evaluated-only and execution/download-blocked in Phase 34A.',
    ],
  },
]

export function listEnhancementModelLicenseEvidence(): EnhancementModelLicenseEvidence[] {
  return [...enhancementModelLicenseEvidenceRegistry]
}

export function enhancementEvidenceForCandidate(candidateId: string): EnhancementModelLicenseEvidence[] {
  return enhancementModelLicenseEvidenceRegistry.filter((evidence) => evidence.modelCandidateId === candidateId)
}
