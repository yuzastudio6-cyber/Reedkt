import { Router } from 'express'
import { z } from 'zod'
import {
  AI_GRAPHICS_EXTERNAL_AGENT_BROWSER_RUNTIME_CONTROLLED_ADAPTER_TOOL_IDS,
  executeAiGraphicsExternalAgentBrowserRuntimeControlledAdapter,
} from '../tool-registry/ai-graphics-external-agent-browser-runtime-controlled-adapter'
import { validateBody } from '../validation/common-schemas'
import { asyncRoute, sendOk } from './route-helpers'

export const AI_GRAPHICS_EXTERNAL_BETA_BROWSER_RUNTIME_CONTROLLED_TOOL_CALL_ROUTE_PATH =
  '/api/ai-graphics/external-beta/browser-runtime/controlled-tool-call'

export const AI_GRAPHICS_EXTERNAL_BETA_BROWSER_RUNTIME_CONTROLLED_TOOL_CALL_ROUTE_FLAG =
  'AI_GRAPHICS_EXTERNAL_BETA_BROWSER_RUNTIME_CONTROLLED_TOOL_CALL_ROUTE_ENABLED'

const browserRuntimeControlledToolIdSchema = z.enum([
  'echarts',
  'lottie_web',
  'animejs',
  'three_js',
  'pixi_js',
  'konva',
  'babylonjs',
])

const browserRuntimeCapabilitySchema = z.enum([
  'chart_overlay',
  'data_visualization',
  'animation_overlay',
  'canvas_scene',
  'webgl_3d_scene',
])

const privateRefSchema = z.string().min(1).regex(/^private:\/\//)

export const aiGraphicsExternalBetaBrowserRuntimeControlledToolCallRequestSchema = z.object({
  workspaceId: z.string().min(1),
  requestId: z.string().min(1),
  toolId: browserRuntimeControlledToolIdSchema,
  capabilityId: browserRuntimeCapabilitySchema,
  approvedPlanSnapshotId: z.string().min(1),
  creditReservationId: z.string().min(1),
  privateArtifactManifestRef: privateRefSchema,
  toolRouteApprovalRef: privateRefSchema,
  workerApprovalRef: privateRefSchema,
  browserRuntimeProofRef: privateRefSchema,
  traceId: z.string().min(1),
  payload: z.record(z.string(), z.unknown()).optional(),
})

export type AiGraphicsExternalBetaBrowserRuntimeControlledToolCallRequest = z.infer<
  typeof aiGraphicsExternalBetaBrowserRuntimeControlledToolCallRequestSchema
>

const capabilityByTool = {
  echarts: 'chart_overlay',
  lottie_web: 'animation_overlay',
  animejs: 'animation_overlay',
  three_js: 'webgl_3d_scene',
  pixi_js: 'canvas_scene',
  konva: 'canvas_scene',
  babylonjs: 'webgl_3d_scene',
} as const

function buildRepresentativeRequest(
  toolId: (typeof AI_GRAPHICS_EXTERNAL_AGENT_BROWSER_RUNTIME_CONTROLLED_ADAPTER_TOOL_IDS)[number],
): AiGraphicsExternalBetaBrowserRuntimeControlledToolCallRequest {
  return {
    workspaceId: 'workspace_ai_graphics_external_beta_browser_runtime_controlled_tool_call_route_smoke',
    requestId: `controlled-browser-runtime-route-smoke-${toolId}`,
    toolId,
    capabilityId: capabilityByTool[toolId],
    approvedPlanSnapshotId: `approved-snapshot-controlled-browser-runtime-${toolId}`,
    creditReservationId: `credit-reservation-controlled-browser-runtime-${toolId}`,
    privateArtifactManifestRef:
      `private://ai-graphics/external-beta/browser-runtime/controlled-route/${toolId}/artifact-manifest`,
    toolRouteApprovalRef:
      `private://ai-graphics/external-beta/browser-runtime/controlled-route/${toolId}/tool-route-approval`,
    workerApprovalRef:
      `private://ai-graphics/external-beta/browser-runtime/controlled-route/${toolId}/worker-approval`,
    browserRuntimeProofRef:
      `private://ai-graphics/external-beta/browser-runtime/controlled-route/${toolId}/browser-runtime-proof`,
    traceId: `trace-ai-graphics-controlled-browser-runtime-route-${toolId}`,
  }
}

export function listAiGraphicsExternalBetaBrowserRuntimeControlledToolCallReadinessCases() {
  return AI_GRAPHICS_EXTERNAL_AGENT_BROWSER_RUNTIME_CONTROLLED_ADAPTER_TOOL_IDS.map((toolId) => ({
    request: buildRepresentativeRequest(toolId),
  }))
}

export function createAiGraphicsExternalBetaBrowserRuntimeControlledToolCallRoutes(): Router {
  const router = Router()

  router.post(AI_GRAPHICS_EXTERNAL_BETA_BROWSER_RUNTIME_CONTROLLED_TOOL_CALL_ROUTE_PATH, asyncRoute(async (request, response) => {
    const body = validateBody(
      aiGraphicsExternalBetaBrowserRuntimeControlledToolCallRequestSchema,
      request.body,
    )
    const adapterResult = await executeAiGraphicsExternalAgentBrowserRuntimeControlledAdapter({
      requestId: body.requestId,
      toolId: body.toolId,
      approvedPlanSnapshotId: body.approvedPlanSnapshotId,
      creditReservationId: body.creditReservationId,
      privateArtifactManifestRef: body.privateArtifactManifestRef,
      toolRouteApprovalRef: body.toolRouteApprovalRef,
      workerApprovalRef: body.workerApprovalRef,
      browserRuntimeProofRef: body.browserRuntimeProofRef,
      traceId: body.traceId,
      payload: body.payload,
    })

    sendOk(response, {
      routeDecision:
        'ai_graphics_external_beta_browser_runtime_controlled_tool_call_route_executed_private_metadata',
      routeStatus: 'controlled_browser_runtime_route_executed_private_metadata_ready',
      workspaceId: body.workspaceId,
      requestId: body.requestId,
      toolId: body.toolId,
      capabilityId: body.capabilityId,
      externalAgentCanExecuteBrowserRuntimeControlledToolsNow: true,
      controlledBrowserRuntimeRouteExecutionPerformed: true,
      controlledBrowserRuntimeToolsCallableNow: 7,
      all21ToolsCoveredByAiGraphicsLane: 21,
      totalScopedControlledToolsCallableNow: 13,
      remainingToolsStillBlockedForRuntime: 8,
      scopedBrowserRuntimePerformedNow: true,
      globalAllToolExecutionStillBlocked: true,
      gpuRuntimeShouldStartNow: false,
      providerRuntimeApprovedNow: false,
      externalBetaReadyNow: false,
      productionReadyNow: false,
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
