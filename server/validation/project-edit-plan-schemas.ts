import { z } from 'zod'
import { idSchema } from './common-schemas'
import { CREATIVE_SKILL_KEYS } from '../../src/types'
import { autonomousEditOperationIds } from './autonomous-edit-planning-schemas'
import { autonomousEditOperationExecutionSpecSchema } from '../../src/backend/qwen-runtime/qwen-autonomous-edit-plan-schema'

const creativeSkillKeySchema = z.enum(CREATIVE_SKILL_KEYS)

const localEditPlanStepSchema = z.object({
  label: z.string().min(1).max(120),
  summary: z.string().min(1).max(800),
})

const localEditPlanSegmentOperationSchema = z.object({
  id: idSchema,
  segmentRole: z.enum(['hook', 'setup', 'context', 'main_body', 'proof', 'transition', 'ending']),
  operationType: z.enum(['trim', 'cut', 'caption', 'graphics', 'broll', 'color_grade', 'audio_cleanup', 'transition', 'render', 'qa_check']),
  label: z.string().min(1).max(160),
  instruction: z.string().min(1).max(1200),
  sourceRangeLabel: z.string().min(1).max(80),
  finalRangeLabel: z.string().min(1).max(80),
  qaChecks: z.array(z.string().min(1).max(100)).min(1).max(12),
  operationId: z.enum(autonomousEditOperationIds).optional(),
  rationale: z.string().min(1).max(1200).optional(),
  skillKeys: z.array(creativeSkillKeySchema).min(1).max(20).optional(),
  sourceEvidenceRefs: z.array(z.string().min(1).max(240)).min(1).max(24).optional(),
  sourceStartSeconds: z.number().nonnegative().optional(),
  sourceEndSeconds: z.number().positive().optional(),
  executionSpec: autonomousEditOperationExecutionSpecSchema.optional(),
  workerReady: z.literal(false),
  productReady: z.literal(false),
}).refine((value) => value.sourceEndSeconds === undefined || value.sourceStartSeconds === undefined || value.sourceEndSeconds > value.sourceStartSeconds, {
  message: 'Operation source end must be greater than source start.',
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
  version: z.enum(['project-edit-operation-manifest-v1', 'project-edit-operation-manifest-v2']),
  sourceFileName: z.string().min(1).max(240),
  sourceDurationSeconds: z.number().positive().max(24 * 60 * 60).optional(),
  sourceAspectRatio: z.string().min(1).max(32).optional(),
  outputFrame: localEditPlanOutputFrameSchema.optional(),
  professionalBaseline: z.literal('clean_professional'),
  sourceOrderPolicy: z.literal('preserve_source_order_until_user_approves_reorder'),
  mediaIntelligenceStatus: z.enum(['not_analyzed_backend_local_only', 'analyzed_private_source_evidence']),
  sourceEvidenceVersion: z.literal('autonomous-edit-source-evidence-v1').optional(),
  sourceEvidenceArtifactIds: z.array(idSchema).min(1).max(200).optional(),
  operations: z.array(localEditPlanSegmentOperationSchema).min(1).max(320),
  requiredQaChecks: z.array(z.string().min(1).max(160)).min(1).max(160),
  workerExecutionReady: z.literal(false),
  productReady: z.literal(false),
  warnings: z.array(z.string().min(1).max(500)).max(12),
}).superRefine((value, context) => {
  if (value.version === 'project-edit-operation-manifest-v1') {
    if (value.mediaIntelligenceStatus !== 'not_analyzed_backend_local_only') {
      context.addIssue({ code: z.ZodIssueCode.custom, message: 'V1 manifests cannot claim analyzed source evidence.' })
    }
    return
  }
  if (value.mediaIntelligenceStatus !== 'analyzed_private_source_evidence') {
    context.addIssue({ code: z.ZodIssueCode.custom, message: 'V2 manifests require analyzed private source evidence.' })
  }
  if (value.sourceEvidenceVersion !== 'autonomous-edit-source-evidence-v1' || !value.sourceEvidenceArtifactIds?.length) {
    context.addIssue({ code: z.ZodIssueCode.custom, message: 'V2 manifests require source evidence version and private artifact IDs.' })
  }
  value.operations.forEach((operation, index) => {
    if (!operation.operationId || !operation.rationale || !operation.skillKeys?.length || !operation.sourceEvidenceRefs?.length) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['operations', index],
        message: 'V2 operations require operation ID, rationale, skills, and source evidence references.',
      })
    }
    if (operation.operationId?.startsWith('caption.') && operation.executionSpec?.kind !== 'caption') {
      context.addIssue({ code: z.ZodIssueCode.custom, path: ['operations', index, 'executionSpec'], message: 'Caption operations require a caption execution spec.' })
    }
    if (operation.operationId === 'graphics.compose' && operation.executionSpec?.kind !== 'graphic') {
      context.addIssue({ code: z.ZodIssueCode.custom, path: ['operations', index, 'executionSpec'], message: 'Graphics composition requires a graphic execution spec.' })
    }
    if (operation.operationId === 'graphics.animate' && operation.executionSpec?.kind !== 'graphic_motion') {
      context.addIssue({ code: z.ZodIssueCode.custom, path: ['operations', index, 'executionSpec'], message: 'Graphics animation requires a graphic motion execution spec.' })
    }
    if ((operation.operationId === 'audio.cleanup' || operation.operationId === 'audio.loudness.normalize') && operation.executionSpec?.kind !== 'audio') {
      context.addIssue({ code: z.ZodIssueCode.custom, path: ['operations', index, 'executionSpec'], message: 'Audio execution requires a measured audio execution spec.' })
    }
    if ((operation.operationId === 'color.correct' || operation.operationId === 'color.grade') && operation.executionSpec?.kind !== 'color') {
      context.addIssue({ code: z.ZodIssueCode.custom, path: ['operations', index, 'executionSpec'], message: 'Color execution requires a measured color execution spec.' })
    }
  })
})

const localEditPlanPlanningEvidenceSchema = z.object({
  attemptId: idSchema,
  autonomousPlanVersion: z.literal('autonomous-edit-plan-v1'),
  sourceEvidenceVersion: z.literal('autonomous-edit-source-evidence-v1'),
  plannerSource: z.literal('qwen_live'),
  providerCallMade: z.boolean(),
  qwenCallMade: z.boolean(),
  mediaAnalysisRun: z.literal(true),
  transcriptionRun: z.boolean(),
  visualUnderstandingRun: z.literal(true),
  deterministicCreativeFallbackUsed: z.literal(false),
  rawPromptStored: z.literal(false),
  privateArtifactIds: z.array(idSchema).min(1).max(200),
  createdAt: z.string().datetime(),
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

const localEditPlanSkillActivitySchema = z.object({
  id: z.enum([
    'story_cleanup',
    'captions_readability',
    'voice_polish',
    'visual_clarity',
    'motion_restraint',
    'color_finish',
    'private_review_qa',
  ]),
  label: z.string().min(1).max(120),
  summary: z.string().min(1).max(800),
  skillKeys: z.array(creativeSkillKeySchema).min(1).max(16),
  approvalRequired: z.boolean(),
  executionMode: z.literal('planning_only'),
  productReady: z.literal(false),
})

const localEditPlanSkillPlanSchema = z.object({
  version: z.literal('project-edit-skill-plan-v1'),
  directionSource: z.enum(['saved_edit_brief', 'chat_prompt', 'default_professional_direction']),
  directionSummary: z.string().min(1).max(4000),
  activities: z.array(localEditPlanSkillActivitySchema).min(1).max(12),
  selectedSkillKeys: z.array(creativeSkillKeySchema).min(1).max(80),
  blockedSkillKeys: z.array(creativeSkillKeySchema).max(40),
  planningOnly: z.literal(true),
  exposesInternalToolNames: z.literal(false),
  productReady: z.literal(false),
  warnings: z.array(z.string().min(1).max(500)).max(12),
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
  planningEvidence: localEditPlanPlanningEvidenceSchema.optional(),
  directionSource: z.enum(['saved_edit_brief', 'chat_prompt', 'default_professional_direction']),
  skillPlan: localEditPlanSkillPlanSchema,
  creditEstimate: localEditPlanCreditEstimateSchema,
  briefLineage: localEditPlanBriefLineageSchema,
  source: localEditPlanSourceSchema,
}).superRefine((value, context) => {
  if (value.operationManifest.version === 'project-edit-operation-manifest-v2' && !value.planningEvidence) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ['planningEvidence'], message: 'Evidence-backed plans require planning evidence lineage.' })
  }
})

export const activateApprovedLocalEditPlanSchema = z.object({
  workspaceId: idSchema,
})
