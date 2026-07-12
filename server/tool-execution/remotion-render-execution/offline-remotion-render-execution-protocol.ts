import { createHash } from 'node:crypto'

import { ApiError } from '../../errors/api-error'

export const OFFLINE_REMOTION_RENDER_REQUEST_PROTOCOL =
  'offline-remotion-render-execution-v1' as const
export const OFFLINE_REMOTION_RENDER_CONTAINER_PROTOCOL =
  'offline-remotion-render-execution-container-v1' as const
export const OFFLINE_REMOTION_RENDER_OPERATION =
  'tool.remotion.render_approved_composition.v1' as const

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

export interface OfflineRemotionFinalCompositionPlanningPayload extends CommonCompositionPayload {
  compositionProfileId: 'approved_source_caption_final_v1'
  sourceStartFrame: number
  sourceEndFrameExclusive: number
  sourceFit: 'contain'
  panelBackground: string
  audioPolicy: 'preserve_source'
  captionOverlayPolicy: 'approved_full_frame_rgba'
}

export interface OfflineRemotionFinalCompositionPayload extends OfflineRemotionFinalCompositionPlanningPayload {
  sourceMimeType: 'video/mp4'
  sourceByteLength: number
  sourceSha256: string
  sourceBytesBase64: string
  captionOverlayMimeType: 'image/png'
  captionOverlayByteLength: number
  captionOverlaySha256: string
  captionOverlayBytesBase64: string
}

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
  source: { mimeType: 'video/mp4'; bytes: Buffer; sha256: string }
  captionOverlay: { mimeType: 'image/png'; bytes: Buffer; sha256: string }
}): OfflineRemotionRenderRequest {
  const planning = validateOfflineRemotionFinalCompositionPlanningPayload(input.planningPayload)
  const source = committedBytes(input.source, 'video/mp4', 64, 16 * 1024 * 1024, 'source')
  const overlay = committedBytes(input.captionOverlay, 'image/png', 1024, 8 * 1024 * 1024, 'caption overlay')
  if (source.bytes.subarray(4, 8).toString('ascii') !== 'ftyp') {
    throw validationFailure('Final composition source is not an approved MP4.')
  }
  if (overlay.bytes.subarray(0, 8).toString('hex') !== '89504e470d0a1a0a') {
    throw validationFailure('Final composition caption overlay is not an approved PNG.')
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
    const source = decodeCommittedBase64(payload, 'source', 'video/mp4', 64, 16 * 1024 * 1024)
    const overlay = decodeCommittedBase64(payload, 'captionOverlay', 'image/png', 1024, 8 * 1024 * 1024)
    if (source.subarray(4, 8).toString('ascii') !== 'ftyp' || overlay.subarray(0, 8).toString('hex') !== '89504e470d0a1a0a') {
      throw validationFailure('Final composition dependencies have invalid signatures.')
    }
    return {
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
    }
  }
  const payload = exactRecord(payloadRecord, [
    'width', 'height', 'fps', 'durationFrames', 'frameTemplateId',
    'panelBackground', 'accentColor', 'title', 'subtitle', 'caption',
  ], 'preview payload')
  const common = commonPayload(payload, 24, 90)
  return {
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
  }
}

export function isFinalCompositionPayload(
  payload: OfflineRemotionRenderRequest['payload'],
): payload is OfflineRemotionFinalCompositionPayload {
  return 'compositionProfileId' in payload
}

export function offlineRemotionRequestSha256(request: OfflineRemotionRenderRequest): string {
  return createHash('sha256').update(JSON.stringify(request)).digest('hex')
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
