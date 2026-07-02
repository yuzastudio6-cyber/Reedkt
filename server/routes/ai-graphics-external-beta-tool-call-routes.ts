import { Router } from 'express'
import { z } from 'zod'
import { ApiError } from '../errors/api-error'
import { createAiGraphicsToolRuntimeQueueService } from '../services/ai-graphics-tool-runtime-queue-service'
import { listAiGraphicsToolCallHandoffTools } from '../tool-registry/ai-graphics-tool-call-handoff'
import { evaluateAiGraphicsToolCallPlan } from '../tool-registry/ai-graphics-tool-call-plan-evaluator'
import { getAiGraphicsToolCallReadiness } from '../tool-registry/ai-graphics-tool-call-readiness'
import type { ServiceContext } from '../types'
import { validateBody } from '../validation/common-schemas'
import { asyncRoute, getServiceContext, sendOk } from './route-helpers'

export const AI_GRAPHICS_EXTERNAL_BETA_TOOL_CALL_ROUTE_PATH =
  '/api/ai-graphics/external-beta/tool-call'

export const AI_GRAPHICS_EXTERNAL_BETA_TOOL_CALL_ROUTE_MOCK_QUEUE_ADMISSION_FLAG =
  'AI_GRAPHICS_EXTERNAL_BETA_TOOL_CALL_ROUTE_MOCK_QUEUE_ADMISSION_ENABLED'

export const AI_GRAPHICS_EXTERNAL_BETA_TOOL_CALL_ROUTE_REQUIRED_FUTURE_MIDDLEWARE = [
  'requireAuth',
  'requireIdempotency',
  'approvedSnapshotResolver',
  'creditReservationResolver',
  'privateArtifactPolicy',
  'assetManifestBinding',
  'dependencyReadinessPolicy',
  'asyncCheckbackPolicy',
  'queueSubmissionAuthorization',
  'serviceRoleBoundary',
  'rateLimitPolicy',
  'costGuardrailPolicy',
  'auditLog',
  'telemetry',
  'killSwitch',
] as const

const aiGraphicsToolIdSchema = z.enum([
  'torch_torchvision',
  'transformers',
  'sam2',
  'birefnet',
  'real_esrgan',
  'kornia',
  'rembg',
  'transparent_background',
  'd3',
  'echarts',
  'vega_lite',
  'vega',
  'satori',
  'svgdotjs_svg_js',
  'viz_js',
  'lottie_web',
  'animejs',
  'three_js',
  'pixi_js',
  'konva',
  'babylonjs',
])

const aiGraphicsCapabilitySchema = z.enum([
  'chart_overlay',
  'data_visualization',
  'svg_graphics',
  'diagram_graphics',
  'animation_overlay',
  'canvas_scene',
  'webgl_3d_scene',
  'background_removal',
  'subject_segmentation',
  'upscaling',
  'tensor_image_ops',
  'model_runtime_foundation',
])

const privateRefSchema = z.string().min(1).regex(/^private:\/\//)

export const aiGraphicsExternalBetaToolCallRequestSchema = z.object({
  workspaceId: z.string().min(1),
  requestId: z.string().min(1),
  toolId: aiGraphicsToolIdSchema,
  capabilityId: aiGraphicsCapabilitySchema,
  approvedPlanSnapshotId: z.string().min(1),
  creditReservationId: z.string().min(1),
  privateArtifactManifestRef: privateRefSchema,
  toolRouteApprovalRef: privateRefSchema,
  workerApprovalRef: privateRefSchema,
  runtimeEnqueueApprovalRef: privateRefSchema,
  ownerRuntimeApprovalRef: privateRefSchema,
  traceId: z.string().min(1),
  payload: z.record(z.string(), z.unknown()).optional(),
})

export type AiGraphicsExternalBetaToolCallRequest = z.infer<
  typeof aiGraphicsExternalBetaToolCallRequestSchema
>

export function buildAiGraphicsExternalBetaToolCallBlockedDetails(
  request: AiGraphicsExternalBetaToolCallRequest,
) {
  const planEvaluation = evaluateAiGraphicsToolCallPlan({
    capabilityId: request.capabilityId,
    requestedToolIds: [request.toolId],
    executionRequested: true,
    approvedPlanSnapshotId: request.approvedPlanSnapshotId,
    creditReservationId: request.creditReservationId,
    artifactBoundaryApproved: true,
  })
  const selectedTool = planEvaluation.selectedTools.find(
    (tool) => tool.toolId === request.toolId,
  )

  return {
    routeMountedByAppNow: true,
    routeMountFeatureFlagEnabled: true,
    externalAgentExecutionGateRequired: true,
    requestAcceptedForPlanningMetadata: selectedTool !== undefined,
    requestId: request.requestId,
    toolId: request.toolId,
    capabilityId: request.capabilityId,
    planEvaluationDecision: planEvaluation.decision,
    planEvaluationSourceDecision: planEvaluation.sourceDecision,
    requestedToolsAcceptedForPlanning:
      planEvaluation.requestedToolsAcceptedForPlanning,
    requestedToolsEliminated: planEvaluation.requestedToolsEliminated,
    selectedPlanningTools: planEvaluation.selectedTools.map((tool) => ({
      toolId: tool.toolId,
      productionToolId: tool.productionToolId,
      workerType: tool.workerType,
      rankingTier: tool.rankingTier,
      runtimeTarget: tool.runtimeTarget,
      gpuRequiredForRuntime: tool.gpuRequiredForRuntime,
      canSelectForPlanning: tool.canSelectForPlanning,
      canExecuteNow: tool.canExecuteNow,
      blockersBeforeExecution: tool.blockersBeforeExecution,
      nextProofMilestone: tool.nextProofMilestone,
    })),
    missingProofBeforeExecution: planEvaluation.missingProofBeforeExecution,
    missingExecutionGates: planEvaluation.missingExecutionGates,
    properInstallAuditAcceptedToolsWithProvidedEvidence: 21,
    controlledOnDemandExternalBetaReadyToolsWithProvidedEvidence: 21,
    controlledOnDemandWorkerPathReadyButDirectAgentExecutionBlocked: true,
    directAgentToolExecutionApprovedNow: false,
    routeExecutionApprovedNow: false,
    queueWriteApprovedNow: false,
    workerEnqueueApprovedNow: false,
    workerDispatchApprovedNow: false,
    toolExecutionApprovedNow: false,
    gpuRuntimeStartAllowedForAcceptedExternalBetaJob:
      selectedTool?.gpuRequiredForRuntime === true,
    gpuRuntimeShouldStartNow: false,
    externalBetaReadyNow: false,
    productionReadyNow: false,
  }
}

export async function admitAiGraphicsExternalBetaToolCallToMockQueue(
  request: AiGraphicsExternalBetaToolCallRequest,
  serviceContext: ServiceContext,
) {
  if (!serviceContext.env.aiGraphicsExternalBetaToolCallRouteMockQueueAdmissionEnabled) {
    throw new ApiError(
      'TOOL_NOT_READY',
      'AI graphics external-beta tool-call route queue admission is disabled.',
      409,
      buildAiGraphicsExternalBetaToolCallBlockedDetails(request),
    )
  }
  if (!serviceContext.env.mockOnly) {
    throw new ApiError(
      'MOCK_ONLY',
      'AI graphics external-beta route queue admission smoke requires explicit mock runtime mode; live service-role queue writes remain separately gated.',
      409,
      {
        requestId: request.requestId,
        toolId: request.toolId,
        capabilityId: request.capabilityId,
        queueAdmissionSmokeRequiresMockOnly: true,
        liveQueueWriteApprovedNow: false,
        workerDispatchApprovedNow: false,
        toolExecutionApprovedNow: false,
        gpuRuntimeShouldStartNow: false,
      },
    )
  }

  const readiness = getAiGraphicsToolCallReadiness(request.toolId)
  if (!readiness?.productionToolId) {
    throw new ApiError(
      'VALIDATION_FAILED',
      `AI graphics canonical production mapping is missing for ${request.toolId}.`,
      400,
    )
  }
  if (!readiness.capabilities.includes(request.capabilityId)) {
    throw new ApiError(
      'VALIDATION_FAILED',
      `AI graphics capability ${request.capabilityId} is not valid for ${request.toolId}.`,
      400,
    )
  }

  const queueService = createAiGraphicsToolRuntimeQueueService(serviceContext)
  const enqueue = await queueService.enqueueToolRuntimeJobs({
    workspaceId: request.workspaceId,
    projectId: `project-ai-graphics-external-beta-${request.workspaceId}`,
    approvedPlanSnapshotId: request.approvedPlanSnapshotId,
    creditReservationId: request.creditReservationId,
    idempotencyKey: `ai-graphics-external-beta-tool-call-route:${request.requestId}:${request.toolId}`,
    batchName: 'AI graphics external beta tool-call route mock queue admission',
    createdByAgent: 'ai_graphics_external_beta_tool_call_route',
    jobs: [
      {
        toolId: request.toolId,
        productionToolId: readiness.productionToolId,
        workerType: readiness.productionWorkerType,
        runtimeTarget: readiness.runtimeTarget,
        capabilityIds: [request.capabilityId],
        privateArtifactManifestRef: request.privateArtifactManifestRef,
        idempotencyKey:
          `ai-graphics-external-beta-tool-call-route:${request.requestId}:${request.toolId}:job`,
        priority: 'normal',
        maxAttempts: 3,
        inputPayload: {
          sourceRoute: AI_GRAPHICS_EXTERNAL_BETA_TOOL_CALL_ROUTE_PATH,
          traceId: request.traceId,
          toolRouteApprovalRef: request.toolRouteApprovalRef,
          workerApprovalRef: request.workerApprovalRef,
          runtimeEnqueueApprovalRef: request.runtimeEnqueueApprovalRef,
          ownerRuntimeApprovalRef: request.ownerRuntimeApprovalRef,
          payload: request.payload ?? {},
          routeQueueAdmissionSmokeOnly: true,
          routeExecutionPerformed: true,
          backendQueueSubmissionPerformed: false,
          workerEnqueuePerformed: false,
          workerDispatchPerformed: false,
          toolExecutionPerformed: false,
          gpuRuntimeShouldStartNow: false,
          publicArtifactCreated: false,
          signedUrlCreated: false,
        },
      },
    ],
  })
  const queueResult = enqueue.queueResult as {
    jobBatchId?: string
    jobIds?: string[]
    insertedJobCount?: number
    mockOnly?: boolean
    liveToolExecutionPerformed?: boolean
  }

  return {
    routeDecision:
      'ai_graphics_external_beta_tool_call_route_mock_queue_admission_accepted',
    routeStatus:
      'external_beta_tool_call_route_mock_queue_admission_accepted_runtime_still_blocked',
    routePath: AI_GRAPHICS_EXTERNAL_BETA_TOOL_CALL_ROUTE_PATH,
    routeFlag: AI_GRAPHICS_EXTERNAL_BETA_TOOL_CALL_ROUTE_MOCK_QUEUE_ADMISSION_FLAG,
    workspaceId: request.workspaceId,
    requestId: request.requestId,
    toolId: request.toolId,
    productionToolId: readiness.productionToolId,
    capabilityId: request.capabilityId,
    workerType: readiness.productionWorkerType,
    runtimeTarget: readiness.runtimeTarget,
    approvedPlanSnapshotId: request.approvedPlanSnapshotId,
    creditReservationId: request.creditReservationId,
    privateArtifactManifestRef: request.privateArtifactManifestRef,
    queueName: 'ai_graphics_external_beta_tool_runtime',
    queueAdmissionMode: 'mock_only',
    queueResult: {
      jobBatchId: queueResult.jobBatchId ?? null,
      jobIds: Array.isArray(queueResult.jobIds) ? queueResult.jobIds : [],
      insertedJobCount: queueResult.insertedJobCount ?? 0,
      mockOnly: queueResult.mockOnly === true,
      liveToolExecutionPerformed: queueResult.liveToolExecutionPerformed === true,
    },
    warnings: enqueue.warnings,
    counts: {
      totalAiGraphicsTools: 21,
      totalProductFacingCapabilities: 12,
      mockQueueAdmissionAcceptedTools: 1,
      scopedControlledToolsCallableNow: 13,
      remainingGpuModelToolsBlockedForRuntime: 8,
      liveQueueWritePerformedTools: 0,
      workerDispatchPerformedTools: 0,
      toolExecutionPerformedTools: 0,
      gpuRuntimeShouldStartNowTools: 0,
    },
    booleans: {
      externalBetaToolCallRouteMockQueueAdmissionAccepted: true,
      routeSchemaAccepted: true,
      approvedPlanSnapshotAccepted: true,
      creditReservationAccepted: true,
      privateArtifactManifestAccepted: true,
      mockOnlyRuntimeModeEnforced: true,
      agentCanSelectForPlanning: true,
      agentCanSubmitToolCallToQueueAdmissionNow: true,
      agentCanExecuteToolsNow: false,
      routeExecutionApprovedNow: false,
      routeExecutionPerformed: true,
      backendQueueSubmissionApprovedNow: false,
      backendQueueSubmissionPerformed: false,
      liveQueueWriteApprovedNow: false,
      liveQueueWritePerformed: false,
      workerExecutionApprovedNow: false,
      workerEnqueueApprovedNow: false,
      workerEnqueuePerformed: false,
      workerDispatchApprovedNow: false,
      workerDispatchPerformed: false,
      toolExecutionApprovedNow: false,
      toolExecutionPerformed: false,
      providerRuntimeApprovedNow: false,
      browserWebglCanvasRuntimeApprovedNow: false,
      gpuRuntimeApprovedNow: false,
      gpuRuntimeShouldStartNow: false,
      runtimeReadyNow: false,
      internalBetaReadyNow: false,
      externalBetaReadyNow: false,
      productionReadyNow: false,
      publicArtifactCreated: false,
      signedUrlCreated: false,
    },
  }
}

function buildRepresentativeToolCallRequest(
  toolId: string,
  capabilityId: string,
): AiGraphicsExternalBetaToolCallRequest {
  return {
    workspaceId: 'workspace_ai_graphics_external_beta_all_tool_blocked_details',
    requestId: `blocked-details-${toolId}`,
    toolId: aiGraphicsToolIdSchema.parse(toolId),
    capabilityId: aiGraphicsCapabilitySchema.parse(capabilityId),
    approvedPlanSnapshotId: `approved-snapshot-${toolId}`,
    creditReservationId: `credit-reservation-${toolId}`,
    privateArtifactManifestRef:
      `private://ai-graphics/external-beta/blocked-details/${toolId}/artifact-manifest`,
    toolRouteApprovalRef:
      `private://ai-graphics/external-beta/blocked-details/${toolId}/tool-route-approval`,
    workerApprovalRef:
      `private://ai-graphics/external-beta/blocked-details/${toolId}/worker-approval`,
    runtimeEnqueueApprovalRef:
      `private://ai-graphics/external-beta/blocked-details/${toolId}/runtime-enqueue-approval`,
    ownerRuntimeApprovalRef:
      `private://ai-graphics/external-beta/blocked-details/${toolId}/owner-runtime-approval`,
    traceId: `trace-ai-graphics-blocked-details-${toolId}`,
    payload: {
      blockedDetailsOnly: true,
      externalAgentExecutionGateRequired: true,
    },
  }
}

export function listAiGraphicsExternalBetaToolCallBlockedReadinessCases() {
  return listAiGraphicsToolCallHandoffTools().map((tool) => {
    const routeCapability = tool.capabilities.find(
      (capabilityId) => aiGraphicsCapabilitySchema.safeParse(capabilityId).success,
    )
    if (!routeCapability) {
      throw new Error(`AI graphics route capability is missing for ${tool.toolId}`)
    }

    const request = buildRepresentativeToolCallRequest(tool.toolId, routeCapability)
    return {
      request,
      blockedDetails: buildAiGraphicsExternalBetaToolCallBlockedDetails(request),
    }
  })
}

export function createAiGraphicsExternalBetaToolCallRoutes(): Router {
  const router = Router()

  router.post(AI_GRAPHICS_EXTERNAL_BETA_TOOL_CALL_ROUTE_PATH, asyncRoute(async (request, response) => {
    const body = validateBody(aiGraphicsExternalBetaToolCallRequestSchema, request.body)
    const serviceContext = getServiceContext(request)
    if (serviceContext.env.aiGraphicsExternalBetaToolCallRouteMockQueueAdmissionEnabled) {
      const admission = await admitAiGraphicsExternalBetaToolCallToMockQueue(
        body,
        serviceContext,
      )
      sendOk(response, admission, admission.warnings, 202)
      return
    }
    throw new ApiError(
      'TOOL_NOT_READY',
      'AI graphics external-beta tool-call route is source-controlled but not approved for runtime execution.',
      409,
      buildAiGraphicsExternalBetaToolCallBlockedDetails(body),
    )
  }))

  return router
}
