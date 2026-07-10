import { z } from 'zod'

import type {
  ProductionStorageBucketPurpose,
  QualityGateType,
  ToolArtifactType,
} from '../../src/backend/contracts/production-tool-runtime-contracts'
import type { ProductionToolId } from '../tool-registry'
import type { ProductionWorkerRuntimeType } from '../workers/production/production-worker-types'

export const TRACK_B_ADAPTER_TOOL_IDS = [
  'ffmpeg',
  'ffprobe',
  'pyav',
  'opentimelineio',
  'remotion',
  'libass',
  'sharp',
  'paddleocr',
  'pyscenedetect',
  'opencv',
  'opencolorio',
  'openimageio',
  'audioflux',
  'signalsmith_stretch',
  'd3',
  'echarts',
] as const satisfies readonly ProductionToolId[]

export type TrackBAdapterToolId = typeof TRACK_B_ADAPTER_TOOL_IDS[number]

export const trackBAdapterExecutionModes = ['dry_run', 'bounded_execution'] as const
export type TrackBAdapterExecutionMode = typeof trackBAdapterExecutionModes[number]

export const trackBAdapterStatuses = ['dry_run_ready', 'bounded_execution_ready', 'blocked'] as const
export type TrackBAdapterStatus = typeof trackBAdapterStatuses[number]

export const trackBAdapterQAStatuses = ['passed', 'warning', 'blocked'] as const
export type TrackBAdapterQAStatus = typeof trackBAdapterQAStatuses[number]

export const trackBAdapterToolIdSchema = z.enum(TRACK_B_ADAPTER_TOOL_IDS)
export const trackBAdapterExecutionModeSchema = z.enum(trackBAdapterExecutionModes)

export const trackBStorageBucketPurposeValues = [
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
] as const satisfies readonly ProductionStorageBucketPurpose[]

export const trackBToolArtifactTypeValues = [
  'source_media',
  'proxy_video',
  'extracted_audio',
  'keyframe_image',
  'representative_frame',
  'transcript_json',
  'word_timestamps_json',
  'caption_segments_json',
  'scene_report_json',
  'visual_analysis_json',
  'audio_analysis_json',
  'color_analysis_json',
  'ocr_report_json',
  'mask_image',
  'mask_sequence',
  'rgba_cutout',
  'cleaned_audio',
  'separated_audio_stem',
  'color_grade_recipe',
  'graded_preview',
  'enhanced_video',
  'interpolated_video',
  'render_manifest',
  'preview_video',
  'final_export',
  'qa_report',
  'timeline_manifest',
  'opentimelineio_manifest',
  'temp_file',
] as const satisfies readonly ToolArtifactType[]

export const trackBQualityGateTypeValues = [
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
] as const satisfies readonly QualityGateType[]

export const trackBWorkerTypeValues = [
  'cpu_analysis_worker',
  'gpu_ai_worker',
  'render_worker',
  'qa_worker',
  'tool_readiness_worker',
] as const satisfies readonly ProductionWorkerRuntimeType[]

const storageBucketPurposeSchema = z.enum(trackBStorageBucketPurposeValues)
const toolArtifactTypeSchema = z.enum(trackBToolArtifactTypeValues)
const qualityGateTypeSchema = z.enum(trackBQualityGateTypeValues)
const workerTypeSchema = z.enum(trackBWorkerTypeValues)

export const trackBArtifactManifestEntrySchema = z.object({
  id: z.string().min(1),
  artifactType: toolArtifactTypeSchema,
  storageBucketPurpose: storageBucketPurposeSchema,
  storageObjectPath: z.string().min(1),
  contentType: z.string().min(1).optional(),
  sizeBytes: z.number().int().nonnegative().optional(),
  checksum: z.string().min(1).optional(),
  isPrivate: z.boolean(),
  sourceOfTruth: z.boolean(),
  description: z.string().min(1).optional(),
  producedByToolId: trackBAdapterToolIdSchema.optional(),
}).strict()

export const trackBAdapterQAResultSchema = z.object({
  checkId: z.string().min(1),
  status: z.enum(trackBAdapterQAStatuses),
  required: z.boolean(),
  gateType: qualityGateTypeSchema.optional(),
  message: z.string().min(1),
  details: z.record(z.string(), z.unknown()).optional(),
}).strict()

export const trackBAdapterRequestSchema = z.object({
  workspaceId: z.string().min(1),
  projectId: z.string().min(1),
  jobId: z.string().min(1),
  toolExecutionPlanId: z.string().min(1),
  approvedPlanSnapshotId: z.string().min(1),
  creditEstimateId: z.string().min(1),
  creditReservationId: z.string().min(1),
  toolId: trackBAdapterToolIdSchema,
  workerType: workerTypeSchema,
  executionMode: trackBAdapterExecutionModeSchema,
  inputArtifacts: z.array(trackBArtifactManifestEntrySchema),
  metadata: z.record(z.string(), z.unknown()).optional(),
}).strict()

export const trackBAdapterResultSchema = z.object({
  adapterPackVersion: z.literal('trackb-adapter-pack-v1'),
  toolId: trackBAdapterToolIdSchema,
  displayName: z.string().min(1),
  workerType: workerTypeSchema,
  executionMode: trackBAdapterExecutionModeSchema,
  status: z.enum(trackBAdapterStatuses),
  mockSafe: z.literal(true),
  realToolExecution: z.literal(false),
  inputManifest: z.array(trackBArtifactManifestEntrySchema),
  outputManifest: z.array(trackBArtifactManifestEntrySchema),
  qaChecks: z.array(trackBAdapterQAResultSchema).min(1),
  blockers: z.array(z.object({
    code: z.string().min(1),
    message: z.string().min(1),
    details: z.record(z.string(), z.unknown()).optional(),
  }).strict()),
  resultSummary: z.string().min(1),
  warnings: z.array(z.string().min(1)),
}).strict()

export type TrackBArtifactManifestEntry = z.infer<typeof trackBArtifactManifestEntrySchema>
export type TrackBAdapterQAResult = z.infer<typeof trackBAdapterQAResultSchema>
export type TrackBAdapterRequest = z.infer<typeof trackBAdapterRequestSchema>
export type TrackBAdapterResult = z.infer<typeof trackBAdapterResultSchema>
