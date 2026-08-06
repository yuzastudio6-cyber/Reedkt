import type {
  MotionStudioDeliveryHandoffV1,
  MotionStudioFineCutManifestV1,
  MotionStudioFineCutReviewDecisionV1,
  MotionStudioFineCutWorkspaceDtoV1,
  MotionStudioPrivateReviewBindingV1,
  MotionStudioQualityControlGateResultV1,
  MotionStudioQualityControlReportV1,
} from '../../../src/types/motion-studio'
import {
  MOTION_STUDIO_FINE_CUT_MANIFEST_VERSION,
  MOTION_STUDIO_FINE_CUT_WORKSPACE_DTO_VERSION,
  MOTION_STUDIO_QUALITY_CONTROL_REPORT_VERSION,
} from '../../../src/types/motion-studio'
import {
  motionStudioFineCutManifestV1Schema,
  motionStudioFineCutWorkspaceDtoV1Schema,
  motionStudioQualityControlReportV1Schema,
} from '../../../src/lib/motion-studio/contracts/fine-cut'
import { sha256CanonicalJson } from '../commands/canonical-json'

type FineCutDerivedField =
  | 'schemaVersion'
  | 'sourceAuthorityDigest'
  | 'invalidationState'
  | 'fineCutEligible'
  | 'eligibilityDerivedBy'
  | 'immutable'
  | 'timelineMutationAllowed'
  | 'providerCallAllowed'
  | 'exportAllowed'
  | 'publicDeliveryAllowed'
  | 'productReady'
  | 'createdAt'

export interface MotionStudioFineCutCompilerInputV1 {
  candidate: Omit<MotionStudioFineCutManifestV1, FineCutDerivedField>
  sourceRevalidation: {
    evidenceClass: 'canonical_backend_verified_runtime'
    releaseClass: 'private_fine_cut_release'
    exactCurrentAuthorityReverified: true
    approvedSnapshotReverified: true
    timelineAndRenderManifestReverified: true
    integratedAudioAcceptanceReverified: true
    requiredAssetsAndQaReverified: true
    rightsConsentProvenanceReverified: true
    internalCostReconciled: true
    noRequiredPlaceholder: true
    sourceAuthorityDigest: string
  }
  compiledAt: string
}

export interface MotionStudioFineCutCompilerResultV1 {
  manifest: MotionStudioFineCutManifestV1
  manifestDigest: string
}

export function compileMotionStudioFineCutManifestV1(
  input: MotionStudioFineCutCompilerInputV1,
): MotionStudioFineCutCompilerResultV1 {
  assertReleasedSource(input.sourceRevalidation)
  const manifest = motionStudioFineCutManifestV1Schema.parse({
    ...input.candidate,
    schemaVersion: MOTION_STUDIO_FINE_CUT_MANIFEST_VERSION,
    sourceAuthorityDigest: input.sourceRevalidation.sourceAuthorityDigest,
    invalidationState: 'current_no_unresolved_invalidation',
    fineCutEligible: true,
    eligibilityDerivedBy: 'motion_studio_fine_cut_compiler_v1',
    immutable: true,
    timelineMutationAllowed: false,
    providerCallAllowed: false,
    exportAllowed: false,
    publicDeliveryAllowed: false,
    productReady: false,
    createdAt: input.compiledAt,
  })
  return {
    manifest,
    manifestDigest: sha256CanonicalJson(manifest),
  }
}

type QualityDerivedField =
  | 'schemaVersion'
  | 'reviewDecisionId'
  | 'allRequiredGatesPresentExactlyOnce'
  | 'allBlockingGatesPassed'
  | 'allWarningsAcknowledged'
  | 'status'
  | 'deliveryEligible'
  | 'humanOverrideOfBlockingQaAllowed'
  | 'customerPriceIncluded'
  | 'customerCreditsIncluded'
  | 'serviceFeeIncluded'
  | 'walletMutationPerformed'
  | 'billingMutationPerformed'
  | 'immutable'

export interface MotionStudioQualityControlCompilerInputV1 {
  report: Omit<MotionStudioQualityControlReportV1, QualityDerivedField>
  approvedFineCutDecision: MotionStudioFineCutReviewDecisionV1
}

export function compileMotionStudioQualityControlReportV1(
  input: MotionStudioQualityControlCompilerInputV1,
): {
  report: MotionStudioQualityControlReportV1
  reportDigest: string
} {
  assertApprovedFineCutDecision(input.report, input.approvedFineCutDecision)
  const gateState = deriveQualityGateState(input.report.gateResults)
  const overBudget = input.report.reconciledActualInternalCostMicros >
    input.report.approvedMaximumInternalCostMicros
  const status = !gateState.allBlockingPassed || overBudget
    ? 'blocked'
    : gateState.allWarningsAcknowledged
      ? 'passed'
      : 'warnings_require_acknowledgement'
  const report = motionStudioQualityControlReportV1Schema.parse({
    ...input.report,
    schemaVersion: MOTION_STUDIO_QUALITY_CONTROL_REPORT_VERSION,
    reviewDecisionId: input.approvedFineCutDecision.decisionId,
    allRequiredGatesPresentExactlyOnce: true,
    allBlockingGatesPassed: gateState.allBlockingPassed && !overBudget,
    allWarningsAcknowledged: gateState.allWarningsAcknowledged,
    status,
    deliveryEligible: status === 'passed',
    humanOverrideOfBlockingQaAllowed: false,
    customerPriceIncluded: false,
    customerCreditsIncluded: false,
    serviceFeeIncluded: false,
    walletMutationPerformed: false,
    billingMutationPerformed: false,
    immutable: true,
  })
  return {
    report,
    reportDigest: sha256CanonicalJson(report),
  }
}

export interface MotionStudioFineCutWorkspaceStateInputV1 {
  productionId: string
  accessState?: 'access_denied' | 'not_found' | 'unavailable'
  preparationState?: 'not_started' | 'preparing' | 'rendering' | 'failed' |
    'reconciliation_required' | 'cancelled'
  fineCut?: MotionStudioFineCutManifestV1
  privateReview?: MotionStudioPrivateReviewBindingV1
  reviewDecision?: MotionStudioFineCutReviewDecisionV1
  qualityControl?: MotionStudioQualityControlReportV1
  deliveryHandoff?: MotionStudioDeliveryHandoffV1
  currentAuthorityMatches: boolean
  existingPrivateExportComplete?: boolean
  recovery?: {
    retryAvailable: boolean
    resumeAvailable: boolean
    reconciliationRequired: boolean
    preservedInput: boolean
  }
}

export function deriveMotionStudioFineCutWorkspaceDtoV1(
  input: MotionStudioFineCutWorkspaceStateInputV1,
): MotionStudioFineCutWorkspaceDtoV1 {
  if (input.accessState) return workspace(input, input.accessState)
  if (input.fineCut && !input.currentAuthorityMatches) return workspace(input, 'stale')
  if (input.existingPrivateExportComplete && input.deliveryHandoff) {
    return workspace(input, 'private_complete')
  }
  if (input.deliveryHandoff) return workspace(input, 'delivery_ready')
  if (input.qualityControl?.status === 'blocked') {
    return workspace(input, 'quality_control_blocked')
  }
  if (input.qualityControl?.status === 'warnings_require_acknowledgement') {
    return workspace(input, 'quality_control_blocked')
  }
  if (input.reviewDecision?.decision === 'approve') {
    return workspace(input, 'approved_locked')
  }
  if (input.reviewDecision) {
    return workspace(input, 'changes_requested')
  }
  if (input.privateReview) return workspace(input, 'ready_for_review')
  const state = input.preparationState ?? 'not_started'
  return workspace(
    input,
    state === 'not_started' ? 'empty' : state,
  )
}

function workspace(
  input: MotionStudioFineCutWorkspaceStateInputV1,
  state: MotionStudioFineCutWorkspaceDtoV1['state'],
): MotionStudioFineCutWorkspaceDtoV1 {
  const comments = input.reviewDecision?.commentIds.length ?? 0
  const unresolved = input.reviewDecision?.unresolvedActionRequiredCommentIds.length ?? 0
  const failedGates = input.qualityControl?.gateResults.filter((gate) =>
    gate.blocking && gate.status !== 'passed').length ?? 0
  const warnings = input.qualityControl?.gateResults.filter((gate) =>
    gate.status === 'warning').length ?? 0
  const primaryAction = state === 'ready_for_review'
    ? 'load_private_review'
    : state === 'changes_requested' || state === 'stale'
      ? 'review_changes'
      : state === 'quality_control_blocked' &&
          input.qualityControl?.status === 'warnings_require_acknowledgement'
        ? 'acknowledge_warnings'
        : state === 'failed' && input.recovery?.retryAvailable
          ? 'retry_preparation'
          : state === 'cancelled' && input.recovery?.resumeAvailable
            ? 'resume_preparation'
            : state === 'reconciliation_required'
              ? 'reconcile_result'
        : state === 'approved_locked' && !input.qualityControl
          ? 'continue_in_chat'
          : state === 'delivery_ready'
            ? 'prepare_delivery'
            : ['private_complete', 'access_denied', 'not_found', 'unavailable'].includes(state)
              ? 'none'
              : 'continue_in_chat'
  return motionStudioFineCutWorkspaceDtoV1Schema.parse({
    schemaVersion: MOTION_STUDIO_FINE_CUT_WORKSPACE_DTO_VERSION,
    productionId: input.productionId,
    state,
    ...(input.fineCut
      ? {
          currentFineCut: {
            versionId: input.fineCut.fineCutVersionId,
            version: input.fineCut.fineCutVersion,
            reviewable: Boolean(input.privateReview && input.currentAuthorityMatches),
            locked: input.reviewDecision?.decision === 'approve',
          },
        }
      : {}),
    ...(input.privateReview || input.reviewDecision
      ? {
          review: {
            mediaReady: Boolean(input.privateReview),
            commentCount: comments,
            unresolvedActionRequiredCommentCount: unresolved,
            ...(input.reviewDecision ? { decision: input.reviewDecision.decision } : {}),
          },
        }
      : {}),
    ...(input.qualityControl
      ? {
          qualityControl: {
            status: input.qualityControl.status,
            blockingFailureCount: failedGates,
            warningCount: warnings,
          },
        }
      : {}),
    ...(input.deliveryHandoff || input.existingPrivateExportComplete
      ? {
          delivery: {
            readyForExistingExportSystem: Boolean(input.deliveryHandoff),
            privateComplete: Boolean(input.existingPrivateExportComplete),
          },
        }
      : {}),
    ...(input.recovery ? { recovery: input.recovery } : {}),
    primaryAction,
    message: workspaceMessage(state),
    privateOnly: true,
    providerCallAllowed: false,
    timelineMutationAllowed: false,
    renderStartAllowedFromWorkspace: false,
    exportStartAllowedFromWorkspace: false,
    publicDeliveryAllowed: false,
    customerCommercialAuthority: false,
  })
}

function deriveQualityGateState(gates: readonly MotionStudioQualityControlGateResultV1[]) {
  return {
    allBlockingPassed: gates.every((gate) => !gate.blocking || gate.status === 'passed'),
    allWarningsAcknowledged: gates
      .filter((gate) => gate.status === 'warning')
      .every((gate) => Boolean(gate.warningAcknowledgementId)),
  }
}

function assertReleasedSource(
  input: MotionStudioFineCutCompilerInputV1['sourceRevalidation'],
): void {
  if (!/^[a-f0-9]{64}$/u.test(input.sourceAuthorityDigest)) {
    throw new Error('Fine Cut source authority must be an exact SHA-256 digest.')
  }
  if (
    input.evidenceClass !== 'canonical_backend_verified_runtime' ||
    input.releaseClass !== 'private_fine_cut_release' ||
    !input.exactCurrentAuthorityReverified ||
    !input.approvedSnapshotReverified ||
    !input.timelineAndRenderManifestReverified ||
    !input.integratedAudioAcceptanceReverified ||
    !input.requiredAssetsAndQaReverified ||
    !input.rightsConsentProvenanceReverified ||
    !input.internalCostReconciled ||
    !input.noRequiredPlaceholder
  ) throw new Error('Fine Cut compilation requires released, current and fully reverified authority.')
}

function assertApprovedFineCutDecision(
  report: MotionStudioQualityControlCompilerInputV1['report'],
  decision: MotionStudioFineCutReviewDecisionV1,
): void {
  if (
    decision.workspaceId !== report.workspaceId ||
    decision.projectId !== report.projectId ||
    decision.editSessionId !== report.editSessionId ||
    decision.productionId !== report.productionId ||
    decision.fineCutVersionId !== report.fineCutVersionId ||
    decision.decision !== 'approve' ||
    !decision.renderQaPassed ||
    !decision.fineCutLocked ||
    decision.unresolvedActionRequiredCommentIds.length > 0
  ) throw new Error('Quality Control requires the exact current approved and locked Fine Cut decision.')
}

function workspaceMessage(state: MotionStudioFineCutWorkspaceDtoV1['state']): string {
  const messages: Record<MotionStudioFineCutWorkspaceDtoV1['state'], string> = {
    empty: 'Fine Cut has not started. Continue in Chat when the accepted production authorities are ready.',
    preparing: 'The approved private Fine Cut is being prepared.',
    rendering: 'The private review file is rendering from the approved version.',
    failed: 'Fine Cut preparation failed safely. Review the recovery decision in Chat.',
    reconciliation_required: 'The Fine Cut result needs reconciliation before it can be reviewed.',
    cancelled: 'Fine Cut preparation was cancelled without approving or delivering a result.',
    ready_for_review: 'The verified private Fine Cut is ready for your review.',
    changes_requested: 'Your requested changes are preserved and must return through Chat.',
    stale: 'This Fine Cut no longer matches the current approved story authority.',
    approved_locked: 'The current Fine Cut is approved and locked; final Quality Control is still separate.',
    quality_control_blocked: 'Quality Control needs attention before private delivery can continue.',
    delivery_ready: 'The approved Fine Cut passed Quality Control and is ready for the existing private export system.',
    private_complete: 'The exact private Storytelling result is complete in this workspace.',
    access_denied: 'This private Fine Cut is unavailable for the signed-in workspace.',
    not_found: 'The requested Fine Cut could not be found.',
    unavailable: 'Fine Cut state is temporarily unavailable. It is safe to try again.',
  }
  return messages[state]
}
