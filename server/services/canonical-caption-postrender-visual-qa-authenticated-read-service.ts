import {
  CAPTION_RENDERED_VISUAL_REVIEW_AUTHENTICATED_READ_PROJECTION_VERSION,
  CAPTION_RENDERED_VISUAL_REVIEW_AUTHENTICATED_READ_RESULT_VERSION,
  type CaptionRenderedVisualReviewAuthenticatedOutputScope,
  type CaptionRenderedVisualReviewAuthenticatedReadRequest,
  type CaptionRenderedVisualReviewAuthenticatedReadResult,
} from '../../src/types/caption-direction-visual-review-authenticated-read'
import {
  CAPTION_RENDERED_VISUAL_REVIEW_OUTPUT_SET_PRODUCT_STATUS_VERSION,
  CAPTION_RENDERED_VISUAL_REVIEW_PRODUCT_STATUS_VERSION,
  type CaptionRenderedVisualReviewOutputProductStatus,
  type CaptionRenderedVisualReviewOutputSetProductStatus,
  type CaptionRenderedVisualReviewProductAuthorityBoundary,
} from '../../src/types/caption-direction-visual-review-product-status'
import {
  CAPTION_RENDERED_VISUAL_REVIEW_AUTHENTICATED_READ_CLOSED_AUTHORITY,
  digestCaptionRenderedVisualReviewAuthenticatedReadResult,
  validateCaptionRenderedVisualReviewAuthenticatedReadRequest,
  validateCaptionRenderedVisualReviewAuthenticatedReadResult,
} from '../../src/lib/caption-direction/caption-rendered-visual-review-authenticated-read'
import { assertClosedContractTree } from
  '../../src/lib/closed-contract-validation'
import { ApiError } from '../errors/api-error'
import {
  CANONICAL_CAPTION_POSTRENDER_VISUAL_QA_EVIDENCE_REPOSITORY_VERSION,
  type CanonicalCaptionPostrenderVisualQaCompletedEnvelope,
  type CanonicalCaptionPostrenderVisualQaEvidenceRepository,
  type CanonicalCaptionPostrenderVisualQaOutputAuthority,
  parseCanonicalCaptionPostrenderVisualQaCompletedEnvelope,
} from './canonical-caption-postrender-visual-qa-evidence-service'

export const CANONICAL_CAPTION_POSTRENDER_VISUAL_QA_AUTHENTICATED_READ_SERVICE_VERSION =
  'canonical-caption-postrender-visual-qa-authenticated-read-service-v1' as const

const PRODUCT_CLOSED_AUTHORITY:
CaptionRenderedVisualReviewProductAuthorityBoundary = Object.freeze({
  operationDispatchAuthority: false,
  providerRuntimeAuthority: false,
  qaApprovalAuthority: false,
  repairExecutionAuthority: false,
  assetMutationAuthority: false,
  creditOrBillingAuthority: false,
  publicDeliveryAuthority: false,
  productionAuthority: false,
})

export interface CanonicalCaptionPostrenderVisualQaAuthenticatedReadService {
  readonly serviceVersion:
    typeof CANONICAL_CAPTION_POSTRENDER_VISUAL_QA_AUTHENTICATED_READ_SERVICE_VERSION
  read(input: {
    authenticatedOwnerUserId: string
    request: unknown
  }): Promise<CaptionRenderedVisualReviewAuthenticatedReadResult>
}

export function createCanonicalCaptionPostrenderVisualQaAuthenticatedReadService(
  input: {
    repository: CanonicalCaptionPostrenderVisualQaEvidenceRepository
  },
): CanonicalCaptionPostrenderVisualQaAuthenticatedReadService {
  assertRepository(input.repository)
  return Object.freeze({
    serviceVersion:
      CANONICAL_CAPTION_POSTRENDER_VISUAL_QA_AUTHENTICATED_READ_SERVICE_VERSION,
    async read(value: {
      authenticatedOwnerUserId: string
      request: unknown
    }) {
      const request = parseRequest(value.request)
      if (!value.authenticatedOwnerUserId) {
        throw accessDenied('caption_visual_qa_authenticated_principal_missing')
      }
      const reads = await Promise.all(request.requiredOutputs.map(
        async (requiredOutput) => readExactOutput({
          repository: input.repository,
          authenticatedOwnerUserId: value.authenticatedOwnerUserId,
          request,
          requiredOutput,
        }),
      ))
      const anyLifecycle = reads.some((read) =>
        read.authority.lifecycleState !== 'not_scheduled'
        || read.completed !== null)
      if (!anyLifecycle) return createResult({
        request,
        disposition: 'not_found',
        outputSetStatus: null,
        summary: 'No canonical Caption visual-review work exists for this exact output set.',
      })
      const outputStatuses = reads.map(toOutputProductStatus)
      const outputSetStatus = createOutputSetStatus(request, outputStatuses)
      const waiting = outputStatuses.some((outputStatus) =>
        outputStatus.status.state === 'waiting_for_render'
        || outputStatus.status.state === 'waiting_for_qualified_ai')
      return createResult({
        request,
        disposition: waiting ? 'pending' : 'completed',
        outputSetStatus,
        summary: outputSetStatus.userFacingSummary,
      })
    },
  })
}

function parseRequest(
  value: unknown,
): CaptionRenderedVisualReviewAuthenticatedReadRequest {
  assertClosedContractTree(value, 'Caption visual-review authenticated read')
  const validation =
    validateCaptionRenderedVisualReviewAuthenticatedReadRequest(value)
  if (!validation.ok) throw new ApiError(
    'VALIDATION_FAILED',
    validation.errors[0] ?? 'Caption visual-review read request is invalid.',
    400,
  )
  return structuredClone(value) as
    CaptionRenderedVisualReviewAuthenticatedReadRequest
}

async function readExactOutput(input: {
  repository: CanonicalCaptionPostrenderVisualQaEvidenceRepository
  authenticatedOwnerUserId: string
  request: CaptionRenderedVisualReviewAuthenticatedReadRequest
  requiredOutput: CaptionRenderedVisualReviewAuthenticatedOutputScope
}): Promise<{
  authority: CanonicalCaptionPostrenderVisualQaOutputAuthority
  completed: CanonicalCaptionPostrenderVisualQaCompletedEnvelope | null
}> {
  const locator = {
    ownerUserId: input.authenticatedOwnerUserId,
    ...input.request.scope,
    outputId: input.requiredOutput.outputId,
  }
  const authority = await input.repository.readOutputAuthority(locator)
  if (!authority) throw new ApiError(
    'PROJECT_NOT_FOUND',
    'The exact approved Caption output-frame authority was not found.',
    404,
    { reason: 'caption_visual_qa_output_authority_not_found' },
  )
  if (!authorityMatchesRequest(
    authority, input.authenticatedOwnerUserId, input.request,
    input.requiredOutput)) {
    throw new ApiError(
      'WORKSPACE_ACCESS_DENIED',
      'Caption visual-review scope does not match the authenticated output.',
      403,
      { reason: 'caption_visual_qa_output_authority_scope_mismatch' },
    )
  }
  const completedValue = await input.repository.readCompletedEvidence(locator)
  const completed = completedValue === null ? null
    : parseCanonicalCaptionPostrenderVisualQaCompletedEnvelope(completedValue)
  if (completed && (
    completed.evidence.ownerUserId !== input.authenticatedOwnerUserId
    || !sameScope(completed.evidence.scope, input.request.scope)
    || completed.evidence.output.outputId !== input.requiredOutput.outputId
    || !authorityMatchesCompleted(authority, completed)
  )) throw new ApiError(
    'IDEMPOTENCY_CONFLICT',
    'Caption visual-review evidence no longer matches its exact output authority.',
    409,
    { reason: 'caption_visual_qa_completed_evidence_scope_mismatch' },
  )
  return { authority: structuredClone(authority), completed }
}

function toOutputProductStatus(input: {
  authority: CanonicalCaptionPostrenderVisualQaOutputAuthority
  completed: CanonicalCaptionPostrenderVisualQaCompletedEnvelope | null
}): CaptionRenderedVisualReviewOutputProductStatus {
  const authority = input.authority
  if (!input.completed) {
    const deterministicPassed =
      authority.lifecycleState === 'waiting_for_qualified_ai'
    const state = deterministicPassed
      ? 'waiting_for_qualified_ai' as const
      : 'waiting_for_render' as const
    return {
      outputId: authority.output.outputId,
      aspectRatio: authority.output.aspectRatio,
      width: authority.output.width,
      height: authority.output.height,
      fps: authority.output.fps,
      status: {
        schemaVersion: CAPTION_RENDERED_VISUAL_REVIEW_PRODUCT_STATUS_VERSION,
        scope: structuredClone(authority.scope),
        state,
        userFacingLabel: deterministicPassed
          ? 'Waiting for visual review'
          : 'Waiting for Caption render',
        userFacingSummary: deterministicPassed
          ? 'Deterministic Caption checks passed; qualified visual review is pending.'
          : 'The exact approved Caption render and deterministic checks are pending.',
        deterministicQaStatus: deterministicPassed ? 'passed' : 'waiting',
        aiVisualInspectionStatus: 'waiting',
        exactApprovedRenderBound: deterministicPassed,
        actualModelInferenceVerified: false,
        deterministicAndModelEvidenceAgree: false,
        canonicalEvidenceReconciled: false,
        serverDerivedFromCanonicalEvidence: false,
        visualQaGateSatisfied: false,
        visualQaBlocksDelivery: true,
        smallestScopeRepairRequired: false,
        privateHumanReviewRequired: false,
        rawModelTextIncluded: false,
        mediaBytesIncluded: false,
        pathsOrUrlsIncluded: false,
        authorityBoundary: { ...PRODUCT_CLOSED_AUTHORITY },
      },
    }
  }
  const evidence = input.completed.evidence
  const state = evidence.decision === 'passed'
    ? 'passed' as const
    : evidence.decision
  const inspectionStatus = evidence.decision === 'passed'
    ? 'passed' as const
    : evidence.decision === 'blocked_evidence_reconciliation'
      ? 'blocked' as const
      : evidence.decision
  const gateSatisfied = evidence.decision === 'passed'
    && evidence.actualCompleteTimeVisualReviewPassed
    && evidence.canonicalEvidenceReconciled
    && evidence.deterministicAndModelEvidenceAgree
  return {
    outputId: evidence.output.outputId,
    aspectRatio: evidence.output.aspectRatio,
    width: evidence.output.width,
    height: evidence.output.height,
    fps: evidence.output.fps,
    status: {
      schemaVersion: CAPTION_RENDERED_VISUAL_REVIEW_PRODUCT_STATUS_VERSION,
      scope: structuredClone(evidence.scope),
      state,
      userFacingLabel: evidence.decision === 'passed'
        ? 'Caption checks passed'
        : evidence.decision === 'repair_required'
          ? 'Caption repair required'
          : evidence.decision === 'needs_human_review'
            ? 'Caption review required'
            : 'Caption evidence blocked',
      userFacingSummary: evidence.userFacingSummary,
      deterministicQaStatus: 'passed',
      aiVisualInspectionStatus: inspectionStatus,
      exactApprovedRenderBound: evidence.exactApprovedRenderBound,
      actualModelInferenceVerified: evidence.actualModelInferenceVerified,
      deterministicAndModelEvidenceAgree:
        evidence.deterministicAndModelEvidenceAgree,
      canonicalEvidenceReconciled: evidence.canonicalEvidenceReconciled,
      serverDerivedFromCanonicalEvidence: true,
      modelInspectionCoverage: structuredClone(
        evidence.modelInspectionCoverage),
      canonicalEvidenceRefs: {
        decisionRef: structuredClone(evidence.normalizedDecisionRef),
        providerExecutionReceiptRef: structuredClone(
          evidence.providerExecutionReceiptRef),
        persistedEvidenceArtifactRef: structuredClone(
          evidence.persistedEvidenceArtifactRef),
        independentArtifactQaRef: structuredClone(
          evidence.independentArtifactQaRef),
        assetManifestReconciliationRef: structuredClone(
          evidence.assetManifestReconciliationRef),
      },
      visualQaGateSatisfied: gateSatisfied,
      visualQaBlocksDelivery: !gateSatisfied,
      smallestScopeRepairRequired: evidence.smallestScopeRepairRequired,
      privateHumanReviewRequired: evidence.privateHumanReviewRequired,
      rawModelTextIncluded: false,
      mediaBytesIncluded: false,
      pathsOrUrlsIncluded: false,
      authorityBoundary: { ...PRODUCT_CLOSED_AUTHORITY },
    },
  }
}

function createOutputSetStatus(
  request: CaptionRenderedVisualReviewAuthenticatedReadRequest,
  outputs: CaptionRenderedVisualReviewOutputProductStatus[],
): CaptionRenderedVisualReviewOutputSetProductStatus {
  const state = outputs.some((outputValue) =>
    outputValue.status.state === 'repair_required')
    ? 'repair_required' as const
    : outputs.some((outputValue) =>
      outputValue.status.state === 'needs_human_review')
      ? 'needs_human_review' as const
      : outputs.some((outputValue) =>
        outputValue.status.state === 'blocked_evidence_reconciliation')
        ? 'blocked_evidence_reconciliation' as const
        : outputs.some((outputValue) =>
          outputValue.status.state === 'waiting_for_render')
          ? 'waiting_for_render' as const
          : outputs.some((outputValue) =>
            outputValue.status.state === 'waiting_for_qualified_ai')
            ? 'waiting_for_qualified_ai' as const
            : 'passed' as const
  const gateSatisfied = outputs.every((outputValue) =>
    outputValue.status.visualQaGateSatisfied)
  const unresolved = outputs.filter((outputValue) =>
    !outputValue.status.visualQaGateSatisfied).map((outputValue) =>
      outputValue.outputId)
  return {
    schemaVersion:
      CAPTION_RENDERED_VISUAL_REVIEW_OUTPUT_SET_PRODUCT_STATUS_VERSION,
    scope: structuredClone(request.scope),
    requiredOutputIds: request.requiredOutputs.map((item) => item.outputId),
    requiredAspectRatios: [...new Set(request.requiredOutputs.map(
      (item) => item.aspectRatio))],
    outputs: structuredClone(outputs),
    state,
    userFacingLabel: state === 'passed'
      ? 'Caption checks passed'
      : state === 'repair_required'
        ? 'Caption repair required'
        : state === 'needs_human_review'
          ? 'Caption review required'
          : state === 'blocked_evidence_reconciliation'
            ? 'Caption evidence blocked'
            : state === 'waiting_for_qualified_ai'
              ? 'Waiting for visual review'
              : 'Waiting for Caption render',
    userFacingSummary: state === 'passed'
      ? 'Every requested Caption output passed deterministic and complete-time visual review and is ready for private human review.'
      : 'At least one requested Caption output still requires rendering, qualified visual review, reconciliation, repair, or human review.',
    allRequiredOutputsCovered: outputs.length === request.requiredOutputs.length,
    everyOutputDeterministicQaPassed: outputs.every((outputValue) =>
      outputValue.status.deterministicQaStatus === 'passed'),
    everyOutputQualifiedVisualReviewPassed: outputs.every((outputValue) =>
      outputValue.status.aiVisualInspectionStatus === 'passed'
      && outputValue.status.actualModelInferenceVerified
      && outputValue.status.canonicalEvidenceReconciled),
    unresolvedOutputIds: unresolved,
    outputEvidenceCannotBeReusedAcrossCanvases: true,
    serverDerivedFromAuthenticatedCanonicalReads: true,
    visualQaGateSatisfied: gateSatisfied,
    visualQaBlocksDelivery: !gateSatisfied,
    rawModelTextIncluded: false,
    mediaBytesIncluded: false,
    pathsOrUrlsIncluded: false,
    authorityBoundary: { ...PRODUCT_CLOSED_AUTHORITY },
  }
}

function createResult(input: {
  request: CaptionRenderedVisualReviewAuthenticatedReadRequest
  disposition: 'not_found' | 'pending' | 'completed'
  outputSetStatus: CaptionRenderedVisualReviewOutputSetProductStatus | null
  summary: string
}): CaptionRenderedVisualReviewAuthenticatedReadResult {
  const withoutDigest: CaptionRenderedVisualReviewAuthenticatedReadResult = {
    schemaVersion:
      CAPTION_RENDERED_VISUAL_REVIEW_AUTHENTICATED_READ_RESULT_VERSION,
    disposition: input.disposition,
    scope: structuredClone(input.request.scope),
    confirmedOutputs: structuredClone(input.request.requiredOutputs),
    projectionRef: {
      id: `caption.visual-review.projection.${input.request.scope.approvedSnapshotId}`,
      version: 1,
      schemaVersion:
        CAPTION_RENDERED_VISUAL_REVIEW_AUTHENTICATED_READ_PROJECTION_VERSION,
      contentHash: 'sha256:'.padEnd(71, '0'),
    },
    outputSetStatus: input.outputSetStatus === null ? null
      : structuredClone(input.outputSetStatus),
    userFacingSummary: input.summary,
    authenticatedPrincipalVerified: true,
    exactCanonicalScopeReread: true,
    requestedOutputFramesReread: true,
    approvedSnapshotImmutable: true,
    browserLocalStateUsed: false,
    rawModelTextIncluded: false,
    mediaBytesIncluded: false,
    pathsOrUrlsIncluded: false,
    authorityBoundary: {
      ...CAPTION_RENDERED_VISUAL_REVIEW_AUTHENTICATED_READ_CLOSED_AUTHORITY,
    },
  }
  withoutDigest.projectionRef.contentHash =
    digestCaptionRenderedVisualReviewAuthenticatedReadResult(withoutDigest)
  const validation =
    validateCaptionRenderedVisualReviewAuthenticatedReadResult(withoutDigest)
  if (!validation.ok) throw new ApiError(
    'INTERNAL_ERROR',
    'Canonical Caption visual-review projection failed closed validation.',
    500,
    { errors: validation.errors },
  )
  return structuredClone(withoutDigest)
}

function authorityMatchesRequest(
  authority: CanonicalCaptionPostrenderVisualQaOutputAuthority,
  authenticatedOwnerUserId: string,
  request: CaptionRenderedVisualReviewAuthenticatedReadRequest,
  requiredOutput: CaptionRenderedVisualReviewAuthenticatedOutputScope,
): boolean {
  const frame = requiredOutput.confirmedOutputFrameRef
  return authority.ownerUserId === authenticatedOwnerUserId
    && sameScope(authority.scope, request.scope)
    && authority.output.outputId === requiredOutput.outputId
    && authority.output.aspectRatio === requiredOutput.aspectRatio
    && authority.output.outputId === frame.outputId
    && authority.output.aspectRatio === frame.aspectRatio
    && authority.output.width === frame.width
    && authority.output.height === frame.height
    && authority.output.fps === frame.fps
    && authority.output.confirmedOutputFrameRef.id === frame.id
    && authority.output.confirmedOutputFrameRef.version === frame.version
    && authority.output.confirmedOutputFrameRef.contentHash === frame.contentHash
    && authority.output.confirmedByUser === frame.confirmedByUser
    && authority.output.confirmationRecordId === frame.confirmationRecordId
    && authority.approvedSnapshotImmutable
    && authority.exactConfirmedOutputFrameReread
    && !authority.browserLocalStateAccepted
}

function authorityMatchesCompleted(
  authority: CanonicalCaptionPostrenderVisualQaOutputAuthority,
  completed: CanonicalCaptionPostrenderVisualQaCompletedEnvelope,
): boolean {
  const evidence = completed.evidence
  return authority.ownerUserId === evidence.ownerUserId
    && sameScope(authority.scope, evidence.scope)
    && JSON.stringify(authority.output) === JSON.stringify(evidence.output)
}

function sameScope(
  left: CaptionRenderedVisualReviewAuthenticatedReadRequest['scope'],
  right: CaptionRenderedVisualReviewAuthenticatedReadRequest['scope'],
): boolean {
  return left.workspaceId === right.workspaceId
    && left.projectId === right.projectId
    && left.editSessionId === right.editSessionId
    && left.approvedSnapshotId === right.approvedSnapshotId
}

function assertRepository(
  repository: CanonicalCaptionPostrenderVisualQaEvidenceRepository,
): void {
  if (!repository || repository.repositoryVersion !==
    CANONICAL_CAPTION_POSTRENDER_VISUAL_QA_EVIDENCE_REPOSITORY_VERSION
    || typeof repository.readOutputAuthority !== 'function'
    || typeof repository.readCompletedEvidence !== 'function') {
    throw new ApiError(
      'TOOL_NOT_READY',
      'Canonical Caption visual-review repository is unavailable.',
      503,
      { requiredGate: 'canonical_caption_visual_qa_evidence_repository' },
    )
  }
}

function accessDenied(reason: string): ApiError {
  return new ApiError(
    'WORKSPACE_ACCESS_DENIED',
    'Caption visual-review scope does not match the authenticated owner.',
    403,
    { reason },
  )
}
