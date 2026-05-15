import type { BaseRecord, CreditAmount, ID, JSONObject, ProcessingStatus, Seconds } from './shared'
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
  | 'custom_provider'
  | 'unknown_provider'

export type GenerationType =
  | 'stroke_motion_overlay'
  | 'graphic_design_overlay'
  | 'real_motion_overlay'
  | 'soundsync_audio'
  | 'caption_asset'
  | 'preview_render_asset'
  | 'concept_reference'

export interface GenerationProviderRecord extends BaseRecord {
  providerType: GenerationProviderType
  displayName: string
  active: boolean
  supportsTransparentBackground: boolean
  supportsWordLevelTiming: boolean
  supportedSignatureSystems: SignatureSystem[]
  supportedGenerationTypes: GenerationType[]
  secretReferenceId?: ID
  defaultCreditMultiplier: number
  notes: string[]
}

export interface GenerationRequestRecord extends BaseRecord {
  workspaceId: ID
  projectId: ID
  editPlanId: ID
  editPlanSegmentId?: ID
  signatureRouteId?: ID
  providerId?: ID
  providerType: GenerationProviderType
  modelName?: string
  signatureSystem: SignatureSystem
  generationType: GenerationType
  inputAssetIds: ID[]
  outputAssetType: MediaAssetType
  transparentBackgroundRequired: boolean
  durationSeconds?: Seconds
  resolution: string
  prompt: string
  negativePrompt?: string
  styleConstraints: string[]
  timingConstraints: string[]
  status: ProcessingStatus
  creditEstimate: CreditAmount
  creditReservationId?: ID
  workerNotes: string[]
  providerRequestSummary?: JSONObject
  providerResponseSummary?: JSONObject
}

export interface GeneratedAssetRecord extends BaseRecord {
  generationRequestId: ID
  projectId: ID
  mediaAssetId?: ID
  assetType: MediaAssetType
  signatureSystem: SignatureSystem
  status: ProcessingStatus
  safePreviewUrl?: string
  storagePath?: string
  durationSeconds?: Seconds
  width?: number
  height?: number
  transparentBackground: boolean
  qualityNotes: string[]
}

export const STROKE_MOTION_PROVIDER_RULE =
  'Stroke Motion should prefer controlled renderers such as SVG, Lottie, Remotion, or custom deterministic animation when word-level timing and transparent overlays are required.'
