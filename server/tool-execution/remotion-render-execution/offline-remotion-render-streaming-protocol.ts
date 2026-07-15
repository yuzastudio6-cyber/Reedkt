import { createHash } from 'node:crypto'

import { ApiError } from '../../errors/api-error'
import {
  OFFLINE_REMOTION_RENDER_OPERATION,
  validateOfflineRemotionFinalCompositionPlanningPayload,
  type OfflineRemotionFinalCompositionPlanningPayload,
  type OfflineRemotionSingleSourceMimeType,
} from './offline-remotion-render-execution-protocol'

export const OFFLINE_REMOTION_RENDER_STREAMING_REQUEST_PROTOCOL =
  'offline-remotion-render-stream-execution-v2' as const
export const OFFLINE_REMOTION_RENDER_STREAMING_CONTAINER_PROTOCOL =
  'offline-remotion-render-stream-execution-container-v2' as const
export const OFFLINE_REMOTION_RENDER_SERVER_INPUT_MODE =
  'server_injected_private_stream_v1' as const

export const OFFLINE_REMOTION_RENDER_STREAMING_MAXIMUM_MANIFEST_BYTES = 256 * 1024
export const OFFLINE_REMOTION_RENDER_STREAMING_MAXIMUM_SOURCE_BYTES = 192 * 1024 * 1024
export const OFFLINE_REMOTION_RENDER_STREAMING_MAXIMUM_COMBINED_SOURCE_BYTES = 192 * 1024 * 1024
export const OFFLINE_REMOTION_RENDER_STREAMING_MAXIMUM_CAPTION_BYTES = 8 * 1024 * 1024
export const OFFLINE_REMOTION_RENDER_STREAMING_MAXIMUM_COMBINED_VOICE_BYTES = 64 * 1024 * 1024
export const OFFLINE_REMOTION_RENDER_STREAMING_MAXIMUM_COMBINED_INPUT_BYTES = 272 * 1024 * 1024
export const OFFLINE_REMOTION_RENDER_STREAMING_MAXIMUM_OUTPUT_BYTES = 256 * 1024 * 1024

const SHA256 = /^[a-f0-9]{64}$/u
const SAFE_INPUT_ID = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/u
const SINGLE_CAPTION_OUTPUT_KEY = 'approved-full-frame-caption-overlay' as const

export interface OfflineRemotionStreamingSourceCommitment {
  inputId: string
  sourceSequenceItemId?: string
  mimeType: OfflineRemotionSingleSourceMimeType
  byteLength: number
  sha256: string
}

export interface OfflineRemotionStreamingCaptionCommitment {
  inputId: string
  outputKey: string
  mimeType: 'image/png'
  byteLength: number
  sha256: string
}

export interface OfflineRemotionStreamingVoiceCommitment {
  inputId: string
  sourceSequenceItemId: string
  outputKey: string
  durationFrames: number
  mimeType: 'audio/wav'
  byteLength: number
  sha256: string
}

export interface OfflineRemotionStreamingInputs {
  sources: OfflineRemotionStreamingSourceCommitment[]
  captionOverlays: OfflineRemotionStreamingCaptionCommitment[]
  voiceTracks: OfflineRemotionStreamingVoiceCommitment[]
}

export interface OfflineRemotionStreamingRenderRequest {
  schemaVersion: typeof OFFLINE_REMOTION_RENDER_STREAMING_REQUEST_PROTOCOL
  toolId: 'remotion'
  operationId: typeof OFFLINE_REMOTION_RENDER_OPERATION
  inputMode: typeof OFFLINE_REMOTION_RENDER_SERVER_INPUT_MODE
  payload: OfflineRemotionFinalCompositionPlanningPayload
  inputs: OfflineRemotionStreamingInputs
}

type InputCommitment = {
  inputId: string
  mimeType: OfflineRemotionSingleSourceMimeType | 'image/png' | 'audio/wav'
  byteLength: number
  sha256: string
}

export function buildOfflineRemotionFinalCompositionStreamingRequest(input: {
  planningPayload: unknown
  source?: OfflineRemotionStreamingSourceCommitment
  sources?: OfflineRemotionStreamingSourceCommitment[]
  captionOverlay?: Omit<OfflineRemotionStreamingCaptionCommitment, 'outputKey'>
  captionOverlays?: OfflineRemotionStreamingCaptionCommitment[]
  voiceTracks?: OfflineRemotionStreamingVoiceCommitment[]
}): OfflineRemotionStreamingRenderRequest {
  const planning = validateOfflineRemotionFinalCompositionPlanningPayload(input.planningPayload)
  const sourceSequence = 'sourceSegments' in planning
  const captionTrack = 'captionOverlayCues' in planning
  const replaceVoice = planning.audioPolicy === 'replace_with_approved_voice_tracks'
  if (sourceSequence ? input.source !== undefined || !input.sources : !input.source || input.sources !== undefined) {
    throw invalid('Streaming source commitments do not match the approved composition profile.')
  }
  if (captionTrack ? input.captionOverlay !== undefined || !input.captionOverlays : !input.captionOverlay || input.captionOverlays !== undefined) {
    throw invalid('Streaming caption commitments do not match the approved composition profile.')
  }
  if (replaceVoice ? !input.voiceTracks : input.voiceTracks !== undefined) {
    throw invalid('Streaming voice commitments do not match the approved audio policy.')
  }
  return validateOfflineRemotionStreamingRenderRequest({
    schemaVersion: OFFLINE_REMOTION_RENDER_STREAMING_REQUEST_PROTOCOL,
    toolId: 'remotion',
    operationId: OFFLINE_REMOTION_RENDER_OPERATION,
    inputMode: OFFLINE_REMOTION_RENDER_SERVER_INPUT_MODE,
    payload: planning,
    inputs: {
      sources: sourceSequence ? input.sources : [input.source],
      captionOverlays: captionTrack
        ? input.captionOverlays
        : [{ ...input.captionOverlay, outputKey: SINGLE_CAPTION_OUTPUT_KEY }],
      voiceTracks: input.voiceTracks ?? [],
    },
  })
}

export function validateOfflineRemotionStreamingRenderRequest(
  value: unknown,
): OfflineRemotionStreamingRenderRequest {
  const request = exactRecord(value, [
    'schemaVersion', 'toolId', 'operationId', 'inputMode', 'payload', 'inputs',
  ], 'streaming request')
  if (
    request.schemaVersion !== OFFLINE_REMOTION_RENDER_STREAMING_REQUEST_PROTOCOL ||
    request.toolId !== 'remotion' ||
    request.operationId !== OFFLINE_REMOTION_RENDER_OPERATION ||
    request.inputMode !== OFFLINE_REMOTION_RENDER_SERVER_INPUT_MODE
  ) throw invalid('Streaming Remotion request identity is unsupported.')

  const planning = validateOfflineRemotionFinalCompositionPlanningPayload(request.payload)
  const sourceSequence = 'sourceSegments' in planning
  const captionTrack = 'captionOverlayCues' in planning
  const replaceVoice = planning.audioPolicy === 'replace_with_approved_voice_tracks'
  const inputs = exactRecord(request.inputs, [
    'sources', 'captionOverlays', 'voiceTracks',
  ], 'streaming inputs')
  if (!Array.isArray(inputs.sources) || !Array.isArray(inputs.captionOverlays) || !Array.isArray(inputs.voiceTracks)) {
    throw invalid('Streaming Remotion inputs must be exact arrays.')
  }

  const expectedSourceCount = sourceSequence ? planning.sourceSegments.length : 1
  if (inputs.sources.length !== expectedSourceCount) {
    throw invalid('Streaming source commitments do not match the approved source count.')
  }
  const requiredSourceMimeType = planning.sourceMediaPolicy ===
    'approved_professional_color_intermediate_v1'
    ? 'video/x-matroska' as const
    : 'video/mp4' as const
  const sources = inputs.sources.map((candidate, index) => {
    const source = exactRecord(candidate, sourceSequence
      ? ['inputId', 'sourceSequenceItemId', 'mimeType', 'byteLength', 'sha256']
      : ['inputId', 'mimeType', 'byteLength', 'sha256'], `source ${index + 1}`)
    const commitment = committedInput(
      source,
      requiredSourceMimeType,
      64,
      OFFLINE_REMOTION_RENDER_STREAMING_MAXIMUM_SOURCE_BYTES,
      `source ${index + 1}`,
    )
    if (
      sourceSequence &&
      source.sourceSequenceItemId !== planning.sourceSegments[index]?.sourceSequenceItemId
    ) throw invalid('Streaming source order diverges from the approved source sequence.')
    return {
      ...commitment,
      ...(sourceSequence ? { sourceSequenceItemId: String(source.sourceSequenceItemId) } : {}),
    }
  })
  const combinedSourceBytes = sources.reduce((total, source) => safeSum(total, source.byteLength), 0)
  if (combinedSourceBytes > OFFLINE_REMOTION_RENDER_STREAMING_MAXIMUM_COMBINED_SOURCE_BYTES) {
    throw invalid('Streaming sources exceed the current confined-render capacity.')
  }

  const expectedCaptionCount = captionTrack ? planning.captionOverlayCues.length : 1
  if (inputs.captionOverlays.length !== expectedCaptionCount) {
    throw invalid('Streaming caption commitments do not match the approved caption count.')
  }
  const captionOverlays = inputs.captionOverlays.map((candidate, index) => {
    const caption = exactRecord(candidate, [
      'inputId', 'outputKey', 'mimeType', 'byteLength', 'sha256',
    ], `caption ${index + 1}`)
    const expectedOutputKey = captionTrack
      ? planning.captionOverlayCues[index]?.outputKey
      : SINGLE_CAPTION_OUTPUT_KEY
    if (caption.outputKey !== expectedOutputKey) {
      throw invalid('Streaming caption order diverges from the approved caption timing.')
    }
    return {
      ...committedInput(
        caption,
        'image/png',
        1_024,
        OFFLINE_REMOTION_RENDER_STREAMING_MAXIMUM_CAPTION_BYTES,
        `caption ${index + 1}`,
      ),
      outputKey: String(caption.outputKey),
    }
  })
  const combinedCaptionBytes = captionOverlays.reduce(
    (total, caption) => safeSum(total, caption.byteLength),
    0,
  )
  if (combinedCaptionBytes > OFFLINE_REMOTION_RENDER_STREAMING_MAXIMUM_CAPTION_BYTES) {
    throw invalid('Streaming captions exceed their combined byte ceiling.')
  }

  const expectedVoiceTracks = replaceVoice ? (planning.voiceTracks ?? []) : []
  if (inputs.voiceTracks.length !== expectedVoiceTracks.length) {
    throw invalid('Streaming voice commitments do not match the approved voice-track count.')
  }
  const voiceTracks = inputs.voiceTracks.map((candidate, index) => {
    const voice = exactRecord(candidate, [
      'inputId', 'sourceSequenceItemId', 'outputKey', 'durationFrames',
      'mimeType', 'byteLength', 'sha256',
    ], `voice track ${index + 1}`)
    const expected = expectedVoiceTracks[index]
    if (
      !expected || voice.sourceSequenceItemId !== expected.sourceSequenceItemId ||
      voice.outputKey !== expected.outputKey || voice.durationFrames !== expected.durationFrames
    ) throw invalid('Streaming voice order diverges from the approved voice timeline.')
    return {
      ...committedInput(
        voice,
        'audio/wav',
        44,
        OFFLINE_REMOTION_RENDER_STREAMING_MAXIMUM_COMBINED_VOICE_BYTES,
        `voice track ${index + 1}`,
      ),
      sourceSequenceItemId: expected.sourceSequenceItemId,
      outputKey: expected.outputKey,
      durationFrames: expected.durationFrames,
    }
  })
  const combinedVoiceBytes = voiceTracks.reduce(
    (total, voice) => safeSum(total, voice.byteLength),
    0,
  )
  if (combinedVoiceBytes > OFFLINE_REMOTION_RENDER_STREAMING_MAXIMUM_COMBINED_VOICE_BYTES) {
    throw invalid('Streaming voice tracks exceed their combined byte ceiling.')
  }

  const allInputs = [...sources, ...captionOverlays, ...voiceTracks]
  if (new Set(allInputs.map((input) => input.inputId)).size !== allInputs.length) {
    throw invalid('Streaming input identities must be unique.')
  }
  const combinedInputBytes = allInputs.reduce(
    (total, input) => safeSum(total, input.byteLength),
    0,
  )
  if (combinedInputBytes > OFFLINE_REMOTION_RENDER_STREAMING_MAXIMUM_COMBINED_INPUT_BYTES) {
    throw invalid('Streaming inputs exceed the confined runner byte ceiling.')
  }

  const normalized: OfflineRemotionStreamingRenderRequest = {
    schemaVersion: OFFLINE_REMOTION_RENDER_STREAMING_REQUEST_PROTOCOL,
    toolId: 'remotion',
    operationId: OFFLINE_REMOTION_RENDER_OPERATION,
    inputMode: OFFLINE_REMOTION_RENDER_SERVER_INPUT_MODE,
    payload: planning,
    inputs: { sources, captionOverlays, voiceTracks },
  }
  if (Buffer.byteLength(JSON.stringify(normalized)) > OFFLINE_REMOTION_RENDER_STREAMING_MAXIMUM_MANIFEST_BYTES) {
    throw invalid('Streaming Remotion manifest exceeds its fixed metadata ceiling.')
  }
  return normalized
}

export function offlineRemotionStreamingInputCommitments(
  request: OfflineRemotionStreamingRenderRequest,
): InputCommitment[] {
  const validated = validateOfflineRemotionStreamingRenderRequest(request)
  return [
    ...validated.inputs.sources,
    ...validated.inputs.captionOverlays,
    ...validated.inputs.voiceTracks,
  ].map(({ inputId, mimeType, byteLength, sha256 }) => ({
    inputId, mimeType, byteLength, sha256,
  }))
}

export function offlineRemotionStreamingRequestSha256(
  request: OfflineRemotionStreamingRenderRequest,
): string {
  return createHash('sha256')
    .update(JSON.stringify(validateOfflineRemotionStreamingRenderRequest(request)))
    .digest('hex')
}

function committedInput<T extends InputCommitment['mimeType']>(
  value: Record<string, unknown>,
  mimeType: T,
  minimumBytes: number,
  maximumBytes: number,
  label: string,
): { inputId: string; mimeType: T; byteLength: number; sha256: string } {
  if (
    typeof value.inputId !== 'string' || !SAFE_INPUT_ID.test(value.inputId) || value.inputId.includes('..') ||
    value.mimeType !== mimeType || !Number.isSafeInteger(value.byteLength) ||
    Number(value.byteLength) < minimumBytes || Number(value.byteLength) > maximumBytes ||
    typeof value.sha256 !== 'string' || !SHA256.test(value.sha256)
  ) throw invalid(`Streaming ${label} commitment is invalid.`)
  return {
    inputId: value.inputId,
    mimeType,
    byteLength: Number(value.byteLength),
    sha256: value.sha256,
  }
}

function exactRecord(value: unknown, keys: readonly string[], label: string): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw invalid(`Streaming ${label} must be an object.`)
  }
  const result = value as Record<string, unknown>
  if (Object.keys(result).sort().join('|') !== [...keys].sort().join('|')) {
    throw invalid(`Streaming ${label} contains unsupported fields.`)
  }
  return result
}

function safeSum(left: number, right: number): number {
  const total = left + right
  if (!Number.isSafeInteger(total)) throw invalid('Streaming byte commitment exceeds safe bounds.')
  return total
}

function invalid(message: string): ApiError {
  return new ApiError('VALIDATION_FAILED', message, 400)
}
