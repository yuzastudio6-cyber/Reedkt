import {
  buildTrackBAgentRuntimeReadinessReport,
  type TrackBAgentRuntimeReadinessReport,
  type TrackBAgentRuntimeToolContract,
} from '../beta-readiness/trackb-agent-runtime-readiness'
import { findForbiddenWorkerPayloadEntries } from '../workers/production/production-worker-artifact-policy'
import { dispatchProductionWorkerJob } from '../workers/production/production-worker-dispatcher'
import { buildWorkerIdempotencyKey } from '../workers/production/production-worker-idempotency'
import type {
  ProductionWorkerExecutionResult,
  ProductionWorkerJobPayload,
  ProductionWorkerRuntimeType,
} from '../workers/production/production-worker-types'
import type { ProductionToolId } from '../tool-registry'

export type TrackBAgentToolExecutionMode =
  | 'mock_safe_worker_dispatch'
  | 'frontend_preview_boundary'
  | 'deployed_live_execution'

export type TrackBAgentToolExecutionStatus =
  | 'completed'
  | 'blocked'

export interface TrackBAgentToolExecutionInput {
  workspaceId: string
  projectId: string
  jobId: string
  agentInvocationId: string
  action: string
  approvedSnapshotId: string
  toolExecutionPlanId: string
  toolId?: ProductionToolId
  editPlanId?: string
  mediaAssetId?: string
  mediaAnalysisReportId?: string
  mode?: TrackBAgentToolExecutionMode
  requestedRecipeIds?: string[]
  storageReferenceIds?: string[]
  approvedPreviewStateReference?: string
  requiredQualityGateIds?: string[]
  requiredQualityGateTypes?: ProductionWorkerJobPayload['requiredQualityGateTypes']
  renderMode?: ProductionWorkerJobPayload['renderMode']
  creditEstimateId?: string
  creditReservationId?: string
  workerInstanceId?: string
  attempt?: number
  maxAttempts?: number
  metadata?: Record<string, unknown>
  apiIdempotencyKey?: string
}

export interface TrackBAgentToolExecutionOptions {
  readinessReport?: TrackBAgentRuntimeReadinessReport
}

export interface TrackBAgentToolExecutionResult {
  status: TrackBAgentToolExecutionStatus
  decision: string
  toolId?: ProductionToolId
  agentInvocationId: string
  mode: TrackBAgentToolExecutionMode
  liveExecutionReady: boolean
  paymentScope: 'excluded_from_this_runtime_boundary'
  serviceFeeIncluded: false
  workerPayload?: ProductionWorkerJobPayload
  workerResult?: ProductionWorkerExecutionResult
  previewBoundary?: {
    approvedPreviewStateReference: string
    workerDispatchSkipped: true
    reason: string
  }
  blockedReason?: string
  warnings: string[]
}

export async function executeTrackBAgentTool(
  input: TrackBAgentToolExecutionInput,
  options: TrackBAgentToolExecutionOptions = {},
): Promise<TrackBAgentToolExecutionResult> {
  const report = options.readinessReport ?? buildTrackBAgentRuntimeReadinessReport()
  const contract = findContract(report.contracts, input.agentInvocationId, input.toolId)
  if (!contract) {
    return blocked(input, input.mode ?? 'mock_safe_worker_dispatch', 'unknown_trackb_agent_invocation', [
      'Agent invocation must match one of the 16 Track B media OSS runtime contracts.',
    ])
  }

  const mode = input.mode ?? contract.admittedModes[0] ?? 'mock_safe_worker_dispatch'
  const commonWarnings = [
    ...report.warnings,
    ...contract.blockedActionScope.map((scope) => `Blocked live scope remains: ${scope}.`),
  ]

  const invalidMode = validateMode(contract, mode, report.liveAgentExecutionReady)
  if (invalidMode) {
    return blocked(input, mode, invalidMode, commonWarnings, contract)
  }

  if (!contract.supportedActions.includes(input.action)) {
    return blocked(input, mode, `Unsupported action ${input.action} for ${contract.toolId}.`, commonWarnings, contract)
  }

  const forbiddenFindings = findForbiddenWorkerPayloadEntries({
    storageReferenceIds: input.storageReferenceIds ?? [],
    approvedPreviewStateReference: input.approvedPreviewStateReference,
    metadata: input.metadata ?? {},
  })
  if (forbiddenFindings.length > 0) {
    return blocked(input, mode, `Agent tool payload contains forbidden raw prompt, signed URL, or secret fields: ${forbiddenFindings.join(', ')}`, commonWarnings, contract)
  }

  if (mode === 'frontend_preview_boundary') {
    if (!input.approvedPreviewStateReference) {
      return blocked(input, mode, 'Frontend preview boundary requires approvedPreviewStateReference.', commonWarnings, contract)
    }

    return {
      status: 'completed',
      decision: 'trackb_agent_tool_execution_frontend_preview_boundary_admitted',
      toolId: contract.toolId,
      agentInvocationId: contract.agentInvocationId,
      mode,
      liveExecutionReady: report.liveAgentExecutionReady,
      paymentScope: 'excluded_from_this_runtime_boundary',
      serviceFeeIncluded: false,
      previewBoundary: {
        approvedPreviewStateReference: input.approvedPreviewStateReference,
        workerDispatchSkipped: true,
        reason: 'Hyperframe is admitted only as an approved frontend preview/timeline handoff boundary.',
      },
      warnings: commonWarnings,
    }
  }

  if (!input.storageReferenceIds || input.storageReferenceIds.length === 0) {
    return blocked(input, mode, 'Worker dispatch requires at least one private storage reference ID/path.', commonWarnings, contract)
  }

  const payload = buildWorkerPayload(input, contract, mode, report)
  const workerResult = await dispatchProductionWorkerJob({ payload, workerInstanceId: input.workerInstanceId })
  return {
    status: workerResult.status === 'completed' ? 'completed' : 'blocked',
    decision: workerDecision(mode, workerResult.status === 'completed'),
    toolId: contract.toolId,
    agentInvocationId: contract.agentInvocationId,
    mode,
    liveExecutionReady: report.liveAgentExecutionReady,
    paymentScope: 'excluded_from_this_runtime_boundary',
    serviceFeeIncluded: false,
    workerPayload: payload,
    workerResult,
    blockedReason: workerResult.status === 'completed' ? undefined : workerResult.error?.message ?? 'Worker dispatch did not complete.',
    warnings: [...commonWarnings, ...workerResult.warnings],
  }
}

function findContract(
  contracts: TrackBAgentRuntimeToolContract[],
  agentInvocationId: string,
  toolId?: ProductionToolId,
): TrackBAgentRuntimeToolContract | undefined {
  return contracts.find((contract) => (
    contract.agentInvocationId === agentInvocationId &&
    (!toolId || contract.toolId === toolId)
  ))
}

function validateMode(
  contract: TrackBAgentRuntimeToolContract,
  mode: TrackBAgentToolExecutionMode,
  liveExecutionReady: boolean,
): string | undefined {
  if (mode === 'deployed_live_execution') {
    if (!liveExecutionReady) {
      return 'Live Track B agent execution requires deployed product-ready evidence and operator-status readback for all 16 tools.'
    }
    return contract.admittedModes.includes('deployed_live_execution')
      ? undefined
      : `Mode deployed_live_execution is not admitted for ${contract.toolId}.`
  }

  if (!contract.admittedModes.includes(mode)) {
    return `Mode ${mode} is not admitted for ${contract.toolId}.`
  }

  return undefined
}

function buildWorkerPayload(
  input: TrackBAgentToolExecutionInput,
  contract: TrackBAgentRuntimeToolContract,
  mode: TrackBAgentToolExecutionMode,
  report: TrackBAgentRuntimeReadinessReport,
): ProductionWorkerJobPayload {
  const candidate: ProductionWorkerJobPayload = {
    jobId: input.jobId,
    workspaceId: input.workspaceId,
    projectId: input.projectId,
    mediaAssetId: input.mediaAssetId,
    approvedSnapshotId: input.approvedSnapshotId,
    editPlanId: input.editPlanId,
    toolExecutionPlanId: input.toolExecutionPlanId,
    mediaAnalysisReportId: input.mediaAnalysisReportId,
    workerType: contract.workerType as ProductionWorkerRuntimeType,
    executionMode: mode === 'deployed_live_execution' ? 'production_ready' : 'mock_safe',
    idempotencyKey: '',
    attempt: input.attempt ?? 1,
    maxAttempts: input.maxAttempts ?? 1,
    requestedToolIds: [contract.toolId],
    requestedRecipeIds: input.requestedRecipeIds?.length
      ? input.requestedRecipeIds
      : [`trackb_${contract.toolId}_${input.action}`],
    storageReferenceIds: input.storageReferenceIds ?? [],
    creditReservationId: input.creditReservationId,
    renderMode: input.renderMode,
    requiredQualityGateIds: input.requiredQualityGateIds,
    requiredQualityGateTypes: input.requiredQualityGateTypes,
    createdAt: new Date().toISOString(),
    metadata: {
      ...(input.metadata ?? {}),
      creditEstimateId: input.creditEstimateId ?? stringMetadata(input.metadata, 'creditEstimateId'),
      agentInvocationId: contract.agentInvocationId,
      agentAction: input.action,
      agentExecutionMode: mode,
      trackBProductReadyRuntimeEvidenceAccepted: mode === 'deployed_live_execution' && report.liveAgentExecutionReady,
      trackBDeployedEvidenceSource: report.sourceEvidence.deployedEvidenceSource,
      trackBDeployedEvidenceRecordedToolCount: report.deployedEvidenceRecordedToolCount,
      trackBDeployedEvidenceWorkspaceId: report.sourceEvidence.deployedEvidenceWorkspaceId,
      apiIdempotencyKey: input.apiIdempotencyKey,
      paymentScope: 'excluded_from_this_runtime_boundary',
      serviceFeeIncluded: false,
    },
  }
  return { ...candidate, idempotencyKey: buildWorkerIdempotencyKey(candidate) }
}

function workerDecision(mode: TrackBAgentToolExecutionMode, completed: boolean): string {
  if (mode === 'deployed_live_execution') {
    return completed
      ? 'trackb_agent_tool_execution_deployed_live_execution_completed'
      : 'trackb_agent_tool_execution_deployed_live_execution_blocked'
  }

  return completed
    ? 'trackb_agent_tool_execution_mock_safe_worker_dispatch_completed'
    : 'trackb_agent_tool_execution_mock_safe_worker_dispatch_blocked'
}

function stringMetadata(metadata: Record<string, unknown> | undefined, key: string): string | undefined {
  const value = metadata?.[key]
  return typeof value === 'string' && value.length > 0 ? value : undefined
}

function blocked(
  input: Pick<TrackBAgentToolExecutionInput, 'agentInvocationId'>,
  mode: TrackBAgentToolExecutionMode,
  reason: string,
  warnings: string[],
  contract?: TrackBAgentRuntimeToolContract,
): TrackBAgentToolExecutionResult {
  return {
    status: 'blocked',
    decision: 'trackb_agent_tool_execution_blocked_before_worker_dispatch',
    toolId: contract?.toolId,
    agentInvocationId: input.agentInvocationId,
    mode,
    liveExecutionReady: false,
    paymentScope: 'excluded_from_this_runtime_boundary',
    serviceFeeIncluded: false,
    blockedReason: reason,
    warnings,
  }
}
