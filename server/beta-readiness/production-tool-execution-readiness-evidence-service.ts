import { ApiError } from '../errors/api-error'
import type { ServiceContext } from '../types'
import { getRequiredAuthUserId, throwOnSupabaseError } from '../services/service-helpers'
import { evaluateProductionToolExecutionReadinessGate } from './production-tool-execution-readiness-gate'
import type { ProductionToolExecutionReadinessGateInput } from './production-tool-execution-readiness-gate'
import {
  listMockProductionToolExecutionReadinessEvidencePackets,
  listPersistentProductionToolExecutionReadinessEvidencePackets,
  type ProductionToolExecutionReadinessEvidencePacket,
  recordMockProductionToolExecutionReadinessEvidencePacket,
  recordPersistentProductionToolExecutionReadinessEvidencePacket,
} from './production-tool-execution-readiness-evidence-store'

export interface ProductionToolExecutionReadinessEvidenceServiceReadbackSummary {
  workspaceId: string
  evidencePacketCount: number
  latestEvidencePacketId?: string
  latestSourceId?: string
  latestSourceSha?: string
  latestCreatedAt?: string
  latestCreatedByUserId?: string
  latestGateStatus?: string
  latestProductionToolExecutionAllowed?: boolean
  latestPaidProductionAllowed?: boolean
  latestBlockerCount: number
  latestWarningCount: number
  durableEvidenceStored: boolean
  backendPersistenceMode: 'persistent_supabase' | 'mock_memory'
  productionActivationAttempted: false
}

export interface ProductionToolExecutionReadinessEvidenceRecordOptions {
  allowBlockedEvidencePacket?: boolean
}

export function createProductionToolExecutionReadinessEvidenceService(context: ServiceContext) {
  return {
    async listEvidence(workspaceId: string) {
      await assertWorkspaceEvidenceAccess(context, workspaceId)
      const packets = await listPackets(context, workspaceId)
      const latestPacket = packets.at(-1)
      const readinessSummary = buildReadbackSummary(
        workspaceId,
        packets,
        context.clients.admin && !context.env.mockOnly ? 'persistent_supabase' : 'mock_memory',
      )
      return {
        packets,
        latestPacket,
        latestReport: latestPacket?.readinessReport,
        readinessSummary,
        evidencePacketCount: packets.length,
        warnings: context.clients.admin && !context.env.mockOnly
          ? ['Persistent Supabase-backed production readiness evidence packets.']
          : ['Mock in-memory production readiness evidence only; no Supabase write or production activation occurred.'],
      }
    },

    async recordEvidence(
      input: ProductionToolExecutionReadinessGateInput,
      idempotencyKey: string,
      options: ProductionToolExecutionReadinessEvidenceRecordOptions = {},
    ) {
      await assertProductionEvidenceRecordAccess(context, input)
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

      const recordingBlockedAuditPacket = !report.productionToolExecutionAllowed && options.allowBlockedEvidencePacket === true
      if (!report.productionToolExecutionAllowed && !recordingBlockedAuditPacket) {
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
        recordedBlockedAuditPacket: recordingBlockedAuditPacket,
        warnings: context.clients.admin && !context.env.mockOnly
          ? [
            'Persistent production readiness evidence recorded through the backend service-role path.',
            stored.replayed
              ? 'Idempotent replay returned the original production readiness evidence packet.'
              : 'Production readiness evidence packet recorded once for this idempotency key.',
            recordingBlockedAuditPacket
              ? 'This is a blocked readiness audit packet only; it does not allow production dispatch or paid production.'
              : 'This is a passing paid-production readiness evidence packet.',
            'Recording evidence does not deploy, run tools, call Stripe, mutate wallets, or enable production by itself.',
          ]
          : [
            'Mock in-memory production readiness evidence only; no Supabase write or production activation occurred.',
            stored.replayed
              ? 'Idempotent replay returned the original production readiness evidence packet.'
              : 'Production readiness evidence packet recorded once for this idempotency key.',
            recordingBlockedAuditPacket
              ? 'This is a blocked readiness audit packet only; it does not allow production dispatch or paid production.'
              : 'This is a passing paid-production readiness evidence packet.',
          ],
      }
    },
  }
}

function buildReadbackSummary(
  workspaceId: string,
  packets: ProductionToolExecutionReadinessEvidencePacket[],
  backendPersistenceMode: ProductionToolExecutionReadinessEvidenceServiceReadbackSummary['backendPersistenceMode'],
): ProductionToolExecutionReadinessEvidenceServiceReadbackSummary {
  const latestPacket = packets.at(-1)
  const latestReport = latestPacket?.readinessReport
  return {
    workspaceId,
    evidencePacketCount: packets.length,
    latestEvidencePacketId: latestPacket?.id,
    latestSourceId: latestPacket?.sourceId,
    latestSourceSha: latestPacket?.sourceSha,
    latestCreatedAt: latestPacket?.createdAt,
    latestCreatedByUserId: latestPacket?.createdByUserId,
    latestGateStatus: latestReport?.status,
    latestProductionToolExecutionAllowed: latestReport?.productionToolExecutionAllowed,
    latestPaidProductionAllowed: latestReport?.paidProductionAllowed,
    latestBlockerCount: latestReport?.blockers.length ?? 0,
    latestWarningCount: latestReport?.warnings.length ?? 0,
    durableEvidenceStored: backendPersistenceMode === 'persistent_supabase' && packets.length > 0,
    backendPersistenceMode,
    productionActivationAttempted: false,
  }
}

async function assertWorkspaceEvidenceAccess(context: ServiceContext, workspaceId: string): Promise<void> {
  if (!context.clients.admin || context.env.mockOnly) return

  const userId = getRequiredAuthUserId(context)
  const { data: membership, error } = await context.clients.admin
    .from('workspace_members')
    .select('user_id, role')
    .eq('workspace_id', workspaceId)
    .eq('user_id', userId)
    .maybeSingle()

  throwOnSupabaseError(error, 'WORKSPACE_ACCESS_DENIED')
  if (!membership) {
    throw new ApiError('WORKSPACE_ACCESS_DENIED', 'Production readiness evidence readback requires workspace membership.', 403)
  }
}

async function assertProductionEvidenceRecordAccess(
  context: ServiceContext,
  input: ProductionToolExecutionReadinessGateInput,
): Promise<void> {
  if (!context.clients.admin || context.env.mockOnly) return

  const userId = getRequiredAuthUserId(context)
  const { data: project, error: projectError } = await context.clients.admin
    .from('projects')
    .select('id, workspace_id')
    .eq('id', input.projectId)
    .eq('workspace_id', input.workspaceId)
    .maybeSingle()

  throwOnSupabaseError(projectError, 'WORKSPACE_ACCESS_DENIED')
  if (!project) {
    throw new ApiError('WORKSPACE_ACCESS_DENIED', 'Production readiness evidence recording requires an accessible project in the requested workspace.', 403)
  }

  const { data: membership, error: membershipError } = await context.clients.admin
    .from('workspace_members')
    .select('user_id, role')
    .eq('workspace_id', input.workspaceId)
    .eq('user_id', userId)
    .maybeSingle()

  throwOnSupabaseError(membershipError, 'WORKSPACE_ACCESS_DENIED')
  const role = typeof membership?.role === 'string' ? membership.role : undefined
  if (role !== 'owner' && role !== 'admin') {
    throw new ApiError(
      'WORKSPACE_ACCESS_DENIED',
      'Production readiness evidence recording requires workspace owner/admin authorization.',
      403,
      { requiredRoles: ['owner', 'admin'], actualRole: role ?? 'none' },
    )
  }
}

async function listPackets(context: ServiceContext, workspaceId: string) {
  if (context.clients.admin && !context.env.mockOnly) {
    return listPersistentProductionToolExecutionReadinessEvidencePackets(context.clients.admin, workspaceId)
  }
  return listMockProductionToolExecutionReadinessEvidencePackets(workspaceId)
}
