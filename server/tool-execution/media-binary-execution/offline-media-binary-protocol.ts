import { createHash } from 'node:crypto'

export const OFFLINE_MEDIA_BINARY_PROTOCOL = 'offline-media-binary-execution-v1' as const
export const OFFLINE_MEDIA_BINARY_OPERATIONS = Object.freeze({
  ffmpeg: 'tool.ffmpeg.execute_approved_media_recipe.v1',
  ffprobe: 'tool.ffprobe.inspect_approved_media.v1',
} as const)

interface OfflineFfmpegCommonPlanningPayload {
  timestampPolicy: 'normalize_from_zero'
  overwriteExistingArtifact: false
  allowUnreviewedCodec: false
  trimStartFrame: number
  trimEndFrameExclusive: number
  frameRate: 24 | 25 | 30 | 50 | 60
}

export interface OfflineFfmpegTrimPlanningPayload extends OfflineFfmpegCommonPlanningPayload {
  recipeProfileId: 'approved_trim_transcode_v1'
}

export interface OfflineFfmpegVoiceDeliveryPlanningPayload extends OfflineFfmpegCommonPlanningPayload {
  recipeProfileId: 'approved_voice_delivery_wav_v1'
  sampleRate: 48_000
  channelMode: 'stereo'
  targetLufs: -14
  truePeakDbtp: -1
  loudnessRangeLufs: 7
  highpassHz: 70
  compressorPreset: 'gentle_voice_v1'
}

export type OfflineFfmpegColorGradeStyle = 'clean_natural' | 'premium_clean'
export type OfflineFfmpegColorIntensity = 'subtle' | 'balanced'
export type OfflineFfmpegColorOperationKind =
  | 'clarity'
  | 'contrast_curve'
  | 'exposure_correction'
  | 'highlight_recovery'
  | 'look_transform'
  | 'qa_histogram_check'
  | 'saturation'
  | 'shot_matching'
  | 'white_balance'

export interface OfflineFfmpegColorDeliveryPlanningPayload extends OfflineFfmpegCommonPlanningPayload {
  recipeProfileId: 'approved_source_color_delivery_matroska_v1'
  colorGradeStyle: OfflineFfmpegColorGradeStyle
  intensity: OfflineFfmpegColorIntensity
  approvedColorOperationIds: string[]
  approvedColorOperationKinds: OfflineFfmpegColorOperationKind[]
  analysisProfileId: 'approved_three_frame_rgb_stats_v1'
  correctionProfileId: 'bounded_professional_source_color_v1'
  outputColorSpace: 'bt709'
  outputPixelFormat: 'yuv420p'
  preserveAudio: false
}

export interface OfflineFfmpegColorMatchDeliveryPlanningPayload extends OfflineFfmpegCommonPlanningPayload {
  recipeProfileId: 'approved_source_color_match_delivery_matroska_v1'
  colorGradeStyle: OfflineFfmpegColorGradeStyle
  intensity: OfflineFfmpegColorIntensity
  approvedColorOperationIds: string[]
  approvedColorOperationKinds: OfflineFfmpegColorOperationKind[]
  analysisProfileId: 'approved_three_frame_rgb_stats_v1'
  correctionProfileId: 'bounded_reference_matched_professional_source_color_v1'
  shotMatchProfileId: 'approved_reference_three_frame_rgb_match_v1'
  referenceSourceSequenceItemId: string
  referenceDurationFrames: number
  referenceOutputKey: string
  outputColorSpace: 'bt709'
  outputPixelFormat: 'yuv420p'
  preserveAudio: false
}

export type OfflineFfmpegPlanningPayload =
  | OfflineFfmpegTrimPlanningPayload
  | OfflineFfmpegVoiceDeliveryPlanningPayload
  | OfflineFfmpegColorDeliveryPlanningPayload
  | OfflineFfmpegColorMatchDeliveryPlanningPayload

export interface OfflineFfprobePlanningPayload {
  inspectionProfileId:
    | 'source_intake_v1'
    | 'pre_render_v1'
    | 'object_mezzanine_chunk_qa_v1'
    | 'continuous_program_audio_qa_v1'
    | 'private_long_form_master_qa_v1'
    | 'final_export_v1'
  countFrames: boolean
  verifyDurationAndSync: true
  emitMachineJsonOnly: true
}

export interface OfflineFfprobeExecutionRequest {
  schemaVersion: typeof OFFLINE_MEDIA_BINARY_PROTOCOL
  toolId: 'ffprobe'
  operationId: typeof OFFLINE_MEDIA_BINARY_OPERATIONS.ffprobe
  payload: OfflineFfprobePlanningPayload & {
    mimeType: 'video/mp4'
    sourceByteLength: number
    sourceSha256: string
    sourceBytesBase64: string
  }
}

type OfflineFfmpegSourceCommitment = {
  mimeType: 'video/mp4'
  sourceByteLength: number
  sourceSha256: string
  sourceBytesBase64: string
}

type OfflineFfmpegReferenceCommitment = {
  referenceMimeType: 'video/x-matroska'
  referenceSourceByteLength: number
  referenceSourceSha256: string
  referenceSourceBytesBase64: string
}

export type OfflineFfmpegExecutionRequest = {
  schemaVersion: typeof OFFLINE_MEDIA_BINARY_PROTOCOL
  toolId: 'ffmpeg'
  operationId: typeof OFFLINE_MEDIA_BINARY_OPERATIONS.ffmpeg
} & {
  payload:
    | (Exclude<OfflineFfmpegPlanningPayload, OfflineFfmpegColorMatchDeliveryPlanningPayload> &
        OfflineFfmpegSourceCommitment)
    | (OfflineFfmpegColorMatchDeliveryPlanningPayload & OfflineFfmpegSourceCommitment &
        OfflineFfmpegReferenceCommitment)
}

export function validateOfflineFfmpegPlanningPayload(value: unknown): OfflineFfmpegPlanningPayload {
  const candidate = value && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : undefined
  const voiceDelivery = candidate?.recipeProfileId === 'approved_voice_delivery_wav_v1'
  const colorDelivery = candidate?.recipeProfileId === 'approved_source_color_delivery_matroska_v1'
  const colorMatchDelivery = candidate?.recipeProfileId ===
    'approved_source_color_match_delivery_matroska_v1'
  const payload = exactObject(value, [
    'recipeProfileId', 'timestampPolicy', 'overwriteExistingArtifact', 'allowUnreviewedCodec',
    'trimStartFrame', 'trimEndFrameExclusive', 'frameRate',
    ...(voiceDelivery
      ? [
          'sampleRate', 'channelMode', 'targetLufs', 'truePeakDbtp',
          'loudnessRangeLufs', 'highpassHz', 'compressorPreset',
        ]
      : []),
    ...(colorDelivery || colorMatchDelivery
      ? [
          'colorGradeStyle', 'intensity', 'approvedColorOperationIds',
          'approvedColorOperationKinds', 'analysisProfileId', 'correctionProfileId',
          ...(colorMatchDelivery
            ? [
                'shotMatchProfileId', 'referenceSourceSequenceItemId',
                'referenceDurationFrames', 'referenceOutputKey',
              ]
            : []),
          'outputColorSpace', 'outputPixelFormat', 'preserveAudio',
        ]
      : []),
  ])
  if (
    ![
      'approved_trim_transcode_v1',
      'approved_voice_delivery_wav_v1',
      'approved_source_color_delivery_matroska_v1',
      'approved_source_color_match_delivery_matroska_v1',
    ].includes(
      String(payload.recipeProfileId),
    ) ||
    payload.timestampPolicy !== 'normalize_from_zero' ||
    payload.overwriteExistingArtifact !== false || payload.allowUnreviewedCodec !== false ||
    !Number.isSafeInteger(payload.trimStartFrame) || Number(payload.trimStartFrame) < 0 ||
    !Number.isSafeInteger(payload.trimEndFrameExclusive) ||
    Number(payload.trimEndFrameExclusive) <= Number(payload.trimStartFrame) ||
    Number(payload.trimEndFrameExclusive) > 100_000_001 ||
    ![24, 25, 30, 50, 60].includes(Number(payload.frameRate))
  ) throw invalid()
  const common = {
    timestampPolicy: 'normalize_from_zero',
    overwriteExistingArtifact: false,
    allowUnreviewedCodec: false,
    trimStartFrame: Number(payload.trimStartFrame),
    trimEndFrameExclusive: Number(payload.trimEndFrameExclusive),
    frameRate: Number(payload.frameRate) as OfflineFfmpegPlanningPayload['frameRate'],
  } as const
  if (colorDelivery || colorMatchDelivery) {
    const colorGradeStyle = colorGradeStyleValue(payload.colorGradeStyle)
    const intensity = colorIntensityValue(payload.intensity)
    const approvedColorOperationIds = boundedSafeKeys(payload.approvedColorOperationIds, 32)
    const approvedColorOperationKinds = colorOperationKinds(payload.approvedColorOperationKinds)
    const expectedKinds = expectedColorOperationKinds(colorGradeStyle, colorMatchDelivery)
    if (
      payload.analysisProfileId !== 'approved_three_frame_rgb_stats_v1' ||
      payload.correctionProfileId !== (colorMatchDelivery
        ? 'bounded_reference_matched_professional_source_color_v1'
        : 'bounded_professional_source_color_v1') ||
      payload.outputColorSpace !== 'bt709' || payload.outputPixelFormat !== 'yuv420p' ||
      payload.preserveAudio !== false ||
      approvedColorOperationKinds.join('|') !== expectedKinds.join('|')
    ) throw invalid()
    if (colorMatchDelivery) {
      if (
        payload.shotMatchProfileId !== 'approved_reference_three_frame_rgb_match_v1' ||
        !safeKey(payload.referenceSourceSequenceItemId) ||
        !Number.isSafeInteger(payload.referenceDurationFrames) ||
        Number(payload.referenceDurationFrames) < 1 ||
        Number(payload.referenceDurationFrames) > 100_000_000 ||
        !safeKey(payload.referenceOutputKey)
      ) throw invalid()
      return {
        recipeProfileId: 'approved_source_color_match_delivery_matroska_v1',
        ...common,
        colorGradeStyle,
        intensity,
        approvedColorOperationIds,
        approvedColorOperationKinds,
        analysisProfileId: 'approved_three_frame_rgb_stats_v1',
        correctionProfileId: 'bounded_reference_matched_professional_source_color_v1',
        shotMatchProfileId: 'approved_reference_three_frame_rgb_match_v1',
        referenceSourceSequenceItemId: String(payload.referenceSourceSequenceItemId),
        referenceDurationFrames: Number(payload.referenceDurationFrames),
        referenceOutputKey: String(payload.referenceOutputKey),
        outputColorSpace: 'bt709',
        outputPixelFormat: 'yuv420p',
        preserveAudio: false,
      }
    }
    return {
      recipeProfileId: 'approved_source_color_delivery_matroska_v1',
      ...common,
      colorGradeStyle,
      intensity,
      approvedColorOperationIds,
      approvedColorOperationKinds,
      analysisProfileId: 'approved_three_frame_rgb_stats_v1',
      correctionProfileId: 'bounded_professional_source_color_v1',
      outputColorSpace: 'bt709',
      outputPixelFormat: 'yuv420p',
      preserveAudio: false,
    }
  }
  if (!voiceDelivery) {
    return { recipeProfileId: 'approved_trim_transcode_v1', ...common }
  }
  if (
    payload.sampleRate !== 48_000 || payload.channelMode !== 'stereo' ||
    payload.targetLufs !== -14 || payload.truePeakDbtp !== -1 ||
    payload.loudnessRangeLufs !== 7 || payload.highpassHz !== 70 ||
    payload.compressorPreset !== 'gentle_voice_v1'
  ) throw invalid()
  return {
    recipeProfileId: 'approved_voice_delivery_wav_v1',
    ...common,
    sampleRate: 48_000,
    channelMode: 'stereo',
    targetLufs: -14,
    truePeakDbtp: -1,
    loudnessRangeLufs: 7,
    highpassHz: 70,
    compressorPreset: 'gentle_voice_v1',
  }
}

export function validateOfflineFfprobePlanningPayload(value: unknown): OfflineFfprobePlanningPayload {
  const payload = exactObject(value, [
    'inspectionProfileId', 'countFrames', 'verifyDurationAndSync', 'emitMachineJsonOnly',
  ])
  if (
    ![
      'source_intake_v1',
      'pre_render_v1',
      'object_mezzanine_chunk_qa_v1',
      'continuous_program_audio_qa_v1',
      'private_long_form_master_qa_v1',
      'final_export_v1',
    ].includes(String(payload.inspectionProfileId)) ||
    typeof payload.countFrames !== 'boolean' ||
    payload.verifyDurationAndSync !== true ||
    payload.emitMachineJsonOnly !== true
  ) throw invalid()
  return {
    inspectionProfileId: payload.inspectionProfileId as OfflineFfprobePlanningPayload['inspectionProfileId'],
    countFrames: payload.countFrames,
    verifyDurationAndSync: true,
    emitMachineJsonOnly: true,
  }
}

export function validateOfflineFfprobeExecutionRequest(value: unknown): OfflineFfprobeExecutionRequest {
  const request = exactObject(value, ['schemaVersion', 'toolId', 'operationId', 'payload'])
  if (
    request.schemaVersion !== OFFLINE_MEDIA_BINARY_PROTOCOL ||
    request.toolId !== 'ffprobe' ||
    request.operationId !== OFFLINE_MEDIA_BINARY_OPERATIONS.ffprobe
  ) throw invalid()
  const payload = exactObject(request.payload, [
    'inspectionProfileId', 'countFrames', 'verifyDurationAndSync', 'emitMachineJsonOnly',
    'mimeType', 'sourceByteLength', 'sourceSha256', 'sourceBytesBase64',
  ])
  const planning = validateOfflineFfprobePlanningPayload({
    inspectionProfileId: payload.inspectionProfileId,
    countFrames: payload.countFrames,
    verifyDurationAndSync: payload.verifyDurationAndSync,
    emitMachineJsonOnly: payload.emitMachineJsonOnly,
  })
  if (
    payload.mimeType !== 'video/mp4' ||
    !Number.isSafeInteger(payload.sourceByteLength) ||
    Number(payload.sourceByteLength) < 64 ||
    Number(payload.sourceByteLength) > 16 * 1024 * 1024 ||
    typeof payload.sourceSha256 !== 'string' ||
    !/^[a-f0-9]{64}$/.test(payload.sourceSha256) ||
    typeof payload.sourceBytesBase64 !== 'string'
  ) throw invalid()
  const bytes = Buffer.from(payload.sourceBytesBase64, 'base64')
  if (
    bytes.byteLength !== payload.sourceByteLength ||
    bytes.toString('base64') !== payload.sourceBytesBase64 ||
    createHash('sha256').update(bytes).digest('hex') !== payload.sourceSha256
  ) throw invalid()
  return {
    schemaVersion: OFFLINE_MEDIA_BINARY_PROTOCOL,
    toolId: 'ffprobe',
    operationId: OFFLINE_MEDIA_BINARY_OPERATIONS.ffprobe,
    payload: {
      ...planning,
      mimeType: 'video/mp4',
      sourceByteLength: bytes.byteLength,
      sourceSha256: payload.sourceSha256,
      sourceBytesBase64: payload.sourceBytesBase64,
    },
  }
}

export function validateOfflineFfmpegExecutionRequest(value: unknown): OfflineFfmpegExecutionRequest {
  const request = exactObject(value, ['schemaVersion', 'toolId', 'operationId', 'payload'])
  if (
    request.schemaVersion !== OFFLINE_MEDIA_BINARY_PROTOCOL || request.toolId !== 'ffmpeg' ||
    request.operationId !== OFFLINE_MEDIA_BINARY_OPERATIONS.ffmpeg
  ) throw invalid()
  const requestPayload = request.payload && typeof request.payload === 'object' &&
    !Array.isArray(request.payload)
    ? request.payload as Record<string, unknown>
    : undefined
  const colorMatchDelivery = requestPayload?.recipeProfileId ===
    'approved_source_color_match_delivery_matroska_v1'
  const payload = exactObject(request.payload, [
    'recipeProfileId', 'timestampPolicy', 'overwriteExistingArtifact', 'allowUnreviewedCodec',
    'trimStartFrame', 'trimEndFrameExclusive', 'frameRate',
    ...(
      requestPayload?.recipeProfileId === 'approved_voice_delivery_wav_v1'
        ? [
            'sampleRate', 'channelMode', 'targetLufs', 'truePeakDbtp',
            'loudnessRangeLufs', 'highpassHz', 'compressorPreset',
          ]
        : []
    ),
    ...(
      requestPayload?.recipeProfileId === 'approved_source_color_delivery_matroska_v1' ||
      colorMatchDelivery
        ? [
            'colorGradeStyle', 'intensity', 'approvedColorOperationIds',
            'approvedColorOperationKinds', 'analysisProfileId', 'correctionProfileId',
            ...(colorMatchDelivery
              ? [
                  'shotMatchProfileId', 'referenceSourceSequenceItemId',
                  'referenceDurationFrames', 'referenceOutputKey',
                ]
              : []),
            'outputColorSpace', 'outputPixelFormat', 'preserveAudio',
          ]
        : []
    ),
    'mimeType', 'sourceByteLength', 'sourceSha256', 'sourceBytesBase64',
    ...(colorMatchDelivery
      ? [
          'referenceMimeType', 'referenceSourceByteLength',
          'referenceSourceSha256', 'referenceSourceBytesBase64',
        ]
      : []),
  ])
  const planning = validateOfflineFfmpegPlanningPayload({
    recipeProfileId: payload.recipeProfileId,
    timestampPolicy: payload.timestampPolicy,
    overwriteExistingArtifact: payload.overwriteExistingArtifact,
    allowUnreviewedCodec: payload.allowUnreviewedCodec,
    trimStartFrame: payload.trimStartFrame,
    trimEndFrameExclusive: payload.trimEndFrameExclusive,
    frameRate: payload.frameRate,
    ...(payload.recipeProfileId === 'approved_voice_delivery_wav_v1'
      ? {
          sampleRate: payload.sampleRate,
          channelMode: payload.channelMode,
          targetLufs: payload.targetLufs,
          truePeakDbtp: payload.truePeakDbtp,
          loudnessRangeLufs: payload.loudnessRangeLufs,
          highpassHz: payload.highpassHz,
          compressorPreset: payload.compressorPreset,
        }
      : {}),
    ...(
      payload.recipeProfileId === 'approved_source_color_delivery_matroska_v1' ||
      payload.recipeProfileId === 'approved_source_color_match_delivery_matroska_v1'
      ? {
          colorGradeStyle: payload.colorGradeStyle,
          intensity: payload.intensity,
          approvedColorOperationIds: payload.approvedColorOperationIds,
          approvedColorOperationKinds: payload.approvedColorOperationKinds,
          analysisProfileId: payload.analysisProfileId,
          correctionProfileId: payload.correctionProfileId,
          ...(payload.recipeProfileId === 'approved_source_color_match_delivery_matroska_v1'
            ? {
                shotMatchProfileId: payload.shotMatchProfileId,
                referenceSourceSequenceItemId: payload.referenceSourceSequenceItemId,
                referenceDurationFrames: payload.referenceDurationFrames,
                referenceOutputKey: payload.referenceOutputKey,
              }
            : {}),
          outputColorSpace: payload.outputColorSpace,
          outputPixelFormat: payload.outputPixelFormat,
          preserveAudio: payload.preserveAudio,
        }
      : {}),
  })
  const source = validateSource(payload)
  if (planning.recipeProfileId === 'approved_source_color_match_delivery_matroska_v1') {
    const reference = validateReferenceSource(payload)
    return {
      schemaVersion: OFFLINE_MEDIA_BINARY_PROTOCOL,
      toolId: 'ffmpeg',
      operationId: OFFLINE_MEDIA_BINARY_OPERATIONS.ffmpeg,
      payload: { ...planning, ...source, ...reference },
    }
  }
  return {
    schemaVersion: OFFLINE_MEDIA_BINARY_PROTOCOL,
    toolId: 'ffmpeg',
    operationId: OFFLINE_MEDIA_BINARY_OPERATIONS.ffmpeg,
    payload: { ...planning, ...source },
  }
}

function validateReferenceSource(payload: Record<string, unknown>) {
  if (
    payload.referenceMimeType !== 'video/x-matroska' ||
    !Number.isSafeInteger(payload.referenceSourceByteLength) ||
    Number(payload.referenceSourceByteLength) < 64 ||
    Number(payload.referenceSourceByteLength) > 16 * 1024 * 1024 ||
    typeof payload.referenceSourceSha256 !== 'string' ||
    !/^[a-f0-9]{64}$/.test(payload.referenceSourceSha256) ||
    typeof payload.referenceSourceBytesBase64 !== 'string'
  ) throw invalid()
  const bytes = Buffer.from(payload.referenceSourceBytesBase64, 'base64')
  if (
    bytes.byteLength !== payload.referenceSourceByteLength ||
    bytes.toString('base64') !== payload.referenceSourceBytesBase64 ||
    createHash('sha256').update(bytes).digest('hex') !== payload.referenceSourceSha256 ||
    bytes[0] !== 0x1a || bytes[1] !== 0x45 || bytes[2] !== 0xdf || bytes[3] !== 0xa3
  ) throw invalid()
  return {
    referenceMimeType: 'video/x-matroska' as const,
    referenceSourceByteLength: bytes.byteLength,
    referenceSourceSha256: payload.referenceSourceSha256,
    referenceSourceBytesBase64: payload.referenceSourceBytesBase64,
  }
}

function validateSource(payload: Record<string, unknown>) {
  if (
    payload.mimeType !== 'video/mp4' || !Number.isSafeInteger(payload.sourceByteLength) ||
    Number(payload.sourceByteLength) < 64 || Number(payload.sourceByteLength) > 16 * 1024 * 1024 ||
    typeof payload.sourceSha256 !== 'string' || !/^[a-f0-9]{64}$/.test(payload.sourceSha256) ||
    typeof payload.sourceBytesBase64 !== 'string'
  ) throw invalid()
  const bytes = Buffer.from(payload.sourceBytesBase64, 'base64')
  if (
    bytes.byteLength !== payload.sourceByteLength || bytes.toString('base64') !== payload.sourceBytesBase64 ||
    createHash('sha256').update(bytes).digest('hex') !== payload.sourceSha256
  ) throw invalid()
  return {
    mimeType: 'video/mp4' as const,
    sourceByteLength: bytes.byteLength,
    sourceSha256: payload.sourceSha256,
    sourceBytesBase64: payload.sourceBytesBase64,
  }
}

function exactObject(value: unknown, keys: readonly string[]): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw invalid()
  const record = value as Record<string, unknown>
  if (Object.keys(record).sort().join('|') !== [...keys].sort().join('|')) throw invalid()
  return record
}

const COLOR_OPERATION_KINDS: readonly OfflineFfmpegColorOperationKind[] = [
  'clarity',
  'contrast_curve',
  'exposure_correction',
  'highlight_recovery',
  'look_transform',
  'qa_histogram_check',
  'saturation',
  'shot_matching',
  'white_balance',
]

function expectedColorOperationKinds(
  style: OfflineFfmpegColorGradeStyle,
  shotMatching = false,
): OfflineFfmpegColorOperationKind[] {
  const kinds: OfflineFfmpegColorOperationKind[] = style === 'premium_clean'
    ? [
        'clarity',
        'contrast_curve',
        'exposure_correction',
        'highlight_recovery',
        'look_transform',
        'qa_histogram_check',
        'white_balance',
      ]
    : [
        'contrast_curve',
        'exposure_correction',
        'highlight_recovery',
        'qa_histogram_check',
        'saturation',
        'white_balance',
      ]
  return shotMatching
    ? [...kinds, 'shot_matching' as const].sort() as OfflineFfmpegColorOperationKind[]
    : kinds
}

function safeKey(value: unknown): value is string {
  return typeof value === 'string' && value.length <= 200 &&
    /^[A-Za-z0-9][A-Za-z0-9._:-]*$/.test(value) && !value.includes('..') &&
    value === value.trim()
}

function colorGradeStyleValue(value: unknown): OfflineFfmpegColorGradeStyle {
  if (value !== 'clean_natural' && value !== 'premium_clean') throw invalid()
  return value
}

function colorIntensityValue(value: unknown): OfflineFfmpegColorIntensity {
  if (value !== 'subtle' && value !== 'balanced') throw invalid()
  return value
}

function colorOperationKinds(value: unknown): OfflineFfmpegColorOperationKind[] {
  if (
    !Array.isArray(value) || value.length < 1 || value.length > COLOR_OPERATION_KINDS.length ||
    value.some((candidate) => !COLOR_OPERATION_KINDS.includes(
      candidate as OfflineFfmpegColorOperationKind,
    ))
  ) throw invalid()
  const normalized = [...new Set(value as OfflineFfmpegColorOperationKind[])].sort()
  if (normalized.length !== value.length || normalized.join('|') !== value.join('|')) throw invalid()
  return normalized
}

function boundedSafeKeys(value: unknown, maximum: number): string[] {
  if (
    !Array.isArray(value) || value.length < 1 || value.length > maximum ||
    value.some((candidate) =>
      typeof candidate !== 'string' || candidate.length > 200 ||
      !/^[A-Za-z0-9][A-Za-z0-9._:-]*$/.test(candidate) || candidate.includes('..') ||
      candidate !== candidate.trim())
  ) throw invalid()
  const normalized = [...new Set(value as string[])].sort()
  if (normalized.length !== value.length || normalized.join('|') !== value.join('|')) throw invalid()
  return normalized
}

function invalid(): Error {
  return new Error('Offline FFprobe request is outside its fixed structured contract.')
}
