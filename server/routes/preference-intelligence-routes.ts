import { Router } from 'express'
import { ApiError } from '../errors/api-error'
import { requireAuth } from '../middleware/auth'
import { requireInternalServiceAuth } from '../middleware/internal-service-auth'
import { createPreferenceIntelligenceService } from '../services/preference-intelligence-service'
import { validateBody } from '../validation/common-schemas'
import {
  addPreferenceEvidenceSchema,
  addPreferenceStudyQuestionSchema,
  answerPreferenceStudyQuestionSchema,
  appendPreferenceStudyAssistantMessageSchema,
  appendPreferenceStudyMessageSchema,
  applyPreferenceToEditSessionSchema,
  archiveReusableEditPreferenceSchema,
  approvePreferenceDnaSchema,
  buildPreferenceDnaSchema,
  clearPreferenceFromEditSessionSchema,
  createReusableEditPreferenceSchema,
  preferenceContextQuerySchema,
  preferenceWorkspaceQuerySchema,
  requestPreferenceEvidenceAnalysisSchema,
  runPreferenceDnaQaSchema,
  startPreferenceStudySchema,
  updateReusableEditPreferenceSchema,
} from '../validation/preference-intelligence-schemas'
import {
  asyncRoute,
  getIdempotencyKey,
  getRouteParam,
  getServiceContext,
  sendOk,
} from './route-helpers'

export function createPreferenceIntelligenceRoutes(): Router {
  const router = Router()

  router.get(
    '/v1/workspaces/:workspaceId/preference-library',
    requireAuth,
    asyncRoute(async (request, response) => {
      const workspaceId = getRouteParam(request, 'workspaceId')
      const result = await createPreferenceIntelligenceService(getServiceContext(request)).listPreferences(workspaceId)
      sendOk(response, preferenceResponseData(result), result.warnings)
    }),
  )

  router.post(
    '/v1/workspaces/:workspaceId/preference-library',
    requireAuth,
    asyncRoute(async (request, response) => {
      const body = validateBody(createReusableEditPreferenceSchema, request.body)
      assertWorkspaceMatches(getRouteParam(request, 'workspaceId'), body.workspaceId)
      const result = await createPreferenceIntelligenceService(getServiceContext(request)).createPreference({
        ...body,
        idempotencyKey: getIdempotencyKey(request),
      })
      sendOk(response, preferenceResponseData(result), result.warnings, 201)
    }),
  )

  router.get(
    '/v1/workspaces/:workspaceId/preference-library/:preferenceId',
    requireAuth,
    asyncRoute(async (request, response) => {
      const result = await createPreferenceIntelligenceService(getServiceContext(request)).getPreference(
        getRouteParam(request, 'workspaceId'),
        getRouteParam(request, 'preferenceId'),
      )
      sendOk(response, preferenceResponseData(result), result.warnings)
    }),
  )

  router.patch(
    '/v1/workspaces/:workspaceId/preference-library/:preferenceId',
    requireAuth,
    asyncRoute(async (request, response) => {
      const body = validateBody(updateReusableEditPreferenceSchema, request.body)
      assertWorkspaceMatches(getRouteParam(request, 'workspaceId'), body.workspaceId)
      const result = await createPreferenceIntelligenceService(getServiceContext(request)).updatePreference({
        ...body,
        preferenceId: getRouteParam(request, 'preferenceId'),
        idempotencyKey: getIdempotencyKey(request),
      })
      sendOk(response, preferenceResponseData(result), result.warnings)
    }),
  )

  router.post(
    '/v1/workspaces/:workspaceId/preference-library/:preferenceId/archive',
    requireAuth,
    asyncRoute(async (request, response) => {
      const body = validateBody(archiveReusableEditPreferenceSchema, request.body)
      assertWorkspaceMatches(getRouteParam(request, 'workspaceId'), body.workspaceId)
      const result = await createPreferenceIntelligenceService(getServiceContext(request)).archivePreference({
        ...body,
        preferenceId: getRouteParam(request, 'preferenceId'),
        idempotencyKey: getIdempotencyKey(request),
      })
      sendOk(response, preferenceResponseData(result), result.warnings)
    }),
  )

  router.post(
    '/v1/workspaces/:workspaceId/preference-library/:preferenceId/studies',
    requireAuth,
    asyncRoute(async (request, response) => {
      const body = validateBody(startPreferenceStudySchema, request.body)
      assertWorkspaceMatches(getRouteParam(request, 'workspaceId'), body.workspaceId)
      const result = await createPreferenceIntelligenceService(getServiceContext(request)).startStudy({
        ...body,
        preferenceId: getRouteParam(request, 'preferenceId'),
        idempotencyKey: getIdempotencyKey(request),
      })
      sendOk(response, preferenceResponseData(result), result.warnings, 201)
    }),
  )

  router.get(
    '/v1/preference-studies/:studySessionId',
    requireAuth,
    asyncRoute(async (request, response) => {
      const query = validateBody(preferenceWorkspaceQuerySchema, request.query)
      const result = await createPreferenceIntelligenceService(getServiceContext(request)).getStudy(
        query.workspaceId,
        getRouteParam(request, 'studySessionId'),
      )
      sendOk(response, preferenceResponseData(result), result.warnings)
    }),
  )

  router.post(
    '/v1/preference-studies/:studySessionId/messages',
    requireAuth,
    asyncRoute(async (request, response) => {
      const body = validateBody(appendPreferenceStudyMessageSchema, request.body)
      const result = await createPreferenceIntelligenceService(getServiceContext(request)).appendUserStudyMessage({
        ...body,
        studySessionId: getRouteParam(request, 'studySessionId'),
        idempotencyKey: getIdempotencyKey(request),
      })
      sendOk(response, preferenceResponseData(result), result.warnings, 201)
    }),
  )

  router.post(
    '/v1/preference-studies/:studySessionId/assistant-messages',
    requireAuth,
    requireInternalServiceAuth,
    asyncRoute(async (request, response) => {
      const body = validateBody(appendPreferenceStudyAssistantMessageSchema, request.body)
      const result = await createPreferenceIntelligenceService(getServiceContext(request)).appendAssistantStudyMessage({
        ...body,
        studySessionId: getRouteParam(request, 'studySessionId'),
        idempotencyKey: getIdempotencyKey(request),
      })
      sendOk(response, preferenceResponseData(result), result.warnings, 201)
    }),
  )

  router.post(
    '/v1/preference-studies/:studySessionId/questions',
    requireAuth,
    requireInternalServiceAuth,
    asyncRoute(async (request, response) => {
      const body = validateBody(addPreferenceStudyQuestionSchema, request.body)
      const result = await createPreferenceIntelligenceService(getServiceContext(request)).addStudyQuestion({
        ...body,
        studySessionId: getRouteParam(request, 'studySessionId'),
        idempotencyKey: getIdempotencyKey(request),
      })
      sendOk(response, preferenceResponseData(result), result.warnings, 201)
    }),
  )

  router.post(
    '/v1/preference-studies/:studySessionId/questions/:questionId/answers',
    requireAuth,
    asyncRoute(async (request, response) => {
      const body = validateBody(answerPreferenceStudyQuestionSchema, request.body)
      const result = await createPreferenceIntelligenceService(getServiceContext(request)).answerStudyQuestion({
        ...body,
        studySessionId: getRouteParam(request, 'studySessionId'),
        questionId: getRouteParam(request, 'questionId'),
        idempotencyKey: getIdempotencyKey(request),
      })
      sendOk(response, preferenceResponseData(result), result.warnings, 201)
    }),
  )

  router.post(
    '/v1/preference-studies/:studySessionId/evidence',
    requireAuth,
    asyncRoute(async (request, response) => {
      const body = validateBody(addPreferenceEvidenceSchema, request.body)
      const result = await createPreferenceIntelligenceService(getServiceContext(request)).addEvidence({
        ...body,
        studySessionId: getRouteParam(request, 'studySessionId'),
        idempotencyKey: getIdempotencyKey(request),
      })
      sendOk(response, preferenceResponseData(result), result.warnings, 201)
    }),
  )

  router.post(
    '/v1/preference-studies/:studySessionId/evidence/:evidenceId/request-analysis',
    requireAuth,
    requireInternalServiceAuth,
    asyncRoute(async (request, response) => {
      const body = validateBody(requestPreferenceEvidenceAnalysisSchema, request.body)
      const result = await createPreferenceIntelligenceService(getServiceContext(request)).requestEvidenceAnalysis({
        ...body,
        studySessionId: getRouteParam(request, 'studySessionId'),
        evidenceId: getRouteParam(request, 'evidenceId'),
        idempotencyKey: getIdempotencyKey(request),
      })
      sendOk(response, preferenceResponseData(result), result.warnings)
    }),
  )

  router.post(
    '/v1/preference-studies/:studySessionId/build-dna',
    requireAuth,
    asyncRoute(async (request, response) => {
      const body = validateBody(buildPreferenceDnaSchema, request.body)
      const result = await createPreferenceIntelligenceService(getServiceContext(request)).buildDna({
        ...body,
        studySessionId: getRouteParam(request, 'studySessionId'),
        idempotencyKey: getIdempotencyKey(request),
      })
      sendOk(response, preferenceResponseData(result), result.warnings, 201)
    }),
  )

  router.post(
    '/v1/workspaces/:workspaceId/preference-library/:preferenceId/dna/:dnaVersionId/qa',
    requireAuth,
    asyncRoute(async (request, response) => {
      const body = validateBody(runPreferenceDnaQaSchema, request.body)
      assertWorkspaceMatches(getRouteParam(request, 'workspaceId'), body.workspaceId)
      assertPathIdMatches(getRouteParam(request, 'dnaVersionId'), body.dnaVersionId, 'DNA version')
      const result = await createPreferenceIntelligenceService(getServiceContext(request)).runDnaQa({
        ...body,
        preferenceId: getRouteParam(request, 'preferenceId'),
        idempotencyKey: getIdempotencyKey(request),
      })
      sendOk(response, preferenceResponseData(result), result.warnings, 201)
    }),
  )

  router.post(
    '/v1/workspaces/:workspaceId/preference-library/:preferenceId/dna/:dnaVersionId/approve',
    requireAuth,
    asyncRoute(async (request, response) => {
      const body = validateBody(approvePreferenceDnaSchema, request.body)
      assertWorkspaceMatches(getRouteParam(request, 'workspaceId'), body.workspaceId)
      assertPathIdMatches(getRouteParam(request, 'dnaVersionId'), body.dnaVersionId, 'DNA version')
      const result = await createPreferenceIntelligenceService(getServiceContext(request)).approveDna({
        ...body,
        preferenceId: getRouteParam(request, 'preferenceId'),
        idempotencyKey: getIdempotencyKey(request),
      })
      sendOk(response, preferenceResponseData(result), result.warnings, 201)
    }),
  )

  router.get(
    '/v1/workspaces/:workspaceId/preference-library/:preferenceId/versions',
    requireAuth,
    asyncRoute(async (request, response) => {
      const result = await createPreferenceIntelligenceService(getServiceContext(request)).listVersions(
        getRouteParam(request, 'workspaceId'),
        getRouteParam(request, 'preferenceId'),
      )
      sendOk(response, preferenceResponseData(result), result.warnings)
    }),
  )

  router.get(
    '/v1/workspaces/:workspaceId/preference-library/:preferenceId/applied-edits',
    requireAuth,
    asyncRoute(async (request, response) => {
      const result = await createPreferenceIntelligenceService(getServiceContext(request)).listAppliedEdits(
        getRouteParam(request, 'workspaceId'),
        getRouteParam(request, 'preferenceId'),
      )
      sendOk(response, preferenceResponseData(result), result.warnings)
    }),
  )

  router.get(
    '/v1/projects/:projectId/edit-sessions/:editSessionId/preference-application',
    requireAuth,
    asyncRoute(async (request, response) => {
      const query = validateBody(preferenceWorkspaceQuerySchema, request.query)
      const result = await createPreferenceIntelligenceService(getServiceContext(request)).getApplication(
        query.workspaceId,
        getRouteParam(request, 'projectId'),
        getRouteParam(request, 'editSessionId'),
      )
      sendOk(response, preferenceResponseData(result), result.warnings)
    }),
  )

  router.put(
    '/v1/projects/:projectId/edit-sessions/:editSessionId/preference-application',
    requireAuth,
    asyncRoute(async (request, response) => {
      const body = validateBody(applyPreferenceToEditSessionSchema, request.body)
      const result = await createPreferenceIntelligenceService(getServiceContext(request)).applyPreference({
        ...body,
        projectId: getRouteParam(request, 'projectId'),
        editSessionId: getRouteParam(request, 'editSessionId'),
        idempotencyKey: getIdempotencyKey(request),
      })
      sendOk(response, preferenceResponseData(result), result.warnings)
    }),
  )

  router.post(
    '/v1/projects/:projectId/edit-sessions/:editSessionId/preference-application/clear',
    requireAuth,
    asyncRoute(async (request, response) => {
      const body = validateBody(clearPreferenceFromEditSessionSchema, request.body)
      const result = await createPreferenceIntelligenceService(getServiceContext(request)).clearPreference({
        ...body,
        projectId: getRouteParam(request, 'projectId'),
        editSessionId: getRouteParam(request, 'editSessionId'),
        idempotencyKey: getIdempotencyKey(request),
      })
      sendOk(response, preferenceResponseData(result), result.warnings)
    }),
  )

  router.get(
    '/v1/projects/:projectId/edit-sessions/:editSessionId/preference-context',
    requireAuth,
    asyncRoute(async (request, response) => {
      const query = validateBody(preferenceContextQuerySchema, request.query)
      const result = await createPreferenceIntelligenceService(getServiceContext(request)).getContextPackage(
        query.workspaceId,
        getRouteParam(request, 'projectId'),
        getRouteParam(request, 'editSessionId'),
        query.audience,
      )
      sendOk(response, preferenceResponseData(result), result.warnings)
    }),
  )

  return router
}

function preferenceResponseData<T extends {
  capability: unknown
  warnings: string[]
}>(result: T): Omit<T, 'warnings'> {
  const { warnings: _warnings, ...data } = result
  void _warnings
  return data
}

function assertWorkspaceMatches(routeWorkspaceId: string, bodyWorkspaceId: string): void {
  if (routeWorkspaceId !== bodyWorkspaceId) {
    throw new ApiError('VALIDATION_FAILED', 'Body workspaceId must match the route workspace.', 400)
  }
}

function assertPathIdMatches(routeId: string, bodyId: string, label: string): void {
  if (routeId !== bodyId) throw new ApiError('VALIDATION_FAILED', `Body ${label} ID must match the route.`, 400)
}
