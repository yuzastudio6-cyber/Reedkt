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
export const OFFLINE_REMOTION_RENDER_STREAMING_MAXIMUM_LIVING_FRAME_OVERLAY_BYTES =
  32 * 1024 * 1024
export const OFFLINE_REMOTION_RENDER_STREAMING_MAXIMUM_COMBINED_LIVING_FRAME_OVERLAY_BYTES =
  128 * 1024 * 1024
export const OFFLINE_REMOTION_RENDER_STREAMING_MAXIMUM_CONTROLLED_VISUAL_OVERLAY_BYTES =
  2 * 1024 * 1024
export const OFFLINE_REMOTION_RENDER_STREAMING_MAXIMUM_COMBINED_CONTROLLED_VISUAL_OVERLAY_BYTES =
  8 * 1024 * 1024
export const OFFLINE_REMOTION_RENDER_STREAMING_MAXIMUM_COMBINED_VOICE_BYTES = 64 * 1024 * 1024
export const OFFLINE_REMOTION_RENDER_STREAMING_MAXIMUM_SUPPLEMENTAL_AUDIO_BYTES =
  16 * 1024 * 1024
export const OFFLINE_REMOTION_RENDER_STREAMING_MAXIMUM_COMBINED_SUPPLEMENTAL_AUDIO_BYTES =
  64 * 1024 * 1024
export const OFFLINE_REMOTION_RENDER_STREAMING_MAXIMUM_COMBINED_INPUT_BYTES = 464 * 1024 * 1024
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

export interface OfflineRemotionStreamingLivingFrameOverlayCommitment {
  inputId: string
  outputKey: string
  mimeType: 'image/png'
  byteLength: number
  sha256: string
}

export interface OfflineRemotionStreamingControlledVisualOverlayCommitment {
  inputId: string
  outputKey: string
  mimeType: 'image/svg+xml'
  byteLength: number
  sha256: string
}

export interface OfflineRemotionStreamingVoiceCommitment {
  inputId: string
  sourceSequenceItemId: string
  outputKey: string
  durationFrames: number
  sourceStartFrame?: number
  sourceEndFrameExclusive?: number
  mimeType: 'audio/wav'
  byteLength: number
  sha256: string
}

export interface OfflineRemotionStreamingSupplementalAudioCommitment {
  inputId: string
  outputKey: string
  attachmentId: string
  markerId: string
  markerType: 'music' | 'sfx'
  startFrame: number
  endFrameExclusive: number
  fillPolicy: 'loop_or_trim_to_window' | 'trim_without_loop'
  mixProfileId:
    | 'speech_safe_uploaded_music_bed_v1'
    | 'narration_protected_uploaded_sfx_v1'
  mimeType: 'audio/wav'
  byteLength: number
  sha256: string
}

export interface OfflineRemotionStreamingInputs {
  sources: OfflineRemotionStreamingSourceCommitment[]
  livingFrameOverlays: OfflineRemotionStreamingLivingFrameOverlayCommitment[]
  controlledVisualOverlays:
    OfflineRemotionStreamingControlledVisualOverlayCommitment[]
  captionOverlays: OfflineRemotionStreamingCaptionCommitment[]
  voiceTracks: OfflineRemotionStreamingVoiceCommitment[]
  supplementalAudioTracks: OfflineRemotionStreamingSupplementalAudioCommitment[]
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
  mimeType:
    | OfflineRemotionSingleSourceMimeType
    | 'image/png'
    | 'image/svg+xml'
    | 'audio/wav'
  byteLength: number
  sha256: string
}

export function buildOfflineRemotionFinalCompositionStreamingRequest(input: {
  planningPayload: unknown
  source?: OfflineRemotionStreamingSourceCommitment
  sources?: OfflineRemotionStreamingSourceCommitment[]
  captionOverlay?: Omit<OfflineRemotionStreamingCaptionCommitment, 'outputKey'>
  captionOverlays?: OfflineRemotionStreamingCaptionCommitment[]
  livingFrameOverlays?: OfflineRemotionStreamingLivingFrameOverlayCommitment[]
  controlledVisualOverlays?:
    OfflineRemotionStreamingControlledVisualOverlayCommitment[]
  voiceTracks?: OfflineRemotionStreamingVoiceCommitment[]
  supplementalAudioTracks?: OfflineRemotionStreamingSupplementalAudioCommitment[]
}): OfflineRemotionStreamingRenderRequest {
  const planning = validateOfflineRemotionFinalCompositionPlanningPayload(input.planningPayload)
  const sourceSequence = 'sourceSegments' in planning
  const captionTrack = 'captionOverlayCues' in planning
  const replaceVoice = planning.audioPolicy === 'replace_with_approved_voice_tracks'
  const supplementalAudio = planning.supplementalAudioTracks !== undefined
  const livingFrameOverlays = planning.livingFrameOverlayLayers !== undefined
  const controlledVisualOverlays =
    planning.controlledVisualOverlayLayers !== undefined
  if (sourceSequence ? input.source !== undefined || !input.sources : !input.source || input.sources !== undefined) {
    throw invalid('Streaming source commitments do not match the approved composition profile.')
  }
  if (captionTrack ? input.captionOverlay !== undefined || !input.captionOverlays : !input.captionOverlay || input.captionOverlays !== undefined) {
    throw invalid('Streaming caption commitments do not match the approved composition profile.')
  }
  if (replaceVoice ? !input.voiceTracks : input.voiceTracks !== undefined) {
    throw invalid('Streaming voice commitments do not match the approved audio policy.')
  }
  if (
    supplementalAudio
      ? !input.supplementalAudioTracks
      : input.supplementalAudioTracks !== undefined
  ) {
    throw invalid(
      'Streaming supplemental-audio commitments do not match the approved Edit Brief policy.',
    )
  }
  if (
    livingFrameOverlays
      ? !input.livingFrameOverlays
      : input.livingFrameOverlays !== undefined
  ) {
    throw invalid(
      'Streaming Living Frame overlay commitments do not match the approved composition policy.',
    )
  }
  if (
    controlledVisualOverlays
      ? !input.controlledVisualOverlays
      : input.controlledVisualOverlays !== undefined
  ) {
    throw invalid(
      'Streaming controlled visual commitments do not match the approved composition policy.',
    )
  }
  return validateOfflineRemotionStreamingRenderRequest({
    schemaVersion: OFFLINE_REMOTION_RENDER_STREAMING_REQUEST_PROTOCOL,
    toolId: 'remotion',
    operationId: OFFLINE_REMOTION_RENDER_OPERATION,
    inputMode: OFFLINE_REMOTION_RENDER_SERVER_INPUT_MODE,
    payload: planning,
    inputs: {
      sources: sourceSequence ? input.sources : [input.source],
      livingFrameOverlays: input.livingFrameOverlays ?? [],
      controlledVisualOverlays: input.controlledVisualOverlays ?? [],
      captionOverlays: captionTrack
        ? input.captionOverlays
        : [{ ...input.captionOverlay, outputKey: SINGLE_CAPTION_OUTPUT_KEY }],
      voiceTracks: input.voiceTracks ?? [],
      supplementalAudioTracks: input.supplementalAudioTracks ?? [],
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
    'sources', 'livingFrameOverlays', 'controlledVisualOverlays',
    'captionOverlays', 'voiceTracks', 'supplementalAudioTracks',
  ], 'streaming inputs')
  if (
    !Array.isArray(inputs.sources) ||
    !Array.isArray(inputs.livingFrameOverlays) ||
    !Array.isArray(inputs.controlledVisualOverlays) ||
    !Array.isArray(inputs.captionOverlays) ||
    !Array.isArray(inputs.voiceTracks) ||
    !Array.isArray(inputs.supplementalAudioTracks)
  ) {
    throw invalid('Streaming Remotion inputs must be exact arrays.')
  }

  const expectedSourceCount = sourceSequence ? planning.sourceSegments.length : 1
  if (inputs.sources.length !== expectedSourceCount) {
    throw invalid('Streaming source commitments do not match the approved source count.')
  }
  const requiredSourceMimeType = (
    sourceSequence
      ? planning.sourceMediaPolicy === 'approved_professional_color_intermediate_v1'
      : planning.sourceMediaPolicy !== undefined
  )
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

  const expectedLivingFrameOverlays = planning.livingFrameOverlayLayers ?? []
  if (inputs.livingFrameOverlays.length !== expectedLivingFrameOverlays.length) {
    throw invalid(
      'Streaming Living Frame commitments do not match the approved overlay count.',
    )
  }
  const livingFrameOverlays = inputs.livingFrameOverlays.map((candidate, index) => {
    const overlay = exactRecord(candidate, [
      'inputId', 'outputKey', 'mimeType', 'byteLength', 'sha256',
    ], `Living Frame overlay ${index + 1}`)
    const expected = expectedLivingFrameOverlays[index]
    if (!expected || overlay.outputKey !== expected.componentOutputKey) {
      throw invalid(
        'Streaming Living Frame order diverges from the approved layer timeline.',
      )
    }
    return {
      ...committedInput(
        overlay,
        'image/png',
        67,
        OFFLINE_REMOTION_RENDER_STREAMING_MAXIMUM_LIVING_FRAME_OVERLAY_BYTES,
        `Living Frame overlay ${index + 1}`,
      ),
      outputKey: expected.componentOutputKey,
    }
  })
  const combinedLivingFrameOverlayBytes = livingFrameOverlays.reduce(
    (total, overlay) => safeSum(total, overlay.byteLength),
    0,
  )
  if (
    combinedLivingFrameOverlayBytes >
    OFFLINE_REMOTION_RENDER_STREAMING_MAXIMUM_COMBINED_LIVING_FRAME_OVERLAY_BYTES
  ) {
    throw invalid('Streaming Living Frame overlays exceed their combined byte ceiling.')
  }

  const expectedControlledVisualOverlays =
    planning.controlledVisualOverlayLayers ?? []
  if (
    inputs.controlledVisualOverlays.length !==
    expectedControlledVisualOverlays.length
  ) {
    throw invalid(
      'Streaming controlled visual commitments do not match the approved overlay count.',
    )
  }
  const controlledVisualOverlays = inputs.controlledVisualOverlays.map(
    (candidate, index) => {
      const overlay = exactRecord(candidate, [
        'inputId', 'outputKey', 'mimeType', 'byteLength', 'sha256',
      ], `controlled visual overlay ${index + 1}`)
      const expected = expectedControlledVisualOverlays[index]
      if (!expected || overlay.outputKey !== expected.outputKey) {
        throw invalid(
          'Streaming controlled visual order diverges from approved planning.',
        )
      }
      return {
        ...committedInput(
          overlay,
          'image/svg+xml',
          64,
          OFFLINE_REMOTION_RENDER_STREAMING_MAXIMUM_CONTROLLED_VISUAL_OVERLAY_BYTES,
          `controlled visual overlay ${index + 1}`,
        ),
        outputKey: expected.outputKey,
      }
    },
  )
  const combinedControlledVisualOverlayBytes =
    controlledVisualOverlays.reduce(
      (total, overlay) => safeSum(total, overlay.byteLength),
      0,
    )
  if (
    combinedControlledVisualOverlayBytes >
    OFFLINE_REMOTION_RENDER_STREAMING_MAXIMUM_COMBINED_CONTROLLED_VISUAL_OVERLAY_BYTES
  ) {
    throw invalid(
      'Streaming controlled visual overlays exceed their combined byte ceiling.',
    )
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
    const expected = expectedVoiceTracks[index]
    const sourceSliceProvided = expected?.sourceStartFrame !== undefined
    const voice = exactRecord(candidate, [
      'inputId', 'sourceSequenceItemId', 'outputKey', 'durationFrames',
      ...(sourceSliceProvided
        ? ['sourceStartFrame', 'sourceEndFrameExclusive']
        : []),
      'mimeType', 'byteLength', 'sha256',
    ], `voice track ${index + 1}`)
    if (
      !expected || voice.sourceSequenceItemId !== expected.sourceSequenceItemId ||
      voice.outputKey !== expected.outputKey ||
      voice.durationFrames !== expected.durationFrames ||
      (sourceSliceProvided && (
        voice.sourceStartFrame !== expected.sourceStartFrame ||
        voice.sourceEndFrameExclusive !== expected.sourceEndFrameExclusive
      ))
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
      ...(sourceSliceProvided
        ? {
            sourceStartFrame: expected.sourceStartFrame,
            sourceEndFrameExclusive: expected.sourceEndFrameExclusive!,
          }
        : {}),
    }
  })
  const combinedVoiceBytes = voiceTracks.reduce(
    (total, voice) => safeSum(total, voice.byteLength),
    0,
  )
  if (combinedVoiceBytes > OFFLINE_REMOTION_RENDER_STREAMING_MAXIMUM_COMBINED_VOICE_BYTES) {
    throw invalid('Streaming voice tracks exceed their combined byte ceiling.')
  }

  const expectedSupplementalAudioTracks = planning.supplementalAudioTracks ?? []
  if (inputs.supplementalAudioTracks.length !== expectedSupplementalAudioTracks.length) {
    throw invalid(
      'Streaming supplemental-audio commitments do not match the approved track count.',
    )
  }
  const supplementalAudioTracks = inputs.supplementalAudioTracks.map(
    (candidate, index) => {
      const track = exactRecord(candidate, [
        'inputId',
        'outputKey',
        'attachmentId',
        'markerId',
        'markerType',
        'startFrame',
        'endFrameExclusive',
        'fillPolicy',
        'mixProfileId',
        'mimeType',
        'byteLength',
        'sha256',
      ], `supplemental audio track ${index + 1}`)
      const expected = expectedSupplementalAudioTracks[index]
      if (
        !expected ||
        track.outputKey !== expected.outputKey ||
        track.attachmentId !== expected.attachmentId ||
        track.markerId !== expected.markerId ||
        track.markerType !== expected.markerType ||
        track.startFrame !== expected.startFrame ||
        track.endFrameExclusive !== expected.endFrameExclusive ||
        track.fillPolicy !== expected.fillPolicy ||
        track.mixProfileId !== expected.mixProfileId
      ) {
        throw invalid(
          'Streaming supplemental-audio order diverges from the approved Edit Brief timeline.',
        )
      }
      return {
        ...committedInput(
          track,
          'audio/wav',
          44,
          OFFLINE_REMOTION_RENDER_STREAMING_MAXIMUM_SUPPLEMENTAL_AUDIO_BYTES,
          `supplemental audio track ${index + 1}`,
        ),
        outputKey: expected.outputKey,
        attachmentId: expected.attachmentId,
        markerId: expected.markerId,
        markerType: expected.markerType,
        startFrame: expected.startFrame,
        endFrameExclusive: expected.endFrameExclusive,
        fillPolicy: expected.fillPolicy,
        mixProfileId: expected.mixProfileId,
      }
    },
  )
  const combinedSupplementalAudioBytes = supplementalAudioTracks.reduce(
    (total, track) => safeSum(total, track.byteLength),
    0,
  )
  if (
    combinedSupplementalAudioBytes >
    OFFLINE_REMOTION_RENDER_STREAMING_MAXIMUM_COMBINED_SUPPLEMENTAL_AUDIO_BYTES
  ) {
    throw invalid('Streaming supplemental audio exceeds its combined byte ceiling.')
  }

  const allInputs = [
    ...sources,
    ...livingFrameOverlays,
    ...controlledVisualOverlays,
    ...captionOverlays,
    ...voiceTracks,
    ...supplementalAudioTracks,
  ]
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
    inputs: {
      sources,
      livingFrameOverlays,
      controlledVisualOverlays,
      captionOverlays,
      voiceTracks,
      supplementalAudioTracks,
    },
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
    ...validated.inputs.livingFrameOverlays,
    ...validated.inputs.controlledVisualOverlays,
    ...validated.inputs.captionOverlays,
    ...validated.inputs.voiceTracks,
    ...validated.inputs.supplementalAudioTracks,
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
