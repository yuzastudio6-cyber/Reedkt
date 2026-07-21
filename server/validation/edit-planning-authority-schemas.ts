import { z } from 'zod'
import { idSchema } from './common-schemas'
import { planningInputAuthorityExpectationSchema } from './planning-input-authority-binding-schemas'
import { sourceMediaAuthorityExpectationSchema } from './source-media-authority-schemas'
import { canonicalStorytellingStyleAuthoritySchema } from './canonical-storytelling-style-authority-schemas'
import {
  PROFESSIONAL_EXPORT_ASPECT_RATIOS,
  PROFESSIONAL_EXPORT_COST_MODEL_VERSION,
  PROFESSIONAL_EXPORT_POLICY_VERSION,
  PROFESSIONAL_EXPORT_PROFILE_IDS,
  PROFESSIONAL_EXPORT_SOURCE_RATE_CARD_VERSION,
} from '../../src/types/professional-export'

export const PRIVATE_EDIT_AUTHORITY_SCHEMA_VERSION = 'private-edit-authority-plan-v2' as const

const safeKeySchema = z.string()
  .trim()
  .min(1)
  .max(160)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/)
  .refine((value) => !value.includes('..'), 'Unsafe key sequence.')

const sha256Schema = z.string().regex(/^[a-f0-9]{64}$/)
const jsonObjectSchema = z.record(z.string(), z.unknown())
const professionalExportProfileIdSchema = z.enum(PROFESSIONAL_EXPORT_PROFILE_IDS)
const professionalExportAspectRatioSchema = z.enum(PROFESSIONAL_EXPORT_ASPECT_RATIOS)
const professionalExportFrameSchema = z.object({
  profileId: professionalExportProfileIdSchema,
  aspectRatio: professionalExportAspectRatioSchema,
  width: z.number().int().positive().max(4_096),
  height: z.number().int().positive().max(4_096),
  pixelCount: z.number().int().positive().max(8_294_400),
  label: z.string().trim().min(1).max(80),
}).strict()
const professionalExportCoverageSchema = z.object({
  policyVersion: z.literal(PROFESSIONAL_EXPORT_POLICY_VERSION),
  costModelVersion: z.literal(PROFESSIONAL_EXPORT_COST_MODEL_VERSION),
  sourceRateCardVersion: z.literal(PROFESSIONAL_EXPORT_SOURCE_RATE_CARD_VERSION),
  assumption: z.literal('always_estimate_4k_uhd'),
  costBasisProfileId: z.literal('uhd_2160'),
  defaultDeliveryProfileId: z.literal('uhd_2160'),
  coveredProfileIds: z.array(professionalExportProfileIdSchema).length(3),
  approvedAspectRatio: professionalExportAspectRatioSchema,
  approvedFrames: z.array(professionalExportFrameSchema).length(3),
  outputFps: z.number().positive().max(120),
  durationSeconds: z.number().positive().finite(),
  costBasisPixelCount: z.literal(8_294_400),
  megapixelFrames: z.number().positive().finite(),
  lowInternalToolCostCredits: z.number().int().nonnegative(),
  expectedInternalToolCostCredits: z.number().int().nonnegative(),
  maximumInternalToolCostCredits: z.number().int().positive(),
  includedInInitialEstimate: z.literal(true),
  requiresSeparateExportEstimate: z.literal(false),
  allowsAdditionalExportCharge: z.literal(false),
  usesApprovedEditReservation: z.literal(true),
  serviceFeeIncludedInToolCost: z.literal(false),
  sourceEnhancementIncluded: z.literal(false),
}).strict()

export const sourceSequenceItemSchema = z.object({
  sourceSequenceItemId: safeKeySchema,
  mediaAssetId: idSchema,
  uploadedOrder: z.number().int().positive().max(10_000),
  checksumSha256: sha256Schema.optional(),
  required: z.boolean().default(true),
}).strict()

const confirmedSettingsSchema = z.object({
  aspectRatio: z.string().trim().min(1).max(32),
  outputFrame: z.object({
    width: z.number().int().positive().max(16_384),
    height: z.number().int().positive().max(16_384),
    fps: z.number().positive().max(240),
  }).strict(),
  outputFramePurpose: z.literal('private_canonical_4k_master_review'),
  professionalExportCoverage: professionalExportCoverageSchema,
  outputFrameConfirmed: z.literal(true),
  sourceOrderConfirmed: z.literal(true),
  sourceCleanupConfirmed: z.literal(true),
  editLevel: z.enum(['basic', 'pro', 'premium', 'normal', 'ultra_premium']),
  targetPlatform: z.string().trim().min(1).max(80),
  preferenceSnapshotId: safeKeySchema.optional(),
  preferenceRevision: z.number().int().nonnegative().optional(),
}).strict()

const sourceCleanupSummarySchema = z.object({
  status: z.literal('confirmed'),
  cleanupPreference: z.string().trim().min(1).max(80),
  trimValidationStatus: z.enum(['passed', 'warning']),
  meaningValidationStatus: z.enum(['passed', 'warning']),
  userReviewRequired: z.literal(false),
}).strict()

export const canonicalSourceCleanupDecisionSchema = z.object({
  decisionId: safeKeySchema,
  sourceSequenceItemId: safeKeySchema,
  action: z.enum([
    'keep',
    'cut',
    'tighten',
    'preserve',
    'move_to_broll',
    'use_as_voiceover',
    'use_as_proof',
    'use_as_alt_take',
  ]),
  startFrame: z.number().int().nonnegative(),
  endFrameExclusive: z.number().int().positive(),
  reason: z.string().trim().min(1).max(1_000),
  confidence: z.number().min(0).max(1),
  meaningPreservationStatus: z.enum(['passed', 'warning']),
  userReviewStatus: z.enum(['not_required', 'resolved']),
}).strict().superRefine((decision, context) => {
  if (decision.endFrameExclusive <= decision.startFrame) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Source cleanup decision endFrameExclusive must be greater than startFrame.',
    })
  }
})

export const canonicalSourceCleanupPlanSchema = z.object({
  status: z.literal('confirmed'),
  decisions: z.array(canonicalSourceCleanupDecisionSchema).min(1).max(10_000),
}).strict()

const timingSummarySchema = z.object({
  validationStatus: z.enum(['passed', 'warning']),
  approvalBlocked: z.literal(false),
  fps: z.number().positive().max(240),
  totalFrames: z.number().int().positive().max(100_000_000),
}).strict()

const qaSummarySchema = z.object({
  status: z.enum(['passed', 'warning']),
  approvalBlocked: z.literal(false),
}).strict()

const providerPolicySchema = z.object({
  veoPolicy: z.enum(['forbidden', 'final_fallback_only']),
  approvedRoutes: z.array(safeKeySchema).max(64).default([]),
}).strict()

const segmentSummarySchema = z.object({
  segmentId: safeKeySchema,
  startFrame: z.number().int().nonnegative(),
  endFrameExclusive: z.number().int().positive(),
  operationIds: z.array(safeKeySchema).min(1).max(256),
}).strict()

export const canonicalPlanComponentsSchema = z.object({
  compiledIntent: jsonObjectSchema,
  professionalEditingDirective: jsonObjectSchema,
  confirmedSettings: confirmedSettingsSchema,
  sourceSequence: z.array(sourceSequenceItemSchema).min(1).max(1_000),
  sourceCleanupSummary: sourceCleanupSummarySchema,
  sourceCleanupPlan: canonicalSourceCleanupPlanSchema,
  masterTimingPlan: jsonObjectSchema,
  captionVisualCueTimingPlan: jsonObjectSchema,
  soundSyncTransitionTimingPlan: jsonObjectSchema,
  timingValidationPlan: jsonObjectSchema,
  timingSummary: timingSummarySchema,
  segments: z.array(segmentSummarySchema).min(1).max(2_000),
  visualAssetPlan: jsonObjectSchema,
  colorPipelinePlan: jsonObjectSchema.default({ status: 'not_provided' }),
  rendererPlan: jsonObjectSchema,
  toolStrategyPlan: jsonObjectSchema,
  qaPlan: jsonObjectSchema,
  qaSummary: qaSummarySchema,
  providerPolicy: providerPolicySchema,
  fallbackPolicy: jsonObjectSchema,
  motionStudioStorytellingStyleAuthority: canonicalStorytellingStyleAuthoritySchema.optional(),
}).strict()

const estimateLineItemSchema = z.object({
  lineKey: safeKeySchema,
  label: z.string().trim().min(1).max(160),
  category: safeKeySchema,
  estimatedCredits: z.number().int().nonnegative().max(10_000_000),
  removable: z.boolean().default(false),
  metadata: jsonObjectSchema.default({}),
}).strict()

const canonicalEstimateSchema = z.object({
  lineItems: z.array(estimateLineItemSchema).min(1).max(512),
  fallbackAllowanceCredits: z.number().int().nonnegative().max(10_000_000).default(0),
  validForSeconds: z.number().int().min(300).max(86_400).default(3_600),
}).strict()

export const canonicalExpectedOutputSchema = z.object({
  outputKey: safeKeySchema,
  artifactType: safeKeySchema,
  assetRole: z.enum(['processed', 'generated', 'qa', 'preview', 'final']),
  required: z.boolean(),
  previewPlaceholderAllowed: z.boolean(),
  contentType: z.string().trim().min(1).max(160).optional(),
  segmentIds: z.array(safeKeySchema).max(256).default([]),
  timingIds: z.array(safeKeySchema).max(512).default([]),
  rendererLayerIds: z.array(safeKeySchema).max(512).default([]),
}).strict().superRefine((output, context) => {
  if (output.assetRole === 'final' && output.previewPlaceholderAllowed) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'A final artifact cannot allow a preview placeholder.',
    })
  }
})

export const authorityPlannedAssetManifestEntrySchema = canonicalExpectedOutputSchema.extend({
  id: safeKeySchema,
  snapshotId: safeKeySchema,
  approvedWorkItemId: safeKeySchema,
  workItemKey: safeKeySchema,
  status: z.literal('planned'),
  version: z.literal(1),
  createdAt: z.string().datetime({ offset: true }),
}).strict()

export const authorityPlannedAssetManifestSchema = z.object({
  schemaVersion: z.literal('private-edit-asset-manifest-v1'),
  snapshotId: safeKeySchema,
  planId: safeKeySchema,
  planHash: sha256Schema,
  workGraphHash: sha256Schema,
  entries: z.array(authorityPlannedAssetManifestEntrySchema).min(1).max(32_768),
  requiredAssetCount: z.number().int().nonnegative(),
  optionalAssetCount: z.number().int().nonnegative(),
  manifestHash: sha256Schema,
}).strict()

export const CANONICAL_EDIT_WORK_ITEM_TYPES = [
  'validate_approved_snapshot',
  'prepare_source_trim',
  'select_retake',
  'validate_meaning_preservation',
  'prepare_caption_timing',
  'prepare_visual_cue_timing',
  'prepare_soundsync_timing',
  'generate_image_asset',
  'generate_ai_video_asset',
  'render_map_asset',
  'render_chart_asset',
  'capture_browser_asset',
  'run_audio_analysis',
  'run_audio_stretch',
  'process_image_asset',
  'process_video_asset',
  'generate_mask_asset',
  'prepare_remotion_layer',
  'render_remotion_preview',
  'render_final_export',
  'run_asset_qa',
  'run_timing_qa',
  'run_final_qa',
  'apply_fallback',
  'request_user_review',
  'custom',
] as const

const canonicalWorkItemSchema = z.object({
  workItemKey: safeKeySchema,
  workItemType: z.enum(CANONICAL_EDIT_WORK_ITEM_TYPES),
  workerClass: safeKeySchema,
  executionInput: jsonObjectSchema,
  sourceSequenceItemIds: z.array(safeKeySchema).max(1_000).default([]),
  sourceCleanupDecisionIds: z.array(safeKeySchema).max(10_000).default([]),
  expectedOutputs: z.array(canonicalExpectedOutputSchema).min(1).max(128),
  dependencyKeys: z.array(safeKeySchema).max(128).default([]),
  approvedToolIds: z.array(safeKeySchema).max(64).default([]),
  approvedProviderRoute: safeKeySchema.optional(),
  providerExecutionMode: z.enum(['none', 'primary', 'fallback', 'final_fallback']).default('none'),
  fallbackPolicy: jsonObjectSchema.default({}),
  maxAttempts: z.number().int().min(1).max(10),
  attemptTimeoutSeconds: z.number().int().min(30).max(14_400),
  scheduledDelaySeconds: z.number().int().min(0).max(2_592_000).default(0),
  maximumCreditBudget: z.number().int().nonnegative().max(10_000_000),
  required: z.boolean().default(true),
}).strict()

export const canonicalRevisionPublicationAuthoritySchema = z.object({
  reviewAssemblyId: safeKeySchema,
  reviewDecisionId: safeKeySchema,
  revisionRequestId: safeKeySchema,
  decisionManifestSha256: sha256Schema,
  priorApprovedSnapshotId: safeKeySchema,
  priorApprovedPlanId: safeKeySchema,
  priorApprovedPlanVersion: z.number().int().positive(),
  revisionIntentHash: sha256Schema,
}).strict()

export const publishCanonicalEditPlanSchema = z.object({
  workspaceId: idSchema,
  planningRequestId: safeKeySchema,
  planningInputAuthority: planningInputAuthorityExpectationSchema,
  sourceMediaAuthority: sourceMediaAuthorityExpectationSchema,
  revisionAuthority: canonicalRevisionPublicationAuthoritySchema.optional(),
  canonicalPlan: z.object({
    schemaVersion: z.literal(PRIVATE_EDIT_AUTHORITY_SCHEMA_VERSION),
    components: canonicalPlanComponentsSchema,
    estimate: canonicalEstimateSchema,
    workItems: z.array(canonicalWorkItemSchema).min(3).max(256),
  }).strict(),
}).strict()

export const approveCanonicalEditPlanSchema = z.object({
  workspaceId: idSchema,
  expectedAuthorityRevision: z.number().int().positive(),
  expectedPlanHash: sha256Schema,
  expectedEstimateHash: sha256Schema,
}).strict()

export const authorityWorkspaceQuerySchema = z.object({
  workspaceId: idSchema,
}).strict()

export type PublishCanonicalEditPlanBody = z.infer<typeof publishCanonicalEditPlanSchema>
export type ApproveCanonicalEditPlanBody = z.infer<typeof approveCanonicalEditPlanSchema>
export type CanonicalPlanComponentsInput = z.infer<typeof canonicalPlanComponentsSchema>
export type CanonicalEstimateInput = z.infer<typeof canonicalEstimateSchema>
export type CanonicalWorkItemInput = z.infer<typeof canonicalWorkItemSchema>
export type CanonicalExpectedOutputInput = z.infer<typeof canonicalExpectedOutputSchema>
export type CanonicalSourceCleanupDecisionInput = z.infer<typeof canonicalSourceCleanupDecisionSchema>
