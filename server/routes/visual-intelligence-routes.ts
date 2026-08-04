import { Router } from 'express'

import {
  VISUAL_INTELLIGENCE_AUTHENTICATED_READ_ROUTE,
  VISUAL_INTELLIGENCE_EXECUTION_ROUTE,
  VISUAL_INTELLIGENCE_INSPECTION_ROUTE,
  VISUAL_INTELLIGENCE_PLANNING_OPERATION_ROUTE,
} from '../../src/types/visual-intelligence'
import { ApiError } from '../errors/api-error'
import { requireAuth } from '../middleware/auth'
import { requireIdempotency } from '../middleware/idempotency'
import { requireStrictInternalServiceAuth } from
  '../middleware/internal-service-auth'
import {
  createVisualIntelligenceAuthenticatedReadService,
  parseVisualIntelligenceAuthenticatedReadRequest,
} from '../visual-intelligence/visual-intelligence-authenticated-read-service'
import {
  parseVisualIntelligenceRequest,
  parseVisualIntelligencePlanningOperationInput,
  parseVisualInspectionRequirement,
} from '../visual-intelligence/visual-intelligence-contract'
import {
  getVisualIntelligenceSkillDefinitionForRequest,
} from '../visual-intelligence/visual-intelligence-skill-registry'
import {
  asyncRoute,
  getIdempotencyKey,
  getRouteParam,
  getServiceContext,
  sendOk,
} from './route-helpers'

/**
 * Provider-neutral Visual Intelligence boundary. Planning and editing systems
 * call this capability; they never call Gemini (or a historical Qwen route)
 * directly. Execution remains internal-service-only and every supplied request
 * must already have a durable canonical owner admission.
 */
export function createVisualIntelligenceRoutes(): Router {
  const router = Router()

  router.post(
    VISUAL_INTELLIGENCE_PLANNING_OPERATION_ROUTE,
    requireAuth,
    requireStrictInternalServiceAuth,
    requireIdempotency,
    asyncRoute(async (request, response) => {
      const body = parseVisualIntelligencePlanningOperationInput(
        request.body,
      )
      const context = getServiceContext(request)
      assertAuthenticatedScope({
        routeWorkspaceId: getRouteParam(request, 'workspaceId'),
        ownerUserId: body.scope.ownerUserId,
        workspaceId: body.scope.workspaceId,
        authenticatedOwnerUserId: context.auth?.userId,
      })
      if (getIdempotencyKey(request) !== body.idempotencyKey) {
        throw new ApiError(
          'IDEMPOTENCY_KEY_MISMATCH',
          'Visual Intelligence planning operation must use the exact canonical idempotency key.',
          409,
        )
      }
      const owner =
        context.visualIntelligencePlanningOperationRequestOwnerPort
      const lifecycle = context.visualIntelligenceLifecyclePort
      if (!owner || !lifecycle) throw new ApiError(
        'TOOL_NOT_READY',
        'The canonical Visual Intelligence planning-operation owner is not released in this runtime.',
        503,
        {
          requiredGate:
            'visual_intelligence_planning_operation_owner_release',
        },
      )
      const admittedRequest = await owner
        .preparePlanningOperationRequest(body)
      getVisualIntelligenceSkillDefinitionForRequest(admittedRequest)
      const execution = await lifecycle.execute(admittedRequest)
      sendOk(response, { execution }, [
        execution.status === 'cache_replay'
          ? 'The exact bounded Visual Intelligence operation was reread without another provider call or cost settlement.'
          : 'The bounded provider-neutral Visual Intelligence operation completed through Gemini Pro High. It cannot edit, render, approve, export, or deliver the project.',
      ])
    }),
  )

  router.post(
    VISUAL_INTELLIGENCE_EXECUTION_ROUTE,
    requireAuth,
    requireStrictInternalServiceAuth,
    requireIdempotency,
    asyncRoute(async (request, response) => {
      const body = parseVisualIntelligenceRequest(request.body)
      getVisualIntelligenceSkillDefinitionForRequest(body)
      const context = getServiceContext(request)
      assertAuthenticatedScope({
        routeWorkspaceId: getRouteParam(request, 'workspaceId'),
        ownerUserId: body.scope.ownerUserId,
        workspaceId: body.scope.workspaceId,
        authenticatedOwnerUserId: context.auth?.userId,
      })
      if (getIdempotencyKey(request) !== body.idempotencyKey) {
        throw new ApiError(
          'IDEMPOTENCY_KEY_MISMATCH',
          'Visual Intelligence execution must use the exact canonical request idempotency key.',
          409,
        )
      }
      const lifecycle = context.visualIntelligenceLifecyclePort
      if (!lifecycle) throw new ApiError(
        'TOOL_NOT_READY',
        'The provider-neutral Visual Intelligence lifecycle is not released in this runtime.',
        503,
        { requiredGate: 'visual_intelligence_lifecycle_runtime_release' },
      )
      const execution = await lifecycle.execute(body)
      sendOk(response, { execution }, [
        execution.status === 'cache_replay'
          ? 'The immutable Visual Intelligence report was reread without another model call or cost settlement.'
          : 'The exact admitted Visual Intelligence request completed through Gemini Pro High and was persisted privately. This result does not mutate the edit or grant QA, export, delivery, or production authority.',
      ])
    }),
  )

  router.post(
    VISUAL_INTELLIGENCE_INSPECTION_ROUTE,
    requireAuth,
    requireStrictInternalServiceAuth,
    requireIdempotency,
    asyncRoute(async (request, response) => {
      const body = parseInspectionExecutionEnvelope(request.body)
      const context = getServiceContext(request)
      assertAuthenticatedScope({
        routeWorkspaceId: getRouteParam(request, 'workspaceId'),
        ownerUserId: body.scope.ownerUserId,
        workspaceId: body.scope.workspaceId,
        authenticatedOwnerUserId: context.auth?.userId,
      })
      const expectedIdempotencyKey =
        `vi-inspection-${body.requirement.inspectionDigestSha256.slice(7, 55)}`
      if (getIdempotencyKey(request) !== expectedIdempotencyKey) {
        throw new ApiError(
          'IDEMPOTENCY_KEY_MISMATCH',
          'Visual Intelligence inspection must use the exact requirement-derived idempotency key.',
          409,
        )
      }
      const coordinator =
        context.visualIntelligenceInspectionCoordinatorPort
      if (!coordinator) throw new ApiError(
        'TOOL_NOT_READY',
        'The approved-edit Visual Intelligence inspection owner is not released in this runtime.',
        503,
        {
          requiredGate:
            'visual_intelligence_approved_inspection_owner_release',
        },
      )
      const inspection = await coordinator.inspect(
        body.requirement,
        body.scope,
      )
      sendOk(response, { inspection }, [
        'The canonical approved preview was inspected through Gemini Pro High. Findings route back to the owning skill; this endpoint cannot edit the timeline, approve QA, export, deliver, or grant production authority.',
      ])
    }),
  )

  router.post(
    VISUAL_INTELLIGENCE_AUTHENTICATED_READ_ROUTE,
    requireAuth,
    asyncRoute(async (request, response) => {
      const body = parseVisualIntelligenceAuthenticatedReadRequest(
        request.body,
      )
      const context = getServiceContext(request)
      assertAuthenticatedScope({
        routeWorkspaceId: getRouteParam(request, 'workspaceId'),
        ownerUserId: body.scope.ownerUserId,
        workspaceId: body.scope.workspaceId,
        authenticatedOwnerUserId: context.auth?.userId,
      })
      if (!context.visualIntelligenceReportRepository) {
        throw new ApiError(
          'TOOL_NOT_READY',
          'The immutable Visual Intelligence report repository is not released in this runtime.',
          503,
          { requiredGate: 'visual_intelligence_report_repository_release' },
        )
      }
      const authenticatedRead = await
        createVisualIntelligenceAuthenticatedReadService({
          reportRepository: context.visualIntelligenceReportRepository,
        }).read({
          authenticatedOwnerUserId: context.auth!.userId,
          request: body,
        })
      sendOk(response, { authenticatedRead }, [
        authenticatedRead.disposition === 'completed'
          ? 'The server reread the exact immutable Visual Intelligence report. Browser-local state cannot promote completion or authority.'
          : 'No exact immutable Visual Intelligence report was found for this request. Historical Qwen evidence is not substituted.',
      ])
    }),
  )

  return router
}

function parseInspectionExecutionEnvelope(value: unknown): {
  scope: {
    ownerUserId: string
    workspaceId: string
    projectId: string
    editSessionId: string
    approvedSnapshotId: string
  }
  requirement: ReturnType<typeof parseVisualInspectionRequirement>
} {
  const body = exactRecord(value, ['scope', 'requirement'])
  const scope = exactRecord(body.scope, [
    'ownerUserId',
    'workspaceId',
    'projectId',
    'editSessionId',
    'approvedSnapshotId',
  ])
  const parsedScope = {
    ownerUserId: safeId(scope.ownerUserId),
    workspaceId: safeId(scope.workspaceId),
    projectId: safeId(scope.projectId),
    editSessionId: safeId(scope.editSessionId),
    approvedSnapshotId: safeId(scope.approvedSnapshotId),
  }
  return Object.freeze({
    scope: Object.freeze(parsedScope),
    requirement: parseVisualInspectionRequirement(body.requirement),
  })
}

function exactRecord(
  value: unknown,
  keys: readonly string[],
): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw validationFailed('Visual Intelligence inspection body must be a record.')
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
  ) throw validationFailed('Visual Intelligence inspection body is malformed.')
  return value as Record<string, unknown>
}

function safeId(value: unknown): string {
  if (
    typeof value !== 'string'
    || !/^[A-Za-z0-9][A-Za-z0-9._:-]{0,239}$/u.test(value)
    || value.includes('..')
  ) throw validationFailed('Visual Intelligence inspection scope is invalid.')
  return value
}

function validationFailed(message: string): ApiError {
  return new ApiError('VALIDATION_FAILED', message, 400)
}

function assertAuthenticatedScope(input: {
  routeWorkspaceId: string
  ownerUserId: string
  workspaceId: string
  authenticatedOwnerUserId?: string
}): void {
  if (
    !input.authenticatedOwnerUserId
    || input.authenticatedOwnerUserId !== input.ownerUserId
    || input.routeWorkspaceId !== input.workspaceId
  ) throw new ApiError(
    'WORKSPACE_ACCESS_DENIED',
    'Visual Intelligence request scope is outside the authenticated workspace.',
    403,
  )
}
