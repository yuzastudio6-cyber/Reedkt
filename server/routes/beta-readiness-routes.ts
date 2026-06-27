import { Router } from 'express'
import { ApiError } from '../errors/api-error'
import { requireAuth } from '../middleware/auth'
import { requireIdempotency } from '../middleware/idempotency'
import { buildBetaReadinessReport } from '../beta-readiness'
import { createBetaReadinessEvidenceService } from '../beta-readiness/beta-readiness-evidence-service'
import { collectSecretLikePaths } from '../tool-cost-metering/secret-safety'
import { betaReadinessEvidenceEvaluationSchema, betaReadinessEvidencePacketSchema } from '../validation/beta-readiness-schemas'
import { validateBody } from '../validation/common-schemas'
import { asyncRoute, getIdempotencyKey, getServiceContext, sendOk } from './route-helpers'

export function createBetaReadinessRoutes(): Router {
  const router = Router()

  router.get('/v1/beta-readiness', requireAuth, asyncRoute(async (request, response) => {
    const workspaceId = stringQueryValue(request.query.workspaceId)
    if (!workspaceId) {
      sendOk(response, { report: buildBetaReadinessReport(), evidencePacketCount: 0 }, [
        'No workspaceId query supplied; returned default source-of-truth readiness report without stored evidence.',
      ])
      return
    }
    const result = await createBetaReadinessEvidenceService(getServiceContext(request)).getReport(workspaceId)
    sendOk(response, { report: result.report, evidencePacketCount: result.evidencePacketCount }, result.warnings)
  }))

  router.post('/v1/beta-readiness/evaluate', requireAuth, asyncRoute(async (request, response) => {
    const body = validateBody(betaReadinessEvidenceEvaluationSchema, request.body)
    assertNoSecretLikeBetaReadinessEvidence(body)

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

  router.get('/v1/beta-readiness/evidence', requireAuth, asyncRoute(async (request, response) => {
    const workspaceId = stringQueryValue(request.query.workspaceId)
    if (!workspaceId) {
      throw new ApiError('VALIDATION_FAILED', 'workspaceId query parameter is required for beta readiness evidence readback.', 400)
    }
    const result = await createBetaReadinessEvidenceService(getServiceContext(request)).listEvidence(workspaceId)
    sendOk(response, {
      packets: result.packets,
      mergedEvidence: result.mergedEvidence,
      report: result.report,
    }, result.warnings)
  }))

  router.post('/v1/beta-readiness/evidence', requireAuth, requireIdempotency, asyncRoute(async (request, response) => {
    const body = validateBody(betaReadinessEvidencePacketSchema, request.body)
    assertNoSecretLikeBetaReadinessEvidence(body)
    const result = await createBetaReadinessEvidenceService(getServiceContext(request)).recordEvidence(body, getIdempotencyKey(request))
    sendOk(response, {
      packet: result.packet,
      replayed: result.replayed,
      report: result.report,
    }, result.warnings, result.replayed ? 200 : 201)
  }))

  return router
}

function stringQueryValue(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined
}

function assertNoSecretLikeBetaReadinessEvidence(value: unknown): void {
  const secretPaths = collectSecretLikePaths(value, 'betaReadinessEvidence')
    .filter((path) => path !== 'betaReadinessEvidence.platformEvidence.serviceRoleWritePathVerified')
  if (secretPaths.length > 0) {
    throw new ApiError('VALIDATION_FAILED', `Beta readiness evidence contains secret-like fields: ${secretPaths.join(', ')}`, 400)
  }
}
