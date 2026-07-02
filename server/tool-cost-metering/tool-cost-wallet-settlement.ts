import type { SupabaseClient } from '@supabase/supabase-js'
import { ApiError } from '../errors/api-error'
import type { ServiceContext } from '../types'
import { assertNoSecretLikeCostPayload } from './secret-safety'
import type { ToolCostFailureCategory } from './types'

export type ToolCostWalletSettlementType = 'spend' | 'release' | 'refund'
export type ToolCostWalletSettlementStatus = 'settled_mock' | 'settled_persistent' | 'not_billable'

export interface ToolCostWalletSettlementInput {
  workspaceId: string
  projectId: string
  toolCostEventId: string
  creditEstimateId?: string | null
  creditReservationId?: string | null
  toolCostCredits: number
  billableToUser: boolean
  failureCategory?: ToolCostFailureCategory
  settlementType?: ToolCostWalletSettlementType
  metadata?: Record<string, unknown>
}

export interface ToolCostWalletSettlement {
  id: string
  workspaceId: string
  projectId: string
  toolCostEventId: string
  creditEstimateId: string | null
  creditReservationId: string | null
  creditLedgerEntryId: string | null
  settlementType: ToolCostWalletSettlementType
  status: ToolCostWalletSettlementStatus
  creditsDelta: number
  billableToUser: boolean
  failureCategory: ToolCostFailureCategory
  walletMutationMode: 'mock_ledger_only' | 'supabase_credit_ledger'
  stripeCallAttempted: false
  serviceFeeIncluded: false
  createdAt: string
  metadata: Record<string, unknown>
}

interface ToolCostWalletSettlementRow {
  id: string
  workspace_id: string
  project_id: string
  tool_cost_event_id: string
  credit_reservation_id: string | null
  credit_ledger_entry_id: string | null
  settlement_type: string
  status: string
  credits_delta: number | string
  billable_to_user: boolean
  failure_category: string
  metadata_json: Record<string, unknown>
  created_at: string
}

const mockSettlementsByIdempotencyKey = new Map<string, ToolCostWalletSettlement>()

export function resetMockToolCostWalletSettlementStore(): void {
  mockSettlementsByIdempotencyKey.clear()
}

export async function settleToolCostWallet(
  context: ServiceContext,
  input: ToolCostWalletSettlementInput,
  idempotencyKey: string,
): Promise<{ settlement: ToolCostWalletSettlement; replayed: boolean; warnings: string[] }> {
  assertNoSecretLikeCostPayload(input.metadata ?? {}, 'metadata')

  if (context.clients.admin && !context.env.mockOnly) {
    return settlePersistentToolCostWallet(context.clients.admin, input, idempotencyKey)
  }

  const replay = mockSettlementsByIdempotencyKey.get(idempotencyKey)
  if (replay) {
    return {
      settlement: replay,
      replayed: true,
      warnings: [
        'Mock wallet settlement replayed idempotently; no Supabase, Stripe, or real wallet mutation occurred.',
      ],
    }
  }

  const settlement = buildMockSettlement(input, idempotencyKey)
  mockSettlementsByIdempotencyKey.set(idempotencyKey, settlement)
  return {
    settlement,
    replayed: false,
    warnings: [
      'Mock wallet settlement only; production requires a transactional backend RPC and deployed credit ledger.',
      'Stripe was not called and ReEditPro service/edit fees remain outside tool owner cost events.',
    ],
  }
}

function buildMockSettlement(input: ToolCostWalletSettlementInput, idempotencyKey: string): ToolCostWalletSettlement {
  const settlementType = input.settlementType ?? 'spend'
  const failureCategory = input.failureCategory ?? 'none'
  const normalizedCredits = Math.max(0, Math.ceil(input.toolCostCredits))
  const billableToUser = input.billableToUser && normalizedCredits > 0 && failureCategoryAllowsCharge(failureCategory)

  if (billableToUser && !input.creditReservationId) {
    throw new Error('Billable tool cost wallet settlement requires creditReservationId.')
  }

  return {
    id: `tool-cost-wallet-settlement-${hashFragment(idempotencyKey, input.toolCostEventId)}`,
    workspaceId: input.workspaceId,
    projectId: input.projectId,
    toolCostEventId: input.toolCostEventId,
    creditEstimateId: input.creditEstimateId ?? null,
    creditReservationId: input.creditReservationId ?? null,
    creditLedgerEntryId: null,
    settlementType,
    status: billableToUser ? 'settled_mock' : 'not_billable',
    creditsDelta: billableToUser ? settlementCreditsDelta(settlementType, normalizedCredits) : 0,
    billableToUser,
    failureCategory,
    walletMutationMode: 'mock_ledger_only',
    stripeCallAttempted: false,
    serviceFeeIncluded: false,
    createdAt: new Date().toISOString(),
    metadata: {
      ...(input.metadata ?? {}),
      toolCostWalletSettlementSkeleton: true,
      liveWalletMutation: false,
      stripeCallAttempted: false,
      serviceFeeIncluded: false,
    },
  }
}

async function settlePersistentToolCostWallet(
  admin: SupabaseClient,
  input: ToolCostWalletSettlementInput,
  idempotencyKey: string,
): Promise<{ settlement: ToolCostWalletSettlement; replayed: boolean; warnings: string[] }> {
  const existing = await admin
    .from('tool_cost_wallet_settlements')
    .select('*')
    .eq('idempotency_key', idempotencyKey)
    .maybeSingle()

  throwPersistentSettlementError(existing.error)
  if (existing.data) {
    return {
      settlement: rowToSettlement(existing.data as ToolCostWalletSettlementRow),
      replayed: true,
      warnings: ['Persistent wallet settlement replayed idempotently through the backend service-role path.'],
    }
  }

  const result = await admin.rpc('settle_tool_cost_event', {
    p_idempotency_key: idempotencyKey,
    p_tool_cost_event_id: input.toolCostEventId,
    p_settlement_type: input.settlementType ?? 'spend',
  })

  throwPersistentSettlementError(result.error)
  if (!result.data) {
    throw new ApiError('TOOL_COST_BACKEND_REQUIRED', 'Tool cost wallet settlement RPC did not return a settlement row.', 409)
  }

  return {
    settlement: rowToSettlement(result.data as ToolCostWalletSettlementRow),
    replayed: false,
    warnings: [
      'Persistent wallet settlement recorded through the backend service-role path.',
      'Stripe was not called and ReEditPro service/edit fees remain outside tool owner cost events.',
    ],
  }
}

function rowToSettlement(row: ToolCostWalletSettlementRow): ToolCostWalletSettlement {
  return {
    id: row.id,
    workspaceId: row.workspace_id,
    projectId: row.project_id,
    toolCostEventId: row.tool_cost_event_id,
    creditEstimateId: null,
    creditReservationId: row.credit_reservation_id,
    creditLedgerEntryId: row.credit_ledger_entry_id,
    settlementType: row.settlement_type as ToolCostWalletSettlementType,
    status: row.status === 'settled' ? 'settled_persistent' : 'not_billable',
    creditsDelta: Number(row.credits_delta),
    billableToUser: row.billable_to_user,
    failureCategory: row.failure_category as ToolCostFailureCategory,
    walletMutationMode: 'supabase_credit_ledger',
    stripeCallAttempted: false,
    serviceFeeIncluded: false,
    createdAt: row.created_at,
    metadata: row.metadata_json ?? {},
  }
}

function throwPersistentSettlementError(error: { code?: string; message?: string; hint?: string } | null): void {
  if (!error) return
  if (
    error.code === '42P01' ||
    error.code === '42883' ||
    /tool_cost_wallet_settlements|settle_tool_cost_event|does not exist|schema cache/i.test(error.message ?? '')
  ) {
    throw new ApiError(
      'TOOL_COST_BACKEND_REQUIRED',
      'Tool cost wallet settlement requires the tool_cost_wallet_settlements migration and settle_tool_cost_event RPC before live billing can be enabled.',
      409,
      { code: error.code, hint: error.hint },
    )
  }
  throw new ApiError('INTERNAL_ERROR', error.message ?? 'Tool cost wallet settlement failed.', 500, {
    code: error.code,
    hint: error.hint,
  })
}

function failureCategoryAllowsCharge(failureCategory: ToolCostFailureCategory): boolean {
  return failureCategory === 'none' ||
    failureCategory === 'user_requested_retry' ||
    failureCategory === 'user_requested_revision'
}

function settlementCreditsDelta(settlementType: ToolCostWalletSettlementType, credits: number): number {
  if (settlementType === 'spend') return -credits
  return credits
}

function hashFragment(...values: string[]): string {
  let hash = 0
  for (const value of values.join(':')) {
    hash = ((hash << 5) - hash + value.charCodeAt(0)) | 0
  }
  return Math.abs(hash).toString(16).padStart(8, '0').slice(0, 8)
}
