import { ApiError } from '../errors/api-error'
import {
  assertToolExecutionCostCreditGate,
} from '../tool-cost-metering'
import {
  getTrackBAdapterContract,
  isTrackBAdapterToolId,
  runTrackBAdapter,
  type TrackBAdapterResult,
} from '../trackb-adapters'
import {
  evaluateRuntimePolicy,
  evaluateToolLicensePolicy,
  evaluateToolModelWeightPolicy,
  getProductionToolProfile,
} from '../tool-registry'
import type { ProductionToolId } from '../tool-registry'
import { validateProductionStorageReference } from '../workers/production/production-worker-artifact-policy'
import { dispatchProductionWorkerJob } from '../workers/production/production-worker-dispatcher'
import { buildWorkerIdempotencyKey } from '../workers/production/production-worker-idempotency'
import type {
  ProductionWorkerExecutionMode,
  ProductionWorkerExecutionResult,
  ProductionWorkerJobPayload,
  ProductionWorkerRuntimeType,
  ProductionWorkerStorageReferenceInput,
} from '../workers/production/production-worker-types'
import type { ServiceContext } from '../types'
import type { ToolExecutionGatewayDispatchBody } from '../validation/tool-execution-gateway-schemas'
import type { ToolExecutionPlan } from '../../src/backend/contracts/tool-execution-contracts'
import { getRequiredAuthUserId, mockWarning, nowIso, throwOnSupabaseError } from './service-helpers'

export type ToolExecutionGatewayAdapterId =
  | 'cpu_analysis_worker_placeholder'
  | 'gpu_ai_worker_placeholder'
  | 'render_worker_placeholder'
  | 'qa_worker_placeholder'
  | 'tool_readiness_worker_placeholder'

export interface ToolExecutionGatewayBlocker {
  code: string
  gateName: string
  message: string
  details?: Record<string, unknown>
}

export interface ToolExecutionGatewayDispatchResult {
  gateway: {
    id: string
    status: 'dispatched' | 'blocked'
    workspaceId: string
    projectId: string
    jobId: string
    toolExecutionPlanId: string
    approvedPlanSnapshotId: string
    creditEstimateId: string
    creditReservationId: string
    apiIdempotencyKey: string
    workerIdempotencyKey?: string
    adapterId: ToolExecutionGatewayAdapterId
    requestedToolIds: ProductionToolId[]
    blockers: ToolExecutionGatewayBlocker[]
    dispatchedAt: string
  }
  trackBAdapterResult?: TrackBAdapterResult
  workerResult?: ProductionWorkerExecutionResult
  warnings: string[]
}

const adapterWorkerType: Record<ToolExecutionGatewayAdapterId, ProductionWorkerRuntimeType> = {
  cpu_analysis_worker_placeholder: 'cpu_analysis_worker',
  gpu_ai_worker_placeholder: 'gpu_ai_worker',
  render_worker_placeholder: 'render_worker',
  qa_worker_placeholder: 'qa_worker',
  tool_readiness_worker_placeholder: 'tool_readiness_worker',
}

export function createToolExecutionGatewayService(context: ServiceContext) {
  return {
    async dispatchApprovedToolCall(
      input: ToolExecutionGatewayDispatchBody & { apiIdempotencyKey: string },
    ): Promise<ToolExecutionGatewayDispatchResult> {
      const userId = getRequiredAuthUserId(context)
      const warnings: string[] = []
      const blockers: ToolExecutionGatewayBlocker[] = []
      const adapterId = input.adapterId ?? defaultAdapterForWorker(input.workerType)
      const createdAt = nowIso()

      warnings.push(...await validateWorkspaceProjectAccess(context, {
        workspaceId: input.workspaceId,
        projectId: input.projectId,
        userId,
      }))
      const trackBAdapterResult = input.trackBAdapterToolId
        ? runTrackBAdapter(buildTrackBAdapterRequest(input))
        : undefined
      blockers.push(...await validateApprovedSnapshotAndCreditReservation(context, input))
      blockers.push(...validateGatewayAdapter(adapterId, input.workerType))
      blockers.push(...validateToolReadiness(input.requestedToolIds, input.workerType, input.executionMode, input.trackBAdapterToolId))
      blockers.push(...validateArtifactPrivacy(input))
      blockers.push(...validateMetadataSafety(input.metadata))
      blockers.push(...validateCostCreditGate(input))
      blockers.push(...validateTrackBAdapterSelection(input, trackBAdapterResult))

      const payload = buildGatewayWorkerPayload({
        input,
        adapterId,
        createdAt,
      })
      const workerIdempotencyKey = buildWorkerIdempotencyKey(payload)
      payload.idempotencyKey = workerIdempotencyKey

      const executionPlan = buildGatewayExecutionPlan(input, workerIdempotencyKey)

      if (blockers.length > 0) {
        return {
          gateway: buildGatewayRecord({
            input,
            adapterId,
            blockers,
            status: 'blocked',
            dispatchedAt: createdAt,
            workerIdempotencyKey,
          }),
          trackBAdapterResult,
          warnings,
        }
      }

      const workerResult = await dispatchProductionWorkerJob({
        payload,
        executionPlan,
      })

      if (workerResult.status === 'blocked') {
        blockers.push(...workerResult.gateChecks
          .filter((gate) => gate.hardBlock)
          .map((gate) => ({
            code: 'WORKER_GATE_BLOCKED',
            gateName: gate.gateName,
            message: gate.message,
            details: gate.details,
          })))
      }

      return {
        gateway: buildGatewayRecord({
          input,
          adapterId,
          blockers,
          status: blockers.length > 0 ? 'blocked' : 'dispatched',
          dispatchedAt: createdAt,
          workerIdempotencyKey,
        }),
        trackBAdapterResult,
        workerResult,
        warnings: [
          ...warnings,
          'Tool execution gateway dispatched only through mock-safe backend worker adapters; no frontend tool execution occurred.',
        ],
      }
    },
  }
}

function buildGatewayWorkerPayload(input: {
  input: ToolExecutionGatewayDispatchBody & { apiIdempotencyKey: string }
  adapterId: ToolExecutionGatewayAdapterId
  createdAt: string
}): ProductionWorkerJobPayload {
  return {
    jobId: input.input.jobId,
    workspaceId: input.input.workspaceId,
    projectId: input.input.projectId,
    mediaAssetId: input.input.mediaAssetId,
    approvedSnapshotId: input.input.approvedPlanSnapshotId,
    editPlanId: input.input.editPlanId,
    toolExecutionPlanId: input.input.toolExecutionPlanId,
    workerType: input.input.workerType,
    executionMode: input.input.executionMode,
    idempotencyKey: 'pending-worker-idempotency-key',
    attempt: input.input.attempt,
    maxAttempts: input.input.maxAttempts,
    requestedToolIds: input.input.requestedToolIds,
    requestedRecipeIds: input.input.requestedRecipeIds,
    storageReferenceIds: input.input.artifactReferences.map((artifact) => artifact.id),
    creditReservationId: input.input.creditReservationId,
    renderMode: input.input.renderMode,
    requiredQualityGateIds: input.input.requiredQualityGateIds,
    requiredQualityGateTypes: input.input.requiredQualityGateTypes,
    createdAt: input.createdAt,
    metadata: {
      ...(input.input.metadata ?? {}),
      gatewayAdapterId: input.adapterId,
      trackBAdapterToolId: input.input.trackBAdapterToolId,
      trackBAdapterExecutionMode: input.input.trackBAdapterExecutionMode,
      creditEstimateId: input.input.creditEstimateId,
      approvedReservationRemainingCredits: input.input.approvedReservationRemainingCredits,
      estimatedHighCredits: input.input.estimatedHighCredits,
      apiIdempotencyKey: input.input.apiIdempotencyKey,
    },
  }
}

function buildGatewayExecutionPlan(
  input: ToolExecutionGatewayDispatchBody & { apiIdempotencyKey: string },
  workerIdempotencyKey: string,
): ToolExecutionPlan {
  const now = nowIso()

  return {
    id: input.toolExecutionPlanId,
    workspaceId: input.workspaceId,
    projectId: input.projectId,
    mediaAssetId: input.mediaAssetId ?? 'media-asset-not-required',
    approvedSnapshotId: input.approvedPlanSnapshotId,
    editPlanId: input.editPlanId ?? 'edit-plan-not-supplied',
    recipeIds: input.requestedRecipeIds,
    status: 'approved',
    createdAt: now,
    updatedAt: now,
    requestedBy: 'tool-execution-gateway',
    executionMode: input.executionMode === 'production_ready' ? 'worker_execution' : 'dry_run',
    workerPlan: {
      workerType: input.workerType,
      workerJobIds: [input.jobId],
      notes: 'Created by backend tool execution gateway after approval/credit/idempotency validation.',
    },
    toolSteps: input.requestedToolIds.map((toolId, index) => ({
      toolStepId: `${input.toolExecutionPlanId}-step-${index + 1}`,
      recipeId: input.requestedRecipeIds[index] ?? `${toolId}-gateway-recipe`,
      toolId,
      workerType: input.workerType,
      order: index + 1,
      required: true,
      settings: {},
      inputArtifactIds: input.artifactReferences.map((artifact) => artifact.id),
      expectedOutputArtifactTypes: [],
    })),
    expectedArtifacts: [],
    requiredQualityGates: (input.requiredQualityGateTypes ?? []).map((gateType) => ({
      gateType,
      recipeId: input.requestedRecipeIds[0] ?? 'gateway-quality-gate',
      required: true,
      blocksPreview: gateType === 'final_delivery',
      blocksFinalExport: gateType === 'final_delivery',
    })),
    fallbackPlan: {
      allowedActions: ['block_final_export', 'request_user_review'],
      fallbackRecipeIds: [],
      fallbackToolIds: [],
      requiresUserApprovalWhen: ['gateway_blocked', 'cost_overrun', 'quality_gate_failed'],
    },
    creditEstimateId: input.creditEstimateId,
    creditReservationId: input.creditReservationId,
    costCreditGate: {
      approvedPlanSnapshotId: input.approvedPlanSnapshotId,
      creditEstimateId: input.creditEstimateId,
      creditReservationId: input.creditReservationId,
      estimatedHighCredits: input.estimatedHighCredits,
      approvedReservationRemainingCredits: input.approvedReservationRemainingCredits,
      canRunWithinApprovedReservation: input.estimatedHighCredits <= input.approvedReservationRemainingCredits,
      revisedEstimateRequired: input.estimatedHighCredits > input.approvedReservationRemainingCredits,
      executionAllowed: input.estimatedHighCredits <= input.approvedReservationRemainingCredits,
      blockerReasons: input.estimatedHighCredits <= input.approvedReservationRemainingCredits
        ? []
        : ['High tool-call estimate exceeds the approved reservation.'],
    },
    idempotencyKey: workerIdempotencyKey,
    approvalRequired: true,
    approvedAt: now,
    userIntentSummary: 'Backend-approved tool-call dispatch request.',
    approvedDirectiveSummary: 'Dispatch through backend gateway only; frontend direct execution remains forbidden.',
  }
}

function buildGatewayRecord(input: {
  input: ToolExecutionGatewayDispatchBody & { apiIdempotencyKey: string }
  adapterId: ToolExecutionGatewayAdapterId
  blockers: ToolExecutionGatewayBlocker[]
  status: 'dispatched' | 'blocked'
  dispatchedAt: string
  workerIdempotencyKey?: string
}): ToolExecutionGatewayDispatchResult['gateway'] {
  return {
    id: `tool-execution-gateway:${input.input.workspaceId}:${input.input.projectId}:${input.input.jobId}`,
    status: input.status,
    workspaceId: input.input.workspaceId,
    projectId: input.input.projectId,
    jobId: input.input.jobId,
    toolExecutionPlanId: input.input.toolExecutionPlanId,
    approvedPlanSnapshotId: input.input.approvedPlanSnapshotId,
    creditEstimateId: input.input.creditEstimateId,
    creditReservationId: input.input.creditReservationId,
    apiIdempotencyKey: input.input.apiIdempotencyKey,
    workerIdempotencyKey: input.workerIdempotencyKey,
    adapterId: input.adapterId,
    requestedToolIds: input.input.requestedToolIds,
    blockers: input.blockers,
    dispatchedAt: input.dispatchedAt,
  }
}

async function validateWorkspaceProjectAccess(
  context: ServiceContext,
  input: { workspaceId: string; projectId: string; userId: string },
): Promise<string[]> {
  if (!context.clients.admin || context.env.mockOnly) {
    return [mockWarning('Tool execution gateway workspace/project access read')]
  }

  const { data: project, error: projectError } = await context.clients.admin
    .from('projects')
    .select('id, workspace_id')
    .eq('id', input.projectId)
    .eq('workspace_id', input.workspaceId)
    .maybeSingle()

  throwOnSupabaseError(projectError, 'WORKSPACE_ACCESS_DENIED')
  if (!project) {
    throw new ApiError('WORKSPACE_ACCESS_DENIED', 'Project is not accessible in the requested workspace.', 403)
  }

  const { data: membership, error: membershipError } = await context.clients.admin
    .from('workspace_members')
    .select('user_id')
    .eq('workspace_id', input.workspaceId)
    .eq('user_id', input.userId)
    .maybeSingle()

  throwOnSupabaseError(membershipError, 'WORKSPACE_ACCESS_DENIED')
  if (!membership) {
    throw new ApiError('WORKSPACE_ACCESS_DENIED', 'Authenticated user is not a member of the requested workspace.', 403)
  }

  return []
}

async function validateApprovedSnapshotAndCreditReservation(
  context: ServiceContext,
  input: ToolExecutionGatewayDispatchBody,
): Promise<ToolExecutionGatewayBlocker[]> {
  if (!context.clients.admin || context.env.mockOnly) {
    return []
  }

  const blockers: ToolExecutionGatewayBlocker[] = []
  const { data: snapshot, error: snapshotError } = await context.clients.admin
    .from('approved_plan_snapshots')
    .select('id, workspace_id, project_id, edit_plan_id, credit_estimate_id, credit_reservation_id, snapshot_status')
    .eq('id', input.approvedPlanSnapshotId)
    .maybeSingle()

  throwOnSupabaseError(snapshotError, 'APPROVED_SNAPSHOT_REQUIRED')
  if (!snapshot) {
    blockers.push({
      code: 'APPROVED_SNAPSHOT_REQUIRED',
      gateName: 'approved_snapshot',
      message: 'Approved snapshot was not found.',
    })
  } else {
    if (snapshot.workspace_id !== input.workspaceId || snapshot.project_id !== input.projectId) {
      blockers.push({
        code: 'APPROVED_SNAPSHOT_PROJECT_MISMATCH',
        gateName: 'approved_snapshot',
        message: 'Approved snapshot does not belong to the requested workspace/project.',
      })
    }
    if (snapshot.snapshot_status !== 'approved') {
      blockers.push({
        code: 'PLAN_NOT_APPROVED',
        gateName: 'approved_snapshot',
        message: `Approved snapshot status is ${snapshot.snapshot_status}, not approved.`,
      })
    }
    if (snapshot.credit_estimate_id !== input.creditEstimateId || snapshot.credit_reservation_id !== input.creditReservationId) {
      blockers.push({
        code: 'CREDIT_SNAPSHOT_MISMATCH',
        gateName: 'credit_reservation',
        message: 'Credit estimate/reservation IDs do not match the approved snapshot.',
      })
    }
  }

  const { data: reservation, error: reservationError } = await context.clients.admin
    .from('credit_reservations')
    .select('id, workspace_id, project_id, edit_plan_id, credit_estimate_id, status')
    .eq('id', input.creditReservationId)
    .maybeSingle()

  throwOnSupabaseError(reservationError, 'CREDITS_NOT_RESERVED')
  if (!reservation) {
    blockers.push({
      code: 'CREDITS_NOT_RESERVED',
      gateName: 'credit_reservation',
      message: 'Credit reservation was not found.',
    })
  } else if (
    reservation.workspace_id !== input.workspaceId ||
    reservation.project_id !== input.projectId ||
    reservation.credit_estimate_id !== input.creditEstimateId ||
    reservation.status !== 'reserved'
  ) {
    blockers.push({
      code: 'CREDITS_NOT_RESERVED',
      gateName: 'credit_reservation',
      message: 'Credit reservation is not an active reservation for this workspace/project/estimate.',
    })
  }

  return blockers
}

function validateGatewayAdapter(
  adapterId: ToolExecutionGatewayAdapterId,
  workerType: ProductionWorkerRuntimeType,
): ToolExecutionGatewayBlocker[] {
  const expectedWorkerType = adapterWorkerType[adapterId]
  if (expectedWorkerType === workerType) return []

  return [{
    code: 'ADAPTER_WORKER_MISMATCH',
    gateName: 'adapter_dispatch',
    message: `${adapterId} can dispatch only ${expectedWorkerType}, not ${workerType}.`,
  }]
}

function validateToolReadiness(
  toolIds: ProductionToolId[],
  workerType: ProductionWorkerRuntimeType,
  executionMode: ProductionWorkerExecutionMode,
  trackBAdapterToolId?: string,
): ToolExecutionGatewayBlocker[] {
  const blockers: ToolExecutionGatewayBlocker[] = []

  for (const toolId of toolIds) {
    if (trackBAdapterToolId && isTrackBAdapterToolId(trackBAdapterToolId) && toolId === trackBAdapterToolId) {
      continue
    }

    const profile = getProductionToolProfile(toolId)
    if (!profile) {
      blockers.push({
        code: 'UNKNOWN_TOOL',
        gateName: 'tool_readiness',
        message: `Unknown production tool: ${toolId}.`,
      })
      continue
    }

    const runtime = evaluateRuntimePolicy(profile, workerType)
    blockers.push(...runtime.blockingReasons.map((message) => ({
      code: 'TOOL_NOT_READY',
      gateName: 'tool_readiness',
      message,
      details: { toolId, workerType, executionMode },
    })))

    if (executionMode === 'production_ready') {
      const license = evaluateToolLicensePolicy(profile)
      const modelWeight = evaluateToolModelWeightPolicy(profile)
      blockers.push(...license.blockingReasons.map((message) => ({
        code: 'LICENSE_REVIEW_REQUIRED',
        gateName: 'license_model_weight',
        message,
        details: { toolId },
      })))
      blockers.push(...modelWeight.blockingReasons.map((message) => ({
        code: 'MODEL_WEIGHT_REVIEW_REQUIRED',
        gateName: 'license_model_weight',
        message,
        details: { toolId },
      })))
    }
  }

  return blockers
}

function validateTrackBAdapterSelection(
  input: ToolExecutionGatewayDispatchBody,
  result: TrackBAdapterResult | undefined,
): ToolExecutionGatewayBlocker[] {
  if (!input.trackBAdapterToolId) return []

  const blockers: ToolExecutionGatewayBlocker[] = []

  if (!input.requestedToolIds.includes(input.trackBAdapterToolId)) {
    blockers.push({
      code: 'TRACKB_ADAPTER_TOOL_NOT_REQUESTED',
      gateName: 'trackb_adapter_pack',
      message: 'Track B adapter tool must also appear in requestedToolIds.',
      details: { trackBAdapterToolId: input.trackBAdapterToolId, requestedToolIds: input.requestedToolIds },
    })
  }

  if (input.requestedToolIds.length !== 1) {
    blockers.push({
      code: 'TRACKB_ADAPTER_ONE_TOOL_PER_REQUEST',
      gateName: 'trackb_adapter_pack',
      message: 'Track B adapter dispatch handles exactly one tool per approved backend job.',
      details: { requestedToolIds: input.requestedToolIds },
    })
  }

  if (result?.status === 'blocked') {
    blockers.push(...result.blockers.map((blocker) => ({
      code: blocker.code,
      gateName: 'trackb_adapter_pack',
      message: blocker.message,
      details: blocker.details,
    })))
  }

  return blockers
}

function validateArtifactPrivacy(input: ToolExecutionGatewayDispatchBody): ToolExecutionGatewayBlocker[] {
  const blockers: ToolExecutionGatewayBlocker[] = []

  for (const artifact of input.artifactReferences) {
    try {
      validateProductionStorageReference(artifact as ProductionWorkerStorageReferenceInput)
    } catch (error) {
      blockers.push({
        code: 'ARTIFACT_PRIVACY_BLOCKED',
        gateName: 'artifact_privacy',
        message: error instanceof Error ? error.message : 'Artifact reference failed privacy validation.',
        details: { artifactId: artifact.id },
      })
      continue
    }

    const expectedPrefix = `workspaces/${input.workspaceId}/projects/${input.projectId}/`
    if (!artifact.storageObjectPath.startsWith(expectedPrefix)) {
      blockers.push({
        code: 'ARTIFACT_PROJECT_MISMATCH',
        gateName: 'artifact_privacy',
        message: 'Artifact storage path must be scoped under the requested workspace/project.',
        details: { artifactId: artifact.id, expectedPrefix },
      })
    }
  }

  return blockers
}

function validateMetadataSafety(metadata: Record<string, unknown> | undefined): ToolExecutionGatewayBlocker[] {
  if (!metadata) return []

  const reservedRouterKeys = [
    'finalRenderExecution',
    'finalRenderQA',
    'enhancementSlowMotion',
    'enhancementSlowMotionQA',
    'maskComposition',
    'maskCompositionQA',
    'colorExecution',
    'colorExecutionQA',
    'audioExecution',
    'audioExecutionQA',
    'smartCutTimelineExecution',
    'speechCaptionExecution',
    'audioFoundation',
    'smartCutFoundation',
    'timelineFoundation',
    'speechFoundation',
    'captionFoundation',
    'mediaFoundation',
  ]
  const reservedFound = reservedRouterKeys.filter((key) => Object.prototype.hasOwnProperty.call(metadata, key))
  if (reservedFound.length > 0) {
    return [{
      code: 'RESERVED_ADAPTER_METADATA',
      gateName: 'metadata_safety',
      message: 'Gateway metadata must not include lower-level worker router selector keys.',
      details: { found: reservedFound },
    }]
  }

  const serialized = JSON.stringify(metadata).toLowerCase()
  const forbidden = [
    'rawprompt',
    'raw_prompt',
    'prompttext',
    'prompt_text',
    'rawchat',
    'raw_chat',
    'servicerolekey',
    'service_role_key',
    'providerapikey',
    'provider_api_key',
    'signedurl',
    'signed_url',
    'x-goog-signature',
    'x-amz-signature',
  ]
  const found = forbidden.filter((needle) => serialized.includes(needle))
  if (found.length === 0) return []

  return [{
    code: 'FORBIDDEN_METADATA',
    gateName: 'metadata_safety',
    message: 'Gateway metadata must not include raw prompts, secrets, provider keys, or signed URLs.',
    details: { found },
  }]
}

function validateCostCreditGate(input: ToolExecutionGatewayDispatchBody): ToolExecutionGatewayBlocker[] {
  try {
    assertToolExecutionCostCreditGate({
      approvedPlanSnapshotId: input.approvedPlanSnapshotId,
      creditEstimateId: input.creditEstimateId,
      creditReservationId: input.creditReservationId,
      idempotencyKey: 'gateway-request-idempotency-present',
      estimatedHighCredits: input.estimatedHighCredits,
      approvedReservationRemainingCredits: input.approvedReservationRemainingCredits,
    })
    return []
  } catch (error) {
    return [{
      code: 'COST_CREDIT_GATE_BLOCKED',
      gateName: 'cost_credit_gate',
      message: error instanceof Error ? error.message : 'Cost/credit gate failed.',
    }]
  }
}

function defaultAdapterForWorker(workerType: ProductionWorkerRuntimeType): ToolExecutionGatewayAdapterId {
  return `${workerType}_placeholder` as ToolExecutionGatewayAdapterId
}

function buildTrackBAdapterRequest(
  input: ToolExecutionGatewayDispatchBody & { apiIdempotencyKey: string },
) {
  if (!input.trackBAdapterToolId) {
    throw new Error('Track B adapter tool ID is required to build adapter request.')
  }

  const contract = getTrackBAdapterContract(input.trackBAdapterToolId)
  const defaultInputArtifactType = contract.inputManifest[0]?.artifactType ?? 'temp_file'

  return {
    workspaceId: input.workspaceId,
    projectId: input.projectId,
    jobId: input.jobId,
    toolExecutionPlanId: input.toolExecutionPlanId,
    approvedPlanSnapshotId: input.approvedPlanSnapshotId,
    creditEstimateId: input.creditEstimateId,
    creditReservationId: input.creditReservationId,
    toolId: input.trackBAdapterToolId,
    workerType: input.workerType,
    executionMode: input.trackBAdapterExecutionMode ?? 'dry_run',
    inputArtifacts: input.artifactReferences.map((artifact, index) => ({
      ...artifact,
      artifactType: contract.inputManifest[index]?.artifactType ?? defaultInputArtifactType,
      description: `Gateway Track B adapter input ${index + 1} for ${input.trackBAdapterToolId}.`,
    })),
    metadata: {
      ...(input.metadata ?? {}),
      apiIdempotencyKey: input.apiIdempotencyKey,
    },
  }
}
