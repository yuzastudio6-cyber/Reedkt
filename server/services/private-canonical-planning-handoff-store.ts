import { ApiError } from '../errors/api-error'
import {
  readPrivateTextFileIfExistsWithinRoot,
  writePrivateFileCreateOnlyWithinRoot,
  writePrivateTextFileAtomicWithinRoot,
} from '../security/private-local-persistence'
import {
  canonicalPlanningHandoffResponseSchema,
  type CanonicalPlanningHandoffResponse,
} from '../validation/canonical-planning-handoff-schemas'
import { planningInputAuthorityExpectationFromResolvedBinding } from './planning-input-authority-binding-service'
import { sha256AuthorityValue, stableAuthorityStringify } from './private-edit-authority-store'

const RECORD_VERSION = 'private-canonical-planning-handoff-record-v1' as const
const RECORD_SOURCE = 'private_canonical_planning_handoff_store' as const
const MAX_RECORD_BYTES = 4 * 1024 * 1024
const LATEST_RECORD_VERSION = 'private-canonical-planning-handoff-latest-v1' as const
const LATEST_RECORD_SOURCE = 'private_canonical_planning_handoff_latest_pointer' as const
const MAX_LATEST_RECORD_BYTES = 16 * 1024

export interface CanonicalPlanningHandoffStoreScope {
  localStorageRoot: string
  ownerUserId: string
  workspaceId: string
  projectId: string
  editSessionId: string
}

interface PersistedCanonicalPlanningHandoffRecord {
  recordVersion: typeof RECORD_VERSION
  source: typeof RECORD_SOURCE
  handoff: CanonicalPlanningHandoffResponse
  checksumSha256: string
}

interface PersistedLatestCanonicalPlanningHandoffRecord {
  recordVersion: typeof LATEST_RECORD_VERSION
  source: typeof LATEST_RECORD_SOURCE
  identity: {
    ownerUserId: string
    workspaceId: string
    projectId: string
    editSessionId: string
  }
  handoffId: string
  handoffHash: string
  canonicalPlanComponentsHash: string
  checksumSha256: string
}

export function canonicalPlanningHandoffId(handoffHash: string): string {
  if (!/^[a-f0-9]{64}$/.test(handoffHash)) {
    throw new ApiError('VALIDATION_FAILED', 'Canonical planning handoff hash is invalid.', 400)
  }
  return `planning_handoff_${handoffHash}`
}

export async function persistPrivateCanonicalPlanningHandoff(input: {
  scope: CanonicalPlanningHandoffStoreScope
  handoff: CanonicalPlanningHandoffResponse
}): Promise<{ handoff: CanonicalPlanningHandoffResponse; created: boolean }> {
  assertCanonicalPlanningHandoff(input.scope, input.handoff)
  const record: PersistedCanonicalPlanningHandoffRecord = {
    recordVersion: RECORD_VERSION,
    source: RECORD_SOURCE,
    handoff: input.handoff,
    checksumSha256: sha256AuthorityValue(input.handoff),
  }
  const bytes = Buffer.from(`${stableAuthorityStringify(record)}\n`, 'utf8')
  if (bytes.byteLength > MAX_RECORD_BYTES) {
    throw new ApiError(
      'IDEMPOTENCY_CAPACITY_EXCEEDED',
      'Canonical planning handoff exceeded its private persistence ceiling.',
      503,
      { byteLength: bytes.byteLength, maxBytes: MAX_RECORD_BYTES },
    )
  }
  const persisted = await writePrivateFileCreateOnlyWithinRoot({
    rootPath: input.scope.localStorageRoot,
    relativePath: handoffRecordPath(input.scope, input.handoff.handoffId),
    content: bytes,
  })
  const handoff = await readPrivateCanonicalPlanningHandoff({
    scope: input.scope,
    handoffId: input.handoff.handoffId,
  })
  return { handoff, created: persisted.created }
}

export async function readPrivateCanonicalPlanningHandoff(input: {
  scope: CanonicalPlanningHandoffStoreScope
  handoffId: string
}): Promise<CanonicalPlanningHandoffResponse> {
  if (!safeIdentity(input.handoffId)) {
    throw new ApiError('VALIDATION_FAILED', 'Canonical planning handoff identity is invalid.', 400)
  }
  const content = await readPrivateTextFileIfExistsWithinRoot({
    rootPath: input.scope.localStorageRoot,
    relativePath: handoffRecordPath(input.scope, input.handoffId),
  })
  if (!content) {
    throw new ApiError('PLAN_NOT_APPROVED', 'Canonical planning handoff was not found.', 404)
  }
  const byteLength = Buffer.byteLength(content, 'utf8')
  if (byteLength > MAX_RECORD_BYTES) {
    throw invalidStoredHandoff('Canonical planning handoff exceeded its private persistence ceiling.')
  }

  let value: unknown
  try {
    value = JSON.parse(content)
  } catch {
    throw invalidStoredHandoff('Canonical planning handoff is not valid JSON.')
  }
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw invalidStoredHandoff('Canonical planning handoff envelope is invalid.')
  }
  const record = value as Partial<PersistedCanonicalPlanningHandoffRecord>
  if (
    record.recordVersion !== RECORD_VERSION ||
    record.source !== RECORD_SOURCE ||
    !record.handoff ||
    typeof record.checksumSha256 !== 'string'
  ) {
    throw invalidStoredHandoff('Canonical planning handoff envelope is unsupported.')
  }
  const parsed = canonicalPlanningHandoffResponseSchema.safeParse(record.handoff)
  if (!parsed.success) {
    throw invalidStoredHandoff('Canonical planning handoff shape is invalid.', parsed.error.flatten())
  }
  if (record.checksumSha256 !== sha256AuthorityValue(parsed.data)) {
    throw invalidStoredHandoff('Canonical planning handoff checksum is invalid.')
  }
  assertCanonicalPlanningHandoff(input.scope, parsed.data)
  if (parsed.data.handoffId !== input.handoffId) {
    throw invalidStoredHandoff('Canonical planning handoff path identity is invalid.')
  }
  return parsed.data
}

export async function persistLatestPrivateCanonicalPlanningHandoff(input: {
  scope: CanonicalPlanningHandoffStoreScope
  handoff: CanonicalPlanningHandoffResponse
}): Promise<void> {
  assertCanonicalPlanningHandoff(input.scope, input.handoff)
  const withoutChecksum = {
    recordVersion: LATEST_RECORD_VERSION,
    source: LATEST_RECORD_SOURCE,
    identity: {
      ownerUserId: input.scope.ownerUserId,
      workspaceId: input.scope.workspaceId,
      projectId: input.scope.projectId,
      editSessionId: input.scope.editSessionId,
    },
    handoffId: input.handoff.handoffId,
    handoffHash: input.handoff.handoffHash,
    canonicalPlanComponentsHash: input.handoff.canonicalPlanComponentsHash,
  }
  const record: PersistedLatestCanonicalPlanningHandoffRecord = {
    ...withoutChecksum,
    checksumSha256: sha256AuthorityValue(withoutChecksum),
  }
  const content = `${stableAuthorityStringify(record)}\n`
  if (Buffer.byteLength(content, 'utf8') > MAX_LATEST_RECORD_BYTES) {
    throw new ApiError(
      'IDEMPOTENCY_CAPACITY_EXCEEDED',
      'Latest canonical planning handoff pointer exceeded its private persistence ceiling.',
      503,
    )
  }
  await writePrivateTextFileAtomicWithinRoot({
    rootPath: input.scope.localStorageRoot,
    relativePath: latestHandoffRecordPath(input.scope),
    content,
  })
}

export async function readLatestPrivateCanonicalPlanningHandoff(
  scope: CanonicalPlanningHandoffStoreScope,
): Promise<CanonicalPlanningHandoffResponse | undefined> {
  const content = await readPrivateTextFileIfExistsWithinRoot({
    rootPath: scope.localStorageRoot,
    relativePath: latestHandoffRecordPath(scope),
  })
  if (!content) return undefined
  if (Buffer.byteLength(content, 'utf8') > MAX_LATEST_RECORD_BYTES) {
    throw invalidStoredHandoff('Latest canonical planning handoff pointer exceeded its private persistence ceiling.')
  }
  let value: unknown
  try {
    value = JSON.parse(content)
  } catch {
    throw invalidStoredHandoff('Latest canonical planning handoff pointer is not valid JSON.')
  }
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw invalidStoredHandoff('Latest canonical planning handoff pointer envelope is invalid.')
  }
  const record = value as Partial<PersistedLatestCanonicalPlanningHandoffRecord>
  const withoutChecksum = {
    recordVersion: record.recordVersion,
    source: record.source,
    identity: record.identity,
    handoffId: record.handoffId,
    handoffHash: record.handoffHash,
    canonicalPlanComponentsHash: record.canonicalPlanComponentsHash,
  }
  if (
    record.recordVersion !== LATEST_RECORD_VERSION ||
    record.source !== LATEST_RECORD_SOURCE ||
    !record.identity ||
    record.identity.ownerUserId !== scope.ownerUserId ||
    record.identity.workspaceId !== scope.workspaceId ||
    record.identity.projectId !== scope.projectId ||
    record.identity.editSessionId !== scope.editSessionId ||
    typeof record.handoffId !== 'string' ||
    typeof record.handoffHash !== 'string' ||
    typeof record.canonicalPlanComponentsHash !== 'string' ||
    typeof record.checksumSha256 !== 'string' ||
    record.checksumSha256 !== sha256AuthorityValue(withoutChecksum)
  ) {
    throw invalidStoredHandoff('Latest canonical planning handoff pointer integrity is invalid.')
  }
  const handoff = await readPrivateCanonicalPlanningHandoff({
    scope,
    handoffId: record.handoffId,
  })
  if (
    handoff.handoffHash !== record.handoffHash ||
    handoff.canonicalPlanComponentsHash !== record.canonicalPlanComponentsHash
  ) {
    throw invalidStoredHandoff('Latest canonical planning handoff pointer target is inconsistent.')
  }
  return handoff
}

function assertCanonicalPlanningHandoff(
  scope: CanonicalPlanningHandoffStoreScope,
  handoff: CanonicalPlanningHandoffResponse,
): void {
  const parsed = canonicalPlanningHandoffResponseSchema.safeParse(handoff)
  if (!parsed.success) {
    throw new ApiError('VALIDATION_FAILED', 'Canonical planning handoff shape is invalid.', 400, parsed.error.flatten())
  }
  if (
    handoff.identity.workspaceId !== scope.workspaceId ||
    handoff.identity.projectId !== scope.projectId ||
    handoff.identity.editSessionId !== scope.editSessionId
  ) {
    throw invalidStoredHandoff('Canonical planning handoff tenancy scope is invalid.')
  }
  const { handoffHash, handoffId, persistence, ...hashInput } = handoff
  if (
    handoffHash !== sha256AuthorityValue(hashInput) ||
    handoffId !== canonicalPlanningHandoffId(handoffHash)
  ) {
    throw invalidStoredHandoff('Canonical planning handoff content identity is invalid.')
  }
  const candidate = handoff.sourceBindingManifestCandidate
  if (stableAuthorityStringify(handoff.sourceMediaAuthority) !== stableAuthorityStringify({
    authorityRevision: candidate.authorityRevision,
    authorityChecksumSha256: candidate.authorityChecksumSha256,
    sourceSequenceHash: candidate.sourceSequenceHash,
    candidateHash: candidate.candidateHash,
  })) {
    throw invalidStoredHandoff('Canonical planning handoff source authority is inconsistent.')
  }
  if (
    stableAuthorityStringify(handoff.planningInputAuthority) !==
    stableAuthorityStringify(
      planningInputAuthorityExpectationFromResolvedBinding(handoff.resolvedPlanningInputAuthority),
    )
  ) {
    throw invalidStoredHandoff('Canonical planning handoff planning-input authority is inconsistent.')
  }
  if (
    persistence.privateLocal !== true ||
    persistence.tenantScoped !== true ||
    persistence.createOnly !== true ||
    persistence.checksumProtected !== true ||
    persistence.contentAddressed !== true ||
    persistence.distributed !== false ||
    persistence.productionAuthority !== false
  ) {
    throw invalidStoredHandoff('Canonical planning handoff persistence evidence is invalid.')
  }
}

function handoffRecordPath(scope: CanonicalPlanningHandoffStoreScope, handoffId: string): string {
  return [
    'canonical-planning-handoffs',
    'private-internal-v1',
    `scope-${handoffScopeHash(scope)}`,
    `${handoffId}.json`,
  ].join('/')
}

function latestHandoffRecordPath(scope: CanonicalPlanningHandoffStoreScope): string {
  return [
    'canonical-planning-handoffs',
    'private-internal-v1',
    `scope-${handoffScopeHash(scope)}`,
    'latest.json',
  ].join('/')
}

function handoffScopeHash(scope: CanonicalPlanningHandoffStoreScope): string {
  return sha256AuthorityValue({
    ownerUserId: scope.ownerUserId,
    workspaceId: scope.workspaceId,
    projectId: scope.projectId,
    editSessionId: scope.editSessionId,
  })
}

function safeIdentity(value: string): boolean {
  return /^[A-Za-z0-9][A-Za-z0-9._:-]{0,199}$/.test(value) && !value.includes('..')
}

function invalidStoredHandoff(message: string, details?: unknown): ApiError {
  return new ApiError('VALIDATION_FAILED', message, 409, details)
}
