import { Router } from 'express'
import { z } from 'zod'
import { requireAuth } from '../middleware/auth'
import { requireIdempotency } from '../middleware/idempotency'
import { idSchema, validateBody } from '../validation/common-schemas'
import { asyncRoute, getRouteParam, sendBackendRequired } from './route-helpers'

const createChatSessionSchema = z.object({
  workspaceId: idSchema,
  title: z.string().optional(),
})

const sendMessageSchema = z.object({
  workspaceId: idSchema,
  message: z.string().min(1),
})

const attachClipsSchema = z.object({
  workspaceId: idSchema,
  projectId: idSchema.optional(),
  mediaAssetIds: z.array(idSchema).min(1),
}).strict()

export function createChatRoutes(): Router {
  const router = Router()

  router.post('/v1/projects/:projectId/chat-sessions', requireAuth, requireIdempotency, asyncRoute(async (request, response) => {
    validateBody(createChatSessionSchema, request.body)
    sendBackendRequired(response, {
      routeId: 'chat.sessions.create',
      routeGroup: 'chat',
      message: 'Chat persistence is outside Prompt 7 and remains backend-required.',
      blockers: ['Prompt 7 does not create chat sessions or planning records.'],
      nextAction: 'Use a future chat/planning persistence milestone before enabling this route.',
    })
  }))

  router.post('/v1/chat-sessions/:chatSessionId/messages', requireAuth, requireIdempotency, asyncRoute(async (request, response) => {
    validateBody(sendMessageSchema, request.body)
    getRouteParam(request, 'chatSessionId')
    sendBackendRequired(response, {
      routeId: 'chat.messages.create',
      routeGroup: 'chat',
      message: 'Chat message persistence is outside Prompt 7 and remains backend-required.',
      blockers: ['Prompt 7 does not store chat messages or start planning generation.'],
      nextAction: 'Use a future chat/planning persistence milestone before enabling this route.',
    })
  }))

  router.post('/v1/chat-sessions/:chatSessionId/attachments/clips', requireAuth, requireIdempotency, asyncRoute(async (request, response) => {
    validateBody(attachClipsSchema, request.body)
    getRouteParam(request, 'chatSessionId')
    sendBackendRequired(response, {
      routeId: 'chat.attachments.clips.create',
      routeGroup: 'chat',
      message: 'Chat attachment persistence is outside Prompt 7 and remains backend-required.',
      blockers: ['Prompt 7 does not create chat attachments or media analysis records.'],
      nextAction: 'Use a future chat/media persistence milestone before enabling this route.',
    })
  }))

  return router
}
