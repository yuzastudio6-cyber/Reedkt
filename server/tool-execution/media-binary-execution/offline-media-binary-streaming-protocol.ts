import { createHash } from 'node:crypto'

import { REEDITPRO_SOURCE_MEDIA_MAX_BYTES } from '../../../src/types/large-media'
import {
  OFFLINE_MEDIA_BINARY_OPERATIONS,
  validateOfflineFfmpegPlanningPayload,
  validateOfflineFfprobePlanningPayload,
  type OfflineFfmpegColorMatchDeliveryPlanningPayload,
  type OfflineFfmpegPlanningPayload,
  type OfflineFfprobePlanningPayload,
} from './offline-media-binary-protocol'

export const OFFLINE_MEDIA_BINARY_STREAM_PROTOCOL =
  'offline-media-binary-stream-execution-v2' as const
export const OFFLINE_MEDIA_BINARY_SERVER_INPUT_MODE =
  'server_injected_private_stream_v1' as const

export interface OfflineMediaBinaryStreamSourceCommitment {
  mimeType: 'video/mp4'
  sourceByteLength: number
  sourceSha256: string
  sourceInputMode: typeof OFFLINE_MEDIA_BINARY_SERVER_INPUT_MODE
}

type OfflineMediaBinaryReferenceCommitment = {
  referenceMimeType: 'video/x-matroska'
  referenceSourceByteLength: number
  referenceSourceSha256: string
  referenceSourceBytesBase64: string
}

export interface OfflineFfprobeStreamingExecutionRequest {
  schemaVersion: typeof OFFLINE_MEDIA_BINARY_STREAM_PROTOCOL
  toolId: 'ffprobe'
  operationId: typeof OFFLINE_MEDIA_BINARY_OPERATIONS.ffprobe
  payload: OfflineFfprobePlanningPayload & OfflineMediaBinaryStreamSourceCommitment
}

export type OfflineFfmpegStreamingExecutionRequest = {
  schemaVersion: typeof OFFLINE_MEDIA_BINARY_STREAM_PROTOCOL
  toolId: 'ffmpeg'
  operationId: typeof OFFLINE_MEDIA_BINARY_OPERATIONS.ffmpeg
  payload:
    | (Exclude<OfflineFfmpegPlanningPayload, OfflineFfmpegColorMatchDeliveryPlanningPayload> &
        OfflineMediaBinaryStreamSourceCommitment)
    | (OfflineFfmpegColorMatchDeliveryPlanningPayload &
        OfflineMediaBinaryStreamSourceCommitment &
        OfflineMediaBinaryReferenceCommitment)
}

export function validateOfflineFfprobeStreamingExecutionRequest(
  value: unknown,
): OfflineFfprobeStreamingExecutionRequest {
  const request = exactObject(value, ['schemaVersion', 'toolId', 'operationId', 'payload'])
  if (
    request.schemaVersion !== OFFLINE_MEDIA_BINARY_STREAM_PROTOCOL ||
    request.toolId !== 'ffprobe' ||
    request.operationId !== OFFLINE_MEDIA_BINARY_OPERATIONS.ffprobe
  ) throw invalid()
  const payload = record(request.payload)
  const transportKeys = [
    'mimeType', 'sourceByteLength', 'sourceSha256', 'sourceInputMode',
  ] as const
  const planning = validateOfflineFfprobePlanningPayload(withoutKeys(payload, transportKeys))
  assertExactKeys(payload, [...Object.keys(planning), ...transportKeys])
  return {
    schemaVersion: OFFLINE_MEDIA_BINARY_STREAM_PROTOCOL,
    toolId: 'ffprobe',
    operationId: OFFLINE_MEDIA_BINARY_OPERATIONS.ffprobe,
    payload: { ...planning, ...validateSourceCommitment(payload) },
  }
}

export function validateOfflineFfmpegStreamingExecutionRequest(
  value: unknown,
): OfflineFfmpegStreamingExecutionRequest {
  const request = exactObject(value, ['schemaVersion', 'toolId', 'operationId', 'payload'])
  if (
    request.schemaVersion !== OFFLINE_MEDIA_BINARY_STREAM_PROTOCOL ||
    request.toolId !== 'ffmpeg' ||
    request.operationId !== OFFLINE_MEDIA_BINARY_OPERATIONS.ffmpeg
  ) throw invalid()
  const payload = record(request.payload)
  const sourceKeys = [
    'mimeType', 'sourceByteLength', 'sourceSha256', 'sourceInputMode',
  ] as const
  const referenceKeys = [
    'referenceMimeType', 'referenceSourceByteLength',
    'referenceSourceSha256', 'referenceSourceBytesBase64',
  ] as const
  const colorMatch = payload.recipeProfileId ===
    'approved_source_color_match_delivery_matroska_v1'
  const planning = validateOfflineFfmpegPlanningPayload(withoutKeys(
    payload,
    colorMatch ? [...sourceKeys, ...referenceKeys] : sourceKeys,
  ))
  const source = validateSourceCommitment(payload)
  if (planning.recipeProfileId === 'approved_source_color_match_delivery_matroska_v1') {
    const reference = validateReferenceCommitment(payload)
    assertExactKeys(payload, [...Object.keys(planning), ...sourceKeys, ...referenceKeys])
    return {
      schemaVersion: OFFLINE_MEDIA_BINARY_STREAM_PROTOCOL,
      toolId: 'ffmpeg',
      operationId: OFFLINE_MEDIA_BINARY_OPERATIONS.ffmpeg,
      payload: { ...planning, ...source, ...reference },
    }
  }
  assertExactKeys(payload, [...Object.keys(planning), ...sourceKeys])
  return {
    schemaVersion: OFFLINE_MEDIA_BINARY_STREAM_PROTOCOL,
    toolId: 'ffmpeg',
    operationId: OFFLINE_MEDIA_BINARY_OPERATIONS.ffmpeg,
    payload: { ...planning, ...source },
  }
}

function validateSourceCommitment(
  payload: Record<string, unknown>,
): OfflineMediaBinaryStreamSourceCommitment {
  if (
    payload.mimeType !== 'video/mp4' ||
    !Number.isSafeInteger(payload.sourceByteLength) ||
    Number(payload.sourceByteLength) < 64 ||
    Number(payload.sourceByteLength) > REEDITPRO_SOURCE_MEDIA_MAX_BYTES ||
    typeof payload.sourceSha256 !== 'string' ||
    !/^[a-f0-9]{64}$/u.test(payload.sourceSha256) ||
    payload.sourceInputMode !== OFFLINE_MEDIA_BINARY_SERVER_INPUT_MODE
  ) throw invalid()
  return {
    mimeType: 'video/mp4',
    sourceByteLength: Number(payload.sourceByteLength),
    sourceSha256: payload.sourceSha256,
    sourceInputMode: OFFLINE_MEDIA_BINARY_SERVER_INPUT_MODE,
  }
}

function validateReferenceCommitment(
  payload: Record<string, unknown>,
): OfflineMediaBinaryReferenceCommitment {
  const maximumReferenceBytes = 16 * 1024 * 1024
  const maximumReferenceBase64Length = Math.ceil(maximumReferenceBytes / 3) * 4
  if (
    payload.referenceMimeType !== 'video/x-matroska' ||
    !Number.isSafeInteger(payload.referenceSourceByteLength) ||
    Number(payload.referenceSourceByteLength) < 64 ||
    Number(payload.referenceSourceByteLength) > maximumReferenceBytes ||
    typeof payload.referenceSourceSha256 !== 'string' ||
    !/^[a-f0-9]{64}$/u.test(payload.referenceSourceSha256) ||
    typeof payload.referenceSourceBytesBase64 !== 'string' ||
    payload.referenceSourceBytesBase64.length > maximumReferenceBase64Length
  ) throw invalid()
  const bytes = Buffer.from(payload.referenceSourceBytesBase64, 'base64')
  if (
    bytes.byteLength !== payload.referenceSourceByteLength ||
    bytes.toString('base64') !== payload.referenceSourceBytesBase64 ||
    createHash('sha256').update(bytes).digest('hex') !== payload.referenceSourceSha256 ||
    bytes[0] !== 0x1a || bytes[1] !== 0x45 || bytes[2] !== 0xdf || bytes[3] !== 0xa3
  ) throw invalid()
  return {
    referenceMimeType: 'video/x-matroska',
    referenceSourceByteLength: bytes.byteLength,
    referenceSourceSha256: payload.referenceSourceSha256,
    referenceSourceBytesBase64: payload.referenceSourceBytesBase64,
  }
}

function withoutKeys(
  value: Record<string, unknown>,
  keys: readonly string[],
): Record<string, unknown> {
  const excluded = new Set(keys)
  return Object.fromEntries(Object.entries(value).filter(([key]) => !excluded.has(key)))
}

function exactObject(value: unknown, keys: readonly string[]): Record<string, unknown> {
  const valueRecord = record(value)
  assertExactKeys(valueRecord, keys)
  return valueRecord
}

function assertExactKeys(value: Record<string, unknown>, keys: readonly string[]): void {
  if (Object.keys(value).sort().join('|') !== [...keys].sort().join('|')) throw invalid()
}

function record(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw invalid()
  return value as Record<string, unknown>
}

function invalid(): Error {
  return new Error('Offline streaming media request is outside its fixed structured contract.')
}
