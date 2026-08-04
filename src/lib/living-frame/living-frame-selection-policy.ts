import type { ProfessionalSkillSelectionSource } from '../../types/professional-skills'

export const LIVING_FRAME_PROFESSIONAL_SKILL_ID =
  'motion.living_frame_storytelling' as const

export const LIVING_FRAME_SELECTION_REASON_CODES = [
  'explicit_living_frame_request',
  'animation_aware_still_request',
  'spatial_in_frame_explanation_request',
  'explicit_motion_restraint',
  'no_strong_living_frame_signal',
] as const

export type LivingFrameSelectionReasonCode =
  (typeof LIVING_FRAME_SELECTION_REASON_CODES)[number]

export interface LivingFrameSelectionPolicyInput {
  readonly explicitUserIntent?: string
  readonly explicitEditBriefDirectives?: string
  readonly explicitEditCueDirectives?: string
}

export interface LivingFrameSelectionPolicyDecision {
  readonly selected: boolean
  readonly reasonCode: LivingFrameSelectionReasonCode
  readonly selectionSource: Extract<
    ProfessionalSkillSelectionSource,
    'user_prompt' | 'edit_brief' | 'edit_cue'
  > | null
  readonly explicitRestraintApplied: boolean
  readonly planningOnly: true
  readonly componentPayloadCreated: false
  readonly runtimeAuthorityGranted: false
}

type ExplicitIntentSource = {
  readonly source: NonNullable<LivingFrameSelectionPolicyDecision['selectionSource']>
  readonly text: string
}

const MAX_EXPLICIT_INTENT_CHARACTERS = 16_000

const EXPLICIT_RESTRAINT_PHRASES = [
  'no living frame',
  'without living frame',
  'do not use living frame',
  'dont use living frame',
  "don't use living frame",
  'no animation',
  'without animation',
  'do not use animation',
  'dont use animation',
  "don't use animation",
  'avoid animation',
  'do not animate',
  'dont animate',
  "don't animate",
  'no motion',
  'without motion',
  'do not use motion',
  'dont use motion',
  "don't use motion",
  'avoid motion',
  'static only',
  'static visuals only',
  'only static visuals',
  'talking head only',
  'no extra visual',
  'no extra visuals',
  'without extra visuals',
  'minimal visual',
  'minimal visuals',
  'keep visuals minimal',
] as const

const DIRECT_LIVING_FRAME_PHRASES = [
  'living frame',
  'living a roll',
  'in frame explainer',
  'in frame explanation',
  'selective motion',
  'limited animation',
  'animated documentary still',
  'animation aware illustration',
  'photo animation',
  'still image animation',
  'still photo animation',
] as const

const ANIMATABLE_STILL_SUBJECT_PHRASES = [
  'still image',
  'still photo',
  'still photograph',
  'photo',
  'photograph',
  'illustration',
  'archive photo',
  'archival photo',
] as const

const SPATIAL_VISUAL_PHRASES = [
  'visual',
  'visuals',
  'element',
  'elements',
  'graphic',
  'graphics',
  'map',
  'diagram',
] as const

const SPATIAL_RELATION_PHRASES = [
  'around',
  'behind',
  'beside',
  'in front of',
] as const

const SPEAKER_PHRASES = [
  'speaker',
  'the speaker',
  'person',
  'the person',
  'narrator',
  'the narrator',
  'me',
] as const

export function resolveLivingFrameSelectionPolicy(
  input: LivingFrameSelectionPolicyInput,
): LivingFrameSelectionPolicyDecision {
  const sources = explicitIntentSources(input)
  if (sources.some((source) => hasAnyBoundedPhrase(
    source.text,
    EXPLICIT_RESTRAINT_PHRASES,
  ))) {
    return decision(false, 'explicit_motion_restraint', null, true)
  }

  for (const source of sources) {
    if (hasAnyBoundedPhrase(source.text, DIRECT_LIVING_FRAME_PHRASES)) {
      return decision(true, 'explicit_living_frame_request', source.source, false)
    }
    if (requestsAnimationAwareStill(source.text)) {
      return decision(true, 'animation_aware_still_request', source.source, false)
    }
    if (requestsSpatialInFrameExplanation(source.text)) {
      return decision(
        true,
        'spatial_in_frame_explanation_request',
        source.source,
        false,
      )
    }
  }

  return decision(false, 'no_strong_living_frame_signal', null, false)
}

function decision(
  selected: boolean,
  reasonCode: LivingFrameSelectionReasonCode,
  selectionSource: LivingFrameSelectionPolicyDecision['selectionSource'],
  explicitRestraintApplied: boolean,
): LivingFrameSelectionPolicyDecision {
  return {
    selected,
    reasonCode,
    selectionSource,
    explicitRestraintApplied,
    planningOnly: true,
    componentPayloadCreated: false,
    runtimeAuthorityGranted: false,
  }
}

function explicitIntentSources(
  input: LivingFrameSelectionPolicyInput,
): ExplicitIntentSource[] {
  const sources: ExplicitIntentSource[] = [
    {
      source: 'user_prompt',
      text: normalizeBoundedIntent(input.explicitUserIntent),
    },
    {
      source: 'edit_brief',
      text: normalizeBoundedIntent(input.explicitEditBriefDirectives),
    },
    {
      source: 'edit_cue',
      text: normalizeBoundedIntent(input.explicitEditCueDirectives),
    },
  ]

  return sources.filter((source) => source.text.length > 0)
}

function normalizeBoundedIntent(value: string | undefined): string {
  return String(value ?? '')
    .slice(0, MAX_EXPLICIT_INTENT_CHARACTERS)
    .normalize('NFKC')
    .toLowerCase()
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function requestsAnimationAwareStill(text: string): boolean {
  return (
    hasAnyBoundedPhrase(text, ['animate', 'animated', 'animating'])
    && hasAnyBoundedPhrase(text, ANIMATABLE_STILL_SUBJECT_PHRASES)
  )
}

function requestsSpatialInFrameExplanation(text: string): boolean {
  return (
    hasAnyBoundedPhrase(text, SPATIAL_VISUAL_PHRASES)
    && hasAnyBoundedPhrase(text, SPATIAL_RELATION_PHRASES)
    && hasAnyBoundedPhrase(text, SPEAKER_PHRASES)
  )
}

function hasAnyBoundedPhrase(
  text: string,
  phrases: readonly string[],
): boolean {
  return phrases.some((phrase) => boundedPhrasePattern(phrase).test(text))
}

function boundedPhrasePattern(phrase: string): RegExp {
  const pattern = phrase
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => escapeRegExp(part))
    .join('\\s+')
  return new RegExp(`(?:^|[^a-z0-9])${pattern}(?=$|[^a-z0-9])`, 'i')
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}
