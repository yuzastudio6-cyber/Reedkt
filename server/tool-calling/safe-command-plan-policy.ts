import type {
  ProductionRegistryWorkerType,
  ProductionToolId,
} from '../tool-registry'
import type {
  ToolCallingOperationId,
} from './operation-ontology'
import type {
  CommandIntentPolicy,
  SafeCommandParameterDefinition,
  SafeCommandParameterValue,
  SafeCommandResourceLimits,
} from './safe-command-plan-types'

const sandboxProfile = {
  networkAllowed: false,
  signedUrlsAllowed: false,
  rawPromptAllowed: false,
  arbitraryArgsAllowed: false,
  privateArtifactRefsOnly: true,
} as const

const validationPolicy = {
  rejectForbiddenFieldNames: true,
  rejectAbsoluteLocalPaths: true,
  rejectHttpUrls: true,
  rejectShellMetacharacters: true,
  requireArtifactRefs: true,
  requireStorageBucketPurposes: true,
  requireApprovedSnapshot: true,
} as const

function resourceLimits(input: {
  timeoutMs: number
  maxInputBytes?: number
  maxOutputBytes?: number
  maxFrames?: number
  maxDurationSeconds?: number
  gpuAllowed?: boolean
  writeAccess?: SafeCommandResourceLimits['writeAccess']
}): SafeCommandResourceLimits {
  return {
    timeoutMs: input.timeoutMs,
    maxInputBytes: input.maxInputBytes,
    maxOutputBytes: input.maxOutputBytes,
    maxFrames: input.maxFrames,
    maxDurationSeconds: input.maxDurationSeconds,
    gpuAllowed: input.gpuAllowed ?? false,
    networkAllowed: false,
    writeAccess: input.writeAccess ?? 'worker_temp_only',
    privateStorageOnly: true,
  }
}

function boolParam(parameterName: string, description: string, required = true): SafeCommandParameterDefinition {
  return {
    parameterName,
    valueType: 'boolean',
    required,
    description,
  }
}

function numberParam(
  parameterName: string,
  description: string,
  min: number,
  max: number,
  required = true,
): SafeCommandParameterDefinition {
  return {
    parameterName,
    valueType: 'number',
    required,
    min,
    max,
    description,
  }
}

function enumParam(
  parameterName: string,
  description: string,
  enumValues: readonly string[],
  required = true,
): SafeCommandParameterDefinition {
  return {
    parameterName,
    valueType: 'string_enum',
    required,
    enumValues,
    description,
  }
}

function policy(input: {
  commandIntentId: string
  toolId: ProductionToolId
  supportedOperationIds: readonly ToolCallingOperationId[]
  workerType: ProductionRegistryWorkerType
  parameters: readonly SafeCommandParameterDefinition[]
  defaults: Readonly<Record<string, SafeCommandParameterValue>>
  resourceLimits: SafeCommandResourceLimits
  intentNotes?: readonly string[]
}): CommandIntentPolicy {
  return {
    commandIntentId: input.commandIntentId,
    toolId: input.toolId,
    supportedOperationIds: input.supportedOperationIds,
    workerType: input.workerType,
    allowedParameterSchema: {
      schemaId: `${input.commandIntentId}_parameters_v1`,
      parameters: input.parameters,
      additionalParametersAllowed: false,
    },
    parameterDefaults: input.defaults,
    resourceLimits: input.resourceLimits,
    sandboxProfile,
    validationPolicy,
    intentNotes: input.intentNotes ?? [
      'Structured command intent only.',
      'Future translation requires approved worker code.',
    ],
  }
}

export const SAFE_COMMAND_INTENT_POLICIES = [
  policy({
    commandIntentId: 'ffprobe_metadata_inspect_plan',
    toolId: 'ffprobe',
    supportedOperationIds: ['media.inspect'],
    workerType: 'cpu_analysis_worker',
    parameters: [
      boolParam('inspectStreams', 'Include stream-level metadata.'),
      boolParam('inspectFormat', 'Include container-level metadata.'),
      boolParam('includeDuration', 'Include normalized duration evidence.'),
      boolParam('includeCodecs', 'Include codec evidence.'),
    ],
    defaults: {
      inspectStreams: true,
      inspectFormat: true,
      includeDuration: true,
      includeCodecs: true,
    },
    resourceLimits: resourceLimits({ timeoutMs: 15_000, maxInputBytes: 4_000_000_000, writeAccess: 'none' }),
  }),
  policy({
    commandIntentId: 'ffmpeg_proxy_create_plan',
    toolId: 'ffmpeg',
    supportedOperationIds: ['media.proxy.create'],
    workerType: 'render_worker',
    parameters: [
      numberParam('targetWidth', 'Maximum proxy width.', 320, 3840),
      numberParam('targetHeight', 'Maximum proxy height.', 180, 2160),
      numberParam('targetFps', 'Proxy frame rate target.', 12, 60),
      enumParam('videoCodecProfile', 'Video profile class.', ['h264_preview', 'h264_fast_proxy']),
      enumParam('audioProfile', 'Audio profile class.', ['aac_preview', 'source_passthrough']),
    ],
    defaults: {
      targetWidth: 1280,
      targetHeight: 720,
      targetFps: 30,
      videoCodecProfile: 'h264_preview',
      audioProfile: 'aac_preview',
    },
    resourceLimits: resourceLimits({ timeoutMs: 120_000, maxInputBytes: 8_000_000_000, maxDurationSeconds: 7200 }),
  }),
  policy({
    commandIntentId: 'ffmpeg_audio_extract_plan',
    toolId: 'ffmpeg',
    supportedOperationIds: ['media.audio.extract'],
    workerType: 'render_worker',
    parameters: [
      numberParam('sampleRate', 'Audio sample rate target.', 8000, 48000),
      enumParam('channelMode', 'Audio channel strategy.', ['mono', 'stereo']),
      enumParam('audioFormat', 'Structured audio artifact format.', ['wav_pcm', 'aac_preview']),
    ],
    defaults: {
      sampleRate: 16000,
      channelMode: 'mono',
      audioFormat: 'wav_pcm',
    },
    resourceLimits: resourceLimits({ timeoutMs: 60_000, maxInputBytes: 8_000_000_000, maxDurationSeconds: 7200 }),
  }),
  policy({
    commandIntentId: 'pyscenedetect_scene_detect_plan',
    toolId: 'pyscenedetect',
    supportedOperationIds: ['video.scene.detect'],
    workerType: 'cpu_analysis_worker',
    parameters: [
      enumParam('detectionMode', 'Scene detection strategy.', ['content', 'adaptive']),
      enumParam('thresholdPreset', 'Threshold preset.', ['conservative', 'balanced', 'sensitive']),
      numberParam('minSceneDurationMs', 'Minimum scene duration.', 100, 10000),
    ],
    defaults: {
      detectionMode: 'adaptive',
      thresholdPreset: 'balanced',
      minSceneDurationMs: 400,
    },
    resourceLimits: resourceLimits({ timeoutMs: 90_000, maxFrames: 60_000, maxDurationSeconds: 7200 }),
  }),
  policy({
    commandIntentId: 'pyscenedetect_smart_cut_plan',
    toolId: 'pyscenedetect',
    supportedOperationIds: ['timeline.smart_cut'],
    workerType: 'cpu_analysis_worker',
    parameters: [
      enumParam('pacingMode', 'Smart-cut pacing intent.', ['steady', 'social_short', 'high_energy']),
      numberParam('minSegmentMs', 'Minimum kept segment duration.', 250, 10000),
      numberParam('maxSegmentMs', 'Maximum kept segment duration.', 500, 120000),
    ],
    defaults: {
      pacingMode: 'social_short',
      minSegmentMs: 800,
      maxSegmentMs: 12000,
    },
    resourceLimits: resourceLimits({ timeoutMs: 90_000, maxFrames: 60_000, maxDurationSeconds: 7200 }),
  }),
  policy({
    commandIntentId: 'opencv_frame_analysis_plan',
    toolId: 'opencv',
    supportedOperationIds: ['video.frame.sample', 'video.blur.score'],
    workerType: 'cpu_analysis_worker',
    parameters: [
      enumParam('sampleStrategy', 'Frame sample strategy.', ['representative', 'interval', 'scene_boundary']),
      numberParam('maxFrames', 'Maximum sampled frame count.', 1, 240),
      boolParam('includeBlurScore', 'Include blur evidence.'),
      boolParam('includeMotionScore', 'Include motion evidence.'),
    ],
    defaults: {
      sampleStrategy: 'representative',
      maxFrames: 12,
      includeBlurScore: true,
      includeMotionScore: false,
    },
    resourceLimits: resourceLimits({ timeoutMs: 45_000, maxFrames: 240, maxDurationSeconds: 7200 }),
  }),
  policy({
    commandIntentId: 'opencv_safe_zone_plan',
    toolId: 'opencv',
    supportedOperationIds: ['video.safe_zone.detect'],
    workerType: 'cpu_analysis_worker',
    parameters: [
      enumParam('targetAspectRatio', 'Target output aspect ratio.', ['9:16', '1:1', '16:9']),
      enumParam('captionSafeZonePreset', 'Caption safe-zone preset.', ['lower_third', 'center_caption', 'platform_default']),
      boolParam('includeTextOverlapCheck', 'Include text overlap evidence.'),
    ],
    defaults: {
      targetAspectRatio: '9:16',
      captionSafeZonePreset: 'platform_default',
      includeTextOverlapCheck: true,
    },
    resourceLimits: resourceLimits({ timeoutMs: 45_000, maxFrames: 240, maxDurationSeconds: 7200 }),
  }),
  policy({
    commandIntentId: 'faster_whisper_transcript_plan',
    toolId: 'faster_whisper',
    supportedOperationIds: ['audio.transcribe'],
    workerType: 'gpu_ai_worker',
    parameters: [
      enumParam('languageMode', 'Language selection mode.', ['auto', 'provided']),
      boolParam('timestamps', 'Include segment timestamps.'),
      boolParam('wordTimestamps', 'Include word timestamps.'),
    ],
    defaults: {
      languageMode: 'auto',
      timestamps: true,
      wordTimestamps: true,
    },
    resourceLimits: resourceLimits({ timeoutMs: 180_000, maxInputBytes: 2_000_000_000, maxDurationSeconds: 7200, gpuAllowed: true }),
  }),
  policy({
    commandIntentId: 'faster_whisper_word_align_plan',
    toolId: 'faster_whisper',
    supportedOperationIds: ['audio.word_align'],
    workerType: 'gpu_ai_worker',
    parameters: [
      enumParam('alignmentGranularity', 'Alignment granularity.', ['word', 'phrase']),
      numberParam('maxGapMs', 'Maximum merge gap.', 0, 5000),
      boolParam('preserveTranscriptText', 'Preserve transcript text values.'),
    ],
    defaults: {
      alignmentGranularity: 'word',
      maxGapMs: 700,
      preserveTranscriptText: true,
    },
    resourceLimits: resourceLimits({ timeoutMs: 180_000, maxInputBytes: 2_000_000_000, maxDurationSeconds: 7200, gpuAllowed: true }),
  }),
  policy({
    commandIntentId: 'libass_caption_segment_plan',
    toolId: 'libass',
    supportedOperationIds: ['caption.generate', 'caption.align'],
    workerType: 'render_worker',
    parameters: [
      enumParam('captionFormat', 'Caption segment representation.', ['ass_events', 'json_segments']),
      numberParam('maxCharsPerLine', 'Maximum caption characters per line.', 10, 64),
      numberParam('lineCount', 'Target caption line count.', 1, 3),
    ],
    defaults: {
      captionFormat: 'json_segments',
      maxCharsPerLine: 32,
      lineCount: 2,
    },
    resourceLimits: resourceLimits({ timeoutMs: 30_000, maxInputBytes: 128_000_000, maxOutputBytes: 128_000_000 }),
  }),
  policy({
    commandIntentId: 'libass_caption_burnin_plan',
    toolId: 'libass',
    supportedOperationIds: ['caption.burn_in'],
    workerType: 'render_worker',
    parameters: [
      enumParam('captionFormat', 'Caption burn-in representation.', ['ass_events']),
      enumParam('stylePreset', 'Caption visual style preset.', ['readable_default', 'high_contrast', 'brand_safe']),
      numberParam('targetWidth', 'Target render width.', 320, 3840),
      numberParam('targetHeight', 'Target render height.', 180, 2160),
    ],
    defaults: {
      captionFormat: 'ass_events',
      stylePreset: 'readable_default',
      targetWidth: 1080,
      targetHeight: 1920,
    },
    resourceLimits: resourceLimits({ timeoutMs: 120_000, maxInputBytes: 8_000_000_000, maxDurationSeconds: 7200 }),
  }),
  policy({
    commandIntentId: 'remotion_caption_style_plan',
    toolId: 'remotion',
    supportedOperationIds: ['caption.style'],
    workerType: 'render_worker',
    parameters: [
      enumParam('templatePreset', 'Caption template preset.', ['minimal', 'creator_caption', 'brand_safe']),
      enumParam('safeZonePreset', 'Safe-zone preset.', ['platform_default', 'lower_third', 'center_caption']),
      numberParam('fps', 'Preview frame rate.', 12, 60),
    ],
    defaults: {
      templatePreset: 'creator_caption',
      safeZonePreset: 'platform_default',
      fps: 30,
    },
    resourceLimits: resourceLimits({ timeoutMs: 45_000, maxOutputBytes: 256_000_000 }),
  }),
  policy({
    commandIntentId: 'remotion_preview_render_plan',
    toolId: 'remotion',
    supportedOperationIds: ['render.preview'],
    workerType: 'render_worker',
    parameters: [
      enumParam('renderMode', 'Render intent mode.', ['preview', 'qa_probe']),
      numberParam('fps', 'Preview frame rate.', 12, 60),
      numberParam('width', 'Preview width.', 320, 3840),
      numberParam('height', 'Preview height.', 180, 2160),
    ],
    defaults: {
      renderMode: 'preview',
      fps: 30,
      width: 1080,
      height: 1920,
    },
    resourceLimits: resourceLimits({ timeoutMs: 180_000, maxOutputBytes: 2_000_000_000, maxDurationSeconds: 900 }),
  }),
  policy({
    commandIntentId: 'remotion_compose_render_plan',
    toolId: 'remotion',
    supportedOperationIds: ['render.compose'],
    workerType: 'render_worker',
    parameters: [
      enumParam('compositionMode', 'Composition mode.', ['preview_composite', 'final_ready_manifest']),
      numberParam('fps', 'Composition frame rate.', 12, 60),
      numberParam('width', 'Composition width.', 320, 3840),
      numberParam('height', 'Composition height.', 180, 2160),
    ],
    defaults: {
      compositionMode: 'final_ready_manifest',
      fps: 30,
      width: 1080,
      height: 1920,
    },
    resourceLimits: resourceLimits({ timeoutMs: 240_000, maxOutputBytes: 4_000_000_000, maxDurationSeconds: 7200 }),
  }),
  policy({
    commandIntentId: 'opentimelineio_validate_plan',
    toolId: 'opentimelineio',
    supportedOperationIds: ['timeline.validate'],
    workerType: 'cpu_analysis_worker',
    parameters: [
      enumParam('timelineFormat', 'Timeline representation.', ['reeditpro_manifest', 'otio_json']),
      boolParam('validateTracks', 'Validate track structure.'),
      boolParam('validateRanges', 'Validate ranges and durations.'),
    ],
    defaults: {
      timelineFormat: 'reeditpro_manifest',
      validateTracks: true,
      validateRanges: true,
    },
    resourceLimits: resourceLimits({ timeoutMs: 30_000, maxInputBytes: 128_000_000, maxOutputBytes: 128_000_000 }),
  }),
  policy({
    commandIntentId: 'opentimelineio_convert_plan',
    toolId: 'opentimelineio',
    supportedOperationIds: ['timeline.to_otio'],
    workerType: 'cpu_analysis_worker',
    parameters: [
      enumParam('sourceFormat', 'Source timeline format.', ['reeditpro_manifest']),
      enumParam('targetFormat', 'Target timeline format.', ['otio_json']),
      boolParam('preserveMarkers', 'Preserve timeline markers.'),
    ],
    defaults: {
      sourceFormat: 'reeditpro_manifest',
      targetFormat: 'otio_json',
      preserveMarkers: true,
    },
    resourceLimits: resourceLimits({ timeoutMs: 30_000, maxInputBytes: 128_000_000, maxOutputBytes: 128_000_000 }),
  }),
  policy({
    commandIntentId: 'ffmpeg_loudness_normalize_plan',
    toolId: 'ffmpeg',
    supportedOperationIds: ['audio.loudness.normalize'],
    workerType: 'render_worker',
    parameters: [
      numberParam('targetLufs', 'Target loudness.', -24, -8),
      numberParam('truePeakDb', 'True peak ceiling.', -6, 0),
      boolParam('preserveSync', 'Preserve source sync.'),
    ],
    defaults: {
      targetLufs: -16,
      truePeakDb: -1,
      preserveSync: true,
    },
    resourceLimits: resourceLimits({ timeoutMs: 90_000, maxInputBytes: 4_000_000_000, maxDurationSeconds: 7200 }),
  }),
  policy({
    commandIntentId: 'ffmpeg_export_mux_plan',
    toolId: 'ffmpeg',
    supportedOperationIds: ['export.mux'],
    workerType: 'render_worker',
    parameters: [
      enumParam('containerFormat', 'Delivery container format.', ['mp4']),
      enumParam('videoProfile', 'Video delivery profile.', ['h264_delivery', 'h265_delivery']),
      enumParam('audioProfile', 'Audio delivery profile.', ['aac_delivery']),
    ],
    defaults: {
      containerFormat: 'mp4',
      videoProfile: 'h264_delivery',
      audioProfile: 'aac_delivery',
    },
    resourceLimits: resourceLimits({ timeoutMs: 240_000, maxInputBytes: 8_000_000_000, maxOutputBytes: 8_000_000_000, maxDurationSeconds: 7200 }),
  }),
  policy({
    commandIntentId: 'ffmpeg_export_validate_plan',
    toolId: 'ffmpeg',
    supportedOperationIds: ['export.validate'],
    workerType: 'render_worker',
    parameters: [
      boolParam('inspectStreams', 'Inspect stream compatibility.'),
      boolParam('includeDuration', 'Include duration validation.'),
      boolParam('includeCodecs', 'Include codec validation.'),
      boolParam('requireAudioSync', 'Require audio sync evidence.'),
    ],
    defaults: {
      inspectStreams: true,
      includeDuration: true,
      includeCodecs: true,
      requireAudioSync: true,
    },
    resourceLimits: resourceLimits({ timeoutMs: 45_000, maxInputBytes: 8_000_000_000, writeAccess: 'none' }),
  }),
  policy({
    commandIntentId: 'ffmpeg_final_delivery_qa_plan',
    toolId: 'ffmpeg',
    supportedOperationIds: ['qa.final_delivery'],
    workerType: 'render_worker',
    parameters: [
      enumParam('deliveryProfile', 'Delivery profile class.', ['social_short', 'web_delivery', 'archive_master']),
      boolParam('requireCodecCheck', 'Require codec check.'),
      boolParam('requireDurationCheck', 'Require duration check.'),
    ],
    defaults: {
      deliveryProfile: 'social_short',
      requireCodecCheck: true,
      requireDurationCheck: true,
    },
    resourceLimits: resourceLimits({ timeoutMs: 45_000, maxInputBytes: 8_000_000_000, writeAccess: 'none' }),
  }),
  policy({
    commandIntentId: 'pyav_frame_sample_plan',
    toolId: 'pyav',
    supportedOperationIds: ['video.frame.sample'],
    workerType: 'cpu_analysis_worker',
    parameters: [
      enumParam('sampleStrategy', 'Frame sample strategy.', ['representative', 'interval']),
      numberParam('maxFrames', 'Maximum sampled frame count.', 1, 240),
      boolParam('includeFrameMetadata', 'Include frame metadata.'),
    ],
    defaults: {
      sampleStrategy: 'representative',
      maxFrames: 12,
      includeFrameMetadata: true,
    },
    resourceLimits: resourceLimits({ timeoutMs: 45_000, maxFrames: 240, maxDurationSeconds: 7200 }),
  }),
  policy({
    commandIntentId: 'sharp_thumbnail_asset_plan',
    toolId: 'sharp',
    supportedOperationIds: ['thumbnail.generate'],
    workerType: 'render_worker',
    parameters: [
      numberParam('targetWidth', 'Thumbnail width.', 64, 4096),
      numberParam('targetHeight', 'Thumbnail height.', 64, 4096),
      enumParam('fitMode', 'Thumbnail fit mode.', ['cover', 'contain']),
    ],
    defaults: {
      targetWidth: 1280,
      targetHeight: 720,
      fitMode: 'cover',
    },
    resourceLimits: resourceLimits({ timeoutMs: 30_000, maxInputBytes: 512_000_000, maxOutputBytes: 128_000_000 }),
  }),
  policy({
    commandIntentId: 'paddleocr_text_region_plan',
    toolId: 'paddleocr',
    supportedOperationIds: ['ocr.detect_text'],
    workerType: 'cpu_analysis_worker',
    parameters: [
      enumParam('languageHint', 'OCR language hint.', ['auto', 'english']),
      boolParam('detectOrientation', 'Detect text orientation.'),
      numberParam('maxRegions', 'Maximum text regions.', 1, 500),
    ],
    defaults: {
      languageHint: 'auto',
      detectOrientation: true,
      maxRegions: 100,
    },
    resourceLimits: resourceLimits({ timeoutMs: 60_000, maxFrames: 120, maxInputBytes: 512_000_000 }),
  }),
  policy({
    commandIntentId: 'deepfilternet_audio_cleanup_plan',
    toolId: 'deepfilternet',
    supportedOperationIds: ['audio.cleanup'],
    workerType: 'gpu_ai_worker',
    parameters: [
      enumParam('noiseReductionPreset', 'Noise reduction preset.', ['light', 'balanced', 'strong']),
      boolParam('preserveVoice', 'Preserve speech character.'),
      numberParam('sampleRate', 'Audio sample rate target.', 8000, 48000),
    ],
    defaults: {
      noiseReductionPreset: 'balanced',
      preserveVoice: true,
      sampleRate: 48000,
    },
    resourceLimits: resourceLimits({ timeoutMs: 180_000, maxInputBytes: 2_000_000_000, maxDurationSeconds: 7200, gpuAllowed: true }),
  }),
  policy({
    commandIntentId: 'birefnet_mask_generate_plan',
    toolId: 'birefnet',
    supportedOperationIds: ['mask.generate', 'background.remove'],
    workerType: 'gpu_ai_worker',
    parameters: [
      enumParam('subjectMode', 'Subject selection mode.', ['primary_subject', 'foreground']),
      enumParam('edgeRefinementPreset', 'Edge refinement preset.', ['balanced', 'fine_detail']),
      boolParam('includeAlphaPreview', 'Include alpha preview expectation.'),
    ],
    defaults: {
      subjectMode: 'primary_subject',
      edgeRefinementPreset: 'balanced',
      includeAlphaPreview: true,
    },
    resourceLimits: resourceLimits({ timeoutMs: 180_000, maxFrames: 240, maxInputBytes: 4_000_000_000, gpuAllowed: true }),
  }),
  policy({
    commandIntentId: 'sam2_mask_track_plan',
    toolId: 'sam2',
    supportedOperationIds: ['mask.generate', 'mask.refine'],
    workerType: 'gpu_ai_worker',
    parameters: [
      enumParam('trackingMode', 'Mask tracking mode.', ['single_subject', 'multi_subject']),
      numberParam('maxTrackedObjects', 'Maximum tracked objects.', 1, 12),
      boolParam('temporalSmoothing', 'Apply temporal smoothing.'),
    ],
    defaults: {
      trackingMode: 'single_subject',
      maxTrackedObjects: 1,
      temporalSmoothing: true,
    },
    resourceLimits: resourceLimits({ timeoutMs: 240_000, maxFrames: 1200, maxInputBytes: 4_000_000_000, gpuAllowed: true }),
  }),
  policy({
    commandIntentId: 'real_esrgan_enhance_plan',
    toolId: 'real_esrgan',
    supportedOperationIds: ['video.enhance'],
    workerType: 'gpu_ai_worker',
    parameters: [
      numberParam('scaleFactor', 'Enhancement scale factor.', 1, 4),
      enumParam('enhancementPreset', 'Enhancement preset.', ['balanced', 'detail_preserve']),
      boolParam('limitArtifacts', 'Limit enhancement artifacts.'),
    ],
    defaults: {
      scaleFactor: 2,
      enhancementPreset: 'balanced',
      limitArtifacts: true,
    },
    resourceLimits: resourceLimits({ timeoutMs: 240_000, maxFrames: 1200, maxInputBytes: 4_000_000_000, gpuAllowed: true }),
  }),
  policy({
    commandIntentId: 'film_slow_motion_plan',
    toolId: 'film',
    supportedOperationIds: ['video.slow_motion'],
    workerType: 'gpu_ai_worker',
    parameters: [
      numberParam('interpolationFactor', 'Slow-motion interpolation factor.', 2, 8),
      enumParam('motionSafetyPreset', 'Motion safety preset.', ['balanced', 'artifact_guarded']),
      boolParam('includeArtifactQa', 'Include artifact QA expectation.'),
    ],
    defaults: {
      interpolationFactor: 2,
      motionSafetyPreset: 'artifact_guarded',
      includeArtifactQa: true,
    },
    resourceLimits: resourceLimits({ timeoutMs: 240_000, maxFrames: 1200, maxInputBytes: 4_000_000_000, gpuAllowed: true }),
  }),
  policy({
    commandIntentId: 'opencolorio_color_plan',
    toolId: 'opencolorio',
    supportedOperationIds: ['color.exposure.correct', 'color.shot_match'],
    workerType: 'cpu_analysis_worker',
    parameters: [
      enumParam('colorSpaceIn', 'Input color space.', ['source_declared', 'rec709']),
      enumParam('colorSpaceOut', 'Output color space.', ['rec709', 'display_p3']),
      enumParam('lutIntent', 'LUT intent.', ['normalize', 'match_reference']),
    ],
    defaults: {
      colorSpaceIn: 'source_declared',
      colorSpaceOut: 'rec709',
      lutIntent: 'normalize',
    },
    resourceLimits: resourceLimits({ timeoutMs: 60_000, maxFrames: 240, maxInputBytes: 4_000_000_000 }),
  }),
  policy({
    commandIntentId: 'openimageio_color_image_plan',
    toolId: 'openimageio',
    supportedOperationIds: ['color.exposure.correct'],
    workerType: 'cpu_analysis_worker',
    parameters: [
      enumParam('colorSpaceIn', 'Input color space.', ['source_declared', 'rec709']),
      enumParam('colorSpaceOut', 'Output color space.', ['rec709', 'display_p3']),
      boolParam('imageSequenceMode', 'Treat frames as image sequence.'),
    ],
    defaults: {
      colorSpaceIn: 'source_declared',
      colorSpaceOut: 'rec709',
      imageSequenceMode: true,
    },
    resourceLimits: resourceLimits({ timeoutMs: 60_000, maxFrames: 240, maxInputBytes: 4_000_000_000 }),
  }),
  policy({
    commandIntentId: 'ffprobe_export_validate_plan',
    toolId: 'ffprobe',
    supportedOperationIds: ['export.validate'],
    workerType: 'cpu_analysis_worker',
    parameters: [
      boolParam('inspectStreams', 'Inspect output streams.'),
      boolParam('inspectFormat', 'Inspect output container.'),
      boolParam('includeDuration', 'Include duration evidence.'),
    ],
    defaults: {
      inspectStreams: true,
      inspectFormat: true,
      includeDuration: true,
    },
    resourceLimits: resourceLimits({ timeoutMs: 30_000, maxInputBytes: 8_000_000_000, writeAccess: 'none' }),
  }),
] as const satisfies readonly CommandIntentPolicy[]

export function listCommandIntentPolicies(): CommandIntentPolicy[] {
  return [...SAFE_COMMAND_INTENT_POLICIES]
}

export function getCommandIntentPolicy(commandIntentId: string): CommandIntentPolicy | undefined {
  return SAFE_COMMAND_INTENT_POLICIES.find((intentPolicy) => intentPolicy.commandIntentId === commandIntentId)
}

export function findCommandIntentPolicyForToolOperation(
  toolId: ProductionToolId | string,
  operationId: ToolCallingOperationId | string,
): CommandIntentPolicy | undefined {
  return SAFE_COMMAND_INTENT_POLICIES.find((intentPolicy) =>
    intentPolicy.toolId === toolId &&
    intentPolicy.supportedOperationIds.includes(operationId as ToolCallingOperationId),
  )
}
