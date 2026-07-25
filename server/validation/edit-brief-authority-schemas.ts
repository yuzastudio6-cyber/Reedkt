import { z } from 'zod'
import { resolveProfessionalExportFrame } from '../../src/lib/professional-export-policy'
import {
  PROFESSIONAL_EXPORT_PROFILE_IDS,
  type ProfessionalExportAspectRatio,
} from '../../src/types/professional-export'

export const editBriefScopeIdSchema = z.string().trim().min(1).max(160)
  .refine(
    (value) => !value.includes('..') && /^[A-Za-z0-9][A-Za-z0-9._:-]*$/.test(value),
    'A safe scope identifier is required.',
  )

const boundedText = (maximum: number) => z.string().trim().min(1).max(maximum)
const optionalText = (maximum: number) => z.string().trim().max(maximum).optional()
const optionalPrivateContextText = (maximum: number) => optionalText(maximum).refine(
  (value) => value === undefined || !/(?:https?|file|gs):\/\//i.test(value),
  'Private context summaries must not contain external or filesystem URLs.',
)
const uniqueIds = z.array(editBriefScopeIdSchema).max(64).default([])
  .refine((values) => new Set(values).size === values.length, 'IDs must be unique.')

export const editBriefRuntimeStateSchema = z.enum([
  'mock_local',
  'metadata_only',
  'future_gated',
  'blocked_by_worker',
  'blocked_by_persistence',
])

export const editBriefScopeSchema = z.object({
  workspaceId: editBriefScopeIdSchema,
  projectId: editBriefScopeIdSchema,
  editSessionId: editBriefScopeIdSchema,
}).strict()

export const editBriefMutationControlSchema = z.object({
  expectedRevision: z.number().int().nonnegative(),
  idempotencyKey: editBriefScopeIdSchema,
}).strict()

export const editBriefFieldsSchema = z.object({
  goal: boundedText(4_000),
  audience: optionalText(1_000),
  deliverable: optionalText(1_000),
  mustIncludeNotes: z.array(boundedText(1_000)).max(32).default([]),
  avoidNotes: z.array(boundedText(1_000)).max(32).default([]),
  additionalNotes: optionalText(8_000),
  targetPlatforms: z.array(z.enum([
    'tiktok',
    'instagram_reels',
    'youtube_shorts',
    'youtube',
    'linkedin',
    'facebook',
    'x',
    'website',
    'custom',
  ])).max(9).optional(),
  targetDurationMs: z.number().int().positive().max(86_400_000).optional(),
  styleKeywords: z.array(boundedText(120)).max(32).optional(),
  pacingPreference: z.enum([
    'slow',
    'natural',
    'tight',
    'fast',
    'very_fast',
    'ai_decides',
  ]).optional(),
  captionPreference: z.enum([
    'none',
    'minimal',
    'standard',
    'dynamic',
    'bold_creator',
    'premium_subtle',
    'ai_decides',
  ]).optional(),
  musicPreference: z.enum([
    'none',
    'subtle',
    'energetic',
    'cinematic',
    'corporate',
    'trend_based',
    'ai_decides',
  ]).optional(),
  bRollPreference: optionalText(1_000),
  mustUseAssetIds: z.array(editBriefScopeIdSchema).max(64).optional()
    .refine((values) => values === undefined || new Set(values).size === values.length, 'Must-use asset IDs must be unique.'),
  avoidAssetIds: z.array(editBriefScopeIdSchema).max(64).optional()
    .refine((values) => values === undefined || new Set(values).size === values.length, 'Avoid asset IDs must be unique.'),
  brandNotes: optionalText(4_000),
  specialInstructions: optionalText(8_000),
  userProvidedReferenceUrls: z.array(z.string().trim().url().max(2_048)).max(16).optional(),
  status: z.enum(['draft', 'ready']).default('draft'),
}).strict()

export const createEditBriefSchema = editBriefScopeSchema.extend({
  expectedRevision: z.number().int().nonnegative(),
  idempotencyKey: editBriefScopeIdSchema,
  brief: editBriefFieldsSchema,
}).strict()

const editBriefFieldsPatchSchema = z.object({
  goal: boundedText(4_000).optional(),
  audience: z.string().trim().max(1_000).nullable().optional(),
  deliverable: z.string().trim().max(1_000).nullable().optional(),
  mustIncludeNotes: z.array(boundedText(1_000)).max(32).optional(),
  avoidNotes: z.array(boundedText(1_000)).max(32).optional(),
  additionalNotes: z.string().trim().max(8_000).nullable().optional(),
  targetPlatforms: editBriefFieldsSchema.shape.targetPlatforms,
  targetDurationMs: z.number().int().positive().max(86_400_000).nullable().optional(),
  styleKeywords: editBriefFieldsSchema.shape.styleKeywords,
  pacingPreference: editBriefFieldsSchema.shape.pacingPreference.nullable().optional(),
  captionPreference: editBriefFieldsSchema.shape.captionPreference.nullable().optional(),
  musicPreference: editBriefFieldsSchema.shape.musicPreference.nullable().optional(),
  bRollPreference: z.string().trim().max(1_000).nullable().optional(),
  mustUseAssetIds: editBriefFieldsSchema.shape.mustUseAssetIds,
  avoidAssetIds: editBriefFieldsSchema.shape.avoidAssetIds,
  brandNotes: z.string().trim().max(4_000).nullable().optional(),
  specialInstructions: z.string().trim().max(8_000).nullable().optional(),
  userProvidedReferenceUrls: editBriefFieldsSchema.shape.userProvidedReferenceUrls,
  status: z.enum(['draft', 'ready']).optional(),
}).strict().refine(
  (value) => Object.keys(value).length > 0,
  'At least one Edit Brief field is required.',
)

export const updateEditBriefSchema = editBriefScopeSchema.extend({
  expectedRevision: z.number().int().positive(),
  idempotencyKey: editBriefScopeIdSchema,
  patch: editBriefFieldsPatchSchema,
}).strict()

export const editBriefAspectRatioSchema = z.enum(['9:16', '16:9', '1:1', '4:5', '4:3', 'custom'])
export const editBriefFrameRateSchema = z.union([
  z.literal(24), z.literal(25), z.literal(30), z.literal(50), z.literal(60),
])

export const editBriefExportSettingsSchema = z.object({
  platformTarget: boundedText(120),
  aspectRatio: editBriefAspectRatioSchema,
  customWidth: z.number().int().min(320).max(16_384).optional(),
  customHeight: z.number().int().min(320).max(16_384).optional(),
  resolution: z.string().trim().regex(/^\d{3,5}x\d{3,5}$/),
  resolutionProfileId: z.enum(PROFESSIONAL_EXPORT_PROFILE_IDS).optional(),
  frameRate: editBriefFrameRateSchema,
  confirmationStatus: z.enum(['recommended', 'confirmed']),
  confirmationId: editBriefScopeIdSchema.optional(),
}).strict().superRefine((value, context) => {
  const custom = value.aspectRatio === 'custom'
  if (custom !== Boolean(value.customWidth && value.customHeight)) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Custom aspect ratio requires both customWidth and customHeight, and non-custom ratios must omit them.',
    })
  }
  if ((value.confirmationStatus === 'confirmed') !== Boolean(value.confirmationId)) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Confirmed export settings require confirmationId; recommendations must not claim confirmation.',
    })
  }
  const [outputWidth, outputHeight] = value.resolution.split('x').map(Number)
  if (
    !outputWidth || !outputHeight
    || outputWidth < 320 || outputWidth > 16_384
    || outputHeight < 320 || outputHeight > 16_384
  ) {
    context.addIssue({ code: z.ZodIssueCode.custom, message: 'Resolution dimensions are outside the supported output range.' })
    return
  }
  const expectedRatio = value.aspectRatio === 'custom'
    ? (value.customWidth! / value.customHeight!)
    : ({ '9:16': 9 / 16, '16:9': 16 / 9, '1:1': 1, '4:5': 4 / 5, '4:3': 4 / 3 } as const)[value.aspectRatio]
  if (Math.abs((outputWidth / outputHeight) - expectedRatio) > 0.01) {
    context.addIssue({ code: z.ZodIssueCode.custom, message: 'Resolution dimensions must match the selected output aspect ratio.' })
  }
  if (value.resolutionProfileId && value.aspectRatio === 'custom') {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Registered professional resolution profiles require a registered output aspect ratio.',
    })
  } else if (value.resolutionProfileId) {
    const expectedFrame = resolveProfessionalExportFrame(
      value.aspectRatio as ProfessionalExportAspectRatio,
      value.resolutionProfileId,
    )
    if (outputWidth !== expectedFrame.width || outputHeight !== expectedFrame.height) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: `${expectedFrame.label} requires ${expectedFrame.width}x${expectedFrame.height} for ${value.aspectRatio}.`,
      })
    }
  }
})

export const setEditBriefExportSettingsSchema = editBriefScopeSchema.extend({
  expectedRevision: z.number().int().nonnegative(),
  idempotencyKey: editBriefScopeIdSchema,
  settings: editBriefExportSettingsSchema,
}).strict()

export const editBriefMarkerTypeSchema = z.enum([
  'note', 'keep', 'cut', 'broll', 'caption', 'music', 'sfx', 'graphic',
  'transition', 'color', 'story', 'clarification', 'approval',
])

const editBriefMarkerFieldsBaseSchema = z.object({
  markerType: editBriefMarkerTypeSchema,
  timeKind: z.enum(['point', 'range']),
  startSeconds: z.number().finite().nonnegative().max(86_400),
  endSeconds: z.number().finite().positive().max(86_400).optional(),
  priority: z.enum(['low', 'normal', 'high', 'must_follow']).default('normal'),
  title: boundedText(240),
  note: boundedText(8_000),
}).strict()

export const editBriefMarkerFieldsSchema = editBriefMarkerFieldsBaseSchema.superRefine((marker, context) => {
  if (marker.timeKind === 'point' && marker.endSeconds !== undefined) {
    context.addIssue({ code: z.ZodIssueCode.custom, message: 'Point markers must omit endSeconds.' })
  }
  if (marker.timeKind === 'range' && (marker.endSeconds === undefined || marker.endSeconds <= marker.startSeconds)) {
    context.addIssue({ code: z.ZodIssueCode.custom, message: 'Range markers require endSeconds after startSeconds.' })
  }
})

export const createEditBriefMarkerSchema = editBriefScopeSchema.extend({
  expectedRevision: z.number().int().nonnegative(),
  idempotencyKey: editBriefScopeIdSchema,
  marker: editBriefMarkerFieldsSchema,
}).strict()

export const updateEditBriefMarkerSchema = editBriefScopeSchema.extend({
  expectedRevision: z.number().int().positive(),
  idempotencyKey: editBriefScopeIdSchema,
  markerId: editBriefScopeIdSchema,
  patch: editBriefMarkerFieldsBaseSchema.partial().omit({ endSeconds: true }).extend({
    endSeconds: z.number().finite().positive().max(86_400).nullable().optional(),
  }).refine(
    (value) => Object.keys(value).length > 0,
    'At least one marker field is required.',
  ),
}).strict()

export const editBriefMarkerActionSchema = editBriefScopeSchema.extend({
  expectedRevision: z.number().int().positive(),
  idempotencyKey: editBriefScopeIdSchema,
  markerId: editBriefScopeIdSchema,
}).strict()

export const appendEditBriefMarkerMessageSchema = editBriefScopeSchema.extend({
  expectedRevision: z.number().int().positive(),
  idempotencyKey: editBriefScopeIdSchema,
  markerId: editBriefScopeIdSchema,
  role: z.enum(['user', 'assistant', 'system']),
  content: boundedText(8_000),
  clientMessageId: editBriefScopeIdSchema.optional(),
  runtimeState: editBriefRuntimeStateSchema,
}).strict().superRefine((message, context) => {
  if (message.role === 'user' && message.runtimeState !== 'mock_local') {
    context.addIssue({ code: z.ZodIssueCode.custom, message: 'User messages use mock_local internal-test persistence.' })
  }
})

export const editBriefStructuredIntentSchema = z.object({
  action: boundedText(160),
  instruction: boundedText(8_000),
  visualBehavior: optionalText(2_000),
  audioBehavior: optionalText(2_000),
  captionBehavior: optionalText(2_000),
  requiredPrivateAssetIds: uniqueIds,
  confidence: z.number().min(0).max(1),
  status: z.enum(['draft', 'confirmed', 'needs_clarification']),
  plannerHints: z.array(boundedText(1_000)).max(32).default([]),
  doNotCopy: z.array(boundedText(1_000)).max(32).default([]),
  runtimeState: editBriefRuntimeStateSchema,
}).strict()

export const setEditBriefMarkerIntentSchema = editBriefScopeSchema.extend({
  expectedRevision: z.number().int().positive(),
  idempotencyKey: editBriefScopeIdSchema,
  markerId: editBriefScopeIdSchema,
  intent: editBriefStructuredIntentSchema,
}).strict()

export const editBriefAttachmentMetadataSchema = z.object({
  privateAssetId: editBriefScopeIdSchema,
  label: boundedText(240).refine(
    (value) => !/(?:https?|file|gs):\/\//i.test(value),
    'Attachment labels must not contain asset URLs.',
  ),
  kind: z.enum(['image', 'video', 'audio', 'reference']),
  mimeType: optionalText(160),
  durationSeconds: z.number().finite().nonnegative().max(86_400).optional(),
  width: z.number().int().positive().max(32_768).optional(),
  height: z.number().int().positive().max(32_768).optional(),
}).strict()

export const addEditBriefAttachmentSchema = editBriefScopeSchema.extend({
  expectedRevision: z.number().int().positive(),
  idempotencyKey: editBriefScopeIdSchema,
  markerId: editBriefScopeIdSchema,
  attachment: editBriefAttachmentMetadataSchema,
}).strict()

export const editBriefSourceContextSchema = z.object({
  sourceAssetIds: z.array(editBriefScopeIdSchema).min(1).max(64)
    .refine((values) => new Set(values).size === values.length, 'Source asset IDs must be unique.'),
  sourceCandidateHashSha256: z.string().regex(/^[a-f0-9]{64}$/).optional(),
  sourceSequenceHashSha256: z.string().regex(/^[a-f0-9]{64}$/).optional(),
  sourceAuthorityRevision: z.number().int().positive().optional(),
  sourceDurationSeconds: z.number().finite().positive().max(86_400).optional(),
  sourceSequenceSummary: optionalPrivateContextText(4_000),
  transcriptSummary: optionalPrivateContextText(6_000),
  transcriptWindowSummary: optionalPrivateContextText(6_000),
  visualSummary: optionalPrivateContextText(6_000),
  visualWindowSummary: optionalPrivateContextText(6_000),
  audioSummary: optionalPrivateContextText(4_000),
  audioWindowSummary: optionalPrivateContextText(4_000),
  graphicTextSummary: optionalPrivateContextText(4_000),
  runtimeState: editBriefRuntimeStateSchema,
}).strict().superRefine((value, context) => {
  if (
    value.sourceDurationSeconds === undefined
    && !value.sourceSequenceSummary
    && !value.transcriptSummary
    && !value.transcriptWindowSummary
    && !value.visualSummary
    && !value.visualWindowSummary
    && !value.audioSummary
    && !value.audioWindowSummary
    && !value.graphicTextSummary
  ) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Source context requires bounded duration or substantive server-owned source evidence.',
    })
  }
})

export const buildEditBriefMarkerContextSchema = editBriefScopeSchema.extend({
  expectedRevision: z.number().int().positive(),
  idempotencyKey: editBriefScopeIdSchema,
  markerId: editBriefScopeIdSchema,
  sourceContext: editBriefSourceContextSchema,
  nearbyWindowSeconds: z.number().int().min(1).max(300).default(30),
}).strict()

export const runEditBriefQaSchema = editBriefScopeSchema.extend({
  expectedRevision: z.number().int().nonnegative(),
  idempotencyKey: editBriefScopeIdSchema,
}).strict()

export const createEditBriefPlanHintsSchema = editBriefScopeSchema.extend({
  expectedRevision: z.number().int().nonnegative(),
  idempotencyKey: editBriefScopeIdSchema,
  latestExplicitUserInstruction: optionalText(8_000),
  approvedProjectOverrides: z.array(boundedText(2_000)).max(64).default([]),
}).strict()

export const lockEditBriefLifecycleSchema = editBriefScopeSchema.extend({
  expectedRevision: z.number().int().positive(),
  idempotencyKey: editBriefScopeIdSchema,
  phase: z.literal('approved_snapshot'),
  approvedSnapshotId: editBriefScopeIdSchema,
  expectedPublicationBindingHash: z.string().regex(/^[a-f0-9]{64}$/),
}).strict()

export type EditBriefFieldsInput = z.infer<typeof editBriefFieldsSchema>
export type EditBriefExportSettingsInput = z.infer<typeof editBriefExportSettingsSchema>
export type EditBriefMarkerFieldsInput = z.infer<typeof editBriefMarkerFieldsSchema>
export type EditBriefStructuredIntentInput = z.infer<typeof editBriefStructuredIntentSchema>
export type EditBriefAttachmentMetadataInput = z.infer<typeof editBriefAttachmentMetadataSchema>
export type EditBriefSourceContextInput = z.infer<typeof editBriefSourceContextSchema>
export type EditBriefRuntimeState = z.infer<typeof editBriefRuntimeStateSchema>
export type EditBriefMarkerType = z.infer<typeof editBriefMarkerTypeSchema>
