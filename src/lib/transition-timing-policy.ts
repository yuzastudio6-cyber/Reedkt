import type {
  BeatSnapDecisionPlan,
  EditLevel,
  PlannerInput,
  RefinedTransitionTimingItem,
  TransitionRiskLevel,
  TransitionTimingItem,
  TransitionTimingType,
} from '../types/reeditpro'

export const transitionTimingPolicies = {
  basic: ['hard_cut', 'phrase_cut', 'smooth_crossfade', 'card_wipe'],
  pro: ['phrase_cut', 'beat_cut', 'visual_motivated_cut', 'map_transition', 'chart_transition', 'browser_zoom_transition', 'graphic_wipe'],
  premium: ['phrase_cut', 'downbeat_cut', 'match_cut', 'smooth_crossfade', 'stroke_motion_transition', 'evidence_board_transition'],
} satisfies Record<EditLevel, TransitionTimingType[]>

function wantsRestrained(input: PlannerInput) {
  return input.editingCategory === 'documentary_case_study' || /\b(calm|restrained|natural|serious|minimal)\b/i.test(input.customInstructions)
}

export function getTransitionTimingPolicy(params: {
  input: PlannerInput
}) {
  return {
    allowedTypes: transitionTimingPolicies[params.input.editLevel],
    speechFirst: true,
    documentaryRestrained: wantsRestrained(params.input),
    qaChecks: [
      'Transition respects phrase boundaries.',
      'Transition does not hide captions or source labels.',
      'Beat alignment is optional and speech-safe.',
    ],
  }
}

export function chooseTransitionTimingType(params: {
  input: PlannerInput
  masterTransition?: TransitionTimingItem
  beatSnapDecision?: BeatSnapDecisionPlan
  visualMotivated?: boolean
}): TransitionTimingType {
  if (wantsRestrained(params.input)) {
    return params.input.editLevel === 'premium' ? 'documentary_cut' : 'phrase_cut'
  }

  if (params.masterTransition?.transitionType === 'hard_cut') return 'hard_cut'
  if (params.visualMotivated) return 'visual_motivated_cut'
  if (params.beatSnapDecision?.snapDecision === 'snap_to_downbeat' && params.beatSnapDecision.speechSafe && params.input.editLevel === 'premium') return 'downbeat_cut'
  if (params.beatSnapDecision?.snapDecision === 'snap_to_beat' && params.beatSnapDecision.speechSafe && params.input.editLevel !== 'basic') return 'beat_cut'
  if (params.input.editLevel === 'basic') return 'phrase_cut'
  if (params.input.editingCategory === 'education_explainer') return 'graphic_wipe'
  if (params.input.editingCategory === 'business_brand') return 'browser_zoom_transition'
  if (params.input.editingCategory === 'storytelling') return 'match_cut'
  return 'smooth_crossfade'
}

export function estimateTransitionDurationFrames(params: {
  input: PlannerInput
  transitionType: TransitionTimingType
  fps: number
}) {
  if (params.transitionType === 'hard_cut') return 0
  if (params.transitionType === 'phrase_cut') return Math.max(1, Math.round(params.fps * 0.05))
  if (params.transitionType === 'documentary_cut') return Math.round(params.fps * 0.4)

  if (params.transitionType === 'smooth_crossfade') return params.input.editLevel === 'premium' ? Math.round(params.fps * 0.65) : Math.round(params.fps * 0.4)
  if (params.transitionType.includes('map') || params.transitionType.includes('chart') || params.transitionType.includes('browser')) return Math.round(params.fps * 0.55)
  if (params.transitionType.includes('whip') || params.transitionType.includes('wipe')) return Math.round(params.fps * 0.33)
  return params.input.editLevel === 'premium' ? Math.round(params.fps * 0.5) : Math.round(params.fps * 0.35)
}

export function chooseFallbackTransitionType(params: {
  input: PlannerInput
  riskLevel: TransitionRiskLevel
  transitionType: TransitionTimingType
}): TransitionTimingType | undefined {
  if (params.riskLevel === 'low') return undefined
  if (params.input.editingCategory === 'documentary_case_study') return 'documentary_cut'
  if (params.transitionType === 'beat_cut' || params.transitionType === 'downbeat_cut' || params.transitionType === 'whip_or_push') return 'phrase_cut'
  return 'hard_cut'
}

export function isTransitionSpeechSafe(params: {
  transition: Pick<RefinedTransitionTimingItem, 'phraseBoundaryAligned' | 'beatSnapDecision' | 'transitionType'>
}) {
  if (params.transition.phraseBoundaryAligned) return true
  if (params.transition.transitionType === 'hard_cut') return true
  return Boolean(params.transition.beatSnapDecision?.speechSafe)
}
