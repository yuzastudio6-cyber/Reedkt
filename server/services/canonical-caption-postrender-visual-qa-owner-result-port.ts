import type { CanonicalPostrenderVisualQaSharedLifecycleResult } from
  '../../src/types/canonical-postrender-visual-qa-lifecycle'
import type { CanonicalPostrenderVisualQaNormalizedResult } from
  '../../src/types/canonical-postrender-visual-qa-normalized-result'
import type { CanonicalPostrenderVisualQaWorkRequest } from
  '../../src/types/canonical-postrender-visual-qa-work-request'
import type { CaptionDomainRef } from
  '../../src/types/caption-domain-contracts'
import { ApiError } from '../errors/api-error'
import {
  parseCanonicalPostrenderVisualQaSharedLifecycleResult,
} from '../validation/canonical-postrender-visual-qa-lifecycle-schemas'
import {
  parseCanonicalPostrenderVisualQaNormalizedResult,
} from '../validation/canonical-postrender-visual-qa-normalized-result-schemas'
import {
  parseCanonicalPostrenderVisualQaWorkRequest,
} from '../validation/canonical-postrender-visual-qa-work-request-schemas'

export const CANONICAL_CAPTION_POSTRENDER_VISUAL_QA_OWNER_RESULT_PORT_VERSION =
  'canonical-caption-postrender-visual-qa-owner-result-read-port-v1' as const

export interface CanonicalCaptionPostrenderVisualQaOwnerResultLocator {
  ownerUserId: string
  workspaceId: string
  projectId: string
  editSessionId: string
  approvedSnapshotId: string
  approvedWorkItemId: string
  outputId: string
  confirmedOutputFrameRef: CaptionDomainRef
  requireCompleteTimeCoverage: true
}

export interface CanonicalCaptionPostrenderVisualQaOwnerResult {
  workRequest: CanonicalPostrenderVisualQaWorkRequest
  lifecycleResult: CanonicalPostrenderVisualQaSharedLifecycleResult
  normalizedResult: CanonicalPostrenderVisualQaNormalizedResult
}

/**
 * Read-only bridge to the shared lifecycle owner. It cannot schedule work,
 * dispatch Qwen, settle cost, create assets, or approve QA.
 */
export interface CanonicalCaptionPostrenderVisualQaOwnerResultReadPort {
  readonly portVersion:
    typeof CANONICAL_CAPTION_POSTRENDER_VISUAL_QA_OWNER_RESULT_PORT_VERSION
  readonly authorityBoundary:
    'canonical_shared_postrender_visual_qa_lifecycle_owner'
  readPersistedResult(
    locator: CanonicalCaptionPostrenderVisualQaOwnerResultLocator,
  ): Promise<CanonicalCaptionPostrenderVisualQaOwnerResult | null>
}

export async function readCanonicalCaptionPostrenderVisualQaOwnerResult(input: {
  port: CanonicalCaptionPostrenderVisualQaOwnerResultReadPort | undefined
  locator: CanonicalCaptionPostrenderVisualQaOwnerResultLocator
}): Promise<CanonicalCaptionPostrenderVisualQaOwnerResult> {
  const port = input.port
  if (!port
    || port.portVersion !==
      CANONICAL_CAPTION_POSTRENDER_VISUAL_QA_OWNER_RESULT_PORT_VERSION
    || port.authorityBoundary !==
      'canonical_shared_postrender_visual_qa_lifecycle_owner'
    || typeof port.readPersistedResult !== 'function') {
    throw new ApiError(
      'TOOL_NOT_READY',
      'Canonical Caption visual review is waiting for the shared lifecycle owner.',
      503,
      { requiredGate: 'canonical_postrender_visual_qa_owner_result_read_port' },
    )
  }
  const value = await port.readPersistedResult(structuredClone(input.locator))
  if (!value) {
    throw new ApiError(
      'JOB_DEPENDENCY_NOT_READY',
      'Canonical Caption visual review is waiting for a persisted shared-owner result.',
      409,
      { requiredGate: 'canonical_postrender_visual_qa_shared_lifecycle_result' },
    )
  }
  const result = {
    workRequest: parseCanonicalPostrenderVisualQaWorkRequest(
      value.workRequest),
    lifecycleResult: parseCanonicalPostrenderVisualQaSharedLifecycleResult(
      value.lifecycleResult),
    normalizedResult: parseCanonicalPostrenderVisualQaNormalizedResult(
      value.normalizedResult),
  }
  assertExactOwnerResult(result, input.locator)
  return structuredClone(result)
}

function assertExactOwnerResult(
  result: CanonicalCaptionPostrenderVisualQaOwnerResult,
  expected: CanonicalCaptionPostrenderVisualQaOwnerResultLocator,
): void {
  const { workRequest, lifecycleResult, normalizedResult } = result
  const scope = {
    workspaceId: expected.workspaceId,
    projectId: expected.projectId,
    editSessionId: expected.editSessionId,
    approvedSnapshotId: expected.approvedSnapshotId,
  }
  const requestRef = {
    id: workRequest.workRequestId,
    version: 1,
    contentHash: workRequest.workRequestDigestSha256,
  }
  if (
    workRequest.scope.ownerUserId !== expected.ownerUserId
    || !sameScope(workRequest.scope, scope)
    || !sameScope(lifecycleResult.scope, scope)
    || !sameScope(normalizedResult.scope, scope)
    || workRequest.approvedWorkItemRef.id !== expected.approvedWorkItemId
    || refKey(lifecycleResult.requestRef) !== refKey(requestRef)
    || refKey(normalizedResult.requestRef) !== refKey(requestRef)
    || lifecycleResult.normalizedResultRef.id
      !== normalizedResult.normalizedResultId
    || lifecycleResult.normalizedResultRef.version !== 1
    || lifecycleResult.normalizedResultRef.contentHash
      !== normalizedResult.normalizedResultDigestSha256
    || normalizedResult.output.outputId !== expected.outputId
    || !sameDomainRef(normalizedResult.output.confirmedOutputFrameRef,
      expected.confirmedOutputFrameRef)
    || normalizedResult.output.width !== workRequest.render.width
    || normalizedResult.output.height !== workRequest.render.height
    || normalizedResult.output.fpsNumerator !== workRequest.render.fpsNumerator
    || normalizedResult.output.fpsDenominator !== workRequest.render.fpsDenominator
    || (expected.requireCompleteTimeCoverage && (
      workRequest.samplePlan.coverageScope !== 'complete'
      || workRequest.samplePlan.completeTimeCoverageClaimAllowed !== true
      || workRequest.samplePlan.unsampledSegmentCount !== 0
      || normalizedResult.modelInspectionCoverage.scope
        !== 'complete_segment_coverage'
      || normalizedResult.modelInspectionCoverage.unsampledSegmentCount !== 0
    ))
  ) {
    throw new ApiError(
      'APPROVED_SNAPSHOT_REQUIRED',
      'Shared visual-review result diverged from the exact approved Caption output.',
      409,
      { requiredGate: 'canonical_postrender_visual_qa_exact_owner_lineage' },
    )
  }
}

function sameScope(
  left: { workspaceId: string; projectId: string; editSessionId: string;
    approvedSnapshotId: string },
  right: { workspaceId: string; projectId: string; editSessionId: string;
    approvedSnapshotId: string },
): boolean {
  return left.workspaceId === right.workspaceId
    && left.projectId === right.projectId
    && left.editSessionId === right.editSessionId
    && left.approvedSnapshotId === right.approvedSnapshotId
}

function sameDomainRef(left: CaptionDomainRef, right: CaptionDomainRef): boolean {
  return left.id === right.id && left.version === right.version
    && left.contentHash === right.contentHash
}

function refKey(value: { id: string; version: number; contentHash: string }): string {
  return `${value.id}\u0000${value.version}\u0000${value.contentHash}`
}
