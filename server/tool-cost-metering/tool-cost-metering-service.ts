import { ApiError } from '../errors/api-error'
import type { ServiceContext } from '../types'
import { estimateToolCost, emitToolCostEvent } from './cost-math'
import { buildMockToolCostSummary, recordMockToolCostEvent } from './mock-tool-cost-store'
import type { ToolCostEstimateInput, ToolCostEventInput } from './types'

export function createToolCostMeteringService(context: ServiceContext) {
  return {
    estimateToolCost(input: ToolCostEstimateInput) {
      return {
        estimate: estimateToolCost(input),
        warnings: ['Tool cost estimate excludes ReEditPro service/edit fees.'],
      }
    },

    emitToolCostEvent(input: ToolCostEventInput, idempotencyKey: string) {
      const event = emitToolCostEvent(input)

      if (context.clients.admin && !context.env.mockOnly) {
        throw new ApiError(
          'TOOL_COST_BACKEND_REQUIRED',
          'Tool cost event persistence requires the production metering table/RPC before live billing can be enabled.',
          409,
          { rateCardVersion: event.rateCardVersion },
        )
      }

      const stored = recordMockToolCostEvent(idempotencyKey, event)
      return {
        event: stored.event,
        replayed: stored.replayed,
        warnings: [
          'Mock in-memory tool cost event only; no Supabase, Stripe, wallet, or ledger mutation occurred.',
          stored.replayed ? 'Idempotent replay returned the original tool cost event.' : 'Tool cost event recorded once for this idempotency key.',
        ],
      }
    },

    getToolCostSummary(input: { workspaceId: string; projectId: string }) {
      if (context.clients.admin && !context.env.mockOnly) {
        throw new ApiError(
          'TOOL_COST_BACKEND_REQUIRED',
          'Tool cost summary requires production metering persistence before live billing can be enabled.',
          409,
        )
      }

      return {
        summary: buildMockToolCostSummary(input.workspaceId, input.projectId),
        warnings: ['Mock in-memory summary only; final user charge is not calculated here.'],
      }
    },
  }
}
