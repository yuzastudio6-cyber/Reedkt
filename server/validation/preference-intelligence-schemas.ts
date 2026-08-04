import { z } from 'zod'
import { exactEditPreferenceScopeIdSchema } from './exact-edit-preference-schemas'

export const preferenceRuntimeStateSchema = z.enum([
  'real_beta_live',
  'mock_local',
  'metadata_only',
  'browser_local_only',
  'docs_only',
  'future_gated',
  'blocked_by_auth',
  'blocked_by_worker',
  'blocked_by_persistence',
  'production_ready',
])

export const preferenceRuleCategorySchema = z.enum([
  'visual_style',
  'captions',
  'color_grade',
  'spacing_layout',
  'motion_zoom',
  'transitions',
  'pacing',
  'story_structure',
  'broll',
  'audio',
  'graphics',
  'platform_export',
  'accessibility_readability',
  'do_not_copy',
])

export const preferenceEvidenceTypeSchema = z.enum([
  'reference_video',
  'previous_approved_edit',
  'reference_image',
  'manual_description',
  'brand_guidance',
  'caption_example',
  'audio_music_example',
  'broll_example',
  'do_not_copy_instruction',
])

export const preferenceObservationInputSchema = z.object({
  category: preferenceRuleCategorySchema,
  instruction: z.string().trim().min(1).max(1_000),
  reason: z.string().trim().min(1).max(1_000),
  confidence: z.number().min(0).max(1),
  transferability: z.enum(['transferable', 'non_transferable']),
  conditions: z.array(z.string().trim().min(1).max(300)).max(16).default([]),
  exceptions: z.array(z.string().trim().min(1).max(300)).max(16).default([]),
  prohibitedCopy: z.boolean(),
}).strict().superRefine((observation, context) => {
  if (
    observation.category === 'do_not_copy'
    && (!observation.prohibitedCopy || observation.transferability !== 'non_transferable')
  ) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Do-not-copy observations must be non-transferable and prohibited from copying.',
    })
  }
  if (observation.transferability === 'non_transferable' && !observation.prohibitedCopy) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Non-transferable observations must be marked prohibitedCopy.',
    })
  }
})

export const createReusableEditPreferenceSchema = z.object({
  workspaceId: exactEditPreferenceScopeIdSchema,
  name: z.string().trim().min(1).max(120),
  description: z.string().trim().max(1_000).optional(),
}).strict()

export const updateReusableEditPreferenceSchema = z.object({
  workspaceId: exactEditPreferenceScopeIdSchema,
  expectedRevision: z.number().int().positive(),
  name: z.string().trim().min(1).max(120).optional(),
  description: z.string().trim().max(1_000).nullable().optional(),
}).strict().refine(
  (input) => input.name !== undefined || input.description !== undefined,
  'At least one reusable preference field is required.',
)

export const archiveReusableEditPreferenceSchema = z.object({
  workspaceId: exactEditPreferenceScopeIdSchema,
  expectedRevision: z.number().int().positive(),
}).strict()

export const preferenceWorkspaceQuerySchema = z.object({
  workspaceId: exactEditPreferenceScopeIdSchema,
}).strict()

export const startPreferenceStudySchema = z.object({
  workspaceId: exactEditPreferenceScopeIdSchema,
  title: z.string().trim().min(1).max(160).optional(),
}).strict()

export const appendPreferenceStudyMessageSchema = z.object({
  workspaceId: exactEditPreferenceScopeIdSchema,
  expectedSessionRevision: z.number().int().positive(),
  content: z.string().trim().min(1).max(8_000),
  clientMessageId: exactEditPreferenceScopeIdSchema,
}).strict()

export const appendPreferenceStudyAssistantMessageSchema = z.object({
  workspaceId: exactEditPreferenceScopeIdSchema,
  expectedSessionRevision: z.number().int().positive(),
  content: z.string().trim().min(1).max(8_000),
  runtimeState: preferenceRuntimeStateSchema,
}).strict()

export const addPreferenceStudyQuestionSchema = z.object({
  workspaceId: exactEditPreferenceScopeIdSchema,
  expectedSessionRevision: z.number().int().positive(),
  prompt: z.string().trim().min(1).max(2_000),
  category: preferenceRuleCategorySchema,
  responseType: z.enum(['free_text', 'single_choice', 'multi_choice', 'boolean']),
  options: z.array(z.string().trim().min(1).max(200)).max(20).default([]),
  required: z.boolean().default(true),
  runtimeState: preferenceRuntimeStateSchema,
}).strict().superRefine((question, context) => {
  const choiceQuestion = question.responseType === 'single_choice' || question.responseType === 'multi_choice'
  if (choiceQuestion && question.options.length < 2) {
    context.addIssue({ code: z.ZodIssueCode.custom, message: 'Choice questions require at least two options.' })
  }
  if (!choiceQuestion && question.options.length > 0) {
    context.addIssue({ code: z.ZodIssueCode.custom, message: 'Only choice questions may include options.' })
  }
})

export const answerPreferenceStudyQuestionSchema = z.object({
  workspaceId: exactEditPreferenceScopeIdSchema,
  expectedSessionRevision: z.number().int().positive(),
  answerText: z.string().trim().min(1).max(4_000),
  selectedOptions: z.array(z.string().trim().min(1).max(200)).max(20).default([]),
}).strict()

export const addPreferenceEvidenceSchema = z.object({
  workspaceId: exactEditPreferenceScopeIdSchema,
  expectedSessionRevision: z.number().int().positive(),
  evidenceType: preferenceEvidenceTypeSchema,
  label: z.string().trim().min(1).max(240),
  privateAssetId: exactEditPreferenceScopeIdSchema.optional(),
  manualDescription: z.string().trim().max(12_000).optional(),
  metadata: z.object({
    mimeType: z.string().trim().min(1).max(160).optional(),
    durationSeconds: z.number().nonnegative().max(86_400).optional(),
    width: z.number().int().positive().max(32_768).optional(),
    height: z.number().int().positive().max(32_768).optional(),
    hasAudioTrack: z.boolean().optional(),
    sourceKind: z.enum(['user_upload', 'previous_approved_edit', 'manual', 'private_asset']).optional(),
  }).strict().default({}),
  observations: z.array(preferenceObservationInputSchema).max(64).default([]),
}).strict().superRefine((evidence, context) => {
  if (!evidence.privateAssetId && !evidence.manualDescription && evidence.observations.length === 0) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Evidence requires a private asset ID, manual description, or structured observation.',
    })
  }
  const mediaTypes = new Set(['reference_video', 'previous_approved_edit', 'reference_image', 'audio_music_example'])
  if (mediaTypes.has(evidence.evidenceType) && !evidence.privateAssetId) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Media evidence requires a server-owned private asset ID; public URLs are not accepted.',
    })
  }
})

export const requestPreferenceEvidenceAnalysisSchema = z.object({
  workspaceId: exactEditPreferenceScopeIdSchema,
  expectedSessionRevision: z.number().int().positive(),
}).strict()

export const buildPreferenceDnaSchema = z.object({
  workspaceId: exactEditPreferenceScopeIdSchema,
  expectedSessionRevision: z.number().int().positive(),
}).strict()

export const runPreferenceDnaQaSchema = z.object({
  workspaceId: exactEditPreferenceScopeIdSchema,
  expectedPreferenceRevision: z.number().int().positive(),
  dnaVersionId: exactEditPreferenceScopeIdSchema,
}).strict()

export const approvePreferenceDnaSchema = z.object({
  workspaceId: exactEditPreferenceScopeIdSchema,
  expectedPreferenceRevision: z.number().int().positive(),
  dnaVersionId: exactEditPreferenceScopeIdSchema,
  expectedDnaVersion: z.number().int().positive(),
}).strict()

export const preferenceApplicationSourceSchema = z.enum(['selector', 'main_chat_tag'])

export const applyPreferenceToEditSessionSchema = z.object({
  workspaceId: exactEditPreferenceScopeIdSchema,
  preferenceId: exactEditPreferenceScopeIdSchema,
  expectedApplicationVersion: z.number().int().nonnegative(),
  source: preferenceApplicationSourceSchema,
  tagReferenceId: exactEditPreferenceScopeIdSchema.optional(),
}).strict().superRefine((input, context) => {
  if (input.source === 'main_chat_tag' && !input.tagReferenceId) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Main Chat preference tags require a stable structured tag reference ID.',
    })
  }
  if (input.source === 'selector' && input.tagReferenceId) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Selector application must not include a chat-tag reference.',
    })
  }
})

export const clearPreferenceFromEditSessionSchema = z.object({
  workspaceId: exactEditPreferenceScopeIdSchema,
  expectedApplicationVersion: z.number().int().nonnegative(),
  source: preferenceApplicationSourceSchema,
  tagReferenceId: exactEditPreferenceScopeIdSchema.optional(),
}).strict().superRefine((input, context) => {
  if (input.source === 'main_chat_tag' && !input.tagReferenceId) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Main Chat clear tags require a stable structured tag reference ID.',
    })
  }
})

export const preferenceContextAudienceSchema = z.enum([
  'planner',
  'main_chat',
  'marker_chat',
  'edit_brief',
])

export const preferenceContextQuerySchema = z.object({
  workspaceId: exactEditPreferenceScopeIdSchema,
  audience: preferenceContextAudienceSchema,
}).strict()

export type PreferenceRuntimeState = z.infer<typeof preferenceRuntimeStateSchema>
export type PreferenceRuleCategory = z.infer<typeof preferenceRuleCategorySchema>
export type PreferenceEvidenceType = z.infer<typeof preferenceEvidenceTypeSchema>
export type PreferenceObservationInput = z.infer<typeof preferenceObservationInputSchema>
export type PreferenceApplicationSource = z.infer<typeof preferenceApplicationSourceSchema>
export type PreferenceContextAudience = z.infer<typeof preferenceContextAudienceSchema>
export type CreateReusableEditPreferenceBody = z.infer<typeof createReusableEditPreferenceSchema>
export type UpdateReusableEditPreferenceBody = z.infer<typeof updateReusableEditPreferenceSchema>
export type StartPreferenceStudyBody = z.infer<typeof startPreferenceStudySchema>
export type AppendPreferenceStudyMessageBody = z.infer<typeof appendPreferenceStudyMessageSchema>
export type AppendPreferenceStudyAssistantMessageBody = z.infer<typeof appendPreferenceStudyAssistantMessageSchema>
export type AddPreferenceStudyQuestionBody = z.infer<typeof addPreferenceStudyQuestionSchema>
export type AnswerPreferenceStudyQuestionBody = z.infer<typeof answerPreferenceStudyQuestionSchema>
export type AddPreferenceEvidenceBody = z.infer<typeof addPreferenceEvidenceSchema>
export type ApplyPreferenceToEditSessionBody = z.infer<typeof applyPreferenceToEditSessionSchema>
export type ClearPreferenceFromEditSessionBody = z.infer<typeof clearPreferenceFromEditSessionSchema>
