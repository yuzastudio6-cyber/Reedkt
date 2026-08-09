import type { CaptionDomainRef } from './caption-domain-contracts'

export const CANONICAL_CAPTION_PRIVATE_REVIEW_DEPENDENCY_BINDING_VERSION =
  'canonical-caption-private-review-dependency-binding-v1' as const
export const CANONICAL_CAPTION_PRIVATE_REVIEW_DEPENDENCY_BINDING_COMPONENT_KEY =
  'canonicalCaptionPrivateReviewDependencyBinding' as const

export interface CanonicalCaptionPrivateReviewDependencyBinding {
  schemaVersion:
    typeof CANONICAL_CAPTION_PRIVATE_REVIEW_DEPENDENCY_BINDING_VERSION
  bindingId: string
  bindingDigestSha256: string
  planningProjectionRef: CaptionDomainRef
  renderedMediaWorkBindingRef: CaptionDomainRef
  postrenderVisualQaWorkBindingRef: CaptionDomainRef
  outputId: string
  confirmedOutputFrameRef: CaptionDomainRef
  masterTimingRef: CaptionDomainRef
  canonicalMasterTimingId: string
  requiredReviewArtifacts: [
    {
      role: 'final_captioned_render'
      workItemKey: string
      outputKey: string
      contentType: 'video/mp4'
    },
    {
      role: 'deterministic_final_qa'
      workItemKey: string
      outputKey: string
      contentType: 'application/json'
    },
    {
      role: 'qualified_complete_time_visual_review'
      workItemKey: string
      outputKey: string
      contentType: 'application/json'
    },
  ]
  canonicalPrivateReview: {
    assemblyServiceId: 'canonical_private_review_assembly_service'
    assemblyResponseSchemaVersion:
      'canonical-private-review-assembly-response-v1'
    assemblyManifestSchemaVersion: 'canonical-private-review-manifest-v1'
    assemblyRoute:
      '/v1/edit-executions/packages/:packageRecordId/private-review-assemblies'
    decisionServiceId: 'canonical_private_review_decision_service'
    decisionResponseSchemaVersion:
      'canonical-private-review-decision-response-v1'
    decisionManifestSchemaVersion:
      'canonical-private-review-decision-manifest-v1'
    decisionRoute:
      '/v1/edit-executions/private-review-assemblies/:reviewAssemblyId/decisions'
  }
  everyRequiredArtifactRequiresCreateOnlyPersistence: true
  everyRequiredArtifactRequiresIndependentQa: true
  everyRequiredArtifactRequiresReconciliation: true
  actualReviewAssemblyCreated: false
  actualPrivateReviewDecisionRecorded: false
  privateReviewAcceptanceClaimed: false
  browserReviewCompletionAccepted: false
  approvedSnapshotMutationGranted: false
  additionalWorkCreationGranted: false
  providerDispatchGranted: false
  assetMutationAuthorityGrantedToCaption: false
  finalQaApprovalAuthorityGranted: false
  billingAuthorityGranted: false
  publicDeliveryGranted: false
  productionAuthorityGranted: false
}
