import { ApiError } from '../errors/api-error'
import {
  evaluateProductionToolExecutionReadinessGate,
  type ProductionToolExecutionReadinessGateReport,
} from '../beta-readiness'
import {
  getMockProductionToolExecutionReadinessEvidencePacket,
  getPersistentProductionToolExecutionReadinessEvidencePacket,
} from '../beta-readiness/production-tool-execution-readiness-evidence-store'
import { admitProductionGatewayOpsControls } from '../cost-controls'
import {
  assertToolExecutionCostCreditGate,
  createToolCostMeteringService,
  getToolCostOwnerCoverage,
  settleToolCostWallet,
  type ToolCostEvent,
  type ToolCostFailureCategory,
  type ToolCostWalletSettlement,
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
import { listM10CoreCpuRenderToolIds } from '../workers/production-readiness/core-cpu-render-readiness-checks'
import { validateProductionStorageReference } from '../workers/production/production-worker-artifact-policy'
import {
  getProjectWorkerRuntimeOutputManifest,
  getWorkerRuntimeArtifactReplay,
  recordWorkerRuntimeArtifactPipeline,
  type WorkerRuntimeArtifactPipelineResult,
} from '../workers/production/production-worker-artifact-pipeline'
import { dispatchProductionWorkerJob } from '../workers/production/production-worker-dispatcher'
import { buildWorkerIdempotencyKey } from '../workers/production/production-worker-idempotency'
import type {
  ProductionWorkerExecutionMode,
  ProductionWorkerExecutionResult,
  ProductionWorkerFailureCategory,
  ProductionWorkerJobPayload,
  ProductionWorkerRuntimeType,
  ProductionWorkerStorageReferenceInput,
} from '../workers/production/production-worker-types'
import type { ServiceContext } from '../types'
import type { ToolExecutionGatewayDispatchBody } from '../validation/tool-execution-gateway-schemas'
import type { ToolExecutionPlan } from '../../src/backend/contracts/tool-execution-contracts'
import { getRequiredAuthUserId, mockWarning, nowIso, throwOnSupabaseError } from './service-helpers'

export type ToolExecutionGatewayAdapterId =
  | 'cpu_analysis_worker_media_audio_extract'
  | 'cpu_analysis_worker_media_keyframes'
  | 'cpu_analysis_worker_media_probe'
  | 'cpu_analysis_worker_media_proxy'
  | 'cpu_analysis_worker_media_representative_frames'
  | 'cpu_analysis_worker_placeholder'
  | 'cpu_analysis_worker_audio_metadata'
  | 'cpu_analysis_worker_color_metadata'
  | 'cpu_analysis_worker_smart_cut_timeline'
  | 'gpu_ai_worker_placeholder'
  | 'render_worker_caption_metadata'
  | 'render_worker_final_render_metadata'
  | 'render_worker_placeholder'
  | 'qa_worker_placeholder'
  | 'tool_readiness_worker_core_checks'
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
    productionReadinessEvidencePacketId?: string
    adapterId: ToolExecutionGatewayAdapterId
    requestedToolIds: ProductionToolId[]
    blockers: ToolExecutionGatewayBlocker[]
    dispatchedAt: string
  }
  productionReadinessReport?: ProductionToolExecutionReadinessGateReport
  toolCostEvents?: ToolCostEvent[]
  walletSettlements?: ToolCostWalletSettlement[]
  trackBAdapterResult?: TrackBAdapterResult
  workerRuntimeArtifactPipeline?: WorkerRuntimeArtifactPipelineResult
  workerResult?: ProductionWorkerExecutionResult
  warnings: string[]
}

const adapterWorkerType: Record<ToolExecutionGatewayAdapterId, ProductionWorkerRuntimeType> = {
  cpu_analysis_worker_media_audio_extract: 'cpu_analysis_worker',
  cpu_analysis_worker_media_keyframes: 'cpu_analysis_worker',
  cpu_analysis_worker_media_probe: 'cpu_analysis_worker',
  cpu_analysis_worker_media_proxy: 'cpu_analysis_worker',
  cpu_analysis_worker_media_representative_frames: 'cpu_analysis_worker',
  cpu_analysis_worker_placeholder: 'cpu_analysis_worker',
  cpu_analysis_worker_audio_metadata: 'cpu_analysis_worker',
  cpu_analysis_worker_color_metadata: 'cpu_analysis_worker',
  cpu_analysis_worker_smart_cut_timeline: 'cpu_analysis_worker',
  gpu_ai_worker_placeholder: 'gpu_ai_worker',
  render_worker_caption_metadata: 'render_worker',
  render_worker_final_render_metadata: 'render_worker',
  render_worker_placeholder: 'render_worker',
  qa_worker_placeholder: 'qa_worker',
  tool_readiness_worker_core_checks: 'tool_readiness_worker',
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
      const productionReadiness = await validateProductionReadinessGate(context, input)
      blockers.push(...await validateApprovedSnapshotAndCreditReservation(context, input))
      blockers.push(...validateGatewayAdapter(adapterId, input))
      blockers.push(...validateToolReadiness(input.requestedToolIds, input.workerType, input.executionMode, input.trackBAdapterToolId, adapterId))
      blockers.push(...validateArtifactPrivacy(input))
      blockers.push(...validateMetadataSafety(input.metadata, adapterId))
      blockers.push(...validateCostCreditGate(input))
      blockers.push(...validateTrackBAdapterSelection(input, trackBAdapterResult))
      blockers.push(...productionReadiness.blockers)

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
          productionReadinessReport: productionReadiness.report,
          trackBAdapterResult,
          warnings,
        }
      }

      const replay = getWorkerRuntimeArtifactReplay(workerIdempotencyKey)
      if (replay) {
        const billingAudit = await recordGatewayBillingAudit({
          context,
          input,
          workerResult: replay.workerResult,
          workerIdempotencyKey,
        })
        blockers.push(...billingAudit.blockers)
        return {
          gateway: buildGatewayRecord({
            input,
            adapterId,
            blockers,
            status: blockers.length > 0 ? 'blocked' : 'dispatched',
            dispatchedAt: createdAt,
            workerIdempotencyKey,
          }),
          productionReadinessReport: productionReadiness.report,
          toolCostEvents: billingAudit.toolCostEvents,
          walletSettlements: billingAudit.walletSettlements,
          trackBAdapterResult: replay.trackBAdapterResult ?? trackBAdapterResult,
          workerRuntimeArtifactPipeline: replay.pipeline,
          workerResult: replay.workerResult,
          warnings: [
            ...warnings,
            ...billingAudit.warnings,
            ...replay.pipeline.warnings,
            'Tool execution gateway returned an idempotent worker/runtime artifact replay.',
          ],
        }
      }

      const opsAdmission = input.executionMode === 'production_ready'
        ? await admitProductionGatewayOpsControls(context, {
          workspaceId: input.workspaceId,
          projectId: input.projectId,
          userId,
          jobId: input.jobId,
          workerType: input.workerType,
          renderMode: input.renderMode,
        })
        : undefined
      if (opsAdmission?.blockers.length) {
        blockers.push(...opsAdmission.blockers)
        return {
          gateway: buildGatewayRecord({
            input,
            adapterId,
            blockers,
            status: 'blocked',
            dispatchedAt: createdAt,
            workerIdempotencyKey,
          }),
          productionReadinessReport: productionReadiness.report,
          trackBAdapterResult,
          warnings: [
            ...warnings,
            ...opsAdmission.warnings,
          ],
        }
      }

      let workerResult: ProductionWorkerExecutionResult
      try {
        workerResult = await dispatchProductionWorkerJob({
          payload,
          executionPlan,
        })
      } finally {
        opsAdmission?.release()
      }

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

      const workerRuntimeArtifactPipeline = recordWorkerRuntimeArtifactPipeline({
        payload,
        workerResult,
        trackBAdapterResult,
        apiIdempotencyKey: input.apiIdempotencyKey,
      })
      const billingAudit = await recordGatewayBillingAudit({
        context,
        input,
        workerResult,
        workerIdempotencyKey,
      })
      blockers.push(...billingAudit.blockers)

      return {
        gateway: buildGatewayRecord({
          input,
          adapterId,
          blockers,
          status: blockers.length > 0 ? 'blocked' : 'dispatched',
          dispatchedAt: createdAt,
          workerIdempotencyKey,
        }),
        productionReadinessReport: productionReadiness.report,
        toolCostEvents: billingAudit.toolCostEvents,
        walletSettlements: billingAudit.walletSettlements,
        trackBAdapterResult,
        workerRuntimeArtifactPipeline,
        workerResult,
        warnings: [
          ...warnings,
          ...(opsAdmission?.warnings ?? []),
          ...billingAudit.warnings,
          ...workerRuntimeArtifactPipeline.warnings,
          workerResult.output?.mockOnly === false
            ? 'Tool execution gateway dispatched through a reviewed real backend worker handler; no frontend tool execution occurred.'
            : 'Tool execution gateway dispatched only through mock-safe backend worker adapters; no frontend tool execution occurred.',
        ],
      }
    },

    async getProjectToolOutputManifest(input: { workspaceId: string; projectId: string }) {
      getRequiredAuthUserId(context)
      const warnings: string[] = []
      warnings.push(...await validateWorkspaceProjectAccess(context, {
        workspaceId: input.workspaceId,
        projectId: input.projectId,
        userId: context.auth?.userId ?? 'user-unknown',
      }))

      if (context.clients.admin && !context.env.mockOnly) {
        throw new ApiError(
          'MOCK_ONLY',
          'Durable production artifact manifest persistence is not connected yet; use mock-safe runtime artifact manifests or add the backend artifact table/RPC first.',
          409,
        )
      }

      return {
        outputManifest: getProjectWorkerRuntimeOutputManifest(input),
        warnings,
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
      productionReadinessEvidencePacketId: input.input.productionReadinessEvidencePacketId,
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
    productionReadinessEvidencePacketId: input.input.productionReadinessEvidencePacketId,
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
  input: ToolExecutionGatewayDispatchBody,
): ToolExecutionGatewayBlocker[] {
  const blockers: ToolExecutionGatewayBlocker[] = []
  const expectedWorkerType = adapterWorkerType[adapterId]
  if (expectedWorkerType !== input.workerType) {
    blockers.push({
      code: 'ADAPTER_WORKER_MISMATCH',
      gateName: 'adapter_dispatch',
      message: `${adapterId} can dispatch only ${expectedWorkerType}, not ${input.workerType}.`,
    })
  }

  if (input.executionMode === 'production_ready' && adapterId.endsWith('_placeholder')) {
    blockers.push({
      code: 'PRODUCTION_READY_PLACEHOLDER_ADAPTER_BLOCKED',
      gateName: 'adapter_dispatch',
      message: 'production_ready gateway dispatch requires a reviewed real backend handler adapter, not a placeholder adapter.',
      details: { adapterId },
    })
  }

  if (adapterId === 'cpu_analysis_worker_media_probe') {
    const mediaFoundation = input.metadata?.mediaFoundation
    const mode = mediaFoundation && typeof mediaFoundation === 'object'
      ? (mediaFoundation as Record<string, unknown>).mode
      : undefined

    if (input.requestedToolIds.length !== 1 || input.requestedToolIds[0] !== 'ffprobe') {
      blockers.push({
        code: 'MEDIA_PROBE_ADAPTER_TOOL_SCOPE_BLOCKED',
        gateName: 'adapter_dispatch',
        message: 'cpu_analysis_worker_media_probe may dispatch only one requested tool: ffprobe.',
        details: { requestedToolIds: input.requestedToolIds },
      })
    }

    if (input.executionMode === 'production_ready' && mode !== 'production_ready') {
      blockers.push({
        code: 'MEDIA_PROBE_ADAPTER_METADATA_REQUIRED',
        gateName: 'adapter_dispatch',
        message: 'cpu_analysis_worker_media_probe production dispatch requires metadata.mediaFoundation.mode=production_ready.',
        details: { mediaFoundationMode: mode },
      })
    }
  }

  if (adapterId === 'cpu_analysis_worker_media_audio_extract') {
    const mediaFoundation = input.metadata?.mediaFoundation
    const mediaFoundationRecord = mediaFoundation && typeof mediaFoundation === 'object'
      ? mediaFoundation as Record<string, unknown>
      : undefined
    const mode = mediaFoundationRecord?.mode
    const tasks = Array.isArray(mediaFoundationRecord?.tasks)
      ? mediaFoundationRecord.tasks
      : []
    const taskSet = new Set(tasks)
    const expectedTasks = ['probe', 'extract_audio', 'build_analysis_report']
    const unexpectedTasks = tasks.filter((task) => !expectedTasks.includes(String(task)))
    const missingTasks = expectedTasks.filter((task) => !taskSet.has(task))

    if (
      input.requestedToolIds.length !== 2 ||
      !input.requestedToolIds.includes('ffmpeg') ||
      !input.requestedToolIds.includes('ffprobe')
    ) {
      blockers.push({
        code: 'MEDIA_AUDIO_EXTRACT_ADAPTER_TOOL_SCOPE_BLOCKED',
        gateName: 'adapter_dispatch',
        message: 'cpu_analysis_worker_media_audio_extract may dispatch only the reviewed ffmpeg + ffprobe pair.',
        details: { requestedToolIds: input.requestedToolIds },
      })
    }

    if (input.executionMode === 'production_ready' && mode !== 'production_ready') {
      blockers.push({
        code: 'MEDIA_AUDIO_EXTRACT_ADAPTER_METADATA_REQUIRED',
        gateName: 'adapter_dispatch',
        message: 'cpu_analysis_worker_media_audio_extract production dispatch requires metadata.mediaFoundation.mode=production_ready.',
        details: { mediaFoundationMode: mode },
      })
    }

    if (input.executionMode === 'production_ready' && (tasks.length !== expectedTasks.length || unexpectedTasks.length > 0 || missingTasks.length > 0)) {
      blockers.push({
        code: 'MEDIA_AUDIO_EXTRACT_ADAPTER_TASK_SCOPE_BLOCKED',
        gateName: 'adapter_dispatch',
        message: 'cpu_analysis_worker_media_audio_extract is limited to probe, extract_audio, and build_analysis_report tasks.',
        details: { tasks, unexpectedTasks, missingTasks },
      })
    }

    if (input.executionMode === 'production_ready' && typeof mediaFoundationRecord?.outputRoot !== 'string') {
      blockers.push({
        code: 'MEDIA_AUDIO_EXTRACT_OUTPUT_ROOT_REQUIRED',
        gateName: 'adapter_dispatch',
        message: 'cpu_analysis_worker_media_audio_extract production dispatch requires metadata.mediaFoundation.outputRoot for the private extracted audio artifact.',
      })
    }
  }

  if (adapterId === 'cpu_analysis_worker_media_proxy') {
    const mediaFoundation = input.metadata?.mediaFoundation
    const mediaFoundationRecord = mediaFoundation && typeof mediaFoundation === 'object'
      ? mediaFoundation as Record<string, unknown>
      : undefined
    const mode = mediaFoundationRecord?.mode
    const tasks = Array.isArray(mediaFoundationRecord?.tasks)
      ? mediaFoundationRecord.tasks
      : []
    const taskSet = new Set(tasks)
    const expectedTasks = ['probe', 'create_proxy', 'build_analysis_report']
    const unexpectedTasks = tasks.filter((task) => !expectedTasks.includes(String(task)))
    const missingTasks = expectedTasks.filter((task) => !taskSet.has(task))

    if (
      input.requestedToolIds.length !== 2 ||
      !input.requestedToolIds.includes('ffmpeg') ||
      !input.requestedToolIds.includes('ffprobe')
    ) {
      blockers.push({
        code: 'MEDIA_PROXY_ADAPTER_TOOL_SCOPE_BLOCKED',
        gateName: 'adapter_dispatch',
        message: 'cpu_analysis_worker_media_proxy may dispatch only the reviewed ffmpeg + ffprobe pair.',
        details: { requestedToolIds: input.requestedToolIds },
      })
    }

    if (input.executionMode === 'production_ready' && mode !== 'production_ready') {
      blockers.push({
        code: 'MEDIA_PROXY_ADAPTER_METADATA_REQUIRED',
        gateName: 'adapter_dispatch',
        message: 'cpu_analysis_worker_media_proxy production dispatch requires metadata.mediaFoundation.mode=production_ready.',
        details: { mediaFoundationMode: mode },
      })
    }

    if (input.executionMode === 'production_ready' && (tasks.length !== expectedTasks.length || unexpectedTasks.length > 0 || missingTasks.length > 0)) {
      blockers.push({
        code: 'MEDIA_PROXY_ADAPTER_TASK_SCOPE_BLOCKED',
        gateName: 'adapter_dispatch',
        message: 'cpu_analysis_worker_media_proxy is limited to probe, create_proxy, and build_analysis_report tasks.',
        details: { tasks, unexpectedTasks, missingTasks },
      })
    }

    if (input.executionMode === 'production_ready' && typeof mediaFoundationRecord?.outputRoot !== 'string') {
      blockers.push({
        code: 'MEDIA_PROXY_OUTPUT_ROOT_REQUIRED',
        gateName: 'adapter_dispatch',
        message: 'cpu_analysis_worker_media_proxy production dispatch requires metadata.mediaFoundation.outputRoot for the private proxy artifact.',
      })
    }
  }

  if (adapterId === 'cpu_analysis_worker_media_keyframes') {
    const mediaFoundation = input.metadata?.mediaFoundation
    const mediaFoundationRecord = mediaFoundation && typeof mediaFoundation === 'object'
      ? mediaFoundation as Record<string, unknown>
      : undefined
    const mode = mediaFoundationRecord?.mode
    const tasks = Array.isArray(mediaFoundationRecord?.tasks)
      ? mediaFoundationRecord.tasks
      : []
    const taskSet = new Set(tasks)
    const expectedTasks = ['probe', 'extract_keyframes', 'build_analysis_report']
    const unexpectedTasks = tasks.filter((task) => !expectedTasks.includes(String(task)))
    const missingTasks = expectedTasks.filter((task) => !taskSet.has(task))

    if (
      input.requestedToolIds.length !== 2 ||
      !input.requestedToolIds.includes('ffmpeg') ||
      !input.requestedToolIds.includes('ffprobe')
    ) {
      blockers.push({
        code: 'MEDIA_KEYFRAMES_ADAPTER_TOOL_SCOPE_BLOCKED',
        gateName: 'adapter_dispatch',
        message: 'cpu_analysis_worker_media_keyframes may dispatch only the reviewed ffmpeg + ffprobe pair.',
        details: { requestedToolIds: input.requestedToolIds },
      })
    }

    if (input.executionMode === 'production_ready' && mode !== 'production_ready') {
      blockers.push({
        code: 'MEDIA_KEYFRAMES_ADAPTER_METADATA_REQUIRED',
        gateName: 'adapter_dispatch',
        message: 'cpu_analysis_worker_media_keyframes production dispatch requires metadata.mediaFoundation.mode=production_ready.',
        details: { mediaFoundationMode: mode },
      })
    }

    if (input.executionMode === 'production_ready' && (tasks.length !== expectedTasks.length || unexpectedTasks.length > 0 || missingTasks.length > 0)) {
      blockers.push({
        code: 'MEDIA_KEYFRAMES_ADAPTER_TASK_SCOPE_BLOCKED',
        gateName: 'adapter_dispatch',
        message: 'cpu_analysis_worker_media_keyframes is limited to probe, extract_keyframes, and build_analysis_report tasks.',
        details: { tasks, unexpectedTasks, missingTasks },
      })
    }

    if (input.executionMode === 'production_ready' && typeof mediaFoundationRecord?.outputRoot !== 'string') {
      blockers.push({
        code: 'MEDIA_KEYFRAMES_OUTPUT_ROOT_REQUIRED',
        gateName: 'adapter_dispatch',
        message: 'cpu_analysis_worker_media_keyframes production dispatch requires metadata.mediaFoundation.outputRoot for private keyframe artifacts.',
      })
    }
  }

  if (adapterId === 'cpu_analysis_worker_media_representative_frames') {
    const mediaFoundation = input.metadata?.mediaFoundation
    const mediaFoundationRecord = mediaFoundation && typeof mediaFoundation === 'object'
      ? mediaFoundation as Record<string, unknown>
      : undefined
    const mode = mediaFoundationRecord?.mode
    const tasks = Array.isArray(mediaFoundationRecord?.tasks)
      ? mediaFoundationRecord.tasks
      : []
    const taskSet = new Set(tasks)
    const expectedTasks = ['probe', 'extract_representative_frames', 'build_analysis_report']
    const unexpectedTasks = tasks.filter((task) => !expectedTasks.includes(String(task)))
    const missingTasks = expectedTasks.filter((task) => !taskSet.has(task))

    if (
      input.requestedToolIds.length !== 2 ||
      !input.requestedToolIds.includes('ffmpeg') ||
      !input.requestedToolIds.includes('ffprobe')
    ) {
      blockers.push({
        code: 'MEDIA_REPRESENTATIVE_FRAMES_ADAPTER_TOOL_SCOPE_BLOCKED',
        gateName: 'adapter_dispatch',
        message: 'cpu_analysis_worker_media_representative_frames may dispatch only the reviewed ffmpeg + ffprobe pair.',
        details: { requestedToolIds: input.requestedToolIds },
      })
    }

    if (input.executionMode === 'production_ready' && mode !== 'production_ready') {
      blockers.push({
        code: 'MEDIA_REPRESENTATIVE_FRAMES_ADAPTER_METADATA_REQUIRED',
        gateName: 'adapter_dispatch',
        message: 'cpu_analysis_worker_media_representative_frames production dispatch requires metadata.mediaFoundation.mode=production_ready.',
        details: { mediaFoundationMode: mode },
      })
    }

    if (input.executionMode === 'production_ready' && (tasks.length !== expectedTasks.length || unexpectedTasks.length > 0 || missingTasks.length > 0)) {
      blockers.push({
        code: 'MEDIA_REPRESENTATIVE_FRAMES_ADAPTER_TASK_SCOPE_BLOCKED',
        gateName: 'adapter_dispatch',
        message: 'cpu_analysis_worker_media_representative_frames is limited to probe, extract_representative_frames, and build_analysis_report tasks.',
        details: { tasks, unexpectedTasks, missingTasks },
      })
    }

    if (input.executionMode === 'production_ready' && typeof mediaFoundationRecord?.outputRoot !== 'string') {
      blockers.push({
        code: 'MEDIA_REPRESENTATIVE_FRAMES_OUTPUT_ROOT_REQUIRED',
        gateName: 'adapter_dispatch',
        message: 'cpu_analysis_worker_media_representative_frames production dispatch requires metadata.mediaFoundation.outputRoot for private representative-frame artifacts.',
      })
    }
  }

  if (adapterId === 'cpu_analysis_worker_smart_cut_timeline') {
    const smartCutTimelineExecution = input.metadata?.smartCutTimelineExecution
    const smartCutRecord = smartCutTimelineExecution && typeof smartCutTimelineExecution === 'object'
      ? smartCutTimelineExecution as Record<string, unknown>
      : undefined
    const mode = smartCutRecord?.mode
    const tasks = Array.isArray(smartCutRecord?.tasks)
      ? smartCutRecord.tasks
      : []
    const taskSet = new Set(tasks)
    const expectedTasks = ['build_execution_plan', 'build_timeline_manifest', 'build_otio_manifest', 'build_qa_report']
    const unexpectedTasks = tasks.filter((task) => !expectedTasks.includes(String(task)))
    const missingTasks = expectedTasks.filter((task) => !taskSet.has(task))

    if (input.requestedToolIds.length !== 1 || input.requestedToolIds[0] !== 'opentimelineio') {
      blockers.push({
        code: 'SMART_CUT_TIMELINE_ADAPTER_TOOL_SCOPE_BLOCKED',
        gateName: 'adapter_dispatch',
        message: 'cpu_analysis_worker_smart_cut_timeline may dispatch only the reviewed OpenTimelineIO timeline-manifest adapter scope.',
        details: { requestedToolIds: input.requestedToolIds },
      })
    }

    if (input.executionMode === 'production_ready' && mode !== 'production_ready') {
      blockers.push({
        code: 'SMART_CUT_TIMELINE_ADAPTER_METADATA_REQUIRED',
        gateName: 'adapter_dispatch',
        message: 'cpu_analysis_worker_smart_cut_timeline production dispatch requires metadata.smartCutTimelineExecution.mode=production_ready.',
        details: { smartCutTimelineMode: mode },
      })
    }

    if (input.executionMode === 'production_ready' && (tasks.length !== expectedTasks.length || unexpectedTasks.length > 0 || missingTasks.length > 0)) {
      blockers.push({
        code: 'SMART_CUT_TIMELINE_ADAPTER_TASK_SCOPE_BLOCKED',
        gateName: 'adapter_dispatch',
        message: 'cpu_analysis_worker_smart_cut_timeline is limited to execution-plan, timeline-manifest, OTIO-style manifest, and QA-report metadata tasks.',
        details: { tasks, unexpectedTasks, missingTasks },
      })
    }

    if (input.executionMode === 'production_ready' && (!smartCutRecord?.smartCutPlan || typeof smartCutRecord.smartCutPlan !== 'object')) {
      blockers.push({
        code: 'SMART_CUT_TIMELINE_PLAN_REQUIRED',
        gateName: 'adapter_dispatch',
        message: 'cpu_analysis_worker_smart_cut_timeline production dispatch requires an approved smartCutPlan object; it must not invent production cuts.',
      })
    }

    if (input.executionMode === 'production_ready' && smartCutRecord?.allowFinalExport === true) {
      blockers.push({
        code: 'SMART_CUT_TIMELINE_FINAL_EXPORT_BLOCKED',
        gateName: 'adapter_dispatch',
        message: 'cpu_analysis_worker_smart_cut_timeline cannot enable final export.',
      })
    }

    if (input.executionMode === 'production_ready' && smartCutRecord?.enableProxyPreview === true) {
      blockers.push({
        code: 'SMART_CUT_TIMELINE_PROXY_PREVIEW_BLOCKED',
        gateName: 'adapter_dispatch',
        message: 'cpu_analysis_worker_smart_cut_timeline production dispatch is metadata-only and cannot create proxy previews.',
      })
    }
  }

  if (adapterId === 'cpu_analysis_worker_color_metadata') {
    const colorExecution = input.metadata?.colorExecution
    const colorRecord = colorExecution && typeof colorExecution === 'object'
      ? colorExecution as Record<string, unknown>
      : undefined
    const mode = colorRecord?.mode
    const tasks = Array.isArray(colorRecord?.tasks)
      ? colorRecord.tasks
      : []
    const taskSet = new Set(tasks)
    const expectedTasks = ['build_color_analysis', 'build_color_grade_recipe', 'build_color_qa_report']
    const unexpectedTasks = tasks.filter((task) => !expectedTasks.includes(String(task)))
    const missingTasks = expectedTasks.filter((task) => !taskSet.has(task))

    if (
      input.requestedToolIds.length !== 2 ||
      !input.requestedToolIds.includes('opencolorio') ||
      !input.requestedToolIds.includes('openimageio')
    ) {
      blockers.push({
        code: 'COLOR_METADATA_ADAPTER_TOOL_SCOPE_BLOCKED',
        gateName: 'adapter_dispatch',
        message: 'cpu_analysis_worker_color_metadata may dispatch only the reviewed OpenColorIO + OpenImageIO metadata/QA adapter scope.',
        details: { requestedToolIds: input.requestedToolIds },
      })
    }

    if (input.executionMode === 'production_ready' && mode !== 'production_ready') {
      blockers.push({
        code: 'COLOR_METADATA_ADAPTER_METADATA_REQUIRED',
        gateName: 'adapter_dispatch',
        message: 'cpu_analysis_worker_color_metadata production dispatch requires metadata.colorExecution.mode=production_ready.',
        details: { colorExecutionMode: mode },
      })
    }

    if (input.executionMode === 'production_ready' && (tasks.length !== expectedTasks.length || unexpectedTasks.length > 0 || missingTasks.length > 0)) {
      blockers.push({
        code: 'COLOR_METADATA_ADAPTER_TASK_SCOPE_BLOCKED',
        gateName: 'adapter_dispatch',
        message: 'cpu_analysis_worker_color_metadata is limited to color analysis, color grade recipe, and color QA report metadata tasks.',
        details: { tasks, unexpectedTasks, missingTasks },
      })
    }

    if (input.executionMode === 'production_ready' && !colorRecord?.sourceVideoArtifactId && !colorRecord?.proxyVideoArtifactId && !Array.isArray(colorRecord?.representativeFrameArtifactIds)) {
      blockers.push({
        code: 'COLOR_METADATA_INPUT_ARTIFACT_REQUIRED',
        gateName: 'adapter_dispatch',
        message: 'cpu_analysis_worker_color_metadata production dispatch requires a private source, proxy, or representative-frame artifact reference.',
      })
    }

    if (input.executionMode === 'production_ready' && colorRecord?.allowFinalExport === true) {
      blockers.push({
        code: 'COLOR_METADATA_FINAL_EXPORT_BLOCKED',
        gateName: 'adapter_dispatch',
        message: 'cpu_analysis_worker_color_metadata cannot enable final export.',
      })
    }

    if (input.executionMode === 'production_ready' && colorRecord?.enableFfmpegColorPreview === true) {
      blockers.push({
        code: 'COLOR_METADATA_PREVIEW_EXECUTION_BLOCKED',
        gateName: 'adapter_dispatch',
        message: 'cpu_analysis_worker_color_metadata is metadata-only and cannot create FFmpeg color previews.',
      })
    }

    if (input.executionMode === 'production_ready' && (colorRecord?.enableOpenColorIOExecution === true || colorRecord?.enableOpenImageIOExecution === true)) {
      blockers.push({
        code: 'COLOR_METADATA_NATIVE_EXECUTION_BLOCKED',
        gateName: 'adapter_dispatch',
        message: 'cpu_analysis_worker_color_metadata is limited to metadata/QA and cannot run native OpenColorIO/OpenImageIO transforms.',
      })
    }
  }

  if (adapterId === 'cpu_analysis_worker_audio_metadata') {
    const audioExecution = input.metadata?.audioExecution
    const audioRecord = audioExecution && typeof audioExecution === 'object'
      ? audioExecution as Record<string, unknown>
      : undefined
    const mode = audioRecord?.mode
    const tasks = Array.isArray(audioRecord?.tasks)
      ? audioRecord.tasks
      : []
    const taskSet = new Set(tasks)
    const expectedTasks = ['build_audio_analysis', 'build_loudness_plan', 'build_soundsync_cues', 'build_audio_qa_report']
    const unexpectedTasks = tasks.filter((task) => !expectedTasks.includes(String(task)))
    const missingTasks = expectedTasks.filter((task) => !taskSet.has(task))
    const audioCleanupPlan = audioRecord?.audioCleanupPlan && typeof audioRecord.audioCleanupPlan === 'object'
      ? audioRecord.audioCleanupPlan as Record<string, unknown>
      : undefined
    const fallbackTools = Array.isArray(audioCleanupPlan?.fallbackTools)
      ? audioCleanupPlan.fallbackTools
      : []

    if (input.requestedToolIds.length !== 1 || input.requestedToolIds[0] !== 'audioflux') {
      blockers.push({
        code: 'AUDIO_METADATA_ADAPTER_TOOL_SCOPE_BLOCKED',
        gateName: 'adapter_dispatch',
        message: 'cpu_analysis_worker_audio_metadata may dispatch only the reviewed AudioFlux analysis/SoundSync metadata adapter scope.',
        details: { requestedToolIds: input.requestedToolIds },
      })
    }

    if (input.executionMode === 'production_ready' && mode !== 'production_ready') {
      blockers.push({
        code: 'AUDIO_METADATA_ADAPTER_METADATA_REQUIRED',
        gateName: 'adapter_dispatch',
        message: 'cpu_analysis_worker_audio_metadata production dispatch requires metadata.audioExecution.mode=production_ready.',
        details: { audioExecutionMode: mode },
      })
    }

    if (input.executionMode === 'production_ready' && (tasks.length !== expectedTasks.length || unexpectedTasks.length > 0 || missingTasks.length > 0)) {
      blockers.push({
        code: 'AUDIO_METADATA_ADAPTER_TASK_SCOPE_BLOCKED',
        gateName: 'adapter_dispatch',
        message: 'cpu_analysis_worker_audio_metadata is limited to audio analysis, loudness plan, SoundSync cue, and audio QA report metadata tasks.',
        details: { tasks, unexpectedTasks, missingTasks },
      })
    }

    if (input.executionMode === 'production_ready' && !audioRecord?.sourceAudioArtifactId) {
      blockers.push({
        code: 'AUDIO_METADATA_INPUT_ARTIFACT_REQUIRED',
        gateName: 'adapter_dispatch',
        message: 'cpu_analysis_worker_audio_metadata production dispatch requires a private source audio artifact reference.',
      })
    }

    if (input.executionMode === 'production_ready' && audioRecord?.allowFinalMux === true) {
      blockers.push({
        code: 'AUDIO_METADATA_FINAL_MUX_BLOCKED',
        gateName: 'adapter_dispatch',
        message: 'cpu_analysis_worker_audio_metadata cannot enable final mux/export.',
      })
    }

    if (input.executionMode === 'production_ready' && audioRecord?.enableFfmpegAudioExecution === true) {
      blockers.push({
        code: 'AUDIO_METADATA_FFMPEG_EXECUTION_BLOCKED',
        gateName: 'adapter_dispatch',
        message: 'cpu_analysis_worker_audio_metadata is metadata-only and cannot run FFmpeg audio commands.',
      })
    }

    if (input.executionMode === 'production_ready' && (audioRecord?.enableModelAudioExecution === true || audioRecord?.allowModelDownload === true)) {
      blockers.push({
        code: 'AUDIO_METADATA_MODEL_EXECUTION_BLOCKED',
        gateName: 'adapter_dispatch',
        message: 'cpu_analysis_worker_audio_metadata cannot run model audio tools or download model weights.',
      })
    }

    if (
      input.executionMode === 'production_ready' &&
      audioCleanupPlan &&
      (audioCleanupPlan.selectedPrimaryTool !== 'none' || fallbackTools.some((tool) => tool === 'deepfilternet' || tool === 'rnnoise' || tool === 'demucs'))
    ) {
      blockers.push({
        code: 'AUDIO_METADATA_CLEANUP_EXECUTION_BLOCKED',
        gateName: 'adapter_dispatch',
        message: 'cpu_analysis_worker_audio_metadata is limited to analysis/QA metadata and cannot request cleanup, denoise, or separation tools.',
        details: { selectedPrimaryTool: audioCleanupPlan.selectedPrimaryTool, fallbackTools },
      })
    }
  }

  if (adapterId === 'render_worker_final_render_metadata') {
    const finalRenderExecution = input.metadata?.finalRenderExecution
    const renderRecord = finalRenderExecution && typeof finalRenderExecution === 'object'
      ? finalRenderExecution as Record<string, unknown>
      : undefined
    const mode = renderRecord?.mode
    const tasks = Array.isArray(renderRecord?.tasks)
      ? renderRecord.tasks
      : []
    const taskSet = new Set(tasks)
    const expectedTasks = ['build_render_manifest', 'build_command_plans', 'build_render_qa_report', 'build_delivery_qa_report']
    const unexpectedTasks = tasks.filter((task) => !expectedTasks.includes(String(task)))
    const missingTasks = expectedTasks.filter((task) => !taskSet.has(task))

    if (
      input.requestedToolIds.length !== 3 ||
      !input.requestedToolIds.includes('remotion') ||
      !input.requestedToolIds.includes('ffmpeg') ||
      !input.requestedToolIds.includes('libass')
    ) {
      blockers.push({
        code: 'FINAL_RENDER_METADATA_ADAPTER_TOOL_SCOPE_BLOCKED',
        gateName: 'adapter_dispatch',
        message: 'render_worker_final_render_metadata may dispatch only the reviewed Remotion + FFmpeg + libass command-plan metadata adapter scope.',
        details: { requestedToolIds: input.requestedToolIds },
      })
    }

    if (input.executionMode === 'production_ready' && mode !== 'production_ready') {
      blockers.push({
        code: 'FINAL_RENDER_METADATA_ADAPTER_METADATA_REQUIRED',
        gateName: 'adapter_dispatch',
        message: 'render_worker_final_render_metadata production dispatch requires metadata.finalRenderExecution.mode=production_ready.',
        details: { finalRenderExecutionMode: mode },
      })
    }

    if (input.executionMode === 'production_ready' && (tasks.length !== expectedTasks.length || unexpectedTasks.length > 0 || missingTasks.length > 0)) {
      blockers.push({
        code: 'FINAL_RENDER_METADATA_ADAPTER_TASK_SCOPE_BLOCKED',
        gateName: 'adapter_dispatch',
        message: 'render_worker_final_render_metadata is limited to render-manifest, non-executing command-plan, render-QA, and delivery-QA metadata tasks.',
        details: { tasks, unexpectedTasks, missingTasks },
      })
    }

    if (input.executionMode === 'production_ready' && renderRecord?.renderMode !== 'command_plan_only') {
      blockers.push({
        code: 'FINAL_RENDER_METADATA_COMMAND_PLAN_ONLY_REQUIRED',
        gateName: 'adapter_dispatch',
        message: 'render_worker_final_render_metadata may run only with renderMode=command_plan_only; preview and final_export remain separate execution gates.',
        details: { renderMode: renderRecord?.renderMode },
      })
    }

    if (input.executionMode === 'production_ready' && (!renderRecord?.timelineManifestId || !renderRecord?.renderManifestId)) {
      blockers.push({
        code: 'FINAL_RENDER_METADATA_MANIFEST_IDS_REQUIRED',
        gateName: 'adapter_dispatch',
        message: 'render_worker_final_render_metadata requires approved timelineManifestId and renderManifestId references.',
        details: {
          hasTimelineManifestId: Boolean(renderRecord?.timelineManifestId),
          hasRenderManifestId: Boolean(renderRecord?.renderManifestId),
        },
      })
    }

    if (
      input.executionMode === 'production_ready' &&
      !Array.isArray(renderRecord?.sourceVideoArtifactIds) &&
      !Array.isArray(renderRecord?.proxyVideoArtifactIds)
    ) {
      blockers.push({
        code: 'FINAL_RENDER_METADATA_SOURCE_ARTIFACT_REQUIRED',
        gateName: 'adapter_dispatch',
        message: 'render_worker_final_render_metadata requires a private source or proxy artifact reference.',
      })
    }

    if (
      input.executionMode === 'production_ready' &&
      (
        renderRecord?.enableLocalDevRender === true ||
        renderRecord?.enableRemotionLocalRender === true ||
        renderRecord?.enableCaptionBurnIn === true
      )
    ) {
      blockers.push({
        code: 'FINAL_RENDER_METADATA_EXECUTION_FLAGS_BLOCKED',
        gateName: 'adapter_dispatch',
        message: 'render_worker_final_render_metadata is metadata-only and cannot enable local render, Remotion render, or libass caption burn-in execution.',
        details: {
          enableLocalDevRender: renderRecord?.enableLocalDevRender,
          enableRemotionLocalRender: renderRecord?.enableRemotionLocalRender,
          enableCaptionBurnIn: renderRecord?.enableCaptionBurnIn,
        },
      })
    }

    if (input.executionMode === 'production_ready' && renderRecord?.allowRevideo === true) {
      blockers.push({
        code: 'FINAL_RENDER_METADATA_REVIDEO_BLOCKED',
        gateName: 'adapter_dispatch',
        message: 'render_worker_final_render_metadata cannot use Revideo.',
      })
    }
  }

  if (adapterId === 'render_worker_caption_metadata') {
    const captionExecution = input.metadata?.speechCaptionExecution
    const captionRecord = captionExecution && typeof captionExecution === 'object'
      ? captionExecution as Record<string, unknown>
      : undefined
    const mode = captionRecord?.mode
    const tasks = Array.isArray(captionRecord?.tasks)
      ? captionRecord.tasks
      : []
    const taskSet = new Set(tasks)
    const expectedTasks = ['build_caption_segments', 'build_caption_files', 'build_caption_qa_report']
    const unexpectedTasks = tasks.filter((task) => !expectedTasks.includes(String(task)))
    const missingTasks = expectedTasks.filter((task) => !taskSet.has(task))
    const transcriptSegments = Array.isArray(captionRecord?.transcriptSegments)
      ? captionRecord.transcriptSegments
      : []
    const wordTimestamps = Array.isArray(captionRecord?.wordTimestamps)
      ? captionRecord.wordTimestamps
      : []
    const captionFormats = Array.isArray(captionRecord?.captionFormats)
      ? captionRecord.captionFormats
      : []
    const captionFormatSet = new Set(captionFormats)
    const requiredFormats = ['srt', 'webvtt', 'ass']
    const missingFormats = requiredFormats.filter((format) => !captionFormatSet.has(format))
    const unexpectedFormats = captionFormats.filter((format) => !requiredFormats.includes(String(format)))

    if (input.requestedToolIds.length !== 1 || input.requestedToolIds[0] !== 'libass') {
      blockers.push({
        code: 'CAPTION_METADATA_ADAPTER_TOOL_SCOPE_BLOCKED',
        gateName: 'adapter_dispatch',
        message: 'render_worker_caption_metadata may dispatch only the reviewed libass caption metadata/QA adapter scope.',
        details: { requestedToolIds: input.requestedToolIds },
      })
    }

    if (input.executionMode === 'production_ready' && mode !== 'production_ready') {
      blockers.push({
        code: 'CAPTION_METADATA_ADAPTER_METADATA_REQUIRED',
        gateName: 'adapter_dispatch',
        message: 'render_worker_caption_metadata production dispatch requires metadata.speechCaptionExecution.mode=production_ready.',
        details: { speechCaptionExecutionMode: mode },
      })
    }

    if (input.executionMode === 'production_ready' && (tasks.length !== expectedTasks.length || unexpectedTasks.length > 0 || missingTasks.length > 0)) {
      blockers.push({
        code: 'CAPTION_METADATA_ADAPTER_TASK_SCOPE_BLOCKED',
        gateName: 'adapter_dispatch',
        message: 'render_worker_caption_metadata is limited to caption segmentation, caption file text, and caption QA metadata tasks.',
        details: { tasks, unexpectedTasks, missingTasks },
      })
    }

    if (input.executionMode === 'production_ready' && transcriptSegments.length === 0 && wordTimestamps.length === 0) {
      blockers.push({
        code: 'CAPTION_METADATA_TRANSCRIPT_TIMING_REQUIRED',
        gateName: 'adapter_dispatch',
        message: 'render_worker_caption_metadata requires approved transcript segments or word timestamps and cannot invent captions from mock text.',
      })
    }

    if (input.executionMode === 'production_ready' && (captionFormats.length !== requiredFormats.length || missingFormats.length > 0 || unexpectedFormats.length > 0)) {
      blockers.push({
        code: 'CAPTION_METADATA_FORMAT_SCOPE_BLOCKED',
        gateName: 'adapter_dispatch',
        message: 'render_worker_caption_metadata must build only the reviewed SRT, WebVTT, and ASS private caption file metadata set.',
        details: { captionFormats, missingFormats, unexpectedFormats },
      })
    }

    if (
      input.executionMode === 'production_ready' &&
      (
        captionRecord?.buildSpeech === true ||
        captionRecord?.enableRealTranscription === true ||
        captionRecord?.allowModelDownload === true ||
        typeof captionRecord?.modelWeightManifestId === 'string' ||
        typeof captionRecord?.localModelPath === 'string'
      )
    ) {
      blockers.push({
        code: 'CAPTION_METADATA_SPEECH_MODEL_SCOPE_BLOCKED',
        gateName: 'adapter_dispatch',
        message: 'render_worker_caption_metadata cannot run speech transcription, use model weights, or download models.',
      })
    }

    if (
      input.executionMode === 'production_ready' &&
      (
        captionRecord?.enableCaptionPreview === true ||
        captionRecord?.buildPreview === true ||
        typeof captionRecord?.sourceVideoLocalPath === 'string' ||
        typeof captionRecord?.outputDirectory === 'string'
      )
    ) {
      blockers.push({
        code: 'CAPTION_METADATA_RENDER_PREVIEW_SCOPE_BLOCKED',
        gateName: 'adapter_dispatch',
        message: 'render_worker_caption_metadata cannot run preview burn-in, use local source video paths, or write local output files.',
      })
    }
  }

  if (adapterId === 'tool_readiness_worker_core_checks') {
    const toolReadiness = input.metadata?.toolReadiness
    const mode = toolReadiness && typeof toolReadiness === 'object'
      ? (toolReadiness as Record<string, unknown>).mode
      : undefined
    const allowedToolIds = new Set<ProductionToolId>(listM10CoreCpuRenderToolIds())
    const outOfScopeToolIds = input.requestedToolIds.filter((toolId) => !allowedToolIds.has(toolId))

    if (outOfScopeToolIds.length > 0) {
      blockers.push({
        code: 'TOOL_READINESS_ADAPTER_TOOL_SCOPE_BLOCKED',
        gateName: 'adapter_dispatch',
        message: 'tool_readiness_worker_core_checks may inspect only the reviewed M10 core CPU/render readiness tool set.',
        details: { requestedToolIds: input.requestedToolIds, outOfScopeToolIds },
      })
    }

    if (input.executionMode === 'production_ready' && mode !== 'production_ready') {
      blockers.push({
        code: 'TOOL_READINESS_ADAPTER_METADATA_REQUIRED',
        gateName: 'adapter_dispatch',
        message: 'tool_readiness_worker_core_checks production dispatch requires metadata.toolReadiness.mode=production_ready.',
        details: { toolReadinessMode: mode },
      })
    }
  }

  return blockers
}

function validateToolReadiness(
  toolIds: ProductionToolId[],
  workerType: ProductionWorkerRuntimeType,
  executionMode: ProductionWorkerExecutionMode,
  trackBAdapterToolId?: string,
  adapterId?: ToolExecutionGatewayAdapterId,
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

    const reviewedCrossWorkerAdapter = (
      adapterId === 'tool_readiness_worker_core_checks' && workerType === 'tool_readiness_worker'
    ) || (
      adapterId === 'cpu_analysis_worker_media_audio_extract' && workerType === 'cpu_analysis_worker'
    ) || (
      adapterId === 'cpu_analysis_worker_media_proxy' && workerType === 'cpu_analysis_worker'
    ) || (
      adapterId === 'cpu_analysis_worker_media_keyframes' && workerType === 'cpu_analysis_worker'
    ) || (
      adapterId === 'cpu_analysis_worker_media_representative_frames' && workerType === 'cpu_analysis_worker'
    ) || (
      adapterId === 'render_worker_caption_metadata' && workerType === 'render_worker'
    )
    const runtime = reviewedCrossWorkerAdapter
      ? evaluateRuntimePolicy(profile)
      : evaluateRuntimePolicy(profile, workerType)
    blockers.push(...runtime.blockingReasons.map((message) => ({
      code: 'TOOL_NOT_READY',
      gateName: 'tool_readiness',
      message,
      details: { toolId, workerType, executionMode, adapterId },
    })))

    if (executionMode === 'production_ready') {
      const license = evaluateToolLicensePolicy(profile)
      const modelWeight = evaluateToolModelWeightPolicy(profile)
      blockers.push(...license.blockingReasons.map((message) => ({
        code: 'LICENSE_REVIEW_REQUIRED',
        gateName: 'license_model_weight',
        message,
        details: { toolId, adapterId },
      })))
      blockers.push(...modelWeight.blockingReasons.map((message) => ({
        code: 'MODEL_WEIGHT_REVIEW_REQUIRED',
        gateName: 'license_model_weight',
        message,
        details: { toolId, adapterId },
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

function validateMetadataSafety(
  metadata: Record<string, unknown> | undefined,
  adapterId?: ToolExecutionGatewayAdapterId,
): ToolExecutionGatewayBlocker[] {
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
  const allowedReservedKeys = new Set<string>()
  if (
    adapterId === 'cpu_analysis_worker_media_probe' ||
    adapterId === 'cpu_analysis_worker_media_audio_extract' ||
    adapterId === 'cpu_analysis_worker_media_proxy' ||
    adapterId === 'cpu_analysis_worker_media_keyframes' ||
    adapterId === 'cpu_analysis_worker_media_representative_frames'
  ) {
    allowedReservedKeys.add('mediaFoundation')
  }
  if (adapterId === 'cpu_analysis_worker_smart_cut_timeline') {
    allowedReservedKeys.add('smartCutTimelineExecution')
  }
  if (adapterId === 'cpu_analysis_worker_color_metadata') {
    allowedReservedKeys.add('colorExecution')
  }
  if (adapterId === 'cpu_analysis_worker_audio_metadata') {
    allowedReservedKeys.add('audioExecution')
  }
  if (adapterId === 'render_worker_final_render_metadata') {
    allowedReservedKeys.add('finalRenderExecution')
  }
  if (adapterId === 'render_worker_caption_metadata') {
    allowedReservedKeys.add('speechCaptionExecution')
  }
  const reservedFound = reservedRouterKeys
    .filter((key) => !allowedReservedKeys.has(key))
    .filter((key) => Object.prototype.hasOwnProperty.call(metadata, key))
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

async function validateProductionReadinessGate(context: ServiceContext, input: ToolExecutionGatewayDispatchBody): Promise<{
  report?: ProductionToolExecutionReadinessGateReport
  blockers: ToolExecutionGatewayBlocker[]
}> {
  if (input.executionMode !== 'production_ready') return { blockers: [] }

  if (input.productionReadinessEvidence && input.productionReadinessEvidencePacketId) {
    return {
      blockers: [{
        code: 'PRODUCTION_READINESS_EVIDENCE_AMBIGUOUS',
        gateName: 'production_readiness_gate',
        message: 'production_ready gateway dispatch must supply either productionReadinessEvidence or productionReadinessEvidencePacketId, not both.',
      }],
    }
  }

  let productionReadinessEvidence = input.productionReadinessEvidence
  if (!productionReadinessEvidence && input.productionReadinessEvidencePacketId) {
    try {
      const packet = await getProductionReadinessEvidencePacket(context, input.workspaceId, input.productionReadinessEvidencePacketId)
      if (!packet) {
        return {
          blockers: [{
            code: 'PRODUCTION_READINESS_EVIDENCE_PACKET_NOT_FOUND',
            gateName: 'production_readiness_gate',
            message: 'production_ready gateway dispatch could not find the supplied production readiness evidence packet for this workspace.',
            details: {
              productionReadinessEvidencePacketId: input.productionReadinessEvidencePacketId,
              workspaceId: input.workspaceId,
            },
          }],
        }
      }
      productionReadinessEvidence = packet.readinessInput
    } catch (error) {
      return {
        blockers: [{
          code: 'PRODUCTION_READINESS_EVIDENCE_PACKET_LOOKUP_FAILED',
          gateName: 'production_readiness_gate',
          message: error instanceof Error
            ? error.message
            : 'Production readiness evidence packet lookup failed.',
          details: {
            productionReadinessEvidencePacketId: input.productionReadinessEvidencePacketId,
          },
        }],
      }
    }
  }

  if (!productionReadinessEvidence) {
    return {
      blockers: [{
        code: 'PRODUCTION_READINESS_GATE_REQUIRED',
        gateName: 'production_readiness_gate',
        message: 'production_ready gateway dispatch requires a passing production tool execution readiness evidence packet.',
      }],
    }
  }

  const blockers: ToolExecutionGatewayBlocker[] = []
  if (productionReadinessEvidence.workspaceId !== input.workspaceId) {
    blockers.push({
      code: 'PRODUCTION_READINESS_WORKSPACE_MISMATCH',
      gateName: 'production_readiness_gate',
      message: 'Production readiness evidence workspaceId does not match the gateway request workspaceId.',
      details: {
        requestWorkspaceId: input.workspaceId,
        evidenceWorkspaceId: productionReadinessEvidence.workspaceId,
      },
    })
  }
  if (productionReadinessEvidence.projectId !== input.projectId) {
    blockers.push({
      code: 'PRODUCTION_READINESS_PROJECT_MISMATCH',
      gateName: 'production_readiness_gate',
      message: 'Production readiness evidence projectId does not match the gateway request projectId.',
      details: {
        requestProjectId: input.projectId,
        evidenceProjectId: productionReadinessEvidence.projectId,
      },
    })
  }

  try {
    const report = evaluateProductionToolExecutionReadinessGate(productionReadinessEvidence)
    if (!report.productionToolExecutionAllowed) {
      blockers.push({
        code: 'PRODUCTION_READINESS_GATE_BLOCKED',
        gateName: 'production_readiness_gate',
        message: 'Production tool execution readiness gate did not pass for the supplied evidence packet.',
        details: {
          status: report.status,
          blockerCount: report.blockers.length,
          blockers: report.blockers.slice(0, 10),
        },
      })
    }
    return { report, blockers }
  } catch (error) {
    return {
      blockers: [{
        code: 'PRODUCTION_READINESS_EVIDENCE_INVALID',
        gateName: 'production_readiness_gate',
        message: error instanceof Error
          ? error.message
          : 'Production readiness evidence could not be evaluated.',
      }],
    }
  }
}

async function getProductionReadinessEvidencePacket(
  context: ServiceContext,
  workspaceId: string,
  packetId: string,
) {
  if (context.clients.admin && !context.env.mockOnly) {
    return getPersistentProductionToolExecutionReadinessEvidencePacket(context.clients.admin, workspaceId, packetId)
  }
  return getMockProductionToolExecutionReadinessEvidencePacket(workspaceId, packetId)
}

async function recordGatewayBillingAudit(input: {
  context: ServiceContext
  input: ToolExecutionGatewayDispatchBody & { apiIdempotencyKey: string }
  workerResult: ProductionWorkerExecutionResult | undefined
  workerIdempotencyKey: string
}): Promise<{
  toolCostEvents: ToolCostEvent[]
  walletSettlements: ToolCostWalletSettlement[]
  warnings: string[]
  blockers: ToolExecutionGatewayBlocker[]
}> {
  if (input.input.executionMode !== 'production_ready') {
    return { toolCostEvents: [], walletSettlements: [], warnings: [], blockers: [] }
  }

  if (!input.workerResult) {
    return {
      toolCostEvents: [],
      walletSettlements: [],
      warnings: [],
      blockers: [{
        code: 'TOOL_COST_BILLING_AUDIT_MISSING_WORKER_RESULT',
        gateName: 'billing_audit',
        message: 'Production-ready gateway billing audit requires a worker result.',
      }],
    }
  }

  const toolCostEvents: ToolCostEvent[] = []
  const walletSettlements: ToolCostWalletSettlement[] = []
  const warnings: string[] = []
  const blockers: ToolExecutionGatewayBlocker[] = []
  const meteringService = createToolCostMeteringService(input.context)

  for (const toolId of input.input.requestedToolIds) {
    try {
      const coverage = getToolCostOwnerCoverage(toolId)
      const failureCategory = input.workerResult.status === 'completed'
        ? 'none'
        : mapWorkerFailureCategory(input.workerResult.error?.failureCategory)
      const eventResult = await meteringService.emitToolCostEvent({
        workspaceId: input.input.workspaceId,
        projectId: input.input.projectId,
        editPlanId: input.input.editPlanId ?? null,
        jobId: input.input.jobId,
        jobBatchId: input.input.toolExecutionPlanId,
        creditEstimateId: input.input.creditEstimateId,
        creditReservationId: input.input.creditReservationId,
        toolId,
        toolName: coverage.displayName,
        usageCategory: coverage.usageCategory,
        providerType: coverage.providerType,
        providerName: 'reeditpro-tool-execution-gateway',
        modelName: null,
        qualityLevel: coverage.qualityLevel,
        startedAt: input.workerResult.startedAt,
        completedAt: input.workerResult.completedAt,
        wallClockMs: Math.max(0, Date.parse(input.workerResult.completedAt) - Date.parse(input.workerResult.startedAt)),
        retryAttempt: input.input.attempt,
        failureCategory,
        billableToUser: shouldBillGatewayEventToUser(input.input, input.workerResult),
        approvedReservationRemainingCredits: input.input.approvedReservationRemainingCredits,
        gpuCount: coverage.gpuRequired ? 1 : 0,
        metadata: {
          gatewayBillingAudit: true,
          gatewayAdapterId: input.input.adapterId ?? defaultAdapterForWorker(input.input.workerType),
          toolExecutionPlanId: input.input.toolExecutionPlanId,
          workerIdempotencyKey: input.workerIdempotencyKey,
          serviceFeeIncluded: false,
          stripeCallAttempted: false,
        },
      }, `${input.workerIdempotencyKey}:tool-cost:${toolId}`)
      toolCostEvents.push(eventResult.event)
      warnings.push(...eventResult.warnings)

      const settlementResult = await settleToolCostWallet(input.context, {
        workspaceId: input.input.workspaceId,
        projectId: input.input.projectId,
        toolCostEventId: eventResult.event.id,
        creditEstimateId: eventResult.event.creditEstimateId,
        creditReservationId: eventResult.event.creditReservationId,
        toolCostCredits: eventResult.event.toolCostCredits,
        billableToUser: eventResult.event.billableToUser,
        failureCategory: eventResult.event.failureCategory,
        settlementType: eventResult.event.billableToUser ? 'spend' : 'release',
        metadata: {
          gatewayBillingAudit: true,
          workerIdempotencyKey: input.workerIdempotencyKey,
          toolId,
          serviceFeeIncluded: false,
          stripeCallAttempted: false,
        },
      }, `${input.workerIdempotencyKey}:wallet-settlement:${toolId}`)
      walletSettlements.push(settlementResult.settlement)
      warnings.push(...settlementResult.warnings)
    } catch (error) {
      blockers.push({
        code: 'TOOL_COST_BILLING_AUDIT_FAILED',
        gateName: 'billing_audit',
        message: error instanceof Error
          ? error.message
          : 'Production-ready gateway billing audit failed.',
        details: { toolId },
      })
    }
  }

  return { toolCostEvents, walletSettlements, warnings, blockers }
}

function shouldBillGatewayEventToUser(
  input: ToolExecutionGatewayDispatchBody,
  workerResult: ProductionWorkerExecutionResult,
): boolean {
  if (input.workerType === 'tool_readiness_worker') return false
  return workerResult.status === 'completed' && workerResult.output?.mockOnly === false
}

function mapWorkerFailureCategory(category: ProductionWorkerFailureCategory | undefined): ToolCostFailureCategory {
  switch (category) {
    case 'credit_blocked':
      return 'credit_not_reserved'
    case 'missing_artifact':
      return 'asset_missing'
    case 'qa_failed':
      return 'quality_failed'
    case 'policy_blocked':
    case 'license_blocked':
    case 'model_weight_blocked':
    case 'invalid_payload':
      return 'approval_missing'
    case 'transient_runtime':
    case 'tool_unavailable':
      return 'worker_error'
    case 'unknown':
    default:
      return 'unknown'
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
