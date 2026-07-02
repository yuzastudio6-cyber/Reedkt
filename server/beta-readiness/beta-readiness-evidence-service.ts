import type { ServiceContext } from '../types'
import { buildBetaReadinessReport } from './beta-readiness-report-builder'
import {
  listMockBetaReadinessEvidencePackets,
  listPersistentBetaReadinessEvidencePackets,
  mergeBetaReadinessEvidencePackets,
  recordMockBetaReadinessEvidencePacket,
  recordPersistentBetaReadinessEvidencePacket,
  type BetaReadinessEvidencePacketInput,
} from './beta-readiness-evidence-store'

export function createBetaReadinessEvidenceService(context: ServiceContext) {
  return {
    async getReport(workspaceId: string) {
      const packets = await listPackets(context, workspaceId)
      return {
        report: buildBetaReadinessReport(mergeBetaReadinessEvidencePackets(packets)),
        evidencePacketCount: packets.length,
        warnings: context.clients.admin && !context.env.mockOnly
          ? ['Persistent Supabase-backed beta readiness evidence report.']
          : ['Mock in-memory beta readiness evidence only; no Supabase write or live beta activation occurred.'],
      }
    },

    async listEvidence(workspaceId: string) {
      const packets = await listPackets(context, workspaceId)
      return {
        packets,
        mergedEvidence: mergeBetaReadinessEvidencePackets(packets),
        report: buildBetaReadinessReport(mergeBetaReadinessEvidencePackets(packets)),
        warnings: context.clients.admin && !context.env.mockOnly
          ? ['Persistent Supabase-backed beta readiness evidence packets.']
          : ['Mock in-memory beta readiness evidence only; no Supabase write or live beta activation occurred.'],
      }
    },

    async recordEvidence(input: BetaReadinessEvidencePacketInput, idempotencyKey: string) {
      const stored = context.clients.admin && !context.env.mockOnly
        ? await recordPersistentBetaReadinessEvidencePacket(context.clients.admin, idempotencyKey, input, context.auth?.userId)
        : recordMockBetaReadinessEvidencePacket(idempotencyKey, input, context.auth?.userId)
      const packets = await listPackets(context, input.workspaceId)
      return {
        packet: stored.packet,
        replayed: stored.replayed,
        report: buildBetaReadinessReport(mergeBetaReadinessEvidencePackets(packets)),
        warnings: context.clients.admin && !context.env.mockOnly
          ? [
            'Persistent beta readiness evidence recorded through the backend service-role path.',
            stored.replayed ? 'Idempotent replay returned the original beta readiness evidence packet.' : 'Beta readiness evidence packet recorded once for this idempotency key.',
          ]
          : [
            'Mock in-memory beta readiness evidence only; no Supabase write or live beta activation occurred.',
            stored.replayed ? 'Idempotent replay returned the original beta readiness evidence packet.' : 'Beta readiness evidence packet recorded once for this idempotency key.',
          ],
      }
    },
  }
}

async function listPackets(context: ServiceContext, workspaceId: string) {
  if (context.clients.admin && !context.env.mockOnly) {
    return listPersistentBetaReadinessEvidencePackets(context.clients.admin, workspaceId)
  }
  return listMockBetaReadinessEvidencePackets(workspaceId)
}
