import type {
  VisualInspectionRequirement,
  VisualInspectionResult,
  VisualIntelligenceEvidenceRef,
  VisualIntelligenceReport,
  VisualIntelligenceRequest,
} from '../../src/types/visual-intelligence'
import { ApiError } from '../errors/api-error'
import {
  createVisualInspectionResult,
  parseVisualInspectionRequirement,
  parseVisualIntelligenceReport,
  parseVisualIntelligenceRequest,
} from './visual-intelligence-contract'
import {
  getVisualIntelligenceProfileDefinition,
} from './visual-intelligence-profile-registry'
import type {
  VisualIntelligenceExecutionOutcome,
  VisualIntelligenceLifecycleService,
} from './visual-intelligence-lifecycle-service'

export const VISUAL_INTELLIGENCE_INSPECTION_COORDINATOR_VERSION =
  'visual-intelligence-inspection-coordinator-v1' as const

export interface VisualIntelligenceInspectionRequestOwner {
  prepareApprovedEditInspectionRequest(input: {
    readonly requirement: VisualInspectionRequirement
  }): Promise<VisualIntelligenceRequest>
}

export interface VisualIntelligenceInspectionOutcome {
  readonly schemaVersion:
    typeof VISUAL_INTELLIGENCE_INSPECTION_COORDINATOR_VERSION
  readonly requirement: VisualInspectionRequirement
  readonly request: VisualIntelligenceRequest
  readonly report: VisualIntelligenceReport
  readonly reportRef: VisualIntelligenceEvidenceRef
  readonly result: VisualInspectionResult
  readonly lifecycleDisposition: VisualIntelligenceExecutionOutcome['status']
  readonly exactApprovedSnapshotRereadVerified: true
  readonly exactPrivatePreviewRereadVerified: true
  readonly expectedOutcomeLineageVerified: true
  readonly deterministicGpuEvidenceVerified: true
  readonly substantiveCpuMediaProcessingUsed: false
  readonly providerCallMadeDuringInvocation: boolean
  readonly costSettledDuringInvocation: boolean
  readonly duplicateProviderCallAvoided: boolean
  readonly duplicateCostSettlementAvoided: boolean
  readonly qwenVisualFallbackUsed: false
  readonly visualIntelligenceMutatedEdit: false
}

export interface VisualIntelligenceInspectionCoordinator {
  inspect(
    requirement: VisualInspectionRequirement,
    expectedScope?: {
      readonly ownerUserId: string
      readonly workspaceId: string
      readonly projectId: string
      readonly editSessionId: string
      readonly approvedSnapshotId: string
    },
  ): Promise<VisualIntelligenceInspectionOutcome>
}

/**
 * Runs one approved, owner-scoped visual inspection and routes a repair
 * decision back to that owner. It never edits the timeline itself. A third
 * automatic repair cycle is structurally impossible; cycle two stops spend
 * and requires planning or human review when the defect remains.
 */
export function createVisualIntelligenceInspectionCoordinator(input: {
  readonly requestOwner: VisualIntelligenceInspectionRequestOwner
  readonly lifecycle: VisualIntelligenceLifecycleService
}): VisualIntelligenceInspectionCoordinator {
  if (
    !input.requestOwner
    || typeof input.requestOwner.prepareApprovedEditInspectionRequest
      !== 'function'
    || !input.lifecycle
    || typeof input.lifecycle.execute !== 'function'
  ) throw notReady('visual_intelligence_inspection_coordinator_invalid')

  return Object.freeze({
    async inspect(
      untrustedRequirement: VisualInspectionRequirement,
      expectedScope: Parameters<
        VisualIntelligenceInspectionCoordinator['inspect']
      >[1],
    ) {
      try {
        const requirement = parseVisualInspectionRequirement(
          untrustedRequirement,
        )
        const request = parseVisualIntelligenceRequest(
          await input.requestOwner.prepareApprovedEditInspectionRequest({
            requirement,
          }),
        )
        if (expectedScope && !sameScope(request.scope, expectedScope)) {
          throw notReady('visual_intelligence_inspection_scope_mismatch')
        }
        validateInspectionRequest(requirement, request)
        const lifecycle = await input.lifecycle.execute(request)
        const report = parseVisualIntelligenceReport(lifecycle.report)
        validateInspectionReport(requirement, request, report, lifecycle)
        const needsRepair = report.disposition === 'needs_revision'
        const blocked = report.disposition === 'blocked'
        const exhausted = needsRepair && requirement.currentRepairCycle >= 2
        const blocks = needsRepair || blocked
        const inspectionRef = {
          id: requirement.inspectionId,
          version: 1,
          contentHash: requirement.inspectionDigestSha256,
        }
        const result = createVisualInspectionResult({
          schemaVersion: 'visual-inspection-result-v1',
          inspectionRef,
          reportRef: lifecycle.reportRef,
          disposition: report.disposition,
          owningSkillId: requirement.owningSkillId,
          findingIds: report.findings.map((finding) => finding.findingId),
          repairCycle: requirement.currentRepairCycle,
          routeToOwningSkill: needsRepair,
          automaticRepairAllowed: needsRepair && !exhausted,
          automaticSpendStopped: blocked || exhausted,
          blocksNextWorkNode: blocks && requirement.blocksNextWorkNode,
          blocksPreview: blocks && requirement.blocksPreview,
          blocksFinalExport: blocks && requirement.blocksFinalExport,
          planningOrHumanReviewRequired: blocked || exhausted,
          visualIntelligenceMutatedEdit: false,
        })
        return Object.freeze({
          schemaVersion: VISUAL_INTELLIGENCE_INSPECTION_COORDINATOR_VERSION,
          requirement,
          request,
          report,
          reportRef: lifecycle.reportRef,
          result,
          lifecycleDisposition: lifecycle.status,
          exactApprovedSnapshotRereadVerified: true as const,
          exactPrivatePreviewRereadVerified: true as const,
          expectedOutcomeLineageVerified: true as const,
          deterministicGpuEvidenceVerified: true as const,
          substantiveCpuMediaProcessingUsed: false as const,
          providerCallMadeDuringInvocation:
            lifecycle.providerCallMadeDuringInvocation,
          costSettledDuringInvocation: lifecycle.costSettledDuringInvocation,
          duplicateProviderCallAvoided: lifecycle.duplicateProviderCallAvoided,
          duplicateCostSettlementAvoided:
            lifecycle.duplicateCostSettlementAvoided,
          qwenVisualFallbackUsed: false as const,
          visualIntelligenceMutatedEdit: false as const,
        })
      } catch (error) {
        if (error instanceof ApiError) throw error
        throw notReady(
          'visual_intelligence_inspection_input_or_result_invalid',
          error,
        )
      }
    },
  })
}

function validateInspectionRequest(
  requirement: VisualInspectionRequirement,
  request: VisualIntelligenceRequest,
): void {
  const admission = request.admission
  const preview = request.sourceArtifacts[0]
  const profile = getVisualIntelligenceProfileDefinition(
    'inspect_edit',
    requirement.profile,
  )
  if (
    request.operation !== 'inspect_edit'
    || request.profile !== requirement.profile
    || admission.mode !== 'approved_edit_inspection'
    || request.scope.approvedSnapshotId === null
    || admission.approvedPlanSnapshotRef.id
      !== request.scope.approvedSnapshotId
    || request.sourceArtifacts.length !== 1
    || request.comparisonArtifacts.length !== 0
    || !preview
    || admission.privatePreviewArtifactRef.id !== preview.artifactId
    || request.outputFrame === null
    || !sameRanges(request.requestedRanges, requirement.requestedRanges)
    || !sameRefs(request.expectedOutcomeRefs,
      requirement.expectedOutcomeRefs)
    || !sameRefs(admission.expectedOutcomeRefs,
      requirement.expectedOutcomeRefs)
    || !admission.workNodeRefs.some(
      (ref) => ref.id === requirement.owningWorkNodeId,
    )
    || request.requestedRanges.some((range) => (
      range.frameRate.numerator !== request.outputFrame!.frameRate.numerator
      || range.frameRate.denominator
        !== request.outputFrame!.frameRate.denominator
    ))
    || profile.toolPolicies.some((policy) => (
      policy.requirement === 'required'
      && policy.executionClass === 'managed_provider_control_plane'
    ))
  ) throw notReady('visual_intelligence_inspection_request_mismatch')
}

function validateInspectionReport(
  requirement: VisualInspectionRequirement,
  request: VisualIntelligenceRequest,
  report: VisualIntelligenceReport,
  lifecycle: VisualIntelligenceExecutionOutcome,
): void {
  const requiredTools = getVisualIntelligenceProfileDefinition(
    'inspect_edit',
    requirement.profile,
  ).toolPolicies.filter((policy) => policy.requirement === 'required')
  const source = request.sourceArtifacts[0]!
  if (
    report.requestRef.id !== request.requestId
    || report.requestRef.version !== 1
    || report.requestRef.contentHash !== request.requestDigestSha256
    || refKey(lifecycle.reportRef)
      !== `${report.reportId}:1:${report.reportDigestSha256}`
    || report.provenance.requestDigestSha256
      !== request.requestDigestSha256
    || report.operation !== request.operation
    || report.profile !== request.profile
    || !sameScope(report.scope, request.scope)
    || report.sourceArtifacts.length !== 1
    || report.sourceArtifacts[0]?.artifactId !== source.artifactId
    || report.sourceArtifacts[0]?.checksumSha256 !== source.checksumSha256
    || report.sourceArtifacts[0]?.durationFrames !== source.durationFrames
    || report.comparisonArtifacts.length !== 0
    || !sameRanges(report.coverage.requestedRanges,
      requirement.requestedRanges)
    || !report.coverage.completeRequestedRangeCoverage
    || report.coverage.incompleteRanges.length !== 0
    || report.coverage.everyTimelineFrameInspected
    || report.coverage.completeTimePixelInspectionClaimAllowed
    || !sameRefs(report.expectedOutcomeRefs,
      requirement.expectedOutcomeRefs)
    || report.planningMayConsumeValidatedEvidence
    || report.directTimelineMutationAllowed
    || report.renderPerformedByVisualIntelligence
    || report.exportAuthorized
    || report.deliveryAuthorized
    || report.provenance.exactModelId !== 'gemini-3.1-pro-preview'
    || report.provenance.thinkingLevel !== 'high'
    || report.provenance.mediaResolution !== 'high'
    || report.provenance.providerToolsUsed
    || report.provenance.searchGroundingUsed
    || report.provenance.urlContextUsed
    || report.provenance.codeExecutionUsed
    || !report.usage.billingAccountEffectiveRateUsed
    || report.usage.publicListPriceUsed
    || report.usage.duplicateSettlementPerformed
    || report.usage.costEvidenceRef === null
    || report.usage.settledCostMicros === null
    || (report.disposition === 'needs_revision'
      && !report.reinspectionRequired)
    || requiredTools.some((policy) => !report.deterministicToolExecutions.some(
      (execution) => execution.tool === policy.tool
        && execution.requirement === 'required'
        && execution.executionClass === policy.executionClass
        && execution.substantiveCpuExecutionUsed === false
        && execution.sourceArtifactChecksumBound === true,
    ))
  ) throw notReady('visual_intelligence_inspection_report_mismatch')
}

function sameScope(
  left: VisualIntelligenceReport['scope'],
  right: VisualIntelligenceRequest['scope'],
): boolean {
  return left.ownerUserId === right.ownerUserId
    && left.workspaceId === right.workspaceId
    && left.projectId === right.projectId
    && left.editSessionId === right.editSessionId
    && left.approvedSnapshotId === right.approvedSnapshotId
}

function sameRefs(
  left: readonly VisualIntelligenceEvidenceRef[],
  right: readonly VisualIntelligenceEvidenceRef[],
): boolean {
  return left.length === right.length
    && left.every((value, index) => refKey(value) === refKey(right[index]!))
}

function sameRanges(
  left: readonly VisualInspectionRequirement['requestedRanges'][number][],
  right: readonly VisualInspectionRequirement['requestedRanges'][number][],
): boolean {
  return left.length === right.length
    && left.every((value, index) => {
      const expected = right[index]!
      return value.startFrame === expected.startFrame
        && value.endFrameExclusive === expected.endFrameExclusive
        && value.frameRate.numerator === expected.frameRate.numerator
        && value.frameRate.denominator === expected.frameRate.denominator
    })
}

function refKey(value: VisualIntelligenceEvidenceRef): string {
  return `${value.id}:${value.version}:${value.contentHash}`
}

function notReady(requiredGate: string, cause?: unknown): ApiError {
  return new ApiError(
    'TOOL_NOT_READY',
    'The approved-edit Visual Intelligence inspection is not ready.',
    503,
    { requiredGate },
    cause === undefined ? {} : { cause },
  )
}
