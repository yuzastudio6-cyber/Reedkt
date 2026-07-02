import type {
  CaptionVisualCueTimingPlan,
  DataVizPlan,
  EditingCategory,
  MapAnimationPlan,
  MasterTimingPlan,
  PlannerInput,
  SoundSyncTransitionTimingPlan,
  TimingComplexityLevel,
  TimingCreditProfile,
  TimingLowerCostRecommendation,
  VisualAssetPlanItem,
} from '../types/reeditpro'

type InferTimingComplexityParams = {
  input: PlannerInput
  masterTimingPlan?: MasterTimingPlan
  captionVisualCueTimingPlan?: CaptionVisualCueTimingPlan
  soundSyncTransitionTimingPlan?: SoundSyncTransitionTimingPlan
  visualAssetPlan?: VisualAssetPlanItem[]
  mapAnimationPlan?: MapAnimationPlan
  dataVizPlan?: DataVizPlan
}

type RecommendationParams = InferTimingComplexityParams & {
  complexity?: TimingComplexityLevel
}

export const timingCreditProfiles: Record<TimingComplexityLevel, TimingCreditProfile> = {
  none: {
    id: 'timing-credit-none',
    complexity: 'none',
    label: 'No timing complexity',
    description: 'No extra timing planning beyond unavailable or voice-only timing context.',
    creditImpact: 'none',
    estimatedPlanningCredits: 0,
    bestFor: ['No caption, visual, transition, music, SFX, or provider clip timing'],
    avoidFor: ['Approval-ready edits with visual or audio timing'],
    tierFit: { basic: true, pro: true, premium: true },
    requiresQa: false,
    qaChecks: ['Confirm no timed edit elements are planned.'],
  },
  simple: {
    id: 'timing-credit-simple',
    complexity: 'simple',
    label: 'Simple professional timing',
    description: 'Clean cuts, readable captions, simple visual reveals, and low SFX density.',
    creditImpact: 'low',
    estimatedPlanningCredits: 0,
    bestFor: ['Basic professional edits', 'Voice-led edits', 'Clean social captions'],
    avoidFor: ['Beat-heavy edits', 'Many chart/map/browser reveals', 'Complex AI video timing'],
    tierFit: { basic: true, pro: true, premium: true },
    requiresQa: true,
    qaChecks: ['Caption readability', 'Clean cuts', 'Low cue density'],
  },
  moderate: {
    id: 'timing-credit-moderate',
    complexity: 'moderate',
    label: 'Moderate timing refinement',
    description: 'Keyword emphasis, several visual cues, phrase-aware transitions, and light SoundSync.',
    creditImpact: 'medium',
    estimatedPlanningCredits: 2,
    bestFor: ['Pro social edits', 'Education explainers', 'Business/product videos'],
    avoidFor: ['Minimal Basic edits with tight credit preference'],
    tierFit: { basic: true, pro: true, premium: true },
    requiresQa: true,
    qaChecks: ['Caption emphasis restraint', 'Visual cue read time', 'Phrase boundary transitions'],
  },
  advanced: {
    id: 'timing-credit-advanced',
    complexity: 'advanced',
    label: 'Advanced timing coordination',
    description: 'Beat-aware transitions, SFX and ducking coordination, map/chart/browser cue timing, and AI duration planning.',
    creditImpact: 'high',
    estimatedPlanningCredits: 5,
    bestFor: ['Pro production edits', 'Premium story edits', 'Tool-heavy explainers'],
    avoidFor: ['Basic unless the user explicitly accepts higher complexity'],
    tierFit: { basic: false, pro: true, premium: true },
    requiresQa: true,
    qaChecks: ['Speech-safe beat sync', 'SFX justification', 'Ducking under voice', 'Provider clip duration'],
  },
  premium: {
    id: 'timing-credit-premium',
    complexity: 'premium',
    label: 'Premium timing review',
    description: 'Scene-level timing refinement, cinematic or emotional timing, many timed layers, and deeper QA.',
    creditImpact: 'premium',
    estimatedPlanningCredits: 8,
    bestFor: ['Premium edits', 'Cinematic story timing', 'Complex SoundSync and motion coordination'],
    avoidFor: ['Basic', 'Credit-constrained Pro edits without user request'],
    tierFit: { basic: false, pro: false, premium: true },
    requiresQa: true,
    qaChecks: ['Scene-level timing QA', 'Layer overlap review', 'Emotional pause protection', 'Manual review notes'],
  },
}

export function getTimingCreditProfile(complexity: TimingComplexityLevel) {
  return timingCreditProfiles[complexity]
}

function sfxDensityScore(density: SoundSyncTransitionTimingPlan['sfxDensityLevel'] | undefined) {
  if (density === 'premium_refined') return 3
  if (density === 'high') return 2
  if (density === 'balanced') return 1
  return 0
}

function animationScore(animationStyle: CaptionVisualCueTimingPlan['captionPolicy']['animationStyle'] | undefined) {
  if (animationStyle === 'kinetic_word_pop' || animationStyle === 'typewriter') return 2
  if (animationStyle === 'word_highlight' || animationStyle === 'premium_minimal' || animationStyle === 'slide_up') return 1
  return 0
}

function thresholdScore(count: number, moderate: number, advanced: number) {
  if (count >= advanced) return 2
  if (count >= moderate) return 1
  return 0
}

function categoryPressure(category: EditingCategory) {
  if (category === 'education_explainer' || category === 'business_brand') return 1
  if (category === 'documentary_case_study') return 1
  return 0
}

export function inferTimingComplexity(params: InferTimingComplexityParams): TimingComplexityLevel {
  const { captionVisualCueTimingPlan, input, masterTimingPlan, soundSyncTransitionTimingPlan } = params

  if (!masterTimingPlan && !captionVisualCueTimingPlan && !soundSyncTransitionTimingPlan) {
    return 'none'
  }

  let score = 0
  score += animationScore(captionVisualCueTimingPlan?.captionPolicy.animationStyle)
  score += thresholdScore(captionVisualCueTimingPlan?.refinedCaptionTimings.length ?? 0, 8, 18)
  score += thresholdScore(captionVisualCueTimingPlan?.visualCueTimings.length ?? masterTimingPlan?.visualTimingItems.length ?? 0, 6, 12)
  score += thresholdScore(soundSyncTransitionTimingPlan?.refinedTransitionTimings.length ?? masterTimingPlan?.transitionTimingItems.length ?? 0, 4, 8)
  score += thresholdScore(soundSyncTransitionTimingPlan?.refinedSfxTimings.length ?? masterTimingPlan?.sfxTimingItems.length ?? 0, 3, 7)
  score += sfxDensityScore(soundSyncTransitionTimingPlan?.sfxDensityLevel)
  score += thresholdScore(soundSyncTransitionTimingPlan?.refinedMusicDuckingTimings.length ?? masterTimingPlan?.musicDuckingTimingItems.length ?? 0, 4, 9)
  score += thresholdScore(masterTimingPlan?.providerClipTimingItems.length ?? 0, 1, 3)
  score += thresholdScore((params.mapAnimationPlan?.items.length ?? 0) + (params.dataVizPlan?.items.length ?? 0), 1, 3)
  score += (soundSyncTransitionTimingPlan?.beatGridPlan.beatItems.length ?? 0) > 0 ? 1 : 0
  score += (soundSyncTransitionTimingPlan?.status === 'needs_audioflux_analysis' || masterTimingPlan?.beatGridPlan.status === 'needs_audio_analysis') ? 1 : 0
  score += (masterTimingPlan?.timingBase.finalDurationSeconds ?? 0) > 90 ? 1 : 0
  score += categoryPressure(input.editingCategory)

  if (input.editLevel === 'premium' && score >= 9) return 'premium'
  if (score >= 8) return input.editLevel === 'premium' ? 'premium' : 'advanced'
  if (score >= 5) return 'advanced'
  if (score >= 2) return 'moderate'
  return 'simple'
}

function recommendation(params: TimingLowerCostRecommendation): TimingLowerCostRecommendation {
  return params
}

export function createTimingLowerCostRecommendations(params: RecommendationParams): TimingLowerCostRecommendation[] {
  const complexity = params.complexity ?? inferTimingComplexity(params)
  const profile = getTimingCreditProfile(complexity)
  const captionStyle = params.captionVisualCueTimingPlan?.captionPolicy.animationStyle
  const sfxDensity = params.soundSyncTransitionTimingPlan?.sfxDensityLevel
  const hasBeatSync = (params.soundSyncTransitionTimingPlan?.beatGridPlan.beatItems.length ?? 0) > 0
  const hasProviderClips = (params.masterTimingPlan?.providerClipTimingItems.length ?? 0) > 0
  const highCueDensity = (params.captionVisualCueTimingPlan?.visualCueTimings.length ?? 0) >= 6

  const recommendations = [
    captionStyle && captionStyle !== 'fade' && captionStyle !== 'none'
      ? recommendation({
          id: 'timing-lower-cost-simpler-captions',
          label: 'Use simpler caption animation',
          estimatedCreditSavings: Math.max(1, Math.min(2, profile.estimatedPlanningCredits)),
          tradeoff: 'Less motion emphasis, but captions remain readable and professional.',
          whatChanges: ['Switch to fade or soft pop', 'Keep phrase-based chunks', 'Reduce caption animation QA'],
          keepsProfessionalQuality: true,
          requiresNewApproval: true,
          actionType: 'simpler_caption_animation',
        })
      : undefined,
    (params.captionVisualCueTimingPlan?.refinedCaptionTimings.some((item) => item.emphasisWords.length > 0) ?? false)
      ? recommendation({
          id: 'timing-lower-cost-fewer-emphasis-words',
          label: 'Use fewer emphasis words',
          estimatedCreditSavings: 1,
          tradeoff: 'Keeps captions clean while reducing micro-timing complexity.',
          whatChanges: ['Keep only the most important emphasis words', 'Avoid word-by-word timing'],
          keepsProfessionalQuality: true,
          requiresNewApproval: true,
          actionType: 'reduce_emphasis_words',
        })
      : undefined,
    highCueDensity
      ? recommendation({
          id: 'timing-lower-cost-fewer-visual-cues',
          label: 'Reduce visual cue density',
          estimatedCreditSavings: Math.max(1, Math.min(3, profile.estimatedPlanningCredits)),
          tradeoff: 'Fewer reveals, but the strongest visual moments remain timed to meaning.',
          whatChanges: ['Combine similar visual cues', 'Hold cards longer', 'Remove decorative reveals'],
          keepsProfessionalQuality: true,
          requiresNewApproval: true,
          actionType: 'reduce_visual_cue_density',
        })
      : undefined,
    hasBeatSync
      ? recommendation({
          id: 'timing-lower-cost-phrase-cuts-only',
          label: 'Use phrase cuts only',
          estimatedCreditSavings: Math.max(1, Math.min(3, profile.estimatedPlanningCredits)),
          tradeoff: 'Less music-led timing, but speech clarity and story rhythm stay protected.',
          whatChanges: ['Remove beat snap decisions', 'Keep phrase-boundary transitions', 'Use fewer SoundSync QA checks'],
          keepsProfessionalQuality: true,
          requiresNewApproval: true,
          actionType: 'use_phrase_cuts_only',
        })
      : undefined,
    hasBeatSync
      ? recommendation({
          id: 'timing-lower-cost-remove-beat-sync',
          label: 'Remove beat sync',
          estimatedCreditSavings: Math.max(1, Math.min(2, profile.estimatedPlanningCredits)),
          tradeoff: 'The edit becomes more voice-led and less rhythm-synced.',
          whatChanges: ['Disable beat-aware reveals', 'Keep transition timing speech-first'],
          keepsProfessionalQuality: true,
          requiresNewApproval: true,
          actionType: 'remove_beat_sync',
        })
      : undefined,
    sfxDensity && sfxDensity !== 'none' && sfxDensity !== 'low'
      ? recommendation({
          id: 'timing-lower-cost-reduce-sfx',
          label: 'Reduce SFX density',
          estimatedCreditSavings: Math.max(1, Math.min(3, profile.estimatedPlanningCredits)),
          tradeoff: 'Less sonic polish, but transitions and visual reveals remain intentional.',
          whatChanges: ['Keep only cue-critical SFX', 'Remove decorative hits', 'Reduce SFX QA'],
          keepsProfessionalQuality: true,
          requiresNewApproval: true,
          actionType: 'reduce_sfx_density',
        })
      : undefined,
    (params.soundSyncTransitionTimingPlan?.refinedTransitionTimings.some((item) => item.transitionType !== 'hard_cut' && item.transitionType !== 'phrase_cut') ?? false)
      ? recommendation({
          id: 'timing-lower-cost-simpler-transitions',
          label: 'Use simpler transitions',
          estimatedCreditSavings: Math.max(1, Math.min(2, profile.estimatedPlanningCredits)),
          tradeoff: 'Less motion complexity, but cuts remain clean and phrase-safe.',
          whatChanges: ['Use hard cuts, phrase cuts, or simple crossfades', 'Remove complex transition animation'],
          keepsProfessionalQuality: true,
          requiresNewApproval: true,
          actionType: 'simpler_transitions',
        })
      : undefined,
    hasProviderClips
      ? recommendation({
          id: 'timing-lower-cost-shorter-ai-clips',
          label: 'Shorten AI clip duration',
          estimatedCreditSavings: Math.max(1, Math.min(4, profile.estimatedPlanningCredits)),
          tradeoff: 'Uses shorter generated clips while keeping the story beat clear.',
          whatChanges: ['Trim provider clip placements', 'Use Remotion holds or cards for supporting frames'],
          keepsProfessionalQuality: true,
          requiresNewApproval: true,
          actionType: 'shorter_ai_clip_duration',
        })
      : undefined,
    (params.visualAssetPlan?.some((asset) => asset.assetType === 'animated_scene' || asset.assetType === 'motion_design_scene') ?? false)
      ? recommendation({
          id: 'timing-lower-cost-static-card',
          label: 'Use a static card instead of animation',
          estimatedCreditSavings: Math.max(1, Math.min(4, profile.estimatedPlanningCredits)),
          tradeoff: 'Less animation, but the information remains clear and professional.',
          whatChanges: ['Convert selected animated reveal to static card', 'Hold the card long enough to read'],
          keepsProfessionalQuality: true,
          requiresNewApproval: true,
          actionType: 'use_static_card',
        })
      : undefined,
  ].filter(Boolean) as TimingLowerCostRecommendation[]

  if (complexity === 'none' || complexity === 'simple') {
    return recommendations.slice(0, 2)
  }

  return recommendations.slice(0, 5)
}
