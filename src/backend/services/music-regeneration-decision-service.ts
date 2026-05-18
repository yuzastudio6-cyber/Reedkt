import type {
  MusicMixPlanRecord,
  MusicQAIssueRecord,
  MusicQAReportRecord,
  MusicRegenerationDecisionRecord,
  MusicRegenerationReason,
  MusicTrackAnalysisRecord,
} from '../../types/audio-music'
import { createMockId, nowIso } from '../mock/mock-database'

export function createRegenerationReason(issue: MusicQAIssueRecord): MusicRegenerationReason {
  if (issue.category === 'lyrics_policy') return 'unwanted_vocals'
  if (issue.category === 'speech_safety') return 'not_speech_safe'
  if (issue.category === 'mood_fit') return 'wrong_mood'
  if (issue.category === 'energy_fit') return 'wrong_energy'
  if (issue.category === 'culture_fit') return 'wrong_culture_context'
  if (issue.category === 'reference_dna_fit') return 'reference_dna_mismatch'
  if (issue.category === 'user_instruction_fit') return 'user_instruction_conflict'
  if (issue.category === 'loop_ending_quality' && /loop/i.test(issue.message)) return 'bad_loop'
  if (issue.category === 'loop_ending_quality') return 'bad_ending'
  if (issue.category === 'artifact_quality') return 'audio_artifacts'
  if (issue.category === 'license_provenance') return 'license_provenance_missing'
  return 'too_generic'
}

export function createRegenerationPromptAdjustment(reasons: MusicRegenerationReason[]) {
  const adjustments: Record<MusicRegenerationReason, string> = {
    audio_artifacts: 'cleaner generation with fewer artifacts',
    bad_ending: 'cleaner ending with a soft resolve',
    bad_loop: 'clean loop point or avoid looping',
    license_provenance_missing: 'use known project-safe provenance',
    not_speech_safe: 'voice-first instrumental mix',
    reference_dna_mismatch: 'align with safe reference DNA mood, cue role, and ambience strategy',
    too_generic: 'more specific professional mood and instrumentation',
    unwanted_vocals: 'instrumental-only, no vocals, no lyrics',
    user_instruction_conflict: 'follow explicit user instructions first',
    wrong_culture_context: 'culture-aware style without stereotypes or copied references',
    wrong_energy: 'lower energy and simpler rhythm',
    wrong_mood: 'closer mood match to the cue',
  }

  return reasons.length > 0
    ? Array.from(new Set(reasons)).map((reason) => adjustments[reason]).join('; ')
    : 'no regeneration needed'
}

export function createLowerCostAlternative(reasons: MusicRegenerationReason[]) {
  if (reasons.includes('not_speech_safe') || reasons.includes('unwanted_vocals')) {
    return 'Use ambience only or a quiet instrumental library bed for this dialogue section.'
  }

  if (reasons.includes('wrong_energy') || reasons.includes('wrong_mood')) {
    return 'Use a simpler lower-compute library-style cue with mix adjustments.'
  }

  return undefined
}

export function createUserFacingRegenerationSummary(params: {
  shouldRegenerate: boolean
  reasons: MusicRegenerationReason[]
}) {
  if (!params.shouldRegenerate) {
    return 'The music can be used with the planned mix settings.'
  }

  return `I recommend regenerating because of ${params.reasons.map((reason) => reason.replaceAll('_', ' ')).join(', ')}.`
}

export function decideIfMusicShouldRegenerate(input: {
  qaReport: MusicQAReportRecord
  analysis?: MusicTrackAnalysisRecord
  mixPlan?: MusicMixPlanRecord
  projectId?: string
  editPlanId?: string
}): MusicRegenerationDecisionRecord {
  const failingIssues = input.qaReport.issues.filter((issue) =>
    issue.severity === 'blocking' || issue.severity === 'high',
  )
  const reasons = Array.from(new Set(failingIssues.map(createRegenerationReason)))
  const shouldRegenerate = input.qaReport.recommendedAction.startsWith('regenerate') ||
    input.qaReport.recommendedAction === 'reject' ||
    input.mixPlan?.status === 'needs_regeneration' ||
    (input.analysis?.qualityScore ?? 100) < 70

  return {
    id: createMockId('music-regeneration-decision'),
    projectId: input.projectId ?? input.qaReport.projectId ?? 'mock-project',
    editPlanId: input.editPlanId ?? 'mock-edit-plan',
    musicCueId: input.qaReport.cueSheetItemId,
    generatedMusicTrackId: input.qaReport.generatedMusicTrackId,
    shouldRegenerate,
    reasons,
    recommendedAction: input.qaReport.recommendedAction,
    promptAdjustment: createRegenerationPromptAdjustment(reasons),
    lowerCostAlternative: createLowerCostAlternative(reasons),
    userFacingSummary: createUserFacingRegenerationSummary({ shouldRegenerate, reasons }),
    createdAt: nowIso(),
  }
}
