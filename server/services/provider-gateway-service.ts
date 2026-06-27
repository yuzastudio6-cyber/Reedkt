import { ApiError } from '../errors/api-error'
import { estimateProductionToolCost, type ProductionToolCostEstimate } from '../tool-cost-metering'
import type { ProductionToolId } from '../tool-registry'
import type { ServiceContext } from '../types'
import { createMockId, mockWarning, nowIso, sanitizeJson, throwOnSupabaseError } from './service-helpers'

export function assertRealProviderCallsDisabled(): void {
  throw new ApiError('REAL_PROVIDER_CALLS_DISABLED', 'Real provider calls are disabled in the RP-E2E backend runtime skeleton.', 403)
}

export function createProviderGatewayService(context: ServiceContext) {
  return {
    async createProviderRequestAttempt(input: {
      workspaceId: string
      projectId?: string
      providerRoute: string
      providerModel?: string
      generationRequestId?: string
      jobId?: string
      approvedPlanSnapshotId?: string
      creditEstimateId?: string
      creditReservationId?: string
      toolId?: ProductionToolId
      approvedReservationRemainingCredits?: number
      requestPayloadHash: string
      mockOnly?: boolean
    }) {
      if (!input.mockOnly) {
        if (context.clients.admin && !context.env.mockOnly) {
          await recordBlockedAttempt(context, input)
        }
        assertRealProviderCallsDisabled()
      }

      if (!context.clients.admin || context.env.mockOnly) {
        const toolCostEstimate = buildProviderToolCostEstimate(input)
        return {
          providerRequestAttempt: {
            id: createMockId('provider_attempt'),
            workspaceId: input.workspaceId,
            projectId: input.projectId,
            providerRoute: input.providerRoute,
            providerModel: input.providerModel,
            toolId: input.toolId,
            generationRequestId: input.generationRequestId,
            jobId: input.jobId,
            approvedPlanSnapshotId: input.approvedPlanSnapshotId,
            creditEstimateId: input.creditEstimateId,
            creditReservationId: input.creditReservationId,
            attemptStatus: 'blocked',
            idempotencyKey: context.requestId,
            requestPayloadHash: input.requestPayloadHash,
            normalizedErrorCode: 'REAL_PROVIDER_CALLS_DISABLED',
            normalizedErrorMessage: 'Provider request validated but not executed.',
            createdAt: nowIso(),
            updatedAt: nowIso(),
            mockOnly: true,
          },
          toolCostEstimate,
          warnings: [mockWarning('Provider gateway attempt'), 'No OpenAI, Wan, Hailuo, Veo, Lyria, Mirelo, or MMAudio call was made.'],
        }
      }

      const { data, error } = await context.clients.admin
        .from('provider_request_attempts')
        .insert({
          workspace_id: input.workspaceId,
          project_id: input.projectId ?? null,
          generation_request_id: input.generationRequestId ?? null,
          job_id: input.jobId ?? null,
          approved_plan_snapshot_id: input.approvedPlanSnapshotId ?? null,
          credit_reservation_id: input.creditReservationId ?? null,
          provider_route: input.providerRoute,
          provider_model: input.providerModel ?? null,
          attempt_status: 'blocked',
          idempotency_key: context.requestId,
          request_payload_hash: input.requestPayloadHash,
          normalized_error_code: 'REAL_PROVIDER_CALLS_DISABLED',
          normalized_error_message: 'Provider request validated but not executed.',
        })
        .select('*')
        .single()

      throwOnSupabaseError(error)
      return { providerRequestAttempt: data, warnings: ['Real provider execution remains disabled.'] }
    },

    async recordProviderWebhook(input: {
      workspaceId: string
      projectId?: string
      providerRoute: string
      providerEventId: string
      generationRequestId?: string
      jobId?: string
      eventPayloadSummaryJson?: Record<string, unknown>
    }) {
      const payloadSummary = sanitizeJson(input.eventPayloadSummaryJson ?? {})
      if (!context.clients.admin || context.env.mockOnly) {
        return {
          providerWebhookEvent: {
            id: createMockId('provider_webhook'),
            workspaceId: input.workspaceId,
            projectId: input.projectId,
            providerRoute: input.providerRoute,
            providerEventId: input.providerEventId,
            generationRequestId: input.generationRequestId,
            jobId: input.jobId,
            eventStatus: 'blocked',
            signatureVerified: false,
            receivedAt: nowIso(),
            eventPayloadSummaryJson: payloadSummary,
            createdAt: nowIso(),
            updatedAt: nowIso(),
            mockOnly: true,
          },
          warnings: ['Webhook signature verification is not implemented; generation state was not mutated.'],
        }
      }

      const { data, error } = await context.clients.admin
        .from('provider_webhook_events')
        .insert({
          workspace_id: input.workspaceId,
          project_id: input.projectId ?? null,
          provider_route: input.providerRoute,
          provider_event_id: input.providerEventId,
          generation_request_id: input.generationRequestId ?? null,
          job_id: input.jobId ?? null,
          event_status: 'blocked',
          signature_verified: false,
          event_payload_summary_json: payloadSummary,
        })
        .select('*')
        .single()

      throwOnSupabaseError(error)
      return { providerWebhookEvent: data, warnings: ['Webhook recorded as sanitized summary only; generation state was not mutated.'] }
    },
  }
}

function buildProviderToolCostEstimate(input: {
  workspaceId: string
  projectId?: string
  approvedPlanSnapshotId?: string
  creditEstimateId?: string
  creditReservationId?: string
  toolId?: ProductionToolId
  approvedReservationRemainingCredits?: number
}): ProductionToolCostEstimate | undefined {
  if (!input.toolId) return undefined
  const estimate = estimateProductionToolCost({
    toolId: input.toolId,
    workspaceId: input.workspaceId,
    projectId: input.projectId ?? 'project-provider-gateway-mock',
    approvedPlanSnapshotId: input.approvedPlanSnapshotId,
    creditEstimateId: input.creditEstimateId,
    creditReservationId: input.creditReservationId,
    productEditLevel: 'normal',
    approvedReservationRemainingCredits: input.approvedReservationRemainingCredits,
    idempotencyKey: `provider-gateway:${input.toolId}`,
    estimateOnlyWhenBlocked: true,
  })

  return estimate.ok ? estimate.data : undefined
}

async function recordBlockedAttempt(
  context: ServiceContext,
  input: {
    workspaceId: string
    projectId?: string
    providerRoute: string
    providerModel?: string
    generationRequestId?: string
    jobId?: string
    approvedPlanSnapshotId?: string
    creditReservationId?: string
    requestPayloadHash: string
  },
): Promise<void> {
  if (!context.clients.admin) return
  const { error } = await context.clients.admin.from('provider_request_attempts').insert({
    workspace_id: input.workspaceId,
    project_id: input.projectId ?? null,
    generation_request_id: input.generationRequestId ?? null,
    job_id: input.jobId ?? null,
    approved_plan_snapshot_id: input.approvedPlanSnapshotId ?? null,
    credit_reservation_id: input.creditReservationId ?? null,
    provider_route: input.providerRoute,
    provider_model: input.providerModel ?? null,
    attempt_status: 'blocked',
    idempotency_key: context.requestId,
    request_payload_hash: input.requestPayloadHash,
    normalized_error_code: 'REAL_PROVIDER_CALLS_DISABLED',
    normalized_error_message: 'Provider request blocked before transport.',
  })
  throwOnSupabaseError(error)
}
