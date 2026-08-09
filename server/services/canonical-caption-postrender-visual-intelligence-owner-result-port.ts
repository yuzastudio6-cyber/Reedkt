import type { CaptionDomainRef } from
  '../../src/types/caption-domain-contracts'
import type {
  CanonicalCaptionPostrenderVisualIntelligenceResult,
} from '../../src/types/canonical-caption-postrender-visual-intelligence-result'
import { ApiError } from '../errors/api-error'
import {
  parseCanonicalCaptionPostrenderVisualIntelligenceResult,
} from './canonical-caption-postrender-visual-intelligence-result'

export const CANONICAL_CAPTION_POSTRENDER_VISUAL_INTELLIGENCE_OWNER_RESULT_PORT_VERSION =
  'canonical-caption-postrender-visual-intelligence-owner-result-read-port-v1' as const

export interface CanonicalCaptionPostrenderVisualIntelligenceOwnerResultLocator {
  ownerUserId: string
  workspaceId: string
  projectId: string
  editSessionId: string
  approvedSnapshotId: string
  approvedWorkItemId: string
  outputId: string
  confirmedOutputFrameRef: CaptionDomainRef
  requireCompleteRequestedRangeCoverage: true
}

/**
 * Read-only active-owner boundary. Visual Intelligence owns inference and
 * persistence; the Caption coordinator may only reread the immutable result.
 */
export interface CanonicalCaptionPostrenderVisualIntelligenceOwnerResultReadPort {
  readonly portVersion:
    typeof CANONICAL_CAPTION_POSTRENDER_VISUAL_INTELLIGENCE_OWNER_RESULT_PORT_VERSION
  readonly authorityBoundary:
    'canonical_visual_intelligence_postrender_owner'
  readPersistedResult(
    locator: CanonicalCaptionPostrenderVisualIntelligenceOwnerResultLocator,
  ): Promise<CanonicalCaptionPostrenderVisualIntelligenceResult | null>
}

export interface CanonicalCaptionPostrenderVisualIntelligenceOwnerResultRepository
extends CanonicalCaptionPostrenderVisualIntelligenceOwnerResultReadPort {
  persistOwnerResultCreateOnly(
    result: CanonicalCaptionPostrenderVisualIntelligenceResult,
  ): Promise<{
    disposition: 'created' | 'idempotent_replay'
    resultRef: { id: string; version: 1; contentHash: string }
    exactRereadVerified: true
  }>
}

export async function readCanonicalCaptionPostrenderVisualIntelligenceOwnerResult(
  input: {
    port:
      | CanonicalCaptionPostrenderVisualIntelligenceOwnerResultReadPort
      | undefined
    locator: CanonicalCaptionPostrenderVisualIntelligenceOwnerResultLocator
  },
): Promise<CanonicalCaptionPostrenderVisualIntelligenceResult> {
  const port = input.port
  if (!port
    || port.portVersion !==
      CANONICAL_CAPTION_POSTRENDER_VISUAL_INTELLIGENCE_OWNER_RESULT_PORT_VERSION
    || port.authorityBoundary !==
      'canonical_visual_intelligence_postrender_owner'
    || typeof port.readPersistedResult !== 'function') {
    throw new ApiError(
      'TOOL_NOT_READY',
      'Canonical Caption visual review is waiting for the active Visual Intelligence owner.',
      503,
      {
        requiredGate:
          'canonical_caption_postrender_visual_intelligence_owner_result_read_port',
      },
    )
  }
  const value = await port.readPersistedResult(structuredClone(input.locator))
  if (!value) {
    throw new ApiError(
      'JOB_DEPENDENCY_NOT_READY',
      'Canonical Caption visual review is waiting for a persisted Visual Intelligence result.',
      409,
      {
        requiredGate:
          'canonical_caption_postrender_visual_intelligence_result',
      },
    )
  }
  const result = parseCanonicalCaptionPostrenderVisualIntelligenceResult(value)
  assertExactOwnerResult(result, input.locator)
  return structuredClone(result)
}

function assertExactOwnerResult(
  result: CanonicalCaptionPostrenderVisualIntelligenceResult,
  expected: CanonicalCaptionPostrenderVisualIntelligenceOwnerResultLocator,
): void {
  const outputFrame = result.output.captionConfirmedOutputFrameRef
  const expectedFrame = expected.confirmedOutputFrameRef
  if (
    result.scope.ownerUserId !== expected.ownerUserId
    || result.scope.workspaceId !== expected.workspaceId
    || result.scope.projectId !== expected.projectId
    || result.scope.editSessionId !== expected.editSessionId
    || result.scope.approvedSnapshotId !== expected.approvedSnapshotId
    || result.approvedWorkItemRef.id !== expected.approvedWorkItemId
    || result.output.outputId !== expected.outputId
    || outputFrame.id !== expectedFrame.id
    || outputFrame.version !== expectedFrame.version
    || outputFrame.contentHash !== expectedFrame.contentHash
    || (expected.requireCompleteRequestedRangeCoverage
      && (!result.completeRequestedRangeSemanticCoverageVerified
        || result.incompleteRangeCount !== 0))
    || result.providerCapabilityId !== 'visual_intelligence'
    || result.providerOperationId !== 'visual_intelligence.inspect_edit'
    || result.providerProfile !== 'final_render_visual_qa'
    || result.actualVisualIntelligenceInferenceVerified !== true
    || result.semanticModelEveryTimelineFrameInspectedClaimed !== false
    || result.semanticModelExactPixelInspectionClaimed !== false
    || result.deterministicEveryFrameTechnicalQaRemainsSeparate !== true
    || result.qwenVisualFallbackUsed !== false
  ) {
    throw new ApiError(
      'APPROVED_SNAPSHOT_REQUIRED',
      'Visual Intelligence result diverged from the exact approved Caption output.',
      409,
      {
        requiredGate:
          'canonical_caption_postrender_visual_intelligence_exact_owner_lineage',
      },
    )
  }
}
