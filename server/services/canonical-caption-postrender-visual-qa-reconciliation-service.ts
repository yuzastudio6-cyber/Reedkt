import type {
  CanonicalCaptionPostrenderVisualQaOwnerResult,
} from './canonical-caption-postrender-visual-qa-owner-result-port'
import { ApiError } from '../errors/api-error'
import {
  createCanonicalCaptionPostrenderVisualQaEvidence,
  parseCanonicalCaptionPostrenderVisualQaCompletedEnvelope,
  persistCanonicalCaptionPostrenderVisualQaEvidence,
  type CanonicalCaptionPostrenderVisualQaCompletedEnvelope,
  type CanonicalCaptionPostrenderVisualQaEvidenceRepository,
} from './canonical-caption-postrender-visual-qa-evidence-service'

export const CANONICAL_CAPTION_POSTRENDER_VISUAL_QA_RECONCILIATION_SERVICE_VERSION =
  'canonical-caption-postrender-visual-qa-reconciliation-service-v1' as const

export async function reconcileCanonicalCaptionPostrenderVisualQaOwnerResult(
  input: {
    repository: CanonicalCaptionPostrenderVisualQaEvidenceRepository | undefined
    ownerUserId: string
    ownerResult: CanonicalCaptionPostrenderVisualQaOwnerResult
  },
): Promise<{
  envelope: CanonicalCaptionPostrenderVisualQaCompletedEnvelope
  disposition: 'created' | 'idempotent_replay'
  exactRereadVerified: true
}> {
  const repository = input.repository
  if (!repository) {
    throw new ApiError(
      'TOOL_NOT_READY',
      'Canonical Caption visual-review evidence persistence is unavailable.',
      503,
      { requiredGate: 'canonical_caption_visual_qa_evidence_repository' },
    )
  }
  const normalized = input.ownerResult.normalizedResult
  const authority = await repository.readOutputAuthority({
    ownerUserId: input.ownerUserId,
    ...normalized.scope,
    outputId: normalized.output.outputId,
  })
  if (!authority
    || authority.ownerUserId !== input.ownerUserId
    || authority.lifecycleState !== 'waiting_for_qualified_ai'
    || authority.output.outputId !== normalized.output.outputId
    || authority.output.aspectRatio !== normalized.output.aspectRatio
    || authority.output.width !== normalized.output.width
    || authority.output.height !== normalized.output.height
    || authority.output.fps !== normalized.output.fpsNumerator
      / normalized.output.fpsDenominator
    || authority.output.confirmedOutputFrameRef.id
      !== normalized.output.confirmedOutputFrameRef.id
    || authority.output.confirmedOutputFrameRef.contentHash
      !== `sha256:${normalized.output.confirmedOutputFrameRef.contentHash}`
    || authority.output.confirmedByUser !== true
    || authority.output.confirmationRecordId
      !== normalized.output.confirmationRecordId
    || authority.exactConfirmedOutputFrameReread !== true
    || authority.browserLocalStateAccepted !== false
    || authority.operationDispatchAuthority !== false
    || authority.providerRuntimeAuthority !== false
    || authority.qaApprovalAuthority !== false
    || authority.publicDeliveryAuthority !== false
    || authority.productionAuthority !== false) {
    throw new ApiError(
      'APPROVED_SNAPSHOT_REQUIRED',
      'Canonical visual-review output authority is missing or stale.',
      409,
      { requiredGate: 'canonical_caption_visual_qa_exact_output_authority' },
    )
  }
  const evidence = createCanonicalCaptionPostrenderVisualQaEvidence({
    evidenceId: `caption.visual-qa.evidence.${normalized.normalizedResultDigestSha256.slice(7, 47)}`,
    ownerUserId: input.ownerUserId,
    scope: structuredClone(normalized.scope),
    output: structuredClone(authority.output),
    workRequestRef: structuredClone(normalized.requestRef),
    lifecycleResultRef: {
      id: input.ownerResult.lifecycleResult.lifecycleResultId,
      version: 1,
      contentHash:
        input.ownerResult.lifecycleResult.lifecycleResultDigestSha256,
    },
    normalizedDecisionRef: {
      id: normalized.normalizedResultId,
      version: 1,
      contentHash: normalized.normalizedResultDigestSha256,
    },
    providerExecutionReceiptRef:
      structuredClone(normalized.providerExecutionReceiptRef),
    persistedEvidenceArtifactRef:
      structuredClone(normalized.persistedEvidenceArtifactRef),
    independentArtifactQaRef:
      structuredClone(normalized.independentArtifactQaRef),
    assetManifestReconciliationRef:
      structuredClone(normalized.assetManifestReconciliationRef),
    decision: normalized.decision,
    userFacingSummary: normalized.userFacingSummary,
    deterministicQaPassed: true,
    exactApprovedRenderBound: true,
    actualModelInferenceVerified: true,
    deterministicAndModelEvidenceAgree:
      normalized.deterministicAndModelEvidenceAgree,
    canonicalEvidenceReconciled: normalized.canonicalEvidenceReconciled,
    modelInspectionCoverage:
      structuredClone(normalized.modelInspectionCoverage),
    smallestScopeRepairRequired: normalized.smallestScopeRepairRequired,
    privateHumanReviewRequired: normalized.privateHumanReviewRequired,
    actualCompleteTimeVisualReviewPassed:
      normalized.actualCompleteTimeVisualReviewPassed,
    rawModelTextIncluded: false,
    mediaBytesIncluded: false,
    pathsOrUrlsIncluded: false,
    browserLocalStateUsed: false,
    operationDispatchAuthority: false,
    providerRuntimeAuthority: false,
    qaApprovalAuthority: false,
    repairExecutionAuthority: false,
    assetMutationAuthority: false,
    creditOrBillingAuthority: false,
    publicDeliveryAuthority: false,
    productionAuthority: false,
  })
  const envelope = parseCanonicalCaptionPostrenderVisualQaCompletedEnvelope({
    evidence,
    workRequest: input.ownerResult.workRequest,
    lifecycleResult: input.ownerResult.lifecycleResult,
    normalizedResult: normalized,
  })
  const persisted = await persistCanonicalCaptionPostrenderVisualQaEvidence({
    repository,
    envelope,
  })
  return {
    envelope,
    disposition: persisted.disposition,
    exactRereadVerified: persisted.exactRereadVerified,
  }
}
