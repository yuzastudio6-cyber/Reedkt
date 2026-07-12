import { ApiError } from '../errors/api-error'
import {
  readPrivateTextFileIfExistsWithinRoot,
  writePrivateFileCreateOnlyWithinRoot,
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

function safeIdentity(value: string): boolean {
  return /^[A-Za-z0-9][A-Za-z0-9._:-]{0,199}$/.test(value) && !value.includes('..')
}

function invalidCandidate(message: string): ApiError {
  return new ApiError('IDEMPOTENCY_CONFLICT', message, 409, {
    requiredGate: 'checksum_verified_canonical_publication_request_candidate',
  })
}
