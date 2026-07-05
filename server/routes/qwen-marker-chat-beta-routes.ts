import { Router } from 'express'
import { z } from 'zod'
import {
  QWEN_LIVE_BETA_MARKER_CHAT_ROUTE_PATH,
  QWEN_LIVE_BETA_READINESS_ROUTE_PATH,
  createQwenLiveBetaPublicReadinessReport,
  runQwenLiveMarkerChatRoute,
} from '../../src/backend/qwen-runtime/qwen-live-beta-service'
import { requireAuth } from '../middleware/auth'
import { requireIdempotency } from '../middleware/idempotency'
import { validateBody } from '../validation/common-schemas'
import { asyncRoute, sendOk } from './route-helpers'

const markerChatBodySchema = z.object({
  workspaceId: z.string().min(1),
  userId: z.string().optional(),
  projectId: z.string().min(1),
  editSessionId: z.string().min(1),
  briefId: z.string().min(1),
  markerId: z.string().min(1),
  messageText: z.string().min(1).max(4000),
  aiMode: z.string().optional(),
  requestId: z.string().optional(),
  idempotencyKey: z.string().optional(),
})

function requestIdFromHeader(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) return value.find((item) => item.trim())?.trim()
  return value?.trim() || undefined
}

export function createQwenMarkerChatBetaRoutes(): Router {
  const router = Router()

  router.get(QWEN_LIVE_BETA_READINESS_ROUTE_PATH, requireAuth, asyncRoute(async (_request, response) => {
    const report = await createQwenLiveBetaPublicReadinessReport()
    sendOk(response, report, report.warnings)
  }))

  router.post(QWEN_LIVE_BETA_MARKER_CHAT_ROUTE_PATH, requireAuth, requireIdempotency, asyncRoute(async (request, response) => {
    const body = validateBody(markerChatBodySchema, request.body)
    const result = await runQwenLiveMarkerChatRoute({
      request: {
        ...body,
        requestId: body.requestId ?? requestIdFromHeader(request.headers['x-request-id']),
        idempotencyKey: body.idempotencyKey ?? request.header('idempotency-key') ?? undefined,
      },
    })
    sendOk(response, result, result.warnings)
  }))

  return router
}
