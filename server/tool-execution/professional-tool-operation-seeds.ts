import type { ProductionToolId } from '../tool-registry/production-tool-types'
import type {
  ProfessionalToolOperationEntrypointKind,
  ProfessionalToolOperationNetworkMode,
  ProfessionalToolOperationSettingConstraint,
  ProfessionalToolOperationSettingsSchema,
} from './professional-tool-operation-spec-types'

export type ProfessionalToolOperationResourceClass =
  | 'render_2d'
  | 'render_3d'
  | 'runtime_readiness'
  | 'gpu_image'
  | 'gpu_video'
  | 'gpu_audio'
  | 'cpu_audio_analysis'
  | 'cpu_audio_process'
  | 'cpu_media_analysis'
  | 'cpu_image_process'
  | 'browser_capture'
  | 'render_binary_validation'

export interface ProfessionalToolOperationSeed {
  canonicalToolId: ProductionToolId
  operationName: string
  aliases: readonly string[]
  settingsSchema: ProfessionalToolOperationSettingsSchema
  resourceClass: ProfessionalToolOperationResourceClass
  networkMode?: ProfessionalToolOperationNetworkMode
  captureAuthorizationRequired?: boolean
  entrypoint: {
    kind: ProfessionalToolOperationEntrypointKind
    packageName: string
    importName?: string
    callableSymbol?: string
    commandName?: string
  }
}

const opaqueId = stringConstraint({
  minLength: 8,
  maxLength: 96,
  pattern: '^[A-Za-z][A-Za-z0-9_-]{7,95}$',
})

const chartSettings = strictSettings({
  width: integerConstraint(320, 3840),
  height: integerConstraint(180, 2160),
  themeProfileId: opaqueId,
  animationDurationMs: integerConstraint(0, 30_000),
  maximumLabelCount: integerConstraint(1, 500),
}, ['width', 'height', 'themeProfileId'])

const cardSettings = strictSettings({
  width: integerConstraint(320, 3840),
  height: integerConstraint(180, 2160),
  themeProfileId: opaqueId,
  fontProfileId: opaqueId,
  maximumTextItems: integerConstraint(1, 100),
}, ['width', 'height', 'themeProfileId', 'fontProfileId'])

const vectorSettings = strictSettings({
  width: integerConstraint(320, 3840),
  height: integerConstraint(180, 2160),
  fps: integerConstraint(12, 60),
  durationFrames: integerConstraint(1, 18_000),
  motionProfileId: opaqueId,
  backgroundMode: enumConstraint(['opaque_panel', 'transparent_overlay']),
}, ['width', 'height', 'fps', 'durationFrames', 'motionProfileId', 'backgroundMode'])

const threeDSettings = strictSettings({
  width: integerConstraint(320, 3840),
  height: integerConstraint(180, 2160),
  fps: integerConstraint(12, 60),
  durationFrames: integerConstraint(1, 9_000),
  sceneProfileId: opaqueId,
  cameraProfileId: opaqueId,
  lightingProfileId: opaqueId,
}, ['width', 'height', 'fps', 'durationFrames', 'sceneProfileId', 'cameraProfileId'])

const maskSettings = strictSettings({
  confidenceThreshold: numberConstraint(0, 1),
  maximumSubjects: integerConstraint(1, 16),
  frameStride: integerConstraint(1, 30),
  edgeRefinementProfileId: opaqueId,
  preserveContactObjects: booleanConstraint(),
}, ['confidenceThreshold', 'maximumSubjects', 'frameStride', 'preserveContactObjects'])

const imageBackgroundSettings = strictSettings({
  confidenceThreshold: numberConstraint(0, 1),
  alphaMatteMode: enumConstraint(['straight', 'premultiplied']),
  edgeRefinementProfileId: opaqueId,
  maximumSubjects: integerConstraint(1, 8),
}, ['confidenceThreshold', 'alphaMatteMode', 'maximumSubjects'])

const audioAnalysisSettings = strictSettings({
  sampleRate: integerEnumConstraint([16_000, 22_050, 44_100, 48_000]),
  channelMode: enumConstraint(['mono', 'stereo', 'preserve']),
  analysisProfileId: opaqueId,
  confidenceThreshold: numberConstraint(0, 1),
}, ['sampleRate', 'channelMode', 'analysisProfileId'])

const audioProcessSettings = strictSettings({
  sampleRate: integerEnumConstraint([16_000, 22_050, 44_100, 48_000]),
  channelMode: enumConstraint(['mono', 'stereo', 'preserve']),
  processingProfileId: opaqueId,
  strength: numberConstraint(0, 1),
  preserveVoice: booleanConstraint(true),
}, ['sampleRate', 'channelMode', 'processingProfileId', 'strength', 'preserveVoice'])

const loudnessSettings = strictSettings({
  targetLufs: numberConstraint(-24, -9),
  truePeakDbtp: numberConstraint(-6, -0.1),
  channelMode: enumConstraint(['mono', 'stereo', 'preserve']),
  measurementProfileId: opaqueId,
}, ['targetLufs', 'truePeakDbtp', 'channelMode', 'measurementProfileId'])

const midiSettings = strictSettings({
  timingResolutionPpq: integerConstraint(24, 9_600),
  tempoPolicy: enumConstraint(['preserve', 'approved_map']),
  timingProfileId: opaqueId,
}, ['timingResolutionPpq', 'tempoPolicy', 'timingProfileId'])

const audioDecodeSettings = strictSettings({
  decodeProfileId: opaqueId,
  maximumChannels: integerConstraint(1, 8),
  maximumSampleRate: integerConstraint(8_000, 192_000),
}, ['decodeProfileId', 'maximumChannels', 'maximumSampleRate'])

const browserCaptureSettings = strictSettings({
  captureSourceKind: enumConstraint(['approved_internal_html_v1']),
  captureTemplateId: enumConstraint(['reeditpro_private_capture_card_v1']),
  captureAuthorizationConfirmed: booleanConstraint(true),
  viewportWidth: integerEnumConstraint([640]),
  viewportHeight: integerEnumConstraint([360]),
  deviceScaleFactor: numberEnumConstraint([1]),
}, [
  'captureSourceKind',
  'captureTemplateId',
  'captureAuthorizationConfirmed',
  'viewportWidth',
  'viewportHeight',
  'deviceScaleFactor',
])

const sceneSettings = strictSettings({
  detectorProfileId: opaqueId,
  contentThreshold: numberConstraint(0, 100),
  minimumSceneFrames: integerConstraint(1, 3_600),
  downscaleFactor: integerConstraint(1, 8),
}, ['detectorProfileId', 'contentThreshold', 'minimumSceneFrames', 'downscaleFactor'])

const colorSettings = strictSettings({
  transformProfileId: opaqueId,
  inputColorSpace: enumConstraint(['srgb', 'rec709', 'display_p3', 'approved_source_profile']),
  outputColorSpace: enumConstraint(['rec709', 'srgb']),
  strength: numberConstraint(0, 1),
  preserveSkinTone: booleanConstraint(true),
}, ['transformProfileId', 'inputColorSpace', 'outputColorSpace', 'strength', 'preserveSkinTone'])

const imagePipelineSettings = strictSettings({
  transformProfileId: opaqueId,
  outputFormat: enumConstraint(['png', 'jpeg', 'webp', 'exr']),
  outputWidth: integerConstraint(1, 8_192),
  outputHeight: integerConstraint(1, 8_192),
  preserveMetadata: booleanConstraint(false),
}, ['transformProfileId', 'outputFormat', 'outputWidth', 'outputHeight', 'preserveMetadata'])

const packagingSettings = strictSettings({
  validationProfileId: opaqueId,
  expectedContainer: enumConstraint(['mp4', 'mkv']),
  requireAudioVideoSync: booleanConstraint(true),
  requireCaptionIntegrity: booleanConstraint(),
}, ['validationProfileId', 'expectedContainer', 'requireAudioVideoSync', 'requireCaptionIntegrity'])

export const PROFESSIONAL_TOOL_OPERATION_SEEDS = [
  nodeSeed('d3', 'render_chart_or_diagram', ['d3.js'], chartSettings, 'render_2d', 'd3', 'd3', 'create'),
  nodeSeed('echarts', 'render_standard_chart', ['apache_echarts'], chartSettings, 'render_2d', 'echarts', 'echarts', 'init'),
  nodeSeed('vega_lite', 'compile_declarative_chart', ['vega-lite', 'vegalite'], chartSettings, 'render_2d', 'vega-lite', 'vega-lite', 'compile'),
  nodeSeed('vega', 'render_vega_spec', ['vega.js'], chartSettings, 'render_2d', 'vega', 'vega', 'parse'),
  nodeSeed('satori', 'render_svg_text_card', [], cardSettings, 'render_2d', 'satori', 'satori', 'default'),
  nodeSeed('svg_js', 'render_svg_overlay', ['svg.js', '@svgdotjs/svg.js'], cardSettings, 'render_2d', '@svgdotjs/svg.js', '@svgdotjs/svg.js', 'SVG'),
  nodeSeed('viz_js', 'render_dot_diagram', ['viz.js', '@viz-js/viz'], chartSettings, 'render_2d', '@viz-js/viz', '@viz-js/viz', 'instance'),
  nodeSeed('lottie', 'render_lottie_motion', ['lottie_web', 'lottie-web', 'bodymovin'], vectorSettings, 'render_2d', 'lottie-web', 'lottie-web', 'loadAnimation'),
  nodeSeed('animejs', 'render_motion_timeline', ['anime.js'], vectorSettings, 'render_2d', 'animejs', 'animejs', 'animate'),
  nodeSeed('three_js', 'render_three_scene', ['three', 'three.js', 'threejs'], threeDSettings, 'render_3d', 'three', 'three', 'WebGLRenderer.render'),
  nodeSeed('pixijs', 'render_pixi_scene', ['pixi_js', 'pixi.js', 'pixi'], vectorSettings, 'render_2d', 'pixi.js', 'pixi.js', 'Application.init'),
  nodeSeed('konva', 'render_canvas_overlay', ['konva.js'], cardSettings, 'render_2d', 'konva', 'konva', 'Stage.toDataURL'),
  nodeSeed('babylon_js', 'render_babylon_scene', ['babylonjs', 'babylon.js', '@babylonjs/core'], threeDSettings, 'render_3d', '@babylonjs/core', '@babylonjs/core', 'Engine.runRenderLoop'),
  pythonSeed('rembg', 'remove_image_background', ['remove_background'], imageBackgroundSettings, 'gpu_image', 'rembg', 'rembg', 'remove'),
  pythonSeed('kornia', 'refine_mask', [], maskSettings, 'gpu_video', 'kornia', 'kornia', 'morphology'),
  pythonSeed('librosa', 'analyze_audio_features', [], audioAnalysisSettings, 'cpu_audio_analysis', 'librosa', 'librosa', 'feature'),
  pythonSeed('audioread', 'verify_audio_decode', [], audioDecodeSettings, 'cpu_audio_analysis', 'audioread', 'audioread', 'audio_open'),
  pythonSeed('pydub', 'process_audio_segments', [], audioProcessSettings, 'cpu_audio_process', 'pydub', 'pydub', 'AudioSegment'),
  pythonSeed('scipy', 'analyze_signal', ['scipy_signal'], audioAnalysisSettings, 'cpu_audio_analysis', 'scipy', 'scipy', 'signal'),
  pythonSeed('resampy', 'resample_audio', [], audioProcessSettings, 'cpu_audio_process', 'resampy', 'resampy', 'resample'),
  pythonSeed('pyloudnorm', 'measure_loudness', ['py_loud_norm'], loudnessSettings, 'cpu_audio_analysis', 'pyloudnorm', 'pyloudnorm', 'Meter.integrated_loudness'),
  pythonSeed('audioflux', 'analyze_beat_and_energy', ['audio_flux'], audioAnalysisSettings, 'cpu_audio_analysis', 'audioflux', 'audioflux', 'BFT'),
  pythonSeed('music21', 'analyze_music_structure', ['music_21'], audioAnalysisSettings, 'cpu_audio_analysis', 'music21', 'music21', 'converter.parse'),
  pythonSeed('pretty_midi', 'analyze_midi_timing', ['pretty-midi'], midiSettings, 'cpu_audio_analysis', 'pretty_midi', 'pretty_midi', 'PrettyMIDI'),
  pythonSeed('mido', 'validate_midi_events', [], midiSettings, 'cpu_audio_analysis', 'mido', 'mido', 'MidiFile'),
  pythonSeed('noisereduce', 'reduce_noise', ['noise_reduce'], audioProcessSettings, 'cpu_audio_process', 'noisereduce', 'noisereduce', 'reduce_noise'),
  pythonSeed('pedalboard', 'apply_audio_effect_chain', ['spotify_pedalboard'], audioProcessSettings, 'cpu_audio_process', 'pedalboard', 'pedalboard', 'Pedalboard.__call__'),
  pythonSeed('mir_eval', 'score_music_timing', ['mir-eval'], audioAnalysisSettings, 'cpu_audio_analysis', 'mir_eval', 'mir_eval', 'beat.evaluate'),
  pythonSeed('pydub_effects', 'apply_approved_audio_recipe', ['pydub.effects'], audioProcessSettings, 'cpu_audio_process', 'pydub', 'pydub.effects', 'normalize'),
  pythonSeed('ebu_r128_pyloudnorm', 'measure_ebu_r128_loudness', ['ebu_r128', 'pyloudnorm_ebu_r128'], loudnessSettings, 'cpu_audio_analysis', 'pyloudnorm', 'pyloudnorm', 'Meter.integrated_loudness'),
  binarySeed('rnnoise', 'denoise_voice', ['rnnoise_demo'], audioProcessSettings, 'cpu_audio_process', 'rnnoise', 'rnnoise_demo'),
  pythonSeed('deepfilternet', 'enhance_voice', ['deep_filter_net', 'deep-filter-net'], audioProcessSettings, 'gpu_audio', 'deepfilternet', 'df', 'enhance.enhance'),
  nodeSeed('playwright', 'capture_authorized_internal_page', ['playwright_core', '@playwright/test'], browserCaptureSettings, 'browser_capture', 'playwright', 'playwright', 'chromium.launch', 'offline_required', true),
  pythonSeed('pyscenedetect', 'detect_scene_boundaries', ['py_scene_detect', 'scenedetect'], sceneSettings, 'cpu_media_analysis', 'scenedetect', 'scenedetect', 'detect'),
  pythonSeed('opencolorio', 'apply_color_transform', ['open_color_io', 'ocio'], colorSettings, 'cpu_media_analysis', 'opencolorio', 'PyOpenColorIO', 'Config.getProcessor'),
  pythonSeed('openimageio', 'process_image_sequence', ['open_image_io', 'oiio'], imagePipelineSettings, 'cpu_image_process', 'openimageio', 'OpenImageIO', 'ImageBufAlgo'),
  binarySeed('mkvtoolnix_container_validation', 'validate_mkv_container', ['mkvtoolnix', 'mkvmerge'], packagingSettings, 'render_binary_validation', 'mkvtoolnix', 'mkvmerge'),
  binarySeed('gpac_mp4box_packaging_validation', 'validate_mp4_package', ['gpac', 'mp4box'], packagingSettings, 'render_binary_validation', 'gpac', 'MP4Box'),
] as const satisfies readonly ProfessionalToolOperationSeed[]

function nodeSeed(
  canonicalToolId: ProductionToolId,
  operationName: string,
  aliases: readonly string[],
  settingsSchema: ProfessionalToolOperationSettingsSchema,
  resourceClass: ProfessionalToolOperationResourceClass,
  packageName: string,
  importName: string,
  callableSymbol: string,
  networkMode?: ProfessionalToolOperationNetworkMode,
  captureAuthorizationRequired?: boolean,
): ProfessionalToolOperationSeed {
  return {
    canonicalToolId,
    operationName,
    aliases,
    settingsSchema,
    resourceClass,
    networkMode,
    captureAuthorizationRequired,
    entrypoint: { kind: 'node_library', packageName, importName, callableSymbol },
  }
}

function pythonSeed(
  canonicalToolId: ProductionToolId,
  operationName: string,
  aliases: readonly string[],
  settingsSchema: ProfessionalToolOperationSettingsSchema,
  resourceClass: ProfessionalToolOperationResourceClass,
  packageName: string,
  importName: string,
  callableSymbol: string,
): ProfessionalToolOperationSeed {
  return {
    canonicalToolId,
    operationName,
    aliases,
    settingsSchema,
    resourceClass,
    entrypoint: { kind: 'python_library', packageName, importName, callableSymbol },
  }
}

function binarySeed(
  canonicalToolId: ProductionToolId,
  operationName: string,
  aliases: readonly string[],
  settingsSchema: ProfessionalToolOperationSettingsSchema,
  resourceClass: ProfessionalToolOperationResourceClass,
  packageName: string,
  commandName: string,
): ProfessionalToolOperationSeed {
  return {
    canonicalToolId,
    operationName,
    aliases,
    settingsSchema,
    resourceClass,
    entrypoint: { kind: 'fixed_binary', packageName, commandName },
  }
}

function strictSettings(
  properties: Readonly<Record<string, ProfessionalToolOperationSettingConstraint>>,
  required: readonly string[],
): ProfessionalToolOperationSettingsSchema {
  return {
    type: 'object',
    additionalProperties: false,
    maxProperties: Object.keys(properties).length,
    required,
    properties,
  }
}

function stringConstraint(
  input: Omit<Extract<ProfessionalToolOperationSettingConstraint, { type: 'string' }>, 'type'>,
): ProfessionalToolOperationSettingConstraint {
  return { type: 'string', ...input }
}

function enumConstraint(values: readonly string[]): ProfessionalToolOperationSettingConstraint {
  return { type: 'string', enum: values }
}

function numberConstraint(minimum: number, maximum: number): ProfessionalToolOperationSettingConstraint {
  return { type: 'number', minimum, maximum }
}

function integerConstraint(minimum: number, maximum: number): ProfessionalToolOperationSettingConstraint {
  return { type: 'integer', minimum, maximum }
}

function numberEnumConstraint(values: readonly number[]): ProfessionalToolOperationSettingConstraint {
  return { type: 'number', enum: values }
}

function integerEnumConstraint(values: readonly number[]): ProfessionalToolOperationSettingConstraint {
  return { type: 'integer', enum: values }
}

function booleanConstraint(constant?: boolean): ProfessionalToolOperationSettingConstraint {
  return { type: 'boolean', const: constant }
}
