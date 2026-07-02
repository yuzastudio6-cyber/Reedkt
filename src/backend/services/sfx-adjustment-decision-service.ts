import type {
  SFXAdjustmentDecisionRecord,
  SFXAdjustmentType,
  SFXQAIssue,
  SFXQAIssueType,
  SFXQAReportRecord,
  SFXQARecommendedAction,
} from '../../types'
import type { RunSFXQARequest } from '../contracts/sfx-director-contracts'
import type { MockDatabase } from '../mock/mock-database'
import { createMockId, insertMockRecord, nowIso } from '../mock/mock-database'

type AdjustmentInput = RunSFXQARequest & {
  qaReport: SFXQAReportRecord
}

const unfixableIssueTypes: SFXQAIssueType[] = [
  'wrong_style',
  'sounds_cheap',
  'cartoonish_when_should_be_premium',
  'audio_artifact',
  'does_not_match_edit_layer',
  'does_not_match_user_instruction',
  'provider_output_low_quality',
  'not_needed',
]

function unique<T>(items: T[]): T[] {
  return Array.from(new Set(items))
}

function adjustmentTypeForIssue(issue: SFXQAIssue): SFXAdjustmentType | undefined {
  if (issue.issueType === 'late_hit' || issue.issueType === 'early_hit' || issue.issueType === 'bad_hit_alignment') {
    return 'timing_alignment_adjustment'
  }
  if (issue.issueType === 'bad_trim' || issue.issueType === 'tail_too_long') return 'trim_adjustment'
  if (issue.issueType === 'too_loud' || issue.issueType === 'too_quiet') return 'volume_adjustment'
  if (issue.issueType === 'fights_voice' || issue.issueType === 'fights_music') return 'ducking_adjustment'
  if (issue.issueType === 'other' && /reverb|room|ambience/i.test(issue.description)) {
    return 'reverb_room_match_adjustment'
  }

  return undefined
}

export function createSFXTrimAdjustmentDecision(issue: SFXQAIssue): SFXAdjustmentType | undefined {
  return issue.issueType === 'bad_trim' || issue.issueType === 'tail_too_long'
    ? 'trim_adjustment'
    : undefined
}

export function createSFXVolumeAdjustmentDecision(issue: SFXQAIssue): SFXAdjustmentType | undefined {
  return issue.issueType === 'too_loud' || issue.issueType === 'too_quiet'
    ? 'volume_adjustment'
    : undefined
}

export function createSFXDuckingAdjustmentDecision(issue: SFXQAIssue): SFXAdjustmentType | undefined {
  return issue.issueType === 'fights_voice' || issue.issueType === 'fights_music'
    ? 'ducking_adjustment'
    : undefined
}

export function createSFXFadeAdjustmentDecision(input: AdjustmentInput): SFXAdjustmentType | undefined {
  const fadeIn = input.sfxMixPlan?.fadeInMs ?? input.sfxTrimPlan?.fadeInMs
  const fadeOut = input.sfxMixPlan?.fadeOutMs ?? input.sfxTrimPlan?.fadeOutMs

  if (fadeIn !== undefined && fadeIn < 8) return 'fade_adjustment'
  if (fadeOut !== undefined && fadeOut < 50) return 'fade_adjustment'
  if (fadeOut !== undefined && fadeOut > 900 && input.sfxEventPlan.targetLayer !== 'ambient_bridge') return 'fade_adjustment'

  return undefined
}

export function createSFXEQAdjustmentDecision(input: AdjustmentInput): SFXAdjustmentType | undefined {
  const text = [
    input.mockOutputSummary,
    input.sfxMixPlan?.eqNotes.join(' '),
    input.sfxPromptPlan?.prompt,
  ].join(' ').toLowerCase()

  return /harsh|scratchy|sharp high|midrange masking/.test(text) ? 'eq_adjustment' : undefined
}

export function createSFXTimingAdjustmentDecision(issue: SFXQAIssue): SFXAdjustmentType | undefined {
  return issue.issueType === 'late_hit' || issue.issueType === 'early_hit' || issue.issueType === 'bad_hit_alignment'
    ? 'timing_alignment_adjustment'
    : undefined
}

export function createSFXAdjustmentSummary(params: {
  adjustmentTypes: SFXAdjustmentType[]
  recommendedAction: SFXQARecommendedAction
  canUseWithoutRegeneration: boolean
}): string {
  if (params.adjustmentTypes.length === 0) {
    return params.recommendedAction === 'remove_sfx'
      ? 'This SFX should be removed instead of adjusted.'
      : 'No local trim, timing, or mix adjustment is recommended.'
  }

  const adjustmentText = params.adjustmentTypes.map((type) => type.replaceAll('_', ' ')).join(', ')
  const suffix = params.canUseWithoutRegeneration
    ? 'This can be handled without regenerating the sound.'
    : 'Adjustment may help, but the sound still needs regeneration or review.'

  return `Recommended SFX adjustment: ${adjustmentText}. ${suffix}`
}

export function decideIfSFXCanBeAdjusted(
  db: MockDatabase,
  input: AdjustmentInput,
): SFXAdjustmentDecisionRecord {
  const issueTypes = input.qaReport.issues.map((issue) => issue.issueType)
  const adjustmentTypes = unique([
    ...input.qaReport.issues.map(adjustmentTypeForIssue).filter((type): type is SFXAdjustmentType => Boolean(type)),
    createSFXFadeAdjustmentDecision(input),
    createSFXEQAdjustmentDecision(input),
  ].filter((type): type is SFXAdjustmentType => Boolean(type)))

  const hasUnfixableIssue = issueTypes.some((issueType) => unfixableIssueTypes.includes(issueType))
  const canUseWithoutRegeneration = adjustmentTypes.length > 0 &&
    !hasUnfixableIssue &&
    input.qaReport.recommendedAction !== 'regenerate' &&
    input.qaReport.recommendedAction !== 'remove_sfx'

  const recommendedAction: SFXQARecommendedAction = canUseWithoutRegeneration
    ? input.qaReport.recommendedAction
    : input.qaReport.recommendedAction === 'lower_volume' || input.qaReport.recommendedAction === 'trim_again'
      ? input.qaReport.recommendedAction
      : hasUnfixableIssue
        ? input.qaReport.recommendedAction
        : adjustmentTypes.length > 0
          ? 'use_with_mix_adjustment'
          : input.qaReport.recommendedAction

  return insertMockRecord(db, 'sfxAdjustmentDecisions', {
    id: createMockId('sfx-adjustment-decision'),
    projectId: input.sfxEventPlan.projectId,
    editPlanId: input.sfxEventPlan.editPlanId,
    sfxEventPlanId: input.sfxEventPlan.id,
    sfxQAReportId: input.qaReport.id,
    adjustmentTypes,
    recommendedAction,
    adjustmentSummary: createSFXAdjustmentSummary({
      adjustmentTypes,
      recommendedAction,
      canUseWithoutRegeneration,
    }),
    canUseWithoutRegeneration,
    notes: [
      'Mock adjustment decision only; no audio was processed.',
      hasUnfixableIssue ? 'One or more issues are concept/style/policy problems and may need regeneration or removal.' : 'Adjustment-only path is available when issues are timing or mix related.',
    ],
    createdAt: nowIso(),
    updatedAt: nowIso(),
    metadata: { mockOnly: true, noAudioProcessing: true },
  })
}
