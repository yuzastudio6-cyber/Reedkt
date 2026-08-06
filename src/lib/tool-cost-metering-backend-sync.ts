import type { ApiResponseEnvelope } from '../backend/api/api-runtime-contracts'
import { callReeditProApi, getFrontendApiClientStatus } from '../backend/api/frontend-api-client'

export type ToolCostMeteringContext = {
  workspaceId?: string
  projectId?: string
  userId?: string
}

export type ToolCostEstimateBackendInput = Record<string, unknown> & {
  toolId: string
  workspaceId: string
  projectId: string
  approvedPlanSnapshotId?: string | null
  creditEstimateId?: string | null
  creditReservationId?: string | null
}

export type ToolCostEventBackendInput = ToolCostEstimateBackendInput & {
  approvedPlanSnapshotId: string
  creditEstimateId: string
  creditReservationId: string
  billableToUser?: boolean
  actualCredits?: number
  toolCostCredits?: number
}

export type ToolCostEventIdempotencyKeyInput = {
  workspaceId: string
  projectId: string
  toolId: string
  jobId?: string | null
  generationRequestId?: string | null
  renderJobId?: string | null
  jobBatchId?: string | null
  approvedPlanSnapshotId?: string | null
  editPlanId?: string | null
  retryAttempt?: number | null
}

export type ToolCostEstimateBackendData = {
  estimate?: Record<string, unknown>
  rateCardVersion?: string
  serviceFeeIncluded?: boolean
  mockOnly?: boolean
}

export type ToolCostEventBackendData = {
  event?: Record<string, unknown>
  toolCostEvent?: Record<string, unknown>
  estimate?: Record<string, unknown>
  idempotencyStatus?: 'inserted' | 'duplicate_returned' | string
  serviceFeeIncluded?: boolean
  mockOnly?: boolean
}

export type ToolCostSummaryBackendData = {
  workspaceId?: string | null
  projectId?: string
  eventCount?: number
  billableEventCount?: number
  nonBillableEventCount?: number
  actualBillableCostCredits?: number
  nonBillableCredits?: number
  userFacingLines?: Array<{
    label?: string
    credits?: number
    eventCount?: number
  }>
  events?: Array<Record<string, unknown>>
  serviceFeeIncluded?: boolean
  mockOnly?: boolean
}

export type ToolCostBackendCallResult<TData> = {
  ok: boolean
  response: ApiResponseEnvelope<TData>
  data?: TData
  warnings: string[]
  mockOnly: boolean
  clientStatus: ReturnType<typeof getFrontendApiClientStatus>
}

export async function estimateToolCostWithBackend(
  input: ToolCostEstimateBackendInput,
  context: ToolCostMeteringContext = {},
): Promise<ToolCostBackendCallResult<ToolCostEstimateBackendData>> {
  const response = await callReeditProApi<ToolCostEstimateBackendInput, ToolCostEstimateBackendData>(
    'credits.toolCost.estimate',
    input,
    {
      context: buildToolCostContext(input, context),
      idempotencyKey: buildToolCostEstimateIdempotencyKey(input),
    },
  )

  return createToolCostBackendCallResult(response)
}

export async function emitToolCostEventWithBackend(
  input: ToolCostEventBackendInput,
  idempotencyKey: string,
  context: ToolCostMeteringContext = {},
): Promise<ToolCostBackendCallResult<ToolCostEventBackendData>> {
  const response = await callReeditProApi<ToolCostEventBackendInput, ToolCostEventBackendData>(
    'credits.toolCost.event.create',
    input,
    {
      context: buildToolCostContext(input, context),
      idempotencyKey,
    },
  )

  return createToolCostBackendCallResult(response)
}

export async function fetchProjectToolCostSummaryFromBackend(
  projectId: string,
  context: ToolCostMeteringContext = {},
): Promise<ToolCostBackendCallResult<ToolCostSummaryBackendData>> {
  const response = await callReeditProApi<undefined, ToolCostSummaryBackendData>(
    'credits.toolCost.summary.get',
    undefined,
    {
      params: { projectId },
      ...(context.workspaceId ? { query: { workspaceId: context.workspaceId } } : {}),
      context: {
        ...context,
        projectId,
      },
    },
  )

  return createToolCostBackendCallResult(response)
}

export function buildToolCostEventBackendIdempotencyKey(input: ToolCostEventIdempotencyKeyInput): string {
  const workIdentity = resolveToolCostEventWorkIdentity(input)
  const retryAttempt = Math.max(0, Math.trunc(input.retryAttempt ?? 0))
  return [
    'tool-cost-event',
    safeToolCostKeyPart(input.workspaceId),
    safeToolCostKeyPart(input.projectId),
    workIdentity.kind,
    safeToolCostKeyPart(workIdentity.id),
    safeToolCostKeyPart(input.toolId),
    `retry-${retryAttempt}`,
  ].join(':').slice(0, 220)
}

function createToolCostBackendCallResult<TData>(
  response: ApiResponseEnvelope<TData>,
): ToolCostBackendCallResult<TData> {
  return {
    ok: response.ok,
    response,
    data: response.data,
    warnings: response.warnings,
    mockOnly: response.mockOnly,
    clientStatus: getFrontendApiClientStatus(),
  }
}

function buildToolCostContext(
  input: Pick<ToolCostEstimateBackendInput, 'workspaceId' | 'projectId'>,
  context: ToolCostMeteringContext,
): ToolCostMeteringContext {
  return {
    ...context,
    workspaceId: context.workspaceId ?? input.workspaceId,
    projectId: context.projectId ?? input.projectId,
  }
}

function buildToolCostEstimateIdempotencyKey(input: ToolCostEstimateBackendInput): string {
  const snapshotPart = input.approvedPlanSnapshotId?.trim() || 'no-approved-plan'
  return `tool-cost-estimate:${input.projectId}:${input.toolId}:${snapshotPart}`.slice(0, 180)
}

function resolveToolCostEventWorkIdentity(input: ToolCostEventIdempotencyKeyInput): { kind: string; id: string } {
  if (input.jobId) return { kind: 'job', id: input.jobId }
  if (input.generationRequestId) return { kind: 'generation', id: input.generationRequestId }
  if (input.renderJobId) return { kind: 'render', id: input.renderJobId }
  if (input.jobBatchId) return { kind: 'job-batch', id: input.jobBatchId }
  if (input.approvedPlanSnapshotId) return { kind: 'approved-plan', id: input.approvedPlanSnapshotId }
  if (input.editPlanId) return { kind: 'edit-plan', id: input.editPlanId }
  return { kind: 'unscoped-work', id: 'missing-work-id' }
}

function safeToolCostKeyPart(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 72) || 'missing'
}
