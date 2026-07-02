import type {
  CleanupPreference,
  CleanupPreferenceRecommendation,
  CutReason,
  EditingCategory,
  EditLevel,
  KeepReason,
  PlannerInput,
} from '../types/reeditpro'

export type CleanupPreferenceProfile = {
  preference: CleanupPreference
  label: string
  description: string
  bestUseCases: string[]
  avoidUseCases: string[]
  defaultCutReasons: CutReason[]
  defaultKeepReasons: KeepReason[]
  aggressionLevel: 1 | 2 | 3 | 4 | 5
  preservePauses: boolean
  preserveEvidence: boolean
  preserveTutorialSteps: boolean
  preserveNaturalness: boolean
  tierFit: {
    basic: boolean
    pro: boolean
    premium: boolean
  }
  qaChecks: string[]
}

export const cleanupPreferenceProfiles: CleanupPreferenceProfile[] = [
  {
    preference: 'preserve_natural',
    label: 'Preserve natural',
    description: 'Keep human pauses, rough edges, and authenticity while removing only obvious problems.',
    bestUseCases: ['lifestyle', 'behind the scenes', 'founder updates', 'raw creator style'],
    avoidUseCases: ['dense ads', 'maximum retention cutdowns'],
    defaultCutReasons: ['dead_space', 'mistake'],
    defaultKeepReasons: ['behind_the_scenes_authenticity', 'emotional_moment', 'source_context_required'],
    aggressionLevel: 1,
    preservePauses: true,
    preserveEvidence: true,
    preserveTutorialSteps: true,
    preserveNaturalness: true,
    tierFit: { basic: true, pro: true, premium: true },
    qaChecks: ['Natural pauses are intentionally preserved.', 'Do not over-polish authentic source moments.'],
  },
  {
    preference: 'light_cleanup',
    label: 'Light cleanup',
    description: 'Remove only obvious dead space, mistakes, and unusable setup/cleanup.',
    bestUseCases: ['simple clean edits', 'calm talking-head edits', 'low-compute professional cleanup'],
    avoidUseCases: ['fast retention edits', 'aggressive cutdowns'],
    defaultCutReasons: ['dead_space', 'mistake', 'setup_cleanup'],
    defaultKeepReasons: ['clear_explanation', 'source_context_required', 'good_audio_moment'],
    aggressionLevel: 2,
    preservePauses: true,
    preserveEvidence: true,
    preserveTutorialSteps: true,
    preserveNaturalness: true,
    tierFit: { basic: true, pro: true, premium: true },
    qaChecks: ['Only obvious weak sections are removed.', 'Meaning and naturalness remain intact.'],
  },
  {
    preference: 'balanced_cleanup',
    label: 'Balanced cleanup',
    description: 'Professional default: remove filler/repeats while preserving meaning and useful context.',
    bestUseCases: ['most business edits', 'education edits', 'storytelling edits'],
    avoidUseCases: ['raw creator style', 'legal/evidence-heavy edits without review'],
    defaultCutReasons: ['dead_space', 'filler_words', 'duplicate_point', 'pacing_drag'],
    defaultKeepReasons: ['strong_hook', 'clear_explanation', 'key_story_beat', 'cta'],
    aggressionLevel: 3,
    preservePauses: false,
    preserveEvidence: true,
    preserveTutorialSteps: true,
    preserveNaturalness: false,
    tierFit: { basic: true, pro: true, premium: true },
    qaChecks: ['Cleanup improves pacing without changing meaning.', 'Repeated points are merged or removed with reasons.'],
  },
  {
    preference: 'tight_retention_cleanup',
    label: 'Tight retention cleanup',
    description: 'Faster social pacing that tightens explanations and removes slow sections.',
    bestUseCases: ['short-form social', 'high-retention edits', 'marketing hooks'],
    avoidUseCases: ['documentary proof sections', 'complete tutorials', 'raw lifestyle'],
    defaultCutReasons: ['dead_space', 'filler_words', 'duplicate_point', 'pacing_drag', 'weak_explanation'],
    defaultKeepReasons: ['strong_hook', 'key_story_beat', 'clear_explanation', 'cta'],
    aggressionLevel: 4,
    preservePauses: false,
    preserveEvidence: true,
    preserveTutorialSteps: true,
    preserveNaturalness: false,
    tierFit: { basic: false, pro: true, premium: true },
    qaChecks: ['Retention pacing does not remove required meaning.', 'Emotional/proof pauses are reviewed before cutting.'],
  },
  {
    preference: 'aggressive_cleanup',
    label: 'Aggressive cleanup',
    description: 'Maximum cutdown for dense pacing, only when explicitly requested.',
    bestUseCases: ['fast cutdowns', 'remove all retries', 'dense ad variants'],
    avoidUseCases: ['documentary', 'tutorial', 'proof-heavy edits', 'natural creator videos'],
    defaultCutReasons: ['dead_space', 'filler_words', 'false_start', 'repeated_take', 'duplicate_point', 'mistake', 'pacing_drag'],
    defaultKeepReasons: ['strong_hook', 'key_story_beat', 'cta'],
    aggressionLevel: 5,
    preservePauses: false,
    preserveEvidence: false,
    preserveTutorialSteps: false,
    preserveNaturalness: false,
    tierFit: { basic: false, pro: true, premium: true },
    qaChecks: ['Aggressive cuts require user review.', 'Meaning-risk sections are flagged before approval.'],
  },
  {
    preference: 'documentary_faithful',
    label: 'Documentary faithful',
    description: 'Preserve claim context, proof, source integrity, and neutral pacing.',
    bestUseCases: ['documentary', 'case study', 'evidence and claims'],
    avoidUseCases: ['hype edits', 'aggressive retention cutdowns'],
    defaultCutReasons: ['dead_space', 'setup_cleanup', 'unclear_context'],
    defaultKeepReasons: ['proof_or_evidence', 'source_context_required', 'clear_explanation'],
    aggressionLevel: 2,
    preservePauses: true,
    preserveEvidence: true,
    preserveTutorialSteps: true,
    preserveNaturalness: true,
    tierFit: { basic: true, pro: true, premium: true },
    qaChecks: ['Cuts must not distort claims.', 'Evidence and proof context are preserved or reviewed.'],
  },
  {
    preference: 'tutorial_complete',
    label: 'Tutorial complete',
    description: 'Preserve all required process, product, and learning steps even when slower.',
    bestUseCases: ['tutorials', 'product walkthroughs', 'education', 'SaaS demos'],
    avoidUseCases: ['ultra-short ad cutdowns'],
    defaultCutReasons: ['dead_space', 'mistake', 'setup_cleanup'],
    defaultKeepReasons: ['tutorial_step_required', 'product_demo_required', 'clear_explanation'],
    aggressionLevel: 2,
    preservePauses: true,
    preserveEvidence: true,
    preserveTutorialSteps: true,
    preserveNaturalness: false,
    tierFit: { basic: true, pro: true, premium: true },
    qaChecks: ['No required step is removed.', 'Product/demo continuity is preserved.'],
  },
  {
    preference: 'custom',
    label: 'Custom cleanup',
    description: 'Use explicit cleanup instructions from the user.',
    bestUseCases: ['specific creator direction', 'bespoke pacing requirements'],
    avoidUseCases: ['unclear or contradictory instructions'],
    defaultCutReasons: ['custom'],
    defaultKeepReasons: ['custom'],
    aggressionLevel: 3,
    preservePauses: true,
    preserveEvidence: true,
    preserveTutorialSteps: true,
    preserveNaturalness: true,
    tierFit: { basic: true, pro: true, premium: true },
    qaChecks: ['Custom cleanup still preserves meaning, source order, frame rules, and tier policy.'],
  },
]

export function getCleanupPreferenceProfile(preference: CleanupPreference) {
  return cleanupPreferenceProfiles.find((profile) => profile.preference === preference) ?? cleanupPreferenceProfiles[2]
}

export function getDefaultCleanupPreferenceForCategory(params: {
  category: EditingCategory
  editLevel?: EditLevel
  instructions?: string
}): CleanupPreference {
  const instructions = params.instructions?.toLowerCase() ?? ''

  if (/cut the nonsense|remove all mistakes|remove all retries|fast cut|super tight|high retention/.test(instructions)) {
    return instructions.includes('all mistakes') || instructions.includes('all retries') ? 'aggressive_cleanup' : 'tight_retention_cleanup'
  }

  if (/keep it raw|keep it natural|behind the scenes|bts|authentic|do not over edit/.test(instructions)) {
    return 'preserve_natural'
  }

  if (/tutorial|walkthrough|step by step|demo complete|do not skip steps/.test(instructions)) {
    return 'tutorial_complete'
  }

  if (/documentary|case study|evidence|proof|source context/.test(instructions)) {
    return 'documentary_faithful'
  }

  if (params.category === 'documentary_case_study') return 'documentary_faithful'
  if (params.category === 'education_explainer') return 'balanced_cleanup'
  if (params.category === 'business_brand') return instructions.includes('demo') || instructions.includes('product') ? 'tutorial_complete' : 'balanced_cleanup'
  if (params.category === 'lifestyle') return 'preserve_natural'

  return params.editLevel === 'basic' ? 'light_cleanup' : 'balanced_cleanup'
}

export function recommendCleanupPreference(params: { input: PlannerInput }): CleanupPreferenceRecommendation {
  const recommendedPreference = getDefaultCleanupPreferenceForCategory({
    category: params.input.editingCategory,
    editLevel: params.input.editLevel,
    instructions: params.input.customInstructions,
  })
  const profile = getCleanupPreferenceProfile(recommendedPreference)

  return {
    recommendedPreference,
    reason: `${profile.label} fits ${params.input.editingCategory.replaceAll('_', ' ')} with ${params.input.editLevel} cleanup depth because ${profile.description}`,
    confidence: params.input.clips.length > 0 ? 'medium' : 'low',
    mustConfirm: true,
  }
}

export function getCleanupQaChecks(preference: CleanupPreference) {
  const profile = getCleanupPreferenceProfile(preference)

  return [
    ...profile.qaChecks,
    'Every trim decision has a reason.',
    'Do not cut meaning for pacing.',
    'Mock cleanup does not imply real transcript, silence, or media analysis.',
  ]
}
