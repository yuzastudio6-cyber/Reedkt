import type { JSONObject } from '../../src/types'
import {
  isBoundedAdapterModelWeightApprovalSource,
  isBoundedAdapterPackageReadinessEvidenceSource,
  type BoundedAdapterModelWeightApprovalSource,
  type BoundedAdapterPackageReadinessEvidenceSource,
  type BoundedAdapterPackageReadinessStatus,
  type BoundedAdapterModelWeightApprovalStatus,
} from '../../src/types/bounded-adapter-source-truth'
import type { ProductionToolId } from './production-tool-types'
import {
  createProfessionalToolAdapterBoundedExecutionGate,
  type ProfessionalToolAdapterBoundedExecutionGate,
} from './professional-tool-adapter-plan'
import {
  normalizeRequestedToolName,
  resolveProfessionalToolAdapterContract,
} from './professional-tool-adapter-contracts'

export type ProfessionalToolAdapterReadinessEvidenceStatus = BoundedAdapterPackageReadinessStatus

export type ProfessionalToolAdapterReadinessEvidenceSource = BoundedAdapterPackageReadinessEvidenceSource

export interface ProfessionalToolAdapterPackageReadinessEvidence {
  toolId: ProductionToolId | string
  status: ProfessionalToolAdapterReadinessEvidenceStatus
  source: ProfessionalToolAdapterReadinessEvidenceSource
  evidenceId: string
  checkedAt: string
  summary?: string
}

export interface ProfessionalToolAdapterModelWeightApprovalEvidence {
  toolId: ProductionToolId | string
  approvalStatus: BoundedAdapterModelWeightApprovalStatus
  source: BoundedAdapterModelWeightApprovalSource
  manifestId: string
  checkedAt: string
  summary?: string
}

export interface ProfessionalToolAdapterSourceTruthReviewInput {
  workspaceId: string
  projectId: string
  requestedToolNames: string[]
  approvedPlanSnapshotId: string
  creditEstimateId?: string
  creditReservationId?: string
  privateArtifactRefs?: JSONObject[]
  packageReadinessEvidence?: ProfessionalToolAdapterPackageReadinessEvidence[]
  modelWeightApprovals?: ProfessionalToolAdapterModelWeightApprovalEvidence[]
}

export interface ProfessionalToolAdapterSourceTruthEvidenceReview {
  id: string
  workspaceId: string
  projectId: string
  status: 'ready_for_bounded_execution' | 'blocked'
  requestedToolCount: number
  resolvedToolCount: number
  packageReadyToolIds: ProductionToolId[]
  modelWeightApprovedToolIds: ProductionToolId[]
  acceptedPackageEvidenceCount: number
  acceptedModelWeightApprovalCount: number
  rejectedEvidenceCount: number
  blockers: string[]
  clientReadinessHintsTrusted: false
  serverSourceTruthRequired: true
  frontendExecutionAllowed: false
  productReady: false
  userFacingSummary: string
  internalExecutionSummary: string
  noRuntimeSideEffects: string[]
  boundedAdapterExecutionGate: ProfessionalToolAdapterBoundedExecutionGate
}

function unique<T extends string>(values: T[]): T[] {
  return Array.from(new Set(values))
}

function canonicalToolId(value: string): ProductionToolId | undefined {
  return resolveProfessionalToolAdapterContract(value)?.canonicalToolId
}

function normalizeToolId(value: string): string {
  return normalizeRequestedToolName(value)
}

export function createProfessionalToolAdapterSourceTruthEvidenceReview(
  input: ProfessionalToolAdapterSourceTruthReviewInput,
): ProfessionalToolAdapterSourceTruthEvidenceReview {
  const requestedToolIds = unique(input.requestedToolNames
    .map((name) => canonicalToolId(name))
    .filter((toolId): toolId is ProductionToolId => Boolean(toolId)))
  const requestedToolIdSet = new Set(requestedToolIds.map(normalizeToolId))
  const blockers: string[] = []
  const rejectedEvidence: string[] = []

  const packageReadyToolIds = unique((input.packageReadinessEvidence ?? [])
    .flatMap((evidence) => {
      const canonical = canonicalToolId(String(evidence.toolId))
      if (!canonical || !requestedToolIdSet.has(normalizeToolId(canonical))) {
        rejectedEvidence.push(`${evidence.toolId} package readiness evidence is not scoped to this approved adapter package.`)
        return []
      }
      if (evidence.status !== 'passed') {
        blockers.push(`${canonical} package/runtime readiness evidence is ${evidence.status}.`)
        return []
      }
      if (!isBoundedAdapterPackageReadinessEvidenceSource(evidence.source)) {
        rejectedEvidence.push(`${canonical} package readiness evidence source is not approved for backend source-truth review.`)
        return []
      }
      if (!evidence.evidenceId.trim() || !evidence.checkedAt.trim()) {
        rejectedEvidence.push(`${canonical} package readiness evidence is missing evidenceId or checkedAt.`)
        return []
      }
      return [canonical]
    }))

  const modelWeightApprovedToolIds = unique((input.modelWeightApprovals ?? [])
    .flatMap((approval) => {
      const canonical = canonicalToolId(String(approval.toolId))
      if (!canonical || !requestedToolIdSet.has(normalizeToolId(canonical))) {
        rejectedEvidence.push(`${approval.toolId} model-weight approval is not scoped to this approved adapter package.`)
        return []
      }
      if (approval.approvalStatus !== 'approved') {
        blockers.push(`${canonical} model/checkpoint approval is ${approval.approvalStatus}.`)
        return []
      }
      if (!isBoundedAdapterModelWeightApprovalSource(approval.source)) {
        rejectedEvidence.push(`${canonical} model-weight approval source is not approved for backend source-truth review.`)
        return []
      }
      if (!approval.manifestId.trim() || !approval.checkedAt.trim()) {
        rejectedEvidence.push(`${canonical} model-weight approval is missing manifestId or checkedAt.`)
        return []
      }
      return [canonical]
    }))

  const boundedAdapterExecutionGate = createProfessionalToolAdapterBoundedExecutionGate({
    workspaceId: input.workspaceId,
    projectId: input.projectId,
    requestedToolNames: input.requestedToolNames,
    evidence: {
      approvedPlanSnapshotId: input.approvedPlanSnapshotId,
      creditEstimateId: input.creditEstimateId,
      creditReservationId: input.creditReservationId,
      privateArtifactRefs: input.privateArtifactRefs,
      packageReadyToolIds,
      modelWeightApprovedToolIds,
    },
  })
  const status = boundedAdapterExecutionGate.status

  return {
    id: `professional-tool-adapter-source-truth-review-${input.projectId}`,
    workspaceId: input.workspaceId,
    projectId: input.projectId,
    status,
    requestedToolCount: input.requestedToolNames.length,
    resolvedToolCount: boundedAdapterExecutionGate.resolvedToolCount,
    packageReadyToolIds,
    modelWeightApprovedToolIds,
    acceptedPackageEvidenceCount: packageReadyToolIds.length,
    acceptedModelWeightApprovalCount: modelWeightApprovedToolIds.length,
    rejectedEvidenceCount: rejectedEvidence.length,
    blockers: unique([
      ...blockers,
      ...rejectedEvidence,
      ...boundedAdapterExecutionGate.blockers,
    ]),
    clientReadinessHintsTrusted: false,
    serverSourceTruthRequired: true,
    frontendExecutionAllowed: false,
    productReady: false,
    userFacingSummary: status === 'ready_for_bounded_execution'
      ? 'Backend readiness evidence is complete for the next bounded edit activity execution gate.'
      : 'Some edit activities still need backend readiness, package, private artifact, credit, or model approval evidence before bounded execution.',
    internalExecutionSummary: [
      `Accepted package readiness evidence for ${packageReadyToolIds.length} adapter(s).`,
      `Accepted model/checkpoint approval evidence for ${modelWeightApprovedToolIds.length} adapter(s).`,
      `Rejected evidence count: ${rejectedEvidence.length}.`,
      boundedAdapterExecutionGate.internalExecutionSummary,
    ].join(' '),
    noRuntimeSideEffects: [
      'Source-truth evidence review does not import packages, execute binaries, load model weights, process media, render, call providers, write Supabase/GCS, or bill users.',
      'Client-supplied package/model readiness hints remain untrusted; only backend-owned readiness records are accepted here.',
      ...boundedAdapterExecutionGate.noRuntimeSideEffects,
    ],
    boundedAdapterExecutionGate,
  }
}
