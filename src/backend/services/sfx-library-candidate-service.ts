import type {
  SFXLibraryCandidateRecord,
  SFXLibraryDecision,
  SFXLibraryPromotionReason,
  SFXProvenanceReviewRecord,
} from '../../types'
import type { ProcessGeneratedSFXForLibraryGrowthRequest } from '../contracts/sfx-director-contracts'
import type { MockDatabase } from '../mock/mock-database'
import { createMockId, insertMockRecord, nowIso } from '../mock/mock-database'
import { createSFXLibraryAvoidTags, createSFXLibraryCandidateTags } from './sfx-library-tagging-service'

export interface SFXLibraryCandidateEvaluation {
  shouldCreateCandidate: boolean
  qualityScore: number
  promotionReasons: SFXLibraryPromotionReason[]
  rejectionReasons: string[]
  generalPurpose: boolean
}

export function createSFXLibraryCandidateReason(evaluation: SFXLibraryCandidateEvaluation): string {
  if (!evaluation.shouldCreateCandidate) {
    return `Not a library candidate: ${evaluation.rejectionReasons.join(', ') || 'project-only by default'}.`
  }

  return `Reusable SFX candidate because ${evaluation.promotionReasons.map((reason) => reason.replaceAll('_', ' ')).join(', ')}.`
}

export function evaluateSFXLibraryCandidate(input: {
  request: ProcessGeneratedSFXForLibraryGrowthRequest
  provenanceReview?: SFXProvenanceReviewRecord
  libraryDecision: SFXLibraryDecision
  generalPurpose: boolean
}): SFXLibraryCandidateEvaluation {
  const qaReport = input.request.sfxQAReport
  const qualityScore = qaReport?.overallScore ?? 0
  const promotionReasons: SFXLibraryPromotionReason[] = []
  const rejectionReasons: string[] = []

  if (!qaReport || qaReport.status === 'failed' || qaReport.recommendedAction === 'remove_sfx') {
    rejectionReasons.push('QA did not approve project use')
  } else {
    promotionReasons.push('qa_passed')
  }
  if (qualityScore >= 85) promotionReasons.push('high_quality')
  else rejectionReasons.push('quality score below candidate threshold')

  if (input.generalPurpose) promotionReasons.push('general_purpose_sound')
  else rejectionReasons.push('sound is too private, client-specific, or project-specific')

  if (input.request.sfxTimingAlignment) promotionReasons.push('good_timing_metadata')
  else rejectionReasons.push('missing timing metadata')

  if (input.request.sfxTrimPlan && !input.request.sfxTrimPlan.requiresManualReview) promotionReasons.push('clean_trim')
  else rejectionReasons.push('trim needs review')

  if (input.request.sfxMixPlan?.duckUnderVoice || !input.request.sfxMixPlan?.voicePresent) promotionReasons.push('safe_under_voice')
  if (input.request.sfxEventPlan.videoTone.includes('premium') || input.request.sfxEventPlan.videoTone.includes('luxury')) {
    promotionReasons.push('premium_style')
  }
  if (input.provenanceReview?.riskLevel === 'low') promotionReasons.push('low_reuse_risk')
  if (input.request.sfxEventPlan.targetLayer !== 'source_footage_repair' && input.request.sfxEventPlan.targetLayer !== 'none') {
    promotionReasons.push('useful_for_common_edit_layer')
  }

  const shouldCreateCandidate = (
    input.libraryDecision === 'candidate_for_library' ||
    input.libraryDecision === 'requires_terms_review' ||
    input.libraryDecision === 'approved_internal_library'
  ) && rejectionReasons.length === 0

  return {
    shouldCreateCandidate,
    qualityScore,
    promotionReasons: Array.from(new Set(promotionReasons)),
    rejectionReasons: Array.from(new Set(rejectionReasons)),
    generalPurpose: input.generalPurpose,
  }
}

export function createSFXLibraryCandidate(
  db: MockDatabase,
  input: {
    request: ProcessGeneratedSFXForLibraryGrowthRequest
    provenanceReview?: SFXProvenanceReviewRecord
    libraryDecision: SFXLibraryDecision
    generalPurpose: boolean
  },
): SFXLibraryCandidateRecord | undefined {
  if (!input.request.sfxGeneratedAsset) return undefined

  const evaluation = evaluateSFXLibraryCandidate(input)
  if (!evaluation.shouldCreateCandidate && input.libraryDecision !== 'approved_internal_library') return undefined

  const candidate = insertMockRecord(db, 'sfxLibraryCandidates', {
    id: createMockId('sfx-library-candidate'),
    projectId: input.request.projectId,
    workspaceId: input.request.workspaceId,
    sfxGeneratedAssetId: input.request.sfxGeneratedAsset.id,
    sfxEventPlanId: input.request.sfxEventPlan.id,
    reuseStatus: input.libraryDecision === 'approved_internal_library' ? 'approved_internal_library' : 'candidate_for_library',
    candidateReason: createSFXLibraryCandidateReason(evaluation),
    qualityScore: evaluation.qualityScore,
    targetLayer: input.request.sfxEventPlan.targetLayer,
    useCase: input.request.sfxEventPlan.useCase,
    provider: input.request.sfxGeneratedAsset.provider,
    modelName: input.request.sfxGeneratedAsset.modelName,
    generalPurpose: evaluation.generalPurpose,
    containsPrivateContext: false,
    licenseReviewRequired: input.provenanceReview?.termsReviewRequired ?? true,
    licenseScope: input.request.sfxGeneratedAsset.licenseScope,
    approvedBy: input.libraryDecision === 'approved_internal_library' ? 'mock-library-reviewer' : undefined,
    approvedAt: input.libraryDecision === 'approved_internal_library' ? nowIso() : undefined,
    tags: createSFXLibraryCandidateTags({
      eventPlan: input.request.sfxEventPlan,
      promptPlan: input.request.sfxPromptPlan,
      trimPlan: input.request.sfxTrimPlan,
      mixPlan: input.request.sfxMixPlan,
      qaReport: input.request.sfxQAReport,
    }),
    recommendedUseCases: [input.request.sfxEventPlan.useCase],
    avoidUseCases: [],
    notes: [
      'Mock library candidate only; no real library promotion occurred.',
      ...createSFXLibraryAvoidTags(input.request.sfxEventPlan).map((tag) => `Avoid tag: ${tag}`),
    ],
    createdAt: nowIso(),
    updatedAt: nowIso(),
    metadata: { mockOnly: true, noLibraryPromotion: true },
  })

  return candidate
}

export function approveSFXLibraryCandidateMock(candidate: SFXLibraryCandidateRecord): SFXLibraryCandidateRecord {
  return {
    ...candidate,
    reuseStatus: 'approved_internal_library',
    approvedBy: candidate.approvedBy ?? 'mock-library-reviewer',
    approvedAt: candidate.approvedAt ?? nowIso(),
    updatedAt: nowIso(),
    notes: [...candidate.notes, 'Mock approval only; no production library asset was created.'],
  }
}

export function rejectSFXLibraryCandidateMock(candidate: SFXLibraryCandidateRecord, reason = 'Mock reviewer rejected candidate.'): SFXLibraryCandidateRecord {
  return {
    ...candidate,
    reuseStatus: 'blocked_from_reuse',
    updatedAt: nowIso(),
    notes: [...candidate.notes, reason],
  }
}

export function createSFXLibraryCandidateSummary(candidate?: SFXLibraryCandidateRecord): string[] {
  if (!candidate) return ['No SFX library candidate was created.']

  return [
    `Library candidate status: ${candidate.reuseStatus}.`,
    `Quality score: ${candidate.qualityScore}.`,
    candidate.licenseReviewRequired ? 'License/provenance review is still required.' : 'Mock provenance is approved for this scenario.',
  ]
}
