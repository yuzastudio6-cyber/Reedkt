import type { ServiceContext } from '../types'
import { ApiError } from '../errors/api-error'
import { createMockId, mockWarning, nowIso, throwOnSupabaseError } from './service-helpers'

interface ReserveCreditsInput {
  workspaceId: string
  projectId?: string
  editPlanId?: string
  creditEstimateId: string
  creditWalletId?: string
  creditApprovalId?: string
  reservedCredits?: number
  expiresAt?: string
  idempotencyKey?: string
  metadata?: Record<string, unknown>
}

const mockCreditReservationsByIdempotencyKey = new Map<string, unknown>()

export function createCreditGateService(context: ServiceContext) {
  return {
    async approveCreditEstimate(input: { workspaceId: string; creditEstimateId: string }) {
      if (!context.clients.admin || context.env.mockOnly) {
        return {
          creditApproval: {
            id: createMockId('credit_approval'),
            workspaceId: input.workspaceId,
            creditEstimateId: input.creditEstimateId,
            status: 'approved',
            approvedByUserId: context.auth?.userId,
            createdAt: nowIso(),
            mockOnly: true,
          },
          warnings: [mockWarning('Credit estimate approval')],
        }
      }

      // TODO: use transaction/RPC to approve exact estimate version and audit approver.
      const { data, error } = await context.clients.admin
        .from('credit_approvals')
        .insert({
          workspace_id: input.workspaceId,
          credit_estimate_id: input.creditEstimateId,
          approved_by_user_id: context.auth?.userId,
          status: 'approved',
        })
        .select('*')
        .single()

      throwOnSupabaseError(error, 'CREDIT_ESTIMATE_NOT_APPROVED')
      return { creditApproval: data, warnings: [] }
    },

    async reserveCredits(input: ReserveCreditsInput) {
      const idempotencyKey = input.idempotencyKey
      const reservedCredits = Math.max(0, Math.floor(input.reservedCredits ?? 0))

      if (!context.clients.admin || context.env.mockOnly) {
        const replayKey = idempotencyKey ? `${input.workspaceId}:${idempotencyKey}` : undefined
        const existing = replayKey ? mockCreditReservationsByIdempotencyKey.get(replayKey) : undefined
        if (existing) {
          return {
            creditReservation: existing,
            warnings: [mockWarning('Credit reservation'), 'Mock credit reservation replayed idempotently; no duplicate reservation was created.'],
            replayed: true,
          }
        }

        const creditReservation = {
          id: createMockId('credit_reservation'),
          workspaceId: input.workspaceId,
          projectId: input.projectId,
          editPlanId: input.editPlanId,
          creditEstimateId: input.creditEstimateId,
          creditWalletId: input.creditWalletId,
          creditApprovalId: input.creditApprovalId,
          reservedCredits,
          status: 'reserved',
          idempotencyKey,
          expiresAt: input.expiresAt,
          createdAt: nowIso(),
          mockOnly: true,
        }

        if (replayKey) mockCreditReservationsByIdempotencyKey.set(replayKey, creditReservation)

        return {
          creditReservation,
          warnings: [mockWarning('Credit reservation'), 'Reservation skeleton does not spend credits or call Stripe.'],
          replayed: false,
        }
      }

      const missingPersistentFields = [
        input.projectId ? undefined : 'projectId',
        input.creditWalletId ? undefined : 'creditWalletId',
        input.creditApprovalId ? undefined : 'creditApprovalId',
        reservedCredits > 0 ? undefined : 'reservedCredits',
        idempotencyKey ? undefined : 'idempotencyKey',
      ].filter((value): value is string => Boolean(value))

      if (missingPersistentFields.length > 0) {
        throw new ApiError(
          'CREDITS_NOT_RESERVED',
          `Persistent credit reservation requires ${missingPersistentFields.join(', ')} before a wallet hold can be recorded.`,
          409,
          { missingPersistentFields },
        )
      }

      const { data: existing, error: selectError } = await context.clients.admin
        .from('credit_reservations')
        .select('*')
        .eq('idempotency_key', idempotencyKey)
        .maybeSingle()

      throwOnSupabaseError(selectError, 'CREDITS_NOT_RESERVED')

      if (existing) {
        return { creditReservation: existing, warnings: ['Persistent credit reservation replayed idempotently through the service-role path.'], replayed: true }
      }

      const { data, error } = await context.clients.admin
        .from('credit_reservations')
        .insert({
          credit_wallet_id: input.creditWalletId,
          workspace_id: input.workspaceId,
          project_id: input.projectId,
          credit_approval_id: input.creditApprovalId,
          edit_plan_id: input.editPlanId ?? null,
          credit_estimate_id: input.creditEstimateId,
          reserved_credits: reservedCredits,
          status: 'reserved',
          idempotency_key: idempotencyKey,
          reserved_at: nowIso(),
          expires_at: input.expiresAt ?? null,
          metadata: {
            ...(input.metadata ?? {}),
            credit_reservation_service: true,
            stripe_call_attempted: false,
            service_fee_included: false,
          },
        })
        .select('*')
        .single()

      throwOnSupabaseError(error, 'CREDITS_NOT_RESERVED')
      return { creditReservation: data, warnings: [], replayed: false }
    },

    async getCreditBalance(workspaceId: string) {
      if (!context.clients.admin || context.env.mockOnly) {
        return {
          creditBalance: {
            workspaceId,
            availableCredits: 0,
            reservedCredits: 0,
            mockOnly: true,
          },
          warnings: [mockWarning('Credit balance read')],
        }
      }

      const { data, error } = await context.clients.admin
        .from('credit_wallet_balance_view')
        .select('*')
        .eq('workspace_id', workspaceId)
        .maybeSingle()

      throwOnSupabaseError(error)
      return { creditBalance: data ?? { workspace_id: workspaceId, available_credits: 0 }, warnings: [] }
    },
  }
}
