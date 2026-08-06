import { Router } from 'express'
import { ApiError } from '../errors/api-error'
import { requireAuth } from '../middleware/auth'
import { requireInternalServiceAuth } from '../middleware/internal-service-auth'
import { runToolReadinessChecks } from '../workers/tool-readiness-runner'
import {
  toolReadinessCheckSchema,
} from '../validation/worker-schemas'
import { validateBody } from '../validation/common-schemas'
import { asyncRoute, getServiceContext, sendOk } from './route-helpers'

export function createWorkerRoutes(): Router {
  const router = Router()

  router.post('/v1/workers/tool-readiness/check', requireAuth, requireInternalServiceAuth, asyncRoute(async (request, response) => {
    const body = validateBody(toolReadinessCheckSchema, request.body)
    const result = await runToolReadinessChecks(getServiceContext(request), body)
    sendOk(response, result, result.warnings, 201)
  }))

  router.use(
    ['/v1/jobs', '/v1/workers/jobs', '/v1/tool-runtime-checks'],
    requireAuth,
    requireInternalServiceAuth,
    asyncRoute(async () => {
      throw new ApiError(
        'TOOL_NOT_READY',
        'Worker claims, execution, probes, release, heartbeat, and runtime-evidence writes are disabled until they load canonical jobs and opaque server-owned leases.',
        503,
        {
          requiredGates: [
            'canonical_authority_job_loader',
            'opaque_hashed_worker_lease',
            'tenant_bound_worker_claim_rpc',
            'server_owned_source_asset_manifest',
            'durable_worker_result_and_cost_evidence',
          ],
        },
      )
    }),
  )

  return router
}
