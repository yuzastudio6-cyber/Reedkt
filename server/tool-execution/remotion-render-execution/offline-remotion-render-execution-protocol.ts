import { createHash } from 'node:crypto'

import { ApiError } from '../../errors/api-error'

export const OFFLINE_REMOTION_RENDER_REQUEST_PROTOCOL =
  'offline-remotion-render-execution-v1' as const
export const OFFLINE_REMOTION_RENDER_CONTAINER_PROTOCOL =
  'offline-remotion-render-execution-container-v1' as const
export const OFFLINE_REMOTION_RENDER_OPERATION =
  'tool.remotion.render_approved_composition.v1' as const
export const OFFLINE_REMOTION_RENDER_MAXIMUM_REQUEST_BYTES = 32 * 1024 * 1024

const SAFE_TEXT = /^(?!.*(?:https?:\/\/|ftp:\/\/|file:|data:|javascript:|\.\.\/|\.\.\\|(?:^|\s)\/(?:Users|home|etc|tmp|var|opt|app|root|proc|sys|dev)(?:\/|\b)|[A-Za-z]:[\\/]|\$\(|`|&&|\|\||#!))[\P{Cc}]+$/u
const COLORS = /^#[A-F0-9]{6}$/
const SHA256 = /^[a-f0-9]{64}$/
const APPROVED_FRAMES = ['360x640', '640x360', '480x480', '480x600', '720x405', '405x720'] as const

interface CommonCompositionPayload {
  width: 360 | 405 | 480 | 640 | 720
  height: 360 | 405 | 480 | 600 | 640 | 720
  fps: 24 | 30
  durationFrames: number
}

export interface OfflineRemotionPreviewPlanningPayload extends CommonCompositionPayload {
  frameTemplateId: 'approved_full_panel_v1' | 'approved_lower_panel_v1'
  panelBackground: string
  accentColor: string
  title: string
  subtitle: string
  caption: string
}

export interface OfflineRemotionSingleSourceFinalCompositionPlanningPayload extends CommonCompositionPayload {
  compositionProfileId: 'approved_source_caption_final_v1'
  sourceStartFrame: number
  sourceEndFrameExclusive: number
  sourceFit: 'contain'
  panelBackground: string
  audioPolicy: 'preserve_source'
  captionOverlayPolicy: 'approved_full_frame_rgba'
}

export interface OfflineRemotionSourceSequenceSegmentPlanningPayload {
  sourceSequenceItemId: string
  sourceStartFrame: number
  sourceEndFrameExclusive: number
  timelineStartFrame: number
  timelineEndFrameExclusive: number
}

export interface OfflineRemotionSourceSequenceFinalCompositionPlanningPayload extends CommonCompositionPayload {
  compositionProfileId: 'approved_source_sequence_caption_final_v1'
  sourceSegments: OfflineRemotionSourceSequenceSegmentPlanningPayload[]
  sourceFit: 'contain'
  panelBackground: string
  audioPolicy: 'preserve_source_sequence'
  captionOverlayPolicy: 'approved_full_frame_rgba'
}

export type OfflineRemotionFinalCompositionPlanningPayload =
  | OfflineRemotionSingleSourceFinalCompositionPlanningPayload
  | OfflineRemotionSourceSequenceFinalCompositionPlanningPayload

export interface OfflineRemotionSingleSourceFinalCompositionPayload extends OfflineRemotionSingleSourceFinalCompositionPlanningPayload {
  sourceMimeType: 'video/mp4'
  sourceByteLength: number
  sourceSha256: string
  sourceBytesBase64: string
  captionOverlayMimeType: 'image/png'
  captionOverlayByteLength: number
  captionOverlaySha256: string
  captionOverlayBytesBase64: string
}

export interface OfflineRemotionSourceSequenceCommittedSource {
  sourceSequenceItemId: string
  sourceMimeType: 'video/mp4'
  sourceByteLength: number
  sourceSha256: string
  sourceBytesBase64: string
}

export interface OfflineRemotionSourceSequenceFinalCompositionPayload extends OfflineRemotionSourceSequenceFinalCompositionPlanningPayload {
  sources: OfflineRemotionSourceSequenceCommittedSource[]
  captionOverlayMimeType: 'image/png'
  captionOverlayByteLength: number
  captionOverlaySha256: string
  captionOverlayBytesBase64: string
}

export type OfflineRemotionFinalCompositionPayload =
  | OfflineRemotionSingleSourceFinalCompositionPayload
  | OfflineRemotionSourceSequenceFinalCompositionPayload

export type OfflineRemotionRenderRequest = {
  schemaVersion: typeof OFFLINE_REMOTION_RENDER_REQUEST_PROTOCOL
  toolId: 'remotion'
  operationId: typeof OFFLINE_REMOTION_RENDER_OPERATION
} & ({ payload: OfflineRemotionPreviewPlanningPayload } | { payload: OfflineRemotionFinalCompositionPayload })

export type OfflineRemotionRenderPlanningPayload = OfflineRemotionPreviewPlanningPayload

export function validateOfflineRemotionRenderPlanningPayload(value: unknown): OfflineRemotionPreviewPlanningPayload {
  const request = validateOfflineRemotionRenderRequest({
    schemaVersion: OFFLINE_REMOTION_RENDER_REQUEST_PROTOCOL,
    toolId: 'remotion',
    operationId: OFFLINE_REMOTION_RENDER_OPERATION,
    payload: value,
  })
  if (isFinalCompositionPayload(request.payload)) {
    throw validationFailure('Preview planning cannot contain final-composition source bytes.')
  }
  return request.payload
}

export function validateOfflineRemotionFinalCompositionPlanningPayload(
  value: unknown,
): OfflineRemotionFinalCompositionPlanningPayload {
  const profile = record(value, 'final composition planning payload').compositionProfileId
  if (profile === 'approved_source_sequence_caption_final_v1') {
    const payload = exactRecord(value, [
      'compositionProfileId', 'width', 'height', 'fps', 'durationFrames',
      'sourceSegments', 'sourceFit', 'panelBackground', 'audioPolicy',
      'captionOverlayPolicy',
    ], 'source-sequence final composition planning payload')
    const common = commonPayload(payload, 24, 240)
    const sourceSegments = sourceSequenceSegments(payload.sourceSegments, common.durationFrames)
    if (
      payload.sourceFit !== 'contain' || payload.audioPolicy !== 'preserve_source_sequence' ||
      payload.captionOverlayPolicy !== 'approved_full_frame_rgba'
    ) throw validationFailure('Source-sequence final composition policy is unsupported.')
    return {
      ...common,
      compositionProfileId: 'approved_source_sequence_caption_final_v1',
      sourceSegments,
      sourceFit: 'contain',
      panelBackground: color(payload.panelBackground, 'panelBackground'),
      audioPolicy: 'preserve_source_sequence',
      captionOverlayPolicy: 'approved_full_frame_rgba',
    }
  }
  const payload = exactRecord(value, [
    'compositionProfileId', 'width', 'height', 'fps', 'durationFrames',
    'sourceStartFrame', 'sourceEndFrameExclusive', 'sourceFit',
    'panelBackground', 'audioPolicy', 'captionOverlayPolicy',
  ], 'final composition planning payload')
  const common = commonPayload(payload, 24, 240)
  const sourceStartFrame = integer(payload.sourceStartFrame, 0, 100_000_000, 'sourceStartFrame')
  const sourceEndFrameExclusive = integer(
    payload.sourceEndFrameExclusive,
    1,
    100_000_000,
    'sourceEndFrameExclusive',
  )
  if (
    payload.compositionProfileId !== 'approved_source_caption_final_v1' ||
    payload.sourceFit !== 'contain' || payload.audioPolicy !== 'preserve_source' ||
    payload.captionOverlayPolicy !== 'approved_full_frame_rgba' ||
    sourceEndFrameExclusive - sourceStartFrame !== common.durationFrames
  ) throw validationFailure('Final composition policy is unsupported.')
  return {
    ...common,
    compositionProfileId: 'approved_source_caption_final_v1',
    sourceStartFrame,
    sourceEndFrameExclusive,
    sourceFit: 'contain',
    panelBackground: color(payload.panelBackground, 'panelBackground'),
    audioPolicy: 'preserve_source',
    captionOverlayPolicy: 'approved_full_frame_rgba',
  }
}

export function buildOfflineRemotionFinalCompositionRequest(input: {
  planningPayload: unknown
  source?: { mimeType: 'video/mp4'; bytes: Buffer; sha256: string }
  sources?: Array<{
    sourceSequenceItemId: string
    mimeType: 'video/mp4'
    bytes: Buffer
    sha256: string
  }>
  captionOverlay: { mimeType: 'image/png'; bytes: Buffer; sha256: string }
}): OfflineRemotionRenderRequest {
  const planning = validateOfflineRemotionFinalCompositionPlanningPayload(input.planningPayload)
  const overlay = committedBytes(input.captionOverlay, 'image/png', 1024, 8 * 1024 * 1024, 'caption overlay')
  if (overlay.bytes.subarray(0, 8).toString('hex') !== '89504e470d0a1a0a') {
    throw validationFailure('Final composition caption overlay is not an approved PNG.')
  }
  if (planning.compositionProfileId === 'approved_source_sequence_caption_final_v1') {
    if (input.source !== undefined || !input.sources) {
      throw validationFailure('Source-sequence composition requires only the exact approved source list.')
    }
    if (
      input.sources.length !== planning.sourceSegments.length ||
      input.sources.some((source, index) =>
        source.sourceSequenceItemId !== planning.sourceSegments[index]?.sourceSequenceItemId)
    ) throw validationFailure('Source-sequence bytes do not match the approved segment order.')
    const sources = input.sources.map((candidate) => {
      const source = committedBytes(candidate, 'video/mp4', 64, 16 * 1024 * 1024, 'source')
      if (source.bytes.subarray(4, 8).toString('ascii') !== 'ftyp') {
        throw validationFailure('Final composition source is not an approved MP4.')
      }
      return {
        sourceSequenceItemId: candidate.sourceSequenceItemId,
        sourceMimeType: 'video/mp4' as const,
        sourceByteLength: source.bytes.byteLength,
        sourceSha256: source.sha256,
        sourceBytesBase64: source.bytes.toString('base64'),
      }
    })
    if (sources.reduce((total, source) => total + source.sourceByteLength, 0) > 20 * 1024 * 1024) {
      throw validationFailure('Source-sequence composition exceeds the bounded combined source ceiling.')
    }
    return validateOfflineRemotionRenderRequest({
      schemaVersion: OFFLINE_REMOTION_RENDER_REQUEST_PROTOCOL,
      toolId: 'remotion', operationId: OFFLINE_REMOTION_RENDER_OPERATION,
      payload: {
        ...planning,
        sources,
        captionOverlayMimeType: 'image/png', captionOverlayByteLength: overlay.bytes.byteLength,
        captionOverlaySha256: overlay.sha256, captionOverlayBytesBase64: overlay.bytes.toString('base64'),
      },
    })
  }
  if (!input.source || input.sources !== undefined) {
    throw validationFailure('Single-source composition requires one exact approved source.')
  }
  const source = committedBytes(input.source, 'video/mp4', 64, 16 * 1024 * 1024, 'source')
  if (source.bytes.subarray(4, 8).toString('ascii') !== 'ftyp') {
    throw validationFailure('Final composition source is not an approved MP4.')
  }
  return validateOfflineRemotionRenderRequest({
    schemaVersion: OFFLINE_REMOTION_RENDER_REQUEST_PROTOCOL,
    toolId: 'remotion', operationId: OFFLINE_REMOTION_RENDER_OPERATION,
    payload: {
      ...planning,
      sourceMimeType: 'video/mp4', sourceByteLength: source.bytes.byteLength,
      sourceSha256: source.sha256, sourceBytesBase64: source.bytes.toString('base64'),
      captionOverlayMimeType: 'image/png', captionOverlayByteLength: overlay.bytes.byteLength,
      captionOverlaySha256: overlay.sha256, captionOverlayBytesBase64: overlay.bytes.toString('base64'),
    },
  })
}

export function validateOfflineRemotionRenderRequest(value: unknown): OfflineRemotionRenderRequest {
  const request = exactRecord(value, ['schemaVersion', 'toolId', 'operationId', 'payload'], 'request')
  if (
    request.schemaVersion !== OFFLINE_REMOTION_RENDER_REQUEST_PROTOCOL || request.toolId !== 'remotion' ||
    request.operationId !== OFFLINE_REMOTION_RENDER_OPERATION
  ) throw validationFailure('Remotion request identity is unsupported.')
  const payloadRecord = record(request.payload, 'payload')
  if (Object.hasOwn(payloadRecord, 'compositionProfileId')) {
    if (payloadRecord.compositionProfileId === 'approved_source_sequence_caption_final_v1') {
      const payload = exactRecord(payloadRecord, [
        'compositionProfileId', 'width', 'height', 'fps', 'durationFrames',
        'sourceSegments', 'sourceFit', 'panelBackground', 'audioPolicy',
        'captionOverlayPolicy', 'sources', 'captionOverlayMimeType',
        'captionOverlayByteLength', 'captionOverlaySha256', 'captionOverlayBytesBase64',
      ], 'source-sequence final composition payload')
      const planning = validateOfflineRemotionFinalCompositionPlanningPayload({
        compositionProfileId: payload.compositionProfileId, width: payload.width,
        height: payload.height, fps: payload.fps, durationFrames: payload.durationFrames,
        sourceSegments: payload.sourceSegments, sourceFit: payload.sourceFit,
        panelBackground: payload.panelBackground, audioPolicy: payload.audioPolicy,
        captionOverlayPolicy: payload.captionOverlayPolicy,
      })
      if (planning.compositionProfileId !== 'approved_source_sequence_caption_final_v1') {
        throw validationFailure('Source-sequence final composition profile changed during validation.')
      }
      if (!Array.isArray(payload.sources) || payload.sources.length !== planning.sourceSegments.length) {
        throw validationFailure('Source-sequence commitments are incomplete.')
      }
      let totalSourceBytes = 0
      const sources = payload.sources.map((value, index) => {
        const source = exactRecord(value, [
          'sourceSequenceItemId', 'sourceMimeType', 'sourceByteLength',
          'sourceSha256', 'sourceBytesBase64',
        ], `source sequence item ${index + 1}`)
        if (source.sourceSequenceItemId !== planning.sourceSegments[index]?.sourceSequenceItemId) {
          throw validationFailure('Source-sequence commitment order diverged from the approved timeline.')
        }
        const bytes = decodeCommittedRecord(source, 'source', 'video/mp4', 64, 16 * 1024 * 1024)
        if (bytes.subarray(4, 8).toString('ascii') !== 'ftyp') {
          throw validationFailure('Source-sequence dependency has an invalid MP4 signature.')
        }
        totalSourceBytes += bytes.byteLength
        return {
          sourceSequenceItemId: String(source.sourceSequenceItemId),
          sourceMimeType: 'video/mp4' as const,
          sourceByteLength: bytes.byteLength,
          sourceSha256: String(source.sourceSha256),
          sourceBytesBase64: bytes.toString('base64'),
        }
      })
      if (totalSourceBytes > 20 * 1024 * 1024) {
        throw validationFailure('Source-sequence commitments exceed the combined byte ceiling.')
      }
      const overlay = decodeCommittedBase64(payload, 'captionOverlay', 'image/png', 1024, 8 * 1024 * 1024)
      if (overlay.subarray(0, 8).toString('hex') !== '89504e470d0a1a0a') {
        throw validationFailure('Source-sequence caption overlay has an invalid PNG signature.')
      }
      return boundedRequest({
        schemaVersion: OFFLINE_REMOTION_RENDER_REQUEST_PROTOCOL,
        toolId: 'remotion', operationId: OFFLINE_REMOTION_RENDER_OPERATION,
        payload: {
          ...planning,
          sources,
          captionOverlayMimeType: 'image/png', captionOverlayByteLength: overlay.byteLength,
          captionOverlaySha256: String(payload.captionOverlaySha256),
          captionOverlayBytesBase64: overlay.toString('base64'),
        },
      })
    }
    const payload = exactRecord(payloadRecord, [
      'compositionProfileId', 'width', 'height', 'fps', 'durationFrames',
      'sourceStartFrame', 'sourceEndFrameExclusive', 'sourceFit',
      'panelBackground', 'audioPolicy', 'captionOverlayPolicy',
      'sourceMimeType', 'sourceByteLength', 'sourceSha256', 'sourceBytesBase64',
      'captionOverlayMimeType', 'captionOverlayByteLength', 'captionOverlaySha256',
      'captionOverlayBytesBase64',
    ], 'final composition payload')
    const planning = validateOfflineRemotionFinalCompositionPlanningPayload({
      compositionProfileId: payload.compositionProfileId, width: payload.width, height: payload.height,
      fps: payload.fps, durationFrames: payload.durationFrames, sourceFit: payload.sourceFit,
      sourceStartFrame: payload.sourceStartFrame,
      sourceEndFrameExclusive: payload.sourceEndFrameExclusive,
      panelBackground: payload.panelBackground, audioPolicy: payload.audioPolicy,
      captionOverlayPolicy: payload.captionOverlayPolicy,
    })
    if (planning.compositionProfileId !== 'approved_source_caption_final_v1') {
      throw validationFailure('Single-source final composition profile changed during validation.')
    }
    const source = decodeCommittedBase64(payload, 'source', 'video/mp4', 64, 16 * 1024 * 1024)
    const overlay = decodeCommittedBase64(payload, 'captionOverlay', 'image/png', 1024, 8 * 1024 * 1024)
    if (source.subarray(4, 8).toString('ascii') !== 'ftyp' || overlay.subarray(0, 8).toString('hex') !== '89504e470d0a1a0a') {
      throw validationFailure('Final composition dependencies have invalid signatures.')
    }
    return boundedRequest({
      schemaVersion: OFFLINE_REMOTION_RENDER_REQUEST_PROTOCOL,
      toolId: 'remotion', operationId: OFFLINE_REMOTION_RENDER_OPERATION,
      payload: {
        ...planning,
        sourceMimeType: 'video/mp4', sourceByteLength: source.byteLength,
        sourceSha256: String(payload.sourceSha256), sourceBytesBase64: source.toString('base64'),
        captionOverlayMimeType: 'image/png', captionOverlayByteLength: overlay.byteLength,
        captionOverlaySha256: String(payload.captionOverlaySha256),
        captionOverlayBytesBase64: overlay.toString('base64'),
      },
    })
  }
  const payload = exactRecord(payloadRecord, [
    'width', 'height', 'fps', 'durationFrames', 'frameTemplateId',
    'panelBackground', 'accentColor', 'title', 'subtitle', 'caption',
  ], 'preview payload')
  const common = commonPayload(payload, 24, 90)
  return boundedRequest({
    schemaVersion: OFFLINE_REMOTION_RENDER_REQUEST_PROTOCOL,
    toolId: 'remotion', operationId: OFFLINE_REMOTION_RENDER_OPERATION,
    payload: {
      ...common,
      frameTemplateId: oneOf(payload.frameTemplateId, ['approved_full_panel_v1', 'approved_lower_panel_v1'], 'frameTemplateId'),
      panelBackground: color(payload.panelBackground, 'panelBackground'),
      accentColor: color(payload.accentColor, 'accentColor'),
      title: safeText(payload.title, 120, 'title'), subtitle: safeText(payload.subtitle, 180, 'subtitle'),
      caption: safeText(payload.caption, 140, 'caption'),
    },
  })
}

export function isFinalCompositionPayload(
  payload: OfflineRemotionRenderRequest['payload'],
): payload is OfflineRemotionFinalCompositionPayload {
  return 'compositionProfileId' in payload
}

export function offlineRemotionRequestSha256(request: OfflineRemotionRenderRequest): string {
  return createHash('sha256').update(JSON.stringify(request)).digest('hex')
}

function boundedRequest(request: OfflineRemotionRenderRequest): OfflineRemotionRenderRequest {
  if (Buffer.byteLength(JSON.stringify(request)) > OFFLINE_REMOTION_RENDER_MAXIMUM_REQUEST_BYTES) {
    throw validationFailure('Remotion request exceeds the fixed serialized-request ceiling.')
  }
  return request
}

function commonPayload(value: Record<string, unknown>, minimumFrames: number, maximumFrames: number): CommonCompositionPayload {
  const width = integer(value.width, 360, 720, 'width') as CommonCompositionPayload['width']
  const height = integer(value.height, 360, 720, 'height') as CommonCompositionPayload['height']
  if (!(APPROVED_FRAMES as readonly string[]).includes(`${width}x${height}`)) {
    throw validationFailure('Remotion output frame is not approved.')
  }
  return {
    width, height, fps: oneOf(value.fps, [24, 30], 'fps'),
    durationFrames: integer(value.durationFrames, minimumFrames, maximumFrames, 'durationFrames'),
  }
}

function committedBytes<T extends 'video/mp4' | 'image/png'>(
  input: { mimeType: T; bytes: Buffer; sha256: string },
  expectedMimeType: T,
  minimumBytes: number,
  maximumBytes: number,
  label: string,
): { bytes: Buffer; sha256: string } {
  if (
    input.mimeType !== expectedMimeType || !Buffer.isBuffer(input.bytes) ||
    input.bytes.byteLength < minimumBytes || input.bytes.byteLength > maximumBytes ||
    !SHA256.test(input.sha256) || createHash('sha256').update(input.bytes).digest('hex') !== input.sha256
  ) throw validationFailure(`${label} bytes do not match their approved content commitment.`)
  return { bytes: input.bytes, sha256: input.sha256 }
}

function decodeCommittedBase64(
  payload: Record<string, unknown>,
  prefix: 'source' | 'captionOverlay',
  mimeType: 'video/mp4' | 'image/png',
  minimumBytes: number,
  maximumBytes: number,
): Buffer {
  const mimeKey = `${prefix}MimeType`
  const lengthKey = `${prefix}ByteLength`
  const shaKey = `${prefix}Sha256`
  const bytesKey = `${prefix}BytesBase64`
  if (
    payload[mimeKey] !== mimeType || !Number.isSafeInteger(payload[lengthKey]) ||
    typeof payload[shaKey] !== 'string' || !SHA256.test(payload[shaKey]) ||
    typeof payload[bytesKey] !== 'string'
  ) throw validationFailure(`${prefix} content commitment is invalid.`)
  const bytes = Buffer.from(payload[bytesKey], 'base64')
  if (
    bytes.byteLength !== payload[lengthKey] || bytes.byteLength < minimumBytes || bytes.byteLength > maximumBytes ||
    bytes.toString('base64') !== payload[bytesKey] || createHash('sha256').update(bytes).digest('hex') !== payload[shaKey]
  ) throw validationFailure(`${prefix} bytes do not match their approved content commitment.`)
  return bytes
}

function decodeCommittedRecord(
  payload: Record<string, unknown>,
  prefix: 'source',
  mimeType: 'video/mp4',
  minimumBytes: number,
  maximumBytes: number,
): Buffer {
  return decodeCommittedBase64(payload, prefix, mimeType, minimumBytes, maximumBytes)
}

function sourceSequenceSegments(value: unknown, durationFrames: number): OfflineRemotionSourceSequenceSegmentPlanningPayload[] {
  if (!Array.isArray(value) || value.length < 2 || value.length > 8) {
    throw validationFailure('Source-sequence final composition requires two to eight ordered source segments.')
  }
  const seen = new Set<string>()
  let expectedTimelineStart = 0
  const segments = value.map((candidate, index) => {
    const segment = exactRecord(candidate, [
      'sourceSequenceItemId', 'sourceStartFrame', 'sourceEndFrameExclusive',
      'timelineStartFrame', 'timelineEndFrameExclusive',
    ], `source segment ${index + 1}`)
    const sourceSequenceItemId = safeIdentity(segment.sourceSequenceItemId, 'sourceSequenceItemId')
    const sourceStartFrame = integer(segment.sourceStartFrame, 0, 100_000_000, 'sourceStartFrame')
    const sourceEndFrameExclusive = integer(segment.sourceEndFrameExclusive, 1, 100_000_001, 'sourceEndFrameExclusive')
    const timelineStartFrame = integer(segment.timelineStartFrame, 0, 240, 'timelineStartFrame')
    const timelineEndFrameExclusive = integer(segment.timelineEndFrameExclusive, 1, 240, 'timelineEndFrameExclusive')
    if (
      seen.has(sourceSequenceItemId) || timelineStartFrame !== expectedTimelineStart ||
      sourceEndFrameExclusive <= sourceStartFrame || timelineEndFrameExclusive <= timelineStartFrame ||
      sourceEndFrameExclusive - sourceStartFrame !== timelineEndFrameExclusive - timelineStartFrame
    ) throw validationFailure('Source-sequence segments must be unique, contiguous, and frame-duration preserving.')
    seen.add(sourceSequenceItemId)
    expectedTimelineStart = timelineEndFrameExclusive
    return {
      sourceSequenceItemId, sourceStartFrame, sourceEndFrameExclusive,
      timelineStartFrame, timelineEndFrameExclusive,
    }
  })
  if (expectedTimelineStart !== durationFrames) {
    throw validationFailure('Source-sequence segments must cover the exact approved final duration.')
  }
  return segments
}

function safeIdentity(value: unknown, label: string): string {
  if (
    typeof value !== 'string' || value.length < 1 || value.length > 160 ||
    value !== value.trim() || value.includes('..') ||
    !/^[A-Za-z0-9][A-Za-z0-9._:-]*$/.test(value)
  ) throw validationFailure(`${label} is invalid.`)
  return value
}

function record(value: unknown, label: string): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw validationFailure(`${label} must be an object.`)
  return value as Record<string, unknown>
}
function exactRecord(value: unknown, keys: readonly string[], label: string): Record<string, unknown> {
  const valueRecord = record(value, label)
  if (Object.keys(valueRecord).sort().join('|') !== [...keys].sort().join('|')) {
    throw validationFailure(`${label} contains unsupported fields.`)
  }
  return valueRecord
}
function integer(value: unknown, min: number, max: number, label: string): number {
  if (!Number.isSafeInteger(value) || Number(value) < min || Number(value) > max) {
    throw validationFailure(`${label} is outside its approved bounds.`)
  }
  return Number(value)
}
function oneOf<T extends string | number>(value: unknown, choices: readonly T[], label: string): T {
  if (!choices.includes(value as T)) throw validationFailure(`${label} is unsupported.`)
  return value as T
}
function color(value: unknown, label: string): string {
  if (typeof value !== 'string' || !COLORS.test(value.toUpperCase())) throw validationFailure(`${label} is invalid.`)
  return value.toUpperCase()
}
function safeText(value: unknown, max: number, label: string): string {
  if (typeof value !== 'string' || value.length < 1 || value.length > max || value !== value.trim() || !SAFE_TEXT.test(value)) {
    throw validationFailure(`${label} is unsafe or outside bounds.`)
  }
  return value
}
function validationFailure(message: string): ApiError { return new ApiError('VALIDATION_FAILED', message, 400) }
