import { Router } from 'express'
import { z } from 'zod'
import {
  AI_GRAPHICS_EXTERNAL_AGENT_CPU_STATIC_CONTROLLED_ADAPTER_TOOL_IDS,
  executeAiGraphicsExternalAgentCpuStaticControlledAdapter,
} from '../tool-registry/ai-graphics-external-agent-cpu-static-controlled-adapter'
import { validateBody } from '../validation/common-schemas'
import { asyncRoute, sendOk } from './route-helpers'

export const AI_GRAPHICS_EXTERNAL_BETA_CPU_STATIC_CONTROLLED_TOOL_CALL_ROUTE_PATH =
  '/api/ai-graphics/external-beta/cpu-static/controlled-tool-call'

export const AI_GRAPHICS_EXTERNAL_BETA_CPU_STATIC_CONTROLLED_TOOL_CALL_ROUTE_FLAG =
  'AI_GRAPHICS_EXTERNAL_BETA_CPU_STATIC_CONTROLLED_TOOL_CALL_ROUTE_ENABLED'

const cpuStaticControlledToolIdSchema = z.enum([
  'd3',
  'vega_lite',
  'vega',
  'svgdotjs_svg_js',
  'viz_js',
])

const cpuStaticCapabilitySchema = z.enum([
  'chart_overlay',
  'data_visualization',
  'svg_graphics',
  'diagram_graphics',
])

const privateRefSchema = z.string().min(1).regex(/^private:\/\//)

export const aiGraphicsExternalBetaCpuStaticControlledToolCallRequestSchema = z.object({
  workspaceId: z.string().min(1),
  requestId: z.string().min(1),
  toolId: cpuStaticControlledToolIdSchema,
  capabilityId: cpuStaticCapabilitySchema,
  approvedPlanSnapshotId: z.string().min(1),
  creditReservationId: z.string().min(1),
  privateArtifactManifestRef: privateRefSchema,
  toolRouteApprovalRef: privateRefSchema,
  workerApprovalRef: privateRefSchema,
  traceId: z.string().min(1),
  payload: z.record(z.string(), z.unknown()).optional(),
})

export type AiGraphicsExternalBetaCpuStaticControlledToolCallRequest = z.infer<
  typeof aiGraphicsExternalBetaCpuStaticControlledToolCallRequestSchema
>

const capabilityByTool = {
  d3: 'chart_overlay',
  vega_lite: 'data_visualization',
  vega: 'data_visualization',
  svgdotjs_svg_js: 'svg_graphics',
  viz_js: 'diagram_graphics',
} as const

function buildRepresentativeRequest(
  toolId: (typeof AI_GRAPHICS_EXTERNAL_AGENT_CPU_STATIC_CONTROLLED_ADAPTER_TOOL_IDS)[number],
): AiGraphicsExternalBetaCpuStaticControlledToolCallRequest {
  return {
    workspaceId: 'workspace_ai_graphics_external_beta_cpu_static_controlled_tool_call_route_smoke',
    requestId: `controlled-cpu-static-route-smoke-${toolId}`,
    toolId,
    capabilityId: capabilityByTool[toolId],
    approvedPlanSnapshotId: `approved-snapshot-controlled-cpu-static-${toolId}`,
    creditReservationId: `credit-reservation-controlled-cpu-static-${toolId}`,
    privateArtifactManifestRef:
      `private://ai-graphics/external-beta/cpu-static/controlled-route/${toolId}/artifact-manifest`,
    toolRouteApprovalRef:
      `private://ai-graphics/external-beta/cpu-static/controlled-route/${toolId}/tool-route-approval`,
    workerApprovalRef:
      `private://ai-graphics/external-beta/cpu-static/controlled-route/${toolId}/worker-approval`,
    traceId: `trace-ai-graphics-controlled-cpu-static-route-${toolId}`,
  }
}

export function listAiGraphicsExternalBetaCpuStaticControlledToolCallReadinessCases() {
  return AI_GRAPHICS_EXTERNAL_AGENT_CPU_STATIC_CONTROLLED_ADAPTER_TOOL_IDS.map((toolId) => ({
    request: buildRepresentativeRequest(toolId),
  }))
}

export function createAiGraphicsExternalBetaCpuStaticControlledToolCallRoutes(): Router {
  const router = Router()

  router.post(AI_GRAPHICS_EXTERNAL_BETA_CPU_STATIC_CONTROLLED_TOOL_CALL_ROUTE_PATH, asyncRoute(async (request, response) => {
    const body = validateBody(
      aiGraphicsExternalBetaCpuStaticControlledToolCallRequestSchema,
      request.body,
    )
    const adapterResult = await executeAiGraphicsExternalAgentCpuStaticControlledAdapter({
      requestId: body.requestId,
      toolId: body.toolId,
      approvedPlanSnapshotId: body.approvedPlanSnapshotId,
      creditReservationId: body.creditReservationId,
      privateArtifactManifestRef: body.privateArtifactManifestRef,
      toolRouteApprovalRef: body.toolRouteApprovalRef,
      workerApprovalRef: body.workerApprovalRef,
      traceId: body.traceId,
      payload: body.payload,
    })

    sendOk(response, {
      routeDecision:
        'ai_graphics_external_beta_cpu_static_controlled_tool_call_route_executed_private_output',
      routeStatus: 'controlled_cpu_static_route_executed_private_output_ready',
      workspaceId: body.workspaceId,
      requestId: body.requestId,
      toolId: body.toolId,
      capabilityId: body.capabilityId,
      externalAgentCanExecuteCpuStaticControlledToolsNow: true,
      controlledCpuStaticRouteExecutionPerformed: true,
      controlledCpuStaticToolsCallableNow: 5,
      all21ToolsCoveredByAiGraphicsLane: 21,
      remainingToolsStillBlockedForRuntime: 16,
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
    })
  }))

  return router
}
