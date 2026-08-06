import type { ReEditProCanonicalEditLevel } from './edit-level'

export const PRIVATE_GCP_VISUAL_UNDERSTANDING_CONTRACT_VERSION =
  'private-gcp-qwen25vl-visual-understanding-v1' as const
export const PRIVATE_GCP_VISUAL_UNDERSTANDING_MODEL_ID =
  'qwen2.5-vl-7b-instruct' as const
export const PRIVATE_GCP_VISUAL_UNDERSTANDING_WORKER_TARGET =
  'reeditpro-gpu-ai-worker' as const
export const PRIVATE_GCP_VISUAL_UNDERSTANDING_ACCELERATOR =
  'nvidia_l4' as const
export const PRIVATE_GCP_VISUAL_UNDERSTANDING_PROXY_PROFILE =
  'professional_1080p_analysis_proxy_v2' as const

export type PrivateGcpVisualAnalysisPhase =
  | 'preplan_internal_source_analysis'
  | 'approved_snapshot_targeted_reinspection'
  | 'postrender_private_visual_qa'

export type PrivateGcpVisualCoverageProfileId =
  | 'professional_targeted_visual_coverage_v1'
  | 'professional_key_moment_visual_coverage_v1'
  | 'studio_scene_level_visual_coverage_v1'

export type PrivateGcpVisualSampleSource =
  | 'analysis_proxy_frame'
  | 'original_resolution_crop'

export type PrivateGcpVisualInspectionReason =
  | 'whole_source_baseline'
  | 'scene_representative'
  | 'marker_window'
  | 'continuity_boundary'
  | 'fine_text'
  | 'face_or_identity_detail'
  | 'product_detail'
  | 'color_or_lighting_detail'
  | 'low_confidence_reinspection'
  | 'postrender_qa'

export interface PrivateGcpVisualPreplanAuthority {
  phase: 'preplan_internal_source_analysis'
  authenticatedUserId: string
  sourceStudyAuthorizationId: string
  internalAnalysisBudgetAuthorityId: string
  userAnalysisConsentRecordedAt: string
  customerCreditReservationId: null
  customerChargeAuthorized: false
}

export interface PrivateGcpVisualApprovedSnapshotAuthority {
  phase: 'approved_snapshot_targeted_reinspection'
  approvedPlanSnapshotId: string
  creditReservationId: string
  approvedWorkItemId: string
  customerChargeAuthorized: false
}

export interface PrivateGcpVisualPostrenderQaAuthority {
  phase: 'postrender_private_visual_qa'
  approvedPlanSnapshotId: string
  creditReservationId: string
  approvedWorkItemId: string
  privateRenderArtifactId: string
  privateRenderSha256: string
  customerChargeAuthorized: false
}

export type PrivateGcpVisualAnalysisAuthority =
  | PrivateGcpVisualPreplanAuthority
  | PrivateGcpVisualApprovedSnapshotAuthority
  | PrivateGcpVisualPostrenderQaAuthority

export interface PrivateGcpVisualSourceIdentity {
  sourceAssetId: string
  storageBucket: string
  storageObjectName: string
  storageObjectGeneration: string
  sourceChecksumSha256: string
  sourceByteLength: number
  sourceWidth: number
  sourceHeight: number
  durationFrames: number
  frameRateNumerator: number
  frameRateDenominator: number
  immutableOriginal: true
  privateObject: true
}

export interface PrivateGcpVisualProxyIdentity {
  proxyAssetId: string
  storageBucket: string
  storageObjectName: string
  storageObjectGeneration: string
  proxyChecksumSha256: string
  sourceChecksumSha256: string
  profileId: typeof PRIVATE_GCP_VISUAL_UNDERSTANDING_PROXY_PROFILE
  width: number
  height: number
  outputColorSpace: 'bt709'
  colorTransformStatus: 'validated_rec709_sdr' | 'validated_color_managed_to_rec709'
  privateObject: true
  originalMasterPreserved: true
}

export interface PrivateGcpVisualModelCheckpointIdentity {
  modelId: typeof PRIVATE_GCP_VISUAL_UNDERSTANDING_MODEL_ID
  checkpointSha256: string
  tokenizerSha256: string
  processorSha256: string
  containerImageDigest: string
  precision: 'bf16' | 'fp16' | 'int8_reviewed'
  modelApprovalRecordId: string
  licenseReviewRecordId: string
}

export interface PrivateGcpVisualSample {
  sampleId: string
  sourceFrame: number
  reason: PrivateGcpVisualInspectionReason
  source: PrivateGcpVisualSampleSource
  proxyFrameChecksumSha256?: string
  crop?: {
    x: number
    y: number
    width: number
    height: number
    cropChecksumSha256: string
  }
  rawFramePersistenceAllowed: false
}

export interface PrivateGcpVisualCoverageWindow {
  windowId: string
  reason: PrivateGcpVisualInspectionReason
  detectedSceneId: string | null
  startFrame: number
  endFrameExclusive: number
  required: boolean
  sampleIds: string[]
}

export interface PrivateGcpVisualCoverageManifest {
  policyVersion: 'private-gcp-qwen25vl-sampling-policy-v1'
  profileId: PrivateGcpVisualCoverageProfileId
  editLevel: ReEditProCanonicalEditLevel
  deterministicTechnicalCoverageComplete: boolean
  sceneDetectionArtifactId: string
  sceneDetectionArtifactSha256: string
  detectedSceneCount: number
  visuallyCoveredSceneCount: number
  maximumUnobservedSpanSeconds: number
  samplesPerBatchMaximum: 64
  batchCount: number
  samples: PrivateGcpVisualSample[]
  windows: PrivateGcpVisualCoverageWindow[]
  coverageDigestSha256: string
}

export interface PrivateGcpVisualServerReadinessEvidence {
  source: 'server_owned_private_gcp_visual_readiness'
  executionEnvironment: 'internal'
  readinessEvidenceId: string | null
  readinessEvidenceSha256: string | null
  verifiedAt: string | null
  cloudRunJobResourceVerified: boolean
  workerServiceAccountAndIamVerified: boolean
  privateGcsGenerationBoundTransportVerified: boolean
  workerImageDigestVerified: boolean
  checkpointPresentInApprovedImage: boolean
  modelAndLicenseApprovalVerified: boolean
  canonicalQueueLeaseAndOneUseDispatchVerified: boolean
  cancellationRetryAndLeaseRecoveryVerified: boolean
  telemetryAndCostRateSnapshotVerified: boolean
  deploymentRegionAndDataPolicyVerified: boolean
  environmentGpuExecutionGateVerified: boolean
}

export interface PrivateGcpVisualUnderstandingPlanInput {
  analysisRunId: string
  attemptId: string
  attemptOrdinal: number
  workspaceId: string
  projectId: string
  editSessionId: string
  idempotencyKey: string
  authority: PrivateGcpVisualAnalysisAuthority
  source: PrivateGcpVisualSourceIdentity
  proxy: PrivateGcpVisualProxyIdentity
  checkpoint: PrivateGcpVisualModelCheckpointIdentity
  coverage: PrivateGcpVisualCoverageManifest
  evidenceSchemaVersion: 'private-gcp-qwen25vl-evidence-schema-v1'
  promptPolicyVersion: 'private-gcp-qwen25vl-visual-prompt-policy-v1'
  serverReadiness: PrivateGcpVisualServerReadinessEvidence
}

export interface PrivateGcpVisualUnderstandingPlan {
  schemaVersion: typeof PRIVATE_GCP_VISUAL_UNDERSTANDING_CONTRACT_VERSION
  analysisRunId: string
  attemptId: string
  attemptOrdinal: number
  workspaceId: string
  projectId: string
  editSessionId: string
  idempotencyKey: string
  phase: PrivateGcpVisualAnalysisPhase
  authority: PrivateGcpVisualAnalysisAuthority
  source: PrivateGcpVisualSourceIdentity
  proxy: PrivateGcpVisualProxyIdentity
  checkpoint: PrivateGcpVisualModelCheckpointIdentity
  coverage: PrivateGcpVisualCoverageManifest
  evidenceSchemaVersion: 'private-gcp-qwen25vl-evidence-schema-v1'
  promptPolicyVersion: 'private-gcp-qwen25vl-visual-prompt-policy-v1'
  serverReadiness: PrivateGcpVisualServerReadinessEvidence
  worker: {
    target: typeof PRIVATE_GCP_VISUAL_UNDERSTANDING_WORKER_TARGET
    accelerator: typeof PRIVATE_GCP_VISUAL_UNDERSTANDING_ACCELERATOR
    executionMode: 'private_self_hosted_gcp_gpu'
    externalProviderApiPrimary: false
    browserExecutionAllowed: false
  }
  cacheKeySha256: string
  planHash: string
  structurallyValid: boolean
  executionReady: boolean
  blockers: string[]
  boundaries: {
    requestContractOnly: true
    providerCallMade: false
    gpuJobCreated: false
    gcsReadMade: false
    sourceBytesRead: false
    rawFramePersisted: false
    customerPriceCalculated: false
    customerCreditsCalculated: false
    customerChargeCreated: false
    walletMutationMade: false
    serviceFeeIncluded: false
    productReady: false
    productionReady: false
  }
}

export interface PrivateGcpVisualObservation {
  observationId: string
  startFrame: number
  endFrameExclusive: number
  evidenceSampleIds: string[]
  category:
    | 'scene'
    | 'object'
    | 'person'
    | 'action'
    | 'camera_motion'
    | 'visible_text'
    | 'layout'
    | 'continuity'
    | 'broll_opportunity'
    | 'visual_risk'
    | 'color_or_lighting'
  summary: string
  confidenceBasisPoints: number
  userCorrectionId: string | null
}

export interface PrivateGcpVisualEvidencePackage {
  schemaVersion: 'private-gcp-qwen25vl-evidence-package-v1'
  analysisRunId: string
  attemptId: string
  planHash: string
  sourceChecksumSha256: string
  proxyChecksumSha256: string
  checkpointSha256: string
  coverageDigestSha256: string
  cacheKeySha256: string
  observations: PrivateGcpVisualObservation[]
  coveredRequiredWindowIds: string[]
  unsupportedClaimCount: number
  deterministicQaPassed: boolean
  privateArtifact: true
  rawFramePersisted: false
  audioOrTranscriptAuthorityClaimed: boolean
  providerCallMade: false
  customerChargeCreated: false
  evidencePackageHash: string
}

export interface PrivateGcpVisualEvidenceVerification {
  ok: boolean
  blocked: boolean
  errors: string[]
  reasoningConsumptionAllowed: boolean
  userReviewRequired: boolean
  providerCallMade: false
  customerChargeCreated: false
}
