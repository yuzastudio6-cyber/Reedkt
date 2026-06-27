import type { ServiceContext } from '../types'
import { estimateToolCost, emitToolCostEvent } from './cost-math'
import { buildMockToolCostSummary, recordMockToolCostEvent } from './mock-tool-cost-store'
import { buildPersistentToolCostSummary, recordPersistentToolCostEvent } from './tool-cost-persistent-store'
import type { ToolCostEstimateInput, ToolCostEventInput } from './types'

export function createToolCostMeteringService(context: ServiceContext) {
  return {
    estimateToolCost(input: ToolCostEstimateInput) {
      return {
        estimate: estimateToolCost(input),
        warnings: ['Tool cost estimate excludes ReEditPro service/edit fees.'],
      }
    },

    async emitToolCostEvent(input: ToolCostEventInput, idempotencyKey: string) {
      const event = emitToolCostEvent(input)

      if (context.clients.admin && !context.env.mockOnly) {
        const stored = await recordPersistentToolCostEvent(context.clients.admin, idempotencyKey, event)
        return {
          event: stored.event,
          replayed: stored.replayed,
          warnings: [
            'Persistent tool cost event recorded through the backend service-role path.',
            'ReEditPro service/edit fee is intentionally excluded from tool cost events.',
            stored.replayed ? 'Idempotent replay returned the original persistent tool cost event.' : 'Tool cost event recorded once for this idempotency key.',
          ],
        }
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

    async getToolCostSummary(input: { workspaceId: string; projectId: string }) {
      if (context.clients.admin && !context.env.mockOnly) {
        return {
          summary: await buildPersistentToolCostSummary(context.clients.admin, input.workspaceId, input.projectId),
          warnings: ['Persistent Supabase-backed tool cost summary.'],
        }
      }

      return {
        summary: buildMockToolCostSummary(input.workspaceId, input.projectId),
        warnings: ['Mock in-memory summary only; final user charge is not calculated here.'],
      }
    },
  }
}
