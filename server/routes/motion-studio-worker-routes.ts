import { Router, type Request } from 'express'
import { z } from 'zod'

import { ApiError } from '../errors/api-error'
import { requireAuth } from '../middleware/auth'
import { requireCanonicalWorkerRuntime } from '../middleware/canonical-worker-runtime'
import { requireSensitiveIdempotencyKey } from '../middleware/idempotency'
import { requireStrictInternalServiceAuth } from '../middleware/internal-service-auth'
import { createMotionStudioJobService } from '../motion-studio/jobs'
import { createMotionStudioAnimaticService } from '../motion-studio/animatics'
import { createMotionStudioAudioMixService } from '../motion-studio/audio-production'
import { createMotionStudioLayeredService } from '../motion-studio/layered'
import { createMotionStudioGenerationService } from '../motion-studio/generation'
import { createMotionStudioRenderService } from '../motion-studio/render'
import { createMotionStudioResearchService } from '../motion-studio/research'
import { createMotionStudioLiveGenerationService } from '../motion-studio/live-generation'
import { validateBody } from '../validation/common-schemas'
import {
  emptyMotionStudioWorkerRequestSchema,
  finishMotionStudioJobAttemptRequestSchema,
  heartbeatMotionStudioJobLeaseRequestSchema,
  reconcileMotionStudioJobAttemptRequestSchema,
} from '../validation/motion-studio-job-schemas'
import { executeMotionStudioPreviewRequestSchema } from '../validation/motion-studio-render-schemas'
import { executeMotionStudioAnimaticRequestSchema } from '../validation/motion-studio-animatic-schemas'
import { executeMotionStudioAudioMixRequestSchema } from '../validation/motion-studio-audio-mix-schemas'
import {
  executeMotionStudioLayeredCutoutRequestSchema,
  executeMotionStudioLayeredPreviewRequestSchema,
} from '../validation/motion-studio-layered-schemas'
import {
  executeMotionStudioGenerationRequestSchema,
  reconcileMotionStudioGenerationRequestSchema,
} from '../validation/motion-studio-generation-schemas'
import {
  completeMotionStudioLiveCandidateRequestSchema,
  consumeMotionStudioLiveFollowupCallRequestSchema,
  consumeMotionStudioLiveTransportPermitRequestSchema,
  createMotionStudioCurrencyExchangeRateRequestSchema,
  createMotionStudioLiveExecutionAuthorityRequestSchema,
  createMotionStudioLiveOperationRequestSchema,
  createMotionStudioMs010BAuthorizationRequestSchema,
  createMotionStudioProviderNativeRateRequestSchema,
  finishMotionStudioLiveOperationAttemptRequestSchema,
  issueMotionStudioLiveTransportPermitRequestSchema,
  reconcileMotionStudioLiveOperationAttemptRequestSchema,
  recordMotionStudioLiveProviderEventRequestSchema,
  recordMotionStudioLiveFollowupCallResultRequestSchema,
  reviewMotionStudioLiveCandidateRequestSchema,
} from '../validation/motion-studio-live-generation-schemas'
import { seedMotionStudioResearchFixtureRequestSchema } from '../validation/motion-studio-research-schemas'
import { asyncRoute, getIdempotencyKey, getRouteParam, getServiceContext, sendOk } from './route-helpers'

export const MOTION_STUDIO_WORKER_LEASE_CREDENTIAL_HEADER = 'x-reeditpro-worker-lease-credential'

const uuidParam = z.string().uuid()
const stableId = z.string().trim().min(1).max(200)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/)
  .refine((value) => !value.includes('..'))
const liveStableId = z.string().trim().min(1).max(240)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/)
  .refine((value) => !value.includes('..'))

export function createMotionStudioWorkerRoutes(): Router {
  const router = Router()
  const workerGuards = [
    requireAuth,
    requireStrictInternalServiceAuth,
    requireCanonicalWorkerRuntime,
    requireSensitiveIdempotencyKey,
  ] as const

  router.post(
    '/v1/internal/motion-studio/research-fixtures',
    ...workerGuards,
    asyncRoute(async (request, response) => {
      const body = validateBody(seedMotionStudioResearchFixtureRequestSchema, request.body)
      const result = await createMotionStudioResearchService(getServiceContext(request)).seedFixture(
        body,
        getIdempotencyKey(request),
      )
      sendOk(response, result.data, result.warnings, 201)
    }),
  )

  router.post(
    '/v1/internal/motion-studio/job-leases/:leaseId/generation-simulator',
    ...workerGuards,
    asyncRoute(async (request, response) => {
      const body = validateBody(executeMotionStudioGenerationRequestSchema, request.body)
      const result = await createMotionStudioGenerationService(getServiceContext(request)).executeGeneration(
        parseParam(uuidParam, getRouteParam(request, 'leaseId'), 'leaseId'),
        getLeaseCredential(request),
        body.bindingId,
        getIdempotencyKey(request),
        body.simulationScenario,
      )
      sendOk(response, result.data, result.warnings)
    }),
  )

  router.post(
    '/v1/internal/motion-studio/provider-attempts/:providerAttemptId/reconciliation',
    ...workerGuards,
    asyncRoute(async (request, response) => {
      const body = validateBody(reconcileMotionStudioGenerationRequestSchema, request.body)
      const result = await createMotionStudioGenerationService(getServiceContext(request)).reconcileGeneration(
        parseParam(uuidParam, getRouteParam(request, 'providerAttemptId'), 'providerAttemptId'),
        body,
        getIdempotencyKey(request),
      )
      sendOk(response, result.data, result.warnings)
    }),
  )

  router.post(
    '/v1/internal/motion-studio/job-leases/:leaseId/remotion-preview',
    ...workerGuards,
    asyncRoute(async (request, response) => {
      const body = validateBody(executeMotionStudioPreviewRequestSchema, request.body)
      const result = await createMotionStudioRenderService(getServiceContext(request)).executePreview(
        parseParam(uuidParam, getRouteParam(request, 'leaseId'), 'leaseId'),
        getLeaseCredential(request),
        body.bindingId,
        getIdempotencyKey(request),
      )
      sendOk(response, result.data, result.warnings)
    }),
  )

  router.post(
    '/v1/internal/motion-studio/job-leases/:leaseId/remotion-animatic',
    ...workerGuards,
    asyncRoute(async (request, response) => {
      const body = validateBody(executeMotionStudioAnimaticRequestSchema, request.body)
      const result = await createMotionStudioAnimaticService(getServiceContext(request)).executeAnimatic(
        parseParam(uuidParam, getRouteParam(request, 'leaseId'), 'leaseId'),
        getLeaseCredential(request),
        body.bindingId,
        getIdempotencyKey(request),
      )
      sendOk(response, result.data, result.warnings)
    }),
  )

  router.post(
    '/v1/internal/motion-studio/job-leases/:leaseId/storytelling-audio-mix',
    ...workerGuards,
    asyncRoute(async (request, response) => {
      const body = validateBody(executeMotionStudioAudioMixRequestSchema, request.body)
      const result = await createMotionStudioAudioMixService(getServiceContext(request)).executeMix(
        parseParam(uuidParam, getRouteParam(request, 'leaseId'), 'leaseId'),
        getLeaseCredential(request),
        body.bindingId,
        getIdempotencyKey(request),
      )
      sendOk(response, result.data, result.warnings)
    }),
  )

  router.post(
    '/v1/internal/motion-studio/job-leases/:leaseId/layered-cutout',
    ...workerGuards,
    asyncRoute(async (request, response) => {
      const body = validateBody(executeMotionStudioLayeredCutoutRequestSchema, request.body)
      const result = await createMotionStudioLayeredService(getServiceContext(request)).executeCutout(
        parseParam(uuidParam, getRouteParam(request, 'leaseId'), 'leaseId'),
        getLeaseCredential(request),
        body.assemblyId,
        getIdempotencyKey(request),
      )
      sendOk(response, result.data, result.warnings)
    }),
  )

  router.post(
    '/v1/internal/motion-studio/job-leases/:leaseId/remotion-layered-preview',
    ...workerGuards,
    asyncRoute(async (request, response) => {
      const body = validateBody(executeMotionStudioLayeredPreviewRequestSchema, request.body)
      const result = await createMotionStudioRenderService(getServiceContext(request)).executePreview(
        parseParam(uuidParam, getRouteParam(request, 'leaseId'), 'leaseId'),
        getLeaseCredential(request),
        body.bindingId,
        getIdempotencyKey(request),
      )
      sendOk(response, result.data, result.warnings)
    }),
  )

  router.post(
    '/v1/internal/motion-studio/productions/:productionId/job-claims',
    ...workerGuards,
    asyncRoute(async (request, response) => {
      validateBody(emptyMotionStudioWorkerRequestSchema, request.body)
      const result = await createMotionStudioJobService(getServiceContext(request)).claimNextJob(
        parseParam(uuidParam, getRouteParam(request, 'productionId'), 'productionId'),
        getIdempotencyKey(request),
      )
      sendOk(response, result.data, result.warnings, result.data.claim.status === 'claimed' ? 201 : 200)
    }),
  )

  router.post(
    '/v1/internal/motion-studio/job-leases/:leaseId/start',
    ...workerGuards,
    asyncRoute(async (request, response) => {
      validateBody(emptyMotionStudioWorkerRequestSchema, request.body)
      const result = await createMotionStudioJobService(getServiceContext(request)).startAttempt(
        parseParam(uuidParam, getRouteParam(request, 'leaseId'), 'leaseId'),
        getLeaseCredential(request),
        getIdempotencyKey(request),
      )
      sendOk(response, result.data, result.warnings)
    }),
  )

  router.post(
    '/v1/internal/motion-studio/job-leases/:leaseId/heartbeat',
    ...workerGuards,
    asyncRoute(async (request, response) => {
      const body = validateBody(heartbeatMotionStudioJobLeaseRequestSchema, request.body)
      const result = await createMotionStudioJobService(getServiceContext(request)).heartbeatLease(
        parseParam(uuidParam, getRouteParam(request, 'leaseId'), 'leaseId'),
        getLeaseCredential(request),
        body.extensionSeconds,
        getIdempotencyKey(request),
      )
      sendOk(response, result.data, result.warnings)
    }),
  )

  router.post(
    '/v1/internal/motion-studio/job-leases/:leaseId/results',
    ...workerGuards,
    asyncRoute(async (request, response) => {
      const body = validateBody(finishMotionStudioJobAttemptRequestSchema, request.body)
      const result = await createMotionStudioJobService(getServiceContext(request)).finishAttempt(
        parseParam(uuidParam, getRouteParam(request, 'leaseId'), 'leaseId'),
        getLeaseCredential(request),
        body,
        getIdempotencyKey(request),
      )
      sendOk(response, result.data, result.warnings)
    }),
  )

  router.post(
    '/v1/internal/motion-studio/job-leases/:leaseId/expire',
    ...workerGuards,
    asyncRoute(async (request, response) => {
      validateBody(emptyMotionStudioWorkerRequestSchema, request.body)
      const result = await createMotionStudioJobService(getServiceContext(request)).expireLease(
        parseParam(uuidParam, getRouteParam(request, 'leaseId'), 'leaseId'),
        getIdempotencyKey(request),
      )
      sendOk(response, result.data, result.warnings)
    }),
  )

  router.post(
    '/v1/internal/motion-studio/jobs/:jobId/reconciliation',
    ...workerGuards,
    asyncRoute(async (request, response) => {
      const body = validateBody(reconcileMotionStudioJobAttemptRequestSchema, request.body)
      const result = await createMotionStudioJobService(getServiceContext(request)).reconcileAttempt(
        parseParam(stableId, getRouteParam(request, 'jobId'), 'jobId'),
        body,
        getIdempotencyKey(request),
      )
      sendOk(response, result.data, result.warnings)
    }),
  )

  router.post(
    '/v1/internal/motion-studio/ms010b-authorizations',
    ...workerGuards,
    asyncRoute(async (request, response) => {
      const body = validateBody(createMotionStudioMs010BAuthorizationRequestSchema, request.body)
      const result = await createMotionStudioLiveGenerationService(getServiceContext(request)).createAuthorization(body)
      sendOk(response, result.data, result.warnings, 201)
    }),
  )

  router.post(
    '/v1/internal/motion-studio/ms010b-authorizations/:authorizationId/native-rates',
    ...workerGuards,
    asyncRoute(async (request, response) => {
      const body = validateBody(createMotionStudioProviderNativeRateRequestSchema, request.body)
      const result = await createMotionStudioLiveGenerationService(getServiceContext(request)).createProviderNativeRate({
        authorizationId: parseParam(liveStableId, getRouteParam(request, 'authorizationId'), 'authorizationId'),
        rate: body.rate,
      })
      sendOk(response, result.data, result.warnings, 201)
    }),
  )

  router.post(
    '/v1/internal/motion-studio/ms010b-authorizations/:authorizationId/fx-rates',
    ...workerGuards,
    asyncRoute(async (request, response) => {
      const body = validateBody(createMotionStudioCurrencyExchangeRateRequestSchema, request.body)
      const result = await createMotionStudioLiveGenerationService(getServiceContext(request)).createCurrencyExchangeRate({
        authorizationId: parseParam(liveStableId, getRouteParam(request, 'authorizationId'), 'authorizationId'),
        rate: body.rate,
      })
      sendOk(response, result.data, result.warnings, 201)
    }),
  )

  router.post(
    '/v1/internal/motion-studio/ms010b-authorizations/:authorizationId/execution-authorities',
    ...workerGuards,
    asyncRoute(async (request, response) => {
      const body = validateBody(createMotionStudioLiveExecutionAuthorityRequestSchema, request.body)
      const result = await createMotionStudioLiveGenerationService(getServiceContext(request)).createExecutionAuthority({
        authorizationId: parseParam(liveStableId, getRouteParam(request, 'authorizationId'), 'authorizationId'),
        ...body,
      })
      sendOk(response, result.data, result.warnings, 201)
    }),
  )

  router.post(
    '/v1/internal/motion-studio/live-execution-authorities/:executionAuthorityId/operations',
    ...workerGuards,
    asyncRoute(async (request, response) => {
      const body = validateBody(createMotionStudioLiveOperationRequestSchema, request.body)
      const result = await createMotionStudioLiveGenerationService(getServiceContext(request)).createOperation({
        executionAuthorityId: parseParam(liveStableId, getRouteParam(request, 'executionAuthorityId'), 'executionAuthorityId'),
        ...body,
      })
      sendOk(response, result.data, result.warnings, 201)
    }),
  )

  router.post(
    '/v1/internal/motion-studio/job-leases/:leaseId/live-operations/:operationId/permits',
    ...workerGuards,
    asyncRoute(async (request, response) => {
      const body = validateBody(issueMotionStudioLiveTransportPermitRequestSchema, request.body)
      const result = await createMotionStudioLiveGenerationService(getServiceContext(request)).issuePermit({
        operationId: parseParam(liveStableId, getRouteParam(request, 'operationId'), 'operationId'),
        leaseId: parseParam(uuidParam, getRouteParam(request, 'leaseId'), 'leaseId'),
        leaseCredential: getLeaseCredential(request),
        ...body,
      })
      sendOk(response, result.data, result.warnings, 201)
    }),
  )

  router.post(
    '/v1/internal/motion-studio/job-leases/:leaseId/live-permits/:permitId/consume',
    ...workerGuards,
    asyncRoute(async (request, response) => {
      const body = validateBody(consumeMotionStudioLiveTransportPermitRequestSchema, request.body)
      const result = await createMotionStudioLiveGenerationService(getServiceContext(request)).consumePermit({
        permitId: parseParam(uuidParam, getRouteParam(request, 'permitId'), 'permitId'),
        leaseId: parseParam(uuidParam, getRouteParam(request, 'leaseId'), 'leaseId'),
        leaseCredential: getLeaseCredential(request),
        requestDigest: body.requestDigest,
      })
      sendOk(response, result.data, result.warnings)
    }),
  )

  router.post(
    '/v1/internal/motion-studio/job-leases/:leaseId/live-operations/:operationId/followup-calls',
    ...workerGuards,
    asyncRoute(async (request, response) => {
      const body = validateBody(consumeMotionStudioLiveFollowupCallRequestSchema, request.body)
      const result = await createMotionStudioLiveGenerationService(getServiceContext(request)).consumeFollowupCall({
        operationId: parseParam(liveStableId, getRouteParam(request, 'operationId'), 'operationId'),
        leaseId: parseParam(uuidParam, getRouteParam(request, 'leaseId'), 'leaseId'),
        leaseCredential: getLeaseCredential(request),
        ...body,
      })
      sendOk(response, result.data, result.warnings, 201)
    }),
  )

  router.post(
    '/v1/internal/motion-studio/live-followup-calls/:callId/results',
    ...workerGuards,
    asyncRoute(async (request, response) => {
      const body = validateBody(recordMotionStudioLiveFollowupCallResultRequestSchema, request.body)
      const result = await createMotionStudioLiveGenerationService(getServiceContext(request)).recordFollowupCallResult({
        callId: parseParam(uuidParam, getRouteParam(request, 'callId'), 'callId'),
        leaseCredential: getLeaseCredential(request),
        ...body,
      })
      sendOk(response, result.data, result.warnings, 201)
    }),
  )

  router.post(
    '/v1/internal/motion-studio/live-operations/:operationId/events',
    ...workerGuards,
    asyncRoute(async (request, response) => {
      const body = validateBody(recordMotionStudioLiveProviderEventRequestSchema, request.body)
      const result = await createMotionStudioLiveGenerationService(getServiceContext(request)).recordProviderEvent({
        operationId: parseParam(liveStableId, getRouteParam(request, 'operationId'), 'operationId'),
        ...body,
      })
      sendOk(response, result.data, result.warnings, 201)
    }),
  )

  router.post(
    '/v1/internal/motion-studio/job-leases/:leaseId/live-operations/:operationId/attempt-result',
    ...workerGuards,
    asyncRoute(async (request, response) => {
      const body = validateBody(finishMotionStudioLiveOperationAttemptRequestSchema, request.body)
      const result = await createMotionStudioLiveGenerationService(getServiceContext(request)).finishAttempt({
        operationId: parseParam(liveStableId, getRouteParam(request, 'operationId'), 'operationId'),
        leaseId: parseParam(uuidParam, getRouteParam(request, 'leaseId'), 'leaseId'),
        leaseCredential: getLeaseCredential(request),
        ...body,
        idempotencyKey: getIdempotencyKey(request),
      })
      sendOk(response, result.data, result.warnings)
    }),
  )

  router.post(
    '/v1/internal/motion-studio/live-operations/:operationId/reconciliation',
    ...workerGuards,
    asyncRoute(async (request, response) => {
      const body = validateBody(reconcileMotionStudioLiveOperationAttemptRequestSchema, request.body)
      const result = await createMotionStudioLiveGenerationService(getServiceContext(request)).reconcileAttempt({
        operationId: parseParam(liveStableId, getRouteParam(request, 'operationId'), 'operationId'),
        ...body,
        idempotencyKey: getIdempotencyKey(request),
      })
      sendOk(response, result.data, result.warnings)
    }),
  )

  router.post(
    '/v1/internal/motion-studio/job-leases/:leaseId/live-operations/:operationId/candidates',
    ...workerGuards,
    asyncRoute(async (request, response) => {
      const body = validateBody(completeMotionStudioLiveCandidateRequestSchema, request.body)
      const result = await createMotionStudioLiveGenerationService(getServiceContext(request)).completeCandidate({
        operationId: parseParam(liveStableId, getRouteParam(request, 'operationId'), 'operationId'),
        leaseId: parseParam(uuidParam, getRouteParam(request, 'leaseId'), 'leaseId'),
        leaseCredential: getLeaseCredential(request),
        ...body,
        idempotencyKey: getIdempotencyKey(request),
      })
      sendOk(response, result.data, result.warnings, 201)
    }),
  )

  router.post(
    '/v1/internal/motion-studio/live-candidates/:candidateId/reviews',
    ...workerGuards,
    asyncRoute(async (request, response) => {
      const body = validateBody(reviewMotionStudioLiveCandidateRequestSchema, request.body)
      const result = await createMotionStudioLiveGenerationService(getServiceContext(request)).reviewCandidate({
        candidateId: parseParam(uuidParam, getRouteParam(request, 'candidateId'), 'candidateId'),
        ...body,
      })
      sendOk(response, result.data, result.warnings, 201)
    }),
  )

  return router
}

function getLeaseCredential(request: Request): string {
  const value = request.header(MOTION_STUDIO_WORKER_LEASE_CREDENTIAL_HEADER)?.trim()
  if (!value || !/^[a-f0-9]{64}$/.test(value)) {
    throw new ApiError('WORKER_LEASE_INVALID', 'A valid opaque worker lease credential is required.', 401)
  }
  return value
}

function parseParam<T>(schema: z.ZodType<T>, value: string, name: string): T {
  const parsed = schema.safeParse(value)
  if (!parsed.success) throw new ApiError('VALIDATION_FAILED', `Route parameter ${name} is invalid.`, 400)
  return parsed.data
}
