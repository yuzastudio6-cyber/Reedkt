import { createHash } from 'node:crypto'

import { ApiError } from '../../errors/api-error'

const SHA256 = /^[a-f0-9]{64}$/u
const APPROVED_FRAMES = new Set(['360x640', '640x360', '480x480', '480x600'])

export const OFFLINE_REMOTION_TRACK_ALL_TREATMENT_PROFILE =
  'track_all_private_treatment_preview_v1' as const

export type OfflineRemotionTrackAllFocusTreatment =
  | 'subject_sharp_background_soft'
  | 'subject_normal_background_dim'
  | 'tracked_spotlight'
  | 'tracked_vignette'
  | 'tracked_magnification'
  | 'foreground_softening'
  | 'background_softening'
  | 'simple_subject_outline'

export interface OfflineRemotionTrackAllTreatmentSample {
  frameIndex: number
  crop: { x: number; y: number; width: number; height: number }
  priorityTrackIds: string[]
  confidence: number
  safeZoneCollision: boolean
}

export interface OfflineRemotionTrackAllTreatmentPlanningPayload {
  compositionProfileId: typeof OFFLINE_REMOTION_TRACK_ALL_TREATMENT_PROFILE
  width: 360 | 480 | 640
  height: 360 | 480 | 600 | 640
  fps: 24 | 30
  durationFrames: number
  sourceStartFrame: number
  sourceEndFrameExclusive: number
  treatmentKind: 'focus' | 'reframe'
  focusTreatment?: OfflineRemotionTrackAllFocusTreatment
  samples: OfflineRemotionTrackAllTreatmentSample[]
  maximumZoom: number
  lowConfidenceBehavior: 'hold_last_safe_crop' | 'widen_crop' | 'manual_review'
  captionLayerOrder: 'captions_above_track_all'
  audioPolicy: 'remove_for_private_qa'
  privateOutput: true
  publicArtifact: false
}

export interface OfflineRemotionTrackAllTreatmentPayload
  extends OfflineRemotionTrackAllTreatmentPlanningPayload {
  sourceMimeType: 'video/mp4' | 'video/x-matroska'
  sourceByteLength: number
  sourceSha256: string
  sourceBytesBase64: string
}

export function isOfflineRemotionTrackAllTreatmentPayload(
  value: unknown,
): value is OfflineRemotionTrackAllTreatmentPayload {
  return record(value).compositionProfileId ===
    OFFLINE_REMOTION_TRACK_ALL_TREATMENT_PROFILE
}

export function validateOfflineRemotionTrackAllTreatmentPlanningPayload(
  value: unknown,
): OfflineRemotionTrackAllTreatmentPlanningPayload {
  const payload = exactObject(value, [
    'compositionProfileId', 'width', 'height', 'fps', 'durationFrames',
    'sourceStartFrame', 'sourceEndFrameExclusive', 'treatmentKind',
    ...(record(value).treatmentKind === 'focus' ? ['focusTreatment'] : []),
    'samples', 'maximumZoom', 'lowConfidenceBehavior', 'captionLayerOrder',
    'audioPolicy', 'privateOutput', 'publicArtifact',
  ])
  const width = integer(payload.width, 360, 640)
  const height = integer(payload.height, 360, 640)
  const fps = integer(payload.fps, 24, 30)
  const durationFrames = integer(payload.durationFrames, 1, 1_920)
  const sourceStartFrame = integer(payload.sourceStartFrame, 0, 100_000_000)
  const sourceEndFrameExclusive = integer(
    payload.sourceEndFrameExclusive,
    1,
    100_000_000,
  )
  if (
    payload.compositionProfileId !== OFFLINE_REMOTION_TRACK_ALL_TREATMENT_PROFILE ||
    !APPROVED_FRAMES.has(`${width}x${height}`) ||
    ![24, 30].includes(fps) ||
    sourceEndFrameExclusive - sourceStartFrame !== durationFrames ||
    !['focus', 'reframe'].includes(String(payload.treatmentKind)) ||
    !['hold_last_safe_crop', 'widen_crop', 'manual_review'].includes(
      String(payload.lowConfidenceBehavior),
    ) ||
    payload.captionLayerOrder !== 'captions_above_track_all' ||
    payload.audioPolicy !== 'remove_for_private_qa' ||
    payload.privateOutput !== true ||
    payload.publicArtifact !== false
  ) throw invalid()
  const focusTreatment = payload.treatmentKind === 'focus'
    ? focusTreatmentValue(payload.focusTreatment)
    : undefined
  if (payload.treatmentKind === 'reframe' && Object.hasOwn(payload, 'focusTreatment')) {
    throw invalid()
  }
  if (!Array.isArray(payload.samples) || payload.samples.length !== durationFrames) {
    throw invalid()
  }
  const samples = payload.samples.map((value, index) => {
    const sample = exactObject(value, [
      'frameIndex', 'crop', 'priorityTrackIds', 'confidence',
      'safeZoneCollision',
    ])
    const crop = exactObject(sample.crop, ['x', 'y', 'width', 'height'])
    const normalizedCrop = {
      x: unit(crop.x),
      y: unit(crop.y),
      width: unit(crop.width),
      height: unit(crop.height),
    }
    if (
      sample.frameIndex !== index ||
      normalizedCrop.width <= 0 || normalizedCrop.height <= 0 ||
      normalizedCrop.x + normalizedCrop.width > 1 ||
      normalizedCrop.y + normalizedCrop.height > 1 ||
      !Array.isArray(sample.priorityTrackIds) ||
      sample.priorityTrackIds.length < 1 || sample.priorityTrackIds.length > 16 ||
      sample.priorityTrackIds.some((id) =>
        typeof id !== 'string' || !/^[a-z0-9][a-z0-9._:-]{0,127}$/u.test(id)) ||
      new Set(sample.priorityTrackIds).size !== sample.priorityTrackIds.length ||
      typeof sample.safeZoneCollision !== 'boolean'
    ) throw invalid()
    return {
      frameIndex: index,
      crop: normalizedCrop,
      priorityTrackIds: [...sample.priorityTrackIds],
      confidence: unit(sample.confidence),
      safeZoneCollision: sample.safeZoneCollision,
    }
  })
  const maximumZoom = Number(payload.maximumZoom)
  if (!Number.isFinite(maximumZoom) || maximumZoom < 1 || maximumZoom > 2.5) {
    throw invalid()
  }
  if (
    samples.some((sample) =>
      Math.min(1 / sample.crop.width, 1 / sample.crop.height) >
        maximumZoom + 0.001)
  ) throw invalid()
  return {
    compositionProfileId: OFFLINE_REMOTION_TRACK_ALL_TREATMENT_PROFILE,
    width: width as 360 | 480 | 640,
    height: height as 360 | 480 | 600 | 640,
    fps: fps as 24 | 30,
    durationFrames,
    sourceStartFrame,
    sourceEndFrameExclusive,
    treatmentKind: payload.treatmentKind as 'focus' | 'reframe',
    ...(focusTreatment ? { focusTreatment } : {}),
    samples,
    maximumZoom,
    lowConfidenceBehavior: payload.lowConfidenceBehavior as
      OfflineRemotionTrackAllTreatmentPlanningPayload['lowConfidenceBehavior'],
    captionLayerOrder: 'captions_above_track_all',
    audioPolicy: 'remove_for_private_qa',
    privateOutput: true,
    publicArtifact: false,
  }
}

export function buildOfflineRemotionTrackAllTreatmentRequest(input: {
  planningPayload: unknown
  source: {
    mimeType: 'video/mp4' | 'video/x-matroska'
    bytes: Buffer
    sha256: string
  }
}): {
  schemaVersion: 'offline-remotion-render-execution-v1'
  toolId: 'remotion'
  operationId: 'tool.remotion.render_approved_composition.v1'
  payload: OfflineRemotionTrackAllTreatmentPayload
} {
  const planning = validateOfflineRemotionTrackAllTreatmentPlanningPayload(
    input.planningPayload,
  )
  if (
    !Buffer.isBuffer(input.source.bytes) || input.source.bytes.length < 64 ||
    input.source.bytes.length > 16 * 1024 * 1024 ||
    !['video/mp4', 'video/x-matroska'].includes(input.source.mimeType) ||
    !SHA256.test(input.source.sha256) ||
    createHash('sha256').update(input.source.bytes).digest('hex') !==
      input.source.sha256 ||
    !approvedSourceSignature(input.source.bytes, input.source.mimeType)
  ) throw invalid()
  return {
    schemaVersion: 'offline-remotion-render-execution-v1',
    toolId: 'remotion',
    operationId: 'tool.remotion.render_approved_composition.v1',
    payload: {
      ...planning,
      sourceMimeType: input.source.mimeType,
      sourceByteLength: input.source.bytes.length,
      sourceSha256: input.source.sha256,
      sourceBytesBase64: input.source.bytes.toString('base64'),
    },
  }
}

export function validateOfflineRemotionTrackAllTreatmentPayload(
  value: unknown,
): OfflineRemotionTrackAllTreatmentPayload {
  const raw = record(value)
  const planning = validateOfflineRemotionTrackAllTreatmentPlanningPayload({
    compositionProfileId: raw.compositionProfileId,
    width: raw.width,
    height: raw.height,
    fps: raw.fps,
    durationFrames: raw.durationFrames,
    sourceStartFrame: raw.sourceStartFrame,
    sourceEndFrameExclusive: raw.sourceEndFrameExclusive,
    treatmentKind: raw.treatmentKind,
    ...(raw.treatmentKind === 'focus' ? { focusTreatment: raw.focusTreatment } : {}),
    samples: raw.samples,
    maximumZoom: raw.maximumZoom,
    lowConfidenceBehavior: raw.lowConfidenceBehavior,
    captionLayerOrder: raw.captionLayerOrder,
    audioPolicy: raw.audioPolicy,
    privateOutput: raw.privateOutput,
    publicArtifact: raw.publicArtifact,
  })
  const payload = exactObject(value, [
    ...Object.keys(planning), 'sourceMimeType', 'sourceByteLength',
    'sourceSha256', 'sourceBytesBase64',
  ])
  if (
    !['video/mp4', 'video/x-matroska'].includes(String(payload.sourceMimeType)) ||
    !Number.isSafeInteger(payload.sourceByteLength) ||
    Number(payload.sourceByteLength) < 64 ||
    Number(payload.sourceByteLength) > 16 * 1024 * 1024 ||
    !SHA256.test(String(payload.sourceSha256)) ||
    typeof payload.sourceBytesBase64 !== 'string'
  ) throw invalid()
  const bytes = Buffer.from(payload.sourceBytesBase64, 'base64')
  if (
    bytes.length !== payload.sourceByteLength ||
    bytes.toString('base64') !== payload.sourceBytesBase64 ||
    createHash('sha256').update(bytes).digest('hex') !== payload.sourceSha256 ||
    !approvedSourceSignature(
      bytes,
      payload.sourceMimeType as 'video/mp4' | 'video/x-matroska',
    )
  ) throw invalid()
  return {
    ...planning,
    sourceMimeType: payload.sourceMimeType as 'video/mp4' | 'video/x-matroska',
    sourceByteLength: bytes.length,
    sourceSha256: String(payload.sourceSha256),
    sourceBytesBase64: bytes.toString('base64'),
  }
}

function focusTreatmentValue(value: unknown): OfflineRemotionTrackAllFocusTreatment {
  const allowed: OfflineRemotionTrackAllFocusTreatment[] = [
    'subject_sharp_background_soft', 'subject_normal_background_dim',
    'tracked_spotlight', 'tracked_vignette', 'tracked_magnification',
    'foreground_softening', 'background_softening', 'simple_subject_outline',
  ]
  if (!allowed.includes(value as OfflineRemotionTrackAllFocusTreatment)) throw invalid()
  return value as OfflineRemotionTrackAllFocusTreatment
}

function approvedSourceSignature(
  bytes: Buffer,
  mimeType: 'video/mp4' | 'video/x-matroska',
): boolean {
  return mimeType === 'video/mp4'
    ? bytes.toString('ascii', 4, 8) === 'ftyp'
    : bytes.subarray(0, 4).toString('hex') === '1a45dfa3'
}

function record(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {}
}

function exactObject(value: unknown, keys: readonly string[]): Record<string, unknown> {
  const candidate = record(value)
  if (
    Object.keys(candidate).length !== keys.length ||
    Object.keys(candidate).some((key) => !keys.includes(key)) ||
    keys.some((key) => !Object.hasOwn(candidate, key))
  ) throw invalid()
  return candidate
}

function integer(value: unknown, minimum: number, maximum: number): number {
  const numeric = Number(value)
  if (!Number.isSafeInteger(numeric) || numeric < minimum || numeric > maximum) {
    throw invalid()
  }
  return numeric
}

function unit(value: unknown): number {
  const numeric = Number(value)
  if (!Number.isFinite(numeric) || numeric < 0 || numeric > 1) throw invalid()
  return numeric
}

function invalid(): ApiError {
  return new ApiError(
    'VALIDATION_FAILED',
    'Track All Remotion treatment request is outside its fixed private contract.',
    400,
  )
}
