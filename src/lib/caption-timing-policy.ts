import type {
  AspectRatioFramePlan,
  CaptionAnimationTimingStyle,
  CaptionChunkingMode,
  CaptionReadabilityRisk,
  CaptionStyleTimingPolicy,
  PlannerInput,
  ProfessionalEditingDirective,
} from '../types/reeditpro'
import { getMinimumReadFrames } from './timing-utils'

type CaptionPolicyParams = {
  input: PlannerInput
  professionalDirective?: ProfessionalEditingDirective
  aspectRatioFramePlan?: AspectRatioFramePlan
  visualDensity?: number
}

export const captionTimingPolicies: CaptionStyleTimingPolicy[] = [
  {
    id: 'caption-policy-basic-readable',
    chunkingMode: 'phrase_based',
    animationStyle: 'soft_pop',
    maxWordsPerCaption: 6,
    minDurationFrames: 45,
    maxDurationFrames: 150,
    leadInFrames: 2,
    lagFrames: 4,
    animationInFrames: 6,
    animationOutFrames: 5,
    safeGapFrames: 4,
    emphasisAllowed: false,
    maxEmphasisWordsPerCaption: 1,
    avoidRules: ['No aggressive kinetic captions.', 'Do not cover faces, products, labels, or lower panels.'],
    qaChecks: ['Captions stay readable.', 'Caption animation remains simple and professional.'],
  },
  {
    id: 'caption-policy-pro-keyword',
    chunkingMode: 'keyword_emphasis',
    animationStyle: 'word_highlight',
    maxWordsPerCaption: 7,
    minDurationFrames: 45,
    maxDurationFrames: 135,
    leadInFrames: 2,
    lagFrames: 3,
    animationInFrames: 5,
    animationOutFrames: 5,
    safeGapFrames: 4,
    emphasisAllowed: true,
    maxEmphasisWordsPerCaption: 2,
    avoidRules: ['Do not emphasize every word.', 'Beat sync must not override speech clarity.'],
    qaChecks: ['Keyword emphasis is tied to meaning.', 'Caption chunks fit the confirmed frame.'],
  },
  {
    id: 'caption-policy-premium-refined',
    chunkingMode: 'phrase_based',
    animationStyle: 'premium_minimal',
    maxWordsPerCaption: 7,
    minDurationFrames: 50,
    maxDurationFrames: 160,
    leadInFrames: 3,
    lagFrames: 4,
    animationInFrames: 8,
    animationOutFrames: 6,
    safeGapFrames: 5,
    emphasisAllowed: true,
    maxEmphasisWordsPerCaption: 2,
    avoidRules: ['Micro-motion must support comprehension.', 'Documentary/source captions remain restrained.'],
    qaChecks: ['Caption timing preserves emotional pauses.', 'Caption motion is refined, not chaotic.'],
  },
  {
    id: 'caption-policy-documentary-source-safe',
    chunkingMode: 'subtitle_block',
    animationStyle: 'documentary_lower_third',
    maxWordsPerCaption: 9,
    minDurationFrames: 60,
    maxDurationFrames: 180,
    leadInFrames: 2,
    lagFrames: 6,
    animationInFrames: 8,
    animationOutFrames: 8,
    safeGapFrames: 6,
    emphasisAllowed: false,
    maxEmphasisWordsPerCaption: 1,
    avoidRules: ['No sensational kinetic captions.', 'Do not collide with source labels or evidence cards.'],
    qaChecks: ['Evidence/source captions hold long enough.', 'Caption style stays restrained.'],
  },
]

function textIncludes(input: PlannerInput, patterns: string[]) {
  const text = `${input.customInstructions} ${input.projectName}`.toLowerCase()
  return patterns.some((pattern) => text.includes(pattern))
}

export function getDefaultCaptionChunkingMode(params: CaptionPolicyParams): CaptionChunkingMode {
  const { input, professionalDirective } = params
  const captionStyle = professionalDirective?.captionStyle

  if (textIncludes(input, ['no captions', 'without captions'])) return 'no_caption'
  if (input.editingCategory === 'documentary_case_study' || captionStyle === 'documentary_lower_third') return 'subtitle_block'
  if (input.editingCategory === 'education_explainer' || captionStyle === 'education_label_captions') return 'phrase_based'
  if (input.editingCategory === 'lifestyle' || captionStyle === 'minimal_accessibility_captions') return 'minimal_caption'
  if (captionStyle === 'karaoke_word_by_word') return input.editLevel === 'basic' ? 'phrase_based' : 'word_pop'
  if (captionStyle === 'keyword_emphasis_captions' || input.editLevel !== 'basic') return 'keyword_emphasis'
  if (captionStyle === 'sentence_block_captions') return 'sentence_based'

  return 'phrase_based'
}

export function getDefaultCaptionAnimationTimingStyle(params: CaptionPolicyParams): CaptionAnimationTimingStyle {
  const { input, professionalDirective } = params
  const captionStyle = professionalDirective?.captionStyle

  if (getDefaultCaptionChunkingMode(params) === 'no_caption') return 'none'
  if (input.editingCategory === 'documentary_case_study' || captionStyle === 'documentary_lower_third') return 'documentary_lower_third'
  if (input.editLevel === 'basic') return captionStyle === 'clean_subtitle' ? 'fade' : 'soft_pop'
  if (input.editLevel === 'premium') return captionStyle === 'bold_social_captions' ? 'word_highlight' : 'premium_minimal'
  if (captionStyle === 'karaoke_word_by_word') return 'kinetic_word_pop'
  if (captionStyle === 'keyword_emphasis_captions') return 'word_highlight'

  return 'soft_pop'
}

export function getCaptionTimingPolicy(params: CaptionPolicyParams): CaptionStyleTimingPolicy {
  const chunkingMode = getDefaultCaptionChunkingMode(params)
  const animationStyle = getDefaultCaptionAnimationTimingStyle(params)
  const basePolicy = params.input.editingCategory === 'documentary_case_study'
    ? captionTimingPolicies[3]
    : params.input.editLevel === 'premium'
      ? captionTimingPolicies[2]
      : params.input.editLevel === 'pro'
        ? captionTimingPolicies[1]
        : captionTimingPolicies[0]
  const isVertical = params.aspectRatioFramePlan?.selectedAspectRatio === '9:16' || params.aspectRatioFramePlan?.selectedAspectRatio === '4:5'
  const denseVisuals = (params.visualDensity ?? 0) > 5

  return {
    ...basePolicy,
    id: `${basePolicy.id}-${chunkingMode}-${animationStyle}`,
    chunkingMode,
    animationStyle,
    maxWordsPerCaption: Math.max(3, basePolicy.maxWordsPerCaption - (isVertical ? 1 : 0) - (denseVisuals ? 1 : 0)),
    emphasisAllowed: basePolicy.emphasisAllowed && chunkingMode !== 'minimal_caption' && chunkingMode !== 'subtitle_block',
    avoidRules: [
      ...basePolicy.avoidRules,
      isVertical ? 'Vertical frames need shorter caption chunks and extra face/lower-panel clearance.' : 'Caption zone must follow the confirmed frame layout.',
      denseVisuals ? 'High visual density requires simpler captions and safer motion.' : 'Caption density is acceptable for the planned visual density.',
    ],
  }
}

export function estimateCaptionReadability(params: {
  text: string
  durationFrames: number
  policy: CaptionStyleTimingPolicy
  aspectRatioFramePlan?: AspectRatioFramePlan
  visualDensity?: number
}): {
  risk: CaptionReadabilityRisk
  score: 'low' | 'medium' | 'high'
  notes: string[]
} {
  const words = params.text.trim().split(/\s+/).filter(Boolean)
  const requiredFrames = Math.max(params.policy.minDurationFrames, getMinimumReadFrames(params.text, 30))
  const tooManyWords = words.length > params.policy.maxWordsPerCaption
  const tooShort = params.durationFrames < requiredFrames
  const denseVisuals = (params.visualDensity ?? 0) > 6
  const verticalCrowding = params.aspectRatioFramePlan?.selectedAspectRatio === '9:16' && words.length > 6
  const risk: CaptionReadabilityRisk = tooShort && tooManyWords
    ? 'blocking'
    : tooShort || tooManyWords || denseVisuals || verticalCrowding
      ? 'medium'
      : 'low'

  return {
    risk,
    score: risk === 'low' ? 'high' : risk === 'medium' ? 'medium' : 'low',
    notes: [
      `Readability target ${requiredFrames}f; planned ${params.durationFrames}f.`,
      tooManyWords ? `Caption has ${words.length} words, above the ${params.policy.maxWordsPerCaption}-word policy.` : 'Caption word count fits policy.',
      denseVisuals ? 'Visual density is high, so caption motion should stay simple.' : 'Visual density does not require extra caption simplification.',
      verticalCrowding ? 'Vertical output needs shorter caption chunks.' : 'Aspect ratio does not add extra caption density risk.',
    ],
  }
}

export function splitTextIntoCaptionChunks(text: string, policy: CaptionStyleTimingPolicy): string[] {
  const cleanWords = text.trim().split(/\s+/).filter(Boolean)

  if (!cleanWords.length || policy.chunkingMode === 'no_caption') {
    return []
  }

  if (policy.chunkingMode === 'sentence_based' || policy.chunkingMode === 'subtitle_block') {
    const sentenceChunks = text
      .split(/(?<=[.!?])\s+/)
      .map((chunk) => chunk.trim())
      .filter(Boolean)

    if (sentenceChunks.length) return sentenceChunks
  }

  const maxWords = policy.chunkingMode === 'word_pop'
    ? 1
    : policy.chunkingMode === 'minimal_caption'
      ? Math.max(3, policy.maxWordsPerCaption - 2)
      : policy.maxWordsPerCaption
  const chunks: string[] = []

  for (let index = 0; index < cleanWords.length; index += maxWords) {
    chunks.push(cleanWords.slice(index, index + maxWords).join(' '))
  }

  return chunks
}
