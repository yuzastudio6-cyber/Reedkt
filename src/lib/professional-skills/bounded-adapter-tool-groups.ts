export const boundedDataVisualAdapterToolNames = [
  'd3',
  'echarts',
  'vega_lite',
  'vega',
  'satori',
  'svg_js',
  'viz_js',
] as const

export const boundedMotionAdapterToolNames = [
  'lottie_web',
  'animejs',
  'three',
  'pixi_js',
  'konva',
  'babylonjs',
] as const

// Runner foundations are evidence dependencies, not product tool adapters.
export const boundedModelFoundationAdapterToolNames = [] as const

export const boundedVisionModelAdapterToolNames = [
  'rembg',
  'kornia',
] as const

// Speech candidates do not have canonical private E2E operation evidence yet.
export const boundedSpeechModelAdapterToolNames = [] as const

export const boundedAudioMusicAdapterToolNames = [
  'librosa',
  'audioread',
  'pydub',
  'scipy',
  'resampy',
  'pyloudnorm',
  'audioflux',
  'music21',
  'pretty_midi',
  'mido',
  'noisereduce',
  'pedalboard',
  'mir_eval',
  'pydub_effects',
  'ebu_r128_pyloudnorm',
  'rnnoise',
] as const

export const boundedAudioCleanupModelAdapterToolNames = [
  'deepfilternet',
] as const

export const boundedMapBrowserColorSceneAdapterToolNames = [
  'playwright',
  'pyscenedetect',
  'opencolorio',
  'openimageio',
] as const

export const boundedRenderPackagingAdapterToolNames = [
  'mkvtoolnix_container_validation',
  'gpac_mp4box_packaging_validation',
] as const

export const boundedVisualMotionAdapterToolNames = [
  ...boundedDataVisualAdapterToolNames,
  ...boundedMotionAdapterToolNames,
] as const

export const boundedVisualMotionVisionAdapterToolNames = [
  ...boundedVisualMotionAdapterToolNames,
  ...boundedVisionModelAdapterToolNames,
] as const

export const boundedVisualMotionModelAdapterToolNames = [
  ...boundedVisualMotionVisionAdapterToolNames,
  ...boundedModelFoundationAdapterToolNames,
] as const

export const boundedInternalAdapterToolNames = [
  ...boundedVisualMotionAdapterToolNames,
  ...boundedModelFoundationAdapterToolNames,
  ...boundedVisionModelAdapterToolNames,
  ...boundedSpeechModelAdapterToolNames,
  ...boundedAudioMusicAdapterToolNames,
  ...boundedAudioCleanupModelAdapterToolNames,
  ...boundedMapBrowserColorSceneAdapterToolNames,
  ...boundedRenderPackagingAdapterToolNames,
] as const

export type BoundedInternalAdapterToolName = typeof boundedInternalAdapterToolNames[number]
