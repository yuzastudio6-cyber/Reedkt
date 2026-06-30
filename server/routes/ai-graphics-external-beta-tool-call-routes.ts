import { Router } from 'express'
import { z } from 'zod'
import { ApiError } from '../errors/api-error'
import { validateBody } from '../validation/common-schemas'
import { asyncRoute } from './route-helpers'

export const AI_GRAPHICS_EXTERNAL_BETA_TOOL_CALL_ROUTE_PATH =
  '/api/ai-graphics/external-beta/tool-call'

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

export function createAiGraphicsExternalBetaToolCallRoutes(): Router {
  const router = Router()

  router.post(AI_GRAPHICS_EXTERNAL_BETA_TOOL_CALL_ROUTE_PATH, asyncRoute(async (request) => {
    validateBody(aiGraphicsExternalBetaToolCallRequestSchema, request.body)
    throw new ApiError(
      'TOOL_NOT_READY',
      'AI graphics external-beta tool-call route is source-controlled but not approved for runtime execution.',
      409,
      {
        routeMountedByAppNow: false,
        routeExecutionApprovedNow: false,
        queueWriteApprovedNow: false,
        workerEnqueueApprovedNow: false,
        workerDispatchApprovedNow: false,
        toolExecutionApprovedNow: false,
        gpuRuntimeShouldStartNow: false,
        externalBetaReadyNow: false,
        productionReadyNow: false,
      },
    )
  }))

  return router
}
