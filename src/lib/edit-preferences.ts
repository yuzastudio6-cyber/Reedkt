import type {
  CleanupPreference,
  CreditPreference,
  EditLevel,
  MoodStyle,
  TargetPlatform,
  VideoWorkflowType,
  VisualPreference,
} from '../types/reeditpro'
import type { LocalInternalEditSetupSnapshot } from './local-project-handoff'

export type EditPreferencePersistence =
  | 'browser_local_edit_preferences'
  | 'authenticated_private_internal_backend'

export type LocalEditPreferenceDefaults = {
  editLevel: EditLevel
  workflowType: VideoWorkflowType
  cleanupPreference: CleanupPreference
  visualPreference: VisualPreference
  moodStyle: MoodStyle
  creditPreference: CreditPreference
  targetPlatform: TargetPlatform
  applyConfirmedDefaults: boolean
  snapshotId: string
  updatedAt: string
  persistence: EditPreferencePersistence
}

export const DEFAULT_LOCAL_EDIT_PREFERENCES: LocalEditPreferenceDefaults = {
  editLevel: 'pro',
  workflowType: 'custom_let_ai_decide',
  cleanupPreference: 'balanced_cleanup',
  visualPreference: 'balanced_visual_mix',
  moodStyle: 'clean',
  creditPreference: 'balanced',
  targetPlatform: 'custom',
  applyConfirmedDefaults: true,
  snapshotId: 'local-edit-preferences-default',
  updatedAt: 'not_saved',
  persistence: 'browser_local_edit_preferences',
}

export const editLevelPreferenceOptions: Array<{ value: EditLevel; label: string; description: string }> = [
  { value: 'basic', label: 'Normal', description: 'Clean professional edit with lower compute.' },
  { value: 'pro', label: 'Premium', description: 'Balanced polish for most internal tests.' },
  { value: 'premium', label: 'Ultra Premium', description: 'Deeper creative planning for complex edits.' },
]

export const workflowPreferenceOptions: Array<{ value: VideoWorkflowType; label: string; description: string }> = [
  { value: 'custom_let_ai_decide', label: 'Let ReeditPro decide', description: 'Choose the workflow from the source and your current direction.' },
  { value: 'simple_clean_edit', label: 'Clean edit', description: 'Preserve the natural structure with professional cleanup.' },
  { value: 'social_short_viral_clip', label: 'Social short', description: 'Plan a concise, retention-aware short-form edit.' },
  { value: 'talking_head_personal_brand', label: 'Talking head', description: 'Polish speaker-led footage while preserving trust and authenticity.' },
  { value: 'podcast_clip', label: 'Podcast clip', description: 'Protect conversational meaning while shaping a focused highlight.' },
  { value: 'vlog_lifestyle', label: 'Vlog or lifestyle', description: 'Keep a natural story rhythm with selective tightening.' },
  { value: 'product_demo', label: 'Product demo', description: 'Keep product steps clear, complete, and benefit-led.' },
  { value: 'real_estate_property_tour', label: 'Property tour', description: 'Preserve spatial continuity with calm, polished pacing.' },
  { value: 'education_explainer', label: 'Education explainer', description: 'Prioritize structured clarity, labels, and complete teaching steps.' },
  { value: 'marketing_ad', label: 'Marketing ad', description: 'Plan a persuasive hook, proof, offer, and clear call to action.' },
  { value: 'testimonial_case_study', label: 'Testimonial or case study', description: 'Preserve proof and context while shaping a credible story.' },
]

export const cleanupPreferenceOptions: Array<{ value: CleanupPreference; label: string; description: string }> = [
  { value: 'preserve_natural', label: 'Preserve natural rhythm', description: 'Keep human pauses and authenticity unless a cut is clearly needed.' },
  { value: 'light_cleanup', label: 'Light cleanup', description: 'Remove only obvious dead space, mistakes, and unusable moments.' },
  { value: 'balanced_cleanup', label: 'Balanced cleanup', description: 'Tighten filler and repeats while preserving meaning.' },
  { value: 'tight_retention_cleanup', label: 'Tight retention cleanup', description: 'Use faster pacing for short-form retention without changing meaning.' },
  { value: 'aggressive_cleanup', label: 'Aggressive cleanup', description: 'Create a dense cut; risky meaning changes still require review.' },
  { value: 'documentary_faithful', label: 'Documentary faithful', description: 'Protect evidence, qualifiers, source context, and neutral meaning.' },
  { value: 'tutorial_complete', label: 'Tutorial complete', description: 'Keep every required step even when a section is slower.' },
]

export const visualPreferenceOptions: Array<{ value: VisualPreference; label: string; description: string }> = [
  { value: 'let_ai_decide', label: 'Let ReeditPro decide', description: 'Choose visuals only when they improve the story or explanation.' },
  { value: 'keep_visuals_minimal', label: 'Keep visuals minimal', description: 'Use restrained supporting visuals and protect the speaker.' },
  { value: 'balanced_visual_mix', label: 'Balanced visual mix', description: 'Balance source footage, story motion, and explanatory graphics.' },
  { value: 'more_stroke_motion', label: 'More story motion', description: 'Favor Stroke Motion for useful story and metaphor moments.' },
  { value: 'more_graphic_design', label: 'More graphics', description: 'Favor VisualExplain for concepts, steps, labels, and proof.' },
  { value: 'real_motion_if_useful', label: 'Real Motion when justified', description: 'Allow premium realistic motion only where its value supports the cost.' },
  { value: 'no_extra_visuals', label: 'No extra visuals', description: 'Keep the edit focused on source footage, cleanup, captions, and sound.' },
]

export const moodPreferenceOptions: Array<{ value: MoodStyle; label: string }> = [
  { value: 'clean', label: 'Clean' },
  { value: 'premium', label: 'Premium' },
  { value: 'cinematic', label: 'Cinematic' },
  { value: 'energetic', label: 'Energetic' },
  { value: 'educational', label: 'Educational' },
  { value: 'luxury', label: 'Luxury' },
  { value: 'let_ai_decide', label: 'Let the editor decide' },
]

export const creditPreferenceOptions: Array<{ value: CreditPreference; label: string }> = [
  { value: 'balanced', label: 'Balanced' },
  { value: 'low_credit_cost', label: 'Save credits' },
  { value: 'premium_best_result', label: 'Best result' },
  { value: 'let_ai_estimate', label: 'Let the estimate decide' },
]

export const targetPlatformPreferenceOptions: Array<{ value: TargetPlatform; label: string }> = [
  { value: 'custom', label: 'Ask per edit' },
  { value: 'tiktok_reels_shorts', label: 'TikTok / Reels / Shorts' },
  { value: 'youtube', label: 'YouTube' },
  { value: 'website', label: 'Website' },
  { value: 'course_training', label: 'Course or training' },
  { value: 'client_review', label: 'Client review' },
]

export function createEditSetupSnapshotFromPreferences(
  preferences: LocalEditPreferenceDefaults,
  now: Date = new Date(),
): LocalInternalEditSetupSnapshot {
  const confirmed = preferences.applyConfirmedDefaults
  const appliedAt = now.toISOString()
  return {
    editLevel: preferences.editLevel,
    editLevelConfirmed: confirmed,
    workflowType: preferences.workflowType,
    cleanupPreference: preferences.cleanupPreference,
    cleanupPreferenceConfirmed: confirmed,
    visualPreference: preferences.visualPreference,
    visualPreferenceConfirmed: confirmed,
    moodStyle: preferences.moodStyle,
    creditPreference: preferences.creditPreference,
    targetPlatform: preferences.targetPlatform,
    preferenceDefaultsApplied: true,
    preferenceSnapshotId: preferences.snapshotId,
    preferenceSnapshotAppliedAt: appliedAt,
    preferencePersistenceSource: preferences.persistence,
    preferenceBaseline: {
      editLevel: preferences.editLevel,
      workflowType: preferences.workflowType,
      cleanupPreference: preferences.cleanupPreference,
      visualPreference: preferences.visualPreference,
      moodStyle: preferences.moodStyle,
      creditPreference: preferences.creditPreference,
      targetPlatform: preferences.targetPlatform,
      snapshotId: preferences.snapshotId,
      capturedAt: appliedAt,
      persistenceSource: preferences.persistence,
      provenance: 'saved_edit_preferences',
    },
    preferenceOverrideKeys: [],
    preferenceRevision: 0,
  }
}

export function summarizeLocalEditPreferences(preferences: LocalEditPreferenceDefaults): string {
  return [
    labelFor(editLevelPreferenceOptions, preferences.editLevel),
    labelFor(cleanupPreferenceOptions, preferences.cleanupPreference),
    labelFor(visualPreferenceOptions, preferences.visualPreference),
  ].filter(Boolean).join(' / ')
}

export function normalizeEditPreferenceDefaults(
  value: unknown,
  persistence: EditPreferencePersistence = 'browser_local_edit_preferences',
): LocalEditPreferenceDefaults {
  if (!value || typeof value !== 'object') return DEFAULT_LOCAL_EDIT_PREFERENCES
  const record = value as Partial<LocalEditPreferenceDefaults>

  return {
    editLevel: isOneOf(record.editLevel, editLevelPreferenceOptions) ? record.editLevel : DEFAULT_LOCAL_EDIT_PREFERENCES.editLevel,
    workflowType: isOneOf(record.workflowType, workflowPreferenceOptions) ? record.workflowType : DEFAULT_LOCAL_EDIT_PREFERENCES.workflowType,
    cleanupPreference: isOneOf(record.cleanupPreference, cleanupPreferenceOptions) ? record.cleanupPreference : DEFAULT_LOCAL_EDIT_PREFERENCES.cleanupPreference,
    visualPreference: isOneOf(record.visualPreference, visualPreferenceOptions) ? record.visualPreference : DEFAULT_LOCAL_EDIT_PREFERENCES.visualPreference,
    moodStyle: isOneOf(record.moodStyle, moodPreferenceOptions) ? record.moodStyle : DEFAULT_LOCAL_EDIT_PREFERENCES.moodStyle,
    creditPreference: isOneOf(record.creditPreference, creditPreferenceOptions) ? record.creditPreference : DEFAULT_LOCAL_EDIT_PREFERENCES.creditPreference,
    targetPlatform: isOneOf(record.targetPlatform, targetPlatformPreferenceOptions) ? record.targetPlatform : DEFAULT_LOCAL_EDIT_PREFERENCES.targetPlatform,
    applyConfirmedDefaults: typeof record.applyConfirmedDefaults === 'boolean'
      ? record.applyConfirmedDefaults
      : DEFAULT_LOCAL_EDIT_PREFERENCES.applyConfirmedDefaults,
    snapshotId: typeof record.snapshotId === 'string' && record.snapshotId.trim()
      ? record.snapshotId.trim().slice(0, 120)
      : DEFAULT_LOCAL_EDIT_PREFERENCES.snapshotId,
    updatedAt: typeof record.updatedAt === 'string' && record.updatedAt.trim()
      ? record.updatedAt.trim().slice(0, 80)
      : DEFAULT_LOCAL_EDIT_PREFERENCES.updatedAt,
    persistence,
  }
}

function labelFor<T extends string>(options: Array<{ value: T; label: string }>, value: T) {
  return options.find((option) => option.value === value)?.label ?? value.replaceAll('_', ' ')
}

function isOneOf<T extends string>(value: unknown, options: Array<{ value: T }>): value is T {
  return typeof value === 'string' && options.some((option) => option.value === value)
}
