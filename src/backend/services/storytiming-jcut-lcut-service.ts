import type { CutDecisionRecord } from '../../types/edit-quality'
import type {
  CutTimingPlanRecord,
  StoryTimingSegmentRecord,
} from '../../types/storytiming'

export interface JCutLCutHint {
  cutDecisionId?: string
  cutTimingPlanId?: string
  technique: 'j_cut' | 'l_cut' | 'none'
  offsetSeconds: number
  reason: string
  safe: boolean
  warnings: string[]
}

const isDialogueContext = (segment: StoryTimingSegmentRecord | undefined): boolean =>
  Boolean(segment?.hasSpeech || segment?.primaryAuthority === 'speech_meaning')

export function chooseAudioLeadOrLag(
  cutDecision: CutDecisionRecord,
  fromSegment?: StoryTimingSegmentRecord,
  toSegment?: StoryTimingSegmentRecord,
): 'j_cut' | 'l_cut' | 'none' {
  if (!cutDecision.preserveAudioContinuity) {
    return 'none'
  }

  if (cutDecision.cutType === 'j_cut') {
    return 'j_cut'
  }

  if (cutDecision.cutType === 'l_cut') {
    return 'l_cut'
  }

  if (isDialogueContext(fromSegment) && isDialogueContext(toSegment)) {
    return 'j_cut'
  }

  return 'none'
}

export function createJCutTimingHint(
  cutTimingPlan: CutTimingPlanRecord,
  cutDecision?: CutDecisionRecord,
): JCutLCutHint {
  return {
    cutDecisionId: cutDecision?.id,
    cutTimingPlanId: cutTimingPlan.id,
    technique: 'j_cut',
    offsetSeconds: -0.25,
    reason: 'Next audio may lead the visual cut slightly for smoother speech flow.',
    safe: cutTimingPlan.preserveSentenceMeaning,
    warnings: cutTimingPlan.preserveSentenceMeaning ? [] : ['J-cut needs review because sentence meaning is not fully protected.'],
  }
}

export function createLCutTimingHint(
  cutTimingPlan: CutTimingPlanRecord,
  cutDecision?: CutDecisionRecord,
): JCutLCutHint {
  return {
    cutDecisionId: cutDecision?.id,
    cutTimingPlanId: cutTimingPlan.id,
    technique: 'l_cut',
    offsetSeconds: 0.25,
    reason: 'Previous audio may continue after the visual cut to preserve documentary/interview flow.',
    safe: cutTimingPlan.preserveAudioContinuity,
    warnings: cutTimingPlan.preserveAudioContinuity ? [] : ['L-cut is unsafe without audio-continuity preservation.'],
  }
}

export function validateJCutLCutSafety(hint: JCutLCutHint): boolean {
  return hint.technique === 'none' || (hint.safe && Math.abs(hint.offsetSeconds) <= 0.5)
}

export function createJCutLCutSummary(hints: JCutLCutHint[]): string {
  const usable = hints.filter(validateJCutLCutSafety).length

  return `${hints.length} J-cut/L-cut hint(s) created; ${usable} are mock-safe.`
}
