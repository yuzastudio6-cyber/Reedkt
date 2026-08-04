import { createHash } from 'node:crypto'
import { z } from 'zod'

import {
  OFFLINE_PYTHON_STRUCTURED_EXECUTION_PROTOCOL,
  OFFLINE_PYTHON_STRUCTURED_OPERATIONS,
  type OfflinePythonOpenCvTrackAllGeometryPlanningPayload,
  type OfflinePythonStructuredExecutionRequest,
} from '../../../tool-execution/python-runner-execution'
import {
  OFFLINE_MEDIA_BINARY_OPERATIONS,
  OFFLINE_MEDIA_BINARY_PROTOCOL,
  type OfflineFfmpegExecutionRequest,
  type OfflineFfprobeExecutionRequest,
} from '../../../tool-execution/media-binary-execution'
import { hashSkillValue } from '../../core/skill-capability-manifest-hash'
import { skillFrameRangeSchema } from '../../core/skill-assignment-schema'
import {
  skillManifestReferenceSchema,
  skillSha256Schema,
} from '../../core/skill-capability-manifest-schema'
import {
  cameraMotionGraphSchema,
  planarTrackGraphSchema,
} from '../track-all-active-artifact-contracts'

const matrix3x3 = z.tuple([
  z.number(), z.number(), z.number(),
  z.number(), z.number(), z.number(),
  z.number(), z.number(), z.number(),
])
const normalizedPoint = z.object({ x: z.number().min(0).max(1), y: z.number().min(0).max(1) }).strict()
const normalizedCorners = z.tuple([normalizedPoint, normalizedPoint, normalizedPoint, normalizedPoint])
const safeId = z.string().trim().min(1).max(180)

const geometryDocumentSchema = z.object({
  profileId: z.enum(['track_all_camera_motion_v1', 'track_all_planar_homography_v1']),
  reportedFrameCount: z.number().int().positive(),
  reportedFps: z.number().positive(),
  samples: z.array(z.object({
    frameIndex: z.number().int().nonnegative(),
    width: z.number().int().positive(),
    height: z.number().int().positive(),
    meanLuma: z.number(),
    laplacianVariance: z.number().nonnegative(),
  }).strict()).min(1).max(600),
  authorizedRange: z.object({
    startFrameInclusive: z.number().int().nonnegative(),
    endFrameExclusive: z.number().int().positive(),
  }).strict(),
  initializationFrameIndex: z.number().int().nonnegative(),
  cameraTransforms: z.array(z.object({
    frameIndex: z.number().int().nonnegative(),
    motion: z.enum(['static', 'pan', 'tilt', 'zoom', 'roll', 'handheld']),
    frameToFrameTransform: matrix3x3,
    stabilizedTransform: matrix3x3,
    confidence: z.number().min(0).max(1),
    discontinuityWarning: z.boolean(),
    shotReset: z.boolean(),
    trackedFeatureCount: z.number().int().nonnegative(),
    reprojectionError: z.number().nonnegative(),
  }).strict()).min(1).max(600),
  planarFrames: z.array(z.object({
    frameIndex: z.number().int().nonnegative(),
    corners: normalizedCorners,
    homography: matrix3x3,
    reprojectionError: z.number().nonnegative(),
    visibility: z.number().min(0).max(1),
    occlusion: z.number().min(0).max(1),
    surfaceStability: z.number().min(0).max(1),
    confidence: z.number().min(0).max(1),
    trackedFeatureCount: z.number().int().nonnegative(),
  }).strict()).max(600),
}).strict().superRefine((value, context) => {
  const range = value.authorizedRange
  if (
    range.endFrameExclusive <= range.startFrameInclusive ||
    value.initializationFrameIndex < range.startFrameInclusive ||
    value.initializationFrameIndex >= range.endFrameExclusive ||
    value.cameraTransforms.length !== value.samples.length ||
    value.samples.some((sample) => sample.frameIndex < range.startFrameInclusive || sample.frameIndex >= range.endFrameExclusive) ||
    value.cameraTransforms.some((sample) => sample.frameIndex < range.startFrameInclusive || sample.frameIndex >= range.endFrameExclusive)
  ) context.addIssue({ code: 'custom', message: 'Track All geometry output exceeds its exact range or sample lineage.' })
  if (
    (value.profileId === 'track_all_camera_motion_v1' && value.planarFrames.length !== 0) ||
    (value.profileId === 'track_all_planar_homography_v1' && value.planarFrames.length !== value.samples.length)
  ) context.addIssue({ code: 'custom', message: 'Track All geometry output does not match the requested fixed profile.' })
})

const ffprobeDocumentSchema = z.object({
  streams: z.array(z.object({
    index: z.number().int().nonnegative(),
    codec_type: z.string(),
    codec_name: z.string(),
    width: z.number().int().positive().optional(),
    height: z.number().int().positive().optional(),
    avg_frame_rate: z.string(),
    nb_read_frames: z.string().optional(),
    duration: z.string().optional(),
    side_data_list: z.array(z.object({ rotation: z.number().optional() }).passthrough()).optional(),
  }).passthrough()).min(1),
  format: z.object({ duration: z.string().optional() }).passthrough().optional(),
}).passthrough()

const sceneDetectionDocumentSchema = z.object({
  profileId: z.literal('track_all_content_detector_v1'),
  threshold: z.number().min(0).max(100),
  minimumSceneFrames: z.number().int().positive(),
  downscaleFactor: z.number().int().min(1).max(8),
  scenes: z.array(z.object({
    startFrame: z.number().int().nonnegative(),
    endFrame: z.number().int().positive(),
    startSeconds: z.number().nonnegative(),
    endSeconds: z.number().positive(),
  }).strict()).min(1).max(10_000),
}).strict()

const sourceTruthCoreSchema = z.object({
  schemaVersion: z.literal('track_all_ffprobe_source_truth_v1'),
  operationId: z.literal('tool.ffprobe.inspect_approved_media.v1'),
  sourceSha256: skillSha256Schema,
  streamIndex: z.number().int().nonnegative(),
  codec: safeId,
  width: z.number().int().positive(),
  height: z.number().int().positive(),
  frameCount: z.number().int().positive(),
  fps: z.number().positive(),
  durationSeconds: z.number().positive(),
  rotationDegrees: z.number().min(-360).max(360),
}).strict()

export const trackAllFfprobeSourceTruthSchema = sourceTruthCoreSchema.extend({
  technicalTruthHash: skillSha256Schema,
}).strict().superRefine((value, context) => {
  const { technicalTruthHash, ...core } = value
  if (hashSkillValue(core) !== technicalTruthHash) {
    context.addIssue({ code: 'custom', message: 'Track All FFprobe source truth is stale or forged.' })
  }
})

const shotBoundaryEvidenceCoreSchema = z.object({
  schemaVersion: z.literal('track_all_shot_boundary_evidence_v1'),
  operationId: z.literal('tool.pyscenedetect.detect_scene_boundaries.v1'),
  detectorProfileId: z.literal('track_all_content_detector_v1'),
  sourceSha256: skillSha256Schema,
  authorizedRange: skillFrameRangeSchema,
  shots: z.array(z.object({
    shotId: safeId,
    startFrameInclusive: z.number().int().nonnegative(),
    endFrameExclusive: z.number().int().positive(),
  }).strict()).min(1).max(10_000),
}).strict()

export const trackAllShotBoundaryEvidenceSchema = shotBoundaryEvidenceCoreSchema.extend({
  evidenceHash: skillSha256Schema,
}).strict().superRefine((value, context) => {
  const { evidenceHash, ...core } = value
  if (hashSkillValue(core) !== evidenceHash) {
    context.addIssue({ code: 'custom', message: 'Track All shot-boundary evidence is stale or forged.' })
  }
  if (value.shots.some((shot, index) =>
    shot.endFrameExclusive <= shot.startFrameInclusive ||
    shot.startFrameInclusive < value.authorizedRange.startFrameInclusive ||
    shot.endFrameExclusive > value.authorizedRange.endFrameExclusive ||
    (index > 0 && shot.startFrameInclusive < value.shots[index - 1]!.endFrameExclusive)
  )) context.addIssue({ code: 'custom', message: 'Track All shot-boundary evidence exceeds or overlaps its authorized range.' })
})

export interface TrackAllGeometryLineage {
  ownerUserId: string
  workspaceId: string
  projectId: string
  editSessionId: string
  assignmentId: string
  assignmentHash: string
  planHash: string
  manifestRef: z.infer<typeof skillManifestReferenceSchema>
  sourceSha256: string
  authorizedRange: z.infer<typeof skillFrameRangeSchema>
}

export function buildTrackAllFfprobeRequest(sourceBytes: Buffer): OfflineFfprobeExecutionRequest {
  const sourceSha256 = hashBytes(sourceBytes)
  return {
    schemaVersion: OFFLINE_MEDIA_BINARY_PROTOCOL,
    toolId: 'ffprobe',
    operationId: OFFLINE_MEDIA_BINARY_OPERATIONS.ffprobe,
    payload: {
      inspectionProfileId: 'source_intake_v1',
      countFrames: true,
      verifyDurationAndSync: true,
      emitMachineJsonOnly: true,
      mimeType: 'video/mp4',
      sourceByteLength: sourceBytes.byteLength,
      sourceSha256,
      sourceBytesBase64: sourceBytes.toString('base64'),
    },
  }
}

export function buildTrackAllApprovedProxyRequest(input: {
  sourceBytes: Buffer
  range: z.infer<typeof skillFrameRangeSchema>
}): OfflineFfmpegExecutionRequest {
  if (![24, 25, 30, 50, 60].includes(input.range.fps)) {
    throw new Error('Track All approved FFmpeg proxy requires a qualified frame rate.')
  }
  const sourceSha256 = hashBytes(input.sourceBytes)
  return {
    schemaVersion: OFFLINE_MEDIA_BINARY_PROTOCOL,
    toolId: 'ffmpeg',
    operationId: OFFLINE_MEDIA_BINARY_OPERATIONS.ffmpeg,
    payload: {
      recipeProfileId: 'approved_trim_transcode_v1',
      timestampPolicy: 'normalize_from_zero',
      overwriteExistingArtifact: false,
      allowUnreviewedCodec: false,
      trimStartFrame: input.range.startFrameInclusive,
      trimEndFrameExclusive: input.range.endFrameExclusive,
      frameRate: input.range.fps as 24 | 25 | 30 | 50 | 60,
      mimeType: 'video/mp4',
      sourceByteLength: input.sourceBytes.byteLength,
      sourceSha256,
      sourceBytesBase64: input.sourceBytes.toString('base64'),
    },
  }
}

export function buildTrackAllSceneDetectionRequest(input: {
  sourceBytes: Buffer
  contentThreshold: number
  minimumSceneFrames: number
  downscaleFactor: number
}): OfflinePythonStructuredExecutionRequest {
  return {
    schemaVersion: OFFLINE_PYTHON_STRUCTURED_EXECUTION_PROTOCOL,
    toolId: 'pyscenedetect',
    operationId: OFFLINE_PYTHON_STRUCTURED_OPERATIONS.pyscenedetect,
    payload: {
      detectorProfileId: 'track_all_content_detector_v1',
      contentThreshold: input.contentThreshold,
      minimumSceneFrames: input.minimumSceneFrames,
      downscaleFactor: input.downscaleFactor,
      ...sourceAuthority(input.sourceBytes),
    },
  }
}

export function buildTrackAllOpenCvGeometryRequest(input: {
  sourceBytes: Buffer
  profile: OfflinePythonOpenCvTrackAllGeometryPlanningPayload['analysisProfileId']
  range: z.infer<typeof skillFrameRangeSchema>
  initializationFrameIndex: number
  frameStride?: 1 | 5 | 10 | 15 | 30
  maximumFrames?: number
  maximumFeatures?: 256 | 512 | 1024
  ransacReprojectionThreshold?: 1 | 2 | 3 | 5
  planarCornersNormalized?: OfflinePythonOpenCvTrackAllGeometryPlanningPayload['planarCornersNormalized']
}): OfflinePythonStructuredExecutionRequest {
  const planning: OfflinePythonOpenCvTrackAllGeometryPlanningPayload = {
    analysisProfileId: input.profile,
    frameStride: input.frameStride ?? 1,
    maximumFrames: input.maximumFrames ?? Math.min(600, input.range.endFrameExclusive - input.range.startFrameInclusive),
    emitDerivedPixels: false,
    startFrameInclusive: input.range.startFrameInclusive,
    endFrameExclusive: input.range.endFrameExclusive,
    initializationFrameIndex: input.initializationFrameIndex,
    maximumFeatures: input.maximumFeatures ?? 512,
    ransacReprojectionThreshold: input.ransacReprojectionThreshold ?? 3,
    planarCornersNormalized: input.planarCornersNormalized ?? [],
  }
  return {
    schemaVersion: OFFLINE_PYTHON_STRUCTURED_EXECUTION_PROTOCOL,
    toolId: 'opencv',
    operationId: OFFLINE_PYTHON_STRUCTURED_OPERATIONS.opencv,
    payload: { ...planning, ...sourceAuthority(input.sourceBytes) },
  }
}

export function normalizeTrackAllFfprobeSourceTruth(input: {
  sourceSha256: string
  document: unknown
}) {
  const document = ffprobeDocumentSchema.parse(input.document)
  const stream = document.streams.find((candidate) => candidate.codec_type === 'video')
  if (!stream?.width || !stream.height) throw new Error('Track All FFprobe observation has no exact video stream.')
  const fps = parseFraction(stream.avg_frame_rate)
  const durationSeconds = parsePositiveNumber(stream.duration ?? document.format?.duration)
  const frameCount = stream.nb_read_frames ? parsePositiveInteger(stream.nb_read_frames) : Math.round(durationSeconds * fps)
  const rotationDegrees = stream.side_data_list?.find((entry) => typeof entry.rotation === 'number')?.rotation ?? 0
  const core = sourceTruthCoreSchema.parse({
    schemaVersion: 'track_all_ffprobe_source_truth_v1',
    operationId: 'tool.ffprobe.inspect_approved_media.v1',
    sourceSha256: input.sourceSha256,
    streamIndex: stream.index,
    codec: stream.codec_name,
    width: stream.width,
    height: stream.height,
    frameCount,
    fps,
    durationSeconds,
    rotationDegrees,
  })
  return trackAllFfprobeSourceTruthSchema.parse({ ...core, technicalTruthHash: hashSkillValue(core) })
}

export function normalizeTrackAllShotBoundaryEvidence(input: {
  sourceSha256: string
  authorizedRange: z.infer<typeof skillFrameRangeSchema>
  document: unknown
}) {
  const document = sceneDetectionDocumentSchema.parse(input.document)
  const shots = document.scenes.flatMap((scene, index) => {
    const startFrameInclusive = Math.max(input.authorizedRange.startFrameInclusive, scene.startFrame)
    const endFrameExclusive = Math.min(input.authorizedRange.endFrameExclusive, scene.endFrame)
    return endFrameExclusive > startFrameInclusive
      ? [{ shotId: `shot_${String(index + 1).padStart(3, '0')}`, startFrameInclusive, endFrameExclusive }]
      : []
  })
  const core = shotBoundaryEvidenceCoreSchema.parse({
    schemaVersion: 'track_all_shot_boundary_evidence_v1',
    operationId: 'tool.pyscenedetect.detect_scene_boundaries.v1',
    detectorProfileId: 'track_all_content_detector_v1',
    sourceSha256: input.sourceSha256,
    authorizedRange: input.authorizedRange,
    shots,
  })
  return trackAllShotBoundaryEvidenceSchema.parse({ ...core, evidenceHash: hashSkillValue(core) })
}

export function createTrackAllCameraMotionGraph(input: {
  document: unknown
  lineage: TrackAllGeometryLineage
}) {
  const document = geometryDocumentSchema.parse(input.document)
  const core = {
    schemaVersion: 'camera_motion_graph_v1' as const,
    ...input.lineage,
    transforms: document.cameraTransforms.map((transform) => ({
      frameIndex: transform.frameIndex,
      motion: transform.motion,
      frameToFrameTransform: transform.frameToFrameTransform,
      stabilizedTransform: transform.stabilizedTransform,
      confidence: transform.confidence,
      discontinuityWarning: transform.discontinuityWarning,
      shotReset: transform.shotReset,
    })),
  }
  return cameraMotionGraphSchema.parse({ ...core, artifactHash: hashSkillValue(core) })
}

export function createTrackAllPlanarTrackGraph(input: {
  document: unknown
  lineage: TrackAllGeometryLineage
  surfaceId: string
  surfaceClass: z.input<typeof planarTrackGraphSchema>['surfaceClass']
  coordinateInterpretation: 'camera_relative' | 'world_relative'
}) {
  const document = geometryDocumentSchema.parse(input.document)
  if (document.profileId !== 'track_all_planar_homography_v1') {
    throw new Error('Track All planar graph requires the exact planar OpenCV profile.')
  }
  const core = {
    schemaVersion: 'planar_track_graph_v1' as const,
    ...input.lineage,
    surfaceId: input.surfaceId,
    surfaceClass: input.surfaceClass,
    frames: document.planarFrames.map((frame) => ({
      frameIndex: frame.frameIndex,
      corners: frame.corners,
      homography: frame.homography,
      reprojectionError: frame.reprojectionError,
      visibility: frame.visibility,
      occlusion: frame.occlusion,
      surfaceStability: frame.surfaceStability,
      confidence: frame.confidence,
    })),
    coordinateInterpretation: input.coordinateInterpretation,
  }
  return planarTrackGraphSchema.parse({ ...core, artifactHash: hashSkillValue(core) })
}

function sourceAuthority(sourceBytes: Buffer) {
  return {
    mimeType: 'video/mp4' as const,
    sourceByteLength: sourceBytes.byteLength,
    sourceSha256: hashBytes(sourceBytes),
    sourceBytesBase64: sourceBytes.toString('base64'),
  }
}

function hashBytes(bytes: Buffer): string {
  return createHash('sha256').update(bytes).digest('hex')
}

function parseFraction(value: string): number {
  const [numeratorText, denominatorText] = value.split('/')
  const numerator = Number(numeratorText)
  const denominator = denominatorText === undefined ? 1 : Number(denominatorText)
  if (!Number.isFinite(numerator) || !Number.isFinite(denominator) || numerator <= 0 || denominator <= 0) {
    throw new Error('Track All FFprobe frame rate is invalid.')
  }
  return numerator / denominator
}

function parsePositiveNumber(value: string | undefined): number {
  const parsed = Number(value)
  if (!Number.isFinite(parsed) || parsed <= 0) throw new Error('Track All FFprobe duration is invalid.')
  return parsed
}

function parsePositiveInteger(value: string): number {
  const parsed = Number(value)
  if (!Number.isSafeInteger(parsed) || parsed <= 0) throw new Error('Track All FFprobe frame count is invalid.')
  return parsed
}
