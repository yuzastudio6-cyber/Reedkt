import type { ServiceContext } from '../types'
import { createMockId, mockWarning, nowIso, throwOnSupabaseError } from './service-helpers'

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

    async reserveCredits(input: { workspaceId: string; projectId?: string; editPlanId?: string; creditEstimateId: string }) {
      if (!context.clients.admin || context.env.mockOnly) {
        return {
          creditReservation: {
            id: createMockId('credit_reservation'),
            workspaceId: input.workspaceId,
            projectId: input.projectId,
            editPlanId: input.editPlanId,
            creditEstimateId: input.creditEstimateId,
            status: 'reserved',
            createdAt: nowIso(),
            mockOnly: true,
          },
          warnings: [mockWarning('Credit reservation'), 'Reservation skeleton does not spend credits or call Stripe.'],
        }
      }

      // TODO: replace with transactional reservation RPC to prevent double reserve.
      const { data, error } = await context.clients.admin
        .from('credit_reservations')
        .insert({
          workspace_id: input.workspaceId,
          project_id: input.projectId ?? null,
          edit_plan_id: input.editPlanId ?? null,
          credit_estimate_id: input.creditEstimateId,
          status: 'reserved',
        })
        .select('*')
        .single()

      throwOnSupabaseError(error, 'CREDITS_NOT_RESERVED')
      return { creditReservation: data, warnings: [] }
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
