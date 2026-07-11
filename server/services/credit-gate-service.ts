import { createHash } from 'node:crypto'
import { join } from 'node:path'
import { createClient } from '@supabase/supabase-js'
import { ApiError } from '../errors/api-error'
import {
  readPrivateTextFileIfExistsWithinRoot,
  writePrivateTextFileAtomicWithinRoot,
} from '../security/private-local-persistence'
import type { ServiceContext, RuntimeClients } from '../types'
import { createMockId, getRequiredAuthUserId, mockWarning, nowIso, throwOnSupabaseError } from './service-helpers'
import { authorizeWorkspaceAccess } from './workspace-access-service'

interface MockCreditApprovalCacheEntry {
  requestHash: string
  creditApproval: Record<string, unknown>
}

interface MockCreditReservationCacheEntry {
  requestHash: string
  creditReservation: Record<string, unknown>
}

interface PersistedMockCreditApprovalRecord {
  recordVersion: 'private-internal-credit-gate-v1'
  source: 'credit_gate_service_internal_test_persistence'
  persistedAt: string
  cacheKeyHash: string
  cacheEntry: MockCreditApprovalCacheEntry
}

interface PersistedMockCreditReservationRecord {
  recordVersion: 'private-internal-credit-gate-v1'
  source: 'credit_gate_service_internal_test_persistence'
  persistedAt: string
  cacheKeyHash: string
  cacheEntry: MockCreditReservationCacheEntry
}

const mockCreditApprovalsByIdempotency = new Map<string, MockCreditApprovalCacheEntry>()
const mockCreditReservationsByIdempotency = new Map<string, MockCreditReservationCacheEntry>()

export function clearCreditGateMemoryForSmoke(): void {
  mockCreditApprovalsByIdempotency.clear()
  mockCreditReservationsByIdempotency.clear()
}

export function createCreditGateService(context: ServiceContext) {
  return {
    async approveCreditEstimate(input: { workspaceId: string; creditEstimateId: string; idempotencyKey?: string }) {
      const userId = getRequiredAuthUserId(context)
      blockLegacyStandaloneCreditMutation()
      const idempotencyKey = input.idempotencyKey?.trim()
      if (!idempotencyKey) throw new ApiError('IDEMPOTENCY_KEY_REQUIRED', 'Idempotency-Key header is required for credit estimate approval.', 400)

      const requestHash = hashCreditGateRequest({
        operation: 'approveCreditEstimate',
        workspaceId: input.workspaceId,
        creditEstimateId: input.creditEstimateId,
        approvedByUserId: userId,
      })

      if (shouldUseLocalCreditGateStore(context)) {
        await authorizeWorkspaceAccess(context, input.workspaceId, 'write')
        const cacheKey = `${input.workspaceId}:${userId}:${idempotencyKey}`
        const existing = mockCreditApprovalsByIdempotency.get(cacheKey) ??
          await loadMockCreditApprovalByIdempotency(cacheKey, context.env.localStorageRoot)
        if (existing && existing.requestHash !== requestHash) {
          throw new ApiError('IDEMPOTENCY_CONFLICT', 'Idempotency-Key was reused with a different credit approval request body.', 409)
        }
        if (existing) {
          mockCreditApprovalsByIdempotency.set(cacheKey, existing)
          return {
            creditApproval: existing.creditApproval,
            warnings: [mockWarning('Credit estimate approval'), 'Idempotent credit approval replay returned the original result.'],
          }
        }

        const creditApproval = {
          id: createMockId('credit_approval'),
          workspaceId: input.workspaceId,
          creditEstimateId: input.creditEstimateId,
          status: 'approved',
          approvedByUserId: userId,
          createdAt: nowIso(),
          mockOnly: true,
          internalTestingOnly: context.env.allowInternalTestExecutionWithSupabase === true,
        }
        await persistMockCreditApproval({
          cacheKey,
          requestHash,
          creditApproval,
          localStorageRoot: context.env.localStorageRoot,
        })
        mockCreditApprovalsByIdempotency.set(cacheKey, { requestHash, creditApproval })

        return {
          creditApproval,
          warnings: [
            mockWarning('Credit estimate approval'),
            context.env.allowInternalTestExecutionWithSupabase
              ? 'Credit approval used local internal-testing persistence; no wallet, ledger, Stripe, provider, worker, render, or production billing mutation occurred.'
              : 'Credit approval is mock-only; no wallet, ledger, Stripe, provider, worker, render, or production billing mutation occurred.',
          ],
        }
      }

      throw new ApiError(
        'MOCK_ONLY',
        'Production credit approval requires an approved transactional credit gate RPC before live wallet, ledger, Stripe, provider, worker, render, or export billing can run.',
        202,
        {
          workspaceId: input.workspaceId,
          creditEstimateId: input.creditEstimateId,
          approvedByUserId: userId,
          requiredGate: 'production_credit_approval_reservation_rpc',
        },
      )
    },

    async reserveCredits(input: { workspaceId: string; projectId?: string; editPlanId?: string; creditEstimateId: string; idempotencyKey?: string }) {
      const userId = getRequiredAuthUserId(context)
      blockLegacyStandaloneCreditMutation()
      const idempotencyKey = input.idempotencyKey?.trim()
      if (!idempotencyKey) throw new ApiError('IDEMPOTENCY_KEY_REQUIRED', 'Idempotency-Key header is required for credit reservation.', 400)

      const requestHash = hashCreditGateRequest({
        operation: 'reserveCredits',
        workspaceId: input.workspaceId,
        projectId: input.projectId ?? null,
        editPlanId: input.editPlanId ?? null,
        creditEstimateId: input.creditEstimateId,
        requestedByUserId: userId,
      })

      if (shouldUseLocalCreditGateStore(context)) {
        await authorizeWorkspaceAccess(context, input.workspaceId, 'write')
        const cacheKey = `${input.workspaceId}:${userId}:${idempotencyKey}`
        const existing = mockCreditReservationsByIdempotency.get(cacheKey) ??
          await loadMockCreditReservationByIdempotency(cacheKey, context.env.localStorageRoot)
        if (existing && existing.requestHash !== requestHash) {
          throw new ApiError('IDEMPOTENCY_CONFLICT', 'Idempotency-Key was reused with a different credit reservation request body.', 409)
        }
        if (existing) {
          mockCreditReservationsByIdempotency.set(cacheKey, existing)
          return {
            creditReservation: existing.creditReservation,
            warnings: [mockWarning('Credit reservation'), 'Idempotent credit reservation replay returned the original result.'],
          }
        }

        const creditReservation = {
          id: createMockId('credit_reservation'),
          workspaceId: input.workspaceId,
          projectId: input.projectId,
          editPlanId: input.editPlanId,
          creditEstimateId: input.creditEstimateId,
          status: 'reserved',
          requestedByUserId: userId,
          createdAt: nowIso(),
          mockOnly: true,
          internalTestingOnly: context.env.allowInternalTestExecutionWithSupabase === true,
        }
        await persistMockCreditReservation({
          cacheKey,
          requestHash,
          creditReservation,
          localStorageRoot: context.env.localStorageRoot,
        })
        mockCreditReservationsByIdempotency.set(cacheKey, { requestHash, creditReservation })

        return {
          creditReservation,
          warnings: [
            mockWarning('Credit reservation'),
            context.env.allowInternalTestExecutionWithSupabase
              ? 'Credit reservation used local internal-testing persistence; no wallet, ledger, Stripe, provider, worker, render, export, or production billing mutation occurred.'
              : 'Reservation skeleton does not spend credits, call Stripe, run workers, render, or export.',
          ],
        }
      }

      throw new ApiError(
        'MOCK_ONLY',
        'Production credit reservation requires an approved transactional reservation RPC that verifies the approved estimate, wallet balance, idempotency, and ledger policy before live work can run.',
        202,
        {
          workspaceId: input.workspaceId,
          projectId: input.projectId,
          editPlanId: input.editPlanId,
          creditEstimateId: input.creditEstimateId,
          requestedByUserId: userId,
          requiredGate: 'production_credit_approval_reservation_rpc',
        },
      )
    },

    async getCreditBalance(workspaceId: string) {
      getRequiredAuthUserId(context)
      await authorizeWorkspaceAccess(context, workspaceId, 'read')
      if (shouldUseLocalCreditGateStore(context)) {
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

      const readClient = createAuthenticatedCreditReadClient(context)
      if (!readClient) {
        throw new ApiError('AUTH_INVALID', 'Authenticated Supabase read client is unavailable for credit balance reads.', 401)
      }

      const { data, error } = await readClient
        .from('credit_wallet_balance_view')
        .select('*')
        .eq('workspace_id', workspaceId)
        .maybeSingle()

      throwOnSupabaseError(error)
      return { creditBalance: data ?? { workspace_id: workspaceId, available_credits: 0 }, warnings: [] }
    },
  }
}

function blockLegacyStandaloneCreditMutation(): void {
  throw new ApiError(
    'TOOL_NOT_READY',
    'Standalone credit approval and reservation are disabled; canonical plan approval owns funded reservation authority.',
    503,
    { requiredGate: 'atomic_plan_approval_and_funded_credit_reservation' },
  )
}

function shouldUseLocalCreditGateStore(context: ServiceContext): boolean {
  return !context.clients.admin || context.env.mockOnly || context.env.allowInternalTestExecutionWithSupabase === true
}

async function persistMockCreditApproval(input: {
  cacheKey: string
  requestHash: string
  creditApproval: Record<string, unknown>
  localStorageRoot: string
}): Promise<void> {
  assertMockCreditApprovalSafe(input.creditApproval)
  const cacheKeyHash = hashRegistryKey(input.cacheKey)
  const content = `${JSON.stringify({
    recordVersion: 'private-internal-credit-gate-v1',
    source: 'credit_gate_service_internal_test_persistence',
    persistedAt: nowIso(),
    cacheKeyHash,
    cacheEntry: {
      requestHash: input.requestHash,
      creditApproval: input.creditApproval,
    },
  } satisfies PersistedMockCreditApprovalRecord, null, 2)}\n`
  await writePrivateTextFileAtomicWithinRoot({
    rootPath: input.localStorageRoot,
    relativePath: creditApprovalObjectPath(cacheKeyHash),
    content,
  })
}

async function persistMockCreditReservation(input: {
  cacheKey: string
  requestHash: string
  creditReservation: Record<string, unknown>
  localStorageRoot: string
}): Promise<void> {
  assertMockCreditReservationSafe(input.creditReservation)
  const cacheKeyHash = hashRegistryKey(input.cacheKey)
  const content = `${JSON.stringify({
    recordVersion: 'private-internal-credit-gate-v1',
    source: 'credit_gate_service_internal_test_persistence',
    persistedAt: nowIso(),
    cacheKeyHash,
    cacheEntry: {
      requestHash: input.requestHash,
      creditReservation: input.creditReservation,
    },
  } satisfies PersistedMockCreditReservationRecord, null, 2)}\n`
  await writePrivateTextFileAtomicWithinRoot({
    rootPath: input.localStorageRoot,
    relativePath: creditReservationObjectPath(cacheKeyHash),
    content,
  })
}

async function loadMockCreditApprovalByIdempotency(
  cacheKey: string,
  localStorageRoot: string,
): Promise<MockCreditApprovalCacheEntry | undefined> {
  const cacheKeyHash = hashRegistryKey(cacheKey)
  const content = await readPrivateTextFileIfExistsWithinRoot({
    rootPath: localStorageRoot,
    relativePath: creditApprovalObjectPath(cacheKeyHash),
  })
  if (!content) return undefined

  const record = parseJsonObject(content, 'Credit approval registry record') as Partial<PersistedMockCreditApprovalRecord>
  if (
    record.recordVersion !== 'private-internal-credit-gate-v1' ||
    record.source !== 'credit_gate_service_internal_test_persistence' ||
    record.cacheKeyHash !== cacheKeyHash ||
    !record.cacheEntry
  ) {
    throw new ApiError('VALIDATION_FAILED', 'Credit approval registry record has an unsupported shape.', 400)
  }
  assertMockCreditApprovalSafe(record.cacheEntry.creditApproval)
  return record.cacheEntry
}

async function loadMockCreditReservationByIdempotency(
  cacheKey: string,
  localStorageRoot: string,
): Promise<MockCreditReservationCacheEntry | undefined> {
  const cacheKeyHash = hashRegistryKey(cacheKey)
  const content = await readPrivateTextFileIfExistsWithinRoot({
    rootPath: localStorageRoot,
    relativePath: creditReservationObjectPath(cacheKeyHash),
  })
  if (!content) return undefined

  const record = parseJsonObject(content, 'Credit reservation registry record') as Partial<PersistedMockCreditReservationRecord>
  if (
    record.recordVersion !== 'private-internal-credit-gate-v1' ||
    record.source !== 'credit_gate_service_internal_test_persistence' ||
    record.cacheKeyHash !== cacheKeyHash ||
    !record.cacheEntry
  ) {
    throw new ApiError('VALIDATION_FAILED', 'Credit reservation registry record has an unsupported shape.', 400)
  }
  assertMockCreditReservationSafe(record.cacheEntry.creditReservation)
  return record.cacheEntry
}

function parseJsonObject(content: string, label: string): Record<string, unknown> {
  let parsed: unknown
  try {
    parsed = JSON.parse(content)
  } catch {
    throw new ApiError('VALIDATION_FAILED', `${label} is not valid JSON.`, 400)
  }
  if (!parsed || typeof parsed !== 'object') {
    throw new ApiError('VALIDATION_FAILED', `${label} is not an object.`, 400)
  }
  return parsed as Record<string, unknown>
}

function assertMockCreditApprovalSafe(creditApproval: Record<string, unknown>): void {
  if (
    typeof creditApproval.id !== 'string' ||
    !creditApproval.id.trim() ||
    typeof creditApproval.approvedByUserId !== 'string' ||
    !creditApproval.approvedByUserId.trim() ||
    creditApproval.status !== 'approved' ||
    creditApproval.mockOnly !== true
  ) {
    throw new ApiError('VALIDATION_FAILED', 'Private internal credit approval registry metadata is incomplete.', 400)
  }
}

function assertMockCreditReservationSafe(creditReservation: Record<string, unknown>): void {
  if (
    typeof creditReservation.id !== 'string' ||
    !creditReservation.id.trim() ||
    typeof creditReservation.requestedByUserId !== 'string' ||
    !creditReservation.requestedByUserId.trim() ||
    creditReservation.status !== 'reserved' ||
    creditReservation.mockOnly !== true
  ) {
    throw new ApiError('VALIDATION_FAILED', 'Private internal credit reservation registry metadata is incomplete.', 400)
  }
}

function creditGateRegistryDirectory(): string {
  return join('credits', 'private-internal-credit-gate-registry').split('/').join('/')
}

function creditApprovalObjectPath(cacheKeyHash: string): string {
  return join(creditGateRegistryDirectory(), 'approvals-by-idempotency', `${safePathPart(cacheKeyHash)}.json`).split('/').join('/')
}

function creditReservationObjectPath(cacheKeyHash: string): string {
  return join(creditGateRegistryDirectory(), 'reservations-by-idempotency', `${safePathPart(cacheKeyHash)}.json`).split('/').join('/')
}

function hashRegistryKey(value: string): string {
  return createHash('sha256')
    .update(value)
    .digest('hex')
}

function safePathPart(value: string): string {
  return value
    .trim()
    .replace(/[^a-zA-Z0-9._-]/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 160) || 'record'
}

function hashCreditGateRequest(value: Record<string, unknown>): string {
  return createHash('sha256')
    .update(stableStringify(value))
    .digest('hex')
}

function stableStringify(value: unknown): string {
  return JSON.stringify(stableJsonValue(value))
}

function stableJsonValue(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(stableJsonValue)
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .filter(([, nested]) => nested !== undefined)
        .sort(([leftKey], [rightKey]) => leftKey.localeCompare(rightKey))
        .map(([key, nested]) => [key, stableJsonValue(nested)]),
    )
  }
  return value
}

function createAuthenticatedCreditReadClient(context: ServiceContext): RuntimeClients['public'] {
  const accessToken = context.auth?.accessToken
  if (!context.env.supabaseUrl || !context.env.supabaseAnonKey || !accessToken) {
    return null
  }

  return createClient(context.env.supabaseUrl, context.env.supabaseAnonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
    global: {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  })
}
