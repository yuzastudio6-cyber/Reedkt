import type {
  SFXProvider,
  SFXQAIssue,
  SFXQAIssueType,
  SFXQAReportRecord,
  SFXRegenerationDecisionRecord,
  SFXRegenerationReason,
} from '../../types'
import type { RunSFXQARequest } from '../contracts/sfx-director-contracts'
import type { MockDatabase } from '../mock/mock-database'
import { createMockId, insertMockRecord, nowIso } from '../mock/mock-database'
import { isMMAudioProviderKey } from '../providers/sfx/sfx-provider-contracts'

type RegenerationInput = RunSFXQARequest & {
  qaReport: SFXQAReportRecord
}

export function createSFXRegenerationReason(issue: SFXQAIssue): SFXRegenerationReason {
  if (issue.issueType === 'too_loud') return 'too_loud'
  if (issue.issueType === 'too_quiet') return 'too_quiet'
  if (issue.issueType === 'wrong_style') return 'wrong_style'
  if (issue.issueType === 'cartoonish_when_should_be_premium') return 'too_cartoonish'
  if (issue.issueType === 'bad_hit_alignment' || issue.issueType === 'late_hit' || issue.issueType === 'early_hit') return 'bad_hit_timing'
  if (issue.issueType === 'bad_trim') return 'bad_trim'
  if (issue.issueType === 'tail_too_long') return 'tail_too_long'
  if (issue.issueType === 'audio_artifact') return 'audio_artifact'
  if (issue.issueType === 'fights_music') return 'fights_music'
  if (issue.issueType === 'fights_voice') return 'not_speech_safe'
  if (issue.issueType === 'does_not_match_edit_layer') return 'source_policy_conflict'
  if (issue.issueType === 'does_not_match_user_instruction') return 'user_instruction_conflict'
  if (issue.issueType === 'provider_output_low_quality') return 'provider_output_low_quality'
  if (issue.issueType === 'license_or_provenance_missing') return 'license_provenance_missing'
  return 'wrong_style'
}

export function createSFXRegenerationPromptAdjustment(reasons: SFXRegenerationReason[]): string {
  const adjustments: Record<SFXRegenerationReason, string> = {
    audio_artifact: 'remove artifacts and generate cleaner texture',
    bad_hit_timing: 'create a cleaner transient that is easier to align',
    bad_trim: 'generate cleaner start, hit, and tail regions',
    fights_ambience: 'make it more ambience-aware and room-matched',
    fights_music: 'reduce energy and avoid clashing with the music bed',
    license_provenance_missing: 'use project-safe provenance and keep output project-only',
    not_premium_enough: 'make it softer, premium, elegant, and subtle',
    not_speech_safe: 'make it safer under speech with lower intensity',
    provider_output_low_quality: 'use a cleaner higher-quality output',
    source_policy_conflict: 'remove source-action foley and keep SFX tied to the edit layer',
    tail_too_long: 'shorter cleaner tail',
    too_cartoonish: 'remove cartoon tone and use a premium professional sound',
    too_loud: 'make it softer and lower impact',
    too_quiet: 'make it clearer while staying subtle',
    user_instruction_conflict: 'follow explicit user instructions first',
    wrong_energy: 'reduce energy and avoid hype',
    wrong_style: 'match the edit tone more closely',
  }

  return reasons.length > 0
    ? Array.from(new Set(reasons)).map((reason) => adjustments[reason]).join('; ')
    : 'No regeneration needed.'
}

export function createSFXProviderSwitchRecommendation(input: RegenerationInput): SFXProvider {
  if (input.qaReport.recommendedAction === 'remove_sfx') return 'no_sfx'
  if (isMMAudioProviderKey(input.sfxProviderRoute?.recommendedProvider) && input.qaReport.recommendedAction === 'regenerate') {
    return 'mirelo_sfx_v1_5'
  }
  if (input.qaReport.recommendedAction === 'replace_with_library') return 'reeditpro_internal_library'

  return input.sfxProviderRoute?.recommendedProvider ?? input.sfxPromptPlan?.provider ?? 'mirelo_sfx_v1_5'
}

export function createSFXLowerCostAlternative(reasons: SFXRegenerationReason[]): string | undefined {
  if (reasons.includes('not_speech_safe') || reasons.includes('too_loud')) {
    return 'Use no SFX or a lower-volume internal library cue for this speech-heavy moment.'
  }
  if (reasons.includes('wrong_style') || reasons.includes('too_cartoonish')) {
    return 'Search the future approved internal library before regenerating.'
  }
  if (reasons.includes('source_policy_conflict')) {
    return 'Remove SFX unless the user explicitly approves full sound design.'
  }

  return undefined
}

export function createSFXUserFacingRegenerationSummary(params: {
  shouldRegenerate: boolean
  reasons: SFXRegenerationReason[]
}): string {
  if (!params.shouldRegenerate) return 'This SFX does not need regeneration.'

  return `I recommend regenerating because of ${params.reasons.map((reason) => reason.replaceAll('_', ' ')).join(', ')}.`
}

export function decideIfSFXShouldRegenerate(
  db: MockDatabase,
  input: RegenerationInput,
): SFXRegenerationDecisionRecord {
  const hardIssueTypes: SFXQAIssueType[] = [
    'wrong_style',
    'cartoonish_when_should_be_premium',
    'audio_artifact',
    'provider_output_low_quality',
    'does_not_match_user_instruction',
  ]
  const reasons = Array.from(new Set(
    input.qaReport.issues
      .filter((issue) => hardIssueTypes.includes(issue.issueType) || issue.severity === 'critical')
      .map(createSFXRegenerationReason),
  ))
  const shouldRegenerate = input.qaReport.recommendedAction === 'regenerate' ||
    reasons.some((reason) =>
      !['source_policy_conflict', 'too_loud', 'too_quiet', 'bad_hit_timing', 'bad_trim', 'tail_too_long'].includes(reason),
    )
  const providerRecommendation = createSFXProviderSwitchRecommendation(input)
  const userFacingSummary = createSFXUserFacingRegenerationSummary({ shouldRegenerate, reasons })

  return insertMockRecord(db, 'sfxRegenerationDecisions', {
    id: createMockId('sfx-regeneration-decision'),
    projectId: input.sfxEventPlan.projectId,
    editPlanId: input.sfxEventPlan.editPlanId,
    sfxEventPlanId: input.sfxEventPlan.id,
    sfxGeneratedAssetId: input.sfxGeneratedAsset?.id,
    sfxQAReportId: input.qaReport.id,
    shouldRegenerate,
    reasons,
    recommendedAction: shouldRegenerate ? 'regenerate' : input.qaReport.recommendedAction,
    issueTypes: input.qaReport.issues.map((issue) => issue.issueType),
    providerRouteId: input.sfxProviderRoute?.id,
    preferredProvider: providerRecommendation,
    providerRecommendation,
    promptAdjustment: createSFXRegenerationPromptAdjustment(reasons),
    lowerCostAlternative: createSFXLowerCostAlternative(reasons),
    requiresNewApproval: shouldRegenerate,
    userFacingSummary,
    userVisibleSummary: userFacingSummary,
    notes: ['Mock regeneration decision only; no provider call is made.'],
    createdAt: nowIso(),
    updatedAt: nowIso(),
    metadata: { mockOnly: true, noProviderCall: true },
  })
}
