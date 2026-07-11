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

export const boundedModelFoundationAdapterToolNames = [
  'torch_torchvision',
  'transformers',
] as const

export const boundedVisionModelAdapterToolNames = [
  'sam2',
  'birefnet',
  'rembg',
  'transparent_background',
  'real_esrgan',
  'kornia',
] as const

export const boundedSpeechModelAdapterToolNames = [
  'faster_whisper',
  'whisper_cpp',
] as const

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
  'maplibre',
  'turf',
  'deck_gl',
  'playwright',
  'pyscenedetect',
  'opencolorio',
  'openimageio',
] as const

export const boundedRenderPackagingAdapterToolNames = [
  'streamer_render_pipeline_support',
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
