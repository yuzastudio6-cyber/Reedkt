export const CANONICAL_POSTRENDER_VISUAL_QA_SHARED_LIFECYCLE_RESULT_VERSION =
  'canonical-postrender-visual-qa-shared-lifecycle-result-v1' as const
export const CANONICAL_POSTRENDER_VISUAL_QA_PROVIDER_CAPABILITY_ID =
  'qwen2_5_vl_visual_understanding' as const
export const CANONICAL_POSTRENDER_VISUAL_QA_PROVIDER_OPERATION_ID =
  'postrender_private_visual_qa' as const
export const CANONICAL_POSTRENDER_VISUAL_QA_PROVIDER_OPERATION_VERSION =
  'postrender-private-visual-qa-v1' as const
export const CANONICAL_POSTRENDER_VISUAL_QA_PROVIDER_BOUNDARY =
  'qwen2_5_vl_7b_instruct_provider_boundary' as const
export const CANONICAL_POSTRENDER_VISUAL_QA_PROVIDER_MODEL =
  'qwen2.5-vl-7b-instruct' as const

export interface CanonicalPostrenderVisualQaEvidenceRef {
  id: string
  version: number
  contentHash: string
}

/**
 * Frontend-safe result surface for one canonical Qwen post-render visual-QA
 * attempt. This is a read model only: the queue, lease, provider dispatch,
 * result persistence, artifact QA, reconciliation, and authenticated route
 * remain server-owned authorities.
 */
export interface CanonicalPostrenderVisualQaSharedLifecycleResult {
  schemaVersion:
    typeof CANONICAL_POSTRENDER_VISUAL_QA_SHARED_LIFECYCLE_RESULT_VERSION
  lifecycleResultId: string
  lifecycleResultDigestSha256: string
  sharedProviderCapabilityId:
    typeof CANONICAL_POSTRENDER_VISUAL_QA_PROVIDER_CAPABILITY_ID
  sharedProviderOperationId:
    typeof CANONICAL_POSTRENDER_VISUAL_QA_PROVIDER_OPERATION_ID
  sharedProviderOperationVersion:
    typeof CANONICAL_POSTRENDER_VISUAL_QA_PROVIDER_OPERATION_VERSION
  scope: {
    workspaceId: string
    projectId: string
    editSessionId: string
    approvedSnapshotId: string
  }
  requestRef: CanonicalPostrenderVisualQaEvidenceRef
  normalizedResultRef: CanonicalPostrenderVisualQaEvidenceRef
  providerWorkPackageRef: CanonicalPostrenderVisualQaEvidenceRef
  approvedSnapshotRef: CanonicalPostrenderVisualQaEvidenceRef
  approvedWorkItemRef: CanonicalPostrenderVisualQaEvidenceRef
  workerLeaseRef: CanonicalPostrenderVisualQaEvidenceRef
  providerDispatchGrantRef: CanonicalPostrenderVisualQaEvidenceRef
  providerAttemptRef: CanonicalPostrenderVisualQaEvidenceRef
  providerRunRef: CanonicalPostrenderVisualQaEvidenceRef
  estimateCostBindingRef: CanonicalPostrenderVisualQaEvidenceRef
  resultRuntimeRecordRef: CanonicalPostrenderVisualQaEvidenceRef
  modelQualificationRef: CanonicalPostrenderVisualQaEvidenceRef
  sampleCollectionRef: CanonicalPostrenderVisualQaEvidenceRef
  sampledFrameRefs: Array<{
    sampleId: string
    sourceRenderKind: 'full_motion' | 'reduced_motion'
    frameNumber: number
    frameArtifactRef: CanonicalPostrenderVisualQaEvidenceRef
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
  providerBoundary:
    typeof CANONICAL_POSTRENDER_VISUAL_QA_PROVIDER_BOUNDARY
  canonicalProviderModel:
    typeof CANONICAL_POSTRENDER_VISUAL_QA_PROVIDER_MODEL
  modelRoleId:
    typeof CANONICAL_POSTRENDER_VISUAL_QA_PROVIDER_CAPABILITY_ID
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
