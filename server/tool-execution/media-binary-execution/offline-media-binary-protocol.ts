import { createHash } from 'node:crypto'

export const OFFLINE_MEDIA_BINARY_PROTOCOL = 'offline-media-binary-execution-v1' as const
export const OFFLINE_GENERATED_MUSIC_CANDIDATE_NORMALIZATION_PROFILE =
  'approved_generated_music_candidate_normalization_v1' as const
export const OFFLINE_SYNCHRONIZED_FOLEY_CANDIDATE_NORMALIZATION_PROFILE =
  'approved_synchronized_foley_candidate_normalization_v1' as const
export const OFFLINE_MEDIA_BINARY_OPERATIONS = Object.freeze({
  ffmpeg: 'tool.ffmpeg.execute_approved_media_recipe.v1',
  ffprobe: 'tool.ffprobe.inspect_approved_media.v1',
  normalizeStorytellingAudioMix: 'tool.ffmpeg.normalize_storytelling_audio_mix.v1',
  measureStorytellingAudioMix: 'tool.ffmpeg.measure_storytelling_audio_mix.v1',
} as const)

interface OfflineStorytellingAudioSource {
  mimeType: 'audio/wav'
  sourceByteLength: number
  sourceSha256: string
  sourceBytesBase64: string
  expectedSampleCountPerChannel: number
}

export interface OfflineStorytellingAudioNormalizeExecutionRequest {
  schemaVersion: typeof OFFLINE_MEDIA_BINARY_PROTOCOL
  toolId: 'ffmpeg'
  operationId: typeof OFFLINE_MEDIA_BINARY_OPERATIONS.normalizeStorytellingAudioMix
  payload: OfflineStorytellingAudioSource & {
    recipeProfileId: 'motion_studio_storytelling_loudness_normalize_v1'
    targetIntegratedLufs: -16
    targetTruePeakDb: -1
    targetLoudnessRangeLu: 7
    outputSampleRateHertz: 48_000
    outputChannelCount: 2
  }
}

export interface OfflineStorytellingAudioMeasureExecutionRequest {
  schemaVersion: typeof OFFLINE_MEDIA_BINARY_PROTOCOL
  toolId: 'ffmpeg'
  operationId: typeof OFFLINE_MEDIA_BINARY_OPERATIONS.measureStorytellingAudioMix
  payload: OfflineStorytellingAudioSource & {
    measurementProfileId: 'motion_studio_storytelling_ebur128_v1'
    expectedSampleRateHertz: 48_000
    expectedChannelCount: 2
    emitMachineJsonOnly: true
  }
}

export interface OfflineGeneratedMusicCandidateNormalizeExecutionRequest {
  schemaVersion: typeof OFFLINE_MEDIA_BINARY_PROTOCOL
  toolId: 'ffmpeg'
  operationId: typeof OFFLINE_MEDIA_BINARY_OPERATIONS.ffmpeg
  payload: {
    recipeProfileId: typeof OFFLINE_GENERATED_MUSIC_CANDIDATE_NORMALIZATION_PROFILE
    mimeType: 'audio/wav'
    sourceByteLength: number
    sourceSha256: string
    sourceBytesBase64: string
    outputContainer: 'wav'
    outputCodec: 'pcm_s16le'
    outputSampleRateHertz: 48_000
    outputChannelCount: 2
    maximumDurationMilliseconds: 30_000
    metadataPolicy: 'strip_all'
    overwriteExistingArtifact: false
  }
}

export interface OfflineSynchronizedFoleyCandidateNormalizeExecutionRequest {
  schemaVersion: typeof OFFLINE_MEDIA_BINARY_PROTOCOL
  toolId: 'ffmpeg'
  operationId: typeof OFFLINE_MEDIA_BINARY_OPERATIONS.ffmpeg
  payload: {
    recipeProfileId: typeof OFFLINE_SYNCHRONIZED_FOLEY_CANDIDATE_NORMALIZATION_PROFILE
    mimeType: 'video/mp4'
    sourceByteLength: number
    sourceSha256: string
    sourceBytesBase64: string
    fps: 24 | 30
    durationFrames: number
    exactOutputSampleCountPerChannel: number
    outputContainer: 'wav'
    outputCodec: 'pcm_s16le'
    outputSampleRateHertz: 48_000
    outputChannelCount: 2
    metadataPolicy: 'strip_all'
    silencePaddingAllowed: false
    trimAtMostOneFrameOfExcessAllowed: true
    overwriteExistingArtifact: false
  }
}

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

export const APPROVED_STORYTELLING_SPEECH_TAKE_NORMALIZATION_PROFILE_ID =
  'approved_storytelling_speech_take_normalization_v1' as const

export interface OfflineFfmpegStorytellingSpeechTakeNormalizationPlanningPayload {
  recipeProfileId:
    typeof APPROVED_STORYTELLING_SPEECH_TAKE_NORMALIZATION_PROFILE_ID
  timestampPolicy: 'normalize_from_zero'
  overwriteExistingArtifact: false
  allowUnreviewedCodec: false
  sampleRate: 48_000
  channelMode: 'mono'
  sampleFormat: 'pcm_s16le'
  metadataPolicy: 'strip_all'
  maximumDurationSeconds: 30
  productionId: string
  productionAuthorityHash: string
  preparedScriptSegmentId: string
  sceneId: string
  voiceBibleVersionId: string
  voiceBibleContentDigest: string
  spokenTextDigest: string
  timingAuthorityDigest: string
  startFrame: number
  endFrameExclusive: number
  frameRate: 24 | 30
  sourceProviderOperationId:
    'provider.elevenlabs.generate_storytelling_speech_candidate.v1'
  sourceAudioRole: 'provider_storytelling_speech_audio_mp3'
  sourceAlignmentRole: 'provider_storytelling_speech_alignment_json'
  sourceAuthorityDigest: string
  alignmentBoundToExactSourceAudio: true
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
  | OfflineFfmpegStorytellingSpeechTakeNormalizationPlanningPayload
  | OfflineFfmpegColorDeliveryPlanningPayload
  | OfflineFfmpegColorMatchDeliveryPlanningPayload

export interface OfflineFfprobePlanningPayload {
  inspectionProfileId:
    | 'source_intake_v1'
    | 'pre_render_v1'
    | 'object_mezzanine_chunk_qa_v1'
    | 'customer_delivery_h264_chunk_qa_v1'
    | 'continuous_program_audio_qa_v1'
    | 'private_long_form_master_qa_v1'
    | 'final_export_v1'
    | 'motion_studio_audio_mix_v1'
  countFrames: boolean
  verifyDurationAndSync: true
  emitMachineJsonOnly: true
}

export interface OfflineFfprobeExecutionRequest {
  schemaVersion: typeof OFFLINE_MEDIA_BINARY_PROTOCOL
  toolId: 'ffprobe'
  operationId: typeof OFFLINE_MEDIA_BINARY_OPERATIONS.ffprobe
  payload: OfflineFfprobePlanningPayload & {
    mimeType: 'video/mp4' | 'audio/wav'
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
    | (Exclude<
        OfflineFfmpegPlanningPayload,
        | OfflineFfmpegColorMatchDeliveryPlanningPayload
        | OfflineFfmpegStorytellingSpeechTakeNormalizationPlanningPayload
      > &
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
  const storytellingSpeechNormalization = candidate?.recipeProfileId ===
    APPROVED_STORYTELLING_SPEECH_TAKE_NORMALIZATION_PROFILE_ID
  if (storytellingSpeechNormalization) {
    const keys = [
      'recipeProfileId', 'timestampPolicy', 'overwriteExistingArtifact',
      'allowUnreviewedCodec', 'sampleRate', 'channelMode', 'sampleFormat',
      'metadataPolicy', 'maximumDurationSeconds', 'productionId',
      'productionAuthorityHash', 'preparedScriptSegmentId', 'sceneId',
      'voiceBibleVersionId', 'voiceBibleContentDigest', 'spokenTextDigest',
      'timingAuthorityDigest', 'startFrame', 'endFrameExclusive', 'frameRate',
      'sourceProviderOperationId', 'sourceAudioRole', 'sourceAlignmentRole',
      'sourceAuthorityDigest', 'alignmentBoundToExactSourceAudio',
    ] as const
    const speech = exactObject(value, keys)
    const frameRate = Number(speech.frameRate)
    const startFrame = Number(speech.startFrame)
    const endFrameExclusive = Number(speech.endFrameExclusive)
    if (
      speech.recipeProfileId !==
        APPROVED_STORYTELLING_SPEECH_TAKE_NORMALIZATION_PROFILE_ID ||
      speech.timestampPolicy !== 'normalize_from_zero' ||
      speech.overwriteExistingArtifact !== false ||
      speech.allowUnreviewedCodec !== false ||
      speech.sampleRate !== 48_000 || speech.channelMode !== 'mono' ||
      speech.sampleFormat !== 'pcm_s16le' ||
      speech.metadataPolicy !== 'strip_all' ||
      speech.maximumDurationSeconds !== 30 ||
      !safeKey(speech.productionId) || !sha256Value(speech.productionAuthorityHash) ||
      !safeKey(speech.preparedScriptSegmentId) || !safeKey(speech.sceneId) ||
      !safeKey(speech.voiceBibleVersionId) ||
      !sha256Value(speech.voiceBibleContentDigest) ||
      !sha256Value(speech.spokenTextDigest) ||
      !sha256Value(speech.timingAuthorityDigest) ||
      !Number.isSafeInteger(startFrame) || startFrame < 0 ||
      !Number.isSafeInteger(endFrameExclusive) || endFrameExclusive <= startFrame ||
      ![24, 30].includes(frameRate) ||
      endFrameExclusive - startFrame > 30 * frameRate ||
      speech.sourceProviderOperationId !==
        'provider.elevenlabs.generate_storytelling_speech_candidate.v1' ||
      speech.sourceAudioRole !== 'provider_storytelling_speech_audio_mp3' ||
      speech.sourceAlignmentRole !==
        'provider_storytelling_speech_alignment_json' ||
      !sha256Value(speech.sourceAuthorityDigest) ||
      speech.alignmentBoundToExactSourceAudio !== true
    ) throw invalid()
    return {
      recipeProfileId:
        APPROVED_STORYTELLING_SPEECH_TAKE_NORMALIZATION_PROFILE_ID,
      timestampPolicy: 'normalize_from_zero',
      overwriteExistingArtifact: false,
      allowUnreviewedCodec: false,
      sampleRate: 48_000,
      channelMode: 'mono',
      sampleFormat: 'pcm_s16le',
      metadataPolicy: 'strip_all',
      maximumDurationSeconds: 30,
      productionId: String(speech.productionId),
      productionAuthorityHash: String(speech.productionAuthorityHash),
      preparedScriptSegmentId: String(speech.preparedScriptSegmentId),
      sceneId: String(speech.sceneId),
      voiceBibleVersionId: String(speech.voiceBibleVersionId),
      voiceBibleContentDigest: String(speech.voiceBibleContentDigest),
      spokenTextDigest: String(speech.spokenTextDigest),
      timingAuthorityDigest: String(speech.timingAuthorityDigest),
      startFrame,
      endFrameExclusive,
      frameRate: frameRate as 24 | 30,
      sourceProviderOperationId:
        'provider.elevenlabs.generate_storytelling_speech_candidate.v1',
      sourceAudioRole: 'provider_storytelling_speech_audio_mp3',
      sourceAlignmentRole: 'provider_storytelling_speech_alignment_json',
      sourceAuthorityDigest: String(speech.sourceAuthorityDigest),
      alignmentBoundToExactSourceAudio: true,
    }
  }
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
      'customer_delivery_h264_chunk_qa_v1',
      'continuous_program_audio_qa_v1',
      'private_long_form_master_qa_v1',
      'final_export_v1',
      'motion_studio_audio_mix_v1',
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
    !['video/mp4', 'audio/wav'].includes(String(payload.mimeType)) ||
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
      mimeType: payload.mimeType as 'video/mp4' | 'audio/wav',
      sourceByteLength: bytes.byteLength,
      sourceSha256: payload.sourceSha256,
      sourceBytesBase64: payload.sourceBytesBase64,
    },
  }
}

export function validateOfflineStorytellingAudioNormalizeExecutionRequest(
  value: unknown,
): OfflineStorytellingAudioNormalizeExecutionRequest {
  const request = exactObject(value, ['schemaVersion', 'toolId', 'operationId', 'payload'])
  if (
    request.schemaVersion !== OFFLINE_MEDIA_BINARY_PROTOCOL || request.toolId !== 'ffmpeg' ||
    request.operationId !== OFFLINE_MEDIA_BINARY_OPERATIONS.normalizeStorytellingAudioMix
  ) throw invalid()
  const payload = exactObject(request.payload, [
    'recipeProfileId', 'targetIntegratedLufs', 'targetTruePeakDb', 'targetLoudnessRangeLu',
    'outputSampleRateHertz', 'outputChannelCount', 'expectedSampleCountPerChannel',
    'mimeType', 'sourceByteLength', 'sourceSha256', 'sourceBytesBase64',
  ])
  if (
    payload.recipeProfileId !== 'motion_studio_storytelling_loudness_normalize_v1' ||
    payload.targetIntegratedLufs !== -16 || payload.targetTruePeakDb !== -1 ||
    payload.targetLoudnessRangeLu !== 7 || payload.outputSampleRateHertz !== 48_000 ||
    payload.outputChannelCount !== 2
  ) throw invalid()
  const source = validateAudioSource(payload)
  return {
    schemaVersion: OFFLINE_MEDIA_BINARY_PROTOCOL,
    toolId: 'ffmpeg',
    operationId: OFFLINE_MEDIA_BINARY_OPERATIONS.normalizeStorytellingAudioMix,
    payload: {
      recipeProfileId: 'motion_studio_storytelling_loudness_normalize_v1',
      targetIntegratedLufs: -16,
      targetTruePeakDb: -1,
      targetLoudnessRangeLu: 7,
      outputSampleRateHertz: 48_000,
      outputChannelCount: 2,
      ...source,
    },
  }
}

export function validateOfflineStorytellingAudioMeasureExecutionRequest(
  value: unknown,
): OfflineStorytellingAudioMeasureExecutionRequest {
  const request = exactObject(value, ['schemaVersion', 'toolId', 'operationId', 'payload'])
  if (
    request.schemaVersion !== OFFLINE_MEDIA_BINARY_PROTOCOL || request.toolId !== 'ffmpeg' ||
    request.operationId !== OFFLINE_MEDIA_BINARY_OPERATIONS.measureStorytellingAudioMix
  ) throw invalid()
  const payload = exactObject(request.payload, [
    'measurementProfileId', 'expectedSampleRateHertz', 'expectedChannelCount',
    'emitMachineJsonOnly', 'expectedSampleCountPerChannel', 'mimeType',
    'sourceByteLength', 'sourceSha256', 'sourceBytesBase64',
  ])
  if (
    payload.measurementProfileId !== 'motion_studio_storytelling_ebur128_v1' ||
    payload.expectedSampleRateHertz !== 48_000 || payload.expectedChannelCount !== 2 ||
    payload.emitMachineJsonOnly !== true
  ) throw invalid()
  const source = validateAudioSource(payload)
  return {
    schemaVersion: OFFLINE_MEDIA_BINARY_PROTOCOL,
    toolId: 'ffmpeg',
    operationId: OFFLINE_MEDIA_BINARY_OPERATIONS.measureStorytellingAudioMix,
    payload: {
      measurementProfileId: 'motion_studio_storytelling_ebur128_v1',
      expectedSampleRateHertz: 48_000,
      expectedChannelCount: 2,
      emitMachineJsonOnly: true,
      ...source,
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
  if (
    planning.recipeProfileId ===
      APPROVED_STORYTELLING_SPEECH_TAKE_NORMALIZATION_PROFILE_ID
  ) throw invalid()
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

export function validateOfflineGeneratedMusicCandidateNormalizeExecutionRequest(
  value: unknown,
): OfflineGeneratedMusicCandidateNormalizeExecutionRequest {
  const request = exactObject(value, ['schemaVersion', 'toolId', 'operationId', 'payload'])
  if (
    request.schemaVersion !== OFFLINE_MEDIA_BINARY_PROTOCOL || request.toolId !== 'ffmpeg' ||
    request.operationId !== OFFLINE_MEDIA_BINARY_OPERATIONS.ffmpeg
  ) throw invalid()
  const payload = exactObject(request.payload, [
    'recipeProfileId', 'mimeType', 'sourceByteLength', 'sourceSha256', 'sourceBytesBase64',
    'outputContainer', 'outputCodec', 'outputSampleRateHertz', 'outputChannelCount',
    'maximumDurationMilliseconds', 'metadataPolicy', 'overwriteExistingArtifact',
  ])
  if (
    payload.recipeProfileId !== OFFLINE_GENERATED_MUSIC_CANDIDATE_NORMALIZATION_PROFILE ||
    payload.mimeType !== 'audio/wav' || payload.outputContainer !== 'wav' ||
    payload.outputCodec !== 'pcm_s16le' || payload.outputSampleRateHertz !== 48_000 ||
    payload.outputChannelCount !== 2 || payload.maximumDurationMilliseconds !== 30_000 ||
    payload.metadataPolicy !== 'strip_all' || payload.overwriteExistingArtifact !== false ||
    !Number.isSafeInteger(payload.sourceByteLength) || Number(payload.sourceByteLength) < 44 ||
    Number(payload.sourceByteLength) > 16 * 1024 * 1024 ||
    typeof payload.sourceSha256 !== 'string' || !/^[a-f0-9]{64}$/.test(payload.sourceSha256) ||
    typeof payload.sourceBytesBase64 !== 'string' ||
    payload.sourceBytesBase64.length !== 4 * Math.ceil(Number(payload.sourceByteLength) / 3)
  ) throw invalid()
  const bytes = Buffer.from(payload.sourceBytesBase64, 'base64')
  if (
    bytes.byteLength !== payload.sourceByteLength || bytes.toString('base64') !== payload.sourceBytesBase64 ||
    createHash('sha256').update(bytes).digest('hex') !== payload.sourceSha256 ||
    bytes.subarray(0, 4).toString('ascii') !== 'RIFF' ||
    bytes.subarray(8, 12).toString('ascii') !== 'WAVE'
  ) throw invalid()
  return {
    schemaVersion: OFFLINE_MEDIA_BINARY_PROTOCOL,
    toolId: 'ffmpeg',
    operationId: OFFLINE_MEDIA_BINARY_OPERATIONS.ffmpeg,
    payload: {
      recipeProfileId: OFFLINE_GENERATED_MUSIC_CANDIDATE_NORMALIZATION_PROFILE,
      mimeType: 'audio/wav',
      sourceByteLength: bytes.byteLength,
      sourceSha256: payload.sourceSha256,
      sourceBytesBase64: payload.sourceBytesBase64,
      outputContainer: 'wav',
      outputCodec: 'pcm_s16le',
      outputSampleRateHertz: 48_000,
      outputChannelCount: 2,
      maximumDurationMilliseconds: 30_000,
      metadataPolicy: 'strip_all',
      overwriteExistingArtifact: false,
    },
  }
}

export function validateOfflineSynchronizedFoleyCandidateNormalizeExecutionRequest(
  value: unknown,
): OfflineSynchronizedFoleyCandidateNormalizeExecutionRequest {
  const request = exactObject(value, ['schemaVersion', 'toolId', 'operationId', 'payload'])
  if (
    request.schemaVersion !== OFFLINE_MEDIA_BINARY_PROTOCOL || request.toolId !== 'ffmpeg' ||
    request.operationId !== OFFLINE_MEDIA_BINARY_OPERATIONS.ffmpeg
  ) throw invalid()
  const payload = exactObject(request.payload, [
    'recipeProfileId', 'mimeType', 'sourceByteLength', 'sourceSha256', 'sourceBytesBase64',
    'fps', 'durationFrames', 'exactOutputSampleCountPerChannel', 'outputContainer',
    'outputCodec', 'outputSampleRateHertz', 'outputChannelCount', 'metadataPolicy',
    'silencePaddingAllowed', 'trimAtMostOneFrameOfExcessAllowed', 'overwriteExistingArtifact',
  ])
  const fps = Number(payload.fps)
  const durationFrames = Number(payload.durationFrames)
  const samplesPerFrame = 48_000 / fps
  const exactOutputSampleCountPerChannel = durationFrames * samplesPerFrame
  if (
    payload.recipeProfileId !== OFFLINE_SYNCHRONIZED_FOLEY_CANDIDATE_NORMALIZATION_PROFILE ||
    payload.mimeType !== 'video/mp4' || ![24, 30].includes(fps) ||
    !Number.isSafeInteger(durationFrames) || durationFrames < 1 || durationFrames > fps * 30 ||
    !Number.isSafeInteger(samplesPerFrame) ||
    !Number.isSafeInteger(payload.exactOutputSampleCountPerChannel) ||
    Number(payload.exactOutputSampleCountPerChannel) !== exactOutputSampleCountPerChannel ||
    payload.outputContainer !== 'wav' || payload.outputCodec !== 'pcm_s16le' ||
    payload.outputSampleRateHertz !== 48_000 || payload.outputChannelCount !== 2 ||
    payload.metadataPolicy !== 'strip_all' || payload.silencePaddingAllowed !== false ||
    payload.trimAtMostOneFrameOfExcessAllowed !== true || payload.overwriteExistingArtifact !== false ||
    !Number.isSafeInteger(payload.sourceByteLength) || Number(payload.sourceByteLength) < 64 ||
    Number(payload.sourceByteLength) > 67_108_864 ||
    typeof payload.sourceSha256 !== 'string' || !/^[a-f0-9]{64}$/.test(payload.sourceSha256) ||
    typeof payload.sourceBytesBase64 !== 'string' ||
    payload.sourceBytesBase64.length !== 4 * Math.ceil(Number(payload.sourceByteLength) / 3)
  ) throw invalid()
  const bytes = Buffer.from(payload.sourceBytesBase64, 'base64')
  if (
    bytes.byteLength !== payload.sourceByteLength || bytes.toString('base64') !== payload.sourceBytesBase64 ||
    createHash('sha256').update(bytes).digest('hex') !== payload.sourceSha256 ||
    bytes.subarray(4, 8).toString('ascii') !== 'ftyp'
  ) throw invalid()
  return {
    schemaVersion: OFFLINE_MEDIA_BINARY_PROTOCOL,
    toolId: 'ffmpeg',
    operationId: OFFLINE_MEDIA_BINARY_OPERATIONS.ffmpeg,
    payload: {
      recipeProfileId: OFFLINE_SYNCHRONIZED_FOLEY_CANDIDATE_NORMALIZATION_PROFILE,
      mimeType: 'video/mp4',
      sourceByteLength: bytes.byteLength,
      sourceSha256: payload.sourceSha256,
      sourceBytesBase64: payload.sourceBytesBase64,
      fps: fps as 24 | 30,
      durationFrames,
      exactOutputSampleCountPerChannel,
      outputContainer: 'wav',
      outputCodec: 'pcm_s16le',
      outputSampleRateHertz: 48_000,
      outputChannelCount: 2,
      metadataPolicy: 'strip_all',
      silencePaddingAllowed: false,
      trimAtMostOneFrameOfExcessAllowed: true,
      overwriteExistingArtifact: false,
    },
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

function validateAudioSource(payload: Record<string, unknown>): OfflineStorytellingAudioSource {
  if (
    payload.mimeType !== 'audio/wav' || !Number.isSafeInteger(payload.sourceByteLength) ||
    Number(payload.sourceByteLength) < 44 || Number(payload.sourceByteLength) > 8 * 1024 * 1024 ||
    typeof payload.sourceSha256 !== 'string' || !/^[a-f0-9]{64}$/.test(payload.sourceSha256) ||
    typeof payload.sourceBytesBase64 !== 'string' ||
    !Number.isSafeInteger(payload.expectedSampleCountPerChannel) ||
    Number(payload.expectedSampleCountPerChannel) < 48_000 ||
    Number(payload.expectedSampleCountPerChannel) > 48_000 * 120
  ) throw invalid()
  const bytes = Buffer.from(payload.sourceBytesBase64, 'base64')
  if (
    bytes.byteLength !== payload.sourceByteLength || bytes.toString('base64') !== payload.sourceBytesBase64 ||
    createHash('sha256').update(bytes).digest('hex') !== payload.sourceSha256 ||
    bytes.subarray(0, 4).toString('ascii') !== 'RIFF' ||
    bytes.subarray(8, 12).toString('ascii') !== 'WAVE'
  ) throw invalid()
  return {
    mimeType: 'audio/wav',
    sourceByteLength: bytes.byteLength,
    sourceSha256: payload.sourceSha256,
    sourceBytesBase64: payload.sourceBytesBase64,
    expectedSampleCountPerChannel: Number(payload.expectedSampleCountPerChannel),
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

function sha256Value(value: unknown): value is string {
  return typeof value === 'string' && /^[a-f0-9]{64}$/u.test(value)
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
