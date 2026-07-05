import { z } from 'zod'
import { idSchema } from './common-schemas'

const localEditPlanStepSchema = z.object({
  label: z.string().min(1).max(120),
  summary: z.string().min(1).max(800),
})

const localEditPlanSegmentOperationSchema = z.object({
  id: idSchema,
  segmentRole: z.enum(['hook', 'context', 'main_body', 'ending']),
  operationType: z.enum(['trim', 'cut', 'caption', 'color_grade', 'audio_cleanup', 'transition', 'qa_check']),
  label: z.string().min(1).max(160),
  instruction: z.string().min(1).max(1200),
  sourceRangeLabel: z.string().min(1).max(80),
  finalRangeLabel: z.string().min(1).max(80),
  qaChecks: z.array(z.string().min(1).max(100)).min(1).max(12),
  workerReady: z.literal(false),
  productReady: z.literal(false),
})

const localEditPlanOutputFrameSchema = z.object({
  aspectRatio: z.enum(['9:16', '16:9', '1:1', '4:5', 'custom']),
  platformTarget: z.enum([
    'tiktok_reel',
    'instagram_reel',
    'instagram_feed',
    'youtube_shorts',
    'youtube_standard',
    'linkedin',
    'website',
    'podcast_clip',
    'ad_creative',
    'internal_review',
    'custom',
  ]),
  width: z.number().int().positive().max(8192),
  height: z.number().int().positive().max(8192),
  confirmed: z.literal(true),
  source: z.enum(['new_edit_create_form', 'edit_session_metadata']),
})

const localEditPlanOperationManifestSchema = z.object({
  version: z.literal('project-edit-operation-manifest-v1'),
  sourceFileName: z.string().min(1).max(240),
  sourceDurationSeconds: z.number().positive().max(24 * 60 * 60).optional(),
  sourceAspectRatio: z.string().min(1).max(32).optional(),
  outputFrame: localEditPlanOutputFrameSchema.optional(),
  professionalBaseline: z.literal('clean_professional'),
  sourceOrderPolicy: z.literal('preserve_source_order_until_user_approves_reorder'),
  mediaIntelligenceStatus: z.literal('not_analyzed_backend_local_only'),
  operations: z.array(localEditPlanSegmentOperationSchema).min(4).max(24),
  requiredQaChecks: z.array(z.string().min(1).max(100)).min(1).max(40),
  workerExecutionReady: z.literal(false),
  productReady: z.literal(false),
  warnings: z.array(z.string().min(1).max(500)).max(12),
})

const localEditPlanCreditEstimateSchema = z.object({
  lowCredits: z.number().int().nonnegative(),
  expectedCredits: z.number().int().nonnegative(),
  highCredits: z.number().int().nonnegative(),
  creditConversion: z.literal('1 credit = $0.10'),
  serviceFeeIncluded: z.literal(false),
}).refine((value) => value.lowCredits <= value.expectedCredits && value.expectedCredits <= value.highCredits, {
  message: 'Credit estimate must be ordered low <= expected <= high.',
})

const localEditPlanBriefLineageSchema = z.object({
  briefId: idSchema,
  revisionNumber: z.number().int().positive(),
  briefFingerprint: z.string().min(1).max(120),
})

const localEditPlanSourceSchema = z.object({
  storageObjectRecordId: idSchema,
  mediaAssetId: idSchema.optional(),
  bucketName: z.string().min(1),
  objectPath: z.string().min(1),
  fileName: z.string().min(1),
  mimeType: z.string().min(1),
  sizeBytes: z.number().int().nonnegative(),
  checksumSha256: z.string().optional(),
})

export const createApprovedLocalEditPlanSchema = z.object({
  workspaceId: idSchema,
  planId: idSchema,
  title: z.string().min(1).max(160),
  summary: z.string().min(1).max(4000),
  steps: z.array(localEditPlanStepSchema).min(1).max(12),
  operationManifest: localEditPlanOperationManifestSchema,
  creditEstimate: localEditPlanCreditEstimateSchema,
  briefLineage: localEditPlanBriefLineageSchema,
  source: localEditPlanSourceSchema,
})
