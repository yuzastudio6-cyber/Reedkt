import type { PlatformAspectRatio } from './workflow-common'
import type { CanonicalPostrenderVisualQaEvidenceRef } from
  './canonical-postrender-visual-qa-lifecycle'

export const CANONICAL_POSTRENDER_VISUAL_QA_NORMALIZED_RESULT_VERSION =
  'canonical-postrender-visual-qa-normalized-result-v1' as const

/**
 * Provider-neutral, server-normalized visual decision produced by the shared
 * lifecycle owner. Caption may consume this record, but cannot construct it,
 * dispatch the provider, approve QA, or execute a repair from it.
 */
export interface CanonicalPostrenderVisualQaNormalizedResult {
  schemaVersion:
    typeof CANONICAL_POSTRENDER_VISUAL_QA_NORMALIZED_RESULT_VERSION
  normalizedResultId: string
  normalizedResultDigestSha256: string
  scope: {
    workspaceId: string
    projectId: string
    editSessionId: string
    approvedSnapshotId: string
  }
  output: {
    outputId: string
    aspectRatio: PlatformAspectRatio
    width: number
    height: number
    fpsNumerator: number
    fpsDenominator: number
    confirmedOutputFrameRef: {
      id: string
      version: string
      contentHash: string
    }
    confirmedByUser: true
    confirmationRecordId: string
  }
  requestRef: CanonicalPostrenderVisualQaEvidenceRef
  providerExecutionReceiptRef: CanonicalPostrenderVisualQaEvidenceRef
  persistedEvidenceArtifactRef: CanonicalPostrenderVisualQaEvidenceRef
  independentArtifactQaRef: CanonicalPostrenderVisualQaEvidenceRef
  assetManifestReconciliationRef: CanonicalPostrenderVisualQaEvidenceRef
  decision:
    | 'passed'
    | 'repair_required'
    | 'needs_human_review'
    | 'blocked_evidence_reconciliation'
  userFacingSummary: string
  deterministicQaPassed: true
  exactApprovedRenderBound: true
  actualModelInferenceVerified: true
  deterministicAndModelEvidenceAgree: boolean
  canonicalEvidenceReconciled: boolean
  modelInspectionCoverage: {
    scope:
      | 'complete_segment_coverage'
      | 'bounded_representative_segment_coverage'
    sampledSegmentCount: number
    unsampledSegmentCount: number
    modelInspectedOnlyPlannedSamples: true
    unsampledSegmentsNeverImpliedInspected: true
  }
  smallestScopeRepairRequired: boolean
  privateHumanReviewRequired: boolean
  actualCompleteTimeVisualReviewPassed: boolean
  rawModelTextIncluded: false
  mediaBytesIncluded: false
  pathsOrUrlsIncluded: false
  browserLocalStateUsed: false
  operationDispatchAuthority: false
  providerRuntimeAuthority: false
  qaApprovalAuthority: false
  repairExecutionAuthority: false
  assetMutationAuthority: false
  creditOrBillingAuthority: false
  publicDeliveryAuthority: false
  productionAuthority: false
}
