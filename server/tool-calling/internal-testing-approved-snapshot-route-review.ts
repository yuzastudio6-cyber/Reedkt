import type {
  ToolCallingArtifactType,
  ToolCallingOperationId,
} from './operation-ontology'
import type {
  PipelinePatternId,
} from './pipeline-composer'
import {
  buildToolCallingPlanWithAdapters,
} from './tool-calling-brain'

export const INTERNAL_TESTING_APPROVED_SNAPSHOT_ROUTE_REVIEW_DECISION =
  'internal_testing_approved_snapshot_adapter_route_review_passed_ready_for_worker_payload_dry_run'

export type InternalTestingApprovedSnapshotRouteReviewStatus =
  | 'passed_ready_for_worker_payload_dry_run'
  | 'blocked_missing_approval_or_private_artifacts'

export interface InternalTestingPrivateArtifactReference {
  storageReferenceId: string
  artifactType: ToolCallingArtifactType
  storageUri: string
  source: 'finalized_source_upload' | 'approved_snapshot_manifest' | 'private_review_manifest'
}

export interface InternalTestingApprovedSnapshotRouteReviewInput {
  workspaceId: string
  projectId: string
  editSessionId: string
  approvedPlanSnapshotId?: string
  creditEstimateId?: string
  creditReservationId?: string
  toolExecutionPlanId?: string
  idempotencyKey?: string
  requestedPatternId?: PipelinePatternId
  privateArtifactReferences?: readonly InternalTestingPrivateArtifactReference[]
}

export interface InternalTestingApprovedSnapshotRouteSummary {
  adapterPlanId: string
  operationId: ToolCallingOperationId
  workerType: string
  futureHandler: string
  inputArtifactRefCount: number
  expectedOutputArtifactCount: number
  requiredQualityGateCount: number
  requiredPayloadFields: readonly string[]
  storageReferenceMode: 'private_artifact_references_only'
  approvedSnapshotRequired: true
  rawPromptAllowed: false
  signedUrlAllowed: false
  serviceRoleAllowed: false
  executesTools: false
  mediaProcessingAllowed: false
  payloadDryRunReady: boolean
}

export interface InternalTestingApprovedSnapshotRouteReview {
  decision: typeof INTERNAL_TESTING_APPROVED_SNAPSHOT_ROUTE_REVIEW_DECISION
  status: InternalTestingApprovedSnapshotRouteReviewStatus
  source: 'server_tool_calling_adapter_worker_route_metadata'
  workspaceId: string
  projectId: string
  editSessionId: string
  requestedPatternId: PipelinePatternId
  routeCount: number
  adapterPlanCount: number
  workerRouteBridgePlanCount: number
  privateArtifactReferenceCount: number
  requiredGateCount: number
  blockers: readonly string[]
  routeSummaries: readonly InternalTestingApprovedSnapshotRouteSummary[]
  productReady: false
  blockedScope: {
    frontendToolExecution: false
    rawPromptExecution: false
    publicOrSignedUrlArtifacts: false
    serviceRoleBrowserAccess: false
    providerOrModelCalls: false
    workerDispatch: false
    mediaProcessing: false
    renderOrExport: false
    creditSpend: false
    ledgerWrites: false
    supabaseWrites: false
    externalBeta: false
    paidProduction: false
    productReady: false
  }
}

const requiredGateLabels = [
  'workspaceId',
  'projectId',
  'editSessionId',
  'approvedPlanSnapshotId',
  'creditEstimateId',
  'creditReservationId',
  'toolExecutionPlanId',
  'idempotencyKey',
  'privateArtifactReferences',
] as const

function hasValue(value: string | undefined): boolean {
  return typeof value === 'string' && value.trim().length > 0
}

function isPublicOrSignedArtifactUri(storageUri: string): boolean {
  const normalized = storageUri.toLowerCase()
  return normalized.startsWith('http://') ||
    normalized.startsWith('https://') ||
    normalized.includes('signed') ||
    normalized.includes('signature=') ||
    normalized.includes('token=') ||
    normalized.includes('x-amz-') ||
    normalized.includes('x-goog-signature') ||
    normalized.includes('?')
}

function isPrivateArtifactReference(ref: InternalTestingPrivateArtifactReference): boolean {
  return hasValue(ref.storageReferenceId) &&
    hasValue(ref.storageUri) &&
    !isPublicOrSignedArtifactUri(ref.storageUri) &&
    (
      ref.storageUri.startsWith('private://') ||
      ref.storageUri.startsWith('local-private://') ||
      ref.storageUri.startsWith('storage://private/')
    )
}

function collectBlockers(input: InternalTestingApprovedSnapshotRouteReviewInput): string[] {
  const blockers: string[] = []

  for (const field of requiredGateLabels) {
    if (field === 'privateArtifactReferences') continue
    if (!hasValue(input[field])) blockers.push(`${field}_missing`)
  }

  const privateRefs = input.privateArtifactReferences ?? []
  if (privateRefs.length === 0) {
    blockers.push('privateArtifactReferences_missing')
  }

  if (!privateRefs.some((ref) => ref.artifactType === 'source_media')) {
    blockers.push('source_media_private_artifact_reference_missing')
  }

  for (const ref of privateRefs) {
    if (!isPrivateArtifactReference(ref)) {
      blockers.push(`privateArtifactReference_invalid_${ref.storageReferenceId || 'unknown'}`)
    }
  }

  return [...new Set(blockers)]
}

export function reviewInternalTestingApprovedSnapshotAdapterRoutes(
  input: InternalTestingApprovedSnapshotRouteReviewInput,
): InternalTestingApprovedSnapshotRouteReview {
  const requestedPatternId = input.requestedPatternId ?? 'raw_footage_to_social_short'
  const plan = buildToolCallingPlanWithAdapters({
    projectId: input.projectId,
    mode: 'preview',
    qualityTarget: 'balanced',
    requestedPatternId,
    userPreferenceTags: ['internal_testing', 'approved_snapshot_route_review'],
    mediaContext: {
      mediaTypes: ['video', 'audio'],
      hasAudio: true,
      hasSpeech: true,
      hasMotion: true,
      sourceArtifactTypes: ['source_media'],
      desiredOutputArtifactTypes: ['preview_video', 'qa_report'],
    },
  })
  const blockers = collectBlockers(input)
  const payloadDryRunReady = blockers.length === 0
  const routeSummaries = plan.adapterPlan.adapterPlans.map((adapterPlan) => {
    const workerRoute = plan.workerRouteBridgePlan.find((routePlan) => routePlan.sourcePipelineStepId === adapterPlan.stepId)
    if (!workerRoute) {
      throw new Error(`No worker route bridge plan exists for adapter plan ${adapterPlan.adapterPlanId}.`)
    }

    return {
      adapterPlanId: adapterPlan.adapterPlanId,
      operationId: adapterPlan.operationId,
      workerType: workerRoute.workerType,
      futureHandler: workerRoute.futureHandler,
      inputArtifactRefCount: adapterPlan.inputArtifactRefs.length,
      expectedOutputArtifactCount: adapterPlan.expectedOutputArtifacts.length,
      requiredQualityGateCount: adapterPlan.requiredQualityGates.length,
      requiredPayloadFields: workerRoute.payloadShape.requiredFields,
      storageReferenceMode: workerRoute.payloadShape.storageReferenceMode,
      approvedSnapshotRequired: true,
      rawPromptAllowed: false,
      signedUrlAllowed: false,
      serviceRoleAllowed: false,
      executesTools: false,
      mediaProcessingAllowed: false,
      payloadDryRunReady,
    } satisfies InternalTestingApprovedSnapshotRouteSummary
  })

  return {
    decision: INTERNAL_TESTING_APPROVED_SNAPSHOT_ROUTE_REVIEW_DECISION,
    status: payloadDryRunReady
      ? 'passed_ready_for_worker_payload_dry_run'
      : 'blocked_missing_approval_or_private_artifacts',
    source: 'server_tool_calling_adapter_worker_route_metadata',
    workspaceId: input.workspaceId,
    projectId: input.projectId,
    editSessionId: input.editSessionId,
    requestedPatternId,
    routeCount: routeSummaries.length,
    adapterPlanCount: plan.adapterPlan.adapterPlans.length,
    workerRouteBridgePlanCount: plan.workerRouteBridgePlan.length,
    privateArtifactReferenceCount: input.privateArtifactReferences?.length ?? 0,
    requiredGateCount: requiredGateLabels.length,
    blockers,
    routeSummaries,
    productReady: false,
    blockedScope: {
      frontendToolExecution: false,
      rawPromptExecution: false,
      publicOrSignedUrlArtifacts: false,
      serviceRoleBrowserAccess: false,
      providerOrModelCalls: false,
      workerDispatch: false,
      mediaProcessing: false,
      renderOrExport: false,
      creditSpend: false,
      ledgerWrites: false,
      supabaseWrites: false,
      externalBeta: false,
      paidProduction: false,
      productReady: false,
    },
  }
}
