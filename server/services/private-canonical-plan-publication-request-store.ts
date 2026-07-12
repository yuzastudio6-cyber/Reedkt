import { ApiError } from '../errors/api-error'
import {
  readPrivateTextFileIfExistsWithinRoot,
  writePrivateFileCreateOnlyWithinRoot,
  writePrivateTextFileAtomicWithinRoot,
} from '../security/private-local-persistence'
import {
  publishCanonicalEditPlanFromHandoffSchema,
  type PublishCanonicalEditPlanFromHandoffBody,
} from '../validation/canonical-planning-handoff-schemas'
import type { CanonicalPlanningHandoffStoreScope } from './private-canonical-planning-handoff-store'
import { sha256AuthorityValue, stableAuthorityStringify } from './private-edit-authority-store'

const RECORD_VERSION = 'private-canonical-plan-publication-request-v1' as const
const RECORD_SOURCE = 'private_canonical_plan_publication_request_store' as const
const MAX_RECORD_BYTES = 8 * 1024 * 1024
const LATEST_RECORD_VERSION = 'private-canonical-plan-publication-request-latest-v1' as const
const LATEST_RECORD_SOURCE = 'private_canonical_plan_publication_request_latest_pointer' as const
const MAX_LATEST_RECORD_BYTES = 16 * 1024

export interface CanonicalPlanPublicationRequestCandidateRecord {
  schemaVersion: 'canonical-plan-publication-request-candidate-v1'
  source: 'canonical_plan_publication_request_service'
  identity: {
    workspaceId: string
    projectId: string
    editSessionId: string
    handoffId: string
  }
  candidateId: string
  candidateHash: string
  handoffHash: string
  canonicalPlanComponentsHash: string
  publicationBodyHash: string
  publicationRequestHash: string
  requestBody: PublishCanonicalEditPlanFromHandoffBody
}

interface PersistedCanonicalPlanPublicationRequestRecord {
  recordVersion: typeof RECORD_VERSION
  source: typeof RECORD_SOURCE
  ownerUserId: string
  candidate: CanonicalPlanPublicationRequestCandidateRecord
  checksumSha256: string
}

interface PersistedLatestCanonicalPlanPublicationRequestRecord {
  recordVersion: typeof LATEST_RECORD_VERSION
  source: typeof LATEST_RECORD_SOURCE
  identity: {
    ownerUserId: string
    workspaceId: string
    projectId: string
    editSessionId: string
    handoffId: string
  }
  candidateId: string
  candidateHash: string
  publicationRequestHash: string
  checksumSha256: string
}

export function canonicalPlanPublicationRequestCandidateId(candidateHash: string): string {
  if (!/^[a-f0-9]{64}$/.test(candidateHash)) {
    throw new ApiError('VALIDATION_FAILED', 'Canonical publication request candidate hash is invalid.', 400)
  }
  return `publication_request_${candidateHash}`
}

export async function persistPrivateCanonicalPlanPublicationRequest(input: {
  scope: CanonicalPlanningHandoffStoreScope
  candidate: CanonicalPlanPublicationRequestCandidateRecord
}): Promise<{ candidate: CanonicalPlanPublicationRequestCandidateRecord; created: boolean }> {
  assertCandidate(input.scope, input.candidate)
  const record: PersistedCanonicalPlanPublicationRequestRecord = {
    recordVersion: RECORD_VERSION,
    source: RECORD_SOURCE,
    ownerUserId: input.scope.ownerUserId,
    candidate: input.candidate,
    checksumSha256: sha256AuthorityValue(input.candidate),
  }
  const content = `${stableAuthorityStringify(record)}\n`
  const byteLength = Buffer.byteLength(content, 'utf8')
  if (byteLength > MAX_RECORD_BYTES) {
    throw new ApiError(
      'IDEMPOTENCY_CAPACITY_EXCEEDED',
      'Canonical publication request candidate exceeded its private persistence ceiling.',
      503,
      { byteLength, maxBytes: MAX_RECORD_BYTES },
    )
  }
  const persisted = await writePrivateFileCreateOnlyWithinRoot({
    rootPath: input.scope.localStorageRoot,
    relativePath: candidateRecordPath(input.scope, input.candidate.candidateId),
    content: Buffer.from(content, 'utf8'),
  })
  return {
    candidate: await readPrivateCanonicalPlanPublicationRequest({
      scope: input.scope,
      candidateId: input.candidate.candidateId,
    }),
    created: persisted.created,
  }
}

export async function readPrivateCanonicalPlanPublicationRequest(input: {
  scope: CanonicalPlanningHandoffStoreScope
  candidateId: string
}): Promise<CanonicalPlanPublicationRequestCandidateRecord> {
  if (!safeIdentity(input.candidateId)) {
    throw new ApiError('VALIDATION_FAILED', 'Canonical publication request candidate identity is invalid.', 400)
  }
  const content = await readPrivateTextFileIfExistsWithinRoot({
    rootPath: input.scope.localStorageRoot,
    relativePath: candidateRecordPath(input.scope, input.candidateId),
  })
  if (!content) {
    throw new ApiError('PLAN_NOT_APPROVED', 'Canonical publication request candidate was not found.', 404)
  }
  if (Buffer.byteLength(content, 'utf8') > MAX_RECORD_BYTES) {
    throw invalidCandidate('Canonical publication request candidate exceeded its private persistence ceiling.')
  }

  let value: unknown
  try {
    value = JSON.parse(content)
  } catch {
    throw invalidCandidate('Canonical publication request candidate is not valid JSON.')
  }
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw invalidCandidate('Canonical publication request candidate envelope is invalid.')
  }
  const record = value as Partial<PersistedCanonicalPlanPublicationRequestRecord>
  if (
    record.recordVersion !== RECORD_VERSION ||
    record.source !== RECORD_SOURCE ||
    record.ownerUserId !== input.scope.ownerUserId ||
    !record.candidate ||
    typeof record.checksumSha256 !== 'string' ||
    record.checksumSha256 !== sha256AuthorityValue(record.candidate)
  ) {
    throw invalidCandidate('Canonical publication request candidate integrity is invalid.')
  }
  assertCandidate(input.scope, record.candidate)
  if (record.candidate.candidateId !== input.candidateId) {
    throw invalidCandidate('Canonical publication request candidate path identity is invalid.')
  }
  return record.candidate
}

export async function persistLatestPrivateCanonicalPlanPublicationRequest(input: {
  scope: CanonicalPlanningHandoffStoreScope
  candidate: CanonicalPlanPublicationRequestCandidateRecord
}): Promise<void> {
  assertCandidate(input.scope, input.candidate)
  const withoutChecksum = {
    recordVersion: LATEST_RECORD_VERSION,
    source: LATEST_RECORD_SOURCE,
    identity: {
      ownerUserId: input.scope.ownerUserId,
      workspaceId: input.scope.workspaceId,
      projectId: input.scope.projectId,
      editSessionId: input.scope.editSessionId,
      handoffId: input.candidate.identity.handoffId,
    },
    candidateId: input.candidate.candidateId,
    candidateHash: input.candidate.candidateHash,
    publicationRequestHash: input.candidate.publicationRequestHash,
  }
  const record: PersistedLatestCanonicalPlanPublicationRequestRecord = {
    ...withoutChecksum,
    checksumSha256: sha256AuthorityValue(withoutChecksum),
  }
  const content = `${stableAuthorityStringify(record)}\n`
  if (Buffer.byteLength(content, 'utf8') > MAX_LATEST_RECORD_BYTES) {
    throw new ApiError(
      'IDEMPOTENCY_CAPACITY_EXCEEDED',
      'Latest canonical publication request pointer exceeded its private persistence ceiling.',
      503,
    )
  }
  await writePrivateTextFileAtomicWithinRoot({
    rootPath: input.scope.localStorageRoot,
    relativePath: latestCandidateRecordPath(
      input.scope,
      input.candidate.identity.handoffId,
    ),
    content,
  })
}

export async function readLatestPrivateCanonicalPlanPublicationRequest(input: {
  scope: CanonicalPlanningHandoffStoreScope
  handoffId: string
}): Promise<CanonicalPlanPublicationRequestCandidateRecord | undefined> {
  if (!safeIdentity(input.handoffId)) {
    throw new ApiError('VALIDATION_FAILED', 'Canonical planning handoff identity is invalid.', 400)
  }
  const content = await readPrivateTextFileIfExistsWithinRoot({
    rootPath: input.scope.localStorageRoot,
    relativePath: latestCandidateRecordPath(input.scope, input.handoffId),
  })
  if (!content) return undefined
  if (Buffer.byteLength(content, 'utf8') > MAX_LATEST_RECORD_BYTES) {
    throw invalidCandidate('Latest canonical publication request pointer exceeded its private persistence ceiling.')
  }
  let value: unknown
  try {
    value = JSON.parse(content)
  } catch {
    throw invalidCandidate('Latest canonical publication request pointer is not valid JSON.')
  }
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw invalidCandidate('Latest canonical publication request pointer envelope is invalid.')
  }
  const record = value as Partial<PersistedLatestCanonicalPlanPublicationRequestRecord>
  const withoutChecksum = {
    recordVersion: record.recordVersion,
    source: record.source,
    identity: record.identity,
    candidateId: record.candidateId,
    candidateHash: record.candidateHash,
    publicationRequestHash: record.publicationRequestHash,
  }
  if (
    record.recordVersion !== LATEST_RECORD_VERSION ||
    record.source !== LATEST_RECORD_SOURCE ||
    !record.identity ||
    record.identity.ownerUserId !== input.scope.ownerUserId ||
    record.identity.workspaceId !== input.scope.workspaceId ||
    record.identity.projectId !== input.scope.projectId ||
    record.identity.editSessionId !== input.scope.editSessionId ||
    record.identity.handoffId !== input.handoffId ||
    typeof record.candidateId !== 'string' ||
    typeof record.candidateHash !== 'string' ||
    typeof record.publicationRequestHash !== 'string' ||
    typeof record.checksumSha256 !== 'string' ||
    record.checksumSha256 !== sha256AuthorityValue(withoutChecksum)
  ) {
    throw invalidCandidate('Latest canonical publication request pointer integrity is invalid.')
  }
  const candidate = await readPrivateCanonicalPlanPublicationRequest({
    scope: input.scope,
    candidateId: record.candidateId,
  })
  if (
    candidate.identity.handoffId !== input.handoffId ||
    candidate.candidateHash !== record.candidateHash ||
    candidate.publicationRequestHash !== record.publicationRequestHash
  ) {
    throw invalidCandidate('Latest canonical publication request pointer target is inconsistent.')
  }
  return candidate
}

function assertCandidate(
  scope: CanonicalPlanningHandoffStoreScope,
  candidate: CanonicalPlanPublicationRequestCandidateRecord,
): void {
  const parsedBody = publishCanonicalEditPlanFromHandoffSchema.safeParse(candidate.requestBody)
  const { candidateId, candidateHash, ...hashInput } = candidate
  if (
    candidate.schemaVersion !== 'canonical-plan-publication-request-candidate-v1' ||
    candidate.source !== 'canonical_plan_publication_request_service' ||
    candidate.identity.workspaceId !== scope.workspaceId ||
    candidate.identity.projectId !== scope.projectId ||
    candidate.identity.editSessionId !== scope.editSessionId ||
    !safeIdentity(candidate.identity.handoffId) ||
    !parsedBody.success ||
    candidate.requestBody.workspaceId !== scope.workspaceId ||
    candidate.requestBody.expectedHandoffHash !== candidate.handoffHash ||
    candidate.publicationBodyHash !== sha256AuthorityValue(candidate.requestBody) ||
    candidateHash !== sha256AuthorityValue(hashInput) ||
    candidateId !== canonicalPlanPublicationRequestCandidateId(candidateHash) ||
    !/^[a-f0-9]{64}$/.test(candidate.handoffHash) ||
    !/^[a-f0-9]{64}$/.test(candidate.canonicalPlanComponentsHash) ||
    !/^[a-f0-9]{64}$/.test(candidate.publicationRequestHash)
  ) {
    throw invalidCandidate('Canonical publication request candidate content identity is invalid.')
  }
}

function candidateRecordPath(
  scope: CanonicalPlanningHandoffStoreScope,
  candidateId: string,
): string {
  const scopeHash = sha256AuthorityValue({
    ownerUserId: scope.ownerUserId,
    workspaceId: scope.workspaceId,
    projectId: scope.projectId,
    editSessionId: scope.editSessionId,
  })
  return [
    'canonical-plan-publication-requests',
    'private-internal-v1',
    `scope-${scopeHash}`,
    `${candidateId}.json`,
  ].join('/')
}

function latestCandidateRecordPath(
  scope: CanonicalPlanningHandoffStoreScope,
  handoffId: string,
): string {
  const scopeHash = sha256AuthorityValue({
    ownerUserId: scope.ownerUserId,
    workspaceId: scope.workspaceId,
    projectId: scope.projectId,
    editSessionId: scope.editSessionId,
  })
  const handoffHash = sha256AuthorityValue({ handoffId })
  return [
    'canonical-plan-publication-requests',
    'private-internal-v1',
    `scope-${scopeHash}`,
    `latest-${handoffHash}.json`,
  ].join('/')
}

function safeIdentity(value: string): boolean {
  return /^[A-Za-z0-9][A-Za-z0-9._:-]{0,199}$/.test(value) && !value.includes('..')
}

function invalidCandidate(message: string): ApiError {
  return new ApiError('IDEMPOTENCY_CONFLICT', message, 409, {
    requiredGate: 'checksum_verified_canonical_publication_request_candidate',
  })
}
