import type {
  VisualInspectionRequirement,
  VisualIntelligenceEvidenceRef,
} from '../../src/types/visual-intelligence'
import type { ServiceContext } from '../types'
import {
  parseVisualInspectionRequirement,
  parseVisualIntelligenceSpatialEvidence,
} from '../visual-intelligence/visual-intelligence-contract'
import type {
  VisualIntelligenceInspectionCoordinator,
} from '../visual-intelligence/visual-intelligence-inspection-coordinator'
import type {
  VisualIntelligenceSpatialEvidenceRepository,
} from '../visual-intelligence/visual-intelligence-lifecycle-service'
import {
  prepareCanonicalCaptionPostrenderVisualQaExecution,
} from '../services/canonical-caption-postrender-visual-qa-coordinator-service'
import {
  type FinalizeCanonicalCaptionPostrenderVisualIntelligenceInput,
  createCanonicalCaptionPostrenderVisualIntelligenceOwnerService,
} from '../services/canonical-caption-postrender-visual-intelligence-owner-service'

export const CANONICAL_CAPTION_POSTRENDER_VISUAL_INTELLIGENCE_OWNER_HARNESS_VERSION =
  'canonical-caption-postrender-visual-intelligence-owner-harness-v1' as const

type FinalizationAuthority = Omit<
  FinalizeCanonicalCaptionPostrenderVisualIntelligenceInput,
  'requestRef' | 'reportRef' | 'spatialEvidenceRef'
>

export interface CanonicalCaptionPostrenderVisualIntelligenceOwnerHarnessInput {
  readonly coordinator: Pick<
    VisualIntelligenceInspectionCoordinator,
    'inspect'
  >
  readonly spatialEvidenceRepository: Pick<
    VisualIntelligenceSpatialEvidenceRepository,
    'readAcceptedSpatialEvidenceByReportRef'
  >
  readonly ownerService: Pick<
    ReturnType<
      typeof createCanonicalCaptionPostrenderVisualIntelligenceOwnerService
    >,
    'finalize'
  >
  readonly captionContext: ServiceContext
  readonly requirement: VisualInspectionRequirement
  readonly expectedScope: {
    readonly ownerUserId: string
    readonly workspaceId: string
    readonly projectId: string
    readonly editSessionId: string
    readonly approvedSnapshotId: string
  }
  readonly approvedWorkItemId: string
  readonly captionExecutionInput: Record<string, unknown>
  readonly finalizationAuthority: FinalizationAuthority
}

/**
 * Bounded private-qualification coordinator. It independently executes the
 * already admitted Visual Intelligence owner lifecycle, seals that owner's
 * immutable result, and only then lets the existing Caption reconciliation
 * worker reread it. This module is intentionally isolated under
 * `server/internal-testing`; it is not a route, production scheduler, Caption
 * provider dispatcher, or replacement Orchestra.
 */
export async function executeCanonicalCaptionPostrenderVisualIntelligenceOwnerHarness(
  input: CanonicalCaptionPostrenderVisualIntelligenceOwnerHarnessInput,
) {
  assertDependencies(input)
  const requirement = parseVisualInspectionRequirement(input.requirement)
  if (
    requirement.owningSkillId !== 'captions'
    || requirement.profile !== 'final_render_visual_qa'
    || requirement.owningWorkNodeId !== input.approvedWorkItemId
  ) throw new Error(
    'Caption post-render owner harness received a crossed inspection requirement.',
  )

  const inspection = await input.coordinator.inspect(
    requirement,
    input.expectedScope,
  )
  const spatialValue = await input.spatialEvidenceRepository
    .readAcceptedSpatialEvidenceByReportRef(inspection.reportRef)
  if (!spatialValue) {
    throw new Error(
      'Caption post-render owner harness could not reread spatial evidence.',
    )
  }
  const spatialEvidence = parseVisualIntelligenceSpatialEvidence(spatialValue)
  const spatialEvidenceRef: VisualIntelligenceEvidenceRef = {
    id: spatialEvidence.spatialEvidenceId,
    version: 1,
    contentHash: spatialEvidence.spatialEvidenceDigestSha256,
  }
  if (
    !sameRef(spatialEvidence.reportRef, inspection.reportRef)
    || !sameRef(spatialEvidence.requestRef, requestRef(inspection.request))
  ) throw new Error(
    'Caption post-render owner harness spatial evidence crossed the inspection.',
  )

  const ownerFinalization = await input.ownerService.finalize({
    ...structuredClone(input.finalizationAuthority),
    requestRef: requestRef(inspection.request),
    reportRef: structuredClone(inspection.reportRef),
    spatialEvidenceRef,
  })
  if (
    ownerFinalization.providerCallMadeByFinalizer
    || ownerFinalization.timelineOrAssetMutationPerformed
    || ownerFinalization.qaApprovalGranted
    || ownerFinalization.repairExecutionGranted
    || ownerFinalization.billingOrPublicAuthorityGranted
    || inspection.visualIntelligenceMutatedEdit
    || inspection.qwenVisualFallbackUsed
  ) throw new Error(
    'Caption post-render owner harness observed an authority-boundary violation.',
  )
  const captionExecutionInput = {
    context: input.captionContext,
    actorUserId: input.expectedScope.ownerUserId,
    workspaceId: input.expectedScope.workspaceId,
    projectId: input.expectedScope.projectId,
    editSessionId: input.expectedScope.editSessionId,
    approvedSnapshotId: input.expectedScope.approvedSnapshotId,
    approvedWorkItemId: input.approvedWorkItemId,
    executionInput: structuredClone(input.captionExecutionInput),
  }
  const captionReconciliation =
    await prepareCanonicalCaptionPostrenderVisualQaExecution(
      captionExecutionInput,
    )
  const captionReconciliationReplay =
    await prepareCanonicalCaptionPostrenderVisualQaExecution(
      captionExecutionInput,
    )
  if (
    captionReconciliation.ownerResult.resultDigestSha256
      !== ownerFinalization.result.resultDigestSha256
    || captionReconciliationReplay.ownerResult.resultDigestSha256
      !== ownerFinalization.result.resultDigestSha256
    || captionReconciliation.disposition !== 'created'
    || captionReconciliationReplay.disposition !== 'idempotent_replay'
    || !captionReconciliation.exactRereadVerified
    || !captionReconciliationReplay.exactRereadVerified
  ) throw new Error(
    'Caption post-render owner harness failed exact reconciliation replay.',
  )

  return Object.freeze({
    schemaVersion:
      CANONICAL_CAPTION_POSTRENDER_VISUAL_INTELLIGENCE_OWNER_HARNESS_VERSION,
    inspection,
    ownerFinalization,
    captionReconciliation,
    captionReconciliationReplay,
    internalQualificationHarnessOnly: true as const,
    requestPackageAndProviderLifecycleOwnedByVisualIntelligence: true as const,
    ownerResultCreatedBeforeCaptionReconciliation: true as const,
    exactOwnerResultRereadByCaption: true as const,
    exactCaptionEvidenceCreateOnlyReplayVerified: true as const,
    directPeerDispatchPerformedByCaption: false as const,
    providerCallMadeByCaption: false as const,
    providerCallMadeByOwnerFinalizer: false as const,
    timelineOrAssetMutationPerformedByHarness: false as const,
    finalQaApprovalGrantedByHarness: false as const,
    billingOrCreditMutationPerformedByHarness: false as const,
    publicDeliveryCreated: false as const,
    productionAuthorityGranted: false as const,
  })
}

function requestRef(
  request: Awaited<ReturnType<
    VisualIntelligenceInspectionCoordinator['inspect']
  >>['request'],
): VisualIntelligenceEvidenceRef {
  return Object.freeze({
    id: request.requestId,
    version: 1,
    contentHash: request.requestDigestSha256,
  })
}

function sameRef(
  left: VisualIntelligenceEvidenceRef,
  right: VisualIntelligenceEvidenceRef,
): boolean {
  return left.id === right.id
    && left.version === right.version
    && left.contentHash === right.contentHash
}

function assertDependencies(
  input: CanonicalCaptionPostrenderVisualIntelligenceOwnerHarnessInput,
): void {
  if (
    !input.coordinator
    || typeof input.coordinator.inspect !== 'function'
    || !input.spatialEvidenceRepository
    || typeof input.spatialEvidenceRepository
      .readAcceptedSpatialEvidenceByReportRef !== 'function'
    || !input.ownerService
    || typeof input.ownerService.finalize !== 'function'
  ) throw new Error(
    'Caption post-render owner harness dependencies are unavailable.',
  )
}
