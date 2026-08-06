import { createHash } from 'node:crypto'

import { ApiError } from '../../errors/api-error'

export const OFFLINE_LIBASS_CAPTION_PROTOCOL = 'offline-libass-caption-execution-v1' as const
export const OFFLINE_LIBASS_CAPTION_OPERATION = 'tool.libass.render_approved_caption_track.v1' as const

export interface OfflineLibassCaptionRequest {
  schemaVersion: typeof OFFLINE_LIBASS_CAPTION_PROTOCOL
  toolId: 'libass'
  operationId: typeof OFFLINE_LIBASS_CAPTION_OPERATION
  payload: {
    captionProfileId: 'approved_ass_track_render_v1'
    fontPackProfileId: 'reeditpro_reviewed_fonts_v1'
    collisionPolicy: 'fail_on_reserved_zone_collision'
    preserveSpeechTiming: true
    width: number
    height: number
    timestampMs: number
    fontSize: number
    marginV: number
    alignment: 2 | 8
    caption: string
  }
}

export function validateOfflineLibassCaptionRequest(value: unknown): OfflineLibassCaptionRequest {
  const request = exact(value, ['schemaVersion', 'toolId', 'operationId', 'payload'], 'request')
  if (request.schemaVersion !== OFFLINE_LIBASS_CAPTION_PROTOCOL || request.toolId !== 'libass' || request.operationId !== OFFLINE_LIBASS_CAPTION_OPERATION) {
    throw invalid('libass request identity is unsupported.')
  }
  const payload = exact(request.payload, [
    'captionProfileId', 'fontPackProfileId', 'collisionPolicy', 'preserveSpeechTiming',
    'width', 'height', 'timestampMs', 'fontSize', 'marginV', 'alignment', 'caption',
  ], 'payload')
  const width = integer(payload.width, 320, 3840, 'width')
  const height = integer(payload.height, 180, 3840, 'height')
  if (![
    '640x360',
    '360x640',
    '720x405',
    '405x720',
    '3840x2160',
    '2160x3840',
    '2160x2160',
    '2160x2700',
    '2880x2160',
  ].includes(`${width}x${height}`)) {
    throw invalid('libass approved review or 4K delivery-master frame is unsupported.')
  }
  const caption = safeCaption(payload.caption)
  if (
    payload.captionProfileId !== 'approved_ass_track_render_v1' ||
    payload.fontPackProfileId !== 'reeditpro_reviewed_fonts_v1' ||
    payload.collisionPolicy !== 'fail_on_reserved_zone_collision' ||
    payload.preserveSpeechTiming !== true || ![2, 8].includes(Number(payload.alignment))
  ) throw invalid('libass caption policy is unsupported.')
  return {
    schemaVersion: OFFLINE_LIBASS_CAPTION_PROTOCOL, toolId: 'libass', operationId: OFFLINE_LIBASS_CAPTION_OPERATION,
    payload: {
      captionProfileId: 'approved_ass_track_render_v1', fontPackProfileId: 'reeditpro_reviewed_fonts_v1',
      collisionPolicy: 'fail_on_reserved_zone_collision', preserveSpeechTiming: true,
      width, height, timestampMs: integer(payload.timestampMs, 0, 1999, 'timestampMs'),
      fontSize: integer(payload.fontSize, 18, 160, 'fontSize'), marginV: integer(payload.marginV, 20, 360, 'marginV'),
      alignment: Number(payload.alignment) as 2 | 8, caption,
    },
  }
}

export function offlineLibassCaptionRequestSha256(request: OfflineLibassCaptionRequest): string {
  return createHash('sha256').update(JSON.stringify(request)).digest('hex')
}
function exact(value: unknown, keys: readonly string[], label: string): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw invalid(`${label} must be an object.`)
  const record = value as Record<string, unknown>
  if (Object.keys(record).sort().join('|') !== [...keys].sort().join('|')) throw invalid(`${label} contains unsupported fields.`)
  return record
}
function integer(value: unknown, min: number, max: number, label: string): number {
  if (!Number.isSafeInteger(value) || Number(value) < min || Number(value) > max) throw invalid(`${label} is outside bounds.`)
  return Number(value)
}
function safeCaption(value: unknown): string {
  if (typeof value !== 'string' || value.length < 1 || value.length > 120 || value !== value.trim()) throw invalid('Caption text is outside bounds.')
  if (!/^[\x20-\x7E]+$/.test(value) || ['{', '}', '\\', '[', ']'].some((token) => value.includes(token)) || /(?:https?:\/\/|file:|data:|javascript:|\.\.\/|\$\(|`|&&|\|\||#!)/i.test(value)) {
    throw invalid('Caption text contains unsupported ASS, path, URL, or command syntax.')
  }
  return value
}
function invalid(message: string): ApiError { return new ApiError('VALIDATION_FAILED', message, 400) }
