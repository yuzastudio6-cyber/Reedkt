import { createHash } from 'node:crypto'
import { join } from 'node:path'
import { createClient, type PostgrestError, type SupabaseClient } from '@supabase/supabase-js'
import { ApiError } from '../errors/api-error'
import {
  readPrivateTextFileIfExistsWithinRoot,
  writePrivateTextFileAtomicWithinRoot,
} from '../security/private-local-persistence'
import type { ServiceContext } from '../types'
import { cloneApprovedSnapshotJson, validateApprovedSnapshotJson } from './approved-snapshot-validation'
import { createMockId, getRequiredAuthUserId, mockWarning, nowIso, throwOnSupabaseError } from './service-helpers'
import { createProjectService } from './project-service'
import { authorizeWorkspaceAccess } from './workspace-access-service'

interface CreateApprovedSnapshotInput {
  workspaceId: string
  projectId: string
  chatSessionId?: string
  editPlanId: string
  creditEstimateId: string
  creditApprovalId: string
  creditReservationId: string
  approvedByUserId?: string
  snapshotVersion: number
  snapshotJson: Record<string, unknown>
  planHash: string
  creditHash: string
  sourceSequenceHash: string
  timingHash: string
  idempotencyKey: string
  requestPath?: string
}

interface MockApprovedSnapshotCacheEntry {
  requestHash: string
  approvedPlanSnapshot: Record<string, unknown>
}

interface PersistedMockApprovedSnapshotByIdempotencyRecord {
  recordVersion: 'private-internal-approved-snapshot-v1'
  source: 'approved_snapshot_service_internal_test_persistence'
  persistedAt: string
  cacheKeyHash: string
  cacheEntry: MockApprovedSnapshotCacheEntry
}

interface PersistedMockApprovedSnapshotByIdRecord {
  recordVersion: 'private-internal-approved-snapshot-v1'
  source: 'approved_snapshot_service_internal_test_persistence'
  persistedAt: string
  approvedPlanSnapshot: Record<string, unknown>
}

const mockApprovedSnapshotsByIdempotency = new Map<string, MockApprovedSnapshotCacheEntry>()
const mockApprovedSnapshotsById = new Map<string, Record<string, unknown>>()

export function clearApprovedSnapshotMemoryForSmoke(): void {
  mockApprovedSnapshotsByIdempotency.clear()
  mockApprovedSnapshotsById.clear()
}

export function createApprovedSnapshotService(context: ServiceContext) {
  return {
    async createApprovedSnapshot(input: CreateApprovedSnapshotInput) {
      const approvedByUserId = getRequiredAuthUserId(context)
      blockLegacyApprovedSnapshotCreation()
      if (input.approvedByUserId && input.approvedByUserId !== approvedByUserId) {
        throw new ApiError('VALIDATION_FAILED', 'approvedByUserId must match the authenticated approver.', 400)
      }

      const idempotencyKey = input.idempotencyKey?.trim()
      if (!idempotencyKey) throw new ApiError('IDEMPOTENCY_KEY_REQUIRED', 'Idempotency-Key header is required for approved snapshot creation.', 400)

      const snapshotJson = cloneApprovedSnapshotJson(input.snapshotJson)
      const validation = validateApprovedSnapshotJson(snapshotJson)
      if (validation.missingSections.length > 0) {
        throw new ApiError('VALIDATION_FAILED', 'Approved snapshot payload is missing required sections.', 400, {
          missingSections: validation.missingSections,
        })
      }

      if (validation.secretLikePaths.length > 0) {
        throw new ApiError('VALIDATION_FAILED', 'Approved snapshot payload contains secret-like fields, raw credentials, tokens, or signed URLs.', 400, {
          secretLikePaths: validation.secretLikePaths,
        })
      }

      const access = await authorizeWorkspaceAccess(context, input.workspaceId, 'write')
      if (!shouldUseLocalApprovedSnapshotStore(context)) {
        await createProjectService(context).getProject(input.projectId, access.workspaceId)
      }

      const requestHash = hashApprovedSnapshotRequest({
        requestPath: input.requestPath ?? '/v1/edit-plans/:editPlanId/approved-snapshots',
        workspaceId: input.workspaceId,
        projectId: input.projectId,
        chatSessionId: input.chatSessionId ?? null,
        editPlanId: input.editPlanId,
        creditEstimateId: input.creditEstimateId,
        creditApprovalId: input.creditApprovalId,
        creditReservationId: input.creditReservationId,
        approvedByUserId,
        snapshotVersion: input.snapshotVersion,
        snapshotJson,
        planHash: input.planHash,
        creditHash: input.creditHash,
        sourceSequenceHash: input.sourceSequenceHash,
        timingHash: input.timingHash,
      })

      if (shouldUseLocalApprovedSnapshotStore(context)) {
        const cacheKey = `${input.workspaceId}:${approvedByUserId}:${idempotencyKey}`
        const existing = mockApprovedSnapshotsByIdempotency.get(cacheKey) ??
          await loadMockApprovedSnapshotByIdempotency(cacheKey, context.env.localStorageRoot)
        if (existing && existing.requestHash !== requestHash) {
          throw new ApiError('IDEMPOTENCY_CONFLICT', 'Idempotency-Key was reused with a different approved snapshot request body.', 409)
        }

        if (existing) {
          mockApprovedSnapshotsByIdempotency.set(cacheKey, existing)
          mockApprovedSnapshotsById.set(String(existing.approvedPlanSnapshot.id), existing.approvedPlanSnapshot)
          return {
            approvedPlanSnapshot: existing.approvedPlanSnapshot,
            warnings: [mockWarning('Approved snapshot creation'), 'Idempotent approved snapshot replay returned the original result.'],
          }
        }

        const createdAt = nowIso()
        const approvedPlanSnapshot = {
          id: createMockId('approved_snapshot'),
          workspaceId: input.workspaceId,
          projectId: input.projectId,
          chatSessionId: input.chatSessionId,
          editPlanId: input.editPlanId,
          creditEstimateId: input.creditEstimateId,
          creditApprovalId: input.creditApprovalId,
          creditReservationId: input.creditReservationId,
          approvedByUserId,
          snapshotVersion: input.snapshotVersion,
          snapshotStatus: 'approved',
          snapshotJson,
          planHash: input.planHash,
          creditHash: input.creditHash,
          sourceSequenceHash: input.sourceSequenceHash,
          timingHash: input.timingHash,
          createdAt,
          updatedAt: createdAt,
          mockOnly: true,
          internalTestingOnly: context.env.allowInternalTestExecutionWithSupabase === true,
        }
        await persistMockApprovedSnapshot({
          cacheKey,
          requestHash,
          approvedPlanSnapshot,
          localStorageRoot: context.env.localStorageRoot,
        })
        mockApprovedSnapshotsByIdempotency.set(cacheKey, { requestHash, approvedPlanSnapshot })
        mockApprovedSnapshotsById.set(String(approvedPlanSnapshot.id), approvedPlanSnapshot)

        return {
          approvedPlanSnapshot,
          warnings: [
            mockWarning('Approved snapshot creation'),
            context.env.allowInternalTestExecutionWithSupabase
              ? 'Approved snapshot used local internal-testing persistence because the production approved-snapshot RPC is not the active gate.'
              : 'Workers must execute approved snapshots, not raw chat.',
          ],
        }
      }

      const adminClient = context.clients.admin
      if (!adminClient) {
        throw new ApiError('INTERNAL_ERROR', 'Approved snapshot production persistence requires a Supabase admin client.', 500)
      }

      const { data, error } = await adminClient.rpc('create_approved_plan_snapshot_atomic', {
        target_workspace_id: input.workspaceId,
        target_project_id: input.projectId,
        target_chat_session_id: input.chatSessionId ?? null,
        target_edit_plan_id: input.editPlanId,
        target_credit_estimate_id: input.creditEstimateId,
        target_credit_approval_id: input.creditApprovalId,
        target_credit_reservation_id: input.creditReservationId,
        target_approved_by_user_id: approvedByUserId,
        target_snapshot_version: input.snapshotVersion,
        target_snapshot_json: snapshotJson,
        target_plan_hash: input.planHash,
        target_credit_hash: input.creditHash,
        target_source_sequence_hash: input.sourceSequenceHash,
        target_timing_hash: input.timingHash,
        target_idempotency_key: idempotencyKey,
        target_request_hash: requestHash,
        target_request_path: input.requestPath ?? '/v1/edit-plans/:editPlanId/approved-snapshots',
      })

      throwOnApprovedSnapshotRpcError(error)
      if (!data) throw new ApiError('INTERNAL_ERROR', 'Approved snapshot RPC returned no snapshot.', 500)
      return {
        approvedPlanSnapshot: normalizeApprovedSnapshotRecord(data),
        warnings: [],
      }
    },

    async getApprovedSnapshot(snapshotId: string) {
      const userId = getRequiredAuthUserId(context)
      if (shouldUseLocalApprovedSnapshotStore(context)) {
        const approvedPlanSnapshot = mockApprovedSnapshotsById.get(snapshotId) ??
          await loadMockApprovedSnapshotById(snapshotId, context.env.localStorageRoot)
        if (!approvedPlanSnapshot) {
          throw new ApiError('APPROVED_SNAPSHOT_REQUIRED', 'Approved snapshot was not found in private internal approved-snapshot storage.', 404)
        }
        assertApprovedSnapshotOwnedByCurrentUser(approvedPlanSnapshot, userId)
        mockApprovedSnapshotsById.set(snapshotId, approvedPlanSnapshot)
        return {
          approvedPlanSnapshot,
          warnings: [
            mockWarning('Approved snapshot read'),
            context.env.allowInternalTestExecutionWithSupabase
              ? 'Approved snapshot read used local internal-testing persistence.'
              : 'Approved snapshot read used mock persistence.',
          ],
        }
      }

      const readClient = createAuthenticatedReadClient(context)
      if (!readClient) {
        throw new ApiError('AUTH_INVALID', 'Authenticated Supabase read client is unavailable for approved snapshot reads.', 401)
      }

      const { data, error } = await readClient
        .from('approved_plan_snapshots')
        .select('id, workspace_id, project_id, chat_session_id, edit_plan_id, credit_estimate_id, credit_approval_id, credit_reservation_id, approved_by_user_id, approved_by, snapshot_version, snapshot_status, status, snapshot_json, plan_hash, credit_hash, source_sequence_hash, timing_hash, created_at, updated_at')
        .eq('id', snapshotId)
        .eq('approved_by_user_id', userId)
        .maybeSingle()

      throwOnSupabaseError(error, 'APPROVED_SNAPSHOT_REQUIRED')
      if (!data) throw new ApiError('APPROVED_SNAPSHOT_REQUIRED', 'Approved snapshot was not found.', 404)
      return {
        approvedPlanSnapshot: normalizeApprovedSnapshotRecord(data),
        warnings: [],
      }
    },
  }
}

function blockLegacyApprovedSnapshotCreation(): void {
  throw new ApiError(
    'TOOL_NOT_READY',
    'Caller-authored approved snapshot creation is disabled; use canonical plan approval authority.',
    503,
    { requiredGate: 'server_owned_canonical_plan_authority' },
  )
}

function shouldUseLocalApprovedSnapshotStore(context: ServiceContext): boolean {
  return !context.clients.admin || context.env.mockOnly || context.env.allowInternalTestExecutionWithSupabase === true
}

async function persistMockApprovedSnapshot(input: {
  cacheKey: string
  requestHash: string
  approvedPlanSnapshot: Record<string, unknown>
  localStorageRoot: string
}): Promise<void> {
  assertMockApprovedSnapshotSafe(input.approvedPlanSnapshot)
  const cacheKeyHash = hashRegistryKey(input.cacheKey)
  const cacheEntry: MockApprovedSnapshotCacheEntry = {
    requestHash: input.requestHash,
    approvedPlanSnapshot: input.approvedPlanSnapshot,
  }
  const byIdempotencyContent = `${JSON.stringify({
    recordVersion: 'private-internal-approved-snapshot-v1',
    source: 'approved_snapshot_service_internal_test_persistence',
    persistedAt: nowIso(),
    cacheKeyHash,
    cacheEntry,
  } satisfies PersistedMockApprovedSnapshotByIdempotencyRecord, null, 2)}\n`
  const byIdContent = `${JSON.stringify({
    recordVersion: 'private-internal-approved-snapshot-v1',
    source: 'approved_snapshot_service_internal_test_persistence',
    persistedAt: nowIso(),
    approvedPlanSnapshot: input.approvedPlanSnapshot,
  } satisfies PersistedMockApprovedSnapshotByIdRecord, null, 2)}\n`
  await writePrivateTextFileAtomicWithinRoot({
    rootPath: input.localStorageRoot,
    relativePath: approvedSnapshotIdempotencyObjectPath(cacheKeyHash),
    content: byIdempotencyContent,
  })
  await writePrivateTextFileAtomicWithinRoot({
    rootPath: input.localStorageRoot,
    relativePath: approvedSnapshotIdObjectPath(String(input.approvedPlanSnapshot.id)),
    content: byIdContent,
  })
}

async function loadMockApprovedSnapshotByIdempotency(
  cacheKey: string,
  localStorageRoot: string,
): Promise<MockApprovedSnapshotCacheEntry | undefined> {
  const cacheKeyHash = hashRegistryKey(cacheKey)
  const content = await readPrivateTextFileIfExistsWithinRoot({
    rootPath: localStorageRoot,
    relativePath: approvedSnapshotIdempotencyObjectPath(cacheKeyHash),
  })
  if (!content) return undefined

  const record = parseJsonObject(content, 'Approved snapshot idempotency registry record') as Partial<PersistedMockApprovedSnapshotByIdempotencyRecord>
  if (
    record.recordVersion !== 'private-internal-approved-snapshot-v1' ||
    record.source !== 'approved_snapshot_service_internal_test_persistence' ||
    record.cacheKeyHash !== cacheKeyHash ||
    !record.cacheEntry
  ) {
    throw new ApiError('VALIDATION_FAILED', 'Approved snapshot idempotency registry record has an unsupported shape.', 400)
  }
  assertMockApprovedSnapshotSafe(record.cacheEntry.approvedPlanSnapshot)
  return record.cacheEntry
}

async function loadMockApprovedSnapshotById(
  snapshotId: string,
  localStorageRoot: string,
): Promise<Record<string, unknown> | undefined> {
  const content = await readPrivateTextFileIfExistsWithinRoot({
    rootPath: localStorageRoot,
    relativePath: approvedSnapshotIdObjectPath(snapshotId),
  })
  if (!content) return undefined

  const record = parseJsonObject(content, 'Approved snapshot registry record') as Partial<PersistedMockApprovedSnapshotByIdRecord>
  if (
    record.recordVersion !== 'private-internal-approved-snapshot-v1' ||
    record.source !== 'approved_snapshot_service_internal_test_persistence' ||
    !record.approvedPlanSnapshot
  ) {
    throw new ApiError('VALIDATION_FAILED', 'Approved snapshot registry record has an unsupported shape.', 400)
  }
  if (record.approvedPlanSnapshot.id !== snapshotId) {
    throw new ApiError('VALIDATION_FAILED', 'Approved snapshot registry ID does not match the requested snapshot.', 400)
  }
  assertMockApprovedSnapshotSafe(record.approvedPlanSnapshot)
  return record.approvedPlanSnapshot
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

function assertMockApprovedSnapshotSafe(approvedPlanSnapshot: Record<string, unknown>): void {
  if (
    typeof approvedPlanSnapshot.id !== 'string' ||
    !approvedPlanSnapshot.id.trim() ||
    typeof approvedPlanSnapshot.approvedByUserId !== 'string' ||
    !approvedPlanSnapshot.approvedByUserId.trim() ||
    approvedPlanSnapshot.snapshotStatus !== 'approved' ||
    approvedPlanSnapshot.mockOnly !== true
  ) {
    throw new ApiError('VALIDATION_FAILED', 'Private internal approved snapshot registry metadata is incomplete.', 400)
  }
  const snapshotJson = approvedPlanSnapshot.snapshotJson
  if (!snapshotJson || typeof snapshotJson !== 'object' || Array.isArray(snapshotJson)) {
    throw new ApiError('VALIDATION_FAILED', 'Private internal approved snapshot registry is missing snapshot JSON.', 400)
  }
  const validation = validateApprovedSnapshotJson(cloneApprovedSnapshotJson(snapshotJson as Record<string, unknown>))
  if (validation.missingSections.length > 0 || validation.secretLikePaths.length > 0) {
    throw new ApiError('VALIDATION_FAILED', 'Private internal approved snapshot registry contains invalid snapshot JSON.', 400, {
      missingSections: validation.missingSections,
      secretLikePaths: validation.secretLikePaths,
    })
  }
}

function assertApprovedSnapshotOwnedByCurrentUser(approvedPlanSnapshot: Record<string, unknown>, userId: string): void {
  if (approvedPlanSnapshot.approvedByUserId !== userId) {
    throw new ApiError('APPROVED_SNAPSHOT_REQUIRED', 'Approved snapshot was not found for this user.', 404, {
      approvedPlanSnapshotId: approvedPlanSnapshot.id,
      workspaceId: approvedPlanSnapshot.workspaceId,
      projectId: approvedPlanSnapshot.projectId,
    })
  }
}

function normalizeApprovedSnapshotRecord(record: unknown): Record<string, unknown> {
  if (!isRecord(record)) {
    throw new ApiError('VALIDATION_FAILED', 'Approved snapshot backend record is not an object.', 400)
  }

  const snapshotJson = readRecordField(record, 'snapshotJson', 'snapshot_json')
  if (!isRecord(snapshotJson)) {
    throw new ApiError('VALIDATION_FAILED', 'Approved snapshot backend record is missing executable snapshot JSON.', 400)
  }

  return {
    id: readRecordField(record, 'id'),
    workspaceId: readRecordField(record, 'workspaceId', 'workspace_id'),
    projectId: readRecordField(record, 'projectId', 'project_id'),
    chatSessionId: readRecordField(record, 'chatSessionId', 'chat_session_id'),
    editPlanId: readRecordField(record, 'editPlanId', 'edit_plan_id', 'edit_plan_version_id'),
    creditEstimateId: readRecordField(record, 'creditEstimateId', 'credit_estimate_id'),
    creditApprovalId: readRecordField(record, 'creditApprovalId', 'credit_approval_id'),
    creditReservationId: readRecordField(record, 'creditReservationId', 'credit_reservation_id'),
    approvedByUserId: readRecordField(record, 'approvedByUserId', 'approved_by_user_id', 'approved_by'),
    snapshotVersion: readRecordField(record, 'snapshotVersion', 'snapshot_version'),
    snapshotStatus: readRecordField(record, 'snapshotStatus', 'snapshot_status', 'status'),
    snapshotJson,
    planHash: readRecordField(record, 'planHash', 'plan_hash'),
    creditHash: readRecordField(record, 'creditHash', 'credit_hash'),
    sourceSequenceHash: readRecordField(record, 'sourceSequenceHash', 'source_sequence_hash'),
    timingHash: readRecordField(record, 'timingHash', 'timing_hash'),
    createdAt: readRecordField(record, 'createdAt', 'created_at'),
    updatedAt: readRecordField(record, 'updatedAt', 'updated_at'),
  }
}

function readRecordField(record: Record<string, unknown>, ...keys: string[]): unknown {
  for (const key of keys) {
    if (record[key] !== undefined) return record[key]
  }
  return undefined
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value))
}

function approvedSnapshotRegistryDirectory(): string {
  return join('approved-snapshots', 'private-internal-approved-snapshot-registry').split('/').join('/')
}

function approvedSnapshotIdempotencyObjectPath(cacheKeyHash: string): string {
  return join(approvedSnapshotRegistryDirectory(), 'by-idempotency', `${safePathPart(cacheKeyHash)}.json`).split('/').join('/')
}

function approvedSnapshotIdObjectPath(snapshotId: string): string {
  return join(approvedSnapshotRegistryDirectory(), 'by-id', `${safePathPart(snapshotId)}.json`).split('/').join('/')
}

function safePathPart(value: string): string {
  return value
    .trim()
    .replace(/[^a-zA-Z0-9._-]/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 160) || 'record'
}

function hashApprovedSnapshotRequest(value: Record<string, unknown>): string {
  return createHash('sha256')
    .update(stableStringify(value))
    .digest('hex')
}

function hashRegistryKey(value: string): string {
  return createHash('sha256')
    .update(value)
    .digest('hex')
}

function stableStringify(value: unknown): string {
  return JSON.stringify(stableJsonValue(value))
}

function stableJsonValue(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(stableJsonValue)
  }

  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .filter(([, nestedValue]) => nestedValue !== undefined)
        .sort(([leftKey], [rightKey]) => leftKey.localeCompare(rightKey))
        .map(([key, nestedValue]) => [key, stableJsonValue(nestedValue)]),
    )
  }

  return value
}

function createAuthenticatedReadClient(context: ServiceContext): SupabaseClient | null {
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

function throwOnApprovedSnapshotRpcError(error: PostgrestError | null): void {
  if (!error) return

  const message = error.message ?? ''
  if (message.includes('AUTH_REQUIRED')) {
    throw new ApiError('AUTH_REQUIRED', 'Approved snapshot creation requires an authenticated approver.', 401)
  }
  if (message.includes('IDEMPOTENCY_KEY_REQUIRED')) {
    throw new ApiError('IDEMPOTENCY_KEY_REQUIRED', 'Idempotency-Key header is required for approved snapshot creation.', 400)
  }
  if (message.includes('IDEMPOTENCY_KEY_REPLAY_CONFLICT') || message.includes('IDEMPOTENCY_KEY_IN_PROGRESS')) {
    throw new ApiError('IDEMPOTENCY_CONFLICT', 'Idempotency-Key was reused with a different or incomplete approved snapshot request.', 409)
  }
  if (message.includes('PLAN_NOT_APPROVED')) {
    throw new ApiError('PLAN_NOT_APPROVED', 'Edit plan must be approved before snapshot creation.', 409)
  }
  if (message.includes('CREDIT_ESTIMATE_NOT_APPROVED')) {
    throw new ApiError('CREDIT_ESTIMATE_NOT_APPROVED', 'Credit estimate and credit approval must be approved before snapshot creation.', 409)
  }
  if (message.includes('CREDITS_NOT_RESERVED')) {
    throw new ApiError('CREDITS_NOT_RESERVED', 'Credits must be actively reserved before snapshot creation.', 409)
  }
  if (message.includes('DUPLICATE_APPROVED_SNAPSHOT_VERSION')) {
    throw new ApiError('VALIDATION_FAILED', 'snapshotVersion already exists for this edit plan.', 409)
  }
  if (message.includes('PROJECT_NOT_FOUND')) {
    throw new ApiError('PROJECT_NOT_FOUND', 'Project was not found for this workspace.', 404)
  }
  if (message.includes('CHAT_SESSION_NOT_FOUND')) {
    throw new ApiError('CHAT_SESSION_NOT_FOUND', 'Chat session was not found for this project.', 404)
  }
  if (message.includes('VALIDATION_FAILED')) {
    throw new ApiError('VALIDATION_FAILED', message.replace(/^VALIDATION_FAILED:\s*/, ''), 400)
  }

  throwOnSupabaseError(error)
}
