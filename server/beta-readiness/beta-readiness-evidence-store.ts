import type { SupabaseClient } from '@supabase/supabase-js'
import { randomUUID } from 'node:crypto'
import { ApiError } from '../errors/api-error'
import type {
  BetaReadinessChecklistEvidence,
  ToolBetaAcceptedExecutionEvidence,
  ToolBetaPlatformReadinessEvidence,
} from './beta-readiness-types'
import type { BuildBetaReadinessReportOptions } from './beta-readiness-report-builder'

export interface BetaReadinessEvidencePacketInput {
  workspaceId: string
  projectId?: string
  baseline?: Pick<BuildBetaReadinessReportOptions, 'e2eDryRunPassed' | 'safetyDocsExist' | 'costDocsExist'>
  checklistEvidence?: BetaReadinessChecklistEvidence[]
  acceptedToolEvidence?: ToolBetaAcceptedExecutionEvidence[]
  platformEvidence?: ToolBetaPlatformReadinessEvidence
  approvals?: Pick<
    BuildBetaReadinessReportOptions,
    | 'deploymentApproved'
    | 'securityApproved'
    | 'storageApproved'
    | 'modelLicensesApproved'
    | 'legalApproved'
    | 'monitoringApproved'
    | 'supportApproved'
    | 'realUserMediaBetaApproved'
    | 'paidProductionApproved'
  >
}

export interface BetaReadinessEvidencePacket {
  id: string
  workspaceId: string
  projectId?: string
  idempotencyKey: string
  createdAt: string
  createdByUserId?: string
  evidence: BetaReadinessEvidencePacketInput
}

interface BetaReadinessEvidencePacketRow {
  id: string
  workspace_id: string
  project_id: string | null
  idempotency_key: string
  created_at: string
  created_by_user_id: string | null
  evidence: BetaReadinessEvidencePacketInput
}

const mockEvidencePackets = new Map<string, BetaReadinessEvidencePacket>()

export function recordMockBetaReadinessEvidencePacket(
  idempotencyKey: string,
  evidence: BetaReadinessEvidencePacketInput,
  createdByUserId?: string,
): { packet: BetaReadinessEvidencePacket; replayed: boolean } {
  const storageKey = mockStorageKey(evidence.workspaceId, idempotencyKey)
  const existing = mockEvidencePackets.get(storageKey)
  if (existing) return { packet: existing, replayed: true }

  const packet: BetaReadinessEvidencePacket = {
    id: `beta-readiness-evidence-${randomUUID()}`,
    workspaceId: evidence.workspaceId,
    projectId: evidence.projectId,
    idempotencyKey,
    createdAt: new Date().toISOString(),
    createdByUserId,
    evidence,
  }
  mockEvidencePackets.set(storageKey, packet)
  return { packet, replayed: false }
}

export function listMockBetaReadinessEvidencePackets(workspaceId: string): BetaReadinessEvidencePacket[] {
  return [...mockEvidencePackets.values()]
    .filter((packet) => packet.workspaceId === workspaceId)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
}

export async function recordPersistentBetaReadinessEvidencePacket(
  admin: SupabaseClient,
  idempotencyKey: string,
  evidence: BetaReadinessEvidencePacketInput,
  createdByUserId?: string,
): Promise<{ packet: BetaReadinessEvidencePacket; replayed: boolean }> {
  const existing = await admin
    .from('beta_readiness_evidence_packets')
    .select('*')
    .eq('workspace_id', evidence.workspaceId)
    .eq('idempotency_key', idempotencyKey)
    .maybeSingle()

  throwPersistentStoreError(existing.error)
  if (existing.data) {
    return { packet: rowToPacket(existing.data as BetaReadinessEvidencePacketRow), replayed: true }
  }

  const inserted = await admin
    .from('beta_readiness_evidence_packets')
    .insert(packetToRow(idempotencyKey, evidence, createdByUserId))
    .select('*')
    .single()

  if (inserted.error?.code === '23505') {
    const replay = await admin
      .from('beta_readiness_evidence_packets')
      .select('*')
      .eq('workspace_id', evidence.workspaceId)
      .eq('idempotency_key', idempotencyKey)
      .maybeSingle()

    throwPersistentStoreError(replay.error)
    if (replay.data) {
      return { packet: rowToPacket(replay.data as BetaReadinessEvidencePacketRow), replayed: true }
    }
  }

  throwPersistentStoreError(inserted.error)
  if (!inserted.data) {
    throw new ApiError('BETA_READINESS_BACKEND_REQUIRED', 'Beta readiness evidence insert did not return a row.', 409)
  }

  return { packet: rowToPacket(inserted.data as BetaReadinessEvidencePacketRow), replayed: false }
}

export async function listPersistentBetaReadinessEvidencePackets(
  admin: SupabaseClient,
  workspaceId: string,
): Promise<BetaReadinessEvidencePacket[]> {
  const result = await admin
    .from('beta_readiness_evidence_packets')
    .select('*')
    .eq('workspace_id', workspaceId)
    .order('created_at', { ascending: true })

  throwPersistentStoreError(result.error)
  return ((result.data ?? []) as BetaReadinessEvidencePacketRow[]).map(rowToPacket)
}

export function mergeBetaReadinessEvidencePackets(
  packets: BetaReadinessEvidencePacket[],
): BuildBetaReadinessReportOptions {
  const checklistEvidence = new Map<string, BetaReadinessChecklistEvidence>()
  const acceptedToolEvidence = new Map<string, ToolBetaAcceptedExecutionEvidence>()
  let platformEvidence: ToolBetaPlatformReadinessEvidence | undefined
  const merged: BuildBetaReadinessReportOptions = {}

  for (const packet of packets) {
    Object.assign(merged, packet.evidence.baseline ?? {})
    Object.assign(merged, packet.evidence.approvals ?? {})

    for (const record of packet.evidence.checklistEvidence ?? []) {
      checklistEvidence.set(record.itemId, record)
    }
    for (const record of packet.evidence.acceptedToolEvidence ?? []) {
      acceptedToolEvidence.set(record.toolId, record)
    }
    if (packet.evidence.platformEvidence) {
      platformEvidence = packet.evidence.platformEvidence
    }
  }

  return {
    ...merged,
    checklistEvidence: [...checklistEvidence.values()],
    acceptedToolEvidence: [...acceptedToolEvidence.values()],
    platformEvidence,
  }
}

function packetToRow(
  idempotencyKey: string,
  evidence: BetaReadinessEvidencePacketInput,
  createdByUserId?: string,
): BetaReadinessEvidencePacketRow {
  return {
    id: `beta-readiness-evidence-${randomUUID()}`,
    workspace_id: evidence.workspaceId,
    project_id: evidence.projectId ?? null,
    idempotency_key: idempotencyKey,
    created_at: new Date().toISOString(),
    created_by_user_id: createdByUserId ?? null,
    evidence,
  }
}

function rowToPacket(row: BetaReadinessEvidencePacketRow): BetaReadinessEvidencePacket {
  return {
    id: row.id,
    workspaceId: row.workspace_id,
    projectId: row.project_id ?? undefined,
    idempotencyKey: row.idempotency_key,
    createdAt: row.created_at,
    createdByUserId: row.created_by_user_id ?? undefined,
    evidence: row.evidence,
  }
}

function mockStorageKey(workspaceId: string, idempotencyKey: string): string {
  return `${workspaceId}:${idempotencyKey}`
}

function throwPersistentStoreError(error: { code?: string; message?: string; hint?: string } | null): void {
  if (!error) return
  if (error.code === '42P01' || /beta_readiness_evidence_packets|does not exist|schema cache/i.test(error.message ?? '')) {
    throw new ApiError(
      'BETA_READINESS_BACKEND_REQUIRED',
      'Beta readiness evidence persistence requires the beta_readiness_evidence_packets migration before live beta evidence can be stored.',
      409,
      { code: error.code, hint: error.hint },
    )
  }
  throw new ApiError('INTERNAL_ERROR', error.message ?? 'Beta readiness evidence persistence failed.', 500, {
    code: error.code,
    hint: error.hint,
  })
}
