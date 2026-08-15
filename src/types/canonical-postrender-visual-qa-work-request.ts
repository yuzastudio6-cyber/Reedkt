import type { CanonicalPostrenderVisualQaEvidenceRef } from
  './canonical-postrender-visual-qa-lifecycle'

export const CANONICAL_POSTRENDER_VISUAL_QA_WORK_REQUEST_VERSION =
  'canonical-postrender-visual-qa-work-request-v1' as const
export const CANONICAL_POSTRENDER_VISUAL_QA_SAMPLE_PLAN_VERSION =
  'canonical-postrender-visual-qa-sample-plan-v1' as const

export interface CanonicalPostrenderVisualQaWorkRequestSample {
  sampleId: string
  segmentId: string
  sourceRenderKind: 'full_motion' | 'reduced_motion'
  frameNumber: number
  startFrame: number
  endFrameExclusive: number
  width: number
  height: number
  pixelFormat: 'rgb24'
  frameArtifactRef: CanonicalPostrenderVisualQaEvidenceRef
  frameSha256: string
  createOnlyPersistenceVerified: true
  exactRereadVerified: true
  independentArtifactQaPassed: true
}

export interface CanonicalPostrenderVisualQaWorkRequest {
  schemaVersion: typeof CANONICAL_POSTRENDER_VISUAL_QA_WORK_REQUEST_VERSION
  workRequestId: string
  workRequestDigestSha256: string
  sharedProviderCapabilityId: 'qwen2_5_vl_visual_understanding'
  sharedProviderOperationId: 'postrender_private_visual_qa'
  sharedProviderOperationVersion: 'postrender-private-visual-qa-v1'
  providerBoundary: 'qwen2_5_vl_7b_instruct_provider_boundary'
  canonicalProviderModel: 'qwen2.5-vl-7b-instruct'
  requestedModelUse: 'visual_understanding'
  scope: {
    ownerUserId: string
    workspaceId: string
    projectId: string
    editSessionId: string
    approvedSnapshotId: string
  }
  approvedSnapshotRef: CanonicalPostrenderVisualQaEvidenceRef
  executionPackageRef: CanonicalPostrenderVisualQaEvidenceRef
  approvedWorkItemRef: CanonicalPostrenderVisualQaEvidenceRef
  creditReservationRef: CanonicalPostrenderVisualQaEvidenceRef
  privateRenderArtifactRef: CanonicalPostrenderVisualQaEvidenceRef
  deterministicQaRef: CanonicalPostrenderVisualQaEvidenceRef
  estimateCostBindingRef: CanonicalPostrenderVisualQaEvidenceRef
  sampleCollectionRef: CanonicalPostrenderVisualQaEvidenceRef
  render: {
    artifactId: string
    artifactVersion: number
    contentHash: string
    width: number
    height: number
    fpsNumerator: number
    fpsDenominator: number
    frameCount: number
    durationFrames: number
    privateCreateOnlyVerified: true
    exactRereadVerified: true
    deterministicQaPassed: true
  }
  samplePlan: {
    schemaVersion: typeof CANONICAL_POSTRENDER_VISUAL_QA_SAMPLE_PLAN_VERSION
    coverageScope: 'complete' | 'bounded_representative'
    canonicalSegmentCount: number
    sampledSegmentIds: string[]
    sampledSegmentCount: number
    unsampledSegmentCount: number
    modelInspectsOnlyProvidedSampleArtifacts: true
    unsampledContentInspectionClaimAllowed: false
    completeTimeCoverageClaimAllowed: boolean
    samples: CanonicalPostrenderVisualQaWorkRequestSample[]
  }
  inspectionProfile: {
    profileId: string
    profileVersion: number
    profileDigestSha256: string
    normalizedResponseSchemaId: string
    normalizedResponseSchemaDigestSha256: string
    serverOwnedInstructions: true
    rawPromptSerialized: false
    callerProvidedPromptAccepted: false
  }
  replay: {
    idempotencyKey: string
    requestOrdinal: number
    maximumAttempts: 2
  }
  boundaries: {
    requestAdmissionOnly: true
    providerDispatchGranted: false
    providerCallMade: false
    modelInferenceExecuted: false
    resultPersisted: false
    qaApprovalGranted: false
    repairGranted: false
    assetMutationGranted: false
    customerChargeCreated: false
    walletMutationMade: false
    publicDeliveryCreated: false
    productionAuthority: false
  }
}

export type CanonicalPostrenderVisualQaWorkRequestInput = Omit<
  CanonicalPostrenderVisualQaWorkRequest,
  | 'schemaVersion'
  | 'workRequestId'
  | 'workRequestDigestSha256'
  | 'sharedProviderCapabilityId'
  | 'sharedProviderOperationId'
  | 'sharedProviderOperationVersion'
  | 'providerBoundary'
  | 'canonicalProviderModel'
  | 'requestedModelUse'
  | 'boundaries'
>
