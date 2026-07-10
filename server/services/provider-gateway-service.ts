import { ApiError } from '../errors/api-error'
import { estimateToolCost } from '../tool-cost-metering'
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
      creditReservationId?: string
      requestPayloadHash: string
      mockOnly?: boolean
    }) {
      const toolCostEstimate = estimateToolCost({
        toolId: `provider:${input.providerRoute}`,
        toolName: `${input.providerRoute} provider request`,
        usageCategory: 'other',
        computeLevel: 'premium',
        providerType: 'external_api',
        providerName: input.providerRoute,
        modelName: input.providerModel ?? null,
        qualityLevel: 'premium',
        estimatedRuntimeSeconds: 60,
        providerOptions: [input.providerRoute],
        assumptions: [
          'Provider request estimate is generated before transport.',
          'Real provider calls remain disabled in this runtime skeleton.',
        ],
      })

      if (!input.mockOnly) {
        if (context.clients.admin && !context.env.mockOnly) {
          await recordBlockedAttempt(context, input)
        }
        assertRealProviderCallsDisabled()
      }

      if (!context.clients.admin || context.env.mockOnly) {
        return {
          providerRequestAttempt: {
            id: createMockId('provider_attempt'),
            workspaceId: input.workspaceId,
            projectId: input.projectId,
            providerRoute: input.providerRoute,
            providerModel: input.providerModel,
            generationRequestId: input.generationRequestId,
            jobId: input.jobId,
            approvedPlanSnapshotId: input.approvedPlanSnapshotId,
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
      return { providerRequestAttempt: data, toolCostEstimate, warnings: ['Real provider execution remains disabled.'] }
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
