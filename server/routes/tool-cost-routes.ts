import type { NextFunction, Request, Response } from 'express'
import { Router } from 'express'

import type { JSONObject } from '../../src/types'
import { ApiError } from '../errors/api-error'
import { requireAuth } from '../middleware/auth'
import { requireIdempotency } from '../middleware/idempotency'
import { createProjectService } from '../services/project-service'
import { authorizeWorkspaceAccess } from '../services/workspace-access-service'
import {
  buildToolCostEventIdempotencyKey,
  estimateToolCost,
  emitToolCostEvent,
} from '../tool-cost-metering'
import {
  createMockToolCostStore,
  listMockToolCostEventsForProject,
} from '../tool-cost-metering/mock-tool-cost-store'
import { summarizeMockToolCostEvents } from '../tool-cost-metering/cost-math'
import type { ToolCostEventAggregation } from '../tool-cost-metering/types'
import {
  emitProductionToolCostEventRouteSchema,
  estimateProductionToolCostRouteSchema,
} from '../validation/tool-cost-schemas'
import { validateBody } from '../validation/common-schemas'
import {
  asyncRoute,
  getServiceContext,
  getIdempotencyKey,
  getRouteParam,
  sendOk,
} from './route-helpers'
import type { RuntimeRequest } from '../types'

const toolCostStore = createMockToolCostStore()

const mockWarnings = [
  'RP-TOOLCOST-01 mock-safe route; no Supabase write, wallet mutation, reservation spend/release/refund, ledger write, Stripe checkout, provider call, worker, render/export, or export unlock occurred.',
  'Tool-cost events report actual internal tool cost only; ReEditPro service fees remain outside tool-owner cost events.',
]

export function createToolCostRoutes(): Router {
  const router = Router()

  router.post('/v1/tool-costs/estimate', requireAuth, asyncRoute(async (request, response) => {
    const body = validateBody(estimateProductionToolCostRouteSchema, request.body)
    const context = getServiceContext(request)
    await authorizeWorkspaceAccess(context, body.workspaceId, 'read')
    await createProjectService(context).getProject(body.projectId, body.workspaceId)
    const result = estimateToolCost({
      ...body,
      metadata: body.metadata as JSONObject,
    })
    if (!result.ok) throw toApiError(result.error)

    sendOk(response, {
      estimate: result.data,
      rateCardVersion: result.data.rateCardVersion,
      serviceFeeIncluded: false,
      mockOnly: true,
    }, [...mockWarnings, ...result.data.warnings])
  }))

  router.post(
    '/v1/tool-costs/events',
    requireAuth,
    requireMockToolCostPersistence,
    requireToolCostEventScope,
    requireIdempotency,
    asyncRoute(async (request, response) => {
      const body = validateBody(emitProductionToolCostEventRouteSchema, request.body)
      const idempotencyKey = getIdempotencyKey(request)
      if (!hasToolCostEventWorkIdentity(body)) {
        throw new ApiError(
          'TOOL_COST_WORK_ID_REQUIRED',
          'Tool-cost event writes require a concrete job, generation, render, or job-batch identity.',
          400,
          {
            requiredAnyOf: ['jobId', 'generationRequestId', 'renderJobId', 'jobBatchId'],
            reason: 'Approved plan IDs are not specific enough to key actual tool-cost events.',
          },
        )
      }
      const expectedIdempotencyKey = buildToolCostEventIdempotencyKey({
        workspaceId: body.workspaceId,
        projectId: body.projectId,
        toolId: body.toolId,
        jobId: body.jobId,
        generationRequestId: body.generationRequestId,
        renderJobId: body.renderJobId,
        jobBatchId: body.jobBatchId,
        retryAttempt: body.retryAttempt,
      })
      if (idempotencyKey !== expectedIdempotencyKey) {
        throw new ApiError(
          'IDEMPOTENCY_KEY_MISMATCH',
          'Tool-cost event idempotency keys must use the canonical workspace/project/work/tool/retry shape.',
          400,
          {
            expectedShape: 'tool-cost-event:<workspaceId>:<projectId>:<workKind>:<workId>:<toolId>:retry-<attempt>',
          },
        )
      }
      const result = emitToolCostEvent({
        ...body,
        store: toolCostStore,
        idempotencyKey,
        metadata: body.metadata as JSONObject,
        providerResult: body.providerResult as JSONObject | undefined,
        runtime: body.runtime as JSONObject | undefined,
      })
      if (!result.ok) throw toApiError(result.error)

      sendOk(response, {
        event: result.data.event,
        toolCostEvent: result.data.event,
        estimate: result.data.estimate,
        idempotencyStatus: result.data.idempotencyStatus,
        serviceFeeIncluded: false,
        mockOnly: true,
      }, [...mockWarnings, ...result.data.warnings], result.data.idempotencyStatus === 'inserted' ? 201 : 200)
    }),
  )

  router.get(
    '/v1/projects/:projectId/tool-cost-summary',
    requireAuth,
    requireMockToolCostPersistence,
    asyncRoute(async (request, response) => {
      const projectId = getRouteParam(request, 'projectId')
      const workspaceId = getOptionalQueryParam(request, 'workspaceId')
      if (!workspaceId) {
        throw new ApiError('VALIDATION_FAILED', 'workspaceId query parameter is required.', 400)
      }
      const context = getServiceContext(request)
      await authorizeWorkspaceAccess(context, workspaceId, 'read')
      await createProjectService(context).getProject(projectId, workspaceId)
      const events = listMockToolCostEventsForProject(toolCostStore, projectId, workspaceId)
      const aggregation = summarizeMockToolCostEvents(events)

      sendOk(response, {
        projectId,
        workspaceId: workspaceId ?? null,
        eventCount: aggregation.eventCount,
        billableEventCount: aggregation.billableEventCount,
        nonBillableEventCount: aggregation.nonBillableEventCount,
        actualBillableCostCents: aggregation.actualBillableCostCents,
        actualBillableCostCredits: aggregation.actualBillableCostCredits,
        nonBillableCostCents: aggregation.nonBillableCostCents,
        nonBillableCredits: aggregation.nonBillableCredits,
        billableEventIds: aggregation.billableEventIds,
        nonBillableEventIds: aggregation.nonBillableEventIds,
        byUsageCategory: aggregation.byUsageCategory,
        userFacingLines: buildToolCostSummaryLines(aggregation),
        events,
        serviceFeeIncluded: false,
        mockOnly: true,
      }, mockWarnings)
    }),
  )

  return router
}

async function requireToolCostEventScope(
  request: Request,
  _response: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const body = validateBody(emitProductionToolCostEventRouteSchema, request.body)
    const context = getServiceContext(request)
    await authorizeWorkspaceAccess(context, body.workspaceId, 'write')
    await createProjectService(context).getProject(body.projectId, body.workspaceId)
    next()
  } catch (error) {
    next(error)
  }
}

function requireMockToolCostPersistence(request: Request, _response: Response, next: NextFunction): void {
  const runtime = (request as RuntimeRequest).runtime
  if (!runtime?.env.mockOnly) {
    next(new ApiError(
      'MOCK_ONLY',
      'Tool-cost event persistence requires a backend-owned metering table/RPC before non-mock mode can write or summarize events.',
      501,
      {
        requiredBackendGate: 'tool_cost_metering_persistence',
        noWalletMutation: true,
        noLedgerWrite: true,
        noBillingMutation: true,
      },
    ))
    return
  }
  next()
}

function toApiError(error: {
  code: string
  message: string
  status: string
  field?: string
  warnings: string[]
}): ApiError {
  const code = error.code === 'credit_prerequisite_failed'
    ? mapCreditPrerequisiteToApiCode(error.status)
    : error.code === 'unknown_tool'
      ? 'TOOL_NOT_READY'
      : 'VALIDATION_FAILED'
  const status = error.code === 'credit_prerequisite_failed' ? 409 : error.code === 'unknown_tool' ? 404 : 400
  return new ApiError(code, error.message, status, {
    toolCostErrorCode: error.code,
    toolCostStatus: error.status,
    field: error.field,
    warnings: error.warnings,
  })
}

function mapCreditPrerequisiteToApiCode(status: string): 'APPROVED_SNAPSHOT_REQUIRED' | 'CREDIT_ESTIMATE_NOT_APPROVED' | 'CREDITS_NOT_RESERVED' | 'INSUFFICIENT_CREDITS' | 'TOOL_NOT_READY' | 'VALIDATION_FAILED' {
  switch (status) {
    case 'missing_approved_plan':
      return 'APPROVED_SNAPSHOT_REQUIRED'
    case 'missing_approved_credit_estimate':
      return 'CREDIT_ESTIMATE_NOT_APPROVED'
    case 'missing_active_credit_reservation':
      return 'CREDITS_NOT_RESERVED'
    case 'requires_revised_estimate':
      return 'INSUFFICIENT_CREDITS'
    case 'production_blocked':
      return 'TOOL_NOT_READY'
    default:
      return 'VALIDATION_FAILED'
  }
}

function getOptionalQueryParam(request: Request, name: string): string | undefined {
  const value = request.query[name]
  if (typeof value === 'string' && value.trim()) return value.trim()
  return undefined
}

function hasToolCostEventWorkIdentity(input: {
  jobId?: string | null
  generationRequestId?: string | null
  renderJobId?: string | null
  jobBatchId?: string | null
}): boolean {
  return Boolean(input.jobId || input.generationRequestId || input.renderJobId || input.jobBatchId)
}

function buildToolCostSummaryLines(aggregation: ToolCostEventAggregation): Array<{
  label: string
  credits: number
  eventCount: number
}> {
  return [
    summaryLine('Transcription', aggregation, ['transcription']),
    summaryLine('Media analysis', aggregation, ['media_analysis']),
    summaryLine('Captions', aggregation, ['captions']),
    summaryLine('Stroke Motion', aggregation, ['stroke_motion']),
    summaryLine('Graphic Design', aggregation, ['graphic_design']),
    summaryLine('Real Motion', aggregation, ['real_motion']),
    summaryLine('SoundSync', aggregation, ['soundsync']),
    summaryLine('Rendering/export', aggregation, ['rendering', 'render_export']),
    summaryLine('Other tools', aggregation, ['other', 'basic_edit', 'pro_edit', 'signature_edit', 'premium_signature_edit', 'revision', 'admin']),
  ]
}

function summaryLine(
  label: string,
  aggregation: ToolCostEventAggregation,
  keys: readonly string[],
): { label: string; credits: number; eventCount: number } {
  return {
    label,
    credits: keys.reduce((sum, key) => sum + (aggregation.byUsageCategory[key]?.credits ?? 0), 0),
    eventCount: keys.reduce((sum, key) => sum + (aggregation.byUsageCategory[key]?.eventCount ?? 0), 0),
  }
}
