import { z } from 'zod'

export const preferenceScopeIdSchema = z.string()
  .trim()
  .min(1)
  .max(160)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/)
  .refine((value) => !value.includes('..'), 'Scope id cannot contain traversal segments.')

export const editableEditPreferenceValuesSchema = z.object({
  applyConfirmedDefaults: z.boolean(),
  cleanupPreference: z.enum([
    'preserve_natural',
    'light_cleanup',
    'balanced_cleanup',
    'tight_retention_cleanup',
    'aggressive_cleanup',
    'documentary_faithful',
    'tutorial_complete',
    'custom',
  ]),
  creditPreference: z.enum([
    'balanced',
    'low_credit_cost',
    'premium_best_result',
    'let_ai_estimate',
  ]),
  editLevel: z.enum(['basic', 'pro', 'premium']),
  moodStyle: z.enum([
    'clean',
    'premium',
    'cinematic',
    'energetic',
    'educational',
    'luxury',
    'let_ai_decide',
  ]),
  targetPlatform: z.enum([
    'custom',
    'tiktok_reels_shorts',
    'youtube',
    'website',
    'course_training',
    'client_review',
  ]),
  visualPreference: z.enum([
    'let_ai_decide',
    'keep_visuals_minimal',
    'balanced_visual_mix',
    'more_stroke_motion',
    'more_graphic_design',
    'real_motion_if_useful',
    'no_extra_visuals',
  ]),
  workflowType: z.enum([
    'custom_let_ai_decide',
    'simple_clean_edit',
    'social_short_viral_clip',
    'talking_head_personal_brand',
    'podcast_clip',
    'vlog_lifestyle',
    'product_demo',
    'real_estate_property_tour',
    'education_explainer',
    'marketing_ad',
    'testimonial_case_study',
  ]),
}).strict()

export const upsertEditPreferencesSchema = z.object({
  workspaceId: preferenceScopeIdSchema,
  expectedSnapshotId: z.string().trim().min(1).max(160).optional(),
  preferences: editableEditPreferenceValuesSchema,
}).strict()
