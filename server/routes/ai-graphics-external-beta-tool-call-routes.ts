import { Router } from 'express'
import { z } from 'zod'
import { ApiError } from '../errors/api-error'
import { createAiGraphicsToolRuntimeQueueService } from '../services/ai-graphics-tool-runtime-queue-service'
import {
  executeAiGraphicsExternalAgentCpuStaticControlledAdapter,
  isAiGraphicsExternalAgentCpuStaticControlledAdapterTool,
} from '../tool-registry/ai-graphics-external-agent-cpu-static-controlled-adapter'
import {
  executeAiGraphicsExternalAgentBrowserRuntimeControlledAdapter,
  isAiGraphicsExternalAgentBrowserRuntimeControlledAdapterTool,
} from '../tool-registry/ai-graphics-external-agent-browser-runtime-controlled-adapter'
import { listAiGraphicsToolCallHandoffTools } from '../tool-registry/ai-graphics-tool-call-handoff'
import { evaluateAiGraphicsOnDemandRuntimeAdmission } from '../tool-registry/ai-graphics-on-demand-runtime-admission'
import { evaluateAiGraphicsToolCallPlan } from '../tool-registry/ai-graphics-tool-call-plan-evaluator'
import { getAiGraphicsToolCallReadiness } from '../tool-registry/ai-graphics-tool-call-readiness'
import type { ServiceContext } from '../types'
import { validateBody } from '../validation/common-schemas'
import { asyncRoute, getServiceContext, sendOk } from './route-helpers'

export const AI_GRAPHICS_EXTERNAL_BETA_TOOL_CALL_ROUTE_PATH =
  '/api/ai-graphics/external-beta/tool-call'

export const AI_GRAPHICS_EXTERNAL_BETA_TOOL_CALL_ROUTE_MOCK_QUEUE_ADMISSION_FLAG =
  'AI_GRAPHICS_EXTERNAL_BETA_TOOL_CALL_ROUTE_MOCK_QUEUE_ADMISSION_ENABLED'

export const AI_GRAPHICS_EXTERNAL_BETA_TOOL_CALL_ROUTE_CPU_STATIC_CONTROLLED_EXECUTION_FLAG =
  'AI_GRAPHICS_EXTERNAL_BETA_TOOL_CALL_ROUTE_CPU_STATIC_CONTROLLED_EXECUTION_ENABLED'

export const AI_GRAPHICS_EXTERNAL_BETA_TOOL_CALL_ROUTE_BROWSER_RUNTIME_CONTROLLED_EXECUTION_FLAG =
  'AI_GRAPHICS_EXTERNAL_BETA_TOOL_CALL_ROUTE_BROWSER_RUNTIME_CONTROLLED_EXECUTION_ENABLED'

export const AI_GRAPHICS_EXTERNAL_BETA_TOOL_CALL_ROUTE_GPU_MODEL_RUNTIME_ADMISSION_FLAG =
  'AI_GRAPHICS_EXTERNAL_BETA_TOOL_CALL_ROUTE_GPU_MODEL_RUNTIME_ADMISSION_ENABLED'

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

const aiGraphicsGpuModelRuntimeAdmissionToolIds = new Set<string>([
  'torch_torchvision',
  'transformers',
  'sam2',
  'birefnet',
  'real_esrgan',
  'kornia',
  'rembg',
  'transparent_background',
])

const aiGraphicsModelWeightManifestRequiredToolIds = new Set<string>([
  'sam2',
  'birefnet',
  'real_esrgan',
  'rembg',
  'transparent_background',
])

export function isAiGraphicsExternalBetaToolCallGpuModelRuntimeAdmissionTool(
  toolId: string,
) {
  return aiGraphicsGpuModelRuntimeAdmissionToolIds.has(toolId)
}

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

export async function executeAiGraphicsExternalBetaToolCallCpuStaticControlledAdapter(
  request: AiGraphicsExternalBetaToolCallRequest,
  serviceContext: ServiceContext,
) {
  if (!serviceContext.env.aiGraphicsExternalBetaToolCallRouteCpuStaticControlledExecutionEnabled) {
    throw new ApiError(
      'TOOL_NOT_READY',
      'AI graphics external-beta canonical tool-call CPU/static controlled execution is disabled.',
      409,
      buildAiGraphicsExternalBetaToolCallBlockedDetails(request),
    )
  }
  if (!serviceContext.env.mockOnly) {
    throw new ApiError(
      'MOCK_ONLY',
      'AI graphics external-beta canonical tool-call CPU/static controlled execution requires explicit mock runtime mode; live worker execution remains separately gated.',
      409,
      {
        requestId: request.requestId,
        toolId: request.toolId,
        capabilityId: request.capabilityId,
        cpuStaticControlledExecutionRequiresMockOnly: true,
        workerDispatchApprovedNow: false,
        toolExecutionApprovedNow: false,
        gpuRuntimeShouldStartNow: false,
      },
    )
  }
  if (!isAiGraphicsExternalAgentCpuStaticControlledAdapterTool(request.toolId)) {
    throw new ApiError(
      'TOOL_NOT_READY',
      'AI graphics external-beta canonical tool-call CPU/static execution is available only for the six proven CPU/static tools.',
      409,
      buildAiGraphicsExternalBetaToolCallBlockedDetails(request),
    )
  }

  const adapterResult = await executeAiGraphicsExternalAgentCpuStaticControlledAdapter({
    requestId: request.requestId,
    toolId: request.toolId,
    approvedPlanSnapshotId: request.approvedPlanSnapshotId,
    creditReservationId: request.creditReservationId,
    privateArtifactManifestRef: request.privateArtifactManifestRef,
    toolRouteApprovalRef: request.toolRouteApprovalRef,
    workerApprovalRef: request.workerApprovalRef,
    traceId: request.traceId,
    payload: request.payload,
  })

  return {
    routeDecision:
      'ai_graphics_external_beta_tool_call_route_cpu_static_controlled_execution_accepted',
    routeStatus:
      'external_beta_tool_call_route_cpu_static_controlled_execution_private_output_ready',
    routePath: AI_GRAPHICS_EXTERNAL_BETA_TOOL_CALL_ROUTE_PATH,
    routeFlag:
      AI_GRAPHICS_EXTERNAL_BETA_TOOL_CALL_ROUTE_CPU_STATIC_CONTROLLED_EXECUTION_FLAG,
    workspaceId: request.workspaceId,
    requestId: request.requestId,
    toolId: request.toolId,
    capabilityId: request.capabilityId,
    approvedPlanSnapshotId: request.approvedPlanSnapshotId,
    creditReservationId: request.creditReservationId,
    privateArtifactManifestRef: request.privateArtifactManifestRef,
    externalAgentCanExecuteCpuStaticControlledToolsNow: true,
    controlledCpuStaticCanonicalRouteExecutionPerformed: true,
    controlledCpuStaticToolsCallableNow: 6,
    all21ToolsCoveredByAiGraphicsLane: 21,
    remainingToolsStillBlockedForRuntime: 15,
    gpuRuntimeShouldStartNow: false,
    externalBetaReadyNow: false,
    productionReadyNow: false,
    globalAllToolExecutionStillBlocked: true,
    adapterResult,
    outputAccess: {
      privateArtifactManifestRef: adapterResult.privateArtifactManifestRef,
      publicArtifactCreated: false,
      signedUrlCreated: false,
    },
    counts: {
      totalAiGraphicsTools: 21,
      controlledCpuStaticCanonicalRouteExecutedTools: 1,
      controlledCpuStaticToolsCallableNow: 6,
      remainingToolsStillBlockedForRuntime: 15,
      gpuRuntimeShouldStartNowTools: 0,
      publicArtifactCreatedTools: 0,
      signedUrlCreatedTools: 0,
    },
    booleans: {
      externalBetaToolCallRouteCpuStaticControlledExecutionAccepted: true,
      approvedPlanSnapshotAccepted: true,
      creditReservationAccepted: true,
      privateArtifactManifestAccepted: true,
      mockOnlyRuntimeModeEnforced: true,
      agentCanSelectForPlanning: true,
      externalAgentCanExecuteCpuStaticControlledToolsNow: true,
      controlledCpuStaticCanonicalRouteExecutionPerformed: true,
      localCpuStaticPackageExecutionPerformed: true,
      agentCanExecuteAll21ToolsNow: false,
      routeExecutionPerformed: true,
      workerExecutionApprovedNow: false,
      workerExecutionPerformed: false,
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

export async function executeAiGraphicsExternalBetaToolCallBrowserRuntimeControlledAdapter(
  request: AiGraphicsExternalBetaToolCallRequest,
  serviceContext: ServiceContext,
) {
  if (!serviceContext.env.aiGraphicsExternalBetaToolCallRouteBrowserRuntimeControlledExecutionEnabled) {
    throw new ApiError(
      'TOOL_NOT_READY',
      'AI graphics external-beta canonical tool-call browser-runtime controlled execution is disabled.',
      409,
      buildAiGraphicsExternalBetaToolCallBlockedDetails(request),
    )
  }
  if (!serviceContext.env.mockOnly) {
    throw new ApiError(
      'MOCK_ONLY',
      'AI graphics external-beta canonical tool-call browser-runtime controlled execution requires explicit mock runtime mode; live worker execution remains separately gated.',
      409,
      {
        requestId: request.requestId,
        toolId: request.toolId,
        capabilityId: request.capabilityId,
        browserRuntimeControlledExecutionRequiresMockOnly: true,
        workerDispatchApprovedNow: false,
        toolExecutionApprovedNow: false,
        gpuRuntimeShouldStartNow: false,
      },
    )
  }
  if (!isAiGraphicsExternalAgentBrowserRuntimeControlledAdapterTool(request.toolId)) {
    throw new ApiError(
      'TOOL_NOT_READY',
      'AI graphics external-beta canonical tool-call browser-runtime execution is available only for the seven proven browser/runtime tools.',
      409,
      buildAiGraphicsExternalBetaToolCallBlockedDetails(request),
    )
  }

  const adapterResult = await executeAiGraphicsExternalAgentBrowserRuntimeControlledAdapter({
    requestId: request.requestId,
    toolId: request.toolId,
    approvedPlanSnapshotId: request.approvedPlanSnapshotId,
    creditReservationId: request.creditReservationId,
    privateArtifactManifestRef: request.privateArtifactManifestRef,
    toolRouteApprovalRef: request.toolRouteApprovalRef,
    workerApprovalRef: request.workerApprovalRef,
    browserRuntimeProofRef: request.runtimeEnqueueApprovalRef,
    traceId: request.traceId,
    payload: request.payload,
  })

  return {
    routeDecision:
      'ai_graphics_external_beta_tool_call_route_browser_runtime_controlled_execution_accepted',
    routeStatus:
      'external_beta_tool_call_route_browser_runtime_controlled_execution_private_output_ready',
    routePath: AI_GRAPHICS_EXTERNAL_BETA_TOOL_CALL_ROUTE_PATH,
    routeFlag:
      AI_GRAPHICS_EXTERNAL_BETA_TOOL_CALL_ROUTE_BROWSER_RUNTIME_CONTROLLED_EXECUTION_FLAG,
    workspaceId: request.workspaceId,
    requestId: request.requestId,
    toolId: request.toolId,
    capabilityId: request.capabilityId,
    approvedPlanSnapshotId: request.approvedPlanSnapshotId,
    creditReservationId: request.creditReservationId,
    privateArtifactManifestRef: request.privateArtifactManifestRef,
    externalAgentCanExecuteBrowserRuntimeControlledToolsNow: true,
    controlledBrowserRuntimeCanonicalRouteExecutionPerformed: true,
    controlledBrowserRuntimeToolsCallableNow: 7,
    scopedControlledToolsCallableNow: 13,
    all21ToolsCoveredByAiGraphicsLane: 21,
    remainingToolsStillBlockedForRuntime: 8,
    browserRuntimeStartedByCanonicalRoute: true,
    gpuRuntimeShouldStartNow: false,
    providerRuntimeApprovedNow: false,
    externalBetaReadyNow: false,
    productionReadyNow: false,
    globalAllToolExecutionStillBlocked: true,
    adapterResult,
    outputAccess: {
      privateArtifactManifestRef: adapterResult.privateArtifactManifestRef,
      publicArtifactCreated: false,
      signedUrlCreated: false,
    },
    counts: {
      totalAiGraphicsTools: 21,
      controlledBrowserRuntimeCanonicalRouteExecutedTools: 1,
      controlledBrowserRuntimeToolsCallableNow: 7,
      scopedControlledToolsCallableNow: 13,
      remainingToolsStillBlockedForRuntime: 8,
      gpuRuntimeShouldStartNowTools: 0,
      publicArtifactCreatedTools: 0,
      signedUrlCreatedTools: 0,
    },
    booleans: {
      externalBetaToolCallRouteBrowserRuntimeControlledExecutionAccepted: true,
      approvedPlanSnapshotAccepted: true,
      creditReservationAccepted: true,
      privateArtifactManifestAccepted: true,
      mockOnlyRuntimeModeEnforced: true,
      agentCanSelectForPlanning: true,
      externalAgentCanExecuteBrowserRuntimeControlledToolsNow: true,
      controlledBrowserRuntimeCanonicalRouteExecutionPerformed: true,
      localBrowserRuntimePackageExecutionPerformed: true,
      browserRuntimeStartedByCanonicalRoute: true,
      agentCanExecuteAll21ToolsNow: false,
      routeExecutionPerformed: true,
      workerExecutionApprovedNow: false,
      workerExecutionPerformed: false,
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

export function buildAiGraphicsExternalBetaToolCallGpuModelRuntimeAdmissionBlockedDetails(
  request: AiGraphicsExternalBetaToolCallRequest,
) {
  const admission = evaluateAiGraphicsOnDemandRuntimeAdmission({
    capabilityId: request.capabilityId,
    requestedToolId: request.toolId,
    executionRequested: true,
    approvedPlanSnapshotId: request.approvedPlanSnapshotId,
    creditReservationId: request.creditReservationId,
    artifactBoundaryApproved: true,
    toolRouteApprovalRef: request.toolRouteApprovalRef,
    workerApprovalRef: request.workerApprovalRef,
    runtimeEnqueueApprovalRef: request.runtimeEnqueueApprovalRef,
    ownerRuntimeApprovalRef: request.ownerRuntimeApprovalRef,
    privateArtifactManifestRef: request.privateArtifactManifestRef,
  })
  const modelWeightManifestRequired =
    aiGraphicsModelWeightManifestRequiredToolIds.has(request.toolId)

  return {
    routeDecision:
      'ai_graphics_external_beta_tool_call_route_gpu_model_runtime_admission_blocked',
    routeStatus:
      'gpu_model_runtime_admission_blocked_pending_native_gpu_and_model_weight_evidence',
    routePath: AI_GRAPHICS_EXTERNAL_BETA_TOOL_CALL_ROUTE_PATH,
    routeFlag:
      AI_GRAPHICS_EXTERNAL_BETA_TOOL_CALL_ROUTE_GPU_MODEL_RUNTIME_ADMISSION_FLAG,
    requestId: request.requestId,
    toolId: request.toolId,
    capabilityId: request.capabilityId,
    productionToolId: admission.selectedTool?.productionToolId ?? null,
    workerType: admission.selectedTool?.workerType ?? null,
    runtimeTarget: admission.selectedTool?.runtimeTarget ?? null,
    gpuRequiredForRuntime: admission.selectedTool?.gpuRequiredForRuntime === true,
    modelWeightManifestRequired,
    admissionDecision: admission.decision,
    gpuRuntimeStartupAuthorization: admission.gpuRuntimeStartupAuthorization,
    gpuRuntimeStartAllowedForAcceptedExternalBetaJob:
      admission.gpuRuntimeStartAllowedForAcceptedJob,
    gpuRuntimeShouldStartNow: false,
    missingRuntimeJobGates: admission.missingRuntimeJobGates,
    missingRuntimeProofGates: admission.missingRuntimeProofGates,
    missingPrivateModelWeightEvidence: modelWeightManifestRequired
      ? [
          'reviewed private model-weight manifest reference is missing',
          'private checksum evidence is missing',
          'native NVIDIA L4 model/runtime proof is missing',
        ]
      : ['native NVIDIA L4 runtime proof is missing'],
    nextRequiredProofs: [
      'collect reviewed private checksum evidence for model-weight tools',
      'validate reviewed private model-weight manifests for tools that require weights',
      'run native linux/amd64 NVIDIA L4 runtime proof on an approved GPU host',
      'rerun external-beta per-tool runtime proof with accepted private evidence',
      'only then allow worker enqueue to start GPU on demand for an accepted job',
    ],
    onDemandRuntimeAdmission: admission,
    counts: {
      totalAiGraphicsTools: 21,
      gpuModelRuntimeAdmissionBlockedTools: 8,
      gpuRuntimeShouldStartNowTools: 0,
      modelWeightManifestRequiredTools: 5,
      nativeGpuRuntimeProofRequiredTools: 8,
      publicArtifactCreatedTools: 0,
      signedUrlCreatedTools: 0,
    },
    booleans: {
      externalBetaToolCallRouteGpuModelRuntimeAdmissionEvaluated: true,
      gpuModelRuntimeAdmissionFailClosed: true,
      approvedPlanSnapshotAccepted: true,
      creditReservationAccepted: true,
      privateArtifactManifestAccepted: admission.privateArtifactManifestAccepted,
      onDemandRuntimeAdmissionApplied: true,
      modelWeightManifestRequired,
      nativeGpuRuntimeProofRequired: true,
      gpuRuntimeOnDemandOnly: true,
      noIdleGpuRuntimeApproved: true,
      gpuStartsOnlyForApprovedWorkerOrToolCall: true,
      agentCanSelectForPlanning: true,
      agentCanExecuteToolsNow: false,
      agentCanExecuteAll21ToolsNow: false,
      routeExecutionApprovedNow: false,
      routeExecutionPerformed: true,
      workerExecutionApprovedNow: false,
      workerExecutionPerformed: false,
      workerDispatchApprovedNow: false,
      workerDispatchPerformed: false,
      toolExecutionApprovedNow: false,
      toolExecutionPerformed: false,
      providerRuntimeApprovedNow: false,
      providerRuntimePerformed: false,
      browserWebglCanvasRuntimeApprovedNow: false,
      browserWebglCanvasRuntimePerformed: false,
      gpuRuntimeApprovedNow: false,
      gpuRuntimePerformed: false,
      gpuRuntimeShouldStartNow: false,
      modelWeightsDownloaded: false,
      modelWeightsLoaded: false,
      modelInferencePerformed: false,
      mediaProcessingPerformed: false,
      supabaseMutationPerformed: false,
      gcsUploadPerformed: false,
      publicArtifactCreated: false,
      signedUrlCreated: false,
      runtimeReadyNow: false,
      internalBetaReadyNow: false,
      externalBetaReadyNow: false,
      productionReadyNow: false,
      dependencyInstallPerformed: false,
      packageLockMutationPerformed: false,
    },
  }
}

export function admitAiGraphicsExternalBetaToolCallGpuModelRuntime(
  request: AiGraphicsExternalBetaToolCallRequest,
  serviceContext: ServiceContext,
) {
  if (!serviceContext.env.aiGraphicsExternalBetaToolCallRouteGpuModelRuntimeAdmissionEnabled) {
    throw new ApiError(
      'TOOL_NOT_READY',
      'AI graphics external-beta canonical tool-call GPU/model runtime admission is disabled.',
      409,
      buildAiGraphicsExternalBetaToolCallBlockedDetails(request),
    )
  }
  if (!isAiGraphicsExternalBetaToolCallGpuModelRuntimeAdmissionTool(request.toolId)) {
    throw new ApiError(
      'TOOL_NOT_READY',
      'AI graphics external-beta canonical tool-call GPU/model runtime admission applies only to the eight GPU/model tools.',
      409,
      buildAiGraphicsExternalBetaToolCallBlockedDetails(request),
    )
  }

  throw new ApiError(
    'TOOL_NOT_READY',
    'AI graphics GPU/model tool-call runtime remains blocked until reviewed private model-weight evidence and native NVIDIA L4 runtime proof are accepted.',
    409,
    buildAiGraphicsExternalBetaToolCallGpuModelRuntimeAdmissionBlockedDetails(request),
  )
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
    if (
      serviceContext.env.aiGraphicsExternalBetaToolCallRouteCpuStaticControlledExecutionEnabled &&
      isAiGraphicsExternalAgentCpuStaticControlledAdapterTool(body.toolId)
    ) {
      const execution =
        await executeAiGraphicsExternalBetaToolCallCpuStaticControlledAdapter(
          body,
          serviceContext,
        )
      sendOk(response, execution, [], 200)
      return
    }
    if (
      serviceContext.env.aiGraphicsExternalBetaToolCallRouteBrowserRuntimeControlledExecutionEnabled &&
      isAiGraphicsExternalAgentBrowserRuntimeControlledAdapterTool(body.toolId)
    ) {
      const execution =
        await executeAiGraphicsExternalBetaToolCallBrowserRuntimeControlledAdapter(
          body,
          serviceContext,
        )
      sendOk(response, execution, [], 200)
      return
    }
    if (
      serviceContext.env.aiGraphicsExternalBetaToolCallRouteGpuModelRuntimeAdmissionEnabled &&
      isAiGraphicsExternalBetaToolCallGpuModelRuntimeAdmissionTool(body.toolId)
    ) {
      admitAiGraphicsExternalBetaToolCallGpuModelRuntime(
        body,
        serviceContext,
      )
      return
    }
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
