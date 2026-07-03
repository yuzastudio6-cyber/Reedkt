import { z } from 'zod'
import { trackBAdapterExecutionModeSchema, trackBAdapterToolIdSchema } from '../trackb-adapters'
import { PRODUCTION_TOOL_IDS, type ProductionToolId } from '../tool-registry'
import { productionToolExecutionReadinessGateSchema } from './beta-readiness-schemas'
import { idSchema } from './common-schemas'

const productionToolIdSchema = z.enum(PRODUCTION_TOOL_IDS as unknown as [ProductionToolId, ...ProductionToolId[]])

const workerTypeSchema = z.enum([
  'cpu_analysis_worker',
  'gpu_ai_worker',
  'render_worker',
  'qa_worker',
  'tool_readiness_worker',
])

const executionModeSchema = z.enum([
  'dry_run',
  'mock_safe',
  'production_ready',
  'production_blocked',
])

const adapterSchema = z.enum([
  'cpu_analysis_worker_media_audio_extract',
  'cpu_analysis_worker_media_keyframes',
  'cpu_analysis_worker_media_probe',
  'cpu_analysis_worker_media_proxy',
  'cpu_analysis_worker_media_representative_frames',
  'cpu_analysis_worker_color_metadata',
  'cpu_analysis_worker_smart_cut_timeline',
  'cpu_analysis_worker_placeholder',
  'gpu_ai_worker_placeholder',
  'render_worker_placeholder',
  'qa_worker_placeholder',
  'tool_readiness_worker_core_checks',
  'tool_readiness_worker_placeholder',
])

const storageBucketPurposeSchema = z.enum([
  'source_media',
  'proxy_media',
  'analysis_artifacts',
  'transcripts',
  'masks',
  'generated_assets',
  'previews',
  'final_exports',
  'worker_temp',
  'qa_artifacts',
])

const qualityGateTypeSchema = z.enum([
  'caption_readability',
  'caption_timing',
  'caption_safe_zone',
  'cut_smoothness',
  'transcript_alignment',
  'audio_loudness',
  'audio_sync',
  'audio_naturalness',
  'music_over_voice',
  'color_exposure',
  'color_skin_tone',
  'color_export_space',
  'color_shot_match',
  'mask_edge_quality',
  'mask_temporal_stability',
  'mask_subject_coverage',
  'ocr_text_overlap',
  'enhancement_artifacts',
  'slow_motion_artifacts',
  'render_asset_integrity',
  'render_timeline_integrity',
  'export_codec_format',
  'export_duration_sync',
  'final_delivery',
])

export const toolExecutionGatewayDispatchSchema = z.object({
  workspaceId: idSchema,
  projectId: idSchema,
  jobId: idSchema,
  toolExecutionPlanId: idSchema,
  editPlanId: idSchema.optional(),
  mediaAssetId: idSchema.optional(),
  approvedPlanSnapshotId: idSchema,
  creditEstimateId: idSchema,
  creditReservationId: idSchema,
  approvedReservationRemainingCredits: z.number().int().nonnegative(),
  estimatedHighCredits: z.number().int().nonnegative(),
  workerType: workerTypeSchema,
  executionMode: executionModeSchema.default('mock_safe'),
  adapterId: adapterSchema.optional(),
  trackBAdapterToolId: trackBAdapterToolIdSchema.optional(),
  trackBAdapterExecutionMode: trackBAdapterExecutionModeSchema.optional(),
  requestedToolIds: z.array(productionToolIdSchema).min(1),
  requestedRecipeIds: z.array(idSchema).default([]),
  artifactReferences: z.array(z.object({
    id: idSchema,
    storageBucketPurpose: storageBucketPurposeSchema,
    storageObjectPath: z.string().min(1),
    isPrivate: z.boolean(),
    sourceOfTruth: z.boolean(),
  })).default([]),
  renderMode: z.enum(['preview', 'final_export', 'qa_probe']).optional(),
  requiredQualityGateIds: z.array(idSchema).optional(),
  requiredQualityGateTypes: z.array(qualityGateTypeSchema).optional(),
  productionReadinessEvidencePacketId: idSchema.optional(),
  productionReadinessEvidence: productionToolExecutionReadinessGateSchema.optional(),
  attempt: z.number().int().positive().default(1),
  maxAttempts: z.number().int().positive().default(1),
  metadata: z.record(z.string(), z.unknown()).optional(),
}).strict()

export type ToolExecutionGatewayDispatchBody = z.infer<typeof toolExecutionGatewayDispatchSchema>
