import type {
  SFXQARecommendedAction,
  SFXQAReportRecord,
  SFXQAStatus,
  SFXQAIssue,
} from '../../types'
import type {
  CreateSFXQAReportResponse,
  RunSFXQARequest,
  RunSFXQAResponse,
} from '../contracts/sfx-director-contracts'
import type { MockDatabase } from '../mock/mock-database'
import { createMockId, insertMockRecord, nowIso } from '../mock/mock-database'
import { ok, type ServiceResult } from '../service-result'
import { decideIfSFXCanBeAdjusted } from './sfx-adjustment-decision-service'
import { createSFXQAChatSummary } from './sfx-qa-chat-summary-service'
import { createSFXQAIssues } from './sfx-qa-issue-service'
import { createSFXScoreSummary } from './sfx-qa-scoring-service'
import { decideIfSFXShouldRegenerate } from './sfx-regeneration-decision-service'
import { decideIfSFXShouldUseLibraryReplacement } from './sfx-replacement-decision-service'

export function determineSFXQAStatus(params: {
  overallScore: number
  issues: SFXQAIssue[]
  eventDecisionState: RunSFXQARequest['sfxEventPlan']['decisionState']
}): SFXQAStatus {
  if (params.eventDecisionState === 'avoid' || params.eventDecisionState === 'not_needed') return 'remove_sfx'
  if (params.issues.some((issue) => issue.blocksUse || issue.severity === 'critical')) return 'failed'
  if (params.overallScore >= 90) return 'passed'
  if (params.overallScore >= 70) return 'warning'
  if (params.overallScore >= 50) return 'requires_mix_adjustment'
  return 'failed'
}

export function determineSFXQARecommendedAction(params: {
  overallScore: number
  issues: SFXQAIssue[]
  eventDecisionState: RunSFXQARequest['sfxEventPlan']['decisionState']
}): SFXQARecommendedAction {
  const issueTypes = params.issues.map((issue) => issue.issueType)

  if (params.eventDecisionState === 'avoid' || params.eventDecisionState === 'not_needed') return 'remove_sfx'
  if (issueTypes.includes('does_not_match_edit_layer') || issueTypes.includes('not_needed')) return 'remove_sfx'
  if (issueTypes.includes('audio_artifact') || issueTypes.includes('wrong_style') || issueTypes.includes('cartoonish_when_should_be_premium')) {
    return 'regenerate'
  }
  if (issueTypes.includes('late_hit') || issueTypes.includes('early_hit') || issueTypes.includes('bad_trim') || issueTypes.includes('tail_too_long')) {
    return 'trim_again'
  }
  if (issueTypes.includes('too_loud') || issueTypes.includes('too_quiet') || issueTypes.includes('fights_voice') || issueTypes.includes('fights_music')) {
    return issueTypes.includes('too_loud') ? 'lower_volume' : 'use_with_mix_adjustment'
  }
  if (params.overallScore >= 90) return 'use'
  if (params.overallScore >= 70) return 'use_with_mix_adjustment'
  if (params.overallScore >= 50) return 'regenerate'

  return 'remove_sfx'
}

export function createSFXQAWarnings(input: RunSFXQARequest, issues: SFXQAIssue[]): string[] {
  const warnings: string[] = []

  if (input.sfxEventPlan.decisionState === 'needed' && !input.sfxTimingAlignment) {
    warnings.push('Needed SFX is missing timing alignment.')
  }
  if (input.sfxEventPlan.decisionState === 'needed' && !input.sfxMixPlan) {
    warnings.push('Needed SFX is missing mix planning.')
  }
  if (issues.length > 0) warnings.push(`${issues.length} SFX QA issue${issues.length === 1 ? '' : 's'} found.`)
  warnings.push('RP-SFX-08 is mock QA only; no real audio was analyzed or rendered.')

  return warnings
}

export function createSFXQAReportFromPlans(input: RunSFXQARequest): SFXQAReportRecord {
  const scoreSummary = createSFXScoreSummary(input)
  const issues = createSFXQAIssues(input)
  const recommendedAction = determineSFXQARecommendedAction({
    overallScore: scoreSummary.overallScore,
    issues,
    eventDecisionState: input.sfxEventPlan.decisionState,
  })
  const status = determineSFXQAStatus({
    overallScore: scoreSummary.overallScore,
    issues,
    eventDecisionState: input.sfxEventPlan.decisionState,
  })
  const requiresTrimAdjustment = issues.some((issue) =>
    ['late_hit', 'early_hit', 'bad_trim', 'tail_too_long', 'bad_hit_alignment'].includes(issue.issueType),
  )
  const requiresMixAdjustment = issues.some((issue) =>
    ['too_loud', 'too_quiet', 'fights_voice', 'fights_music'].includes(issue.issueType),
  )
  const requiresRegeneration = recommendedAction === 'regenerate'

  return {
    id: createMockId('sfx-qa-report'),
    projectId: input.sfxEventPlan.projectId,
    editPlanId: input.sfxEventPlan.editPlanId,
    sfxEventPlanId: input.sfxEventPlan.id,
    sfxGeneratedAssetId: input.sfxGeneratedAsset?.id,
    sfxTrimPlanId: input.sfxTrimPlan?.id,
    sfxTimingAlignmentId: input.sfxTimingAlignment?.id,
    sfxMixPlanId: input.sfxMixPlan?.id,
    status,
    overallScore: scoreSummary.overallScore,
    timingScore: scoreSummary.timingScore,
    volumeScore: scoreSummary.volumeScore,
    styleFitScore: scoreSummary.styleFitScore,
    voiceSafetyScore: scoreSummary.voiceSafetyScore,
    musicFitScore: scoreSummary.musicFitScore,
    artifactScore: scoreSummary.artifactScore,
    issues,
    recommendedAction,
    approvedForProject: status === 'passed' || (status === 'warning' && recommendedAction === 'use_with_mix_adjustment'),
    approvedForLibraryCandidate: status === 'passed' && scoreSummary.overallScore >= 92 && issues.length === 0,
    requiresRegeneration,
    requiresTrimAdjustment,
    requiresMixAdjustment,
    notes: [
      ...scoreSummary.summary,
      ...createSFXQAWarnings(input, issues),
    ],
    createdAt: nowIso(),
    updatedAt: nowIso(),
    metadata: { mockOnly: true, noAudioProcessing: true },
  }
}

export function createSFXQAReport(
  db: MockDatabase,
  input: RunSFXQARequest,
): ServiceResult<CreateSFXQAReportResponse> {
  return ok({
    sfxQAReport: insertMockRecord(db, 'sfxQAReports', createSFXQAReportFromPlans(input)),
  })
}

function nextStepForAction(action: SFXQARecommendedAction): RunSFXQAResponse['nextStep'] {
  if (action === 'use') return 'use_sfx'
  if (action === 'use_with_mix_adjustment' || action === 'trim_again' || action === 'lower_volume') return 'adjust_sfx'
  if (action === 'regenerate' || action === 'replace_with_library') return 'regenerate_sfx'
  if (action === 'remove_sfx') return 'remove_sfx'
  return 'ask_user'
}

export function runSFXQA(
  db: MockDatabase,
  input: RunSFXQARequest,
): ServiceResult<RunSFXQAResponse> {
  const qaReport = insertMockRecord(db, 'sfxQAReports', createSFXQAReportFromPlans(input))
  const regenerationDecision = decideIfSFXShouldRegenerate(db, { ...input, qaReport })
  const adjustmentDecision = decideIfSFXCanBeAdjusted(db, { ...input, qaReport })
  const replacementDecision = decideIfSFXShouldUseLibraryReplacement(db, { ...input, qaReport })

  return ok({
    qaReport,
    qaIssues: qaReport.issues,
    recommendedAction: qaReport.recommendedAction,
    regenerationDecision,
    adjustmentDecision,
    replacementDecision,
    chatSummary: createSFXQAChatSummary({
      qaReport,
      regenerationDecision,
      adjustmentDecision,
      replacementDecision,
      eventPlan: input.sfxEventPlan,
    }),
    nextStep: nextStepForAction(qaReport.recommendedAction),
    warnings: createSFXQAWarnings(input, qaReport.issues),
  })
}

export function createSFXQAReportSummary(report: SFXQAReportRecord): string[] {
  return [
    `SFX QA status: ${report.status}.`,
    `Overall score: ${report.overallScore}.`,
    `Recommended action: ${report.recommendedAction}.`,
    report.issues.length > 0 ? `${report.issues.length} issue(s) require attention.` : 'No SFX QA issues found.',
  ]
}
