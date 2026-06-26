import type { QualityGateType } from '../../src/backend/contracts/production-tool-runtime-contracts'

export type ProductionToolId =
  | 'ffmpeg'
  | 'ffprobe'
  | 'pyav'
  | 'opentimelineio'
  | 'hyperframe'
  | 'remotion'
  | 'libass'
  | 'sharp'
  | 'duckdb'
  | 'polars'
  | 'faster_whisper'
  | 'whisper_cpp'
  | 'paddleocr'
  | 'qwen_vl'
  | 'pyscenedetect'
  | 'opencv'
  | 'mediapipe'
  | 'kornia'
  | 'birefnet'
  | 'sam2'
  | 'transparent_background'
  | 'rembg'
  | 'opencolorio'
  | 'openimageio'
  | 'deepfilternet'
  | 'rnnoise'
  | 'demucs'
  | 'librosa'
  | 'audioflux'
  | 'signalsmith_stretch'
  | 'soundtouch'
  | 'rubber_band'
  | 'essentia'
  | 'real_esrgan'
  | 'film'
  | 'wan_video'
  | 'ltx_video'
  | 'mochi_video'
  | 'hunyuan_video'
  | 'pixijs'
  | 'three_js'
  | 'babylon_js'
  | 'lottie'
  | 'playwright'
  | 'maplibre'
  | 'turf'
  | 'd3'
  | 'echarts'
  | 'vega_lite'
  | 'deck_gl'
  | 'cesium_js'
  | 'konva'
  | 'vapoursynth'
  | 'revideo'

export const PRODUCTION_TOOL_IDS = [
  'ffmpeg',
  'ffprobe',
  'pyav',
  'opentimelineio',
  'hyperframe',
  'remotion',
  'libass',
  'sharp',
  'duckdb',
  'polars',
  'faster_whisper',
  'whisper_cpp',
  'paddleocr',
  'qwen_vl',
  'pyscenedetect',
  'opencv',
  'mediapipe',
  'kornia',
  'birefnet',
  'sam2',
  'transparent_background',
  'rembg',
  'opencolorio',
  'openimageio',
  'deepfilternet',
  'rnnoise',
  'demucs',
  'librosa',
  'audioflux',
  'signalsmith_stretch',
  'soundtouch',
  'rubber_band',
  'essentia',
  'real_esrgan',
  'film',
  'wan_video',
  'ltx_video',
  'mochi_video',
  'hunyuan_video',
  'pixijs',
  'three_js',
  'babylon_js',
  'lottie',
  'playwright',
  'maplibre',
  'turf',
  'd3',
  'echarts',
  'vega_lite',
  'deck_gl',
  'cesium_js',
  'konva',
  'vapoursynth',
  'revideo',
] as const satisfies readonly ProductionToolId[]

export type ProductionToolStatus =
  | 'launch_core'
  | 'planned'
  | 'future'
  | 'evaluation_only'
  | 'needs_license_review'
  | 'blocked'

export type ProductionToolCategory =
  | 'core_media'
  | 'timeline'
  | 'render_composition'
  | 'speech_transcription'
  | 'captions'
  | 'scene_detection'
  | 'visual_analysis'
  | 'ocr'
  | 'background_removal'
  | 'segmentation_tracking'
  | 'mask_refinement'
  | 'color_management'
  | 'image_processing'
  | 'audio_cleanup'
  | 'audio_analysis'
  | 'music_separation'
  | 'enhancement'
  | 'frame_interpolation'
  | 'ai_video_generation'
  | 'motion_graphics'
  | 'browser_capture'
  | 'maps_geospatial'
  | 'charts_dataviz'
  | 'qa'
  | 'evaluation'

export type ProductionRegistryWorkerType =
  | 'api_service'
  | 'cpu_analysis_worker'
  | 'gpu_ai_worker'
  | 'render_worker'
  | 'qa_worker'
  | 'tool_readiness_worker'
  | 'frontend_preview_only'
  | 'planning_only'

export type ProductionToolExecutionMode =
  | 'worker_recipe'
  | 'qa_only'
  | 'render_pipeline'
  | 'readiness_check'
  | 'preview_boundary'
  | 'planning_metadata'
  | 'evaluation_only'

export type ProductionToolAdoptionStage =
  | 'launch_core'
  | 'planned'
  | 'future'
  | 'evaluation_only'
  | 'needs_license_review'
  | 'blocked'

export type ProductionToolInputType =
  | 'source_media'
  | 'proxy_media'
  | 'audio'
  | 'image'
  | 'video'
  | 'frame_sequence'
  | 'timeline_manifest'
  | 'render_manifest'
  | 'transcript'
  | 'caption_segments'
  | 'mask'
  | 'json_data'
  | 'geojson'
  | 'url'
  | 'html'
  | 'css'
  | 'none'

export type ProductionToolOutputType =
  | 'proxy_video'
  | 'extracted_audio'
  | 'analysis_report'
  | 'transcript_json'
  | 'caption_segments_json'
  | 'timeline_manifest'
  | 'render_manifest'
  | 'preview_video'
  | 'final_export'
  | 'image_asset'
  | 'mask_image'
  | 'mask_sequence'
  | 'processed_audio'
  | 'processed_video'
  | 'chart_visual'
  | 'map_visual'
  | 'qa_report'
  | 'json_spec'
  | 'none'

export type ProductionLicenseFamily =
  | 'permissive'
  | 'lgpl'
  | 'gpl'
  | 'agpl'
  | 'commercial'
  | 'proprietary'
  | 'model_card'
  | 'unknown'

export type ProductionLicenseRisk = 'low' | 'medium' | 'high' | 'blocked' | 'unknown'

export type ProductionCommercialUseStatus =
  | 'allowed'
  | 'allowed_with_review'
  | 'needs_review'
  | 'blocked'
  | 'unknown'

export type ModelWeightReviewStatus =
  | 'not_required'
  | 'needs_review'
  | 'approved'
  | 'blocked'
  | 'unknown'

export interface ProductionModelWeightPolicy {
  required: boolean
  reviewStatus: ModelWeightReviewStatus
  commercialUseStatus: ProductionCommercialUseStatus
  checkpointReviewRequired: boolean
  notes: string[]
}

export interface ProductionRuntimePolicy {
  allowedWorkerTypes: ProductionRegistryWorkerType[]
  frontendExecutionAllowed: boolean
  sourceMediaProcessingAllowed: boolean
  productionExecutionAllowed: boolean
  approvedSnapshotRequired: boolean
  creditReservationRequired: boolean
  evaluationOnly: boolean
}

export interface ProductionFallbackStep {
  action: string
  toolIds: ProductionToolId[]
  reason: string
  blocksFinalExport?: boolean
  requiresUserReview?: boolean
}

export interface ProductionFallbackChain {
  chainId: string
  trigger: string
  steps: ProductionFallbackStep[]
}

export interface ProductionQAProfile {
  gateTypes: QualityGateType[]
  requiredBeforePreview: QualityGateType[]
  requiredBeforeFinalExport: QualityGateType[]
  notes: string[]
}

export interface ProductionToolProfile {
  toolId: ProductionToolId
  displayName: string
  category: ProductionToolCategory
  description: string
  productionStatus: ProductionToolStatus
  adoptionStage: ProductionToolAdoptionStage
  workerType: ProductionRegistryWorkerType
  executionMode: ProductionToolExecutionMode
  gpuRequired: boolean
  cpuAllowed: boolean
  installPhase: string
  launchCore: boolean
  inputTypes: ProductionToolInputType[]
  outputTypes: ProductionToolOutputType[]
  bestFor: string[]
  notBestFor: string[]
  supportedActions: string[]
  requiredArtifacts: ProductionToolInputType[]
  producedArtifacts: ProductionToolOutputType[]
  qaResponsibilities: QualityGateType[]
  fallbackToolIds: ProductionToolId[]
  license: string
  licenseFamily: ProductionLicenseFamily
  licenseRisk: ProductionLicenseRisk
  commercialUseStatus: ProductionCommercialUseStatus
  distributionRisk: ProductionLicenseRisk
  modelWeightsRequired: boolean
  modelWeightPolicy: ProductionModelWeightPolicy
  securityNotes: string[]
  runtimeNotes: string[]
  productionReadinessNotes: string[]
}

export interface ProductionToolRegistrySummary {
  totalTools: number
  launchCoreTools: ProductionToolId[]
  gpuRequiredTools: ProductionToolId[]
  toolsNeedingLicenseReview: ProductionToolId[]
  toolsWithModelWeights: ProductionToolId[]
  evaluationOnlyTools: ProductionToolId[]
  blockedTools: ProductionToolId[]
  categories: ProductionToolCategory[]
  workerTypes: ProductionRegistryWorkerType[]
  notes: string[]
}
