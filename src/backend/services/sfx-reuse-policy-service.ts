import type {
  SFXLibraryBlockReason,
  SFXLibraryDecision,
  SFXProvenanceReviewRecord,
  SFXQAReportRecord,
  SFXReuseRisk,
  SFXReuseStatus,
} from '../../types'
import type { ProcessGeneratedSFXForLibraryGrowthRequest } from '../contracts/sfx-director-contracts'

function context(input: ProcessGeneratedSFXForLibraryGrowthRequest): string {
  return [
    input.sfxEventPlan.sceneContext,
    input.sfxEventPlan.videoTone,
    ...(input.privacyContext ?? []),
    ...(input.provenanceNotes ?? []),
    input.sfxPromptPlan?.prompt,
  ].join(' ').toLowerCase()
}

export function detectPrivateSFXContext(input: ProcessGeneratedSFXForLibraryGrowthRequest): boolean {
  return /private|confidential|wedding|family|personal|internal meeting|private event/.test(context(input))
}

export function detectClientSpecificSFXContext(input: ProcessGeneratedSFXForLibraryGrowthRequest): boolean {
  return /client|customer|project-specific|campaign-specific|product-specific/.test(context(input))
}

export function detectBrandSpecificSFXContext(input: ProcessGeneratedSFXForLibraryGrowthRequest): boolean {
  return /brand|branded|sonic logo|custom brand|company intro/.test(context(input))
}

export function detectReferenceCopyRisk(input: ProcessGeneratedSFXForLibraryGrowthRequest): boolean {
  return /reference copy|copyright|restricted|licensed reference|match this song|soundalike/.test(context(input))
}

export function createSFXReuseRiskAssessment(input: ProcessGeneratedSFXForLibraryGrowthRequest): {
  risks: SFXReuseRisk[]
  blockReasons: SFXLibraryBlockReason[]
  generalPurpose: boolean
} {
  const risks: SFXReuseRisk[] = []
  const blockReasons: SFXLibraryBlockReason[] = []

  if (detectPrivateSFXContext(input)) {
    risks.push('privacy_risk')
    blockReasons.push('private_context')
  }
  if (/voice|identity|name-specific/.test(context(input))) {
    risks.push('privacy_risk')
    blockReasons.push('user_voice_or_identity')
  }
  if (detectClientSpecificSFXContext(input)) {
    risks.push('client_specific_risk')
    blockReasons.push('client_specific')
  }
  if (detectBrandSpecificSFXContext(input)) {
    risks.push('client_specific_risk')
    blockReasons.push('brand_specific')
  }
  if (detectReferenceCopyRisk(input)) {
    risks.push('reference_copy_risk')
    blockReasons.push('reference_copy_risk')
  }
  if (input.sfxQAReport?.status === 'failed' || input.sfxQAReport?.recommendedAction === 'remove_sfx') {
    risks.push('high')
    blockReasons.push('qa_failed')
  }
  if (!input.sfxGeneratedAsset?.licenseProvenanceId && !input.providerTermsKnown) {
    risks.push('license_risk')
    blockReasons.push('license_provenance_missing')
  }

  const generalPurpose = !blockReasons.some((reason) =>
    ['private_context', 'client_specific', 'brand_specific', 'user_voice_or_identity', 'reference_copy_risk'].includes(reason),
  ) && !/specific|one-off|only this project/.test(context(input))

  if (!generalPurpose) blockReasons.push('not_general_purpose')
  if (risks.length === 0) risks.push('low')

  return {
    risks: Array.from(new Set(risks)),
    blockReasons: Array.from(new Set(blockReasons)),
    generalPurpose,
  }
}

export function decideSFXReuseStatus(input: {
  request: ProcessGeneratedSFXForLibraryGrowthRequest
  provenanceReview?: SFXProvenanceReviewRecord
  qaReport?: SFXQAReportRecord
  qualityScore?: number
  simulateMockApproval?: boolean
}): {
  libraryDecision: SFXLibraryDecision
  reuseStatus: SFXReuseStatus
  risks: SFXReuseRisk[]
  blockReasons: SFXLibraryBlockReason[]
  generalPurpose: boolean
} {
  const riskAssessment = createSFXReuseRiskAssessment(input.request)
  const qaReport = input.qaReport ?? input.request.sfxQAReport
  const score = input.qualityScore ?? qaReport?.overallScore ?? 0

  if (riskAssessment.blockReasons.includes('qa_failed') || qaReport?.status === 'failed') {
    return { ...riskAssessment, libraryDecision: 'blocked_from_reuse', reuseStatus: 'blocked_from_reuse' }
  }
  if (riskAssessment.blockReasons.includes('private_context') || riskAssessment.blockReasons.includes('user_voice_or_identity')) {
    return { ...riskAssessment, libraryDecision: 'blocked_from_reuse', reuseStatus: 'blocked_from_reuse' }
  }
  if (riskAssessment.blockReasons.includes('reference_copy_risk')) {
    return { ...riskAssessment, libraryDecision: 'blocked_from_reuse', reuseStatus: 'blocked_from_reuse' }
  }
  if (riskAssessment.blockReasons.includes('client_specific') || riskAssessment.blockReasons.includes('brand_specific')) {
    return { ...riskAssessment, libraryDecision: 'workspace_only', reuseStatus: 'workspace_only' }
  }
  if (!qaReport || qaReport.recommendedAction === 'remove_sfx') {
    return { ...riskAssessment, libraryDecision: 'project_only', reuseStatus: 'project_generated' }
  }
  if (input.provenanceReview?.termsReviewRequired) {
    return { ...riskAssessment, libraryDecision: 'requires_terms_review', reuseStatus: 'requires_terms_review' }
  }
  if (input.simulateMockApproval && score >= 90 && riskAssessment.generalPurpose && input.provenanceReview?.reuseAcrossUsersAllowed) {
    return { ...riskAssessment, libraryDecision: 'approved_internal_library', reuseStatus: 'approved_internal_library' }
  }
  if (score >= 85 && riskAssessment.generalPurpose) {
    return { ...riskAssessment, libraryDecision: 'candidate_for_library', reuseStatus: 'candidate_for_library' }
  }

  return { ...riskAssessment, libraryDecision: 'project_only', reuseStatus: 'approved_for_project' }
}

export function createSFXReusePolicySummary(params: ReturnType<typeof decideSFXReuseStatus>): string[] {
  if (params.libraryDecision === 'approved_internal_library') return ['Mock approval allows this SFX into the internal library.']
  if (params.libraryDecision === 'candidate_for_library') return ['This SFX is a safe reusable library candidate after QA.']
  if (params.libraryDecision === 'workspace_only') return ['This SFX should stay workspace-only because it is client or brand specific.']
  if (params.libraryDecision === 'blocked_from_reuse') return [`Reuse is blocked: ${params.blockReasons.join(', ')}.`]
  if (params.libraryDecision === 'requires_terms_review') return ['Reuse requires provider/license terms review before global library use.']

  return ['This SFX is approved for project use only.']
}
