import { ApiError } from '../errors/api-error'
import { estimateProductionToolCost, type ProductionToolCostEstimate } from '../tool-cost-metering'
import type { ExternalProviderCostInput } from '../tool-cost-metering/types'
import type { ProductionToolId } from '../tool-registry'
import type { ServiceContext } from '../types'
import { createMockId, mockWarning, nowIso, throwOnSupabaseError } from './service-helpers'
import type { ReEditProModelRoleId, ReEditProRequestedModelUse } from '../../src/types'
import { validateReEditProModelRoleUse } from '../../src/lib/model-role-routing-contract'
import { findReEditProReasoningModelRoute } from '../../src/lib/reasoning-model-routing-contract'
import {
  calculateReasoningModelInternalCost,
  type ReasoningModelFxSnapshot,
  type ReasoningModelInternalCostCalculation,
  type ReasoningModelTokenUsage,
} from '../reasoning-model-cost'

export interface ProviderWebhookEventSummary {
  provider: string
  eventId: string
  eventType?: string
  eventStatus?: string
  occurredAt?: string
  providerCreatedAt?: string
  providerUpdatedAt?: string
  receivedAt: string
}

export function assertRealProviderCallsDisabled(): void {
  throw new ApiError('REAL_PROVIDER_CALLS_DISABLED', 'Real provider calls are disabled in the RP-E2E backend runtime skeleton.', 403)
}

export function assertProviderWebhookRuntimeDisabled(): never {
  throw new ApiError(
    'REAL_PROVIDER_CALLS_DISABLED',
    'Provider webhooks are blocked until signature verification, replay protection, and stored provider-attempt lineage are deployed.',
    503,
    {
      requiredGates: [
        'provider_signature_verification',
        'provider_event_replay_protection',
        'stored_provider_attempt_lineage',
        'server_derived_tenant_scope',
      ],
    },
  )
}

export function createProviderGatewayService(context: ServiceContext) {
  return {
    async createProviderRequestAttempt(input: {
      workspaceId: string
      projectId?: string
      providerRoute: string
      providerModel?: string
      modelRoleId?: ReEditProModelRoleId
      requestedModelUse?: ReEditProRequestedModelUse
      generationRequestId?: string
      jobId?: string
      approvedPlanSnapshotId?: string
      creditEstimateId?: string
      creditReservationId?: string
      toolId?: ProductionToolId
      approvedReservationRemainingCredits?: number
      providerUsage?: ExternalProviderCostInput
      reasoningModelUsageEstimate?: ReasoningModelTokenUsage
      reasoningModelFxSnapshot?: ReasoningModelFxSnapshot
      requestPayloadHash: string
      mockOnly?: boolean
    }) {
      const modelRoleValidation = validateReEditProModelRoleUse({
        modelRoleId: input.modelRoleId,
        providerRoute: input.providerRoute,
        providerModel: input.providerModel,
        requestedUse: input.requestedModelUse,
      })

      if (modelRoleValidation.blocked) {
        throw new ApiError('PROVIDER_MODEL_ROLE_FORBIDDEN', 'Provider model role is not allowed for the requested use.', 403, modelRoleValidation)
      }

      if (!input.mockOnly) {
        if (context.clients.admin && !context.env.mockOnly) {
          await recordBlockedAttempt(context, input)
        }
        assertRealProviderCallsDisabled()
      }

      const adminClient = context.clients.admin
      if (!adminClient || context.env.mockOnly) {
        const toolCostEstimate = buildProviderToolCostEstimate(input)
        const reasoningModelInternalCostEstimate = buildReasoningModelInternalCostEstimate(input)
        return {
          providerRequestAttempt: {
            id: createMockId('provider_attempt'),
            workspaceId: input.workspaceId,
            projectId: input.projectId,
            providerRoute: input.providerRoute,
            providerModel: input.providerModel,
            modelRoleId: input.modelRoleId ?? modelRoleValidation.resolvedModelRoleId,
            modelRoleProviderBoundary: modelRoleValidation.resolvedProviderBoundary,
            canonicalProviderModel: modelRoleValidation.resolvedCanonicalProviderModel,
            requestedModelUse: input.requestedModelUse,
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
          reasoningModelInternalCostEstimate,
          reasoningModelAttemptCostEvidenceCreated: false as const,
          warnings: [
            mockWarning('Provider gateway attempt'),
            ...modelRoleValidation.warnings,
            'No OpenAI, Kimi, Qwen, DeepSeek, Wan, Hailuo, Veo, Lyria, Mirelo, or MMAudio call was made.',
          ],
        }
      }

      const { data, error } = await adminClient
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
      // Never persist caller-selected tenant IDs. Future webhook handling must
      // verify the provider signature first, then derive workspace/project/job
      // lineage from an existing provider attempt stored by the backend.
      void input
      assertProviderWebhookRuntimeDisabled()
    },
  }
}

function buildReasoningModelInternalCostEstimate(input: {
  providerRoute: string
  providerModel?: string
  modelRoleId?: ReEditProModelRoleId
  reasoningModelUsageEstimate?: ReasoningModelTokenUsage
  reasoningModelFxSnapshot?: ReasoningModelFxSnapshot
}): ReasoningModelInternalCostCalculation | undefined {
  if (!input.reasoningModelUsageEstimate) return undefined
  const route = findReEditProReasoningModelRoute({
    modelRoleId: input.modelRoleId,
    providerBoundary: input.providerRoute,
    providerModel: input.providerModel,
  })
  if (!route) {
    throw new ApiError(
      'VALIDATION_FAILED',
      'Reasoning-model usage was supplied for a non-reasoning provider route.',
      400,
    )
  }
  const result = calculateReasoningModelInternalCost({
    routeId: route.routeId,
    usage: input.reasoningModelUsageEstimate,
    fxSnapshot: input.reasoningModelFxSnapshot,
  })
  if (!result.ok) {
    throw new ApiError(
      'VALIDATION_FAILED',
      `Reasoning-model internal cost estimate failed: ${result.error.message}`,
      400,
      result.error,
    )
  }
  return result.data
}

export function buildProviderWebhookEventSummary(input: {
  providerRoute: string
  providerEventId: string
  receivedAt: string
  payload?: Record<string, unknown>
}): ProviderWebhookEventSummary {
  const provider = requireSafeProviderIdentifier(input.providerRoute, 'provider route', 80)
  const eventId = requireSafeProviderIdentifier(input.providerEventId, 'provider event ID', 256)
  const payload = input.payload ?? {}

  const eventType = readSafeEventLabel(payload, ['eventType', 'event_type', 'eventName', 'event_name', 'type'])
  const eventStatus = readSafeEventLabel(payload, ['eventStatus', 'event_status', 'status', 'state'])
  const occurredAt = readSafeTimestamp(payload, ['occurredAt', 'occurred_at', 'timestamp'])
  const providerCreatedAt = readSafeTimestamp(payload, ['createdAt', 'created_at'])
  const providerUpdatedAt = readSafeTimestamp(payload, ['updatedAt', 'updated_at'])

  return {
    provider,
    eventId,
    ...(eventType ? { eventType } : {}),
    ...(eventStatus ? { eventStatus } : {}),
    ...(occurredAt ? { occurredAt } : {}),
    ...(providerCreatedAt ? { providerCreatedAt } : {}),
    ...(providerUpdatedAt ? { providerUpdatedAt } : {}),
    receivedAt: normalizeTimestamp(input.receivedAt) ?? nowIso(),
  }
}

function buildProviderToolCostEstimate(input: {
  workspaceId: string
  projectId?: string
  providerRoute: string
  providerModel?: string
  approvedPlanSnapshotId?: string
  creditEstimateId?: string
  creditReservationId?: string
  toolId?: ProductionToolId
  approvedReservationRemainingCredits?: number
  providerUsage?: ExternalProviderCostInput
}): ProductionToolCostEstimate | undefined {
  if (!input.toolId) return undefined
  const providerUsage = normalizeProviderUsage(input.providerUsage, input)
  const estimate = estimateProductionToolCost({
    toolId: input.toolId,
    workspaceId: input.workspaceId,
    projectId: input.projectId ?? 'project-provider-gateway-mock',
    approvedPlanSnapshotId: input.approvedPlanSnapshotId,
    creditEstimateId: input.creditEstimateId,
    creditReservationId: input.creditReservationId,
    productEditLevel: 'normal',
    usage: providerUsage
      ? {
          sourceKind: 'external_provider',
          provider: providerUsage,
        }
      : undefined,
    approvedReservationRemainingCredits: input.approvedReservationRemainingCredits,
    idempotencyKey: `provider-gateway:${input.toolId}`,
    estimateOnlyWhenBlocked: true,
  })

  return estimate.ok ? estimate.data : undefined
}

function normalizeProviderUsage(
  providerUsage: ExternalProviderCostInput | undefined,
  input: {
    providerRoute?: string
    providerModel?: string
  },
): ExternalProviderCostInput | undefined {
  if (!providerUsage) return undefined
  return {
    ...providerUsage,
    provider: providerUsage.provider ?? input.providerRoute ?? null,
    model: providerUsage.model ?? input.providerModel ?? null,
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

function requireSafeProviderIdentifier(value: string, label: string, maxLength: number): string {
  const trimmed = value.trim()
  if (!trimmed || trimmed.length > maxLength || !/^[A-Za-z0-9][A-Za-z0-9_.:/-]*$/.test(trimmed)) {
    throw new ApiError('VALIDATION_FAILED', `A safe ${label} is required.`, 400)
  }
  return trimmed
}

function readSafeEventLabel(source: Record<string, unknown>, keys: string[]): string | undefined {
  for (const key of keys) {
    const value = source[key]
    if (typeof value !== 'string') continue
    const trimmed = value.trim()
    if (trimmed && trimmed.length <= 128 && /^[A-Za-z0-9][A-Za-z0-9_.:-]*$/.test(trimmed)) {
      return trimmed
    }
  }
  return undefined
}

function readSafeTimestamp(source: Record<string, unknown>, keys: string[]): string | undefined {
  for (const key of keys) {
    const normalized = normalizeTimestamp(source[key])
    if (normalized) return normalized
  }
  return undefined
}

function normalizeTimestamp(value: unknown): string | undefined {
  if (typeof value !== 'string' && typeof value !== 'number') return undefined
  const timestamp = typeof value === 'number'
    ? (value < 10_000_000_000 ? value * 1_000 : value)
    : Date.parse(value)
  if (!Number.isFinite(timestamp)) return undefined
  try {
    return new Date(timestamp).toISOString()
  } catch {
    return undefined
  }
}
