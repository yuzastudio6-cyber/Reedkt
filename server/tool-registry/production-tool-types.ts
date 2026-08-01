import type { QualityGateType } from '../../src/backend/contracts/production-tool-runtime-contracts'

/**
 * Exact tool identities with canonical private end-to-end and job-adapter
 * evidence. This is the only list accepted by production tool-call schemas.
 *
 * Historical planning and future-capability records are retained separately
 * under `ProfessionalToolCatalogId`; they are not `ProductionToolId`s.
 */
export const CANONICAL_PRIVATE_E2E_TOOL_IDS = [
  'd3',
  'echarts',
  'vega_lite',
  'vega',
  'satori',
  'svg_js',
  'viz_js',
  'lottie',
  'animejs',
  'three_js',
  'pixijs',
  'konva',
  'babylon_js',
  'rembg',
  'kornia',
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
  'deepfilternet',
  'playwright',
  'pyscenedetect',
  'opencolorio',
  'openimageio',
  'mkvtoolnix_container_validation',
  'gpac_mp4box_packaging_validation',
  'ffmpeg',
  'ffprobe',
  'pyav',
  'opentimelineio',
  'remotion',
  'libass',
  'sharp',
  'duckdb',
  'polars',
  'opencv',
  'signalsmith_stretch',
  'vapoursynth',
] as const

export type ProductionToolId =
  (typeof CANONICAL_PRIVATE_E2E_TOOL_IDS)[number]

export type CanonicalPrivateE2EToolId = ProductionToolId

export const PRODUCTION_TOOL_IDS = CANONICAL_PRIVATE_E2E_TOOL_IDS

/**
 * Preserved design/readiness identities without canonical private E2E proof.
 * They are capability candidates, not production tools, and must not enter
 * tool-call schemas, planner selection, work manifests, or dispatch.
 */
export const NON_E2E_TOOL_CAPABILITY_IDS = [
  'hyperframe',
  'streamer_render_pipeline_support',
  'faster_whisper',
  'whisper_cpp',
  'paddleocr',
  'mediapipe',
  'birefnet',
  'sam2',
  'transparent_background',
  'demucs',
  'soundtouch',
  'rubber_band',
  'essentia',
  'real_esrgan',
  'film',
  'maplibre',
  'turf',
  'deck_gl',
  'cesium_js',
  'torch_torchvision',
  'transformers',
  'comfyui',
  'revideo',
] as const

export type NonE2EToolCapabilityId =
  (typeof NON_E2E_TOOL_CAPABILITY_IDS)[number]

export type ProfessionalToolCatalogId =
  | ProductionToolId
  | NonE2EToolCapabilityId

export const RUNNER_ONLY_FOUNDATION_IDS = [
  'streamer_render_pipeline_support',
  'torch_torchvision',
  'transformers',
] as const satisfies readonly NonE2EToolCapabilityId[]

export type RunnerOnlyFoundationId =
  (typeof RUNNER_ONLY_FOUNDATION_IDS)[number]

export const ALL_PROFESSIONAL_TOOL_CATALOG_IDS = [
  ...CANONICAL_PRIVATE_E2E_TOOL_IDS,
  ...NON_E2E_TOOL_CAPABILITY_IDS,
] as const satisfies readonly ProfessionalToolCatalogId[]

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
  | 'music_midi'
  | 'music_separation'
  | 'enhancement'
  | 'frame_interpolation'
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

export interface ProfessionalToolCatalogProfile {
  toolId: ProfessionalToolCatalogId
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
  fallbackToolIds: ProfessionalToolCatalogId[]
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

export interface ProductionToolProfile
  extends Omit<
    ProfessionalToolCatalogProfile,
    'toolId' | 'fallbackToolIds'
  > {
  toolId: ProductionToolId
  fallbackToolIds: ProductionToolId[]
}

export interface NonE2EToolCapabilityProfile
  extends Omit<
    ProfessionalToolCatalogProfile,
    'toolId'
  > {
  toolId: NonE2EToolCapabilityId
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

export interface NonE2EToolCapabilityCatalogSummary {
  totalCapabilities: number
  runnerOnlyFoundations: NonE2EToolCapabilityId[]
  remainingUnprovenCapabilities: NonE2EToolCapabilityId[]
  toolCallAllowed: false
  plannerSelectionAllowed: false
  workManifestAdmissionAllowed: false
  dispatchAllowed: false
  notes: string[]
}
