import { createHash } from 'node:crypto'

export const OFFLINE_PYTHON_STRUCTURED_EXECUTION_PROTOCOL =
  'offline-python-structured-execution-v1' as const
export const OFFLINE_PYTHON_STRUCTURED_CONTAINER_PROTOCOL =
  'offline-python-structured-execution-container-v1' as const

export const OFFLINE_PYTHON_STRUCTURED_TOOL_IDS = [
  'duckdb', 'polars', 'opentimelineio', 'pyav', 'opencv', 'pyscenedetect',
  'scipy', 'pyloudnorm', 'pydub', 'pydub_effects', 'ebu_r128_pyloudnorm',
  'audioread', 'resampy', 'pedalboard', 'mir_eval', 'mido', 'pretty_midi', 'noisereduce',
  'librosa',
] as const
export type OfflinePythonStructuredToolId = (typeof OFFLINE_PYTHON_STRUCTURED_TOOL_IDS)[number]

export const OFFLINE_PYTHON_MEDIA_TOOL_IDS = [
  'pyav', 'opencv', 'pyscenedetect',
] as const satisfies readonly OfflinePythonStructuredToolId[]
export type OfflinePythonMediaToolId = (typeof OFFLINE_PYTHON_MEDIA_TOOL_IDS)[number]

export const OFFLINE_PYTHON_AUDIO_TOOL_IDS = [
  'scipy', 'pyloudnorm', 'pydub', 'pydub_effects', 'ebu_r128_pyloudnorm',
  'audioread', 'resampy', 'pedalboard', 'mir_eval', 'mido', 'pretty_midi', 'noisereduce',
  'librosa',
] as const satisfies readonly OfflinePythonStructuredToolId[]
export type OfflinePythonAudioToolId = (typeof OFFLINE_PYTHON_AUDIO_TOOL_IDS)[number]

export const OFFLINE_PYTHON_AUDIO_WAV_TOOL_IDS = [
  'pydub', 'pydub_effects', 'resampy', 'pedalboard', 'noisereduce',
] as const satisfies readonly OfflinePythonAudioToolId[]
export type OfflinePythonAudioWavToolId = (typeof OFFLINE_PYTHON_AUDIO_WAV_TOOL_IDS)[number]
export type OfflinePythonStructuredJsonToolId = Exclude<
  OfflinePythonStructuredToolId,
  OfflinePythonAudioWavToolId
>
export const OFFLINE_PYTHON_STRUCTURED_JSON_TOOL_IDS = Object.freeze(
  OFFLINE_PYTHON_STRUCTURED_TOOL_IDS.filter(
    (toolId): toolId is OfflinePythonStructuredJsonToolId =>
      !(OFFLINE_PYTHON_AUDIO_WAV_TOOL_IDS as readonly string[]).includes(toolId),
  ),
)

export const OFFLINE_PYTHON_SOURCE_TOOL_IDS = [
  ...OFFLINE_PYTHON_MEDIA_TOOL_IDS,
  ...OFFLINE_PYTHON_AUDIO_TOOL_IDS,
] as const
export type OfflinePythonSourceToolId = (typeof OFFLINE_PYTHON_SOURCE_TOOL_IDS)[number]

export const OFFLINE_PYTHON_STRUCTURED_OPERATIONS = Object.freeze({
  duckdb: 'tool.duckdb.query_approved_artifact_tables.v1',
  polars: 'tool.polars.transform_approved_artifact_tables.v1',
  opentimelineio: 'tool.opentimelineio.interchange_approved_timeline.v1',
  pyav: 'tool.pyav.decode_approved_media.v1',
  opencv: 'tool.opencv.analyze_approved_visual_artifacts.v1',
  pyscenedetect: 'tool.pyscenedetect.detect_scene_boundaries.v1',
  scipy: 'tool.scipy.analyze_signal.v1',
  pyloudnorm: 'tool.pyloudnorm.measure_loudness.v1',
  pydub: 'tool.pydub.process_audio_segments.v1',
  pydub_effects: 'tool.pydub_effects.apply_approved_audio_recipe.v1',
  ebu_r128_pyloudnorm: 'tool.ebu_r128_pyloudnorm.measure_ebu_r128_loudness.v1',
  audioread: 'tool.audioread.verify_audio_decode.v1',
  resampy: 'tool.resampy.resample_audio.v1',
  pedalboard: 'tool.pedalboard.apply_audio_effect_chain.v1',
  mir_eval: 'tool.mir_eval.score_music_timing.v1',
  mido: 'tool.mido.validate_midi_events.v1',
  pretty_midi: 'tool.pretty_midi.analyze_midi_timing.v1',
  noisereduce: 'tool.noisereduce.reduce_noise.v1',
  librosa: 'tool.librosa.analyze_audio_features.v1',
} as const satisfies Readonly<Record<OfflinePythonStructuredToolId, string>>)

export function isOfflinePythonSourceToolId(value: string): value is OfflinePythonSourceToolId {
  return (OFFLINE_PYTHON_SOURCE_TOOL_IDS as readonly string[]).includes(value)
}

export function isOfflinePythonMediaToolId(value: string): value is OfflinePythonMediaToolId {
  return (OFFLINE_PYTHON_MEDIA_TOOL_IDS as readonly string[]).includes(value)
}

export function isOfflinePythonAudioToolId(value: string): value is OfflinePythonAudioToolId {
  return (OFFLINE_PYTHON_AUDIO_TOOL_IDS as readonly string[]).includes(value)
}

export function isOfflinePythonAudioWavToolId(value: string): value is OfflinePythonAudioWavToolId {
  return (OFFLINE_PYTHON_AUDIO_WAV_TOOL_IDS as readonly string[]).includes(value)
}

export function isOfflinePythonStructuredJsonToolId(
  value: string,
): value is OfflinePythonStructuredJsonToolId {
  return (OFFLINE_PYTHON_STRUCTURED_JSON_TOOL_IDS as readonly string[]).includes(value)
}

export interface OfflinePythonTableRow {
  rowId: string
  category: string
  status: 'passed' | 'warning' | 'failed' | 'blocked'
  startFrame: number
  endFrame: number
  value: number
}

export interface OfflinePythonDuckDbPayload {
  queryProfileId: 'approved_qa_aggregate_v1' | 'approved_timing_metrics_v1'
  maximumRows: number
  rows: OfflinePythonTableRow[]
}

export interface OfflinePythonPolarsPayload {
  transformProfileId: 'approved_qa_transform_v1' | 'approved_timing_table_v1'
  maximumRows: number
  deterministicOrdering: true
  rows: OfflinePythonTableRow[]
}

export interface OfflinePythonOtioClip {
  clipId: string
  name: string
  mediaReferenceId: string
  sourceStartFrame: number
  durationFrames: number
  timelineStartFrame: number
}

export interface OfflinePythonOtioPayload {
  interchangeProfileId: 'approved_plan_to_otio_v1' | 'validate_approved_otio_v1'
  frameRate: 24 | 25 | 30 | 50 | 60
  strictRangeValidation: true
  preserveApprovedSourceOrder: true
  timelineName: string
  clips: OfflinePythonOtioClip[]
}

interface OfflinePythonApprovedSourcePayload {
  mimeType: 'video/mp4'
  sourceByteLength: number
  sourceSha256: string
  sourceBytesBase64: string
}

export interface OfflinePythonPyAvPlanningPayload {
  decodeProfileId: 'timestamp_safe_sample_v1' | 'keyframe_extract_v1' | 'audio_extract_v1'
  frameStride: 1 | 5 | 10 | 15 | 30
  maximumSamples: number
  preserveSourceTimestamps: true
}
export type OfflinePythonPyAvPayload = OfflinePythonPyAvPlanningPayload & OfflinePythonApprovedSourcePayload

export interface OfflinePythonOpenCvPlanningPayload {
  analysisProfileId: 'approved_safe_zone_v1' | 'approved_blur_check_v1' | 'approved_mask_qa_v1'
  frameStride: 1 | 5 | 10 | 15 | 30
  maximumFrames: number
  emitDerivedPixels: false
}
export type OfflinePythonOpenCvPayload = OfflinePythonOpenCvPlanningPayload & OfflinePythonApprovedSourcePayload

export interface OfflinePythonSceneDetectPlanningPayload {
  detectorProfileId: string
  contentThreshold: number
  minimumSceneFrames: number
  downscaleFactor: number
}
export type OfflinePythonSceneDetectPayload = OfflinePythonSceneDetectPlanningPayload & OfflinePythonApprovedSourcePayload

export type OfflinePythonAudioChannelMode = 'mono' | 'stereo' | 'preserve'

export interface OfflinePythonScipyPlanningPayload {
  sampleRate: 16_000 | 22_050 | 44_100 | 48_000
  channelMode: OfflinePythonAudioChannelMode
  analysisProfileId: 'approved_signal_quality_v1' | 'approved_spectral_summary_v1' |
  'approved_music_timing_score_v1' | 'approved_rhythm_timing_cues_v1'
  confidenceThreshold?: number
}
export type OfflinePythonScipyPayload = OfflinePythonScipyPlanningPayload & OfflinePythonApprovedSourcePayload

export interface OfflinePythonPyloudnormPlanningPayload {
  targetLufs: number
  truePeakDbtp: number
  channelMode: OfflinePythonAudioChannelMode
  measurementProfileId: 'ebu_r128_integrated_v1' | 'voice_delivery_gate_v1'
}
export type OfflinePythonPyloudnormPayload = OfflinePythonPyloudnormPlanningPayload & OfflinePythonApprovedSourcePayload

export interface OfflinePythonPydubPlanningPayload {
  sampleRate: 16_000 | 22_050 | 44_100 | 48_000
  channelMode: OfflinePythonAudioChannelMode
  processingProfileId: 'approved_voice_polish_v1' | 'approved_segment_gain_v1' |
  'approved_resample_v1' | 'approved_voice_effect_chain_v1' | 'approved_noise_reduction_v1'
  strength: number
  preserveVoice: true
}
export type OfflinePythonPydubPayload = OfflinePythonPydubPlanningPayload & OfflinePythonApprovedSourcePayload

export interface OfflinePythonAudioreadPlanningPayload {
  decodeProfileId: 'approved_pcm_decode_v1' | 'approved_audio_intake_v1'
  maximumChannels: number
  maximumSampleRate: number
}
export type OfflinePythonAudioreadPayload = OfflinePythonAudioreadPlanningPayload & OfflinePythonApprovedSourcePayload

export interface OfflinePythonMidoPlanningPayload {
  timingResolutionPpq: number
  tempoPolicy: 'preserve' | 'approved_map'
  timingProfileId: 'approved_timing_map_v1' | 'approved_midi_validation_v1' |
  'approved_pretty_midi_timing_v1'
}
export type OfflinePythonMidoPayload = OfflinePythonMidoPlanningPayload & OfflinePythonApprovedSourcePayload

export type OfflinePythonStructuredPayload =
  | OfflinePythonDuckDbPayload
  | OfflinePythonPolarsPayload
  | OfflinePythonOtioPayload
  | OfflinePythonPyAvPayload
  | OfflinePythonOpenCvPayload
  | OfflinePythonSceneDetectPayload
  | OfflinePythonScipyPayload
  | OfflinePythonPyloudnormPayload
  | OfflinePythonPydubPayload
  | OfflinePythonAudioreadPayload
  | OfflinePythonMidoPayload

export interface OfflinePythonStructuredExecutionRequest {
  schemaVersion: typeof OFFLINE_PYTHON_STRUCTURED_EXECUTION_PROTOCOL
  toolId: OfflinePythonStructuredToolId
  operationId: string
  payload: OfflinePythonStructuredPayload
}

const SAFE_ID = /^[A-Za-z][A-Za-z0-9_-]{2,95}$/
const FORBIDDEN_TEXT = /(?:https?:\/\/|ftp:\/\/|file:|data:|javascript:|\.\.\/|\.\.\\|[A-Za-z]:[\\/]|(?:^|\s)\/(?:Users|home|etc|tmp|var|opt|app|root|proc|sys|dev)(?:\/|\b)|\$\(|`|&&|\|\||#!)/i

export function validateOfflinePythonStructuredExecutionRequest(
  value: unknown,
): OfflinePythonStructuredExecutionRequest {
  const request = exactObject(value, ['schemaVersion', 'toolId', 'operationId', 'payload'], 'request')
  if (request.schemaVersion !== OFFLINE_PYTHON_STRUCTURED_EXECUTION_PROTOCOL) {
    throw invalid('Structured Python protocol is unsupported.')
  }
  if (!isToolId(request.toolId)) throw invalid('Structured Python tool identity is unsupported.')
  if (request.operationId !== OFFLINE_PYTHON_STRUCTURED_OPERATIONS[request.toolId]) {
    throw invalid('Structured Python operation identity is unsupported.')
  }
  const payload = request.toolId === 'duckdb'
    ? validateDuckDbPayload(request.payload)
    : request.toolId === 'polars'
      ? validatePolarsPayload(request.payload)
      : request.toolId === 'opentimelineio'
        ? validateOtioPayload(request.payload)
        : validateSourcePayload(request.toolId, request.payload)
  const normalized: OfflinePythonStructuredExecutionRequest = {
    schemaVersion: OFFLINE_PYTHON_STRUCTURED_EXECUTION_PROTOCOL,
    toolId: request.toolId,
    operationId: OFFLINE_PYTHON_STRUCTURED_OPERATIONS[request.toolId],
    payload,
  }
  if (Buffer.byteLength(stableStringify(normalized), 'utf8') > 24 * 1024 * 1024) {
    throw invalid('Structured Python request exceeds its fixed byte ceiling.')
  }
  return normalized
}

export function validateOfflinePythonMediaPlanningPayload(
  toolId: OfflinePythonMediaToolId,
  value: unknown,
): OfflinePythonPyAvPlanningPayload | OfflinePythonOpenCvPlanningPayload | OfflinePythonSceneDetectPlanningPayload {
  if (toolId === 'pyav') {
    const payload = exactObject(value, [
      'decodeProfileId', 'frameStride', 'maximumSamples', 'preserveSourceTimestamps',
    ], 'PyAV planning payload')
    if (payload.preserveSourceTimestamps !== true) throw invalid('PyAV timestamp preservation is required.')
    return {
      decodeProfileId: oneOf(payload.decodeProfileId, ['timestamp_safe_sample_v1', 'keyframe_extract_v1', 'audio_extract_v1'], 'decodeProfileId'),
      frameStride: oneOf(payload.frameStride, [1, 5, 10, 15, 30], 'frameStride'),
      maximumSamples: boundedInteger(payload.maximumSamples, 1, 2_000, 'maximumSamples'),
      preserveSourceTimestamps: true,
    }
  }
  if (toolId === 'opencv') {
    const payload = exactObject(value, [
      'analysisProfileId', 'frameStride', 'maximumFrames', 'emitDerivedPixels',
    ], 'OpenCV planning payload')
    if (payload.emitDerivedPixels !== false) throw invalid('OpenCV derived-pixel output is forbidden.')
    return {
      analysisProfileId: oneOf(payload.analysisProfileId, ['approved_safe_zone_v1', 'approved_blur_check_v1', 'approved_mask_qa_v1'], 'analysisProfileId'),
      frameStride: oneOf(payload.frameStride, [1, 5, 10, 15, 30], 'frameStride'),
      maximumFrames: boundedInteger(payload.maximumFrames, 1, 5_000, 'maximumFrames'),
      emitDerivedPixels: false,
    }
  }
  const payload = exactObject(value, [
    'detectorProfileId', 'contentThreshold', 'minimumSceneFrames', 'downscaleFactor',
  ], 'PySceneDetect planning payload')
  return {
    detectorProfileId: safeId(payload.detectorProfileId, 'detectorProfileId'),
    contentThreshold: boundedNumber(payload.contentThreshold, 0, 100, 'contentThreshold'),
    minimumSceneFrames: boundedInteger(payload.minimumSceneFrames, 1, 3_600, 'minimumSceneFrames'),
    downscaleFactor: boundedInteger(payload.downscaleFactor, 1, 8, 'downscaleFactor'),
  }
}

export function validateOfflinePythonAudioPlanningPayload(
  toolId: OfflinePythonAudioToolId,
  value: unknown,
): OfflinePythonScipyPlanningPayload | OfflinePythonPyloudnormPlanningPayload |
OfflinePythonPydubPlanningPayload | OfflinePythonAudioreadPlanningPayload |
OfflinePythonMidoPlanningPayload {
  if (toolId === 'mido' || toolId === 'pretty_midi') {
    const payload = exactObject(value, [
      'timingResolutionPpq', 'tempoPolicy', 'timingProfileId',
    ], 'mido planning payload')
    return {
      timingResolutionPpq: boundedInteger(payload.timingResolutionPpq, 24, 9_600, 'timingResolutionPpq'),
      tempoPolicy: oneOf(payload.tempoPolicy, ['preserve', 'approved_map'], 'tempoPolicy'),
      timingProfileId: toolId === 'pretty_midi'
        ? oneOf(payload.timingProfileId, ['approved_pretty_midi_timing_v1'], 'timingProfileId')
        : oneOf(payload.timingProfileId, ['approved_timing_map_v1', 'approved_midi_validation_v1'], 'timingProfileId'),
    }
  }
  if (toolId === 'audioread') {
    const payload = exactObject(value, [
      'decodeProfileId', 'maximumChannels', 'maximumSampleRate',
    ], 'audioread planning payload')
    return {
      decodeProfileId: oneOf(payload.decodeProfileId, ['approved_pcm_decode_v1', 'approved_audio_intake_v1'], 'decodeProfileId'),
      maximumChannels: boundedInteger(payload.maximumChannels, 1, 8, 'maximumChannels'),
      maximumSampleRate: boundedInteger(payload.maximumSampleRate, 8_000, 192_000, 'maximumSampleRate'),
    }
  }
  if (toolId === 'scipy' || toolId === 'mir_eval' || toolId === 'librosa') {
    const raw = value && typeof value === 'object' && !Array.isArray(value)
      ? value as Record<string, unknown>
      : {}
    const payload = exactObject(value, Object.hasOwn(raw, 'confidenceThreshold')
      ? ['sampleRate', 'channelMode', 'analysisProfileId', 'confidenceThreshold']
      : ['sampleRate', 'channelMode', 'analysisProfileId'], 'SciPy planning payload')
    return {
      sampleRate: oneOf(payload.sampleRate, [16_000, 22_050, 44_100, 48_000], 'sampleRate'),
      channelMode: oneOf(payload.channelMode, ['mono', 'stereo', 'preserve'], 'channelMode'),
      analysisProfileId: toolId === 'mir_eval'
        ? oneOf(payload.analysisProfileId, ['approved_music_timing_score_v1'], 'analysisProfileId')
        : toolId === 'librosa'
          ? oneOf(payload.analysisProfileId, ['approved_rhythm_timing_cues_v1'], 'analysisProfileId')
          : oneOf(payload.analysisProfileId, ['approved_signal_quality_v1', 'approved_spectral_summary_v1'], 'analysisProfileId'),
      ...(Object.hasOwn(payload, 'confidenceThreshold')
        ? { confidenceThreshold: boundedNumber(payload.confidenceThreshold, 0, 1, 'confidenceThreshold') }
        : {}),
    }
  }
  if (toolId === 'pyloudnorm' || toolId === 'ebu_r128_pyloudnorm') {
    const payload = exactObject(value, [
      'targetLufs', 'truePeakDbtp', 'channelMode', 'measurementProfileId',
    ], 'pyloudnorm planning payload')
    return {
      targetLufs: boundedNumber(payload.targetLufs, -24, -9, 'targetLufs'),
      truePeakDbtp: boundedNumber(payload.truePeakDbtp, -6, -0.1, 'truePeakDbtp'),
      channelMode: oneOf(payload.channelMode, ['mono', 'stereo', 'preserve'], 'channelMode'),
      measurementProfileId: oneOf(payload.measurementProfileId, ['ebu_r128_integrated_v1', 'voice_delivery_gate_v1'], 'measurementProfileId'),
    }
  }
  const payload = exactObject(value, [
    'sampleRate', 'channelMode', 'processingProfileId', 'strength', 'preserveVoice',
  ], 'audio processing planning payload')
  if (payload.preserveVoice !== true) throw invalid('Audio processing voice preservation is required.')
  const profiles = toolId === 'resampy'
    ? ['approved_resample_v1'] as const
    : toolId === 'pedalboard'
      ? ['approved_voice_effect_chain_v1'] as const
      : toolId === 'noisereduce'
        ? ['approved_noise_reduction_v1'] as const
        : ['approved_voice_polish_v1', 'approved_segment_gain_v1'] as const
  return {
    sampleRate: oneOf(payload.sampleRate, [16_000, 22_050, 44_100, 48_000], 'sampleRate'),
    channelMode: oneOf(payload.channelMode, ['mono', 'stereo', 'preserve'], 'channelMode'),
    processingProfileId: oneOf(payload.processingProfileId, profiles, 'processingProfileId'),
    strength: boundedNumber(payload.strength, 0, 1, 'strength'),
    preserveVoice: true,
  }
}

function validateSourcePayload(
  toolId: OfflinePythonSourceToolId,
  value: unknown,
): OfflinePythonPyAvPayload | OfflinePythonOpenCvPayload | OfflinePythonSceneDetectPayload |
OfflinePythonScipyPayload | OfflinePythonPyloudnormPayload | OfflinePythonPydubPayload |
OfflinePythonAudioreadPayload | OfflinePythonMidoPayload {
  const fullKeys = toolId === 'pyav'
    ? ['decodeProfileId', 'frameStride', 'maximumSamples', 'preserveSourceTimestamps']
    : toolId === 'opencv'
      ? ['analysisProfileId', 'frameStride', 'maximumFrames', 'emitDerivedPixels']
      : toolId === 'pyscenedetect'
        ? ['detectorProfileId', 'contentThreshold', 'minimumSceneFrames', 'downscaleFactor']
        : toolId === 'audioread'
          ? ['decodeProfileId', 'maximumChannels', 'maximumSampleRate']
        : toolId === 'mido' || toolId === 'pretty_midi'
          ? ['timingResolutionPpq', 'tempoPolicy', 'timingProfileId']
        : toolId === 'scipy' || toolId === 'mir_eval' || toolId === 'librosa'
          ? [
              'sampleRate', 'channelMode', 'analysisProfileId',
              ...(value && typeof value === 'object' && !Array.isArray(value) && Object.hasOwn(value, 'confidenceThreshold')
                ? ['confidenceThreshold']
                : []),
            ]
          : toolId === 'pyloudnorm' || toolId === 'ebu_r128_pyloudnorm'
            ? ['targetLufs', 'truePeakDbtp', 'channelMode', 'measurementProfileId']
            : ['sampleRate', 'channelMode', 'processingProfileId', 'strength', 'preserveVoice']
  const record = exactObject(value, [
    ...fullKeys, 'mimeType', 'sourceByteLength', 'sourceSha256', 'sourceBytesBase64',
  ], `${toolId} runtime payload`)
  const planningValue = Object.fromEntries(fullKeys.map((key) => [key, record[key]]))
  const planning = toolId === 'pyav' || toolId === 'opencv' || toolId === 'pyscenedetect'
    ? validateOfflinePythonMediaPlanningPayload(toolId, planningValue)
    : validateOfflinePythonAudioPlanningPayload(toolId, planningValue)
  if (record.mimeType !== 'video/mp4') throw invalid('Media runner currently requires video/mp4.')
  const sourceByteLength = boundedInteger(record.sourceByteLength, 64, 16 * 1024 * 1024, 'sourceByteLength')
  if (typeof record.sourceSha256 !== 'string' || !/^[a-f0-9]{64}$/.test(record.sourceSha256)) {
    throw invalid('sourceSha256 is invalid.')
  }
  if (typeof record.sourceBytesBase64 !== 'string' || record.sourceBytesBase64.length > Math.ceil(sourceByteLength / 3) * 4 + 4) {
    throw invalid('sourceBytesBase64 is invalid.')
  }
  let bytes: Buffer
  try {
    bytes = Buffer.from(record.sourceBytesBase64, 'base64')
  } catch {
    throw invalid('sourceBytesBase64 is malformed.')
  }
  if (
    bytes.byteLength !== sourceByteLength ||
    bytes.toString('base64') !== record.sourceBytesBase64 ||
    createHash('sha256').update(bytes).digest('hex') !== record.sourceSha256
  ) throw invalid('Source bytes do not match their immutable commitment.')
  return {
    ...planning,
    mimeType: 'video/mp4',
    sourceByteLength,
    sourceSha256: record.sourceSha256,
    sourceBytesBase64: record.sourceBytesBase64,
  } as OfflinePythonPyAvPayload | OfflinePythonOpenCvPayload | OfflinePythonSceneDetectPayload |
  OfflinePythonScipyPayload | OfflinePythonPyloudnormPayload | OfflinePythonPydubPayload |
  OfflinePythonAudioreadPayload | OfflinePythonMidoPayload
}

export function offlinePythonStructuredRequestSha256(
  request: OfflinePythonStructuredExecutionRequest,
): string {
  return createHash('sha256').update(stableStringify(request)).digest('hex')
}

export function stableStringify(value: unknown): string {
  if (value === null || typeof value === 'boolean' || typeof value === 'number' || typeof value === 'string') {
    return JSON.stringify(value)
  }
  if (Array.isArray(value)) return `[${value.map((entry) => stableStringify(entry)).join(',')}]`
  if (value && typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>).sort(([left], [right]) => left.localeCompare(right))
    return `{${entries.map(([key, entry]) => `${JSON.stringify(key)}:${stableStringify(entry)}`).join(',')}}`
  }
  throw invalid('Structured Python value contains an unsupported type.')
}

function validateDuckDbPayload(value: unknown): OfflinePythonDuckDbPayload {
  const payload = exactObject(value, ['queryProfileId', 'maximumRows', 'rows'], 'DuckDB payload')
  return {
    queryProfileId: oneOf(payload.queryProfileId, ['approved_qa_aggregate_v1', 'approved_timing_metrics_v1'], 'queryProfileId'),
    maximumRows: boundedInteger(payload.maximumRows, 1, 10_000, 'maximumRows'),
    rows: validateRows(payload.rows, payload.maximumRows),
  }
}

function validatePolarsPayload(value: unknown): OfflinePythonPolarsPayload {
  const payload = exactObject(
    value,
    ['transformProfileId', 'maximumRows', 'deterministicOrdering', 'rows'],
    'Polars payload',
  )
  if (payload.deterministicOrdering !== true) throw invalid('Polars deterministic ordering is required.')
  return {
    transformProfileId: oneOf(payload.transformProfileId, ['approved_qa_transform_v1', 'approved_timing_table_v1'], 'transformProfileId'),
    maximumRows: boundedInteger(payload.maximumRows, 1, 10_000, 'maximumRows'),
    deterministicOrdering: true,
    rows: validateRows(payload.rows, payload.maximumRows),
  }
}

function validateRows(value: unknown, maximumRowsValue: unknown): OfflinePythonTableRow[] {
  const maximumRows = boundedInteger(maximumRowsValue, 1, 10_000, 'maximumRows')
  if (!Array.isArray(value) || value.length < 1 || value.length > maximumRows) {
    throw invalid('Structured table rows are empty or exceed maximumRows.')
  }
  const rows = value.map((entry, index) => {
    const row = exactObject(
      entry,
      ['rowId', 'category', 'status', 'startFrame', 'endFrame', 'value'],
      `rows[${index}]`,
    )
    const startFrame = boundedInteger(row.startFrame, 0, 10_000_000, 'startFrame')
    const endFrame = boundedInteger(row.endFrame, 1, 10_000_001, 'endFrame')
    if (endFrame <= startFrame) throw invalid('Table row endFrame must follow startFrame.')
    return {
      rowId: safeId(row.rowId, 'rowId'),
      category: safeId(row.category, 'category'),
      status: oneOf(row.status, ['passed', 'warning', 'failed', 'blocked'], 'status'),
      startFrame,
      endFrame,
      value: boundedNumber(row.value, -1_000_000_000, 1_000_000_000, 'value'),
    }
  })
  if (new Set(rows.map((row) => row.rowId)).size !== rows.length) {
    throw invalid('Structured table row identities must be unique.')
  }
  return rows
}

function validateOtioPayload(value: unknown): OfflinePythonOtioPayload {
  const payload = exactObject(value, [
    'interchangeProfileId',
    'frameRate',
    'strictRangeValidation',
    'preserveApprovedSourceOrder',
    'timelineName',
    'clips',
  ], 'OpenTimelineIO payload')
  if (payload.strictRangeValidation !== true || payload.preserveApprovedSourceOrder !== true) {
    throw invalid('OpenTimelineIO strict ranges and approved source order are required.')
  }
  if (!Array.isArray(payload.clips) || payload.clips.length < 1 || payload.clips.length > 2_000) {
    throw invalid('OpenTimelineIO clip list is empty or exceeds its bound.')
  }
  let cursor = 0
  const clips = payload.clips.map((entry, index) => {
    const clip = exactObject(entry, [
      'clipId',
      'name',
      'mediaReferenceId',
      'sourceStartFrame',
      'durationFrames',
      'timelineStartFrame',
    ], `clips[${index}]`)
    const timelineStartFrame = boundedInteger(clip.timelineStartFrame, 0, 100_000_000, 'timelineStartFrame')
    const durationFrames = boundedInteger(clip.durationFrames, 1, 10_000_000, 'durationFrames')
    if (timelineStartFrame < cursor) throw invalid('OpenTimelineIO clips overlap or violate approved order.')
    cursor = timelineStartFrame + durationFrames
    return {
      clipId: safeId(clip.clipId, 'clipId'),
      name: safeText(clip.name, 120, 'clip name'),
      mediaReferenceId: safeId(clip.mediaReferenceId, 'mediaReferenceId'),
      sourceStartFrame: boundedInteger(clip.sourceStartFrame, 0, 100_000_000, 'sourceStartFrame'),
      durationFrames,
      timelineStartFrame,
    }
  })
  if (new Set(clips.map((clip) => clip.clipId)).size !== clips.length) {
    throw invalid('OpenTimelineIO clip identities must be unique.')
  }
  return {
    interchangeProfileId: oneOf(payload.interchangeProfileId, ['approved_plan_to_otio_v1', 'validate_approved_otio_v1'], 'interchangeProfileId'),
    frameRate: oneOf(payload.frameRate, [24, 25, 30, 50, 60], 'frameRate'),
    strictRangeValidation: true,
    preserveApprovedSourceOrder: true,
    timelineName: safeText(payload.timelineName, 96, 'timelineName'),
    clips,
  }
}

function exactObject(
  value: unknown,
  keys: readonly string[],
  label: string,
): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw invalid(`${label} must be an object.`)
  const received = Object.keys(value as Record<string, unknown>).sort()
  const expected = [...keys].sort()
  if (stableStringify(received) !== stableStringify(expected)) throw invalid(`${label} contains unsupported fields.`)
  return value as Record<string, unknown>
}

function safeId(value: unknown, label: string): string {
  const text = safeText(value, 96, label)
  if (!SAFE_ID.test(text) || text.includes('..')) throw invalid(`${label} is not a safe identity.`)
  return text
}

function safeText(value: unknown, maximum: number, label: string): string {
  if (
    typeof value !== 'string' ||
    value.length < 1 ||
    value.length > maximum ||
    value !== value.trim() ||
    Array.from(value).some((character) => character.charCodeAt(0) < 32 || character.charCodeAt(0) === 127) ||
    FORBIDDEN_TEXT.test(value)
  ) {
    throw invalid(`${label} contains unsafe text.`)
  }
  return value
}

function boundedInteger(value: unknown, minimum: number, maximum: number, label: string): number {
  if (!Number.isSafeInteger(value) || Number(value) < minimum || Number(value) > maximum) {
    throw invalid(`${label} is outside its integer bounds.`)
  }
  return Number(value)
}

function boundedNumber(value: unknown, minimum: number, maximum: number, label: string): number {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < minimum || value > maximum) {
    throw invalid(`${label} is outside its numeric bounds.`)
  }
  return value
}

function oneOf<const T>(value: unknown, choices: readonly T[], label: string): T {
  if (!choices.includes(value as T)) throw invalid(`${label} is unsupported.`)
  return value as T
}

function isToolId(value: unknown): value is OfflinePythonStructuredToolId {
  return typeof value === 'string' && Object.hasOwn(OFFLINE_PYTHON_STRUCTURED_OPERATIONS, value)
}

function invalid(message: string): Error {
  return new Error(message)
}
