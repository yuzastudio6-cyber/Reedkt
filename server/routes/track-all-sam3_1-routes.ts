import { Router } from 'express'

import {
  TRACK_ALL_SAM3_1_AUTHENTICATED_GPU_START_ROUTE,
} from '../../src/types/track-all-sam3_1-gpu-start'
import { ApiError } from '../errors/api-error'
import { requireAuth } from '../middleware/auth'
import { requireIdempotency } from '../middleware/idempotency'
import {
  requireStrictInternalServiceAuth,
} from '../middleware/internal-service-auth'
import {
  parseTrackAllSam31AuthenticatedGpuStartRequest,
} from '../services/canonical-track-all-sam3_1-authenticated-gpu-start-service'
import {
  asyncRoute,
  getIdempotencyKey,
  getRouteParam,
  getServiceContext,
  sendOk,
} from './route-helpers'

/**
 * Internal Orchestra/Track All start boundary. The request carries only the
 * exact approved snapshot and work identity. All media, prompt, SAM release,
 * A100/L4 placement, account-effective price, lease, funding, and cloud-job
 * identity is reread or derived by the canonical backend.
 */
export function createTrackAllSam31Routes(): Router {
  const router = Router()
  router.post(
    TRACK_ALL_SAM3_1_AUTHENTICATED_GPU_START_ROUTE,
    requireAuth,
    requireStrictInternalServiceAuth,
    requireIdempotency,
    asyncRoute(async (request, response) => {
      const body = parseRequestBody(request.body)
      const context = getServiceContext(request)
      const runtime = context.trackAllSam31AuthenticatedGpuStartRuntimePort
      if (!runtime) throw new ApiError(
        'TOOL_NOT_READY',
        'The canonical Track All SAM 3.1 funded GPU runtime is not released.',
        503,
        { requiredGate: 'track_all_sam3_1_funded_gpu_runtime_release' },
      )
      if (!context.auth?.userId) throw new ApiError(
        'AUTH_REQUIRED',
        'Authenticated user context is required.',
        401,
      )
      const idempotencyKey = getIdempotencyKey(request)
      if (body.requestId !== idempotencyKey) throw new ApiError(
        'IDEMPOTENCY_KEY_MISMATCH',
        'The Track All SAM 3.1 request must use its exact request ID as the idempotency key.',
        409,
      )
      const result = await runtime.startApprovedTrackAllWork({
        authenticatedOwnerUserId: context.auth.userId,
        workspaceId: getRouteParam(request, 'workspaceId'),
        idempotencyKey,
        request: body,
      })
      sendOk(response, { start: result }, [
        'The canonical backend reread the approved Track All work, funding, account-effective prices, qualified SAM 3.1 release, and server-owned task material before starting one scale-from-zero GPU job. No browser-selected model, media, command, GPU route, or price was accepted.',
      ], 202)
    }),
  )
  return router
}

function parseRequestBody(value: unknown) {
  try {
    return parseTrackAllSam31AuthenticatedGpuStartRequest(value)
  } catch {
    throw new ApiError(
      'VALIDATION_FAILED',
      'The Track All SAM 3.1 start request is invalid.',
      400,
    )
  }
}
