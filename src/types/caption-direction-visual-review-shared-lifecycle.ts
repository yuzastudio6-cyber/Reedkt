import type { CaptionImmutablePlanningEvidenceRef } from './caption-direction'

export const CAPTION_RENDERED_VISUAL_REVIEW_SHARED_LIFECYCLE_RESULT_VERSION =
  'caption-rendered-visual-review-shared-lifecycle-result-v1' as const
export const CAPTION_RENDERED_VISUAL_REVIEW_SHARED_PROVIDER_CAPABILITY_ID =
  'qwen2_5_vl_visual_understanding' as const
export const CAPTION_RENDERED_VISUAL_REVIEW_SHARED_PROVIDER_OPERATION_ID =
  'postrender_private_visual_qa' as const
export const CAPTION_RENDERED_VISUAL_REVIEW_SHARED_PROVIDER_OPERATION_VERSION =
  'postrender-private-visual-qa-v1' as const

/**
 * Caption-owned inbound projection of the shared canonical provider lifecycle.
 * The canonical backend owns package creation, queueing, leases, provider
 * dispatch, attempt/cost persistence, result persistence, QA, and reread.
 */
export interface CaptionRenderedVisualReviewSharedLifecycleResult {
  schemaVersion:
    typeof CAPTION_RENDERED_VISUAL_REVIEW_SHARED_LIFECYCLE_RESULT_VERSION
  lifecycleResultId: string
  lifecycleResultDigestSha256: string
  sharedProviderCapabilityId:
    typeof CAPTION_RENDERED_VISUAL_REVIEW_SHARED_PROVIDER_CAPABILITY_ID
  sharedProviderOperationId:
    typeof CAPTION_RENDERED_VISUAL_REVIEW_SHARED_PROVIDER_OPERATION_ID
  sharedProviderOperationVersion:
    typeof CAPTION_RENDERED_VISUAL_REVIEW_SHARED_PROVIDER_OPERATION_VERSION
  scope: {
    workspaceId: string
    projectId: string
    editSessionId: string
    approvedSnapshotId: string
  }
  requestRef: CaptionImmutablePlanningEvidenceRef
  normalizedResultRef: CaptionImmutablePlanningEvidenceRef
  providerWorkPackageRef: CaptionImmutablePlanningEvidenceRef
  approvedSnapshotRef: CaptionImmutablePlanningEvidenceRef
  approvedWorkItemRef: CaptionImmutablePlanningEvidenceRef
  workerLeaseRef: CaptionImmutablePlanningEvidenceRef
  providerDispatchGrantRef: CaptionImmutablePlanningEvidenceRef
  providerAttemptRef: CaptionImmutablePlanningEvidenceRef
  providerRunRef: CaptionImmutablePlanningEvidenceRef
  estimateCostBindingRef: CaptionImmutablePlanningEvidenceRef
  resultRuntimeRecordRef: CaptionImmutablePlanningEvidenceRef
  modelQualificationRef: CaptionImmutablePlanningEvidenceRef
  sampleCollectionRef: CaptionImmutablePlanningEvidenceRef
  sampledFrameRefs: Array<{
    sampleId: string
    sourceRenderKind: 'full_motion' | 'reduced_motion'
    frameNumber: number
    frameArtifactRef: CaptionImmutablePlanningEvidenceRef
    frameSha256: string
  }>
  providerAuthorityHashSha256: string
  providerRequestHashSha256: string
  providerResponseHashSha256: string
  executionAttestationHashSha256: string
  executionAttemptId: string
  replayTuple: {
    idempotencyKey: string
    requestDigestSha256: string
    attemptOrdinal: number
    disposition: 'fresh_execution' | 'idempotent_result_replay'
    replayOfAttemptId?: string
  }
  providerBoundary: 'qwen2_5_vl_7b_instruct_provider_boundary'
  canonicalProviderModel: 'qwen2.5-vl-7b-instruct'
  modelRoleId: 'qwen2_5_vl_visual_understanding'
  requestedModelUse: 'visual_understanding'
  startedAt: string
  finishedAt: string
  actualModelInferenceExecuted: true
  exactApprovedFramesInspected: true
  allSampleFrameDigestsMatched: true
  structuredOutputSchemaValidated: true
  providerResponseNormalizedByServer: true
  canonicalLifecycleAdmissionVerified: true
  workerLeaseVerified: true
  estimateCostBindingVerified: true
  resultRuntimePersistenceVerified: true
  executionAttestationVerified: true
  replayProtectionVerified: true
  responseContainsRawModelText: false
  providerSecretsIncluded: false
  mediaBytesSerialized: false
  pathsOrUrlsIncluded: false
  callerPromptOrExecutableTextAccepted: false
  operationDispatchAuthority: false
  qaApprovalAuthority: false
  repairAuthority: false
  assetMutationAuthority: false
  creditOrBillingAuthority: false
  publicDeliveryAuthority: false
  productionAuthority: false
}
