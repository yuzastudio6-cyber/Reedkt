import { z } from 'zod'

export const exactEditPreferenceScopeIdSchema = z.string()
  .trim()
  .min(1)
  .max(160)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/)
  .refine((value) => !value.includes('..'), 'Scope id cannot contain traversal segments.')

export const exactEditPreferenceFieldKeys = [
  'editLevel',
  'workflowType',
  'cleanupPreference',
  'visualPreference',
  'moodStyle',
  'creditPreference',
  'targetPlatform',
] as const

export const exactEditPreferenceFieldKeySchema = z.enum(exactEditPreferenceFieldKeys)

export const exactEditPreferenceValuesSchema = z.object({
  editLevel: z.enum(['basic', 'pro', 'premium']),
  workflowType: z.enum([
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
    'custom_let_ai_decide',
  ]),
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
  visualPreference: z.enum([
    'let_ai_decide',
    'keep_visuals_minimal',
    'balanced_visual_mix',
    'more_stroke_motion',
    'more_graphic_design',
    'real_motion_if_useful',
    'no_extra_visuals',
  ]),
  moodStyle: z.enum([
    'clean',
    'premium',
    'cinematic',
    'energetic',
    'emotional',
    'educational',
    'luxury',
    'funny_playful',
    'corporate',
    'viral_fast_paced',
    'let_ai_decide',
  ]),
  creditPreference: z.enum([
    'low_credit_cost',
    'balanced',
    'premium_best_result',
    'let_ai_estimate',
  ]),
  targetPlatform: z.enum([
    'tiktok_reels_shorts',
    'youtube',
    'website',
    'course_training',
    'client_review',
    'custom',
  ]),
}).strict()

export const exactEditPreferencePatchSchema = exactEditPreferenceValuesSchema
  .partial()
  .refine(
    (patch) => exactEditPreferenceFieldKeys.some((field) => patch[field] !== undefined),
    'At least one exact-edit preference field is required.',
  )

export const exactEditPreferenceWorkspaceSchema = z.object({
  workspaceId: exactEditPreferenceScopeIdSchema,
}).strict()

export const initializeExactEditPreferencesSchema = exactEditPreferenceWorkspaceSchema.extend({})

export const updateExactEditPreferencesSchema = z.object({
  workspaceId: exactEditPreferenceScopeIdSchema,
  expectedRevision: z.number().int().nonnegative(),
  patch: exactEditPreferencePatchSchema,
}).strict()

const sha256Schema = z.string().regex(/^[a-f0-9]{64}$/)

const draftPlanEvidenceSchema = z.object({
  id: exactEditPreferenceScopeIdSchema,
  hash: sha256Schema,
  version: z.number().int().positive(),
}).strict()

const draftEstimateEvidenceSchema = z.object({
  id: exactEditPreferenceScopeIdSchema,
  hash: sha256Schema,
  version: z.number().int().positive(),
}).strict()

const sourcePreparationEvidenceSchema = z.discriminatedUnion('status', [
  z.object({ status: z.literal('not_started') }).strict(),
  z.object({ status: z.literal('requires_repreparation') }).strict(),
  z.object({
    status: z.literal('ready'),
    evidenceHash: sha256Schema,
  }).strict(),
])

export const confirmedOutputAspectRatioSchema = z.enum(['9:16', '16:9', '1:1', '4:5', '4:3'])

const frameConfirmationEvidenceSchema = z.discriminatedUnion('status', [
  z.object({ status: z.literal('unconfirmed') }).strict(),
  z.object({ status: z.literal('requires_reconfirmation') }).strict(),
  z.object({
    status: z.literal('confirmed'),
    aspectRatio: confirmedOutputAspectRatioSchema,
    confirmationId: exactEditPreferenceScopeIdSchema,
  }).strict(),
])

export const setExactEditPlanningEvidenceSchema = z.object({
  workspaceId: exactEditPreferenceScopeIdSchema,
  expectedRevision: z.number().int().nonnegative(),
  draftPlan: draftPlanEvidenceSchema.nullable().optional(),
  draftEstimate: draftEstimateEvidenceSchema.nullable().optional(),
  sourcePreparation: sourcePreparationEvidenceSchema.optional(),
  frameConfirmation: frameConfirmationEvidenceSchema.optional(),
}).strict().refine(
  (input) => (
    input.draftPlan !== undefined
    || input.draftEstimate !== undefined
    || input.sourcePreparation !== undefined
    || input.frameConfirmation !== undefined
  ),
  'At least one planning-evidence field is required.',
)

export const invalidateExactEditOutputFrameSchema = z.object({
  workspaceId: exactEditPreferenceScopeIdSchema,
  expectedRevision: z.number().int().nonnegative(),
}).strict()

export const exactEditLifecycleLockPhaseSchema = z.enum([
  'approved_snapshot',
  'credit_reserved',
  'executing',
  'private_review',
  'completed_internal',
  'revision_handoff',
])

export const lockExactEditPreferencesSchema = z.object({
  workspaceId: exactEditPreferenceScopeIdSchema,
  expectedRevision: z.number().int().nonnegative(),
  phase: exactEditLifecycleLockPhaseSchema,
  authorityReferenceId: exactEditPreferenceScopeIdSchema,
}).strict()

export type ExactEditPreferenceFieldKey = typeof exactEditPreferenceFieldKeys[number]
export type ExactEditPreferenceValues = z.infer<typeof exactEditPreferenceValuesSchema>
export type ExactEditPreferencePatch = z.infer<typeof exactEditPreferencePatchSchema>
export type InitializeExactEditPreferencesBody = z.infer<typeof initializeExactEditPreferencesSchema>
export type UpdateExactEditPreferencesBody = z.infer<typeof updateExactEditPreferencesSchema>
export type SetExactEditPlanningEvidenceBody = z.infer<typeof setExactEditPlanningEvidenceSchema>
export type InvalidateExactEditOutputFrameBody = z.infer<typeof invalidateExactEditOutputFrameSchema>
export type ExactEditLifecycleLockPhase = z.infer<typeof exactEditLifecycleLockPhaseSchema>
export type LockExactEditPreferencesBody = z.infer<typeof lockExactEditPreferencesSchema>
