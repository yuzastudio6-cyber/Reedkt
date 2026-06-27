import { Router } from 'express'
import { ApiError } from '../errors/api-error'
import { requireAuth } from '../middleware/auth'
import { buildBetaReadinessReport } from '../beta-readiness'
import { collectSecretLikePaths } from '../tool-cost-metering/secret-safety'
import { betaReadinessEvidenceEvaluationSchema } from '../validation/beta-readiness-schemas'
import { validateBody } from '../validation/common-schemas'
import { asyncRoute, sendOk } from './route-helpers'

export function createBetaReadinessRoutes(): Router {
  const router = Router()

  router.get('/v1/beta-readiness', requireAuth, asyncRoute(async (_request, response) => {
    sendOk(response, { report: buildBetaReadinessReport() })
  }))

  router.post('/v1/beta-readiness/evaluate', requireAuth, asyncRoute(async (request, response) => {
    const body = validateBody(betaReadinessEvidenceEvaluationSchema, request.body)
    const secretPaths = collectSecretLikePaths(body, 'betaReadinessEvidence')
      .filter((path) => path !== 'betaReadinessEvidence.platformEvidence.serviceRoleWritePathVerified')
    if (secretPaths.length > 0) {
      throw new ApiError('VALIDATION_FAILED', `Beta readiness evidence contains secret-like fields: ${secretPaths.join(', ')}`, 400)
    }

    try {
      sendOk(response, {
        report: buildBetaReadinessReport({
          ...(body.baseline ?? {}),
          ...(body.approvals ?? {}),
          checklistEvidence: body.checklistEvidence,
          acceptedToolEvidence: body.acceptedToolEvidence,
          platformEvidence: body.platformEvidence,
        }),
      })
    } catch (error) {
      if (error instanceof Error) {
        throw new ApiError('VALIDATION_FAILED', error.message, 400)
      }
      throw error
    }
  }))

  return router
}
