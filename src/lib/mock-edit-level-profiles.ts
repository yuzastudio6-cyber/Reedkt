import type {
  EditLevelFallbackPolicy,
  EditLevelLegacyAliasMapping,
  EditLevelProfile,
  EditLevelQAProfileDefinition,
  EditLevelToolRoutingProfile,
  EditLevelUICardModel,
  ReEditProCanonicalEditLevel,
  ReEditProLegacyEditLevel,
} from '../types'
import {
  REEDITPRO_EDIT_LEVEL_LEGACY_COMPATIBILITY_RULE,
  REEDITPRO_EDIT_LEVEL_NO_RUNTIME_RULE,
  REEDITPRO_EDIT_LEVEL_PROFESSIONAL_RULE,
} from '../types'

export const EDIT_LEVEL_LEGACY_ALIAS_MAPPINGS: EditLevelLegacyAliasMapping[] = [
  {
    legacyLevel: 'basic',
    canonicalLevel: 'normal',
    publicDisplayName: 'Normal',
    inputSource: 'legacy_runtime',
    notes: ['legacy basic -> canonical normal', REEDITPRO_EDIT_LEVEL_LEGACY_COMPATIBILITY_RULE],
  },
  {
    legacyLevel: 'pro',
    canonicalLevel: 'premium',
    publicDisplayName: 'Premium',
    inputSource: 'legacy_runtime',
    notes: ['legacy pro -> canonical premium', REEDITPRO_EDIT_LEVEL_LEGACY_COMPATIBILITY_RULE],
  },
  {
    legacyLevel: 'premium',
    canonicalLevel: 'ultra_premium',
    publicDisplayName: 'Ultra Premium',
    inputSource: 'legacy_runtime',
    notes: ['legacy premium -> canonical ultra_premium', 'The premium string is source-aware and ambiguous without inputSource.'],
  },
]

const normalToolRouting: EditLevelToolRoutingProfile = {
  qwen3ReasoningDepth: 'standard',
  qwen25vlVisualDepth: 'targeted',
  transcriptPolicy: 'optional_or_targeted',
  audioPolicy: 'basic',
  graphicsPolicy: 'basic_captions',
  mediaExtractionPolicy: 'duration_dimensions_aspect_ratio_and_export_recommendation',
  deepseekPolicy: 'not_user_reasoning',
  sourceUnderstandingPolicy: 'metadata_and_targeted_context',
  requiredCapabilities: ['intent_summary', 'basic_source_metadata', 'baseline_qa'],
  recommendedCapabilities: ['targeted_visual_context_when_ambiguous'],
  fallbackCapabilities: ['deterministic_reasoning_fallback', 'source_summary_fallback'],
  mockOnly: true,
}

const premiumToolRouting: EditLevelToolRoutingProfile = {
  qwen3ReasoningDepth: 'deep',
  qwen25vlVisualDepth: 'key_moments_and_marker_windows',
  transcriptPolicy: 'recommended_when_speech',
  audioPolicy: 'music_sfx_ducking',
  graphicsPolicy: 'styled_captions_cards',
  mediaExtractionPolicy: 'metadata_key_moments_and_keyframe_plan',
  deepseekPolicy: 'not_user_reasoning',
  sourceUnderstandingPolicy: 'key_moments_and_context_package',
  requiredCapabilities: ['deep_reasoning_plan', 'source_context_package', 'premium_qa'],
  recommendedCapabilities: ['timecoded_transcript_when_speech_exists', 'key_visual_moments', 'preference_dna_application'],
  fallbackCapabilities: ['normal_visual_fallback', 'source_summary_with_clarification'],
  mockOnly: true,
}

const ultraPremiumToolRouting: EditLevelToolRoutingProfile = {
  qwen3ReasoningDepth: 'multi_pass',
  qwen25vlVisualDepth: 'scene_level',
  transcriptPolicy: 'required_when_speech',
  audioPolicy: 'sound_design',
  graphicsPolicy: 'motion_graphics_direction',
  mediaExtractionPolicy: 'scene_keyframe_waveform_planning_depth_future_worker_backed',
  deepseekPolicy: 'not_user_reasoning',
  sourceUnderstandingPolicy: 'scene_level_deep_context',
  requiredCapabilities: ['multi_pass_reasoning_plan', 'scene_level_context', 'strict_qa'],
  recommendedCapabilities: ['speech_timing', 'sound_design_planning', 'deep_preference_dna_application'],
  fallbackCapabilities: ['premium_safe_visual_fallback', 'degraded_capability_notice'],
  mockOnly: true,
}

function qaProfile(profile: EditLevelQAProfileDefinition['qaProfile']): EditLevelQAProfileDefinition {
  if (profile === 'baseline') {
    return {
      qaProfile: 'baseline',
      checks: ['professional baseline', 'caption safe-zone basics', 'export sanity', 'copy-risk block'],
      blockingChecks: ['missing required source', 'unsafe copy risk'],
      warningChecks: ['obvious audio issue', 'caption readability risk'],
      strictnessSummary: 'Baseline QA profile for a clean professional edit.',
      mockOnly: true,
    }
  }

  if (profile === 'premium') {
    return {
      qaProfile: 'premium',
      checks: ['all baseline checks', 'pacing consistency', 'b-roll timing', 'music ducking', 'Preference DNA match'],
      blockingChecks: ['missing required source', 'unsafe copy risk', 'Edit Brief marker conflict'],
      warningChecks: ['SFX restraint', 'missing optional asset', 'caption readability risk'],
      strictnessSummary: 'Premium QA profile adds creative and timing consistency checks.',
      mockOnly: true,
    }
  }

  return {
    qaProfile: 'ultra',
    checks: ['all premium checks', 'story arc quality', 'style consistency', 'sound design coherence', 'motion/card consistency'],
    blockingChecks: ['missing required source', 'unsafe copy risk', 'plan completeness failure', 'visual context confidence failure'],
    warningChecks: ['multi-platform export risk', 'graphic polish risk', 'deep DNA mismatch'],
    strictnessSummary: 'Ultra QA profile adds studio-level completeness and consistency checks.',
    mockOnly: true,
  }
}

function fallbackPolicy(level: ReEditProCanonicalEditLevel): EditLevelFallbackPolicy {
  const visualFallback = level === 'ultra_premium'
    ? 'Use Premium-safe visual fallback and show degraded capability notice.'
    : 'Use lower visual depth and ask for clarification when visual context matters.'

  return {
    qwenUnavailable: 'Use deterministic reasoning fallback and clearly mark that Qwen 3.7 did not run.',
    qwen25vlUnavailable: visualFallback,
    transcriptUnavailable: 'Ask user clarification or use available source summary; do not claim transcript analysis ran.',
    audioUnavailable: 'Use basic audio policy fallback and do not claim SoundSync analysis ran.',
    graphicDesignUnavailable: 'Use basic caption/text fallback and avoid overclaiming motion graphics analysis.',
    renderWorkerUnavailable: 'Stay in plan-only mode; render budget is future metadata.',
    creditGateUnavailable: 'Stay in estimate-only mode; do not reserve or spend credits.',
    degradedCapabilityNotice: `${level} profile is mock-safe; unavailable capabilities must be named before fallback.`,
    mockOnly: true,
  }
}

function uiCard(params: {
  level: ReEditProCanonicalEditLevel
  displayName: EditLevelUICardModel['displayName']
  tagline: string
  bestFor: string[]
  includedHighlights: string[]
  editBriefGuidance: string
  estimateSummary: string
}): EditLevelUICardModel {
  return {
    ...params,
    recommended: false,
    mockOnly: true,
  }
}

export const NORMAL_EDIT_LEVEL_PROFILE: EditLevelProfile = {
  level: 'normal',
  displayName: 'Normal',
  legacyAliases: ['basic'],
  shortPromise: 'Clean professional edit.',
  userFacingDescription: 'Efficient, reliable, fast path for straightforward edits and simple creator videos.',
  analysisDepth: 'baseline',
  toolRouting: normalToolRouting,
  editBriefPolicy: 'optional',
  editPreferencePolicy: 'safe_style_hints',
  qaProfile: qaProfile('baseline'),
  planComplexity: 'simple_professional',
  toolBudget: 'minimal_professional',
  estimateProfile: {
    creditEstimateMultiplier: 1,
    timeEstimateMultiplier: 1,
    analysisPassBudget: 1,
    qwenReasoningPassBudget: 1,
    qwen25vlVisualPassBudget: 'targeted_only',
    renderPassBudgetFuture: 1,
    revisionBudgetFuture: 1,
    variantBudgetFuture: 1,
    estimateOnly: true,
    creditsReservedOrSpent: false,
    needsProductValue: true,
  },
  fallbackPolicy: fallbackPolicy('normal'),
  uiCard: uiCard({
    level: 'normal',
    displayName: 'Normal',
    tagline: 'Clean professional edit',
    bestFor: ['straightforward edits', 'simple creator videos', 'fast clean delivery'],
    includedHighlights: ['clean pacing', 'simple captions when needed', 'baseline QA', 'minimal professional tool budget'],
    editBriefGuidance: 'Edit Brief optional.',
    estimateSummary: '1.0x credit estimate only; render budget future: 1.',
  }),
  betaReady: true,
  productionReady: false,
  mockOnly: true,
  warnings: [REEDITPRO_EDIT_LEVEL_PROFESSIONAL_RULE, REEDITPRO_EDIT_LEVEL_NO_RUNTIME_RULE],
}

export const PREMIUM_EDIT_LEVEL_PROFILE: EditLevelProfile = {
  level: 'premium',
  displayName: 'Premium',
  legacyAliases: ['pro'],
  shortPromise: 'Enhanced creative edit.',
  userFacingDescription: 'More polished, more directed, better creative decisions for creators, business content, social posts, and product videos.',
  analysisDepth: 'enhanced',
  toolRouting: premiumToolRouting,
  editBriefPolicy: 'recommended',
  editPreferencePolicy: 'strong_dna_application',
  qaProfile: qaProfile('premium'),
  planComplexity: 'layered',
  toolBudget: 'medium',
  estimateProfile: {
    creditEstimateMultiplier: 2,
    timeEstimateMultiplier: 1.8,
    analysisPassBudget: 2,
    qwenReasoningPassBudget: 2,
    qwen25vlVisualPassBudget: 'key_moments',
    renderPassBudgetFuture: 2,
    revisionBudgetFuture: 2,
    variantBudgetFuture: 2,
    estimateOnly: true,
    creditsReservedOrSpent: false,
    needsProductValue: true,
  },
  fallbackPolicy: fallbackPolicy('premium'),
  uiCard: uiCard({
    level: 'premium',
    displayName: 'Premium',
    tagline: 'Enhanced creative edit',
    bestFor: ['social posts', 'business content', 'product videos', 'stronger storytelling'],
    includedHighlights: ['stronger hook/story/pacing', 'key visual moments', 'styled captions/cards', 'premium QA'],
    editBriefGuidance: 'Edit Brief recommended.',
    estimateSummary: '2.0x credit estimate only; render budget future: 2.',
  }),
  betaReady: true,
  productionReady: false,
  mockOnly: true,
  warnings: [REEDITPRO_EDIT_LEVEL_PROFESSIONAL_RULE, REEDITPRO_EDIT_LEVEL_NO_RUNTIME_RULE],
}

export const ULTRA_PREMIUM_EDIT_LEVEL_PROFILE: EditLevelProfile = {
  level: 'ultra_premium',
  displayName: 'Ultra Premium',
  legacyAliases: ['premium'],
  shortPromise: 'Studio-level creative treatment.',
  userFacingDescription: 'Deepest analysis and strongest polish for launches, ads, brands, cinematic pieces, high-value social content, and complex edits.',
  analysisDepth: 'studio',
  toolRouting: ultraPremiumToolRouting,
  editBriefPolicy: 'strongly_recommended',
  editPreferencePolicy: 'deep_dna_application',
  qaProfile: qaProfile('ultra'),
  planComplexity: 'studio_multi_layer',
  toolBudget: 'highest',
  estimateProfile: {
    creditEstimateMultiplier: 4,
    timeEstimateMultiplier: 3,
    analysisPassBudget: 3,
    qwenReasoningPassBudget: 'multi_pass',
    qwen25vlVisualPassBudget: 'scene_level',
    renderPassBudgetFuture: 3,
    revisionBudgetFuture: 3,
    variantBudgetFuture: 3,
    estimateOnly: true,
    creditsReservedOrSpent: false,
    needsProductValue: true,
  },
  fallbackPolicy: fallbackPolicy('ultra_premium'),
  uiCard: uiCard({
    level: 'ultra_premium',
    displayName: 'Ultra Premium',
    tagline: 'Studio-level creative treatment',
    bestFor: ['launches', 'ads', 'brands', 'cinematic pieces', 'complex edits'],
    includedHighlights: ['scene-level visual policy', 'sound design planning', 'advanced cards/motion direction', 'strict QA'],
    editBriefGuidance: 'Edit Brief strongly recommended.',
    estimateSummary: '4.0x credit estimate only; render budget future: 3.',
  }),
  betaReady: true,
  productionReady: false,
  mockOnly: true,
  warnings: [REEDITPRO_EDIT_LEVEL_PROFESSIONAL_RULE, REEDITPRO_EDIT_LEVEL_NO_RUNTIME_RULE],
}

export const EDIT_LEVEL_PROFILES: EditLevelProfile[] = [
  NORMAL_EDIT_LEVEL_PROFILE,
  PREMIUM_EDIT_LEVEL_PROFILE,
  ULTRA_PREMIUM_EDIT_LEVEL_PROFILE,
]

export function listEditLevelProfiles(): EditLevelProfile[] {
  return EDIT_LEVEL_PROFILES
}

export function getEditLevelProfile(level: ReEditProCanonicalEditLevel): EditLevelProfile | undefined {
  return EDIT_LEVEL_PROFILES.find((profile) => profile.level === level)
}

export function getEditLevelProfileByLegacyAlias(legacyLevel: ReEditProLegacyEditLevel): EditLevelProfile | undefined {
  const mapping = EDIT_LEVEL_LEGACY_ALIAS_MAPPINGS.find((alias) => alias.legacyLevel === legacyLevel)
  return mapping ? getEditLevelProfile(mapping.canonicalLevel) : undefined
}
