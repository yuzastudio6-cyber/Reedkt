import { ApiError } from '../errors/api-error'
import type { ServiceContext } from '../types'
import { evaluateProductionToolExecutionReadinessGate } from './production-tool-execution-readiness-gate'
import type { ProductionToolExecutionReadinessGateInput } from './production-tool-execution-readiness-gate'
import {
  listMockProductionToolExecutionReadinessEvidencePackets,
  listPersistentProductionToolExecutionReadinessEvidencePackets,
  recordMockProductionToolExecutionReadinessEvidencePacket,
  recordPersistentProductionToolExecutionReadinessEvidencePacket,
} from './production-tool-execution-readiness-evidence-store'

export function createProductionToolExecutionReadinessEvidenceService(context: ServiceContext) {
  return {
    async listEvidence(workspaceId: string) {
      const packets = await listPackets(context, workspaceId)
      return {
        packets,
        latestReport: packets.at(-1)?.readinessReport,
        evidencePacketCount: packets.length,
        warnings: context.clients.admin && !context.env.mockOnly
          ? ['Persistent Supabase-backed production readiness evidence packets.']
          : ['Mock in-memory production readiness evidence only; no Supabase write or production activation occurred.'],
      }
    },

    async recordEvidence(input: ProductionToolExecutionReadinessGateInput, idempotencyKey: string) {
      let report
      try {
        report = evaluateProductionToolExecutionReadinessGate(input)
      } catch (error) {
        if (error instanceof ApiError) throw error
        if (error instanceof Error) {
          throw new ApiError('VALIDATION_FAILED', error.message, 400)
        }
        throw error
      }

      if (!report.productionToolExecutionAllowed) {
        throw new ApiError(
          'VALIDATION_FAILED',
          'Production readiness evidence cannot be recorded until the paid-production gate passes.',
          400,
          { blockers: report.blockers },
        )
      }

      const stored = context.clients.admin && !context.env.mockOnly
        ? await recordPersistentProductionToolExecutionReadinessEvidencePacket(
          context.clients.admin,
          idempotencyKey,
          { readinessInput: input, readinessReport: report },
          context.auth?.userId,
        )
        : recordMockProductionToolExecutionReadinessEvidencePacket(
          idempotencyKey,
          { readinessInput: input, readinessReport: report },
          context.auth?.userId,
        )

      return {
        packet: stored.packet,
        replayed: stored.replayed,
        report,
        warnings: context.clients.admin && !context.env.mockOnly
          ? [
            'Persistent production readiness evidence recorded through the backend service-role path.',
            stored.replayed
              ? 'Idempotent replay returned the original production readiness evidence packet.'
              : 'Production readiness evidence packet recorded once for this idempotency key.',
            'Recording evidence does not deploy, run tools, call Stripe, mutate wallets, or enable production by itself.',
          ]
          : [
            'Mock in-memory production readiness evidence only; no Supabase write or production activation occurred.',
            stored.replayed
              ? 'Idempotent replay returned the original production readiness evidence packet.'
              : 'Production readiness evidence packet recorded once for this idempotency key.',
          ],
      }
    },
  }
}

async function listPackets(context: ServiceContext, workspaceId: string) {
  if (context.clients.admin && !context.env.mockOnly) {
    return listPersistentProductionToolExecutionReadinessEvidencePackets(context.clients.admin, workspaceId)
  }
  return listMockProductionToolExecutionReadinessEvidencePackets(workspaceId)
}
