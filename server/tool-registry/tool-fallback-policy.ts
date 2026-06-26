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
    trigger: 'BiRefNet weak mask, temporal instability, contact-object risk, or mask QA failure.',
    steps: [
      { action: 'switch_tool', toolIds: ['sam2'], reason: 'Try segmentation/tracking when foreground extraction is weak.' },
      { action: 'switch_tool', toolIds: ['kornia', 'opencv'], reason: 'Refine and score mask edges/temporal stability.' },
      { action: 'switch_tool', toolIds: ['transparent_background', 'rembg'], reason: 'Use image fallback only for lower-risk still/cutout paths.' },
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
    chainId: 'speech_transcript_fallback',
    trigger: 'faster-whisper low confidence, poor timing, language uncertainty, or transcript alignment failure.',
    steps: [
      { action: 'retry_same_tool', toolIds: ['faster_whisper'], reason: 'Retry with a larger reviewed model/tier if approved.' },
      { action: 'switch_tool', toolIds: ['whisper_cpp'], reason: 'Use whisper.cpp only as allowed evaluation/fallback comparison.' },
      { action: 'request_user_review', toolIds: ['faster_whisper'], reason: 'Ask for human review if transcript confidence remains low.', requiresUserReview: true },
    ],
  },
  {
    chainId: 'ocr_fallback',
    trigger: 'PaddleOCR low confidence, uncertain screen text, or UI overlay collision risk.',
    steps: [
      { action: 'retry_same_tool', toolIds: ['paddleocr'], reason: 'Sample more keyframes before deciding no-cover zones.' },
      { action: 'use_simpler_recipe', toolIds: ['opencv'], reason: 'Mark conservative no-cover zones from sampled regions.' },
      { action: 'request_user_review', toolIds: ['paddleocr'], reason: 'User review is required for important UI text uncertainty.', requiresUserReview: true },
    ],
  },
  {
    chainId: 'vlm_visual_understanding_fallback',
    trigger: 'Qwen2.5-VL unavailable, model-weight blocked, weak structured visual output, unsafe prompt boundary, or visual-understanding QA failure.',
    steps: [
      { action: 'retry_same_tool', toolIds: ['qwen_vl'], reason: 'Retry only after approved snapshot, private model path, bounded visual-token budget, and GPU readiness gates remain satisfied.' },
      { action: 'switch_tool', toolIds: ['paddleocr'], reason: 'Use deterministic OCR when text/layout evidence is the primary uncertainty.' },
      { action: 'use_simpler_recipe', toolIds: ['opencv', 'remotion'], reason: 'Use conservative sampled-region and Remotion safe-zone planning when VLM output is uncertain.' },
      { action: 'request_user_review', toolIds: ['qwen_vl', 'paddleocr', 'opencv'], reason: 'Human review is required for ambiguous visual facts, private media risk, or important on-screen text uncertainty.', requiresUserReview: true },
      { action: 'block_final_export', toolIds: ['qwen_vl'], reason: 'Block final export if required visual-understanding evidence remains unresolved.', blocksFinalExport: true },
    ],
  },
  {
    chainId: 'enhancement_fallback',
    trigger: 'Real-ESRGAN artifacts, hallucinated detail, face/product risk, or enhancement QA failure.',
    steps: [
      { action: 'reduce_strength', toolIds: ['real_esrgan'], reason: 'Lower enhancement strength to reduce artifacts.' },
      { action: 'use_simpler_recipe', toolIds: ['sharp'], reason: 'Apply only thumbnails or selected-frame enhancement when full video is risky.' },
      { action: 'skip_effect', toolIds: ['ffmpeg'], reason: 'Skip enhancement when artifact QA cannot pass.' },
    ],
  },
  {
    chainId: 'slow_motion_fallback',
    trigger: 'FILM ghosting, warping, text/faces/hands artifacts, or slow-motion QA failure.',
    steps: [
      { action: 'reduce_strength', toolIds: ['film'], reason: 'Reduce slow-motion strength and interpolation demand.' },
      { action: 'use_simpler_recipe', toolIds: ['ffmpeg'], reason: 'Use native speed change without AI interpolation.' },
      { action: 'skip_effect', toolIds: ['ffmpeg'], reason: 'Skip slow motion when artifact QA cannot pass.' },
    ],
  },
  {
    chainId: 'ai_video_broll_generation_fallback',
    trigger: 'AI B-roll model unavailable, license-blocked, low quality, high cost, timing mismatch, unsafe prompt boundary, or generated clip QA failure.',
    steps: [
      { action: 'retry_same_tool', toolIds: ['wan_video'], reason: 'Retry Wan only after approved snapshot, model-weight, cost, and worker gates remain satisfied.' },
      { action: 'switch_tool', toolIds: ['ltx_video'], reason: 'Use LTX only for approved fast-preview/image-to-video routes with version-specific license evidence.' },
      { action: 'switch_tool', toolIds: ['mochi_video'], reason: 'Use Mochi only for approved fallback/research comparison; not a production default.' },
      { action: 'use_simpler_recipe', toolIds: ['remotion'], reason: 'Use deterministic Remotion/cards/stills instead of generated video when exactness, safety, cost, or review gates fail.', requiresUserReview: true },
      { action: 'block_final_export', toolIds: ['wan_video', 'ltx_video', 'mochi_video', 'hunyuan_video'], reason: 'Block final export if a required generated B-roll asset remains unresolved.', blocksFinalExport: true },
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
  hyperframe: [],
  remotion: ['background_removal_fallback', 'enhancement_fallback', 'final_export_fallback'],
  libass: ['final_export_fallback'],
  sharp: ['enhancement_fallback'],
  duckdb: [],
  polars: [],
  faster_whisper: ['speech_transcript_fallback'],
  whisper_cpp: ['speech_transcript_fallback'],
  paddleocr: ['ocr_fallback'],
  qwen_vl: ['vlm_visual_understanding_fallback', 'ocr_fallback'],
  pyscenedetect: [],
  opencv: ['background_removal_fallback', 'ocr_fallback'],
  mediapipe: ['background_removal_fallback'],
  kornia: ['background_removal_fallback'],
  birefnet: ['background_removal_fallback'],
  sam2: ['background_removal_fallback'],
  transparent_background: ['background_removal_fallback'],
  rembg: ['background_removal_fallback'],
  opencolorio: ['color_grade_fallback'],
  openimageio: ['color_grade_fallback'],
  deepfilternet: ['audio_cleanup_fallback'],
  rnnoise: ['audio_cleanup_fallback'],
  demucs: ['audio_cleanup_fallback'],
  librosa: [],
  audioflux: [],
  signalsmith_stretch: ['audio_cleanup_fallback'],
  soundtouch: ['audio_cleanup_fallback'],
  rubber_band: ['audio_cleanup_fallback'],
  essentia: [],
  real_esrgan: ['enhancement_fallback'],
  film: ['slow_motion_fallback'],
  wan_video: ['ai_video_broll_generation_fallback'],
  ltx_video: ['ai_video_broll_generation_fallback'],
  mochi_video: ['ai_video_broll_generation_fallback'],
  hunyuan_video: ['ai_video_broll_generation_fallback'],
  pixijs: [],
  three_js: [],
  babylon_js: [],
  lottie: [],
  playwright: ['ocr_fallback'],
  maplibre: [],
  turf: [],
  d3: [],
  echarts: [],
  vega_lite: [],
  deck_gl: [],
  cesium_js: [],
  konva: [],
  vapoursynth: ['final_export_fallback'],
  revideo: ['final_export_fallback'],
}

export function getFallbackChainsForTool(toolId: ProductionToolId): ProductionFallbackChain[] {
  const chainIds = fallbackChainByTool[toolId]
  return PRODUCTION_TOOL_FALLBACK_CHAINS.filter((chain) => chainIds.includes(chain.chainId))
}
