import type { SupabaseClient } from '@supabase/supabase-js'
import { randomUUID } from 'node:crypto'
import { ApiError } from '../errors/api-error'
import type {
  ProductionToolExecutionReadinessGateInput,
  ProductionToolExecutionReadinessGateReport,
} from './production-tool-execution-readiness-gate'

export interface ProductionToolExecutionReadinessEvidencePacketInput {
  readinessInput: ProductionToolExecutionReadinessGateInput
  readinessReport: ProductionToolExecutionReadinessGateReport
}

export interface ProductionToolExecutionReadinessEvidencePacket {
  id: string
  workspaceId: string
  projectId: string
  idempotencyKey: string
  sourceId: string
  sourceSha?: string
  createdAt: string
  createdByUserId?: string
  readinessInput: ProductionToolExecutionReadinessGateInput
  readinessReport: ProductionToolExecutionReadinessGateReport
}

interface ProductionToolExecutionReadinessEvidencePacketRow {
  id: string
  workspace_id: string
  project_id: string
  idempotency_key: string
  source_id: string
  source_sha: string | null
  created_at: string
  created_by_user_id: string | null
  readiness_input: ProductionToolExecutionReadinessGateInput
  readiness_report: ProductionToolExecutionReadinessGateReport
}

const mockProductionEvidencePackets = new Map<string, ProductionToolExecutionReadinessEvidencePacket>()

export function recordMockProductionToolExecutionReadinessEvidencePacket(
  idempotencyKey: string,
  input: ProductionToolExecutionReadinessEvidencePacketInput,
  createdByUserId?: string,
): { packet: ProductionToolExecutionReadinessEvidencePacket; replayed: boolean } {
  const storageKey = mockStorageKey(input.readinessInput.workspaceId, idempotencyKey)
  const existing = mockProductionEvidencePackets.get(storageKey)
  if (existing) return { packet: existing, replayed: true }

  const packet: ProductionToolExecutionReadinessEvidencePacket = {
    id: `production-tool-execution-readiness-evidence-${randomUUID()}`,
    workspaceId: input.readinessInput.workspaceId,
    projectId: input.readinessInput.projectId,
    idempotencyKey,
    sourceId: input.readinessInput.sourceId,
    sourceSha: input.readinessInput.sourceSha,
    createdAt: new Date().toISOString(),
    createdByUserId,
    readinessInput: input.readinessInput,
    readinessReport: input.readinessReport,
  }
  mockProductionEvidencePackets.set(storageKey, packet)
  return { packet, replayed: false }
}

export function listMockProductionToolExecutionReadinessEvidencePackets(
  workspaceId: string,
): ProductionToolExecutionReadinessEvidencePacket[] {
  return [...mockProductionEvidencePackets.values()]
    .filter((packet) => packet.workspaceId === workspaceId)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
}

export async function recordPersistentProductionToolExecutionReadinessEvidencePacket(
  admin: SupabaseClient,
  idempotencyKey: string,
  input: ProductionToolExecutionReadinessEvidencePacketInput,
  createdByUserId?: string,
): Promise<{ packet: ProductionToolExecutionReadinessEvidencePacket; replayed: boolean }> {
  const existing = await admin
    .from('production_tool_execution_readiness_evidence_packets')
    .select('*')
    .eq('workspace_id', input.readinessInput.workspaceId)
    .eq('idempotency_key', idempotencyKey)
    .maybeSingle()

  throwPersistentStoreError(existing.error)
  if (existing.data) {
    return { packet: rowToPacket(existing.data as ProductionToolExecutionReadinessEvidencePacketRow), replayed: true }
  }

  const inserted = await admin
    .from('production_tool_execution_readiness_evidence_packets')
    .insert(packetToRow(idempotencyKey, input, createdByUserId))
    .select('*')
    .single()

  if (inserted.error?.code === '23505') {
    const replay = await admin
      .from('production_tool_execution_readiness_evidence_packets')
      .select('*')
      .eq('workspace_id', input.readinessInput.workspaceId)
      .eq('idempotency_key', idempotencyKey)
      .maybeSingle()

    throwPersistentStoreError(replay.error)
    if (replay.data) {
      return { packet: rowToPacket(replay.data as ProductionToolExecutionReadinessEvidencePacketRow), replayed: true }
    }
  }

  throwPersistentStoreError(inserted.error)
  if (!inserted.data) {
    throw new ApiError(
      'PRODUCTION_READINESS_BACKEND_REQUIRED',
      'Production tool execution readiness evidence insert did not return a row.',
      409,
    )
  }

  return { packet: rowToPacket(inserted.data as ProductionToolExecutionReadinessEvidencePacketRow), replayed: false }
}

export async function listPersistentProductionToolExecutionReadinessEvidencePackets(
  admin: SupabaseClient,
  workspaceId: string,
): Promise<ProductionToolExecutionReadinessEvidencePacket[]> {
  const result = await admin
    .from('production_tool_execution_readiness_evidence_packets')
    .select('*')
    .eq('workspace_id', workspaceId)
    .order('created_at', { ascending: true })

  throwPersistentStoreError(result.error)
  return ((result.data ?? []) as ProductionToolExecutionReadinessEvidencePacketRow[]).map(rowToPacket)
}

function packetToRow(
  idempotencyKey: string,
  input: ProductionToolExecutionReadinessEvidencePacketInput,
  createdByUserId?: string,
): ProductionToolExecutionReadinessEvidencePacketRow {
  return {
    id: `production-tool-execution-readiness-evidence-${randomUUID()}`,
    workspace_id: input.readinessInput.workspaceId,
    project_id: input.readinessInput.projectId,
    idempotency_key: idempotencyKey,
    source_id: input.readinessInput.sourceId,
    source_sha: input.readinessInput.sourceSha ?? null,
    created_at: new Date().toISOString(),
    created_by_user_id: createdByUserId ?? null,
    readiness_input: input.readinessInput,
    readiness_report: input.readinessReport,
  }
}

function rowToPacket(row: ProductionToolExecutionReadinessEvidencePacketRow): ProductionToolExecutionReadinessEvidencePacket {
  return {
    id: row.id,
    workspaceId: row.workspace_id,
    projectId: row.project_id,
    idempotencyKey: row.idempotency_key,
    sourceId: row.source_id,
    sourceSha: row.source_sha ?? undefined,
    createdAt: row.created_at,
    createdByUserId: row.created_by_user_id ?? undefined,
    readinessInput: row.readiness_input,
    readinessReport: row.readiness_report,
  }
}

function mockStorageKey(workspaceId: string, idempotencyKey: string): string {
  return `${workspaceId}:${idempotencyKey}`
}

function throwPersistentStoreError(error: { code?: string; message?: string; hint?: string } | null): void {
  if (!error) return
  if (
    error.code === '42P01' ||
    /production_tool_execution_readiness_evidence_packets|does not exist|schema cache/i.test(error.message ?? '')
  ) {
    throw new ApiError(
      'PRODUCTION_READINESS_BACKEND_REQUIRED',
      'Production readiness evidence persistence requires the production_tool_execution_readiness_evidence_packets migration before paid-production evidence can be stored.',
      409,
      { code: error.code, hint: error.hint },
    )
  }
  throw new ApiError('INTERNAL_ERROR', error.message ?? 'Production readiness evidence persistence failed.', 500, {
    code: error.code,
    hint: error.hint,
  })
}
