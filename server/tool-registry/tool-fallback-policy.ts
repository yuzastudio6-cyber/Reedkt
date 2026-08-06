import type { ProductionFallbackChain, ProductionToolId } from './production-tool-types'

export const PRODUCTION_TOOL_FALLBACK_CHAINS: ProductionFallbackChain[] = [
  {
    chainId: 'color_grade_fallback',
    trigger: 'OpenColorIO weak transform, bad grade, color mismatch, or color QA failure.',
    steps: [
      { action: 'reduce_strength', toolIds: ['opencolorio'], reason: 'Reduce grade intensity before switching tools.' },
      { action: 'switch_tool', toolIds: ['ffmpeg'], reason: 'Use correction-only FFmpeg filters when color management is too risky.' },
      { action: 'use_simpler_recipe', toolIds: ['ffmpeg', 'opencv'], reason: 'Apply a neutral clean grade with basic exposure/color checks.' },
      { action: 'block_final_export', toolIds: ['opencolorio', 'ffmpeg'], reason: 'Final export must stop if required color QA still fails.', blocksFinalExport: true },
    ],
  },
  {
    chainId: 'background_removal_fallback',
    trigger: 'Background-removal weak mask, temporal instability, contact-object risk, or mask QA failure.',
    steps: [
      { action: 'retry_same_tool', toolIds: ['rembg'], reason: 'Retry the approved still-image background-removal profile at bounded settings.' },
      { action: 'switch_tool', toolIds: ['kornia', 'opencv'], reason: 'Refine and score mask edges/temporal stability.' },
      { action: 'skip_effect', toolIds: ['remotion'], reason: 'Use normal text/layout when mask QA cannot pass.', requiresUserReview: true },
    ],
  },
  {
    chainId: 'audio_cleanup_fallback',
    trigger: 'DeepFilterNet artifacts, damaged speech, loudness failure, or audio naturalness failure.',
    steps: [
      { action: 'reduce_strength', toolIds: ['deepfilternet'], reason: 'Lower denoise/enhancement strength before switching tools.' },
      { action: 'switch_tool', toolIds: ['rnnoise'], reason: 'Use lightweight denoise fallback when stronger model artifacts.' },
      { action: 'use_simpler_recipe', toolIds: ['ffmpeg'], reason: 'Fall back to loudness-only correction if denoise is risky.' },
      { action: 'skip_effect', toolIds: ['ffmpeg'], reason: 'Keep original audio when cleanup harms speech clarity.', requiresUserReview: true },
    ],
  },
  {
    chainId: 'ocr_fallback',
    trigger: 'Screen-text evidence is unavailable, uncertain, or presents a UI overlay collision risk.',
    steps: [
      { action: 'use_simpler_recipe', toolIds: ['opencv'], reason: 'Mark conservative no-cover zones from sampled regions.' },
      { action: 'request_user_review', toolIds: ['opencv'], reason: 'User review is required for important UI text uncertainty.', requiresUserReview: true },
    ],
  },
  {
    chainId: 'enhancement_fallback',
    trigger: 'Enhancement artifacts, face/product risk, or enhancement QA failure.',
    steps: [
      { action: 'reduce_strength', toolIds: ['sharp'], reason: 'Lower deterministic resize/sharpen strength to reduce artifacts.' },
      { action: 'skip_effect', toolIds: ['ffmpeg'], reason: 'Skip enhancement when artifact QA cannot pass.' },
    ],
  },
  {
    chainId: 'slow_motion_fallback',
    trigger: 'Slow-motion ghosting, warping, text/faces/hands artifacts, or slow-motion QA failure.',
    steps: [
      { action: 'reduce_strength', toolIds: ['ffmpeg'], reason: 'Reduce slow-motion strength and interpolation demand.' },
      { action: 'switch_tool', toolIds: ['vapoursynth'], reason: 'Use the approved frame-processing fallback when its fixed profile applies.' },
      { action: 'use_simpler_recipe', toolIds: ['ffmpeg'], reason: 'Use native speed change without AI interpolation.' },
      { action: 'skip_effect', toolIds: ['ffmpeg'], reason: 'Skip slow motion when artifact QA cannot pass.' },
    ],
  },
  {
    chainId: 'final_export_fallback',
    trigger: 'FFmpeg export failure, codec/container mismatch, stream sync failure, or final delivery QA failure.',
    steps: [
      { action: 'retry_same_tool', toolIds: ['ffmpeg'], reason: 'Retry with safer codec/container/export settings.' },
      { action: 'use_simpler_recipe', toolIds: ['ffmpeg', 'remotion'], reason: 'Lower export complexity while preserving approved timeline/render intent.' },
      { action: 'block_final_export', toolIds: ['ffmpeg'], reason: 'Block final export if delivery QA remains failed.', blocksFinalExport: true },
    ],
  },
]

const fallbackChainByTool: Record<ProductionToolId, string[]> = {
  ffmpeg: ['color_grade_fallback', 'audio_cleanup_fallback', 'slow_motion_fallback', 'final_export_fallback'],
  ffprobe: ['final_export_fallback'],
  pyav: [],
  opentimelineio: ['final_export_fallback'],
  mkvtoolnix_container_validation: ['final_export_fallback'],
  gpac_mp4box_packaging_validation: ['final_export_fallback'],
  remotion: ['background_removal_fallback', 'enhancement_fallback', 'final_export_fallback'],
  libass: ['final_export_fallback'],
  sharp: ['enhancement_fallback'],
  duckdb: [],
  polars: [],
  pyscenedetect: [],
  opencv: ['background_removal_fallback', 'ocr_fallback'],
  kornia: ['background_removal_fallback'],
  rembg: ['background_removal_fallback'],
  opencolorio: ['color_grade_fallback'],
  openimageio: ['color_grade_fallback'],
  deepfilternet: ['audio_cleanup_fallback'],
  rnnoise: ['audio_cleanup_fallback'],
  librosa: [],
  audioread: [],
  pydub: ['audio_cleanup_fallback'],
  scipy: [],
  resampy: ['audio_cleanup_fallback'],
  pyloudnorm: ['audio_cleanup_fallback'],
  audioflux: [],
  music21: [],
  pretty_midi: [],
  mido: [],
  noisereduce: ['audio_cleanup_fallback'],
  pedalboard: ['audio_cleanup_fallback'],
  mir_eval: [],
  pydub_effects: ['audio_cleanup_fallback'],
  ebu_r128_pyloudnorm: ['audio_cleanup_fallback'],
  signalsmith_stretch: ['audio_cleanup_fallback'],
  pixijs: [],
  three_js: [],
  babylon_js: [],
  lottie: [],
  animejs: [],
  satori: [],
  svg_js: [],
  playwright: ['ocr_fallback'],
  d3: [],
  echarts: [],
  vega: [],
  vega_lite: [],
  viz_js: [],
  konva: [],
  vapoursynth: ['final_export_fallback'],
}

export function getFallbackChainsForTool(toolId: ProductionToolId): ProductionFallbackChain[] {
  const chainIds = fallbackChainByTool[toolId]
  return PRODUCTION_TOOL_FALLBACK_CHAINS.filter((chain) => chainIds.includes(chain.chainId))
}
