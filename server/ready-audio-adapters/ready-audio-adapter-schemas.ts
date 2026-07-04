import { z } from 'zod'

import type {
  ProductionStorageBucketPurpose,
  QualityGateType,
  ToolArtifactType,
} from '../../src/backend/contracts/production-tool-runtime-contracts'
import type { ProductionToolId } from '../tool-registry'
import type { ProductionWorkerRuntimeType } from '../workers/production/production-worker-types'

export const READY_AUDIO_ADAPTER_TOOL_IDS = [
  'librosa',
  'audioread',
  'pydub',
  'scipy',
  'resampy',
  'pyloudnorm',
  'audioflux',
  'music21',
  'pretty_midi',
  'mido',
  'noisereduce',
  'pedalboard',
  'mir_eval',
  'pydub_effects',
  'ebu_r128_pyloudnorm',
] as const satisfies readonly ProductionToolId[]

export const READY_AUDIO_LICENSE_REVIEW_TOOL_IDS = [
  'pedalboard',
] as const satisfies readonly ProductionToolId[]

export const READY_AUDIO_EXECUTABLE_TOOL_IDS = READY_AUDIO_ADAPTER_TOOL_IDS.filter(
  (toolId) => !(READY_AUDIO_LICENSE_REVIEW_TOOL_IDS as readonly string[]).includes(toolId),
) as Exclude<ReadyAudioAdapterToolId, typeof READY_AUDIO_LICENSE_REVIEW_TOOL_IDS[number]>[]

export type ReadyAudioAdapterToolId = typeof READY_AUDIO_ADAPTER_TOOL_IDS[number]

export const readyAudioAdapterExecutionModes = ['dry_run', 'bounded_execution'] as const
export type ReadyAudioAdapterExecutionMode = typeof readyAudioAdapterExecutionModes[number]

export const readyAudioAdapterStatuses = ['dry_run_ready', 'bounded_execution_ready', 'blocked'] as const
export type ReadyAudioAdapterStatus = typeof readyAudioAdapterStatuses[number]

export const readyAudioAdapterQAStatuses = ['passed', 'warning', 'blocked'] as const
export type ReadyAudioAdapterQAStatus = typeof readyAudioAdapterQAStatuses[number]

export const readyAudioAdapterToolIdSchema = z.enum(READY_AUDIO_ADAPTER_TOOL_IDS)
export const readyAudioAdapterExecutionModeSchema = z.enum(readyAudioAdapterExecutionModes)

const storageBucketPurposeValues = [
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

const toolArtifactTypeValues = [
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

const qualityGateTypeValues = [
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

const workerTypeValues = [
  'cpu_analysis_worker',
  'gpu_ai_worker',
  'render_worker',
  'qa_worker',
  'tool_readiness_worker',
] as const satisfies readonly ProductionWorkerRuntimeType[]

const storageBucketPurposeSchema = z.enum(storageBucketPurposeValues)
const toolArtifactTypeSchema = z.enum(toolArtifactTypeValues)
const qualityGateTypeSchema = z.enum(qualityGateTypeValues)
const workerTypeSchema = z.enum(workerTypeValues)

export const readyAudioArtifactManifestEntrySchema = z.object({
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
  producedByToolId: readyAudioAdapterToolIdSchema.optional(),
}).strict()

export const readyAudioAdapterQAResultSchema = z.object({
  checkId: z.string().min(1),
  status: z.enum(readyAudioAdapterQAStatuses),
  required: z.boolean(),
  gateType: qualityGateTypeSchema.optional(),
  message: z.string().min(1),
  details: z.record(z.string(), z.unknown()).optional(),
}).strict()

export const readyAudioAdapterRequestSchema = z.object({
  workspaceId: z.string().min(1),
  projectId: z.string().min(1),
  jobId: z.string().min(1),
  toolExecutionPlanId: z.string().min(1),
  approvedPlanSnapshotId: z.string().min(1),
  creditEstimateId: z.string().min(1),
  creditReservationId: z.string().min(1),
  toolId: readyAudioAdapterToolIdSchema,
  workerType: workerTypeSchema,
  executionMode: readyAudioAdapterExecutionModeSchema,
  inputArtifacts: z.array(readyAudioArtifactManifestEntrySchema),
  metadata: z.record(z.string(), z.unknown()).optional(),
}).strict()

export const readyAudioAdapterResultSchema = z.object({
  adapterPackVersion: z.literal('ready-audio-adapter-pack-v1'),
  toolId: readyAudioAdapterToolIdSchema,
  displayName: z.string().min(1),
  workerType: workerTypeSchema,
  executionMode: readyAudioAdapterExecutionModeSchema,
  status: z.enum(readyAudioAdapterStatuses),
  mockSafe: z.literal(true),
  realToolExecution: z.literal(false),
  inputManifest: z.array(readyAudioArtifactManifestEntrySchema),
  outputManifest: z.array(readyAudioArtifactManifestEntrySchema),
  qaChecks: z.array(readyAudioAdapterQAResultSchema).min(1),
  blockers: z.array(z.object({
    code: z.string().min(1),
    message: z.string().min(1),
    details: z.record(z.string(), z.unknown()).optional(),
  }).strict()),
  userFacingActivity: z.string().min(1),
  resultSummary: z.string().min(1),
  warnings: z.array(z.string().min(1)),
}).strict()

export type ReadyAudioArtifactManifestEntry = z.infer<typeof readyAudioArtifactManifestEntrySchema>
export type ReadyAudioAdapterQAResult = z.infer<typeof readyAudioAdapterQAResultSchema>
export type ReadyAudioAdapterRequest = z.infer<typeof readyAudioAdapterRequestSchema>
export type ReadyAudioAdapterResult = z.infer<typeof readyAudioAdapterResultSchema>
