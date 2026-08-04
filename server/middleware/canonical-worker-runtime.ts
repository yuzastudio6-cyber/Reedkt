import type { NextFunction, Request, Response } from 'express'

import type { RuntimeEnv } from '../config/env'
import { ApiError } from '../errors/api-error'
import { getServiceContext } from '../routes/route-helpers'

/**
 * Production worker execution remains fail-closed until the canonical,
 * tenant-bound lease RPC is deployed and the runtime uses its opaque lease
 * token for claim, heartbeat, and release operations.
 *
 * Keep this gate shared by every route that can invoke worker execution. A
 * route-specific copy is easy to omit when a new execution endpoint is added.
 */
export function requireCanonicalWorkerRuntime(
  request: Request,
  _response: Response,
  next: NextFunction,
): void {
  const context = getServiceContext(request)
  if (isExplicitLocalInternalTestRuntime(context.env)) {
    next()
    return
  }

  next(new ApiError(
    'TOOL_NOT_READY',
    'Worker execution is blocked until the canonical scoped lease and service-identity runtime is deployed.',
    503,
    {
      requiredGates: [
        'canonical_worker_claim_rpc',
        'opaque_hashed_lease_token',
        'worker_service_identity',
        'tenant_bound_job_scope',
      ],
    },
  ))
}

/**
 * Legacy/local runners are test infrastructure, not a non-production cloud
 * fallback. A runtime must prove all local boundaries before it may invoke
 * them; merely setting NODE_ENV to something other than production is not
 * sufficient.
 */
export function isExplicitLocalInternalTestRuntime(env: RuntimeEnv): boolean {
  return env.nodeEnv !== 'production' &&
    (env.mode === 'local' || env.mode === 'mock') &&
    (env.workerRuntimeMode === 'local' || env.workerRuntimeMode === 'mock') &&
    (env.mockOnly || env.allowInternalTestExecutionWithSupabase)
}
