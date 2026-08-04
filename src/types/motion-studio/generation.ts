import type { ID, ISODateString } from '../shared'
import type { MotionStudioJobStatus } from './jobs'
import type { MotionStudioDigest, MotionStudioTimingAuthority, MotionStudioVersionReference } from './shared'

export const MOTION_STUDIO_GENERATION_SPEC_VERSION = 'motion-studio-generation-shot-spec-v1' as const
export const MOTION_STUDIO_PROTOCOL_SIMULATOR_ADAPTER_ID = 'motion_studio_protocol_simulator_v1' as const
export const MOTION_STUDIO_GPT_IMAGE_MODEL_ID = 'gpt-image-2' as const
export const MOTION_STUDIO_GPT_IMAGE_MODEL_SNAPSHOT = 'gpt-image-2-2026-04-21' as const
export const MOTION_STUDIO_GEMINI_OMNI_MODEL_ID = 'gemini-omni-flash-preview' as const
export const MOTION_STUDIO_VIDEO_ROUTING_AUTHORITY_VERSION =
  'motion-studio-video-routing-gemini-omni-primary-2026-07-16' as const

export type MotionStudioGeneratedMediaKind = 'still_image' | 'video_clip'

export type MotionStudioGenerationReferenceRole =
  | 'style'
  | 'composition'
  | 'character'
  | 'location'
  | 'object'
  | 'motion'
  | 'camera'
  | 'first_frame'
  | 'last_frame'
  | 'do_not_copy'

export interface MotionStudioGenerationReferenceBinding {
  referenceContract: MotionStudioVersionReference
  assetId: ID
  assetVersionId: ID
  contentDigest: MotionStudioDigest
  role: MotionStudioGenerationReferenceRole
  instruction: string
}

export type MotionStudioGenerationLegacyProviderRoute = 'gpt_image_2' | 'wan' | 'hailuo' | 'veo'
export type MotionStudioGenerationProviderRoute =
  | MotionStudioGenerationLegacyProviderRoute
  | 'gemini_omni_flash'
export type MotionStudioGenerationRouteRole = 'primary' | 'alternate' | 'fallback' | 'final_rescue'
export type MotionStudioGenerationTier = 'basic' | 'pro' | 'premium'

export interface MotionStudioGenerationRouteCandidate<
  Route extends MotionStudioGenerationProviderRoute = MotionStudioGenerationProviderRoute,
> {
  providerRoute: Route
  routeRole: MotionStudioGenerationRouteRole
  supportedMediaKind: MotionStudioGeneratedMediaKind
  allowedTiers: readonly MotionStudioGenerationTier[]
  finalFallbackOnly: boolean
  capabilityReason: string
}

export interface MotionStudioGenerationRoutePolicyV1 {
  policyId: 'motion_studio_generation_route_policy_v1'
  modelTier: MotionStudioGenerationTier
  mediaKind: MotionStudioGeneratedMediaKind
  candidates: readonly MotionStudioGenerationRouteCandidate<MotionStudioGenerationLegacyProviderRoute>[]
  automaticFallbackAllowed: false
  newApprovalRequiredForFallback: true
  exactTextDataAndLogosRemainDeterministic: true
}

export interface MotionStudioGenerationRoutePolicyV2 {
  policyId: 'motion_studio_generation_route_policy_v2'
  routingAuthorityVersion: typeof MOTION_STUDIO_VIDEO_ROUTING_AUTHORITY_VERSION
  modelTier: MotionStudioGenerationTier
  mediaKind: MotionStudioGeneratedMediaKind
  candidates: readonly MotionStudioGenerationRouteCandidate[]
  automaticFallbackAllowed: false
  newApprovalRequiredForFallback: true
  exactTextDataAndLogosRemainDeterministic: true
}

export type MotionStudioGenerationRoutePolicy =
  | MotionStudioGenerationRoutePolicyV1
  | MotionStudioGenerationRoutePolicyV2

/**
 * Exact server-derived shot authority for one still or motion candidate. It is
 * not a raw provider prompt and cannot carry secrets, callback URLs or paths.
 */
export interface MotionStudioGenerationShotSpecV1 {
  schemaVersion: typeof MOTION_STUDIO_GENERATION_SPEC_VERSION
  productionId: ID
  approvedSnapshotId: ID
  sceneId: ID
  semanticPurpose: string
  mediaKind: MotionStudioGeneratedMediaKind
  timingAuthority: MotionStudioTimingAuthority
  sceneRange: {
    startFrame: number
    endFrame: number
  }
  visualDirection: string
  primaryAction: string
  cameraBehavior: string
  continuityProfileId: ID
  references: readonly MotionStudioGenerationReferenceBinding[]
  output: {
    quality: 'draft'
    imageFormat?: 'png' | 'jpeg' | 'webp'
    videoFormat?: 'mp4'
  }
  deterministicOverlayPolicy: {
    exactTextInProviderMediaAllowed: false
    captionsInProviderMediaAllowed: false
    chartsInProviderMediaAllowed: false
    mapsInProviderMediaAllowed: false
    statisticsInProviderMediaAllowed: false
    logosInProviderMediaAllowed: false
    finalCanvasOwnedByRemotion: true
  }
  exclusions: readonly string[]
  qaRequirements: readonly (
    | 'checksum'
    | 'media_facts'
    | 'safety'
    | 'reference_adherence'
    | 'continuity'
    | 'intent_alignment'
  )[]
  simulatorPolicy: {
    allowed: true
    outputIsProviderGenerated: false
    finalAssetEligible: false
    qualityCalibrationMeasured: false
  }
}

export type MotionStudioProviderOperationStatus =
  | 'created'
  | 'submitted'
  | 'processing'
  | 'reconciliation_required'
  | 'completed'
  | 'failed'
  | 'cancelled'

export interface CreateMotionStudioGenerationBindingRequest {
  approvedSnapshotId: ID
  sceneDocumentArtifactId: ID
  sceneDocumentVersionId: ID
  sceneDocumentContentDigest: MotionStudioDigest
  timelineProposalId: ID
  jobId: ID
  mediaKind: MotionStudioGeneratedMediaKind
}

export interface ExecuteMotionStudioGenerationRequest {
  bindingId: ID
  simulationScenario?: 'success' | 'failed' | 'cancelled' | 'outcome_unknown' | 'qa_rejected' | 'execution_error'
}

export interface ReconcileMotionStudioGenerationRequest {
  decision: 'no_side_effect' | 'manual_review'
  evidenceDigest: MotionStudioDigest
}

export interface MotionStudioMediaAssetVersionDto {
  assetId: ID
  assetVersionId: ID
  versionNumber: number
  mediaKind: MotionStudioGeneratedMediaKind
  mimeType: 'image/png' | 'image/jpeg' | 'image/webp' | 'video/mp4'
  sha256: MotionStudioDigest
  byteLength: number
  width: number
  height: number
  durationFrames?: number
  frameRate?: number
  qaStatus: 'passed' | 'rejected'
  finalAssetEligible: false
  protocolSimulatorOnly: true
  createdAt: ISODateString
}

export interface MotionStudioProviderOperationDto {
  id: ID
  bindingId: ID
  jobId: ID
  attemptId: ID
  providerRoute: MotionStudioGenerationProviderRoute
  providerAdapterId: typeof MOTION_STUDIO_PROTOCOL_SIMULATOR_ADAPTER_ID
  providerModelVersion: string
  executionClass: 'protocol_simulator'
  status: MotionStudioProviderOperationStatus
  requestDigest: MotionStudioDigest
  lastEventType?: string
  lastEventAt?: ISODateString
  pollCount: number
  signatureVerifiedEventCount: number
  providerCostIncurred: false
  createdAt: ISODateString
  updatedAt: ISODateString
}

export interface MotionStudioGenerationCandidateDto {
  id: ID
  bindingId: ID
  providerOperationId: ID
  media: MotionStudioMediaAssetVersionDto
  qaEvidenceDigest: MotionStudioDigest
  safetyStatus: 'passed' | 'review_required' | 'rejected'
  reviewStatus: 'review_needed' | 'rejected'
  referenceAdherenceMeasured: false
  visualQualityMeasured: false
  finalAssetEligible: false
  protocolSimulatorOnly: true
  createdAt: ISODateString
}

export interface MotionStudioGenerationBindingDto {
  id: ID
  productionId: ID
  approvedSnapshotId: ID
  sceneDocument: MotionStudioVersionReference
  timelineProposalId: ID
  timelineProposalOutputDigest: MotionStudioDigest
  jobId: ID
  jobStatus: MotionStudioJobStatus
  mediaKind: MotionStudioGeneratedMediaKind
  shotSpec: MotionStudioGenerationShotSpecV1
  shotSpecDigest: MotionStudioDigest
  routePolicy: MotionStudioGenerationRoutePolicy
  routePolicyDigest: MotionStudioDigest
  failureCategory?: string
  providerOperation?: MotionStudioProviderOperationDto
  candidate?: MotionStudioGenerationCandidateDto
  fallbackRecommendation?: {
    providerRoute: MotionStudioGenerationProviderRoute
    reason: string
    newApprovalRequired: true
  }
  createdAt: ISODateString
  protocolSimulatorOnly: true
  localCandidateOnly: true
}

export interface MotionStudioGenerationWorkspaceDto {
  productionId: ID
  bindings: readonly MotionStudioGenerationBindingDto[]
  realProviderExecutionAuthorized: false
  localCandidateOnly: true
}

export interface MotionStudioGenerationExecutionReceiptDto {
  binding: MotionStudioGenerationBindingDto
  providerOperation: MotionStudioProviderOperationDto
  candidate: MotionStudioGenerationCandidateDto
  localCandidateOnly: true
}
