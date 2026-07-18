import { createHash } from 'node:crypto'

import { ApiError } from '../../errors/api-error'
import { OFFLINE_MEDIA_BINARY_OPERATIONS } from './offline-media-binary-protocol'

export const OFFLINE_MEDIA_BINARY_CONTINUOUS_PROGRAM_AUDIO_PROTOCOL =
  'offline-media-binary-continuous-program-audio-v1' as const
export const OFFLINE_MEDIA_BINARY_CONTINUOUS_PROGRAM_AUDIO_MAGIC =
  'REEDITPRO_FFMPEG_CONTINUOUS_PROGRAM_AUDIO_V1' as const
export const OFFLINE_MEDIA_BINARY_CONTINUOUS_PROGRAM_AUDIO_INPUT_MODE =
  'server_injected_private_multi_source_stream_v1' as const
export const OFFLINE_MEDIA_BINARY_CONTINUOUS_PROGRAM_AUDIO_RECIPE =
  'approved_48k_stereo_continuous_program_audio_flac_v1' as const
export const OFFLINE_MEDIA_BINARY_CONTINUOUS_PROGRAM_AUDIO_MAXIMUM_SOURCE_COUNT = 8
export const OFFLINE_MEDIA_BINARY_CONTINUOUS_PROGRAM_AUDIO_MAXIMUM_SLICE_COUNT = 512
export const OFFLINE_MEDIA_BINARY_CONTINUOUS_PROGRAM_AUDIO_MAXIMUM_SOURCE_BYTES =
  192 * 1024 * 1024
export const OFFLINE_MEDIA_BINARY_CONTINUOUS_PROGRAM_AUDIO_MAXIMUM_COMBINED_SOURCE_BYTES =
  768 * 1024 * 1024
export const OFFLINE_MEDIA_BINARY_CONTINUOUS_PROGRAM_AUDIO_MAXIMUM_OUTPUT_BYTES =
  8 * 1024 * 1024 * 1024
export const OFFLINE_MEDIA_BINARY_CONTINUOUS_PROGRAM_AUDIO_SAMPLE_RATE = 48_000
export const OFFLINE_MEDIA_BINARY_CONTINUOUS_PROGRAM_AUDIO_CHANNELS = 2
export const OFFLINE_MEDIA_BINARY_CONTINUOUS_PROGRAM_AUDIO_FPS = 30
export const OFFLINE_MEDIA_BINARY_CONTINUOUS_PROGRAM_AUDIO_SAMPLES_PER_FRAME =
  OFFLINE_MEDIA_BINARY_CONTINUOUS_PROGRAM_AUDIO_SAMPLE_RATE /
  OFFLINE_MEDIA_BINARY_CONTINUOUS_PROGRAM_AUDIO_FPS

const SHA256 = /^[a-f0-9]{64}$/u
const IDENTITY = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,239}$/u

export interface OfflineMediaBinaryContinuousProgramAudioSourceSlice {
  sliceIndex: number
  segmentId: string
  sourceSequenceItemId: string
  mediaAssetId: string
  sourceObjectGeneration: string
  sourceSha256: string
  sourceCleanupDecisionId: string
  sourceStartFrame: number
  sourceEndFrameExclusive: number
  timelineStartFrame: number
  timelineEndFrameExclusive: number
  boundaryBefore: 'timeline_start' | 'approved_hard_cut'
}

export interface OfflineMediaBinaryContinuousProgramAudioPlanningPayload {
  recipeProfileId:
    typeof OFFLINE_MEDIA_BINARY_CONTINUOUS_PROGRAM_AUDIO_RECIPE
  audioAuthorityHash: string
  expectedObjectIdentity: string
  frameRateNumerator: 30
  frameRateDenominator: 1
  totalFrames: number
  sampleRate: 48_000
  channelMode: 'stereo'
  sampleFormat: 's24'
  outputContainer: 'flac'
  outputAudioCodec: 'flac'
  audioPolicy: 'approved_source_program_audio_only_v1'
  transitionPolicy: 'approved_hard_cuts_only_v1'
  timestampPolicy: 'normalize_from_zero'
  sourceQualityPolicy: 'immutable_source_master_audio_no_proxy_v1'
  musicPlanned: false
  sfxPlanned: false
  duckingPlanned: false
  realAudioAnalysisPerformed: false
  usesApprovedEditReservation: true
  requiresSeparateExportEstimate: false
  allowsAdditionalExportCharge: false
  sourceSlices: OfflineMediaBinaryContinuousProgramAudioSourceSlice[]
}

export interface OfflineMediaBinaryContinuousProgramAudioSourceCommitment {
  inputId: string
  sourceSequenceItemId: string
  mediaAssetId: string
  sourceObjectGeneration: string
  mimeType: 'video/mp4'
  byteLength: number
  sha256: string
}

export interface OfflineMediaBinaryContinuousProgramAudioRequest {
  schemaVersion: typeof OFFLINE_MEDIA_BINARY_CONTINUOUS_PROGRAM_AUDIO_PROTOCOL
  toolId: 'ffmpeg'
  operationId: typeof OFFLINE_MEDIA_BINARY_OPERATIONS.ffmpeg
  inputMode: typeof OFFLINE_MEDIA_BINARY_CONTINUOUS_PROGRAM_AUDIO_INPUT_MODE
  payload: OfflineMediaBinaryContinuousProgramAudioPlanningPayload
  inputs: {
    sources: OfflineMediaBinaryContinuousProgramAudioSourceCommitment[]
  }
}

export function buildOfflineMediaBinaryContinuousProgramAudioRequest(input: {
  planningPayload: unknown
  sources: OfflineMediaBinaryContinuousProgramAudioSourceCommitment[]
}): OfflineMediaBinaryContinuousProgramAudioRequest {
  return validateOfflineMediaBinaryContinuousProgramAudioRequest({
    schemaVersion: OFFLINE_MEDIA_BINARY_CONTINUOUS_PROGRAM_AUDIO_PROTOCOL,
    toolId: 'ffmpeg',
    operationId: OFFLINE_MEDIA_BINARY_OPERATIONS.ffmpeg,
    inputMode: OFFLINE_MEDIA_BINARY_CONTINUOUS_PROGRAM_AUDIO_INPUT_MODE,
    payload: input.planningPayload,
    inputs: { sources: input.sources },
  })
}

export function validateOfflineMediaBinaryContinuousProgramAudioRequest(
  value: unknown,
): OfflineMediaBinaryContinuousProgramAudioRequest {
  const request = exactRecord(value, [
    'schemaVersion', 'toolId', 'operationId', 'inputMode', 'payload', 'inputs',
  ], 'continuous program-audio request')
  if (
    request.schemaVersion !==
      OFFLINE_MEDIA_BINARY_CONTINUOUS_PROGRAM_AUDIO_PROTOCOL ||
    request.toolId !== 'ffmpeg' ||
    request.operationId !== OFFLINE_MEDIA_BINARY_OPERATIONS.ffmpeg ||
    request.inputMode !==
      OFFLINE_MEDIA_BINARY_CONTINUOUS_PROGRAM_AUDIO_INPUT_MODE
  ) throw invalid('Continuous program-audio request authority is unsupported.')

  const payload = validatePlanningPayload(request.payload)
  const inputs = exactRecord(
    request.inputs,
    ['sources'],
    'continuous program-audio inputs',
  )
  if (!Array.isArray(inputs.sources)) {
    throw invalid('Continuous program-audio source commitments are invalid.')
  }
  const sources = inputs.sources.map((source, index) =>
    validateSourceCommitment(source, index))
  if (
    sources.length < 2 ||
    sources.length >
      OFFLINE_MEDIA_BINARY_CONTINUOUS_PROGRAM_AUDIO_MAXIMUM_SOURCE_COUNT ||
    new Set(sources.map((source) => source.inputId)).size !== sources.length ||
    new Set(sources.map((source) => source.sourceSequenceItemId)).size !==
      sources.length
  ) throw invalid('Continuous program-audio source cardinality is invalid.')

  const combinedBytes = sources.reduce(
    (total, source) => total + source.byteLength,
    0,
  )
  if (
    !Number.isSafeInteger(combinedBytes) ||
    combinedBytes >
      OFFLINE_MEDIA_BINARY_CONTINUOUS_PROGRAM_AUDIO_MAXIMUM_COMBINED_SOURCE_BYTES
  ) throw invalid('Continuous program-audio sources exceed the combined bound.')

  const sourceBySequenceId = new Map(sources.map((source) => [
    source.sourceSequenceItemId,
    source,
  ]))
  for (const slice of payload.sourceSlices) {
    const source = sourceBySequenceId.get(slice.sourceSequenceItemId)
    if (
      !source ||
      source.mediaAssetId !== slice.mediaAssetId ||
      source.sourceObjectGeneration !== slice.sourceObjectGeneration ||
      source.sha256 !== slice.sourceSha256
    ) throw invalid(
      'Continuous program-audio slice lost immutable source commitment.',
    )
  }
  const usedSourceIds = new Set(payload.sourceSlices.map((slice) =>
    slice.sourceSequenceItemId))
  if (sources.some((source) => !usedSourceIds.has(source.sourceSequenceItemId))) {
    throw invalid('Continuous program-audio request contains an unused source.')
  }

  return {
    schemaVersion: OFFLINE_MEDIA_BINARY_CONTINUOUS_PROGRAM_AUDIO_PROTOCOL,
    toolId: 'ffmpeg',
    operationId: OFFLINE_MEDIA_BINARY_OPERATIONS.ffmpeg,
    inputMode: OFFLINE_MEDIA_BINARY_CONTINUOUS_PROGRAM_AUDIO_INPUT_MODE,
    payload,
    inputs: { sources },
  }
}

export function offlineMediaBinaryContinuousProgramAudioRequestSha256(
  request: OfflineMediaBinaryContinuousProgramAudioRequest,
): string {
  const validated = validateOfflineMediaBinaryContinuousProgramAudioRequest(
    request,
  )
  return createHash('sha256').update(stableStringify(validated)).digest('hex')
}

function validatePlanningPayload(
  value: unknown,
): OfflineMediaBinaryContinuousProgramAudioPlanningPayload {
  const payload = exactRecord(value, [
    'recipeProfileId', 'audioAuthorityHash', 'expectedObjectIdentity',
    'frameRateNumerator', 'frameRateDenominator', 'totalFrames',
    'sampleRate', 'channelMode', 'sampleFormat', 'outputContainer',
    'outputAudioCodec', 'audioPolicy', 'transitionPolicy', 'timestampPolicy',
    'sourceQualityPolicy', 'musicPlanned', 'sfxPlanned', 'duckingPlanned',
    'realAudioAnalysisPerformed', 'usesApprovedEditReservation',
    'requiresSeparateExportEstimate', 'allowsAdditionalExportCharge',
    'sourceSlices',
  ], 'continuous program-audio planning payload')
  const totalFrames = integer(payload.totalFrames, 1_350, 648_000, 'totalFrames')
  if (
    payload.recipeProfileId !==
      OFFLINE_MEDIA_BINARY_CONTINUOUS_PROGRAM_AUDIO_RECIPE ||
    payload.frameRateNumerator !== 30 ||
    payload.frameRateDenominator !== 1 ||
    payload.sampleRate !== 48_000 ||
    payload.channelMode !== 'stereo' ||
    payload.sampleFormat !== 's24' ||
    payload.outputContainer !== 'flac' ||
    payload.outputAudioCodec !== 'flac' ||
    payload.audioPolicy !== 'approved_source_program_audio_only_v1' ||
    payload.transitionPolicy !== 'approved_hard_cuts_only_v1' ||
    payload.timestampPolicy !== 'normalize_from_zero' ||
    payload.sourceQualityPolicy !==
      'immutable_source_master_audio_no_proxy_v1' ||
    payload.musicPlanned !== false ||
    payload.sfxPlanned !== false ||
    payload.duckingPlanned !== false ||
    payload.realAudioAnalysisPerformed !== false ||
    payload.usesApprovedEditReservation !== true ||
    payload.requiresSeparateExportEstimate !== false ||
    payload.allowsAdditionalExportCharge !== false
  ) throw invalid('Continuous program-audio planning authority is unsupported.')
  if (!Array.isArray(payload.sourceSlices)) {
    throw invalid('Continuous program-audio source slices are invalid.')
  }
  const sourceSlices = payload.sourceSlices.map((slice, index) =>
    validateSourceSlice(slice, index, totalFrames))
  if (
    sourceSlices.length < 2 ||
    sourceSlices.length >
      OFFLINE_MEDIA_BINARY_CONTINUOUS_PROGRAM_AUDIO_MAXIMUM_SLICE_COUNT
  ) throw invalid('Continuous program-audio slice cardinality is invalid.')
  let expectedTimelineStart = 0
  sourceSlices.forEach((slice, index) => {
    const expectedBoundary = index === 0
      ? 'timeline_start'
      : 'approved_hard_cut'
    if (
      slice.sliceIndex !== index + 1 ||
      slice.timelineStartFrame !== expectedTimelineStart ||
      slice.boundaryBefore !== expectedBoundary
    ) throw invalid(
      'Continuous program-audio slices are not exact ordered hard cuts.',
    )
    expectedTimelineStart = slice.timelineEndFrameExclusive
  })
  if (expectedTimelineStart !== totalFrames) {
    throw invalid('Continuous program-audio slices do not cover the timeline.')
  }
  const expectedSamples = totalFrames *
    OFFLINE_MEDIA_BINARY_CONTINUOUS_PROGRAM_AUDIO_SAMPLES_PER_FRAME
  if (!Number.isSafeInteger(expectedSamples) || expectedSamples <= 0) {
    throw invalid('Continuous program-audio sample commitment is invalid.')
  }

  return {
    recipeProfileId:
      OFFLINE_MEDIA_BINARY_CONTINUOUS_PROGRAM_AUDIO_RECIPE,
    audioAuthorityHash: sha256(payload.audioAuthorityHash, 'audioAuthorityHash'),
    expectedObjectIdentity: sha256(
      payload.expectedObjectIdentity,
      'expectedObjectIdentity',
    ),
    frameRateNumerator: 30,
    frameRateDenominator: 1,
    totalFrames,
    sampleRate: 48_000,
    channelMode: 'stereo',
    sampleFormat: 's24',
    outputContainer: 'flac',
    outputAudioCodec: 'flac',
    audioPolicy: 'approved_source_program_audio_only_v1',
    transitionPolicy: 'approved_hard_cuts_only_v1',
    timestampPolicy: 'normalize_from_zero',
    sourceQualityPolicy: 'immutable_source_master_audio_no_proxy_v1',
    musicPlanned: false,
    sfxPlanned: false,
    duckingPlanned: false,
    realAudioAnalysisPerformed: false,
    usesApprovedEditReservation: true,
    requiresSeparateExportEstimate: false,
    allowsAdditionalExportCharge: false,
    sourceSlices,
  }
}

function validateSourceSlice(
  value: unknown,
  index: number,
  totalFrames: number,
): OfflineMediaBinaryContinuousProgramAudioSourceSlice {
  const slice = exactRecord(value, [
    'sliceIndex', 'segmentId', 'sourceSequenceItemId', 'mediaAssetId',
    'sourceObjectGeneration', 'sourceSha256', 'sourceCleanupDecisionId',
    'sourceStartFrame', 'sourceEndFrameExclusive', 'timelineStartFrame',
    'timelineEndFrameExclusive', 'boundaryBefore',
  ], `continuous program-audio source slice ${index + 1}`)
  const sourceStartFrame = integer(
    slice.sourceStartFrame,
    0,
    648_000,
    'sourceStartFrame',
  )
  const sourceEndFrameExclusive = integer(
    slice.sourceEndFrameExclusive,
    1,
    648_000,
    'sourceEndFrameExclusive',
  )
  const timelineStartFrame = integer(
    slice.timelineStartFrame,
    0,
    totalFrames - 1,
    'timelineStartFrame',
  )
  const timelineEndFrameExclusive = integer(
    slice.timelineEndFrameExclusive,
    1,
    totalFrames,
    'timelineEndFrameExclusive',
  )
  if (
    sourceEndFrameExclusive <= sourceStartFrame ||
    timelineEndFrameExclusive <= timelineStartFrame ||
    sourceEndFrameExclusive - sourceStartFrame !==
      timelineEndFrameExclusive - timelineStartFrame ||
    !['timeline_start', 'approved_hard_cut'].includes(
      String(slice.boundaryBefore),
    )
  ) throw invalid('Continuous program-audio source-slice timing is invalid.')
  return {
    sliceIndex: integer(
      slice.sliceIndex,
      1,
      OFFLINE_MEDIA_BINARY_CONTINUOUS_PROGRAM_AUDIO_MAXIMUM_SLICE_COUNT,
      'sliceIndex',
    ),
    segmentId: identity(slice.segmentId, 'segmentId'),
    sourceSequenceItemId: identity(
      slice.sourceSequenceItemId,
      'sourceSequenceItemId',
    ),
    mediaAssetId: identity(slice.mediaAssetId, 'mediaAssetId'),
    sourceObjectGeneration: generation(slice.sourceObjectGeneration),
    sourceSha256: sha256(slice.sourceSha256, 'sourceSha256'),
    sourceCleanupDecisionId: identity(
      slice.sourceCleanupDecisionId,
      'sourceCleanupDecisionId',
    ),
    sourceStartFrame,
    sourceEndFrameExclusive,
    timelineStartFrame,
    timelineEndFrameExclusive,
    boundaryBefore: slice.boundaryBefore as
      OfflineMediaBinaryContinuousProgramAudioSourceSlice['boundaryBefore'],
  }
}

function validateSourceCommitment(
  value: unknown,
  index: number,
): OfflineMediaBinaryContinuousProgramAudioSourceCommitment {
  const source = exactRecord(value, [
    'inputId', 'sourceSequenceItemId', 'mediaAssetId',
    'sourceObjectGeneration', 'mimeType', 'byteLength', 'sha256',
  ], `continuous program-audio source commitment ${index + 1}`)
  if (source.mimeType !== 'video/mp4') {
    throw invalid('Continuous program-audio sources must be immutable MP4 masters.')
  }
  return {
    inputId: identity(source.inputId, 'inputId'),
    sourceSequenceItemId: identity(
      source.sourceSequenceItemId,
      'sourceSequenceItemId',
    ),
    mediaAssetId: identity(source.mediaAssetId, 'mediaAssetId'),
    sourceObjectGeneration: generation(source.sourceObjectGeneration),
    mimeType: 'video/mp4',
    byteLength: integer(
      source.byteLength,
      1_024,
      OFFLINE_MEDIA_BINARY_CONTINUOUS_PROGRAM_AUDIO_MAXIMUM_SOURCE_BYTES,
      'byteLength',
    ),
    sha256: sha256(source.sha256, 'sha256'),
  }
}

function exactRecord(
  value: unknown,
  keys: readonly string[],
  label: string,
): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw invalid(`${label} is malformed.`)
  }
  const record = value as Record<string, unknown>
  if (Object.keys(record).sort().join('|') !== [...keys].sort().join('|')) {
    throw invalid(`${label} contains unsupported fields.`)
  }
  return record
}

function identity(value: unknown, label: string): string {
  if (
    typeof value !== 'string' ||
    value !== value.trim() ||
    !IDENTITY.test(value) ||
    value.includes('..')
  ) throw invalid(`Continuous program-audio ${label} is invalid.`)
  return value
}

function generation(value: unknown): string {
  if (typeof value !== 'string' || !/^[1-9][0-9]{0,30}$/u.test(value)) {
    throw invalid('Continuous program-audio source generation is invalid.')
  }
  return value
}

function sha256(value: unknown, label: string): string {
  if (typeof value !== 'string' || !SHA256.test(value)) {
    throw invalid(`Continuous program-audio ${label} is invalid.`)
  }
  return value
}

function integer(
  value: unknown,
  minimum: number,
  maximum: number,
  label: string,
): number {
  if (
    !Number.isSafeInteger(value) ||
    Number(value) < minimum ||
    Number(value) > maximum
  ) throw invalid(
    `Continuous program-audio ${label} is outside its fixed bound.`,
  )
  return Number(value)
}

function stableStringify(value: unknown): string {
  if (value === null || typeof value !== 'object') return JSON.stringify(value)
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`
  return `{${Object.entries(value as Record<string, unknown>)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, entry]) => `${JSON.stringify(key)}:${stableStringify(entry)}`)
    .join(',')}}`
}

function invalid(message: string): ApiError {
  return new ApiError('VALIDATION_FAILED', message, 400, {
    requiredGate: 'offline_media_binary_continuous_program_audio_contract',
  })
}
