import type { BaseRecord, CreditAmount, ID, ISODateString, JSONObject, Percentage, ProcessingStatus, Seconds } from './shared'
import type { MediaAssetType } from './media'
import type { SignatureSystem } from './signature-systems'

export type GenerationProviderType =
  | 'wan'
  | 'veo'
  | 'kling'
  | 'remotion'
  | 'svg_renderer'
  | 'lottie_renderer'
  | 'google_cloud_worker'
  | 'lyria_pro'
  | 'custom_deterministic_renderer'
  | 'external_ai_provider'
  | 'human'
  | 'unknown'
  // Legacy aliases kept so existing prototype records do not break.
  | 'custom_provider'
  | 'unknown_provider'

export type GenerationRuntimeType =
  | 'backend_api'
  | 'cloud_run_service'
  | 'cloud_run_job'
  | 'gpu_worker'
  | 'external_api'
  | 'supabase_edge_function'
  | 'local_mock'
  | 'human'
  | 'unknown'

export type GenerationCapability =
  | 'text_to_image'
  | 'image_to_image'
  | 'text_to_video'
  | 'image_to_video'
  | 'video_to_video'
  | 'audio_generation'
  | 'music_generation'
  | 'sfx_generation'
  | 'caption_generation'
  | 'svg_generation'
  | 'lottie_generation'
  | 'remotion_render'
  | 'transparent_overlay'
  | 'image_sequence'
  | 'timeline_spec'
  | 'json_spec'
  | 'other'

export type GenerationRequestType =
  | 'stroke_motion_animation'
  | 'stroke_motion_storyboard'
  | 'graphic_design_overlay'
  | 'real_motion_overlay'
  | 'soundsync_audio'
  | 'caption_asset'
  | 'transition_asset'
  | 'music_asset'
  | 'sfx_asset'
  | 'preview_asset'
  | 'style_reference'
  | 'animation_reference'
  | 'json_spec'
  | 'other'

export type GenerationType =
  | GenerationRequestType
  | 'stroke_motion_overlay'
  | 'preview_render_asset'
  | 'concept_reference'

export type GenerationRequestStatus =
  | 'draft'
  | 'awaiting_approval'
  | 'approved'
  | 'queued'
  | 'running'
  | 'completed'
  | 'failed'
  | 'cancelled'
  | 'retrying'
  | 'revision_requested'
  | ProcessingStatus

export type GeneratedAssetType =
  | 'stroke_motion_overlay'
  | 'graphic_design_overlay'
  | 'real_motion_overlay'
  | 'sound_effect'
  | 'music'
  | 'voice_audio'
  | 'caption_file'
  | 'svg'
  | 'lottie_json'
  | 'remotion_scene'
  | 'transparent_video'
  | 'image'
  | 'image_sequence'
  | 'video'
  | 'json_spec'
  | 'preview_asset'
  | 'other'

export type GeneratedAssetStatus =
  | 'draft'
  | 'generating'
  | 'ready'
  | 'failed'
  | 'archived'
  | 'superseded'
  | 'revision_requested'
  | ProcessingStatus

export type GeneratedAssetFormat =
  | 'svg'
  | 'json'
  | 'lottie'
  | 'remotion'
  | 'mp4'
  | 'webm'
  | 'mov'
  | 'png'
  | 'jpg'
  | 'webp'
  | 'wav'
  | 'mp3'
  | 'srt'
  | 'vtt'
  | 'unknown'

export type GenerationQualityLevel = 'draft' | 'preview' | 'production' | 'premium'

export type GenerationFailureCategory =
  | 'none'
  | 'provider_error'
  | 'timeout'
  | 'invalid_prompt'
  | 'unsafe_output'
  | 'asset_missing'
  | 'credit_not_reserved'
  | 'approval_missing'
  | 'worker_error'
  | 'quality_failed'
  | 'unknown'

export type GenerationInputRole =
  | 'source_video'
  | 'source_frame'
  | 'source_audio'
  | 'reference_video'
  | 'reference_image'
  | 'style_reference'
  | 'stroke_motion_plan'
  | 'stroke_motion_beat'
  | 'edit_plan_segment'
  | 'signature_route'
  | 'prompt_context'
  | 'other'

export interface GenerationProviderRecord extends BaseRecord {
  providerKey?: string
  name?: string
  providerType: GenerationProviderType
  runtimeType?: GenerationRuntimeType
  displayName: string
  active: boolean
  supportsVideo?: boolean
  supportsImage?: boolean
  supportsAudio?: boolean
  supportsTransparentBackground: boolean
  supportsSvg?: boolean
  supportsLottie?: boolean
  supportsRemotion?: boolean
  supportsWordLevelTiming: boolean
  supportsStyleReference?: boolean
  gpuRequired?: boolean
  supportedSignatureSystems: SignatureSystem[]
  supportedGenerationTypes: GenerationType[]
  workerRuntimeConfigId?: ID
  secretReferenceName?: string
  secretReferenceId?: ID
  defaultCreditMultiplier: number
  costMultiplier?: number
  providerPayload?: JSONObject
  notes: string[]
}

export interface GenerationProviderCapabilityRecord extends BaseRecord {
  generationProviderId: ID
  capability: GenerationCapability
  isSupported: boolean
  maxDurationSeconds?: Seconds
  maxWidth?: number
  maxHeight?: number
  supportsTransparency: boolean
  supportsTimingConstraints: boolean
  supportsPromptWeights: boolean
  capabilityPayload?: JSONObject
}

export interface GenerationProviderModelRecord extends BaseRecord {
  generationProviderId: ID
  modelKey: string
  modelName: string
  displayName?: string
  description?: string
  isActive: boolean
  defaultQualityLevel: GenerationQualityLevel
  defaultCreditCost?: CreditAmount
  costPerSecondCredits?: CreditAmount
  costPerRequestCredits?: CreditAmount
  maxDurationSeconds?: Seconds
  maxResolution?: string
  supportsTransparentBackground: boolean
  supportsWordLevelTiming: boolean
  supportsSeed: boolean
  modelPayload?: JSONObject
}

export interface GenerationRequestRecord extends BaseRecord {
  workspaceId: ID
  projectId: ID
  chatSessionId?: ID
  chatMessageId?: ID
  editPlanId: ID
  editPlanSegmentId?: ID
  signatureRouteId?: ID
  strokeMotionPlanId?: ID
  strokeMotionBeatId?: ID
  strokeMotionGenerationSpecId?: ID
  jobId?: ID
  agentRunId?: ID
  creditEstimateId?: ID
  providerId?: ID
  generationProviderModelId?: ID
  requestType?: GenerationRequestType
  providerType: GenerationProviderType
  modelName?: string
  signatureSystem: SignatureSystem
  generationType: GenerationType
  inputAssetIds: ID[]
  outputAssetType: MediaAssetType
  transparentBackgroundRequired: boolean
  wordLevelTimingRequired?: boolean
  durationSeconds?: Seconds
  width?: number
  height?: number
  frameRate?: number
  resolution: string
  prompt: string
  negativePrompt?: string
  styleConstraints: string[] | JSONObject
  timingConstraints: string[] | JSONObject
  outputRequirements?: JSONObject
  status: GenerationRequestStatus
  qualityLevel?: GenerationQualityLevel
  creditEstimate: CreditAmount
  estimatedCredits?: CreditAmount
  actualCredits?: CreditAmount
  creditReservationId?: ID
  failureCategory?: GenerationFailureCategory
  failureMessage?: string
  idempotencyKey?: string
  providerRequestId?: string
  workerNotes: string[]
  providerRequestSummary?: JSONObject
  providerResponseSummary?: JSONObject
  providerResponsePayload?: JSONObject
  requestPayload?: JSONObject
  queuedAt?: ISODateString
  startedAt?: ISODateString
  completedAt?: ISODateString
  failedAt?: ISODateString
  cancelledAt?: ISODateString
}

export interface GenerationRequestInputRecord extends BaseRecord {
  generationRequestId: ID
  workspaceId: ID
  projectId: ID
  inputRole: GenerationInputRole
  mediaAssetId?: ID
  editPlanSegmentId?: ID
  signatureRouteId?: ID
  strokeMotionPlanId?: ID
  strokeMotionBeatId?: ID
  sourceStartSeconds?: Seconds
  sourceEndSeconds?: Seconds
  inputText?: string
  inputPayload?: JSONObject
}

export interface GeneratedAssetRecord extends BaseRecord {
  workspaceId?: ID
  projectId: ID
  generationRequestId?: ID
  jobId?: ID
  agentRunId?: ID
  createdByUserId?: ID
  mediaAssetId?: ID
  assetType: GeneratedAssetType | MediaAssetType
  assetStatus?: GeneratedAssetStatus
  assetFormat?: GeneratedAssetFormat
  qualityLevel?: GenerationQualityLevel
  signatureSystem: SignatureSystem
  status: GeneratedAssetStatus
  fileName?: string
  displayName?: string
  storageProvider?: string
  safePreviewUrl?: string
  storageBucket?: string
  storagePath?: string
  publicUrl?: string
  signedUrlExpiresAt?: ISODateString
  fileSizeBytes?: number
  durationSeconds?: Seconds
  width?: number
  height?: number
  frameRate?: number
  transparentBackground: boolean
  wordLevelTiming?: boolean
  usableForRender?: boolean
  supersedesGeneratedAssetId?: ID
  archivedAt?: ISODateString
  qualityNotes: string[]
}

export interface GeneratedAssetVersionRecord extends BaseRecord {
  generatedAssetId: ID
  workspaceId: ID
  projectId: ID
  versionNumber: number
  generationRequestId?: ID
  versionLabel?: string
  changeReason?: string
  storagePath?: string
}

export interface GeneratedAssetTimingMapRecord extends BaseRecord {
  generatedAssetId: ID
  workspaceId: ID
  projectId: ID
  editPlanId?: ID
  editPlanSegmentId?: ID
  strokeMotionPlanId?: ID
  startTimeSeconds?: Seconds
  endTimeSeconds?: Seconds
  timelineOffsetSeconds: Seconds
  timingPayload?: JSONObject
}

export interface GenerationEventRecord {
  id: ID
  generationRequestId: ID
  generatedAssetId?: ID
  workspaceId: ID
  projectId: ID
  eventType: string
  message?: string
  status?: GenerationRequestStatus
  progressPercent?: Percentage
  payload?: JSONObject
  createdAt: ISODateString
}

export interface GenerationRequestCostRecord extends BaseRecord {
  generationRequestId: ID
  workspaceId: ID
  projectId: ID
  estimatedInternalCostCents?: number
  actualInternalCostCents?: number
  estimatedUserCredits?: CreditAmount
  actualUserCredits?: CreditAmount
  costReason?: string
  costPayload?: JSONObject
}

export const GENERATION_PROVIDER_SECRET_RULE =
  'Generation provider records store secret reference names only. Do not store API keys, service role keys, provider credentials, signed URLs, or raw secrets in database rows.'

export const STROKE_MOTION_PROVIDER_RULE =
  'Stroke Motion should prefer controlled renderers such as SVG, Lottie, Remotion, or custom deterministic animation when word-level timing and transparent overlays are required.'
