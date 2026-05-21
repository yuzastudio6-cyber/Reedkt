import { Router } from 'express'
import { z } from 'zod'
import { requireAuth } from '../middleware/auth'
import { requireIdempotency } from '../middleware/idempotency'
import { createChatService } from '../services/chat-service'
import { idSchema, validateBody } from '../validation/common-schemas'
import { asyncRoute, getRouteParam, getServiceContext, sendOk } from './route-helpers'

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
    const body = validateBody(createChatSessionSchema, request.body)
    const result = await createChatService(getServiceContext(request)).createChatSession({
      ...body,
      projectId: getRouteParam(request, 'projectId'),
    })
    sendOk(response, { chatSession: result.chatSession }, result.warnings, 201)
  }))

  router.post('/v1/chat-sessions/:chatSessionId/messages', requireAuth, requireIdempotency, asyncRoute(async (request, response) => {
    const body = validateBody(sendMessageSchema, request.body)
    const result = await createChatService(getServiceContext(request)).sendMessage({
      ...body,
      chatSessionId: getRouteParam(request, 'chatSessionId'),
    })
    sendOk(response, { chatMessage: result.chatMessage }, result.warnings, 201)
  }))

  router.post('/v1/chat-sessions/:chatSessionId/attachments/clips', requireAuth, requireIdempotency, asyncRoute(async (request, response) => {
    const body = validateBody(attachClipsSchema, request.body)
    const result = await createChatService(getServiceContext(request)).attachFinalizedClips({
      ...body,
      chatSessionId: getRouteParam(request, 'chatSessionId'),
    })
    sendOk(response, { attachmentBatch: result.attachmentBatch }, result.warnings, 201)
  }))

  return router
}
