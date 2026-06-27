import { ApiError } from '../errors/api-error'
import type { ServiceContext } from '../types'
import { assertNoSecretLikeCostPayload } from './secret-safety'
import type { ToolCostFailureCategory } from './types'

export type ToolCostWalletSettlementType = 'spend' | 'release' | 'refund'
export type ToolCostWalletSettlementStatus = 'settled_mock' | 'not_billable'

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
  settlementType: ToolCostWalletSettlementType
  status: ToolCostWalletSettlementStatus
  creditsDelta: number
  billableToUser: boolean
  failureCategory: ToolCostFailureCategory
  walletMutationMode: 'mock_ledger_only'
  stripeCallAttempted: false
  serviceFeeIncluded: false
  createdAt: string
  metadata: Record<string, unknown>
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
    throw new ApiError(
      'TOOL_COST_BACKEND_REQUIRED',
      'Tool cost wallet settlement requires a transactional backend RPC before live billing can be enabled.',
      409,
    )
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
