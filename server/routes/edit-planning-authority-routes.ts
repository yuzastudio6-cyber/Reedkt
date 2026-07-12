import { Router } from 'express'
import { ApiError } from '../errors/api-error'
import { requireAuth } from '../middleware/auth'
import { requireInternalServiceAuth } from '../middleware/internal-service-auth'
import { createCanonicalEditJourneyService } from '../services/canonical-edit-journey-service'
import { createCanonicalPlanPublicationRequestService } from '../services/canonical-plan-publication-request-service'
import { createEditPlanningAuthorityService } from '../services/edit-planning-authority-service'
import { createCanonicalPlanningHandoffService } from '../services/canonical-planning-handoff-service'
import { createCanonicalPreExecutionCancellationService } from '../services/canonical-pre-execution-cancellation-service'
import {
  createCanonicalPlanningHandoffSchema,
  canonicalPlanningHandoffInspectionQuerySchema,
  publishCanonicalEditPlanFromHandoffSchema,
  publishCanonicalPlanPublicationRequestSchema,
} from '../validation/canonical-planning-handoff-schemas'
import { cancelCanonicalApprovedSnapshotSchema } from '../validation/canonical-pre-execution-cancellation-schemas'
import { canonicalEditJourneyQuerySchema } from '../validation/canonical-edit-journey-schemas'
import {
  approveCanonicalEditPlanSchema,
  authorityWorkspaceQuerySchema,
} from '../validation/edit-planning-authority-schemas'
import { validateBody } from '../validation/common-schemas'
import {
  asyncRoute,
  getIdempotencyKey,
  getRouteParam,
  getServiceContext,
  sendOk,
} from './route-helpers'

export function createEditPlanningAuthorityRoutes(): Router {
  const router = Router()

  router.get(
    '/v1/projects/:projectId/edit-sessions/:editSessionId/canonical-journey',
    requireAuth,
    asyncRoute(async (request, response) => {
      const query = validateBody(canonicalEditJourneyQuerySchema, request.query)
      const journey = await createCanonicalEditJourneyService(
        getServiceContext(request),
      ).recover({
        ...query,
        projectId: getRouteParam(request, 'projectId'),
        editSessionId: getRouteParam(request, 'editSessionId'),
      })
      sendOk(response, { canonicalEditJourney: journey }, [
        'Canonical journey recovery is inspection-only and returns the exact next safe action without private execution inputs.',
      ])
    }),
  )

  router.post(
    '/v1/projects/:projectId/edit-sessions/:editSessionId/canonical-planning-handoff',
    requireAuth,
    asyncRoute(async (request, response) => {
      const body = validateBody(createCanonicalPlanningHandoffSchema, request.body)
      const handoff = await createCanonicalPlanningHandoffService(getServiceContext(request)).prepare({
        ...body,
        projectId: getRouteParam(request, 'projectId'),
        editSessionId: getRouteParam(request, 'editSessionId'),
      })
      sendOk(response, { canonicalPlanningHandoff: handoff }, [
        'This authenticated handoff verified finalized source media plus the current Exact Edit Preferences, Preference DNA application, Edit Brief, frame, and cleanup state without publishing a plan.',
        'Plan publication, approval, credit reservation, tools, providers, rendering, and production remain separate gates.',
      ])
    }),
  )

  router.get(
    '/v1/projects/:projectId/edit-sessions/:editSessionId/canonical-planning-handoffs/latest',
    requireAuth,
    asyncRoute(async (request, response) => {
      const query = validateBody(canonicalPlanningHandoffInspectionQuerySchema, request.query)
      const inspection = await createCanonicalPlanningHandoffService(
        getServiceContext(request),
      ).inspectLatest({
        ...query,
        projectId: getRouteParam(request, 'projectId'),
        editSessionId: getRouteParam(request, 'editSessionId'),
      })
      sendOk(response, { canonicalPlanningHandoffInspection: inspection }, [
        'Latest handoff discovery is tenant-scoped and inspection-only; publication still requires the exact handoff ID/hash and full current-state revalidation.',
      ])
    }),
  )

  router.post(
    '/v1/projects/:projectId/edit-sessions/:editSessionId/canonical-planning-handoffs/:handoffId/publication-requests',
    requireAuth,
    asyncRoute(async (request, response) => {
      const body = validateBody(publishCanonicalEditPlanFromHandoffSchema, request.body)
      const publicationRequest = await createCanonicalPlanPublicationRequestService(
        getServiceContext(request),
      ).submit({
        ...body,
        projectId: getRouteParam(request, 'projectId'),
        editSessionId: getRouteParam(request, 'editSessionId'),
        handoffId: getRouteParam(request, 'handoffId'),
      })
      sendOk(response, { canonicalPlanPublicationRequest: publicationRequest }, [
        'The authenticated request is persisted for internal canonical publication; it grants no plan, snapshot, credit, tool, provider, worker, or render authority.',
      ], 201)
    }),
  )

  router.get(
    '/v1/projects/:projectId/edit-sessions/:editSessionId/canonical-planning-handoffs/:handoffId/publication-requests/latest',
    requireAuth,
    asyncRoute(async (request, response) => {
      const query = validateBody(canonicalPlanningHandoffInspectionQuerySchema, request.query)
      const publicationRequest = await createCanonicalPlanPublicationRequestService(
        getServiceContext(request),
      ).inspectLatest({
        ...query,
        projectId: getRouteParam(request, 'projectId'),
        editSessionId: getRouteParam(request, 'editSessionId'),
        handoffId: getRouteParam(request, 'handoffId'),
      })
      sendOk(response, { canonicalPlanPublicationRequest: publicationRequest }, [
        'Latest publication-request discovery is tenant-scoped and returns no raw request body or mutation authority.',
      ])
    }),
  )

  router.get(
    '/v1/projects/:projectId/edit-sessions/:editSessionId/canonical-planning-handoffs/:handoffId/publication-requests/:candidateId',
    requireAuth,
    asyncRoute(async (request, response) => {
      const query = validateBody(canonicalPlanningHandoffInspectionQuerySchema, request.query)
      const publicationRequest = await createCanonicalPlanPublicationRequestService(
        getServiceContext(request),
      ).inspect({
        ...query,
        projectId: getRouteParam(request, 'projectId'),
        editSessionId: getRouteParam(request, 'editSessionId'),
        handoffId: getRouteParam(request, 'handoffId'),
        candidateId: getRouteParam(request, 'candidateId'),
      })
      sendOk(response, { canonicalPlanPublicationRequest: publicationRequest }, [
        'Publication-request inspection returns hashes and state only; raw request bodies and execution authority remain private.',
      ])
    }),
  )

  router.post(
    '/v1/projects/:projectId/edit-sessions/:editSessionId/canonical-planning-handoffs/:handoffId/publication-requests/:candidateId/publish',
    requireAuth,
    requireInternalServiceAuth,
    asyncRoute(async (request, response) => {
      const body = validateBody(publishCanonicalPlanPublicationRequestSchema, request.body)
      const result = await createCanonicalPlanPublicationRequestService(
        getServiceContext(request),
      ).publish({
        ...body,
        projectId: getRouteParam(request, 'projectId'),
        editSessionId: getRouteParam(request, 'editSessionId'),
        handoffId: getRouteParam(request, 'handoffId'),
        candidateId: getRouteParam(request, 'candidateId'),
        idempotencyKey: getIdempotencyKey(request),
        requestPath: request.originalUrl,
      })
      sendOk(response, {
        authority: result.authority,
        canonicalPlanningHandoff: result.canonicalPlanningHandoff,
        canonicalPlanPublicationRequest: result.publicationRequest,
      }, result.warnings, 201)
    }),
  )

  router.get(
    '/v1/projects/:projectId/edit-sessions/:editSessionId/canonical-planning-handoffs/:handoffId',
    requireAuth,
    asyncRoute(async (request, response) => {
      const query = validateBody(canonicalPlanningHandoffInspectionQuerySchema, request.query)
      const inspection = await createCanonicalPlanningHandoffService(
        getServiceContext(request),
      ).inspect({
        ...query,
        projectId: getRouteParam(request, 'projectId'),
        editSessionId: getRouteParam(request, 'editSessionId'),
        handoffId: getRouteParam(request, 'handoffId'),
      })
      sendOk(response, { canonicalPlanningHandoffInspection: inspection }, [
        'Inspection verifies persisted single-host handoff integrity and publication lineage only; publication still performs full current-state revalidation.',
      ])
    }),
  )

  router.post(
    '/v1/projects/:projectId/edit-sessions/:editSessionId/canonical-plans',
    requireAuth,
    requireInternalServiceAuth,
    asyncRoute(async () => {
      throw new ApiError(
        'TOOL_NOT_READY',
        'Direct canonical plan publication with caller-supplied planning or source authority is disabled.',
        503,
        {
          replacementRoute:
            '/v1/projects/:projectId/edit-sessions/:editSessionId/canonical-planning-handoffs/:handoffId/publish',
          requiredGate: 'persisted_server_loaded_planning_handoff_authority',
        },
      )
    }),
  )

  router.post(
    '/v1/projects/:projectId/edit-sessions/:editSessionId/canonical-planning-handoffs/:handoffId/publish',
    requireAuth,
    requireInternalServiceAuth,
    asyncRoute(async (request, response) => {
      const body = validateBody(publishCanonicalEditPlanFromHandoffSchema, request.body)
      const result = await createCanonicalPlanningHandoffService(
        getServiceContext(request),
      ).publishFromPersistedHandoff({
        ...body,
        projectId: getRouteParam(request, 'projectId'),
        editSessionId: getRouteParam(request, 'editSessionId'),
        handoffId: getRouteParam(request, 'handoffId'),
        idempotencyKey: getIdempotencyKey(request),
        requestPath: request.originalUrl,
      })
      sendOk(response, {
        authority: result.authority,
        canonicalPlanningHandoff: result.canonicalPlanningHandoff,
      }, result.warnings, 201)
    }),
  )

  router.post(
    '/v1/edit-plans/:editPlanId/approve',
    requireAuth,
    asyncRoute(async (request, response) => {
      const body = validateBody(approveCanonicalEditPlanSchema, request.body)
      const result = await createEditPlanningAuthorityService(getServiceContext(request)).approveAndFundCanonicalPlan({
        ...body,
        editPlanId: getRouteParam(request, 'editPlanId'),
        idempotencyKey: getIdempotencyKey(request),
        requestPath: request.originalUrl,
      })
      sendOk(response, { authority: result.authority }, result.warnings, 201)
    }),
  )

  router.post(
    '/v1/approved-snapshots/:snapshotId/cancel',
    requireAuth,
    asyncRoute(async (request, response) => {
      const body = validateBody(cancelCanonicalApprovedSnapshotSchema, request.body)
      const result = await createCanonicalPreExecutionCancellationService(getServiceContext(request)).cancel({
        ...body,
        snapshotId: getRouteParam(request, 'snapshotId'),
        idempotencyKey: getIdempotencyKey(request),
        requestPath: request.originalUrl,
      })
      sendOk(response, { canonicalPreExecutionCancellation: result.cancellation }, result.warnings, 201)
    }),
  )

  router.get(
    '/v1/edit-plans/:editPlanId/authority',
    requireAuth,
    asyncRoute(async (request, response) => {
      const query = validateBody(authorityWorkspaceQuerySchema, request.query)
      const result = await createEditPlanningAuthorityService(getServiceContext(request)).getCanonicalPlan(
        getRouteParam(request, 'editPlanId'),
        query.workspaceId,
      )
      sendOk(response, { authority: result.authority }, result.warnings)
    }),
  )

  router.get(
    '/v1/approved-snapshots/:snapshotId/authority',
    requireAuth,
    asyncRoute(async (request, response) => {
      const query = validateBody(authorityWorkspaceQuerySchema, request.query)
      const result = await createEditPlanningAuthorityService(getServiceContext(request)).getApprovedSnapshot(
        getRouteParam(request, 'snapshotId'),
        query.workspaceId,
      )
      sendOk(response, { authority: result.authority }, result.warnings)
    }),
  )

  return router
}
