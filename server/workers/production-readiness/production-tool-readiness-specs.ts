import { productionToolProfiles } from '../../tool-registry'
import type {
  ProductionRegistryWorkerType,
  ProductionToolId,
  ProductionToolProfile,
} from '../../tool-registry'
import type {
  ProductionContainerImageRole,
  ProductionModelWeightCheck,
  ProductionReadinessCommandCheck,
  ProductionReadinessCheckMode,
  ProductionReadinessImportCheck,
  ProductionReadinessStatus,
  ProductionToolReadinessSpec,
} from './production-tool-readiness-types'

const commandChecks: Partial<Record<ProductionToolId, ProductionReadinessCommandCheck[]>> = {
  ffmpeg: [{ command: 'ffmpeg', versionArgs: ['-version'], expectedPattern: 'ffmpeg version' }],
  ffprobe: [{ command: 'ffprobe', versionArgs: ['-version'], expectedPattern: 'ffprobe version' }],
  libass: [{ command: 'ffmpeg', versionArgs: ['-filters'], expectedPattern: 'ass' }],
  rnnoise: [{ command: 'rnnoise_demo', versionArgs: ['--help'] }],
  signalsmith_stretch: [{ command: 'signalsmith-stretch', versionArgs: ['--help'] }],
  soundtouch: [{ command: 'soundstretch', versionArgs: ['--help'] }],
  rubber_band: [{ command: 'rubberband', versionArgs: ['--help'] }],
  gstreamer: [{ command: 'gst-launch-1.0', versionArgs: ['--version'], expectedPattern: 'GStreamer' }],
  mkvtoolnix: [{ command: 'mkvmerge', versionArgs: ['--version'], expectedPattern: 'mkvmerge' }],
  gpac_mp4box: [{ command: 'MP4Box', versionArgs: ['-version'], expectedPattern: 'MP4Box' }],
}

const pythonImports: Partial<Record<ProductionToolId, ProductionReadinessImportCheck[]>> = {
  pyav: [{ packageName: 'av', importName: 'av' }],
  opentimelineio: [{ packageName: 'opentimelineio', importName: 'opentimelineio' }],
  faster_whisper: [{ packageName: 'faster-whisper', importName: 'faster_whisper' }, { packageName: 'ctranslate2', importName: 'ctranslate2' }],
  whisper_cpp: [{ packageName: 'whisper.cpp bindings', importName: 'whisper_cpp' }],
  paddleocr: [{ packageName: 'paddleocr', importName: 'paddleocr' }],
  pyscenedetect: [{ packageName: 'scenedetect', importName: 'scenedetect' }],
  opencv: [{ packageName: 'opencv-python-headless', importName: 'cv2' }],
  mediapipe: [{ packageName: 'mediapipe', importName: 'mediapipe' }],
  kornia: [{ packageName: 'kornia', importName: 'kornia' }],
  birefnet: [{ packageName: 'birefnet', importName: 'birefnet' }],
  sam2: [{ packageName: 'sam2', importName: 'sam2' }],
  transparent_background: [{ packageName: 'transparent-background', importName: 'transparent_background' }],
  rembg: [{ packageName: 'rembg', importName: 'rembg' }],
  opencolorio: [{ packageName: 'opencolorio', importName: 'PyOpenColorIO' }],
  openimageio: [{ packageName: 'openimageio', importName: 'OpenImageIO' }],
  deepfilternet: [{ packageName: 'deepfilternet', importName: 'df' }],
  demucs: [{ packageName: 'demucs', importName: 'demucs' }],
  librosa: [{ packageName: 'librosa', importName: 'librosa' }],
  audioread: [{ packageName: 'audioread', importName: 'audioread' }],
  pydub: [{ packageName: 'pydub', importName: 'pydub' }],
  scipy: [{ packageName: 'scipy', importName: 'scipy' }],
  resampy: [{ packageName: 'resampy', importName: 'resampy' }],
  pyloudnorm: [{ packageName: 'pyloudnorm', importName: 'pyloudnorm' }],
  audioflux: [{ packageName: 'audioflux', importName: 'audioflux' }],
  music21: [{ packageName: 'music21', importName: 'music21' }],
  pretty_midi: [{ packageName: 'pretty-midi', importName: 'pretty_midi' }],
  mido: [{ packageName: 'mido', importName: 'mido' }],
  noisereduce: [{ packageName: 'noisereduce', importName: 'noisereduce' }],
  pedalboard: [{ packageName: 'pedalboard', importName: 'pedalboard' }],
  mir_eval: [{ packageName: 'mir-eval', importName: 'mir_eval' }],
  pydub_effects: [{ packageName: 'pydub', importName: 'pydub.effects' }],
  ebu_r128_pyloudnorm: [{ packageName: 'pyloudnorm', importName: 'pyloudnorm' }],
  essentia: [{ packageName: 'essentia', importName: 'essentia' }],
  torch_torchvision: [{ packageName: 'torch', importName: 'torch' }, { packageName: 'torchvision', importName: 'torchvision' }],
  transformers: [{ packageName: 'transformers', importName: 'transformers' }],
  real_esrgan: [{ packageName: 'real-esrgan', importName: 'realesrgan' }],
  film: [{ packageName: 'film', importName: 'film' }],
  vapoursynth: [{ packageName: 'vapoursynth', importName: 'vapoursynth' }],
  duckdb: [{ packageName: 'duckdb', importName: 'duckdb' }],
  polars: [{ packageName: 'polars', importName: 'polars' }],
}

const nodeImports: Partial<Record<ProductionToolId, ProductionReadinessImportCheck[]>> = {
  hyperframe: [{ packageName: 'hyperframe integration boundary', importName: 'hyperframe' }],
  remotion: [{ packageName: 'remotion', importName: 'remotion' }],
  sharp: [{ packageName: 'sharp', importName: 'sharp' }],
  pixijs: [{ packageName: 'pixi.js', importName: 'pixi.js' }],
  three_js: [{ packageName: 'three', importName: 'three' }],
  babylon_js: [{ packageName: '@babylonjs/core', importName: '@babylonjs/core' }],
  lottie: [{ packageName: 'lottie-web', importName: 'lottie-web' }],
  playwright: [{ packageName: 'playwright', importName: 'playwright' }],
  maplibre: [{ packageName: 'maplibre-gl', importName: 'maplibre-gl' }],
  turf: [{ packageName: '@turf/turf', importName: '@turf/turf' }],
  d3: [{ packageName: 'd3', importName: 'd3' }],
  echarts: [{ packageName: 'echarts', importName: 'echarts' }],
  vega: [{ packageName: 'vega', importName: 'vega' }],
  vega_lite: [{ packageName: 'vega-lite', importName: 'vega-lite' }],
  satori: [{ packageName: 'satori', importName: 'satori' }],
  svg_js: [{ packageName: '@svgdotjs/svg.js', importName: '@svgdotjs/svg.js' }],
  viz_js: [{ packageName: 'viz.js', importName: 'viz.js' }],
  animejs: [{ packageName: 'animejs', importName: 'animejs' }],
  deck_gl: [{ packageName: '@deck.gl/core', importName: '@deck.gl/core' }],
  cesium_js: [{ packageName: 'cesium', importName: 'cesium' }],
  konva: [{ packageName: 'konva', importName: 'konva' }],
  revideo: [{ packageName: 'revideo', importName: 'revideo' }],
}

const modelWeightNames: Partial<Record<ProductionToolId, string[]>> = {
  faster_whisper: ['Whisper model checkpoint'],
  whisper_cpp: ['Whisper GGML/GGUF model checkpoint'],
  paddleocr: ['PaddleOCR recognition/detection model'],
  mediapipe: ['MediaPipe landmark model'],
  birefnet: ['BiRefNet checkpoint'],
  sam2: ['SAM 2 checkpoint'],
  transparent_background: ['transparent-background checkpoint'],
  rembg: ['rembg ONNX model'],
  torch_torchvision: ['TorchVision or downstream model checkpoint'],
  transformers: ['Transformers model repository/checkpoint/tokenizer'],
  deepfilternet: ['DeepFilterNet model'],
  demucs: ['Demucs model'],
  real_esrgan: ['Real-ESRGAN model'],
  film: ['FILM checkpoint'],
}

const workerOverrides: Partial<Record<ProductionToolId, ProductionRegistryWorkerType[]>> = {
  ffmpeg: ['cpu_analysis_worker', 'render_worker', 'qa_worker'],
  ffprobe: ['cpu_analysis_worker', 'render_worker', 'qa_worker'],
  opentimelineio: ['cpu_analysis_worker', 'render_worker'],
  sharp: ['cpu_analysis_worker', 'render_worker', 'qa_worker'],
  duckdb: ['cpu_analysis_worker', 'qa_worker'],
  polars: ['cpu_analysis_worker', 'qa_worker'],
  paddleocr: ['cpu_analysis_worker', 'gpu_ai_worker'],
  opencv: ['cpu_analysis_worker', 'gpu_ai_worker', 'qa_worker'],
  opencolorio: ['cpu_analysis_worker', 'render_worker', 'qa_worker'],
  openimageio: ['cpu_analysis_worker', 'qa_worker'],
  rnnoise: ['cpu_analysis_worker', 'gpu_ai_worker'],
  librosa: ['cpu_analysis_worker', 'qa_worker'],
  audioread: ['cpu_analysis_worker'],
  pydub: ['cpu_analysis_worker'],
  scipy: ['cpu_analysis_worker', 'qa_worker'],
  resampy: ['cpu_analysis_worker'],
  pyloudnorm: ['cpu_analysis_worker', 'qa_worker'],
  audioflux: ['cpu_analysis_worker', 'qa_worker'],
  music21: ['cpu_analysis_worker'],
  pretty_midi: ['cpu_analysis_worker'],
  mido: ['cpu_analysis_worker'],
  noisereduce: ['cpu_analysis_worker', 'qa_worker'],
  pedalboard: ['cpu_analysis_worker'],
  mir_eval: ['qa_worker'],
  pydub_effects: ['cpu_analysis_worker'],
  ebu_r128_pyloudnorm: ['cpu_analysis_worker', 'qa_worker'],
  signalsmith_stretch: ['cpu_analysis_worker'],
  pixijs: ['render_worker'],
  three_js: ['render_worker'],
  babylon_js: ['render_worker'],
  lottie: ['render_worker'],
  satori: ['render_worker'],
  svg_js: ['render_worker'],
  viz_js: ['render_worker'],
  animejs: ['render_worker'],
  playwright: ['cpu_analysis_worker'],
  torch_torchvision: ['gpu_ai_worker'],
  transformers: ['gpu_ai_worker'],
  gstreamer: ['tool_readiness_worker'],
  mkvtoolnix: ['tool_readiness_worker'],
  gpac_mp4box: ['tool_readiness_worker'],
  vapoursynth: ['cpu_analysis_worker'],
}

const imageRoleOverrides: Partial<Record<ProductionToolId, ProductionContainerImageRole[]>> = {
  ffmpeg: ['cpu_worker', 'render_worker', 'qa_worker', 'tool_readiness_worker'],
  ffprobe: ['cpu_worker', 'render_worker', 'qa_worker', 'tool_readiness_worker'],
  pyav: ['cpu_worker', 'tool_readiness_worker'],
  opentimelineio: ['cpu_worker', 'render_worker', 'tool_readiness_worker'],
  hyperframe: ['render_worker', 'tool_readiness_worker'],
  remotion: ['render_worker', 'tool_readiness_worker'],
  libass: ['render_worker', 'tool_readiness_worker'],
  sharp: ['cpu_worker', 'render_worker', 'qa_worker', 'tool_readiness_worker'],
  duckdb: ['cpu_worker', 'qa_worker', 'tool_readiness_worker'],
  polars: ['cpu_worker', 'qa_worker', 'tool_readiness_worker'],
  paddleocr: ['cpu_worker', 'gpu_worker', 'tool_readiness_worker'],
  opencv: ['cpu_worker', 'gpu_worker', 'qa_worker', 'tool_readiness_worker'],
  opencolorio: ['cpu_worker', 'qa_worker', 'tool_readiness_worker'],
  openimageio: ['cpu_worker', 'qa_worker', 'tool_readiness_worker'],
  librosa: ['cpu_worker', 'qa_worker', 'tool_readiness_worker'],
  audioread: ['cpu_worker', 'tool_readiness_worker'],
  pydub: ['cpu_worker', 'tool_readiness_worker'],
  scipy: ['cpu_worker', 'qa_worker', 'tool_readiness_worker'],
  resampy: ['cpu_worker', 'tool_readiness_worker'],
  pyloudnorm: ['cpu_worker', 'qa_worker', 'tool_readiness_worker'],
  audioflux: ['cpu_worker', 'qa_worker', 'tool_readiness_worker'],
  music21: ['cpu_worker', 'tool_readiness_worker'],
  pretty_midi: ['cpu_worker', 'tool_readiness_worker'],
  mido: ['cpu_worker', 'tool_readiness_worker'],
  noisereduce: ['cpu_worker', 'qa_worker', 'tool_readiness_worker'],
  pedalboard: ['cpu_worker', 'tool_readiness_worker'],
  mir_eval: ['qa_worker', 'tool_readiness_worker'],
  pydub_effects: ['cpu_worker', 'tool_readiness_worker'],
  ebu_r128_pyloudnorm: ['cpu_worker', 'qa_worker', 'tool_readiness_worker'],
  signalsmith_stretch: ['cpu_worker', 'tool_readiness_worker'],
  pixijs: ['render_worker', 'tool_readiness_worker'],
  three_js: ['render_worker', 'tool_readiness_worker'],
  babylon_js: ['render_worker', 'tool_readiness_worker'],
  lottie: ['render_worker', 'tool_readiness_worker'],
  playwright: ['cpu_worker', 'tool_readiness_worker'],
  maplibre: ['render_worker', 'tool_readiness_worker'],
  turf: ['render_worker', 'tool_readiness_worker'],
  d3: ['render_worker', 'tool_readiness_worker'],
  echarts: ['render_worker', 'tool_readiness_worker'],
  vega: ['render_worker', 'tool_readiness_worker'],
  vega_lite: ['render_worker', 'tool_readiness_worker'],
  satori: ['render_worker', 'tool_readiness_worker'],
  svg_js: ['render_worker', 'tool_readiness_worker'],
  viz_js: ['render_worker', 'tool_readiness_worker'],
  animejs: ['render_worker', 'tool_readiness_worker'],
  deck_gl: ['render_worker', 'tool_readiness_worker'],
  cesium_js: ['render_worker', 'tool_readiness_worker'],
  konva: ['render_worker', 'tool_readiness_worker'],
  torch_torchvision: ['gpu_worker', 'tool_readiness_worker'],
  transformers: ['gpu_worker', 'tool_readiness_worker'],
  gstreamer: ['render_worker', 'tool_readiness_worker'],
  mkvtoolnix: ['render_worker', 'tool_readiness_worker'],
  gpac_mp4box: ['render_worker', 'tool_readiness_worker'],
  vapoursynth: ['cpu_worker', 'tool_readiness_worker'],
  revideo: ['tool_readiness_worker'],
}

function defaultImageRoles(profile: ProductionToolProfile): ProductionContainerImageRole[] {
  if (profile.workerType === 'gpu_ai_worker') return ['gpu_worker', 'tool_readiness_worker']
  if (profile.workerType === 'render_worker') return ['render_worker', 'tool_readiness_worker']
  if (profile.workerType === 'qa_worker') return ['qa_worker', 'tool_readiness_worker']
  if (profile.workerType === 'cpu_analysis_worker') return ['cpu_worker', 'tool_readiness_worker']
  return ['tool_readiness_worker']
}

function modelWeightChecks(toolId: ProductionToolId): ProductionModelWeightCheck[] {
  return (modelWeightNames[toolId] ?? []).map((modelName) => ({
    modelName,
    requiredForProduction: true,
    licenseReviewRequired: true,
    pathHint: `/opt/reeditpro/model-weights/${toolId}`,
  }))
}

function checkModes(profile: ProductionToolProfile): ProductionReadinessCheckMode[] {
  if (profile.productionStatus === 'evaluation_only') return ['evaluation_blocked', 'registry_policy_only']

  const modes = new Set<ProductionReadinessCheckMode>([
    'dockerfile_declared',
    'registry_policy_only',
  ])

  if (commandChecks[profile.toolId]?.length) modes.add('command_version')
  if (pythonImports[profile.toolId]?.length) modes.add('python_import')
  if (nodeImports[profile.toolId]?.length) modes.add('node_import')
  if (modelWeightNames[profile.toolId]?.length) modes.add('model_weight_presence')
  if (profile.commercialUseStatus !== 'allowed') modes.add('manual_review_required')

  return [...modes]
}

function readinessStatusWhenMissing(profile: ProductionToolProfile): ProductionReadinessStatus {
  if (profile.productionStatus === 'evaluation_only') return 'evaluation_only'
  if (profile.productionStatus === 'future') return 'future_only'
  if (profile.modelWeightsRequired || profile.productionStatus === 'needs_license_review') return 'needs_license_review'
  if (profile.launchCore || profile.productionStatus === 'launch_core') return 'missing'
  return 'not_installed'
}

function buildSpec(profile: ProductionToolProfile): ProductionToolReadinessSpec {
  const productionRequired = profile.launchCore && profile.productionStatus !== 'evaluation_only'
  return {
    toolId: profile.toolId,
    displayName: profile.displayName,
    expectedWorkerTypes: workerOverrides[profile.toolId] ?? [profile.workerType],
    imageRoles: imageRoleOverrides[profile.toolId] ?? defaultImageRoles(profile),
    checkMode: checkModes(profile),
    requiredForMilestone: productionRequired ? 6 : 99,
    productionRequired,
    gpuRequired: profile.gpuRequired,
    commandChecks: commandChecks[profile.toolId] ?? [],
    pythonImportChecks: pythonImports[profile.toolId] ?? [],
    nodePackageChecks: nodeImports[profile.toolId] ?? [],
    modelWeightChecks: modelWeightChecks(profile.toolId),
    environmentChecks: profile.gpuRequired
      ? [{ variableName: 'NVIDIA_VISIBLE_DEVICES', requiredForProduction: true, secretPlaceholderOnly: false }]
      : [],
    expectedArtifacts: profile.producedArtifacts,
    blocksProductionIfMissing: productionRequired ||
      profile.modelWeightsRequired ||
      profile.productionStatus === 'needs_license_review' ||
      profile.productionStatus === 'evaluation_only',
    blocksWorkerTypes: workerOverrides[profile.toolId] ?? [profile.workerType],
    readinessStatusWhenMissing: readinessStatusWhenMissing(profile),
    evaluationOnly: profile.productionStatus === 'evaluation_only',
    notes: [
      ...profile.productionReadinessNotes,
      profile.modelWeightsRequired
        ? 'Model weights are placeholders only in Milestone 5 and must pass separate license review.'
        : 'No model weights are downloaded in Milestone 5.',
    ],
  }
}

export const productionToolReadinessSpecs = productionToolProfiles.map(buildSpec)
