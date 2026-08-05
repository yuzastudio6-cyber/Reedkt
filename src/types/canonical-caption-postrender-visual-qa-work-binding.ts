import type { CaptionDomainRef } from './caption-domain-contracts'

export const CANONICAL_CAPTION_POSTRENDER_VISUAL_QA_WORK_BINDING_VERSION =
  'canonical-caption-postrender-visual-qa-work-binding-v1' as const
export const CANONICAL_CAPTION_POSTRENDER_VISUAL_QA_WORK_BINDING_COMPONENT_KEY =
  'canonicalCaptionPostrenderVisualQaWorkBinding' as const
export const CANONICAL_CAPTION_POSTRENDER_VISUAL_QA_WORKER_CLASS =
  'canonical_caption_postrender_visual_qa_coordinator_v1' as const
export const CANONICAL_CAPTION_POSTRENDER_VISUAL_QA_WORK_ITEM_INPUT_VERSION =
  'canonical-caption-postrender-visual-qa-work-item-input-v1' as const
export const CANONICAL_CAPTION_POSTRENDER_VISUAL_QA_WORK_ITEM_OPERATION =
  'internal.run_canonical_caption_postrender_visual_qa_lifecycle.v1' as const

export interface CanonicalCaptionPostrenderVisualQaWorkItemInput {
  schemaVersion:
    typeof CANONICAL_CAPTION_POSTRENDER_VISUAL_QA_WORK_ITEM_INPUT_VERSION
  operation:
    typeof CANONICAL_CAPTION_POSTRENDER_VISUAL_QA_WORK_ITEM_OPERATION
  outputId: string
  confirmedOutputFrameRef: CaptionDomainRef
  masterTimingRef: CaptionDomainRef
  canonicalMasterTimingId: string
  finalRenderWorkItemKey: string
  finalRenderOutputKey: string
  deterministicQaWorkItemKey: string
  deterministicQaOutputKey: string
  workRequestSchemaVersion: 'canonical-postrender-visual-qa-work-request-v1'
  lifecycleResultSchemaVersion:
    'canonical-postrender-visual-qa-shared-lifecycle-result-v1'
  sharedProviderCapabilityId: 'qwen2_5_vl_visual_understanding'
  sharedProviderOperationId: 'postrender_private_visual_qa'
  sharedProviderOperationVersion: 'postrender-private-visual-qa-v1'
  authenticatedCaptionReadRequired: true
  completeTimeCoverageRequired: true
  sampledFramesCreatedOnlyAfterExactRenderReread: true
  rawPromptAccepted: false
  browserCompletionAccepted: false
  directProviderDispatchRequested: false
  assetMutationRequested: false
  qaApprovalRequested: false
  billingAuthorityRequested: false
  publicDeliveryRequested: false
  productionAuthorityRequested: false
}

export interface CanonicalCaptionPostrenderVisualQaWorkBinding {
  schemaVersion:
    typeof CANONICAL_CAPTION_POSTRENDER_VISUAL_QA_WORK_BINDING_VERSION
  bindingId: string
  bindingDigestSha256: string
  planningProjectionRef: CaptionDomainRef
  renderedMediaWorkBindingRef: CaptionDomainRef
  outputId: string
  confirmedOutputFrame: {
    frameRef: CaptionDomainRef
    width: number
    height: number
    fpsNumerator: number
    fpsDenominator: number
  }
  masterTimingRef: CaptionDomainRef
  canonicalMasterTimingId: string
  finalRender: {
    workItemKey: string
    outputKey: string
  }
  deterministicQa: {
    workItemKey: string
    outputKey: string
    operation: 'inspect_final_artifact'
    canonicalOperationId: 'tool.ffprobe.inspect_approved_media.v1'
  }
  visualQaLifecycle: {
    workItemKey: string
    outputKey: string
    workerClass:
      typeof CANONICAL_CAPTION_POSTRENDER_VISUAL_QA_WORKER_CLASS
    operation:
      typeof CANONICAL_CAPTION_POSTRENDER_VISUAL_QA_WORK_ITEM_OPERATION
    dependencyKeys: string[]
    maximumAttempts: 2
    maximumCreditBudget: 0
    workRequestSchemaVersion:
      'canonical-postrender-visual-qa-work-request-v1'
    lifecycleResultSchemaVersion:
      'canonical-postrender-visual-qa-shared-lifecycle-result-v1'
    captionLifecycleProjectionSchemaVersion:
      'caption-rendered-visual-review-shared-lifecycle-result-v1'
    authenticatedReadRequestSchemaVersion:
      'caption-rendered-visual-review-authenticated-read-request-v1'
    authenticatedReadResultSchemaVersion:
      'caption-rendered-visual-review-authenticated-read-result-v1'
    sharedProviderCapabilityId: 'qwen2_5_vl_visual_understanding'
    sharedProviderOperationId: 'postrender_private_visual_qa'
    sharedProviderOperationVersion: 'postrender-private-visual-qa-v1'
  }
  approvalCoverageBindsScheduledWorkNotCompletedResult: true
  actualRenderedArtifactRequiredAtExecution: true
  actualDeterministicQaPassRequiredAtExecution: true
  actualCompleteTimeModelInspectionRequiredForCompletion: true
  actualLifecycleResultPersisted: false
  authenticatedLifecycleResultReread: false
  browserLocalCompletionAccepted: false
  directPeerDispatchGranted: false
  providerDispatchGrantedAtPlanning: false
  providerCallMadeAtPlanning: false
  assetMutationAuthorityGrantedToCaption: false
  finalQaApprovalAuthorityGranted: false
  repairAuthorityGranted: false
  billingAuthorityGranted: false
  publicDeliveryGranted: false
  productionAuthorityGranted: false
}
