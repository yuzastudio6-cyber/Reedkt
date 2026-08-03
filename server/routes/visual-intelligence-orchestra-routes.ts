import { Router } from 'express'

import {
  ORCHESTRA_VISUAL_INTELLIGENCE_JOB_ROUTE,
} from '../../src/types/orchestra-skill-capability'
import { ApiError } from '../errors/api-error'
import { requireAuth } from '../middleware/auth'
import { requireIdempotency } from '../middleware/idempotency'
import { requireStrictInternalServiceAuth } from
  '../middleware/internal-service-auth'
import {
  parseOrchestraSkillCall,
  parseSkillSupportRequest,
} from '../orchestra/orchestra-skill-capability-contract'
import {
  asyncRoute,
  getIdempotencyKey,
  getRouteParam,
  getServiceContext,
  sendOk,
} from './route-helpers'

/**
 * Orchestra-only execution boundary. The body cannot supply a provider,
 * prompt, media locator, evidence package, or result. The exact call must
 * already exist in the immutable Orchestra dispatch store before this route
 * can compile or execute it.
 */
export function createVisualIntelligenceOrchestraRoutes(): Router {
  const router = Router()

  router.post(
    ORCHESTRA_VISUAL_INTELLIGENCE_JOB_ROUTE,
    requireAuth,
    requireStrictInternalServiceAuth,
    requireIdempotency,
    asyncRoute(async (request, response) => {
      const body = exactRecord(request.body, ['call', 'supportRequest'])
      const call = parseOrchestraSkillCall(body.call)
      const supportRequest = body.supportRequest === null
        ? null
        : parseSkillSupportRequest(body.supportRequest)
      if (getIdempotencyKey(request) !== call.idempotencyKey) {
        throw new ApiError(
          'IDEMPOTENCY_KEY_MISMATCH',
          'The Orchestra Visual Intelligence job must use its exact call idempotency key.',
          409,
        )
      }
      const context = getServiceContext(request)
      const runtime = context.visualIntelligenceOrchestraJobRuntimePort
      if (!runtime) throw new ApiError(
        'TOOL_NOT_READY',
        'The Orchestra-owned Visual Intelligence job runtime is not released.',
        503,
        { requiredGate: 'visual_intelligence_orchestra_job_runtime_release' },
      )
      if (!context.auth?.userId) throw new ApiError(
        'AUTH_REQUIRED',
        'Authenticated user context is required.',
        401,
      )
      const execution = await runtime.execute({
        call,
        supportRequest,
        authenticatedOwnerUserId: context.auth.userId,
        expectedWorkspaceId: getRouteParam(request, 'workspaceId'),
      })
      sendOk(response, { execution }, [
        execution.status === 'cache_replay'
          ? 'The exact immutable Visual Intelligence result was returned to Orchestra without another provider call or cost settlement.'
          : 'Visual Intelligence completed only the exact Orchestra-authorized job and returned its immutable result to Orchestra. It did not edit the timeline, mutate artifacts, approve QA, deliver, or grant production authority.',
      ])
    }),
  )

  return router
}

function exactRecord(
  value: unknown,
  keys: readonly string[],
): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw validationFailed('Orchestra Visual Intelligence body is invalid.')
  }
  const prototype = Object.getPrototypeOf(value)
  const actualKeys = Reflect.ownKeys(value)
  const descriptors = Object.getOwnPropertyDescriptors(value)
  if (
    (prototype !== Object.prototype && prototype !== null)
    || actualKeys.some((key) => typeof key !== 'string')
    || actualKeys.length !== keys.length
    || keys.some((key) => !Object.hasOwn(value, key))
    || Object.values(descriptors).some(
      (descriptor) => 'get' in descriptor || 'set' in descriptor,
    )
  ) throw validationFailed('Orchestra Visual Intelligence body is malformed.')
  return value as Record<string, unknown>
}

function validationFailed(message: string): ApiError {
  return new ApiError('VALIDATION_FAILED', message, 400)
}
