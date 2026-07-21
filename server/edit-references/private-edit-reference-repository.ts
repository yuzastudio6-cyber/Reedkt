import { createHash, randomUUID } from 'node:crypto'
import { constants } from 'node:fs'
import { chmod, lstat, mkdir, open, readdir, rename, rm } from 'node:fs/promises'
import { dirname, relative, resolve, sep } from 'node:path'
import {
  EDIT_REFERENCE_DNA_QA_CHECK_IDS,
  EDIT_REFERENCE_DNA_QA_V1_CHECK_IDS,
  type EditReferenceDetailData,
} from '../../src/types/edit-reference'
import { createPreferenceApplicationDownstreamContext } from '../../src/lib/edit-reference-downstream-context'
import { PREFERENCE_APPLICATION_INTEGRATION_SAFETY_FLAGS } from '../../src/types/edit-reference-integration'
import { ApiError } from '../errors/api-error'
import {
  EDIT_REFERENCE_APPLICATION_PRECEDENCE_POLICY,
  calculatePreferenceApplicationContentDigest,
  calculatePreferenceApplicationTargetContextDigest,
} from './edit-reference-target-adaptation'
import {
  EDIT_REFERENCE_AGGREGATE_VERSION,
  EDIT_REFERENCE_IDEMPOTENCY_RECEIPT_VERSION,
  type EditReferenceAggregate,
  type EditReferenceAuditEvent,
  type EditReferenceIdempotencyReceipt,
  type EditReferenceMutationInput,
  type EditReferenceMutationResult,
  type EditReferenceRepository,
  type EditReferenceRepositoryScope,
} from './edit-reference-repository'
import { validateEditReferenceTechnicalStudyUsage } from './edit-reference-technical-study-usage-contract'
import {
  EDIT_REFERENCE_STUDY_CHAT_REASONING_ATTEMPT_STATES,
  EDIT_REFERENCE_STUDY_CHAT_REASONING_ATTEMPT_VERSION,
  type EditReferenceStudyChatReasoningAttemptRecord,
} from './edit-reference-study-chat-reasoning-attempt-contract'
import {
  EDIT_REFERENCE_STUDY_CHAT_PROVIDER_REQUEST_STATES,
  EDIT_REFERENCE_STUDY_CHAT_PROVIDER_REQUEST_VERSION,
  type EditReferenceStudyChatProviderRequestRecord,
} from './edit-reference-study-chat-provider-request-contract'
import {
  EDIT_REFERENCE_STUDY_CHAT_PROVIDER_CHECKBACK_OUTCOMES,
  EDIT_REFERENCE_STUDY_CHAT_PROVIDER_CHECKBACK_STATES,
  EDIT_REFERENCE_STUDY_CHAT_PROVIDER_CHECKBACK_VERSION,
  isEditReferenceStudyChatProviderCheckbackSha256,
  type EditReferenceStudyChatProviderCheckbackRecord,
} from './edit-reference-study-chat-provider-checkback-contract'
import {
  hashEditReferenceStudyChatReasoningRequest,
  validateEditReferenceStudyChatReasoningRequest,
  validateEditReferenceStudyChatReasoningResult,
} from './edit-reference-study-chat-reasoning-contract'
import {
  validateEditReferenceStudyChatInternalCostAuthorityRecord,
  type EditReferenceStudyChatInternalCostAuthorityRecord,
} from './edit-reference-study-chat-internal-cost-authority-contract'
import {
  validateEditReferenceStudyChatProviderWorkflowRecord,
  type EditReferenceStudyChatProviderWorkflowRecord,
} from './edit-reference-study-chat-provider-workflow-contract'
import {
  validateEditReferencePreferenceDnaReasoningAttemptRecord,
  type EditReferencePreferenceDnaReasoningAttemptRecord,
} from './edit-reference-preference-dna-reasoning-attempt-contract'
import { calculateEditReferenceDNAContentDigest } from './edit-reference-dna-synthesis'
import {
  EDIT_REFERENCE_QWEN_DNA_SYNTHESIS_VERSION,
  validateEditReferenceQwenDnaVersionAttemptBinding,
} from './edit-reference-preference-dna-candidate-materialization'
import { validateEditReferencePreferenceDnaReasoningApprovalSnapshot } from './edit-reference-preference-dna-approval'
import { validatePreferenceLongFormStudySummary } from './edit-reference-long-form-study-binding'

const RECORD_VERSION = 'edit-reference-private-envelope-v2' as const
const LEGACY_RECORD_VERSION = 'edit-reference-private-envelope-v1' as const
const LEGACY_AGGREGATE_VERSION = 'edit-reference-private-v1' as const
const RECORD_SOURCE = 'edit_reference_private_repository' as const
const JOURNAL_MANIFEST_VERSION = 'edit-reference-private-journal-manifest-v1' as const
const JOURNAL_SEGMENT_VERSION = 'edit-reference-private-journal-segment-v1' as const
const TRANSACTION_VERSION = 'edit-reference-private-transaction-v1' as const
const DIRECTORY_MODE = 0o700
const FILE_MODE = 0o600
const MAX_AGGREGATE_BYTES = 8 * 1024 * 1024
const MAX_REFERENCES = 200
const MAX_STUDIES = 1_000
const MAX_MESSAGES = 10_000
const MAX_REASONING_ATTEMPTS = 5_000
const MAX_REASONING_PROVIDER_REQUESTS = 5_000
const MAX_REASONING_PROVIDER_CHECKBACKS = 5_000
const MAX_REASONING_PROVIDER_WORKFLOWS = 5_000
const MAX_REASONING_INTERNAL_COST_AUTHORITIES = 5_000
const MAX_PREFERENCE_DNA_REASONING_ATTEMPTS = 5_000
const MAX_EVIDENCE_RECORDS = 5_000
const MAX_ASSET_RECORDS = 2_000
const MAX_SKILL_RUNS = 5_000
const MAX_DNA_VERSIONS = 2_000
const MAX_DNA_QA_RESULTS = 2_000
const MAX_APPLICATIONS = 2_000
const MAX_DNA_INPUTS_PER_VERSION = 128
const MAX_DNA_RULES_PER_VERSION = 256
const MAX_DNA_CONFLICTS_PER_VERSION = 128
const MAX_HOT_IDEMPOTENCY_RECEIPTS = 128
const IDEMPOTENCY_COMPACTION_BATCH = 64
const MAX_JOURNAL_SEGMENT_ENTRIES = 128
const MAX_JOURNAL_SEGMENTS = 100_000
const MAX_JOURNAL_FILE_BYTES = 4 * 1024 * 1024
const MAX_TRANSACTION_BYTES = MAX_AGGREGATE_BYTES + MAX_JOURNAL_FILE_BYTES

interface PersistedEnvelope {
  recordVersion: typeof RECORD_VERSION
  source: typeof RECORD_SOURCE
  aggregate: EditReferenceAggregate
  checksumSha256: string
}

type JournalKind = 'audit' | 'idempotency'
type JournalEntry = EditReferenceAuditEvent | EditReferenceIdempotencyReceipt

interface JournalSegmentDescriptor {
  segmentNumber: number
  fileName: string
  firstSequence: number
  lastSequence: number
  entryCount: number
  checksumSha256: string
}

interface JournalManifestPayload {
  recordVersion: typeof JOURNAL_MANIFEST_VERSION
  source: typeof RECORD_SOURCE
  journalKind: JournalKind
  scopeHash: string
  entryCount: number
  lastSequence: number
  segments: JournalSegmentDescriptor[]
  updatedAt: string
}

interface PersistedJournalManifest extends JournalManifestPayload {
  checksumSha256: string
}

interface JournalSegmentPayload {
  recordVersion: typeof JOURNAL_SEGMENT_VERSION
  source: typeof RECORD_SOURCE
  journalKind: JournalKind
  scopeHash: string
  segmentNumber: number
  previousSegmentChecksumSha256?: string
  entries: JournalEntry[]
}

interface PersistedJournalSegment extends JournalSegmentPayload {
  checksumSha256: string
}

interface PersistenceTransactionPayload {
  recordVersion: typeof TRANSACTION_VERSION
  source: typeof RECORD_SOURCE
  transactionId: string
  scopeHash: string
  targetRevision: number
  aggregate: EditReferenceAggregate
  auditEvents: EditReferenceAuditEvent[]
  archivedIdempotencyReceipts: EditReferenceIdempotencyReceipt[]
  createdAt: string
}

interface PersistedPersistenceTransaction extends PersistenceTransactionPayload {
  checksumSha256: string
}

const scopeLocks = new Map<string, Promise<void>>()

export class PrivateEditReferenceRepository implements EditReferenceRepository {
  readonly persistence = 'backend_local_private' as const

  async read(scope: EditReferenceRepositoryScope): Promise<EditReferenceAggregate | undefined> {
    return withScopeLock(scope, () => readAggregate(scope))
  }

  async readAuditEvents(scope: EditReferenceRepositoryScope): Promise<EditReferenceAuditEvent[]> {
    return withScopeLock(scope, async () => {
      const aggregate = await readAggregate(scope)
      if (!aggregate) return []
      const journal = await readJournal(scope, 'audit')
      assertJournalMatchesState(journal.entries, aggregate.auditState.eventCount, aggregate.auditState.lastSequence, 'audit')
      return clone(journal.entries as EditReferenceAuditEvent[])
    })
  }

  async mutate(input: EditReferenceMutationInput): Promise<EditReferenceMutationResult> {
    return withScopeLock(input.scope, async () => {
      const existing = await readAggregate(input.scope)
      const aggregate = existing ? clone(existing) : createAggregate(input.scope)
      const idempotencyKeyHashSha256 = sha256(input.idempotencyKey)
      const keyCollision = await findIdempotencyReceipt(input.scope, aggregate, idempotencyKeyHashSha256)
      if (keyCollision) {
        if (keyCollision.operation !== input.operation || keyCollision.requestHashSha256 !== input.requestHash) {
          throw new ApiError(
            'IDEMPOTENCY_CONFLICT',
            'The idempotency key was already committed for a different Edit Reference request.',
            409,
            { operation: keyCollision.operation, committedRevision: keyCollision.committedRevision },
          )
        }
        const data = input.replay({ aggregate: clone(aggregate), receipt: clone(keyCollision) })
        assertReplayResult(data, keyCollision)
        return { data: clone(data), replayed: true }
      }

      const nextRevision = aggregate.revision + 1
      const now = new Date().toISOString()
      const stableIdsBeforeMutation = collectAggregateStableIds(aggregate)
      const pendingAuditEvents: EditReferenceAuditEvent[] = []
      const data = await input.mutate({
        now,
        actorUserId: input.scope.ownerUserId,
        aggregate,
        addAuditEvent: (event) => pendingAuditEvents.push({
          ...event,
          id: `edit-reference-audit-${randomUUID()}`,
          sequence: aggregate.auditState.lastSequence + pendingAuditEvents.length + 1,
          actorUserId: input.scope.ownerUserId,
          aggregateRevision: nextRevision,
          createdAt: now,
        }),
      })

      aggregate.revision = nextRevision
      aggregate.updatedAt = now
      aggregate.auditState.eventCount += pendingAuditEvents.length
      aggregate.auditState.lastSequence += pendingAuditEvents.length
      const receiptSequence = aggregate.idempotencyState.lastSequence + 1
      const receipt: EditReferenceIdempotencyReceipt = {
        receiptVersion: EDIT_REFERENCE_IDEMPOTENCY_RECEIPT_VERSION,
        receiptId: stableId('edit-reference-idempotency-receipt', {
          scopeHash: aggregate.scopeHash,
          idempotencyKeyHashSha256,
          receiptSequence,
        }),
        ledgerSequence: receiptSequence,
        operation: input.operation,
        idempotencyKeyHashSha256,
        requestHashSha256: input.requestHash,
        result: createIdempotencyResultPointer(data, stableIdsBeforeMutation, aggregate),
        committedRevision: nextRevision,
        completedAt: now,
      }
      aggregate.idempotencyReceipts.push(receipt)
      aggregate.idempotencyState.receiptCount += 1
      aggregate.idempotencyState.lastSequence = receiptSequence
      const archivedIdempotencyReceipts = compactIdempotencyReceipts(aggregate)
      assertAggregate(aggregate, input.scope)
      await commitPersistenceTransaction(input.scope, aggregate, pendingAuditEvents, archivedIdempotencyReceipts, now)
      return { data: clone(data), replayed: false }
    })
  }
}

export function hashEditReferenceRequest(value: unknown): string {
  return sha256(stableStringify(value))
}

export function editReferenceScopeHash(ownerUserId: string, workspaceId: string): string {
  return sha256(`${ownerUserId}\u0000${workspaceId}`)
}

export function clearEditReferenceRepositoryProcessStateForSmoke(): void {
  scopeLocks.clear()
}

function createAggregate(scope: EditReferenceRepositoryScope): EditReferenceAggregate {
  const now = new Date().toISOString()
  return {
    schemaVersion: EDIT_REFERENCE_AGGREGATE_VERSION,
    ownerUserId: scope.ownerUserId,
    workspaceId: scope.workspaceId,
    scopeHash: editReferenceScopeHash(scope.ownerUserId, scope.workspaceId),
    revision: 0,
    references: [],
    studies: [],
    messages: [],
    reasoningAttempts: [],
    reasoningProviderRequests: [],
    reasoningProviderCheckbacks: [],
    reasoningProviderWorkflows: [],
    reasoningInternalCostAuthorities: [],
    preferenceDnaReasoningAttempts: [],
    evidence: [],
    assets: [],
    skillRuns: [],
    dnaVersions: [],
    dnaQaResults: [],
    applications: [],
    usageLogs: [],
    auditState: { eventCount: 0, lastSequence: 0 },
    idempotencyState: { receiptCount: 0, lastSequence: 0, archivedReceiptCount: 0, compactionCount: 0 },
    idempotencyReceipts: [],
    createdAt: now,
    updatedAt: now,
    privateInternalOnly: true,
  }
}

async function readAggregate(scope: EditReferenceRepositoryScope): Promise<EditReferenceAggregate | undefined> {
  await recoverPendingTransaction(scope)
  const aggregate = await readAggregateRaw(scope)
  if (!aggregate) return undefined
  const auditJournal = await readJournal(scope, 'audit')
  assertJournalMatchesState(
    auditJournal.entries,
    aggregate.auditState.eventCount,
    aggregate.auditState.lastSequence,
    'audit',
  )
  const idempotencyJournal = await readJournal(scope, 'idempotency')
  assertJournalMatchesState(
    idempotencyJournal.entries,
    aggregate.idempotencyState.archivedReceiptCount,
    aggregate.idempotencyState.archivedReceiptCount,
    'idempotency',
  )
  return clone(aggregate)
}

async function readAggregateRaw(scope: EditReferenceRepositoryScope): Promise<EditReferenceAggregate | undefined> {
  const target = pathsFor(scope)
  const bytes = await readPrivateFile(target.root, target.aggregateFile, MAX_AGGREGATE_BYTES)
  if (!bytes) return undefined

  let parsed: unknown
  try {
    parsed = JSON.parse(bytes.toString('utf8'))
  } catch {
    throw invalidAggregate('aggregate_is_not_valid_json')
  }
  if (!isRecord(parsed)) throw invalidAggregate('aggregate_envelope_is_not_an_object')
  const envelope = parsed as Record<string, unknown>
  if (envelope.recordVersion === LEGACY_RECORD_VERSION) {
    if (
      envelope.source !== RECORD_SOURCE
      || !isRecord(envelope.aggregate)
      || typeof envelope.checksumSha256 !== 'string'
      || envelope.checksumSha256 !== sha256(stableStringify(envelope.aggregate))
    ) throw invalidAggregate('legacy_aggregate_envelope_is_invalid')
    return migrateLegacyAggregate(scope, envelope.aggregate)
  }
  if (
    envelope.recordVersion !== RECORD_VERSION
    || envelope.source !== RECORD_SOURCE
    || !isRecord(envelope.aggregate)
    || typeof envelope.checksumSha256 !== 'string'
  ) {
    throw invalidAggregate('aggregate_envelope_is_invalid')
  }
  if (envelope.checksumSha256 !== sha256(stableStringify(envelope.aggregate))) {
    throw invalidAggregate('aggregate_checksum_mismatch')
  }
  const aggregate = normalizeAdditiveV2Aggregate(envelope.aggregate) as unknown as EditReferenceAggregate
  assertAggregate(aggregate, scope)
  return clone(aggregate)
}

function normalizeAdditiveV2Aggregate(value: Record<string, unknown>): Record<string, unknown> {
  const normalized = { ...value }
  if (!Object.prototype.hasOwnProperty.call(normalized, 'reasoningAttempts')) {
    normalized.reasoningAttempts = []
  }
  if (!Object.prototype.hasOwnProperty.call(normalized, 'reasoningProviderRequests')) {
    normalized.reasoningProviderRequests = []
  }
  if (!Object.prototype.hasOwnProperty.call(normalized, 'reasoningProviderCheckbacks')) {
    normalized.reasoningProviderCheckbacks = []
  }
  if (!Object.prototype.hasOwnProperty.call(normalized, 'reasoningProviderWorkflows')) {
    normalized.reasoningProviderWorkflows = []
  }
  if (!Object.prototype.hasOwnProperty.call(normalized, 'reasoningInternalCostAuthorities')) {
    normalized.reasoningInternalCostAuthorities = []
  }
  if (!Object.prototype.hasOwnProperty.call(normalized, 'preferenceDnaReasoningAttempts')) {
    normalized.preferenceDnaReasoningAttempts = []
  }
  return normalized
}

async function writeAggregateRaw(scope: EditReferenceRepositoryScope, aggregate: EditReferenceAggregate): Promise<void> {
  const target = pathsFor(scope)
  const envelope: PersistedEnvelope = {
    recordVersion: RECORD_VERSION,
    source: RECORD_SOURCE,
    aggregate,
    checksumSha256: sha256(stableStringify(aggregate)),
  }
  const content = `${JSON.stringify(envelope, null, 2)}\n`
  if (Buffer.byteLength(content) > MAX_AGGREGATE_BYTES) throw invalidAggregate('aggregate_exceeds_byte_ceiling')
  await writePrivateFileAtomic(target.root, target.aggregateFile, content)
}

async function migrateLegacyAggregate(
  scope: EditReferenceRepositoryScope,
  legacyValue: Record<string, unknown>,
): Promise<EditReferenceAggregate> {
  if (
    legacyValue.schemaVersion !== LEGACY_AGGREGATE_VERSION
    || legacyValue.ownerUserId !== scope.ownerUserId
    || legacyValue.workspaceId !== scope.workspaceId
    || legacyValue.scopeHash !== editReferenceScopeHash(scope.ownerUserId, scope.workspaceId)
    || legacyValue.privateInternalOnly !== true
  ) throw invalidAggregate('legacy_aggregate_identity_is_invalid')
  const requiredCollections = [
    'references', 'studies', 'messages', 'evidence', 'assets', 'skillRuns', 'dnaVersions',
    'dnaQaResults', 'applications', 'usageLogs', 'auditEvents', 'idempotencyRecords',
  ] as const
  if (requiredCollections.some((key) => !Array.isArray(legacyValue[key]))) {
    throw invalidAggregate('legacy_aggregate_collection_is_invalid')
  }

  const auditEvents = (legacyValue.auditEvents as unknown[]).map((value, index) => {
    if (!isRecord(value)) throw invalidAggregate('legacy_audit_event_invalid')
    const event = { ...value, sequence: index + 1 } as unknown as EditReferenceAuditEvent
    assertAuditEvent(event)
    return event
  })
  const idempotencyReceipts = (legacyValue.idempotencyRecords as unknown[]).map((value, index) => {
    if (
      !isRecord(value)
      || typeof value.operation !== 'string'
      || typeof value.key !== 'string'
      || !value.key
      || !isSha256(value.requestHash)
      || !isRecord(value.responseSnapshot)
      || !Number.isSafeInteger(value.committedRevision)
      || !isISODate(value.completedAt)
    ) throw invalidAggregate('legacy_idempotency_record_invalid')
    const keyHash = sha256(value.key)
    const sequence = index + 1
    const receipt: EditReferenceIdempotencyReceipt = {
      receiptVersion: EDIT_REFERENCE_IDEMPOTENCY_RECEIPT_VERSION,
      receiptId: stableId('edit-reference-idempotency-receipt', {
        scopeHash: legacyValue.scopeHash,
        idempotencyKeyHashSha256: keyHash,
        receiptSequence: sequence,
      }),
      ledgerSequence: sequence,
      operation: value.operation,
      idempotencyKeyHashSha256: keyHash,
      requestHashSha256: value.requestHash,
      result: legacyIdempotencyResultPointer(value.responseSnapshot),
      committedRevision: value.committedRevision as number,
      completedAt: value.completedAt,
    }
    assertIdempotencyReceipt(receipt)
    return receipt
  })
  const archivedReceiptCount = Math.max(0, idempotencyReceipts.length - MAX_HOT_IDEMPOTENCY_RECEIPTS)
  const archivedIdempotencyReceipts = idempotencyReceipts.slice(0, archivedReceiptCount)
  const migratedRecord = clone(legacyValue)
  delete migratedRecord.auditEvents
  delete migratedRecord.idempotencyRecords
  Object.assign(migratedRecord, {
    schemaVersion: EDIT_REFERENCE_AGGREGATE_VERSION,
    auditState: { eventCount: auditEvents.length, lastSequence: auditEvents.length },
    idempotencyState: {
      receiptCount: idempotencyReceipts.length,
      lastSequence: idempotencyReceipts.length,
      archivedReceiptCount,
      compactionCount: archivedReceiptCount > 0 ? 1 : 0,
    },
    idempotencyReceipts: idempotencyReceipts.slice(archivedReceiptCount),
    reasoningAttempts: [],
    reasoningProviderRequests: [],
    reasoningProviderCheckbacks: [],
    reasoningProviderWorkflows: [],
    reasoningInternalCostAuthorities: [],
    preferenceDnaReasoningAttempts: [],
  })
  const aggregate = migratedRecord as unknown as EditReferenceAggregate
  assertAggregate(aggregate, scope)
  await commitPersistenceTransaction(
    scope,
    aggregate,
    auditEvents,
    archivedIdempotencyReceipts,
    typeof aggregate.updatedAt === 'string' && isISODate(aggregate.updatedAt)
      ? aggregate.updatedAt
      : new Date().toISOString(),
  )
  return clone(aggregate)
}

function legacyIdempotencyResultPointer(
  snapshot: Record<string, unknown>,
): EditReferenceIdempotencyReceipt['result'] {
  const detail = snapshot.detail
  if (!isRecord(detail) || !isRecord(detail.reference) || !isRecord(detail.study)) {
    throw invalidAggregate('legacy_idempotency_response_invalid')
  }
  const editReferenceId = detail.reference.id
  const studySessionId = detail.study.id
  if (typeof editReferenceId !== 'string' || !editReferenceId || typeof studySessionId !== 'string' || !studySessionId) {
    throw invalidAggregate('legacy_idempotency_response_identity_invalid')
  }
  const stableResultIds = new Set<string>([editReferenceId, studySessionId])
  for (const key of ['messages', 'evidence', 'assets', 'skillRuns', 'dnaVersions', 'dnaQaResults', 'applications', 'usageLogs']) {
    const records = detail[key]
    if (!Array.isArray(records)) continue
    for (const record of records) {
      if (isRecord(record) && typeof record.id === 'string' && record.id) stableResultIds.add(record.id)
    }
  }
  const appendedMessageIds = Array.isArray(snapshot.appendedMessageIds)
    ? snapshot.appendedMessageIds.filter((id): id is string => typeof id === 'string' && Boolean(id))
    : undefined
  appendedMessageIds?.forEach((id) => stableResultIds.add(id))
  return {
    resultKind: 'edit_reference_detail',
    editReferenceId,
    studySessionId,
    stableResultIds: [...stableResultIds].sort(),
    ...(appendedMessageIds ? { appendedMessageIds } : {}),
    resultDigestSha256: sha256(stableStringify(snapshot)),
  }
}

function assertAggregate(aggregate: EditReferenceAggregate, scope: EditReferenceRepositoryScope): void {
  if (!isRecord(aggregate)) throw invalidAggregate('aggregate_is_not_an_object')
  if (
    aggregate.schemaVersion !== EDIT_REFERENCE_AGGREGATE_VERSION
    || aggregate.ownerUserId !== scope.ownerUserId
    || aggregate.workspaceId !== scope.workspaceId
    || aggregate.scopeHash !== editReferenceScopeHash(scope.ownerUserId, scope.workspaceId)
    || aggregate.privateInternalOnly !== true
    || !Number.isSafeInteger(aggregate.revision)
    || aggregate.revision < 0
  ) throw invalidAggregate('aggregate_identity_is_invalid')

  const arrays = [
    aggregate.references,
    aggregate.studies,
    aggregate.messages,
    aggregate.reasoningAttempts,
    aggregate.reasoningProviderRequests,
    aggregate.reasoningProviderCheckbacks,
    aggregate.reasoningProviderWorkflows,
    aggregate.reasoningInternalCostAuthorities,
    aggregate.preferenceDnaReasoningAttempts,
    aggregate.evidence,
    aggregate.assets,
    aggregate.skillRuns,
    aggregate.dnaVersions,
    aggregate.dnaQaResults,
    aggregate.applications,
    aggregate.usageLogs,
    aggregate.idempotencyReceipts,
  ]
  if (arrays.some((value) => !Array.isArray(value))) throw invalidAggregate('aggregate_collection_is_invalid')
  if (aggregate.references.length > MAX_REFERENCES) throw invalidAggregate('too_many_references')
  if (aggregate.studies.length > MAX_STUDIES) throw invalidAggregate('too_many_studies')
  if (aggregate.messages.length > MAX_MESSAGES) throw invalidAggregate('too_many_messages')
  if (aggregate.reasoningAttempts.length > MAX_REASONING_ATTEMPTS) throw invalidAggregate('too_many_reasoning_attempts')
  if (aggregate.reasoningProviderRequests.length > MAX_REASONING_PROVIDER_REQUESTS) {
    throw invalidAggregate('too_many_reasoning_provider_requests')
  }
  if (aggregate.reasoningProviderCheckbacks.length > MAX_REASONING_PROVIDER_CHECKBACKS) {
    throw invalidAggregate('too_many_reasoning_provider_checkbacks')
  }
  if (aggregate.reasoningProviderWorkflows.length > MAX_REASONING_PROVIDER_WORKFLOWS) {
    throw invalidAggregate('too_many_reasoning_provider_workflows')
  }
  if (aggregate.reasoningInternalCostAuthorities.length > MAX_REASONING_INTERNAL_COST_AUTHORITIES) {
    throw invalidAggregate('too_many_reasoning_internal_cost_authorities')
  }
  if (aggregate.preferenceDnaReasoningAttempts.length > MAX_PREFERENCE_DNA_REASONING_ATTEMPTS) {
    throw invalidAggregate('too_many_preference_dna_reasoning_attempts')
  }
  if (aggregate.evidence.length > MAX_EVIDENCE_RECORDS) throw invalidAggregate('too_many_evidence_records')
  if (aggregate.assets.length > MAX_ASSET_RECORDS) throw invalidAggregate('too_many_asset_records')
  if (aggregate.skillRuns.length > MAX_SKILL_RUNS) throw invalidAggregate('too_many_skill_runs')
  if (aggregate.dnaVersions.length > MAX_DNA_VERSIONS) throw invalidAggregate('too_many_dna_versions')
  if (aggregate.dnaQaResults.length > MAX_DNA_QA_RESULTS) throw invalidAggregate('too_many_dna_qa_results')
  if (aggregate.applications.length > MAX_APPLICATIONS) throw invalidAggregate('too_many_applications')
  if (aggregate.idempotencyReceipts.length > MAX_HOT_IDEMPOTENCY_RECEIPTS) {
    throw invalidAggregate('too_many_hot_idempotency_receipts')
  }
  if (
    !isRecord(aggregate.auditState)
    || !Number.isSafeInteger(aggregate.auditState.eventCount)
    || aggregate.auditState.eventCount < 0
    || aggregate.auditState.lastSequence !== aggregate.auditState.eventCount
  ) throw invalidAggregate('audit_state_invalid')
  if (
    !isRecord(aggregate.idempotencyState)
    || !Number.isSafeInteger(aggregate.idempotencyState.receiptCount)
    || aggregate.idempotencyState.receiptCount < 0
    || aggregate.idempotencyState.lastSequence !== aggregate.idempotencyState.receiptCount
    || !Number.isSafeInteger(aggregate.idempotencyState.archivedReceiptCount)
    || aggregate.idempotencyState.archivedReceiptCount < 0
    || aggregate.idempotencyState.archivedReceiptCount + aggregate.idempotencyReceipts.length !== aggregate.idempotencyState.receiptCount
    || !Number.isSafeInteger(aggregate.idempotencyState.compactionCount)
    || aggregate.idempotencyState.compactionCount < 0
  ) throw invalidAggregate('idempotency_state_invalid')

  assertUniqueIds(aggregate.references, 'reference')
  assertUniqueIds(aggregate.studies, 'study')
  assertUniqueIds(aggregate.messages, 'message')
  assertUniqueIds(aggregate.reasoningAttempts, 'reasoning_attempt')
  assertUniqueIds(aggregate.reasoningProviderRequests, 'reasoning_provider_request')
  assertUniqueIds(aggregate.reasoningProviderCheckbacks, 'reasoning_provider_checkback')
  assertUniqueIds(aggregate.reasoningProviderWorkflows, 'reasoning_provider_workflow')
  assertUniqueIds(aggregate.reasoningInternalCostAuthorities, 'reasoning_internal_cost_authority')
  assertUniqueIds(aggregate.preferenceDnaReasoningAttempts, 'preference_dna_reasoning_attempt')
  assertUniqueIds(aggregate.evidence, 'evidence')
  assertUniqueIds(aggregate.assets, 'asset')
  assertUniqueIds(aggregate.skillRuns, 'skill_run')
  assertUniqueIds(aggregate.dnaVersions, 'dna_version')
  assertUniqueIds(aggregate.dnaQaResults, 'dna_qa')
  assertUniqueIds(aggregate.applications, 'application')
  assertUniqueIds(aggregate.usageLogs, 'usage_log')
  const receiptIds = new Set<string>()
  const idempotencyKeyHashes = new Set<string>()
  let expectedReceiptSequence = aggregate.idempotencyState.archivedReceiptCount + 1
  for (const receipt of aggregate.idempotencyReceipts) {
    assertIdempotencyReceipt(receipt)
    if (receiptIds.has(receipt.receiptId)) throw invalidAggregate('idempotency_receipt_id_duplicate')
    if (idempotencyKeyHashes.has(receipt.idempotencyKeyHashSha256)) throw invalidAggregate('idempotency_key_hash_duplicate')
    if (receipt.ledgerSequence !== expectedReceiptSequence) throw invalidAggregate('idempotency_hot_sequence_invalid')
    receiptIds.add(receipt.receiptId)
    idempotencyKeyHashes.add(receipt.idempotencyKeyHashSha256)
    expectedReceiptSequence += 1
  }

  const referenceIds = new Set(aggregate.references.map((record) => record.id))
  const studyIds = new Set(aggregate.studies.map((record) => record.id))
  const reasoningAttemptIds = new Set(aggregate.reasoningAttempts.map((record) => record.id))
  for (const reference of aggregate.references) {
    assertWorkspace(reference, scope.workspaceId)
    if (!reference.name || reference.name.length > 120 || !['active', 'archived'].includes(reference.status)) {
      throw invalidAggregate('reference_contract_invalid')
    }
    if (!studyIds.has(reference.currentStudyId)) throw invalidAggregate('reference_current_study_missing')
  }
  for (const study of aggregate.studies) {
    assertWorkspace(study, scope.workspaceId)
    if (!study.title || study.title.length > 160 || !isStudyStatus(study.status)) throw invalidAggregate('study_contract_invalid')
    if (!referenceIds.has(study.editReferenceId)) throw invalidAggregate('study_reference_missing')
  }
  const messageSequences = new Set<string>()
  for (const message of aggregate.messages) {
    assertWorkspace(message, scope.workspaceId)
    if (
      !['user', 'assistant', 'system'].includes(message.role)
      || ![
        'user_input', 'deterministic_setup', 'deterministic_evidence', 'deterministic_dna',
        'deterministic_dna_qa', 'deterministic_dna_approval', 'deterministic_dna_application',
        'qwen_reasoning',
      ].includes(message.runtimeSource)
      || !message.content
      || message.content.length > 8_000
      || !Number.isSafeInteger(message.sequence)
      || message.sequence < 1
      || (message.clientMessageId !== undefined && (
        typeof message.clientMessageId !== 'string'
        || message.clientMessageId.length < 1
        || message.clientMessageId.length > 160
      ))
    ) throw invalidAggregate('message_contract_invalid')
    const sequenceKey = `${message.studySessionId}:${message.sequence}`
    if (messageSequences.has(sequenceKey)) throw invalidAggregate('message_sequence_duplicate')
    messageSequences.add(sequenceKey)
    if (!referenceIds.has(message.editReferenceId) || !studyIds.has(message.studySessionId)) {
      throw invalidAggregate('message_link_is_invalid')
    }
    if (message.runtimeSource === 'qwen_reasoning') {
      if (
        message.role !== 'assistant'
        || typeof message.reasoningAttemptId !== 'string'
        || !reasoningAttemptIds.has(message.reasoningAttemptId)
      ) throw invalidAggregate('reasoning_message_link_is_invalid')
    } else if (message.reasoningAttemptId !== undefined) {
      throw invalidAggregate('non_reasoning_message_has_attempt_link')
    }
  }
  const messagesById = new Map(aggregate.messages.map((record) => [record.id, record]))
  const reasoningClientKeys = new Set<string>()
  const reasoningUserMessageIds = new Set<string>()
  const reasoningAssistantMessageIds = new Set<string>()
  for (const attempt of aggregate.reasoningAttempts) {
    assertReasoningAttempt(attempt, aggregate, referenceIds, studyIds, messagesById)
    const clientKey = `${attempt.studySessionId}:${attempt.clientMessageDigestSha256}`
    if (reasoningClientKeys.has(clientKey)) throw invalidAggregate('reasoning_attempt_client_message_duplicate')
    if (reasoningUserMessageIds.has(attempt.userMessageId)) throw invalidAggregate('reasoning_attempt_user_message_duplicate')
    reasoningClientKeys.add(clientKey)
    reasoningUserMessageIds.add(attempt.userMessageId)
    if (attempt.assistantMessageId) {
      if (reasoningAssistantMessageIds.has(attempt.assistantMessageId)) {
        throw invalidAggregate('reasoning_attempt_assistant_message_duplicate')
      }
      reasoningAssistantMessageIds.add(attempt.assistantMessageId)
    }
  }
  const providerRequestAttemptIds = new Set<string>()
  const providerRequestIds = new Set<string>()
  for (const providerRequest of aggregate.reasoningProviderRequests) {
    assertReasoningProviderRequest(providerRequest, aggregate)
    if (providerRequestAttemptIds.has(providerRequest.reasoningAttemptId)) {
      throw invalidAggregate('reasoning_provider_request_attempt_duplicate')
    }
    providerRequestAttemptIds.add(providerRequest.reasoningAttemptId)
    if (providerRequest.providerRequestId) {
      if (providerRequestIds.has(providerRequest.providerRequestId)) {
        throw invalidAggregate('reasoning_provider_request_external_id_duplicate')
      }
      providerRequestIds.add(providerRequest.providerRequestId)
    }
  }
  const providerCheckbackRequestIds = new Set<string>()
  for (const checkback of aggregate.reasoningProviderCheckbacks) {
    assertReasoningProviderCheckback(checkback, aggregate)
    if (providerCheckbackRequestIds.has(checkback.reasoningProviderRequestId)) {
      throw invalidAggregate('reasoning_provider_checkback_request_duplicate')
    }
    providerCheckbackRequestIds.add(checkback.reasoningProviderRequestId)
  }
  const providerWorkflowCheckbackIds = new Set<string>()
  const providerWorkflowCostAuthorityIds = new Set<string>()
  for (const workflow of aggregate.reasoningProviderWorkflows) {
    assertReasoningProviderWorkflow(workflow, aggregate)
    if (providerWorkflowCheckbackIds.has(workflow.reasoningProviderCheckbackId)) {
      throw invalidAggregate('reasoning_provider_workflow_checkback_duplicate')
    }
    if (providerWorkflowCostAuthorityIds.has(workflow.reasoningInternalCostAuthorityId)) {
      throw invalidAggregate('reasoning_provider_workflow_cost_authority_duplicate')
    }
    providerWorkflowCheckbackIds.add(workflow.reasoningProviderCheckbackId)
    providerWorkflowCostAuthorityIds.add(workflow.reasoningInternalCostAuthorityId)
  }
  assertReasoningInternalCostAuthorities(aggregate)
  const preferenceDnaReasoningRequestKeys = new Set<string>()
  for (const attempt of aggregate.preferenceDnaReasoningAttempts) {
    assertPreferenceDnaReasoningAttempt(attempt, aggregate, referenceIds, studyIds)
    const requestKey = `${attempt.studySessionId}:${attempt.requestDigestSha256}`
    if (preferenceDnaReasoningRequestKeys.has(requestKey)) {
      throw invalidAggregate('preference_dna_reasoning_attempt_request_duplicate')
    }
    preferenceDnaReasoningRequestKeys.add(requestKey)
  }
  for (const message of aggregate.messages) {
    if (message.runtimeSource === 'qwen_reasoning' && !reasoningAssistantMessageIds.has(message.id)) {
      throw invalidAggregate('orphan_reasoning_assistant_message')
    }
  }
  for (const collection of [aggregate.evidence, aggregate.assets, aggregate.skillRuns]) {
    for (const record of collection) {
      assertWorkspace(record, scope.workspaceId)
      if (!referenceIds.has(record.editReferenceId) || !studyIds.has(record.studySessionId)) {
        throw invalidAggregate('future_artifact_link_is_invalid')
      }
    }
  }
  const evidenceIds = new Set(aggregate.evidence.map((record) => record.id))
  for (const record of aggregate.evidence) assertEvidenceRecord(record, evidenceIds)
  for (const record of aggregate.evidence) {
    if (!record.supersedesEvidenceId) continue
    const superseded = aggregate.evidence.find((candidate) => candidate.id === record.supersedesEvidenceId)
    if (!superseded || superseded.id === record.id || superseded.studySessionId !== record.studySessionId || superseded.sourceType !== 'manual_user_evidence') {
      throw invalidAggregate('evidence_correction_link_invalid')
    }
  }
  for (const record of aggregate.assets) assertAssetRecord(record)
  for (const record of aggregate.skillRuns) assertSkillRunRecord(record, evidenceIds)
  for (const record of aggregate.dnaVersions) {
    assertWorkspace(record, scope.workspaceId)
    if (!referenceIds.has(record.editReferenceId) || !studyIds.has(record.studySessionId)) {
      throw invalidAggregate('dna_link_is_invalid')
    }
  }
  assertDNAVersions(aggregate, evidenceIds)
  assertDNAQAResults(aggregate)
  assertDNAApprovalLinks(aggregate)
  assertPreferenceApplications(aggregate)
  for (const record of aggregate.usageLogs) {
    assertWorkspace(record, scope.workspaceId)
    if (!referenceIds.has(record.editReferenceId)) throw invalidAggregate('usage_reference_missing')
  }
  if (findForbiddenPersistenceKey(aggregate)) throw invalidAggregate('forbidden_private_payload_field')
}

function assertPreferenceDnaReasoningAttempt(
  attempt: EditReferencePreferenceDnaReasoningAttemptRecord,
  aggregate: EditReferenceAggregate,
  referenceIds: Set<string>,
  studyIds: Set<string>,
): void {
  if (
    !referenceIds.has(attempt.editReferenceId)
    || !studyIds.has(attempt.studySessionId)
    || attempt.workspaceId !== aggregate.workspaceId
    || attempt.actorUserId !== aggregate.ownerUserId
  ) throw invalidAggregate('preference_dna_reasoning_attempt_link_invalid')
  const study = aggregate.studies.find((record) => record.id === attempt.studySessionId)
  if (!study || study.editReferenceId !== attempt.editReferenceId) {
    throw invalidAggregate('preference_dna_reasoning_attempt_study_link_invalid')
  }
  try {
    validateEditReferencePreferenceDnaReasoningAttemptRecord(attempt)
  } catch {
    throw invalidAggregate('preference_dna_reasoning_attempt_contract_invalid')
  }
}

function assertReasoningAttempt(
  attempt: EditReferenceStudyChatReasoningAttemptRecord,
  aggregate: EditReferenceAggregate,
  referenceIds: Set<string>,
  studyIds: Set<string>,
  messagesById: Map<string, EditReferenceAggregate['messages'][number]>,
): void {
  if (
    !isRecord(attempt)
    || attempt.schemaVersion !== EDIT_REFERENCE_STUDY_CHAT_REASONING_ATTEMPT_VERSION
    || typeof attempt.id !== 'string'
    || !attempt.id
    || attempt.workspaceId !== aggregate.workspaceId
    || attempt.actorUserId !== aggregate.ownerUserId
    || !referenceIds.has(attempt.editReferenceId)
    || !studyIds.has(attempt.studySessionId)
    || attempt.privateInternalOnly !== true
    || !Number.isSafeInteger(attempt.revision)
    || attempt.revision < 1
    || !EDIT_REFERENCE_STUDY_CHAT_REASONING_ATTEMPT_STATES.includes(attempt.state)
    || !isSha256(attempt.requestDigestSha256)
    || !isSha256(attempt.clientMessageDigestSha256)
    || !isSha256(attempt.userMessageContentDigestSha256)
    || !isSha256(attempt.reservationIdempotencyKeyHashSha256)
    || !Number.isSafeInteger(attempt.studyRevisionAtReservation)
    || attempt.studyRevisionAtReservation < 1
    || attempt.studyRevisionAfterReservation !== attempt.studyRevisionAtReservation + 1
    || !isISODate(attempt.createdAt)
    || attempt.reservedAt !== attempt.createdAt
    || attempt.customerPriceCalculated !== false
    || attempt.customerCreditsMutated !== false
    || attempt.serviceFeeIncluded !== false
    || !Array.isArray(attempt.usageEventIds)
    || !Array.isArray(attempt.internalCostRecordIds)
    || attempt.usageEventIds.length > 256
    || attempt.internalCostRecordIds.length > 256
    || !validStableIdList(attempt.usageEventIds)
    || !validStableIdList(attempt.internalCostRecordIds)
  ) throw invalidAggregate('reasoning_attempt_contract_invalid')

  const reference = aggregate.references.find((record) => record.id === attempt.editReferenceId)
  const study = aggregate.studies.find((record) => record.id === attempt.studySessionId)
  const userMessage = messagesById.get(attempt.userMessageId)
  if (
    !reference
    || !study
    || study.editReferenceId !== reference.id
    || !userMessage
    || userMessage.editReferenceId !== reference.id
    || userMessage.studySessionId !== study.id
    || userMessage.role !== 'user'
    || userMessage.runtimeSource !== 'user_input'
    || typeof userMessage.clientMessageId !== 'string'
    || sha256(userMessage.clientMessageId) !== attempt.clientMessageDigestSha256
    || sha256(userMessage.content) !== attempt.userMessageContentDigestSha256
  ) throw invalidAggregate('reasoning_attempt_user_message_link_invalid')

  try {
    validateEditReferenceStudyChatReasoningRequest(attempt.request)
  } catch {
    throw invalidAggregate('reasoning_attempt_request_invalid')
  }
  if (
    attempt.requestDigestSha256 !== hashEditReferenceStudyChatReasoningRequest(attempt.request)
    || attempt.clientMessageDigestSha256 !== attempt.request.clientMessageDigestSha256
    || attempt.request.workspaceId !== attempt.workspaceId
    || attempt.request.actorUserId !== attempt.actorUserId
    || attempt.request.editReferenceId !== attempt.editReferenceId
    || attempt.request.studySessionId !== attempt.studySessionId
    || attempt.request.expectedStudyRevision !== attempt.studyRevisionAtReservation
  ) throw invalidAggregate('reasoning_attempt_request_identity_invalid')

  if (attempt.startedAt !== undefined && (
    !isISODate(attempt.startedAt)
    || Date.parse(attempt.startedAt) < Date.parse(attempt.reservedAt)
  )) throw invalidAggregate('reasoning_attempt_started_at_invalid')
  if (attempt.settledAt !== undefined && (
    !isISODate(attempt.settledAt)
    || Date.parse(attempt.settledAt) < Date.parse(attempt.startedAt ?? attempt.reservedAt)
  )) throw invalidAggregate('reasoning_attempt_settled_at_invalid')

  const initialCostStatus = attempt.request.executionScope === 'production'
    ? 'authorized_not_incurred'
    : 'not_incurred'
  if (attempt.state === 'reserved') {
    if (
      attempt.revision !== 1
      || attempt.providerExecutionState !== 'not_started'
      || attempt.internalCostStatus !== initialCostStatus
      || attempt.meteredInternalCostMicros !== null
      || attempt.executionCommandDigestSha256 !== undefined
      || attempt.executionIdempotencyKeyHashSha256 !== undefined
      || attempt.startedAt !== undefined
      || attempt.settledAt !== undefined
      || attempt.result !== undefined
      || attempt.resultDigestSha256 !== undefined
      || attempt.assistantMessageId !== undefined
      || attempt.terminalReason !== undefined
      || attempt.usageEventIds.length !== 0
      || attempt.internalCostRecordIds.length !== 0
    ) throw invalidAggregate('reasoning_attempt_reserved_state_invalid')
    return
  }

  if (attempt.state === 'cancelled') {
    if (
      attempt.revision !== 2
      || attempt.providerExecutionState !== 'not_called'
      || attempt.internalCostStatus !== 'not_incurred'
      || attempt.meteredInternalCostMicros !== null
      || attempt.executionCommandDigestSha256 !== undefined
      || attempt.executionIdempotencyKeyHashSha256 !== undefined
      || attempt.startedAt !== undefined
      || !attempt.settledAt
      || attempt.result !== undefined
      || attempt.resultDigestSha256 !== undefined
      || attempt.assistantMessageId !== undefined
      || attempt.terminalReason !== 'cancelled_before_execution'
      || attempt.usageEventIds.length !== 0
      || attempt.internalCostRecordIds.length !== 0
    ) throw invalidAggregate('reasoning_attempt_cancelled_state_invalid')
    return
  }

  if (
    attempt.revision < 2
    || !isSha256(attempt.executionCommandDigestSha256)
    || !isSha256(attempt.executionIdempotencyKeyHashSha256)
    || !attempt.startedAt
  ) throw invalidAggregate('reasoning_attempt_execution_authority_invalid')

  if (attempt.state === 'running') {
    if (
      attempt.revision !== 2
      || attempt.providerExecutionState !== 'execution_authorized_once'
      || attempt.internalCostStatus !== initialCostStatus
      || attempt.meteredInternalCostMicros !== null
      || attempt.settledAt !== undefined
      || attempt.result !== undefined
      || attempt.resultDigestSha256 !== undefined
      || attempt.assistantMessageId !== undefined
      || attempt.terminalReason !== undefined
      || attempt.usageEventIds.length !== 0
      || attempt.internalCostRecordIds.length !== 0
    ) throw invalidAggregate('reasoning_attempt_running_state_invalid')
    return
  }

  if (
    attempt.revision !== 3
    || !attempt.settledAt
    || !attempt.result
    || !isSha256(attempt.resultDigestSha256)
    || attempt.resultDigestSha256 !== sha256(stableStringify(attempt.result))
  ) throw invalidAggregate('reasoning_attempt_terminal_state_invalid')
  try {
    validateEditReferenceStudyChatReasoningResult(attempt.request, attempt.result)
  } catch {
    throw invalidAggregate('reasoning_attempt_result_invalid')
  }

  const resultCost = attempt.result.status === 'answered'
    ? {
        status: 'metered' as const,
        micros: attempt.result.usage.meteredInternalCostMicros,
        usageEventIds: attempt.result.usage.usageEventIds,
        internalCostRecordIds: attempt.result.usage.internalCostRecordIds,
        providerState: 'called_metered' as const,
      }
    : {
        status: attempt.result.internalCostStatus,
        micros: attempt.result.meteredInternalCostMicros,
        usageEventIds: attempt.result.usageEventIds,
        internalCostRecordIds: attempt.result.internalCostRecordIds,
        providerState: attempt.result.providerCallMade
          ? attempt.result.internalCostStatus === 'unverified'
            ? 'called_cost_unverified' as const
            : attempt.result.internalCostStatus === 'metered'
              ? 'called_metered' as const
              : 'called_no_cost' as const
          : 'not_called' as const,
      }
  if (
    attempt.internalCostStatus !== resultCost.status
    || attempt.meteredInternalCostMicros !== resultCost.micros
    || !sameStringArray(attempt.usageEventIds, [...resultCost.usageEventIds])
    || !sameStringArray(attempt.internalCostRecordIds, [...resultCost.internalCostRecordIds])
    || attempt.providerExecutionState !== resultCost.providerState
  ) throw invalidAggregate('reasoning_attempt_cost_evidence_invalid')

  if (attempt.result.status === 'answered') {
    if (attempt.state === 'completed') {
      const assistantMessage = attempt.assistantMessageId
        ? messagesById.get(attempt.assistantMessageId)
        : undefined
      if (
        attempt.terminalReason !== undefined
        || !assistantMessage
        || assistantMessage.role !== 'assistant'
        || assistantMessage.runtimeSource !== 'qwen_reasoning'
        || assistantMessage.reasoningAttemptId !== attempt.id
        || assistantMessage.editReferenceId !== attempt.editReferenceId
        || assistantMessage.studySessionId !== attempt.studySessionId
        || assistantMessage.content !== attempt.result.answer.assistantMessage
      ) throw invalidAggregate('reasoning_attempt_assistant_message_link_invalid')
      return
    }
    if (
      attempt.state !== 'failed'
      || attempt.terminalReason !== 'study_revision_advanced'
      || attempt.assistantMessageId !== undefined
    ) throw invalidAggregate('reasoning_attempt_stale_answer_state_invalid')
    return
  }

  if (
    attempt.assistantMessageId !== undefined
    || attempt.terminalReason !== attempt.result.blockerCode
    || (attempt.result.internalCostStatus === 'unverified' && attempt.state !== 'cost_unverified')
    || (attempt.result.internalCostStatus !== 'unverified' && attempt.state !== 'failed')
  ) throw invalidAggregate('reasoning_attempt_blocked_result_state_invalid')
}

function assertReasoningProviderRequest(
  providerRequest: EditReferenceStudyChatProviderRequestRecord,
  aggregate: EditReferenceAggregate,
): void {
  if (
    !isRecord(providerRequest)
    || providerRequest.schemaVersion !== EDIT_REFERENCE_STUDY_CHAT_PROVIDER_REQUEST_VERSION
    || typeof providerRequest.id !== 'string'
    || !providerRequest.id
    || providerRequest.workspaceId !== aggregate.workspaceId
    || providerRequest.actorUserId !== aggregate.ownerUserId
    || providerRequest.privateInternalOnly !== true
    || !Number.isSafeInteger(providerRequest.revision)
    || providerRequest.revision < 1
    || !EDIT_REFERENCE_STUDY_CHAT_PROVIDER_REQUEST_STATES.includes(providerRequest.state)
    || !isSha256(providerRequest.reasoningRequestDigestSha256)
    || !isSha256(providerRequest.executionCommandDigestSha256)
    || !/^[A-Za-z0-9][A-Za-z0-9._:-]{0,199}$/.test(providerRequest.providerRoute)
    || !/^[A-Za-z0-9][A-Za-z0-9._:-]{0,199}$/.test(providerRequest.providerModelId)
    || !/^[A-Za-z0-9][A-Za-z0-9._:-]{0,199}$/.test(providerRequest.providerModelRevision)
    || !isSha256(providerRequest.providerModelAggregateSha256)
    || providerRequest.providerLookupMode !== 'provider_request_id_or_idempotency_key'
    || !isSha256(providerRequest.reservationIdempotencyKeyHashSha256)
    || !isSha256(providerRequest.submissionIdempotencyKeyHashSha256)
    || providerRequest.resubmissionAllowed !== false
    || !Number.isSafeInteger(providerRequest.reconciliationCount)
    || providerRequest.reconciliationCount < 0
    || !Array.isArray(providerRequest.usageEventIds)
    || !Array.isArray(providerRequest.internalCostRecordIds)
    || !validStableIdList(providerRequest.usageEventIds)
    || !validStableIdList(providerRequest.internalCostRecordIds)
    || providerRequest.customerPriceCalculated !== false
    || providerRequest.customerCreditsMutated !== false
    || providerRequest.serviceFeeIncluded !== false
    || !isISODate(providerRequest.createdAt)
    || !isISODate(providerRequest.updatedAt)
    || Date.parse(providerRequest.updatedAt) < Date.parse(providerRequest.createdAt)
  ) throw invalidAggregate('reasoning_provider_request_contract_invalid')

  const attempt = aggregate.reasoningAttempts.find(
    (candidate) => candidate.id === providerRequest.reasoningAttemptId,
  )
  if (
    !attempt
    || providerRequest.editReferenceId !== attempt.editReferenceId
    || providerRequest.studySessionId !== attempt.studySessionId
    || providerRequest.reasoningRequestDigestSha256 !== attempt.requestDigestSha256
    || providerRequest.executionCommandDigestSha256 !== attempt.executionCommandDigestSha256
  ) throw invalidAggregate('reasoning_provider_request_attempt_link_invalid')

  const hasProviderRequestId = typeof providerRequest.providerRequestId === 'string'
  if (
    (hasProviderRequestId && !/^[A-Za-z0-9][A-Za-z0-9._:-]{0,199}$/.test(providerRequest.providerRequestId as string))
    || hasProviderRequestId !== (providerRequest.providerRequestIdDigestSha256 !== undefined)
    || (hasProviderRequestId && sha256(providerRequest.providerRequestId as string) !== providerRequest.providerRequestIdDigestSha256)
  ) throw invalidAggregate('reasoning_provider_request_external_identity_invalid')

  for (const timestamp of [
    providerRequest.submissionAuthorizedAt,
    providerRequest.submittedAt,
    providerRequest.lastReconciledAt,
    providerRequest.terminalAt,
  ]) {
    if (timestamp !== undefined && (
      !isISODate(timestamp)
      || Date.parse(timestamp) < Date.parse(providerRequest.createdAt)
    )) throw invalidAggregate('reasoning_provider_request_timestamp_invalid')
  }

  const hasObservation = providerRequest.reconciliationCount > 0
  if (
    hasObservation !== (providerRequest.lastObservationIdDigestSha256 !== undefined)
    || hasObservation !== (providerRequest.lastObservationDigestSha256 !== undefined)
    || (hasObservation && (
      !isSha256(providerRequest.lastObservationIdDigestSha256)
      || !isSha256(providerRequest.lastObservationDigestSha256)
      || !providerRequest.lastReconciledAt
    ))
  ) throw invalidAggregate('reasoning_provider_request_observation_invalid')

  if (providerRequest.state === 'not_submitted') {
    if (
      providerRequest.revision !== 1
      || attempt.state !== 'running'
      || providerRequest.providerCallMayHaveOccurred
      || providerRequest.operatorReviewRequired
      || providerRequest.reconciliationCount !== 0
      || hasProviderRequestId
      || providerRequest.submissionAuthorizedAt !== undefined
      || providerRequest.submissionAuthorizationIdempotencyKeyHashSha256 !== undefined
      || providerRequest.submittedAt !== undefined
      || providerRequest.lastReconciledAt !== undefined
      || providerRequest.terminalAt !== undefined
      || providerRequest.resultDigestSha256 !== undefined
      || providerRequest.internalCostStatus !== attempt.internalCostStatus
      || providerRequest.meteredInternalCostMicros !== null
      || providerRequest.usageEventIds.length !== 0
      || providerRequest.internalCostRecordIds.length !== 0
    ) throw invalidAggregate('reasoning_provider_request_not_submitted_state_invalid')
    return
  }

  if (
    attempt.state === 'reserved'
    || attempt.state === 'cancelled'
    || !providerRequest.providerCallMayHaveOccurred
    || !providerRequest.submissionAuthorizedAt
    || !isSha256(providerRequest.submissionAuthorizationIdempotencyKeyHashSha256)
  ) throw invalidAggregate('reasoning_provider_request_submission_authority_invalid')

  if (providerRequest.state === 'submission_unknown') {
    if (
      providerRequest.revision !== 2
      || attempt.state !== 'running'
      || providerRequest.operatorReviewRequired
      || providerRequest.reconciliationCount !== 0
      || hasProviderRequestId
      || providerRequest.submittedAt !== undefined
      || providerRequest.lastReconciledAt !== undefined
      || providerRequest.terminalAt !== undefined
      || providerRequest.resultDigestSha256 !== undefined
      || providerRequest.internalCostStatus !== 'unverified'
      || providerRequest.meteredInternalCostMicros !== null
      || providerRequest.usageEventIds.length !== 0
      || providerRequest.internalCostRecordIds.length !== 0
    ) throw invalidAggregate('reasoning_provider_request_submission_unknown_state_invalid')
    return
  }

  if (providerRequest.state === 'submitted') {
    if (
      providerRequest.revision < 3
      || attempt.state !== 'running'
      || providerRequest.operatorReviewRequired
      || providerRequest.reconciliationCount < 1
      || !hasProviderRequestId
      || !providerRequest.submittedAt
      || providerRequest.terminalAt !== undefined
      || providerRequest.resultDigestSha256 !== undefined
      || providerRequest.internalCostStatus !== 'unverified'
      || providerRequest.meteredInternalCostMicros !== null
      || providerRequest.usageEventIds.length !== 0
      || providerRequest.internalCostRecordIds.length !== 0
    ) throw invalidAggregate('reasoning_provider_request_submitted_state_invalid')
    return
  }

  if (providerRequest.state === 'operator_review_required') {
    if (
      providerRequest.revision < 3
      || attempt.state !== 'running'
      || !providerRequest.operatorReviewRequired
      || providerRequest.reconciliationCount < 1
      || providerRequest.terminalAt !== undefined
      || providerRequest.resultDigestSha256 !== undefined
      || providerRequest.internalCostStatus !== 'unverified'
      || providerRequest.meteredInternalCostMicros !== null
      || providerRequest.usageEventIds.length !== 0
      || providerRequest.internalCostRecordIds.length !== 0
    ) throw invalidAggregate('reasoning_provider_request_review_state_invalid')
    return
  }

  if (
    providerRequest.revision < 3
    || providerRequest.operatorReviewRequired
    || providerRequest.reconciliationCount < 1
    || !hasProviderRequestId
    || !providerRequest.submittedAt
    || !providerRequest.terminalAt
    || !isSha256(providerRequest.resultDigestSha256)
    || providerRequest.resultDigestSha256 !== attempt.resultDigestSha256
    || providerRequest.internalCostStatus !== attempt.internalCostStatus
    || providerRequest.meteredInternalCostMicros !== attempt.meteredInternalCostMicros
    || !sameStringArray(providerRequest.usageEventIds, attempt.usageEventIds)
    || !sameStringArray(providerRequest.internalCostRecordIds, attempt.internalCostRecordIds)
  ) throw invalidAggregate('reasoning_provider_request_terminal_state_invalid')

  if (providerRequest.state === 'completed') {
    if (
      attempt.result?.status !== 'answered'
      || !['completed', 'failed'].includes(attempt.state)
    ) throw invalidAggregate('reasoning_provider_request_completed_attempt_invalid')
    return
  }
  if (
    providerRequest.state !== 'failed'
    || attempt.result?.status !== 'blocked'
    || !['failed', 'cost_unverified'].includes(attempt.state)
  ) throw invalidAggregate('reasoning_provider_request_failed_attempt_invalid')
}

function assertReasoningProviderCheckback(
  checkback: EditReferenceStudyChatProviderCheckbackRecord,
  aggregate: EditReferenceAggregate,
): void {
  if (
    !isRecord(checkback)
    || checkback.schemaVersion !== EDIT_REFERENCE_STUDY_CHAT_PROVIDER_CHECKBACK_VERSION
    || typeof checkback.id !== 'string'
    || !checkback.id
    || checkback.workspaceId !== aggregate.workspaceId
    || checkback.actorUserId !== aggregate.ownerUserId
    || checkback.privateInternalOnly !== true
    || !Number.isSafeInteger(checkback.revision)
    || checkback.revision < 1
    || !EDIT_REFERENCE_STUDY_CHAT_PROVIDER_CHECKBACK_STATES.includes(checkback.state)
    || !['submission_unknown', 'provider_pending', 'lookup_unavailable', 'operator_recovery'].includes(checkback.scheduleReason)
    || !isISODate(checkback.nextCheckAt)
    || !isISODate(checkback.deadlineAt)
    || Date.parse(checkback.nextCheckAt) > Date.parse(checkback.deadlineAt)
    || !Number.isSafeInteger(checkback.maxLookupAttempts)
    || checkback.maxLookupAttempts < 1
    || checkback.maxLookupAttempts > 32
    || !Number.isSafeInteger(checkback.lookupAttemptCount)
    || checkback.lookupAttemptCount < 0
    || checkback.lookupAttemptCount > checkback.maxLookupAttempts
    || !Number.isSafeInteger(checkback.leaseGeneration)
    || checkback.leaseGeneration < 0
    || checkback.leaseGeneration !== checkback.lookupAttemptCount
    || !EDIT_REFERENCE_STUDY_CHAT_PROVIDER_CHECKBACK_OUTCOMES.includes(checkback.lastOutcome)
    || (checkback.lastOutcomeProviderRequestRevision !== null && (
      !Number.isSafeInteger(checkback.lastOutcomeProviderRequestRevision)
      || checkback.lastOutcomeProviderRequestRevision < 1
    ))
    || typeof checkback.operatorReviewRequired !== 'boolean'
    || typeof checkback.automaticLookupStopped !== 'boolean'
    || !Number.isSafeInteger(checkback.operatorRecoveryCount)
    || checkback.operatorRecoveryCount < 0
    || (checkback.operatorRecoveryCount > 0) !== Boolean(checkback.lastOperatorRecoveryCommandDigestSha256)
    || (checkback.lastOperatorRecoveryCommandDigestSha256 !== undefined
      && !isEditReferenceStudyChatProviderCheckbackSha256(checkback.lastOperatorRecoveryCommandDigestSha256))
    || checkback.lookupOnly !== true
    || checkback.providerSubmissionAllowed !== false
    || checkback.providerResubmissionAllowed !== false
    || checkback.providerSubmissionIdempotencyKeyPersisted !== false
    || checkback.providerCancellationAttempted !== false
    || checkback.providerCancellationConfirmed !== false
    || checkback.customerPriceCalculated !== false
    || checkback.customerCreditsMutated !== false
    || checkback.serviceFeeIncluded !== false
    || !isISODate(checkback.createdAt)
    || !isISODate(checkback.updatedAt)
    || Date.parse(checkback.updatedAt) < Date.parse(checkback.createdAt)
  ) throw invalidAggregate('reasoning_provider_checkback_contract_invalid')

  const providerRequest = aggregate.reasoningProviderRequests.find(
    (candidate) => candidate.id === checkback.reasoningProviderRequestId,
  )
  if (
    !providerRequest
    || checkback.editReferenceId !== providerRequest.editReferenceId
    || checkback.studySessionId !== providerRequest.studySessionId
    || checkback.reasoningAttemptId !== providerRequest.reasoningAttemptId
  ) throw invalidAggregate('reasoning_provider_checkback_request_link_invalid')
  if (
    (checkback.lastOutcome === 'not_checked') !== (checkback.lastOutcomeProviderRequestRevision === null)
    || (
      checkback.lastOutcomeProviderRequestRevision !== null
      && checkback.lastOutcomeProviderRequestRevision > providerRequest.revision
    )
  ) throw invalidAggregate('reasoning_provider_checkback_outcome_revision_invalid')

  for (const timestamp of [
    checkback.leasedAt,
    checkback.leaseExpiresAt,
    checkback.lastLookupStartedAt,
    checkback.lastLookupCompletedAt,
    checkback.stoppedAt,
    checkback.terminalAt,
  ]) {
    if (timestamp !== undefined && (
      !isISODate(timestamp)
      || Date.parse(timestamp) < Date.parse(checkback.createdAt)
    )) throw invalidAggregate('reasoning_provider_checkback_timestamp_invalid')
  }
  if (
    checkback.lastLookupStartedAt !== undefined
    && checkback.lastLookupCompletedAt !== undefined
    && Date.parse(checkback.lastLookupCompletedAt) < Date.parse(checkback.lastLookupStartedAt)
  ) throw invalidAggregate('reasoning_provider_checkback_lookup_timestamp_invalid')

  const activeLeaseValues = [
    checkback.activeLeaseTokenHashSha256,
    checkback.activeLeaseOwnerIdDigestSha256,
    checkback.activeLeaseClaimIdempotencyKeyHashSha256,
    checkback.leasedAt,
    checkback.leaseExpiresAt,
  ]
  const hasActiveLease = activeLeaseValues.every((value) => value !== undefined)
  if (
    activeLeaseValues.some((value) => value !== undefined) !== hasActiveLease
    || (hasActiveLease && (
      !isEditReferenceStudyChatProviderCheckbackSha256(checkback.activeLeaseTokenHashSha256)
      || !isEditReferenceStudyChatProviderCheckbackSha256(checkback.activeLeaseOwnerIdDigestSha256)
      || !isEditReferenceStudyChatProviderCheckbackSha256(checkback.activeLeaseClaimIdempotencyKeyHashSha256)
      || Date.parse(checkback.leaseExpiresAt as string) <= Date.parse(checkback.leasedAt as string)
    ))
  ) throw invalidAggregate('reasoning_provider_checkback_lease_invalid')

  if (checkback.state === 'leased') {
    if (
      !hasActiveLease
      || checkback.lookupAttemptCount < 1
      || !checkback.lastLookupStartedAt
      || checkback.lastLookupCompletedAt !== undefined
      || checkback.leasedAt !== checkback.lastLookupStartedAt
      || checkback.operatorReviewRequired
      || checkback.automaticLookupStopped
      || checkback.stopReason !== undefined
      || checkback.stoppedAt !== undefined
      || checkback.terminalAt !== undefined
    ) throw invalidAggregate('reasoning_provider_checkback_leased_state_invalid')
    return
  }
  if (hasActiveLease) throw invalidAggregate('reasoning_provider_checkback_inactive_lease_invalid')

  if (checkback.state === 'scheduled') {
    if (
      checkback.operatorReviewRequired
      || checkback.automaticLookupStopped
      || checkback.stopReason !== undefined
      || checkback.stoppedAt !== undefined
      || checkback.terminalAt !== undefined
    ) throw invalidAggregate('reasoning_provider_checkback_scheduled_state_invalid')
    return
  }
  if (checkback.state === 'operator_review_required') {
    if (
      !checkback.operatorReviewRequired
      || !checkback.automaticLookupStopped
      || !checkback.stoppedAt
      || checkback.terminalAt !== undefined
      || ![
        'operator_review_required',
        'invalid_provider_observation',
        'lookup_unavailable',
        'provider_pending',
        'automatic_lookup_exhausted',
      ].includes(checkback.lastOutcome)
    ) throw invalidAggregate('reasoning_provider_checkback_review_state_invalid')
    return
  }
  if (checkback.state === 'cancelled') {
    if (
      !checkback.operatorReviewRequired
      || !checkback.automaticLookupStopped
      || !checkback.stopReason
      || !checkback.stoppedAt
      || checkback.terminalAt !== undefined
    ) throw invalidAggregate('reasoning_provider_checkback_cancelled_state_invalid')
    return
  }
  if (
    checkback.state !== 'terminal'
    || checkback.operatorReviewRequired
    || !checkback.automaticLookupStopped
    || checkback.stopReason !== undefined
    || checkback.stoppedAt !== undefined
    || !checkback.terminalAt
    || checkback.lastOutcome !== 'terminal_settled'
    || !['completed', 'failed'].includes(providerRequest.state)
  ) throw invalidAggregate('reasoning_provider_checkback_terminal_state_invalid')
}

function assertReasoningProviderWorkflow(
  workflow: EditReferenceStudyChatProviderWorkflowRecord,
  aggregate: EditReferenceAggregate,
): void {
  try {
    validateEditReferenceStudyChatProviderWorkflowRecord(workflow)
  } catch {
    throw invalidAggregate('reasoning_provider_workflow_contract_invalid')
  }
  if (workflow.workspaceId !== aggregate.workspaceId || workflow.actorUserId !== aggregate.ownerUserId) {
    throw invalidAggregate('reasoning_provider_workflow_scope_invalid')
  }
  const checkback = aggregate.reasoningProviderCheckbacks.find(
    (candidate) => candidate.id === workflow.reasoningProviderCheckbackId,
  )
  const providerRequest = aggregate.reasoningProviderRequests.find(
    (candidate) => candidate.id === workflow.reasoningProviderRequestId,
  )
  const attempt = aggregate.reasoningAttempts.find(
    (candidate) => candidate.id === workflow.reasoningAttemptId,
  )
  const costAuthority = aggregate.reasoningInternalCostAuthorities.find(
    (candidate) => candidate.id === workflow.reasoningInternalCostAuthorityId,
  )
  if (
    !checkback
    || !providerRequest
    || !attempt
    || !costAuthority
    || checkback.reasoningProviderRequestId !== providerRequest.id
    || checkback.reasoningAttemptId !== attempt.id
    || providerRequest.reasoningAttemptId !== attempt.id
    || costAuthority.reasoningAttemptId !== attempt.id
    || costAuthority.reasoningProviderRequestId !== providerRequest.id
    || workflow.editReferenceId !== attempt.editReferenceId
    || workflow.studySessionId !== attempt.studySessionId
    || workflow.editReferenceId !== checkback.editReferenceId
    || workflow.studySessionId !== checkback.studySessionId
  ) throw invalidAggregate('reasoning_provider_workflow_link_invalid')

  for (const event of workflow.callbackEvents) {
    const expectedProviderRequestDigest = providerRequest.providerRequestId
      ? sha256(providerRequest.providerRequestId)
      : null
    if (
      event.providerRequestIdDigestSha256 !== null
      && event.providerRequestIdDigestSha256 !== expectedProviderRequestDigest
    ) {
      throw invalidAggregate('reasoning_provider_workflow_callback_request_invalid')
    }
  }
  if (
    workflow.lastOutcomeCheckbackRevision !== null
    && workflow.lastOutcomeCheckbackRevision > checkback.revision
  ) throw invalidAggregate('reasoning_provider_workflow_outcome_revision_invalid')
  if (workflow.state === 'terminal' && (
    checkback.state !== 'terminal'
    || !['completed', 'failed'].includes(providerRequest.state)
  )) throw invalidAggregate('reasoning_provider_workflow_terminal_link_invalid')
  if (
    workflow.state === 'operator_review_required'
    && !['operator_review_required', 'cancelled'].includes(checkback.state)
    && !(workflow.lastOutcome === 'automatic_workflow_exhausted' && checkback.state === 'scheduled')
    && !(checkback.state === 'scheduled' && checkback.scheduleReason === 'operator_recovery')
  ) {
    throw invalidAggregate('reasoning_provider_workflow_review_link_invalid')
  }
}

function assertReasoningInternalCostAuthorities(aggregate: EditReferenceAggregate): void {
  const authorityIds = new Set<string>()
  const estimateIds = new Set<string>()
  const budgetIds = new Set<string>()
  const rateCardIds = new Set<string>()
  const usageEventIds = new Set<string>()
  const internalCostRecordIds = new Set<string>()

  for (const value of aggregate.reasoningInternalCostAuthorities) {
    const record = value as EditReferenceStudyChatInternalCostAuthorityRecord
    try {
      validateEditReferenceStudyChatInternalCostAuthorityRecord(record)
    } catch {
      throw invalidAggregate('reasoning_internal_cost_authority_contract_invalid')
    }
    if (
      authorityIds.has(record.id)
      || estimateIds.has(record.approvedUsageEstimateId)
      || budgetIds.has(record.internalCostBudgetId)
      || rateCardIds.has(record.immutableRateCardSnapshotId)
    ) throw invalidAggregate('reasoning_internal_cost_authority_identity_duplicate')
    authorityIds.add(record.id)
    estimateIds.add(record.approvedUsageEstimateId)
    budgetIds.add(record.internalCostBudgetId)
    rateCardIds.add(record.immutableRateCardSnapshotId)
    for (const id of record.usageEventIds) {
      if (usageEventIds.has(id)) throw invalidAggregate('reasoning_internal_cost_usage_event_duplicate')
      usageEventIds.add(id)
    }
    for (const id of record.internalCostRecordIds) {
      if (internalCostRecordIds.has(id)) throw invalidAggregate('reasoning_internal_cost_record_duplicate')
      internalCostRecordIds.add(id)
    }
    if (
      record.workspaceId !== aggregate.workspaceId
      || record.actorUserId !== aggregate.ownerUserId
      || !aggregate.references.some((candidate) => candidate.id === record.editReferenceId)
      || !aggregate.studies.some((candidate) => (
        candidate.id === record.studySessionId
        && candidate.editReferenceId === record.editReferenceId
      ))
    ) throw invalidAggregate('reasoning_internal_cost_authority_scope_invalid')

    if (!record.reasoningAttemptId) continue
    const attempt = aggregate.reasoningAttempts.find((candidate) => candidate.id === record.reasoningAttemptId)
    if (
      !attempt
      || attempt.requestDigestSha256 !== record.boundRequestDigestSha256
      || attempt.request.approvedUsageEstimateId !== record.approvedUsageEstimateId
      || attempt.request.internalCostBudgetId !== record.internalCostBudgetId
      || attempt.request.immutableRateCardSnapshotId !== record.immutableRateCardSnapshotId
      || attempt.request.maximumAuthorizedInternalCostMicros !== record.maximumAuthorizedInternalCostMicros
      || attempt.request.expectedStudyRevision !== record.studyRevisionAtApproval
      || attempt.editReferenceId !== record.editReferenceId
      || attempt.studySessionId !== record.studySessionId
    ) throw invalidAggregate('reasoning_internal_cost_authority_attempt_link_invalid')
    if (
      attempt.usageEventIds.length > 0
      && !sameStringArray(attempt.usageEventIds, record.usageEventIds)
    ) throw invalidAggregate('reasoning_internal_cost_authority_attempt_usage_mismatch')
    if (
      attempt.internalCostRecordIds.length > 0
      && !sameStringArray(attempt.internalCostRecordIds, record.internalCostRecordIds)
    ) throw invalidAggregate('reasoning_internal_cost_authority_attempt_record_mismatch')

    if (!record.reasoningProviderRequestId) continue
    const providerRequest = aggregate.reasoningProviderRequests.find(
      (candidate) => candidate.id === record.reasoningProviderRequestId,
    )
    if (
      !providerRequest
      || providerRequest.reasoningAttemptId !== attempt.id
      || providerRequest.providerRoute !== record.providerRoute
      || providerRequest.providerModelId !== record.providerModelId
      || providerRequest.providerModelRevision !== record.providerModelRevision
      || providerRequest.providerModelAggregateSha256 !== record.providerModelAggregateSha256
    ) throw invalidAggregate('reasoning_internal_cost_authority_provider_link_invalid')
  }
}

function validStableIdList(values: readonly string[]): boolean {
  return values.every((value) => typeof value === 'string' && value.length > 0 && value.length <= 200)
    && new Set(values).size === values.length
}

function assertPreferenceApplications(aggregate: EditReferenceAggregate): void {
  const references = new Map(aggregate.references.map((record) => [record.id, record]))
  const studies = new Map(aggregate.studies.map((record) => [record.id, record]))
  const dnaVersions = new Map(aggregate.dnaVersions.map((record) => [record.id, record]))
  const qaResults = new Map(aggregate.dnaQaResults.map((record) => [record.id, record]))
  const activeTargetKeys = new Set<string>()
  const versionKeys = new Set<string>()

  for (const record of aggregate.applications) {
    assertWorkspace(record, aggregate.workspaceId)
    const reference = references.get(record.editReferenceId)
    const study = studies.get(record.studySessionId)
    const dnaVersion = dnaVersions.get(record.dnaVersionId)
    const qaResult = qaResults.get(record.dnaQaResultId)
    if (
      !reference
      || !study
      || study.editReferenceId !== reference.id
      || !dnaVersion
      || dnaVersion.editReferenceId !== reference.id
      || dnaVersion.studySessionId !== study.id
      || !dnaVersion.approval
      || dnaVersion.approval.id !== record.dnaApprovalId
      || dnaVersion.contentDigest !== record.dnaContentDigest
      || dnaVersion.version !== record.dnaVersionNumber
      || !qaResult
      || qaResult.dnaVersionId !== dnaVersion.id
      || qaResult.id !== dnaVersion.qaResultId
      || qaResult.status === 'blocked'
    ) throw invalidAggregate('application_authority_link_invalid')

    const targetKey = `${record.projectId}\u0000${record.editSessionId}`
    const versionKey = `${targetKey}\u0000${record.version}`
    if (versionKeys.has(versionKey)) throw invalidAggregate('application_target_version_duplicate')
    versionKeys.add(versionKey)
    if (record.status === 'prepared') {
      if (activeTargetKeys.has(targetKey)) throw invalidAggregate('application_target_active_duplicate')
      activeTargetKeys.add(targetKey)
    }

    if (
      !record.editReferenceName
      || record.editReferenceName.length > 120
      || record.projectId !== record.targetContext.projectId
      || record.editSessionId !== record.targetContext.editSessionId
      || !Number.isSafeInteger(record.version)
      || record.version < 1
      || !['prepared', 'replaced', 'cleared'].includes(record.status)
      || !['edit-reference-target-application-v1', 'edit-reference-target-application-v2'].includes(record.applicationVersion)
      || (record.applicationSource !== undefined && !['setup_selector', 'chat_tag', 'session_panel'].includes(record.applicationSource))
      || !isApplicationTargetContext(record.targetContext)
      || record.targetContextDigest !== calculatePreferenceApplicationTargetContextDigest(record.targetContext)
      || !Array.isArray(record.decisions)
      || record.decisions.length !== dnaVersion.rules.length
      || record.decisions.length > MAX_DNA_RULES_PER_VERSION
      || !Array.isArray(record.hintGroups)
      || record.hintGroups.length < 1
      || record.hintGroups.length > 18
      || !Array.isArray(record.doNotCopyRules)
      || record.doNotCopyRules.length < 1
      || record.doNotCopyRules.length > MAX_DNA_RULES_PER_VERSION
      || !sameStringArray(record.doNotCopyRules, dnaVersion.rules.filter((rule) => rule.kind === 'do_not_copy').map((rule) => rule.statement))
      || !sameStringArray(record.precedencePolicy, EDIT_REFERENCE_APPLICATION_PRECEDENCE_POLICY)
      || !record.summary
      || record.summary.length > 2_000
      || ![
        'caller_confirmed_unverified',
        'verified_mock_project_edit_session',
        'verified_project_edit_session',
        'verified_target_video_understanding',
      ].includes(record.targetIdentityStatus)
      || !['not_connected', 'connected', 'invalidated'].includes(record.targetIntegrationStatus)
      || !['not_required', 'pending', 'completed'].includes(record.downstreamInvalidationStatus)
      || !/^[a-f0-9]{64}$/.test(record.contentDigest)
      || record.approvedPlanMutationMade !== false
      || (record.targetIntegrationStatus === 'not_connected' && (record.targetEditMutationMade !== false || record.downstreamContextWritten !== false))
      || (record.targetIntegrationStatus === 'connected' && (record.targetEditMutationMade !== true || record.downstreamContextWritten !== true))
      || (record.targetIntegrationStatus === 'invalidated' && (record.targetEditMutationMade !== true || record.downstreamContextWritten !== true))
      || record.providerCallMade !== false
      || record.modelCallMade !== false
      || record.fileBytesRead !== false
      || record.externalUrlFetched !== false
      || record.mediaProcessingStarted !== false
      || record.workerJobCreated !== false
      || record.generationRequestCreated !== false
      || record.renderJobCreated !== false
      || record.creditReservedOrSpent !== false
      || !isISODate(record.createdAt)
      || (record.updatedAt !== undefined && !isISODate(record.updatedAt))
      || (record.clearedAt !== undefined && !isISODate(record.clearedAt))
      || (record.connectedAt !== undefined && !isISODate(record.connectedAt))
      || (record.invalidatedAt !== undefined && !isISODate(record.invalidatedAt))
    ) throw invalidAggregate('application_contract_invalid')

    const isLegacyApplication = record.applicationVersion === 'edit-reference-target-application-v1'
    if (isLegacyApplication) {
      if (
        record.runtimeSource !== 'verified_mock'
        || record.targetUnderstanding !== undefined
        || (record.targetIntegrationStatus === 'not_connected' && record.targetIdentityStatus !== 'caller_confirmed_unverified')
        || (record.targetIntegrationStatus !== 'not_connected'
          && !['verified_mock_project_edit_session', 'verified_project_edit_session'].includes(record.targetIdentityStatus))
      ) throw invalidAggregate('application_v1_authority_invalid')
    } else if (
      !isApplicationTargetUnderstanding(record.targetUnderstanding)
      || record.runtimeSource !== (record.targetUnderstanding.runtimeSources.includes('verified_live') ? 'verified_live' : 'verified_local')
      || record.targetIdentityStatus !== 'verified_target_video_understanding'
    ) throw invalidAggregate('application_v2_target_understanding_invalid')

    if (record.status === 'prepared') {
      if (
        record.targetIntegrationStatus === 'invalidated'
        || record.downstreamInvalidationStatus !== 'not_required'
        || record.replacedByApplicationId
        || record.clearedAt
        || record.invalidatedAt
        || record.invalidationReason
        || record.downstreamInvalidationReceipt
      ) throw invalidAggregate('application_active_lifecycle_invalid')
    } else if (
      record.targetIntegrationStatus !== 'invalidated'
      || record.downstreamInvalidationStatus !== 'completed'
      || !record.invalidatedAt
      || !record.invalidationReason
      || !record.downstreamInvalidationReceipt
      || !record.connectedAt
      || !record.downstreamContext
      || !record.targetSessionReceipt
      || (record.status === 'replaced' && (
        record.invalidationReason !== 'replace'
        || !record.replacedByApplicationId
        || record.clearedAt !== undefined
      ))
      || (record.status === 'cleared' && (
        record.invalidationReason !== 'remove'
        || !record.clearedAt
        || record.clearedAt !== record.invalidatedAt
        || record.replacedByApplicationId !== undefined
      ))
    ) throw invalidAggregate('application_inactive_lifecycle_invalid')

    if (record.targetIntegrationStatus === 'not_connected') {
      if (record.downstreamContext || record.targetSessionReceipt || record.connectedAt) {
        throw invalidAggregate('application_unconnected_context_invalid')
      }
    }
    if (record.targetIntegrationStatus === 'connected' || record.targetIntegrationStatus === 'invalidated') {
      const expectedContext = createPreferenceApplicationDownstreamContext(record, 'connected_mock')
      const receipt = record.targetSessionReceipt
      if (
        !record.downstreamContext
        || JSON.stringify(record.downstreamContext) !== JSON.stringify(expectedContext)
        || !receipt
        || receipt.receiptVersion !== 'edit-reference-project-session-receipt-v1'
        || receipt.projectId !== record.projectId
        || receipt.editSessionId !== record.editSessionId
        || receipt.aspectRatio !== record.targetContext.aspectRatio
        || receipt.platformTarget !== record.targetContext.platformTarget
        || receipt.selectedEditLevel !== record.targetContext.selectedEditLevel
        || receipt.outputFrameConfirmed !== true
        || receipt.stagedContextHash !== expectedContext.packageHash
        || receipt.stagedApplicationContentDigest !== record.contentDigest
        || receipt.mockOnly !== true
        || !isISODate(receipt.sessionUpdatedAt)
        || !isISODate(receipt.stagedAt)
        || !record.connectedAt
      ) throw invalidAggregate('application_connected_context_invalid')
    }
    if (record.targetIntegrationStatus === 'invalidated') {
      const receipt = record.downstreamInvalidationReceipt
      if (
        !receipt
        || receipt.receiptVersion !== 'edit-reference-downstream-invalidation-receipt-v1'
        || receipt.applicationId !== record.id
        || receipt.applicationContentDigest !== record.contentDigest
        || receipt.contextHash !== record.downstreamContext?.packageHash
        || receipt.projectId !== record.projectId
        || receipt.editSessionId !== record.editSessionId
        || receipt.reason !== record.invalidationReason
        || !isISODate(receipt.sessionUpdatedAt)
        || !isISODate(receipt.invalidatedAt)
        || receipt.sessionContextInvalidated !== true
        || receipt.approvedPlanMutationMade !== false
        || receipt.mockOnly !== true
        || !isValidApprovalTransition(receipt)
        || Object.entries(PREFERENCE_APPLICATION_INTEGRATION_SAFETY_FLAGS).some(
          ([key, value]) => receipt.safety?.[key as keyof typeof PREFERENCE_APPLICATION_INTEGRATION_SAFETY_FLAGS] !== value,
        )
      ) throw invalidAggregate('application_invalidation_receipt_invalid')
    }

    const sourceRules = new Map(dnaVersion.rules.map((rule) => [rule.id, rule]))
    const targetUnderstandingEvidenceIds = new Set(record.targetUnderstanding?.evidenceIds ?? [])
    const decisionIds = new Set<string>()
    const sourceRuleIds = new Set<string>()
    for (const decision of record.decisions) {
      const sourceRule = sourceRules.get(decision.sourceRuleId)
      if (
        !decision.id
        || decisionIds.has(decision.id)
        || sourceRuleIds.has(decision.sourceRuleId)
        || !sourceRule
        || sourceRule.layerId !== decision.layerId
        || (isLegacyApplication
          ? !['adapted', 'context_only', 'blocked_from_transfer'].includes(decision.decision)
          : !['applied', 'adapted', 'ignored', 'blocked', 'needs_clarification'].includes(decision.decision))
        || !EDIT_REFERENCE_APPLICATION_PRECEDENCE_POLICY.includes(decision.precedence)
        || !decision.targetInstruction
        || decision.targetInstruction.length > 8_000
        || !decision.reason
        || decision.reason.length > 2_000
        || !Number.isFinite(decision.confidence)
        || decision.confidence < 0
        || decision.confidence > 1
        || (!isLegacyApplication && (
          decision.targetUnderstandingPackageId !== record.targetUnderstanding?.packageId
          || !Array.isArray(decision.targetEvidenceIds)
          || decision.targetEvidenceIds.length < 1
          || new Set(decision.targetEvidenceIds).size !== decision.targetEvidenceIds.length
          || decision.targetEvidenceIds.some((id) => !targetUnderstandingEvidenceIds.has(id))
          || !Number.isFinite(decision.targetEvidenceConfidence)
          || (decision.targetEvidenceConfidence ?? -1) < 0
          || (decision.targetEvidenceConfidence ?? 2) > 1
          || decision.confidence > (decision.targetEvidenceConfidence ?? -1)
          || decision.confidence > sourceRule.confidence
          || ((decision.decision === 'applied' || decision.decision === 'adapted') && decision.heldBackReason !== null)
          || ((!['applied', 'adapted'].includes(decision.decision))
            && (typeof decision.heldBackReason !== 'string'
              || decision.heldBackReason.length < 1
              || decision.heldBackReason.length > 2_000))
        ))
        || (isLegacyApplication && (
          decision.targetUnderstandingPackageId !== undefined
          || decision.targetEvidenceIds !== undefined
          || decision.targetEvidenceConfidence !== undefined
          || decision.heldBackReason !== undefined
        ))
        || (sourceRule.kind === 'do_not_copy' && (
          decision.decision !== (isLegacyApplication ? 'blocked_from_transfer' : 'blocked')
          || decision.precedence !== 'safety_platform_tier_frame_credit_or_approved_constraint'
        ))
        || (sourceRule.kind === 'context_only'
          && decision.decision !== (isLegacyApplication ? 'context_only' : 'ignored'))
      ) throw invalidAggregate('application_decision_invalid')
      decisionIds.add(decision.id)
      sourceRuleIds.add(decision.sourceRuleId)
    }
    if (!sameStringSet([...sourceRuleIds], [...sourceRules.keys()])) throw invalidAggregate('application_rule_coverage_invalid')

    const hintGroupIds = new Set<string>()
    const groupedDecisionIds = new Set<string>()
    const groupedSourceRuleIds = new Set<string>()
    for (const group of record.hintGroups) {
      if (
        !group.id
        || hintGroupIds.has(group.id)
        || !isPreferenceDNALayerId(group.layerId)
        || !group.title
        || !group.summary
        || !Array.isArray(group.decisionIds)
        || group.decisionIds.length < 1
        || group.decisionIds.some((id) => !decisionIds.has(id))
        || !Array.isArray(group.sourceRuleIds)
        || group.sourceRuleIds.length < 1
        || group.sourceRuleIds.some((id) => !sourceRuleIds.has(id))
        || group.decisionIds.some((id) => groupedDecisionIds.has(id))
        || group.sourceRuleIds.some((id) => groupedSourceRuleIds.has(id))
        || group.decisionIds.some((id) => record.decisions.find((decision) => decision.id === id)?.layerId !== group.layerId)
      ) throw invalidAggregate('application_hint_group_invalid')
      hintGroupIds.add(group.id)
      group.decisionIds.forEach((id) => groupedDecisionIds.add(id))
      group.sourceRuleIds.forEach((id) => groupedSourceRuleIds.add(id))
    }
    if (!sameStringSet([...groupedDecisionIds], [...decisionIds]) || !sameStringSet([...groupedSourceRuleIds], [...sourceRuleIds])) {
      throw invalidAggregate('application_hint_group_coverage_invalid')
    }

    const immutableContent = {
      applicationVersion: record.applicationVersion,
      ...(record.applicationSource ? { applicationSource: record.applicationSource } : {}),
      editReferenceId: record.editReferenceId,
      dnaVersionId: record.dnaVersionId,
      dnaVersionNumber: record.dnaVersionNumber,
      dnaContentDigest: record.dnaContentDigest,
      dnaApprovalId: record.dnaApprovalId,
      dnaQaResultId: record.dnaQaResultId,
      targetContext: record.targetContext,
      targetContextDigest: record.targetContextDigest,
      ...(record.targetUnderstanding ? { targetUnderstanding: record.targetUnderstanding } : {}),
      decisions: record.decisions,
      hintGroups: record.hintGroups,
      doNotCopyRules: record.doNotCopyRules,
      precedencePolicy: record.precedencePolicy,
      summary: record.summary,
    }
    if (record.contentDigest !== calculatePreferenceApplicationContentDigest(immutableContent)) {
      throw invalidAggregate('application_content_digest_invalid')
    }
  }

  const applicationsById = new Map(aggregate.applications.map((record) => [record.id, record]))
  for (const record of aggregate.applications) {
    if (record.replacesApplicationId) {
      const replaced = applicationsById.get(record.replacesApplicationId)
      if (
        !replaced
        || replaced.id === record.id
        || replaced.status !== 'replaced'
        || replaced.replacedByApplicationId !== record.id
        || replaced.projectId !== record.projectId
        || replaced.editSessionId !== record.editSessionId
        || replaced.version + 1 !== record.version
      ) throw invalidAggregate('application_replacement_forward_link_invalid')
    }
    if (record.replacedByApplicationId) {
      const replacement = applicationsById.get(record.replacedByApplicationId)
      if (!replacement || replacement.replacesApplicationId !== record.id) {
        throw invalidAggregate('application_replacement_reverse_link_invalid')
      }
    }
  }
}

function isValidApprovalTransition(
  receipt: NonNullable<EditReferenceAggregate['applications'][number]['downstreamInvalidationReceipt']>,
): boolean {
  const statuses = ['not_requested', 'requested', 'approved', 'rejected', 'reset_after_revision']
  if (!statuses.includes(receipt.approvalStatusBefore) || !statuses.includes(receipt.approvalStatusAfter)) return false
  return receipt.approvalResetRequired
    ? receipt.approvalStatusAfter === 'reset_after_revision'
    : receipt.approvalStatusAfter === receipt.approvalStatusBefore
}

function isApplicationTargetContext(value: EditReferenceAggregate['applications'][number]['targetContext']): boolean {
  return Boolean(
    value
    && value.projectId
    && value.projectId.length <= 200
    && value.editSessionId
    && value.editSessionId.length <= 200
    && value.projectName
    && value.projectName.length <= 160
    && value.editName
    && value.editName.length <= 160
    && ['voice_first', 'mixed', 'silent_visual'].includes(value.sourceMode)
    && ['tutorial', 'documentary', 'lifestyle_montage', 'talking_head', 'product_demo', 'custom'].includes(value.contentType)
    && value.sourceSummary
    && value.sourceSummary.length <= 2_000
    && value.currentUserInstruction
    && value.currentUserInstruction.length <= 4_000
    && ['normal', 'premium', 'ultra_premium'].includes(value.selectedEditLevel)
    && ['9:16', '16:9', '1:1', '4:5'].includes(value.aspectRatio)
    && value.outputFrameConfirmed === true
    && ['tiktok_reel', 'instagram_reel', 'instagram_feed', 'youtube_shorts', 'youtube_standard', 'linkedin', 'website', 'podcast_clip', 'ad_creative', 'internal_review', 'custom'].includes(value.platformTarget)
    && value.storyRole
    && value.storyRole.length <= 500
    && ['efficient', 'balanced', 'cinematic'].includes(value.budgetPreference)
    && value.directives
    && ['adapt', 'required', 'avoid'].includes(value.directives.captions)
    && ['adapt', 'required', 'avoid'].includes(value.directives.music)
    && ['adapt', 'required', 'avoid'].includes(value.directives.sfx)
    && ['adapt', 'preserve'].includes(value.directives.sourceOrder)
    && Array.isArray(value.approvedConstraints)
    && value.approvedConstraints.length <= 12
    && value.approvedConstraints.every((constraint) => typeof constraint === 'string' && constraint.length > 0 && constraint.length <= 500)
  )
}

function isApplicationTargetUnderstanding(
  value: EditReferenceAggregate['applications'][number]['targetUnderstanding'],
): value is NonNullable<EditReferenceAggregate['applications'][number]['targetUnderstanding']> {
  if (!value) return false
  const runtimeSources = new Set(value.runtimeSources)
  const evidenceIds = new Set(value.evidenceIds)
  return Boolean(
    value.packageId
    && value.packageId.length <= 500
    && /^[a-f0-9]{64}$/.test(value.packageDigestSha256)
    && value.sourceStorageObjectRecordId
    && value.sourceStorageObjectRecordId.length <= 500
    && value.sourceMediaAssetId
    && value.sourceMediaAssetId.length <= 500
    && value.editBriefId
    && value.editBriefId.length <= 500
    && Number.isSafeInteger(value.editBriefRevision)
    && value.editBriefRevision > 0
    && /^[a-f0-9]{64}$/.test(value.editBriefDigestSha256)
    && value.studyRunId
    && value.studyRunId.length <= 500
    && /^[a-f0-9]{64}$/.test(value.studyPlanDigestSha256)
    && /^[a-f0-9]{64}$/.test(value.contextDigestSha256)
    && Array.isArray(value.evidenceIds)
    && value.evidenceIds.length > 0
    && value.evidenceIds.length <= 50_000
    && evidenceIds.size === value.evidenceIds.length
    && value.evidenceIds.every((id) => typeof id === 'string' && id.length > 0 && id.length <= 500)
    && Number.isFinite(value.confidence)
    && value.confidence >= 0
    && value.confidence <= 1
    && Array.isArray(value.runtimeSources)
    && value.runtimeSources.length > 0
    && runtimeSources.size === value.runtimeSources.length
    && value.runtimeSources.every((source) => source === 'verified_local' || source === 'verified_live')
    && value.everyRequiredOutputVerified === true
    && value.everySemanticRuntimeAuthoritative === true
    && value.everyRequiredOutputCostAuthoritySatisfied === true
    && value.coverageQaPassed === true
    && value.callerSourceSummaryUsedAsStudyEvidence === false
  )
}

function assertDNAVersions(aggregate: EditReferenceAggregate, evidenceIds: Set<string>): void {
  const versionKeys = new Set<string>()
  const materializedReasoningAttemptIds = new Set<string>()
  for (const record of aggregate.dnaVersions) {
    const versionKey = `${record.studySessionId}:${record.version}`
    if (versionKeys.has(versionKey)) throw invalidAggregate('dna_version_number_duplicate')
    versionKeys.add(versionKey)
    if (
      !Number.isSafeInteger(record.version)
      || record.version < 1
      || !['draft', 'review_required', 'approved', 'superseded'].includes(record.status)
      || !['edit-reference-dna-synthesis-v1', EDIT_REFERENCE_QWEN_DNA_SYNTHESIS_VERSION].includes(record.synthesisVersion)
      || !['verified_mock', 'verified_controlled', 'verified_live'].includes(record.runtimeSource)
      || !Array.isArray(record.inputEvidenceRevisions)
      || record.inputEvidenceRevisions.length < 1
      || record.inputEvidenceRevisions.length > MAX_DNA_INPUTS_PER_VERSION
      || !/^[a-f0-9]{64}$/.test(record.inputEvidenceDigest)
      || !Array.isArray(record.layers)
      || !Array.isArray(record.rules)
      || !Array.isArray(record.conflicts)
      || record.layers.length < 1
      || record.layers.length > 18
      || record.rules.length < 1
      || record.rules.length > MAX_DNA_RULES_PER_VERSION
      || record.conflicts.length > MAX_DNA_CONFLICTS_PER_VERSION
      || !Number.isFinite(record.overallConfidence)
      || record.overallConfidence < 0
      || record.overallConfidence > 1
      || !['low', 'medium', 'high', 'very_high'].includes(record.overallConfidenceBand)
      || record.adaptedNotCopied !== true
      || !Number.isSafeInteger(record.doNotCopyRuleCount)
      || record.doNotCopyRuleCount < 5
      || !['not_run', 'passed', 'blocked', 'requires_user_review'].includes(record.qaStatus)
      || (record.qaStatus === 'not_run' && record.qaResultId !== undefined)
      || (record.qaStatus !== 'not_run' && !record.qaResultId)
      || (record.supersededAt !== undefined && !isISODate(record.supersededAt))
      || !/^[a-f0-9]{64}$/.test(record.contentDigest)
      || record.mediaProcessingStarted !== false
      || record.workerJobCreated !== false
      || record.generationRequestCreated !== false
      || record.renderJobCreated !== false
      || record.creditReservedOrSpent !== false
      || record.reasoningReview !== undefined
      || !isISODate(record.createdAt)
    ) throw invalidAggregate('dna_version_contract_invalid')
    if (record.synthesisVersion === 'edit-reference-dna-synthesis-v1') {
      if (
        record.runtimeSource !== 'verified_mock'
        || record.reasoningProvenance !== undefined
        || record.providerCallMade !== false
        || record.modelCallMade !== false
      ) throw invalidAggregate('dna_deterministic_provenance_invalid')
    } else {
      const provenance = record.reasoningProvenance
      const attempt = provenance
        ? aggregate.preferenceDnaReasoningAttempts.find((candidate) => candidate.id === provenance.reasoningAttemptId)
        : undefined
      try {
        if (!attempt) throw new Error('missing_attempt')
        validateEditReferenceQwenDnaVersionAttemptBinding(record, attempt)
      } catch {
        throw invalidAggregate('dna_qwen_provenance_invalid')
      }
      if (
        !provenance
        || !attempt
        || materializedReasoningAttemptIds.has(provenance.reasoningAttemptId)
        || attempt.state !== 'completed'
        || !attempt.candidateHandoffAllowed
        || attempt.requestDigestSha256 !== provenance.requestDigestSha256
        || attempt.resultDigestSha256 !== provenance.resultDigestSha256
        || attempt.request.structuredContextDigestSha256 !== provenance.structuredContextDigestSha256
        || attempt.request.inputEvidenceDigestSha256 !== record.inputEvidenceDigest
      ) throw invalidAggregate('dna_qwen_attempt_link_invalid')
      materializedReasoningAttemptIds.add(provenance.reasoningAttemptId)
    }
    const inputEvidenceIds = new Set(record.inputEvidenceRevisions.map((input) => input.evidenceId))
    if (inputEvidenceIds.size !== record.inputEvidenceRevisions.length) throw invalidAggregate('dna_input_evidence_duplicate')
    const sortedInputRevisions = record.inputEvidenceRevisions.slice().sort((left, right) => left.evidenceId.localeCompare(right.evidenceId))
    if (stableStringify(record.inputEvidenceRevisions) !== stableStringify(sortedInputRevisions)) {
      throw invalidAggregate('dna_input_evidence_order_invalid')
    }
    for (const input of record.inputEvidenceRevisions) {
      const evidence = aggregate.evidence.find((candidate) => candidate.id === input.evidenceId)
      if (
        !evidence
        || evidence.editReferenceId !== record.editReferenceId
        || evidence.studySessionId !== record.studySessionId
        || evidence.revision !== input.revision
      ) {
        throw invalidAggregate('dna_input_evidence_revision_invalid')
      }
    }
    if (record.inputEvidenceDigest !== sha256(stableStringify(record.inputEvidenceRevisions))) {
      throw invalidAggregate('dna_input_evidence_digest_invalid')
    }
    const ruleIds = new Set(record.rules.map((rule) => rule.id))
    if (ruleIds.size !== record.rules.length) throw invalidAggregate('dna_rule_id_duplicate')
    if (!record.rules.some((rule) => rule.kind === 'must_follow')) throw invalidAggregate('dna_transferable_rule_missing')
    for (const rule of record.rules) {
      if (
        !rule.id
        || !isPreferenceDNALayerId(rule.layerId)
        || !['must_follow', 'avoid', 'do_not_copy', 'context_only'].includes(rule.kind)
        || !rule.statement
        || rule.statement.length > 8_000
        || !Array.isArray(rule.evidenceIds)
        || rule.evidenceIds.length < 1
        || rule.evidenceIds.some((id) => !evidenceIds.has(id) || !inputEvidenceIds.has(id))
        || !Number.isFinite(rule.confidence)
        || rule.confidence < 0
        || rule.confidence > 1
        || !['transferable', 'non_transferable', 'do_not_copy', 'requires_user_review', 'unknown'].includes(rule.transferability)
        || !['evidence_synthesis', 'qwen_reasoning_candidate', 'deterministic_safety_rule'].includes(rule.source)
        || (rule.source === 'deterministic_safety_rule' && rule.kind !== 'do_not_copy')
        || !Array.isArray(rule.targetConditions)
        || rule.targetConditions.length < 1
      ) throw invalidAggregate('dna_rule_contract_invalid')
    }
    const layerIds = new Set(record.layers.map((layer) => layer.layerId))
    if (layerIds.size !== record.layers.length) throw invalidAggregate('dna_layer_id_duplicate')
    for (const layer of record.layers) {
      const expectedRules = record.rules.filter((rule) => rule.layerId === layer.layerId)
      const expectedRuleIds = expectedRules.map((rule) => rule.id)
      const expectedEvidenceIds = [...new Set(expectedRules.flatMap((rule) => rule.evidenceIds))]
      if (
        !isPreferenceDNALayerId(layer.layerId)
        || !layer.title
        || !layer.summary
        || !Array.isArray(layer.evidenceIds)
        || layer.evidenceIds.length < 1
        || layer.evidenceIds.some((id) => !evidenceIds.has(id) || !inputEvidenceIds.has(id))
        || !Array.isArray(layer.ruleIds)
        || layer.ruleIds.length < 1
        || layer.ruleIds.some((id) => !ruleIds.has(id))
        || !sameStringSet(layer.ruleIds, expectedRuleIds)
        || !sameStringSet(layer.evidenceIds, expectedEvidenceIds)
        || !Number.isFinite(layer.confidence)
        || layer.confidence < 0
        || layer.confidence > 1
        || !['low', 'medium', 'high', 'very_high'].includes(layer.confidenceBand)
        || !['transferable', 'non_transferable', 'do_not_copy', 'requires_user_review', 'unknown'].includes(layer.transferability)
        || !['covered', 'review_required'].includes(layer.coverage)
      ) throw invalidAggregate('dna_layer_contract_invalid')
    }
    for (const conflict of record.conflicts) {
      if (
        !conflict.id
        || !['review_required_evidence', 'non_transferable_evidence', 'reasoning_contradiction', 'reasoning_non_transferable_detail'].includes(conflict.kind)
        || !conflict.title
        || !conflict.summary
        || !Array.isArray(conflict.evidenceIds)
        || conflict.evidenceIds.length < 1
        || conflict.evidenceIds.some((id) => !evidenceIds.has(id) || !inputEvidenceIds.has(id))
        || !['medium', 'high'].includes(conflict.severity)
        || conflict.requiresUserReview !== true
      ) throw invalidAggregate('dna_conflict_contract_invalid')
    }
    if (record.rules.filter((rule) => rule.kind === 'do_not_copy').length !== record.doNotCopyRuleCount) {
      throw invalidAggregate('dna_do_not_copy_count_invalid')
    }
    if (record.contentDigest !== calculateEditReferenceDNAContentDigest(record)) {
      throw invalidAggregate('dna_content_digest_invalid')
    }
  }
}

function assertDNAQAResults(aggregate: EditReferenceAggregate): void {
  const dnaVersions = new Map(aggregate.dnaVersions.map((record) => [record.id, record]))
  const qaByVersion = new Set<string>()
  for (const record of aggregate.dnaQaResults) {
    assertWorkspace(record, aggregate.workspaceId)
    const dnaVersion = dnaVersions.get(record.dnaVersionId)
    if (!dnaVersion || dnaVersion.editReferenceId !== record.editReferenceId || dnaVersion.studySessionId !== record.studySessionId) {
      throw invalidAggregate('dna_qa_version_link_invalid')
    }
    if (qaByVersion.has(record.dnaVersionId)) throw invalidAggregate('dna_qa_version_duplicate')
    qaByVersion.add(record.dnaVersionId)
    if (
      record.dnaVersionNumber !== dnaVersion.version
      || !['edit-reference-dna-qa-v1', 'edit-reference-dna-qa-v2'].includes(record.qaVersion)
      || (record.qaVersion === 'edit-reference-dna-qa-v1'
        && dnaVersion.synthesisVersion !== 'edit-reference-dna-synthesis-v1')
      || record.runtimeSource !== 'verified_mock'
      || !['passed', 'blocked', 'requires_user_review'].includes(record.status)
      || record.dnaContentDigest !== dnaVersion.contentDigest
      || record.inputEvidenceDigest !== dnaVersion.inputEvidenceDigest
      || !Array.isArray(record.checks)
      || record.checks.length !== (record.qaVersion === 'edit-reference-dna-qa-v1'
        ? EDIT_REFERENCE_DNA_QA_V1_CHECK_IDS.length
        : EDIT_REFERENCE_DNA_QA_CHECK_IDS.length)
      || !Array.isArray(record.blockingCheckIds)
      || !Array.isArray(record.reviewCheckIds)
      || !record.summary
      || record.summary.length > 2_000
      || !/^[a-f0-9]{64}$/.test(record.contentDigest)
      || record.providerCallMade !== false
      || record.modelCallMade !== false
      || record.fileBytesRead !== false
      || record.externalUrlFetched !== false
      || record.mediaProcessingStarted !== false
      || record.workerJobCreated !== false
      || record.generationRequestCreated !== false
      || record.renderJobCreated !== false
      || record.creditReservedOrSpent !== false
      || !isISODate(record.createdAt)
    ) throw invalidAggregate('dna_qa_contract_invalid')

    const inputEvidenceIds = new Set(dnaVersion.inputEvidenceRevisions.map((input) => input.evidenceId))
    const ruleIds = new Set(dnaVersion.rules.map((rule) => rule.id))
    const checkIds = new Set(record.checks.map((check) => check.checkId))
    const checkRecordIds = new Set(record.checks.map((check) => check.id))
    const expectedCheckIds = record.qaVersion === 'edit-reference-dna-qa-v1'
      ? EDIT_REFERENCE_DNA_QA_V1_CHECK_IDS
      : EDIT_REFERENCE_DNA_QA_CHECK_IDS
    if (
      checkIds.size !== record.checks.length
      || checkRecordIds.size !== record.checks.length
      || !sameStringSet([...checkIds], [...expectedCheckIds])
    ) throw invalidAggregate('dna_qa_check_identity_invalid')
    for (const check of record.checks) {
      const checkContent = {
        checkId: check.checkId,
        status: check.status,
        severity: check.severity,
        title: check.title,
        summary: check.summary,
        recommendation: check.recommendation,
        evidenceIds: check.evidenceIds,
        layerIds: check.layerIds,
        ruleIds: check.ruleIds,
        blocksApproval: check.blocksApproval,
        requiresUserReview: check.requiresUserReview,
      }
      if (
        !EDIT_REFERENCE_DNA_QA_CHECK_IDS.includes(check.checkId)
        || !['passed', 'blocked', 'requires_user_review'].includes(check.status)
        || !['info', 'medium', 'high', 'critical'].includes(check.severity)
        || !check.title
        || check.title.length > 240
        || !check.summary
        || check.summary.length > 2_000
        || !check.recommendation
        || check.recommendation.length > 2_000
        || !Array.isArray(check.evidenceIds)
        || new Set(check.evidenceIds).size !== check.evidenceIds.length
        || check.evidenceIds.some((id) => !inputEvidenceIds.has(id))
        || !Array.isArray(check.layerIds)
        || new Set(check.layerIds).size !== check.layerIds.length
        || check.layerIds.some((id) => !isPreferenceDNALayerId(id))
        || !Array.isArray(check.ruleIds)
        || new Set(check.ruleIds).size !== check.ruleIds.length
        || check.ruleIds.some((id) => !ruleIds.has(id))
        || check.blocksApproval !== (check.status === 'blocked')
        || check.requiresUserReview !== (check.status !== 'passed')
        || check.id !== stableId('edit-reference-dna-qa-check', checkContent)
      ) throw invalidAggregate('dna_qa_check_contract_invalid')
    }
    const expectedBlockingIds = unique(record.checks.filter((check) => check.blocksApproval).map((check) => check.checkId))
    const expectedReviewIds = unique(record.checks.filter((check) => check.requiresUserReview && !check.blocksApproval).map((check) => check.checkId))
    const expectedStatus = expectedBlockingIds.length ? 'blocked' : expectedReviewIds.length ? 'requires_user_review' : 'passed'
    if (
      record.status !== expectedStatus
      || new Set(record.blockingCheckIds).size !== record.blockingCheckIds.length
      || new Set(record.reviewCheckIds).size !== record.reviewCheckIds.length
      || !sameStringSet(record.blockingCheckIds, expectedBlockingIds)
      || !sameStringSet(record.reviewCheckIds, expectedReviewIds)
    ) throw invalidAggregate('dna_qa_decision_invalid')
    const immutableContent = {
      qaVersion: record.qaVersion,
      dnaVersionId: record.dnaVersionId,
      dnaVersionNumber: record.dnaVersionNumber,
      dnaContentDigest: record.dnaContentDigest,
      inputEvidenceDigest: record.inputEvidenceDigest,
      checks: record.checks,
      blockingCheckIds: record.blockingCheckIds,
      reviewCheckIds: record.reviewCheckIds,
      status: record.status,
      summary: record.summary,
    }
    if (record.contentDigest !== sha256(stableStringify(immutableContent))) throw invalidAggregate('dna_qa_content_digest_invalid')
  }
}

function assertDNAApprovalLinks(aggregate: EditReferenceAggregate): void {
  const qaById = new Map(aggregate.dnaQaResults.map((record) => [record.id, record]))
  const approvalIds = new Set<string>()
  for (const version of aggregate.dnaVersions) {
    const qaResult = version.qaResultId ? qaById.get(version.qaResultId) : undefined
    if (version.qaStatus === 'not_run') {
      if (qaResult) throw invalidAggregate('dna_unexpected_qa_link')
    } else if (!qaResult || qaResult.dnaVersionId !== version.id || qaResult.status !== version.qaStatus) {
      throw invalidAggregate('dna_qa_status_link_invalid')
    }
    if ((version.status === 'approved') !== Boolean(version.approval)) {
      if (version.status !== 'superseded' || !version.approval) throw invalidAggregate('dna_approval_status_invalid')
    }
    if (!version.approval) continue
    if (approvalIds.has(version.approval.id)) throw invalidAggregate('dna_approval_identity_duplicate')
    approvalIds.add(version.approval.id)
    const approvalQA = qaById.get(version.approval.qaResultId)
    if (
      !version.approval.id
      || version.approval.qaResultId !== version.qaResultId
      || version.approval.acknowledgedAdaptNotCopy !== true
      || typeof version.approval.acknowledgedQAReview !== 'boolean'
      || version.approval.approvedBy !== 'authenticated_user'
      || !isISODate(version.approval.approvedAt)
      || !approvalQA
      || approvalQA.dnaVersionId !== version.id
      || approvalQA.status === 'blocked'
      || (approvalQA.status === 'requires_user_review' && version.approval.acknowledgedQAReview !== true)
    ) throw invalidAggregate('dna_approval_contract_invalid')
    if (version.reasoningProvenance) {
      const attempt = aggregate.preferenceDnaReasoningAttempts.find((candidate) => (
        candidate.id === version.reasoningProvenance?.reasoningAttemptId
      ))
      if (!attempt || !version.approval.reasoningReview) throw invalidAggregate('dna_reasoning_approval_missing')
      try {
        validateEditReferencePreferenceDnaReasoningApprovalSnapshot({
          version,
          qaResult: approvalQA,
          attempt,
          snapshot: version.approval.reasoningReview,
        })
      } catch {
        throw invalidAggregate('dna_reasoning_approval_invalid')
      }
    } else if (version.approval.reasoningReview) {
      throw invalidAggregate('dna_deterministic_reasoning_approval_invalid')
    }
  }
}

function sameStringSet(left: string[], right: string[]): boolean {
  const leftSet = new Set(left)
  const rightSet = new Set(right)
  return leftSet.size === left.length
    && rightSet.size === right.length
    && leftSet.size === rightSet.size
    && [...leftSet].every((value) => rightSet.has(value))
}

function sameStringArray(left: readonly string[], right: readonly string[]): boolean {
  return left.length === right.length && left.every((value, index) => value === right[index])
}

function isPreferenceDNALayerId(value: unknown): boolean {
  return [
    'content_type', 'structure_story_flow', 'pacing_timing', 'speech_caption_behavior', 'visual_scene_language',
    'music_soundsync', 'sfx_sound_design', 'graphic_design_visualexplain', 'ui_document_card_treatment',
    'broll_shot_language', 'color_tone_space', 'signature_system_policy', 'edit_quality_preference',
    'cost_compute_policy', 'transferable_rules', 'non_transferable_details', 'do_not_copy_rules', 'qa_confidence',
  ].includes(String(value))
}

function assertEvidenceRecord(record: EditReferenceAggregate['evidence'][number], evidenceIds: Set<string>): void {
  if (
    !['manual_user_evidence', 'reference_video_metadata', 'previous_approved_edit_snapshot', 'derived_skill_evidence'].includes(record.sourceType)
    || !['all_goals', 'media_structure', 'visual_language', 'story_and_pacing', 'captions', 'color', 'b_roll', 'audio_and_sfx', 'graphics', 'copy_safety'].includes(record.category)
    || !record.title
    || record.title.length > 160
    || !record.summary
    || record.summary.length > 4_000
    || !Number.isSafeInteger(record.revision)
    || record.revision < 1
    || !Number.isFinite(record.confidence)
    || record.confidence < 0
    || record.confidence > 1
    || !['user_asserted', 'metadata_verified', 'deterministic_derived', 'blocked'].includes(record.confidenceBasis)
    || !['transferable', 'non_transferable', 'do_not_copy', 'requires_user_review', 'unknown'].includes(record.transferability)
    || !isRecord(record.provenance)
    || !['user_input', 'verified_local', 'verified_live', 'verified_mock', 'fallback', 'blocked'].includes(record.provenance.runtimeSource)
    || !['not_applicable', 'media_not_studied', 'media_studied_local_partial', 'media_study_blocked', 'approved_edit_identity_not_verified', 'approved_edit_verified'].includes(record.provenance.mediaStudyStatus)
    || !Array.isArray(record.provenance.sourceEvidenceIds)
    || !Array.isArray(record.provenance.toolIds)
    || !Array.isArray(record.provenance.skillIds)
    || !Array.isArray(record.provenance.notes)
    || (record.provenance.analysisArtifactIds !== undefined && (
      !Array.isArray(record.provenance.analysisArtifactIds)
      || record.provenance.analysisArtifactIds.some((id) => typeof id !== 'string' || !id || id.length > 240)
    ))
    || typeof record.provenance.fallbackUsed !== 'boolean'
  ) throw invalidAggregate('evidence_contract_invalid')
  if (record.provenance.sourceEvidenceIds.some((id) => typeof id !== 'string' || !evidenceIds.has(id))) {
    throw invalidAggregate('evidence_provenance_link_invalid')
  }
  if (record.provenance.semanticRuntime) {
    assertSemanticRuntimeProvenance(record.provenance.semanticRuntime, record.provenance.runtimeSource)
  } else if (record.provenance.runtimeSource === 'verified_live') {
    throw invalidAggregate('evidence_live_runtime_provenance_missing')
  }
  if (record.mediaMetadata) assertMediaMetadata(record.mediaMetadata)
}

function assertSemanticRuntimeProvenance(
  value: NonNullable<EditReferenceAggregate['evidence'][number]['provenance']['semanticRuntime']>,
  runtimeSource: EditReferenceAggregate['evidence'][number]['provenance']['runtimeSource'],
): void {
  const expectedKeys = [
    'schemaVersion', 'adapterId', 'adapterVersion', 'providerId', 'modelId', 'modelRevision',
    'modelAggregateSha256', 'modelRoutingPolicyVersion', 'instructionDigestSha256', 'executionId',
    'startedAt', 'completedAt', 'providerCallMade', 'modelCallMade', 'workerJobCreated',
    'temporaryInputsCleaned', 'meteredInternalCostMicros', 'usageEventIds', 'internalCostRecordIds',
    'customerPriceCalculated', 'customerCreditsMutated', 'serviceFeeIncluded',
  ]
  const idPattern = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,199}$/
  const ids = [value.adapterId, value.adapterVersion, value.modelId, value.modelRevision, value.modelRoutingPolicyVersion, value.executionId]
  if (
    Object.keys(value).length !== expectedKeys.length
    || expectedKeys.some((key) => !(key in value))
    || value.schemaVersion !== 'edit-reference-semantic-runtime-provenance-v1'
    || ids.some((id) => !idPattern.test(id))
    || !/^[a-f0-9]{64}$/.test(value.modelAggregateSha256)
    || !/^[a-f0-9]{64}$/.test(value.instructionDigestSha256)
    || !isISODate(value.startedAt)
    || !isISODate(value.completedAt)
    || Date.parse(value.completedAt) < Date.parse(value.startedAt)
    || typeof value.providerCallMade !== 'boolean'
    || typeof value.modelCallMade !== 'boolean'
    || typeof value.workerJobCreated !== 'boolean'
    || typeof value.temporaryInputsCleaned !== 'boolean'
    || !/^(?:0|[1-9][0-9]{0,15})$/.test(value.meteredInternalCostMicros)
    || !isBoundedUniqueIds(value.usageEventIds)
    || !isBoundedUniqueIds(value.internalCostRecordIds)
    || value.customerPriceCalculated !== false
    || value.customerCreditsMutated !== false
    || value.serviceFeeIncluded !== false
  ) throw invalidAggregate('evidence_semantic_runtime_provenance_invalid')
  if (runtimeSource === 'verified_live') {
    if (
      !value.providerId
      || !idPattern.test(value.providerId)
      || value.providerCallMade !== true
      || value.modelCallMade !== true
      || BigInt(value.meteredInternalCostMicros) <= 0n
      || value.usageEventIds.length < 1
      || value.internalCostRecordIds.length < 1
    ) throw invalidAggregate('evidence_live_runtime_provenance_invalid')
  } else if (
    runtimeSource !== 'verified_local'
    || value.providerId !== null
    || value.providerCallMade !== false
  ) {
    throw invalidAggregate('evidence_semantic_runtime_source_invalid')
  }
}

function isBoundedUniqueIds(value: unknown): value is string[] {
  return Array.isArray(value)
    && value.length <= 64
    && value.every((id) => typeof id === 'string' && /^[A-Za-z0-9][A-Za-z0-9._:-]{0,199}$/.test(id))
    && new Set(value).size === value.length
}

function assertAssetRecord(record: EditReferenceAggregate['assets'][number]): void {
  if (
    !record.privateAssetId
    || !['reference_video_metadata', 'previous_approved_edit_snapshot'].includes(record.assetKind)
    || !record.label
    || record.label.length > 240
    || !['user_owned', 'licensed_or_authorized', 'reference_only', 'workspace_approved_edit'].includes(record.rightsBasis)
    || !['media_not_studied', 'media_studied_local_partial', 'media_study_blocked', 'approved_edit_identity_not_verified', 'approved_edit_verified'].includes(record.mediaStudyStatus)
    || (Boolean(record.storageObjectRecordId) !== Boolean(record.mediaAssetId))
    || (record.representativeFrameCount !== undefined && (!Number.isSafeInteger(record.representativeFrameCount) || record.representativeFrameCount < 0 || record.representativeFrameCount > 12))
    || (record.keyframeSampleCount !== undefined && (!Number.isSafeInteger(record.keyframeSampleCount) || record.keyframeSampleCount < 0 || record.keyframeSampleCount > 12))
    || (record.mediaAnalysisReportId !== undefined && (!record.mediaAnalysisReportId || record.mediaAnalysisReportId.length > 240))
    || (record.technicalAudioStatus !== undefined && !['verified_local', 'blocked', 'not_applicable'].includes(record.technicalAudioStatus))
    || (record.technicalAudioLowLevel !== undefined && (!record.technicalAudioLowLevel || typeof record.technicalAudioLowLevel !== 'object' || Array.isArray(record.technicalAudioLowLevel)))
    || (record.technicalSceneBoundaryStatus !== undefined && !['verified_local_bounded', 'blocked', 'not_run'].includes(record.technicalSceneBoundaryStatus))
    || (record.technicalSceneBoundaryCount !== undefined && (!Number.isSafeInteger(record.technicalSceneBoundaryCount) || record.technicalSceneBoundaryCount < 0 || record.technicalSceneBoundaryCount > 50))
    || (record.technicalSceneBoundaryTimesSeconds !== undefined && (
      !Array.isArray(record.technicalSceneBoundaryTimesSeconds)
      || record.technicalSceneBoundaryTimesSeconds.length > 50
      || record.technicalSceneBoundaryTimesSeconds.some((time) => !Number.isFinite(time) || time <= 0 || time > 86_400)
    ))
    || (record.technicalSceneBoundaryCount !== undefined && record.technicalSceneBoundaryTimesSeconds !== undefined && record.technicalSceneBoundaryCount !== record.technicalSceneBoundaryTimesSeconds.length)
    || (record.technicalSceneBoundaryCoverage !== undefined && !['full', 'partial', 'not_run'].includes(record.technicalSceneBoundaryCoverage))
    || (record.technicalSceneBoundaryThreshold !== undefined && (!Number.isFinite(record.technicalSceneBoundaryThreshold) || record.technicalSceneBoundaryThreshold < 0.05 || record.technicalSceneBoundaryThreshold > 0.95))
    || (record.technicalSceneBoundaryScannedDurationSeconds !== undefined && (!Number.isFinite(record.technicalSceneBoundaryScannedDurationSeconds) || record.technicalSceneBoundaryScannedDurationSeconds < 0 || record.technicalSceneBoundaryScannedDurationSeconds > 600))
    || (record.technicalSourceConditionSignal !== undefined && (!record.technicalSourceConditionSignal || typeof record.technicalSourceConditionSignal !== 'object' || Array.isArray(record.technicalSourceConditionSignal)))
    || (record.technicalEdgeWidthSignal !== undefined && (!record.technicalEdgeWidthSignal || typeof record.technicalEdgeWidthSignal !== 'object' || Array.isArray(record.technicalEdgeWidthSignal)))
    || (record.technicalCaptionRegionSignal !== undefined && (!record.technicalCaptionRegionSignal || typeof record.technicalCaptionRegionSignal !== 'object' || Array.isArray(record.technicalCaptionRegionSignal)))
    || (record.technicalColorSignal !== undefined && (!record.technicalColorSignal || typeof record.technicalColorSignal !== 'object' || Array.isArray(record.technicalColorSignal)))
    || (record.technicalMotionSignal !== undefined && (!record.technicalMotionSignal || typeof record.technicalMotionSignal !== 'object' || Array.isArray(record.technicalMotionSignal)))
    || (record.technicalStudyUsage !== undefined && (!record.technicalStudyUsage || typeof record.technicalStudyUsage !== 'object' || Array.isArray(record.technicalStudyUsage)))
    || (record.longFormStudy !== undefined && (!record.longFormStudy || typeof record.longFormStudy !== 'object' || Array.isArray(record.longFormStudy)))
    || (record.lastStudyAt !== undefined && !isISODate(record.lastStudyAt))
    || (record.lastStudyBlocker !== undefined && (!record.lastStudyBlocker || record.lastStudyBlocker.length > 500))
  ) throw invalidAggregate('asset_contract_invalid')
  if (
    ['media_studied_local_partial', 'media_study_blocked'].includes(record.mediaStudyStatus)
    && (!record.storageObjectRecordId || !record.mediaAssetId)
  ) throw invalidAggregate('studied_media_asset_identity_invalid')
  if (
    record.technicalSceneBoundaryStatus === 'verified_local_bounded'
    && (
      record.technicalSceneBoundaryCount === undefined
      || record.technicalSceneBoundaryTimesSeconds === undefined
      || !['full', 'partial'].includes(record.technicalSceneBoundaryCoverage ?? '')
      || record.technicalSceneBoundaryThreshold === undefined
      || record.technicalSceneBoundaryScannedDurationSeconds === undefined
      || record.technicalSceneBoundaryScannedDurationSeconds <= 0
    )
  ) throw invalidAggregate('asset_scene_boundary_contract_invalid')
  if (
    ['blocked', 'not_run'].includes(record.technicalSceneBoundaryStatus ?? '')
    && ((record.technicalSceneBoundaryCount ?? 0) !== 0 || (record.technicalSceneBoundaryTimesSeconds?.length ?? 0) !== 0)
  ) throw invalidAggregate('asset_scene_boundary_blocked_result_invalid')
  if (record.technicalAudioLowLevel) assertTechnicalAudioLowLevel(record.technicalAudioLowLevel)
  if (record.technicalSourceConditionSignal) assertTechnicalSourceConditionSignal(record.technicalSourceConditionSignal)
  if (record.technicalEdgeWidthSignal) assertTechnicalEdgeWidthSignal(record.technicalEdgeWidthSignal)
  if (record.technicalCaptionRegionSignal) assertTechnicalCaptionRegionSignal(record.technicalCaptionRegionSignal)
  if (record.technicalColorSignal) assertTechnicalColorSignal(record.technicalColorSignal)
  if (record.technicalMotionSignal) assertTechnicalMotionSignal(record.technicalMotionSignal)
  if (record.technicalStudyUsage) {
    try {
      validateEditReferenceTechnicalStudyUsage(record.technicalStudyUsage)
    } catch {
      throw invalidAggregate('asset_technical_study_usage_contract_invalid')
    }
  }
  if (record.longFormStudy) {
    try {
      validatePreferenceLongFormStudySummary(record.longFormStudy)
    } catch {
      throw invalidAggregate('asset_long_form_study_summary_invalid')
    }
    if (
      record.assetKind !== 'reference_video_metadata'
      || record.longFormStudy.referenceAssetId !== record.id
      || !record.storageObjectRecordId
      || !record.mediaAssetId
    ) throw invalidAggregate('asset_long_form_study_link_invalid')
  }
  if (record.mediaMetadata) assertMediaMetadata(record.mediaMetadata)
  if (record.assetKind === 'previous_approved_edit_snapshot' && (!record.projectId || !record.editSessionId || !record.approvedSnapshotId)) {
    throw invalidAggregate('approved_edit_asset_identity_invalid')
  }
}

function assertTechnicalSourceConditionSignal(
  signal: NonNullable<EditReferenceAggregate['assets'][number]['technicalSourceConditionSignal']>,
): void {
  if (
    signal.schemaVersion !== 'edit-reference-technical-source-condition-v1'
    || !['verified_local_bounded', 'blocked', 'not_run'].includes(signal.status)
    || !Number.isSafeInteger(signal.maxIntervalCountPerType)
    || signal.maxIntervalCountPerType < 1
    || signal.maxIntervalCountPerType > 50
    || !Number.isSafeInteger(signal.analysisFrameRate)
    || signal.analysisFrameRate < 1
    || signal.analysisFrameRate > 15
    || !Number.isFinite(signal.scannedDurationSeconds)
    || signal.scannedDurationSeconds < 0
    || signal.scannedDurationSeconds > 600
    || !['full', 'partial', 'not_run'].includes(signal.coverage)
    || !Number.isFinite(signal.blackMinimumDurationSeconds)
    || signal.blackMinimumDurationSeconds < 0.1
    || signal.blackMinimumDurationSeconds > 10
    || !isUnitRatio(signal.blackPictureRatioThreshold)
    || signal.blackPictureRatioThreshold < 0.5
    || !Number.isFinite(signal.blackPixelThreshold)
    || signal.blackPixelThreshold < 0
    || signal.blackPixelThreshold > 0.5
    || !Number.isFinite(signal.freezeMinimumDurationSeconds)
    || signal.freezeMinimumDurationSeconds < 0.1
    || signal.freezeMinimumDurationSeconds > 10
    || !isUnitRatio(signal.freezeNoiseTolerance)
    || !Number.isSafeInteger(signal.blackDetectedIntervalCount)
    || signal.blackDetectedIntervalCount < 0
    || signal.blackDetectedIntervalCount > 10_000
    || !Array.isArray(signal.blackIntervals)
    || signal.blackIntervals.length > signal.maxIntervalCountPerType
    || signal.blackIntervals.length > signal.blackDetectedIntervalCount
    || typeof signal.blackIntervalsTruncated !== 'boolean'
    || !Number.isFinite(signal.blackTotalDurationSeconds)
    || signal.blackTotalDurationSeconds < 0
    || signal.blackTotalDurationSeconds > signal.scannedDurationSeconds + 0.011
    || !Number.isFinite(signal.blackLongestDurationSeconds)
    || signal.blackLongestDurationSeconds < 0
    || signal.blackLongestDurationSeconds > signal.blackTotalDurationSeconds + 0.011
    || !Number.isSafeInteger(signal.freezeDetectedIntervalCount)
    || signal.freezeDetectedIntervalCount < 0
    || signal.freezeDetectedIntervalCount > 10_000
    || !Array.isArray(signal.freezeIntervals)
    || signal.freezeIntervals.length > signal.maxIntervalCountPerType
    || signal.freezeIntervals.length > signal.freezeDetectedIntervalCount
    || typeof signal.freezeIntervalsTruncated !== 'boolean'
    || !Number.isFinite(signal.freezeTotalDurationSeconds)
    || signal.freezeTotalDurationSeconds < 0
    || signal.freezeTotalDurationSeconds > signal.scannedDurationSeconds + 0.011
    || !Number.isFinite(signal.freezeLongestDurationSeconds)
    || signal.freezeLongestDurationSeconds < 0
    || signal.freezeLongestDurationSeconds > signal.freezeTotalDurationSeconds + 0.011
    || (signal.blockerCode !== undefined && (!signal.blockerCode || signal.blockerCode.length > 120))
    || (signal.blockerMessage !== undefined && (!signal.blockerMessage || signal.blockerMessage.length > 500))
    || typeof signal.technicalSourceConditionAnalysisRan !== 'boolean'
    || signal.semanticSourceQualityAnalysisRan !== false
    || signal.intentionalStillnessClassificationRan !== false
    || signal.cameraObstructionInferenceRan !== false
    || signal.blurAnalysisRan !== false
    || signal.trimRecommendationRan !== false
    || signal.editDecisionMade !== false
    || signal.rawFramePixelsPersisted !== false
    || signal.rawProcessOutputPersisted !== false
  ) throw invalidAggregate('asset_source_condition_signal_contract_invalid')

  assertSourceConditionIntervals(
    signal.blackIntervals,
    signal.blackMinimumDurationSeconds,
    signal.scannedDurationSeconds,
    'asset_source_condition_black_intervals_invalid',
  )
  assertSourceConditionIntervals(
    signal.freezeIntervals,
    signal.freezeMinimumDurationSeconds,
    signal.scannedDurationSeconds,
    'asset_source_condition_freeze_intervals_invalid',
  )
  assertSourceConditionIntervalSummary({
    intervals: signal.blackIntervals,
    detectedIntervalCount: signal.blackDetectedIntervalCount,
    intervalsTruncated: signal.blackIntervalsTruncated,
    totalDurationSeconds: signal.blackTotalDurationSeconds,
    longestDurationSeconds: signal.blackLongestDurationSeconds,
    errorCode: 'asset_source_condition_black_summary_invalid',
  })
  assertSourceConditionIntervalSummary({
    intervals: signal.freezeIntervals,
    detectedIntervalCount: signal.freezeDetectedIntervalCount,
    intervalsTruncated: signal.freezeIntervalsTruncated,
    totalDurationSeconds: signal.freezeTotalDurationSeconds,
    longestDurationSeconds: signal.freezeLongestDurationSeconds,
    errorCode: 'asset_source_condition_freeze_summary_invalid',
  })

  if (
    signal.status === 'verified_local_bounded'
    && (
      !signal.technicalSourceConditionAnalysisRan
      || signal.scannedDurationSeconds <= 0
      || !['full', 'partial'].includes(signal.coverage)
      || Boolean(signal.blockerCode)
      || Boolean(signal.blockerMessage)
    )
  ) throw invalidAggregate('asset_source_condition_verified_result_invalid')
  if (
    signal.status !== 'verified_local_bounded'
    && (
      signal.technicalSourceConditionAnalysisRan
      || signal.blackDetectedIntervalCount !== 0
      || signal.blackIntervals.length !== 0
      || signal.blackIntervalsTruncated
      || signal.blackTotalDurationSeconds !== 0
      || signal.blackLongestDurationSeconds !== 0
      || signal.freezeDetectedIntervalCount !== 0
      || signal.freezeIntervals.length !== 0
      || signal.freezeIntervalsTruncated
      || signal.freezeTotalDurationSeconds !== 0
      || signal.freezeLongestDurationSeconds !== 0
    )
  ) throw invalidAggregate('asset_source_condition_unverified_result_invalid')
  if (signal.status === 'blocked' && (!signal.blockerCode || !signal.blockerMessage)) {
    throw invalidAggregate('asset_source_condition_blocker_invalid')
  }
  if (
    signal.status === 'not_run'
    && (signal.scannedDurationSeconds !== 0 || signal.coverage !== 'not_run' || signal.blockerCode || signal.blockerMessage)
  ) throw invalidAggregate('asset_source_condition_not_run_invalid')
}

function assertSourceConditionIntervals(
  intervals: NonNullable<EditReferenceAggregate['assets'][number]['technicalSourceConditionSignal']>['blackIntervals'],
  minimumDurationSeconds: number,
  scannedDurationSeconds: number,
  errorCode: string,
): void {
  for (const [index, interval] of intervals.entries()) {
    const previous = intervals[index - 1]
    if (
      !Number.isFinite(interval.startSeconds)
      || !Number.isFinite(interval.endSeconds)
      || !Number.isFinite(interval.durationSeconds)
      || interval.startSeconds < 0
      || interval.endSeconds <= interval.startSeconds
      || interval.endSeconds > scannedDurationSeconds + 0.001
      || interval.durationSeconds + 0.01 < minimumDurationSeconds
      || Math.abs(interval.durationSeconds - (interval.endSeconds - interval.startSeconds)) > 0.011
      || typeof interval.endedAtScanBoundary !== 'boolean'
      || (interval.endedAtScanBoundary && Math.abs(interval.endSeconds - scannedDurationSeconds) > 0.011)
      || (previous && interval.startSeconds < previous.endSeconds - 0.001)
    ) throw invalidAggregate(errorCode)
  }
}

function assertSourceConditionIntervalSummary(input: {
  intervals: NonNullable<EditReferenceAggregate['assets'][number]['technicalSourceConditionSignal']>['blackIntervals']
  detectedIntervalCount: number
  intervalsTruncated: boolean
  totalDurationSeconds: number
  longestDurationSeconds: number
  errorCode: string
}): void {
  const retainedDuration = Number(input.intervals.reduce((total, interval) => total + interval.durationSeconds, 0).toFixed(3))
  const retainedLongest = input.intervals.length === 0
    ? 0
    : Math.max(...input.intervals.map((interval) => interval.durationSeconds))
  if (
    (input.intervalsTruncated
      ? input.detectedIntervalCount <= input.intervals.length
      : input.detectedIntervalCount !== input.intervals.length)
    || input.totalDurationSeconds + 0.011 < retainedDuration
    || input.longestDurationSeconds + 0.011 < retainedLongest
    || (!input.intervalsTruncated && Math.abs(input.totalDurationSeconds - retainedDuration) > 0.011)
    || (!input.intervalsTruncated && Math.abs(input.longestDurationSeconds - retainedLongest) > 0.011)
    || (input.detectedIntervalCount === 0 && (input.totalDurationSeconds !== 0 || input.longestDurationSeconds !== 0))
  ) throw invalidAggregate(input.errorCode)
}

function assertTechnicalEdgeWidthSignal(
  signal: NonNullable<EditReferenceAggregate['assets'][number]['technicalEdgeWidthSignal']>,
): void {
  const scoreValues = signal.samples.map((sample) => sample.score)
  if (
    signal.schemaVersion !== 'edit-reference-technical-edge-width-signal-v1'
    || !['verified_local_bounded', 'blocked', 'not_run'].includes(signal.status)
    || !Number.isSafeInteger(signal.maxSampleCount)
    || signal.maxSampleCount < 1
    || signal.maxSampleCount > 24
    || !Number.isSafeInteger(signal.attemptedSampleCount)
    || signal.attemptedSampleCount < 0
    || signal.attemptedSampleCount > signal.maxSampleCount
    || !Number.isSafeInteger(signal.sampleCount)
    || signal.sampleCount < 0
    || signal.sampleCount > signal.attemptedSampleCount
    || !Number.isSafeInteger(signal.unmeasurableSampleCount)
    || signal.unmeasurableSampleCount < 0
    || signal.unmeasurableSampleCount !== signal.attemptedSampleCount - signal.sampleCount
    || !Array.isArray(signal.samples)
    || signal.samples.length !== signal.sampleCount
    || signal.samples.some((sample, index, samples) => (
      !Number.isFinite(sample.timeSeconds)
      || sample.timeSeconds < 0
      || sample.timeSeconds > signal.scannedDurationSeconds + 0.001
      || (index > 0 && sample.timeSeconds <= samples[index - 1].timeSeconds)
      || !Number.isFinite(sample.score)
      || sample.score < 0
      || sample.score > 1_000_000
    ))
    || (signal.sampleIntervalSeconds !== undefined && (!Number.isFinite(signal.sampleIntervalSeconds) || signal.sampleIntervalSeconds <= 0 || signal.sampleIntervalSeconds > 600))
    || !Number.isFinite(signal.scannedDurationSeconds)
    || signal.scannedDurationSeconds < 0
    || signal.scannedDurationSeconds > 600
    || !['full', 'partial', 'not_run'].includes(signal.coverage)
    || !Number.isSafeInteger(signal.outputMaxDimension)
    || signal.outputMaxDimension < 64
    || signal.outputMaxDimension > 640
    || !isUnitRatio(signal.highThreshold)
    || !isUnitRatio(signal.lowThreshold)
    || signal.lowThreshold > signal.highThreshold
    || !Number.isSafeInteger(signal.radius)
    || signal.radius < 1
    || signal.radius > 100
    || !Number.isSafeInteger(signal.blockPercentile)
    || signal.blockPercentile < 1
    || signal.blockPercentile > 100
    || !Number.isSafeInteger(signal.blockWidth)
    || signal.blockWidth < 4
    || signal.blockWidth > 128
    || signal.blockWidth % 2 !== 0
    || !Number.isSafeInteger(signal.blockHeight)
    || signal.blockHeight < 4
    || signal.blockHeight > 128
    || signal.blockHeight % 2 !== 0
    || !optionalBoundedNumber(signal.scoreAverage, 0, 1_000_000)
    || !optionalBoundedNumber(signal.scoreMedian, 0, 1_000_000)
    || !optionalBoundedNumber(signal.scoreMinimum, 0, 1_000_000)
    || !optionalBoundedNumber(signal.scoreMaximum, 0, 1_000_000)
    || !optionalBoundedNumber(signal.scoreSpread, 0, 1_000_000)
    || (signal.blockerCode !== undefined && (!signal.blockerCode || signal.blockerCode.length > 120))
    || (signal.blockerMessage !== undefined && (!signal.blockerMessage || signal.blockerMessage.length > 500))
    || typeof signal.technicalEdgeWidthAnalysisRan !== 'boolean'
    || signal.semanticSourceQualityAnalysisRan !== false
    || signal.semanticBlurClassificationRan !== false
    || signal.focusQualityClassificationRan !== false
    || signal.intentionalDepthOfFieldInferenceRan !== false
    || signal.cameraObstructionInferenceRan !== false
    || signal.trimRecommendationRan !== false
    || signal.editDecisionMade !== false
    || signal.rawFramePixelsPersisted !== false
    || signal.rawProcessOutputPersisted !== false
  ) throw invalidAggregate('asset_edge_width_signal_contract_invalid')

  if (signal.status === 'verified_local_bounded') {
    if (
      !signal.technicalEdgeWidthAnalysisRan
      || signal.attemptedSampleCount < 1
      || signal.scannedDurationSeconds <= 0
      || !['full', 'partial'].includes(signal.coverage)
      || signal.sampleIntervalSeconds === undefined
      || Boolean(signal.blockerCode)
      || Boolean(signal.blockerMessage)
    ) throw invalidAggregate('asset_edge_width_signal_verified_result_invalid')
    if (scoreValues.length > 0) {
      const ordered = [...scoreValues].sort((left, right) => left - right)
      const expectedAverage = scoreValues.reduce((total, value) => total + value, 0) / scoreValues.length
      const expectedMedian = ordered[Math.round((ordered.length - 1) * 0.5)]
      const expectedMinimum = Math.min(...scoreValues)
      const expectedMaximum = Math.max(...scoreValues)
      if (
        signal.scoreAverage === undefined
        || signal.scoreMedian === undefined
        || signal.scoreMinimum === undefined
        || signal.scoreMaximum === undefined
        || signal.scoreSpread === undefined
        || Math.abs(signal.scoreAverage - expectedAverage) > 0.00001
        || Math.abs(signal.scoreMedian - expectedMedian) > 0.00001
        || Math.abs(signal.scoreMinimum - expectedMinimum) > 0.00001
        || Math.abs(signal.scoreMaximum - expectedMaximum) > 0.00001
        || Math.abs(signal.scoreSpread - (expectedMaximum - expectedMinimum)) > 0.00001
      ) throw invalidAggregate('asset_edge_width_signal_summary_invalid')
    } else if (
      signal.scoreAverage !== undefined
      || signal.scoreMedian !== undefined
      || signal.scoreMinimum !== undefined
      || signal.scoreMaximum !== undefined
      || signal.scoreSpread !== undefined
    ) {
      throw invalidAggregate('asset_edge_width_signal_unmeasurable_summary_invalid')
    }
  } else if (
    signal.technicalEdgeWidthAnalysisRan
    || signal.attemptedSampleCount !== 0
    || signal.sampleCount !== 0
    || signal.unmeasurableSampleCount !== 0
    || signal.samples.length !== 0
    || signal.sampleIntervalSeconds !== undefined
    || signal.scoreAverage !== undefined
    || signal.scoreMedian !== undefined
    || signal.scoreMinimum !== undefined
    || signal.scoreMaximum !== undefined
    || signal.scoreSpread !== undefined
  ) {
    throw invalidAggregate('asset_edge_width_signal_unverified_result_invalid')
  }
  if (signal.status === 'blocked' && (!signal.blockerCode || !signal.blockerMessage)) {
    throw invalidAggregate('asset_edge_width_signal_blocker_invalid')
  }
  if (
    signal.status === 'not_run'
    && (signal.scannedDurationSeconds !== 0 || signal.coverage !== 'not_run' || signal.blockerCode || signal.blockerMessage)
  ) throw invalidAggregate('asset_edge_width_signal_not_run_invalid')
}

function assertTechnicalCaptionRegionSignal(
  signal: NonNullable<EditReferenceAggregate['assets'][number]['technicalCaptionRegionSignal']>,
): void {
  const regionIds = new Set<string>()
  if (
    signal.schemaVersion !== 'edit-reference-technical-caption-region-signal-v1'
    || !['verified_local_bounded', 'blocked', 'not_run'].includes(signal.status)
    || !Number.isSafeInteger(signal.maxSampleCount)
    || signal.maxSampleCount < 2
    || signal.maxSampleCount > 24
    || !Number.isSafeInteger(signal.maxRegionCountPerFrame)
    || signal.maxRegionCountPerFrame < 1
    || signal.maxRegionCountPerFrame > 8
    || !Number.isSafeInteger(signal.outputMaxDimension)
    || signal.outputMaxDimension < 96
    || signal.outputMaxDimension > 480
    || !Number.isSafeInteger(signal.brightnessThreshold8Bit)
    || signal.brightnessThreshold8Bit < 128
    || signal.brightnessThreshold8Bit > 255
    || !Number.isSafeInteger(signal.localContrastThreshold8Bit)
    || signal.localContrastThreshold8Bit < 24
    || signal.localContrastThreshold8Bit > 255
    || !Number.isSafeInteger(signal.sampleCount)
    || signal.sampleCount < 0
    || signal.sampleCount > signal.maxSampleCount
    || !Array.isArray(signal.sampleTimesSeconds)
    || signal.sampleTimesSeconds.length !== signal.sampleCount
    || signal.sampleTimesSeconds.some((time, index, times) => (
      !Number.isFinite(time)
      || time < 0
      || time > 600
      || (index > 0 && time <= times[index - 1])
    ))
    || (signal.sampleIntervalSeconds !== undefined && (!Number.isFinite(signal.sampleIntervalSeconds) || signal.sampleIntervalSeconds <= 0 || signal.sampleIntervalSeconds > 600))
    || !Number.isFinite(signal.scannedDurationSeconds)
    || signal.scannedDurationSeconds < 0
    || signal.scannedDurationSeconds > 600
    || !['full', 'partial', 'not_run'].includes(signal.coverage)
    || !Array.isArray(signal.observations)
    || signal.observations.length !== signal.sampleCount
    || !Number.isSafeInteger(signal.framesWithCandidates)
    || signal.framesWithCandidates < 0
    || signal.framesWithCandidates > signal.sampleCount
    || !isUnitRatio(signal.candidateFrameRatio)
    || !Number.isSafeInteger(signal.totalCandidateRegionCount)
    || signal.totalCandidateRegionCount < 0
    || !Number.isSafeInteger(signal.lowerRegionCandidateCount)
    || signal.lowerRegionCandidateCount < 0
    || signal.lowerRegionCandidateCount > signal.totalCandidateRegionCount
    || !isUnitRatio(signal.lowerRegionCandidateRatio)
    || !Number.isSafeInteger(signal.singleLineCandidateCount)
    || signal.singleLineCandidateCount < 0
    || !Number.isSafeInteger(signal.multiLineCandidateCount)
    || signal.multiLineCandidateCount < 0
    || signal.singleLineCandidateCount + signal.multiLineCandidateCount !== signal.totalCandidateRegionCount
    || (signal.blockerCode !== undefined && (!signal.blockerCode || signal.blockerCode.length > 120))
    || (signal.blockerMessage !== undefined && (!signal.blockerMessage || signal.blockerMessage.length > 500))
    || typeof signal.technicalTextRegionCandidateAnalysisRan !== 'boolean'
    || signal.ocrEngineExecuted !== false
    || signal.exactTextRecognitionRan !== false
    || signal.transcriptAlignmentRan !== false
    || signal.semanticCaptionDesignAnalysisRan !== false
    || signal.fontInferenceRan !== false
    || signal.captionAnimationInferenceRan !== false
    || signal.rawFramePixelsPersisted !== false
    || signal.rawRecognizedTextPersisted !== false
    || signal.rawProcessOutputPersisted !== false
  ) throw invalidAggregate('asset_caption_region_signal_contract_invalid')

  let derivedFramesWithCandidates = 0
  let derivedRegionCount = 0
  let derivedLowerRegionCount = 0
  let derivedSingleLineCount = 0
  for (const [observationIndex, observation] of signal.observations.entries()) {
    if (
      observation.sampleTimeSeconds !== signal.sampleTimesSeconds[observationIndex]
      || !Number.isSafeInteger(observation.frameWidth)
      || observation.frameWidth < 1
      || observation.frameWidth > signal.outputMaxDimension
      || !Number.isSafeInteger(observation.frameHeight)
      || observation.frameHeight < 1
      || observation.frameHeight > signal.outputMaxDimension
      || !Array.isArray(observation.candidateRegions)
      || observation.candidateRegions.length > signal.maxRegionCountPerFrame
    ) throw invalidAggregate('asset_caption_region_observation_invalid')
    if (observation.candidateRegions.length > 0) derivedFramesWithCandidates += 1
    for (const region of observation.candidateRegions) {
      const bounds = region.bounds
      if (
        !/^caption-region-\d{3}-\d{2}$/.test(region.regionId)
        || regionIds.has(region.regionId)
        || !bounds
        || !isUnitRatio(bounds.x)
        || !isUnitRatio(bounds.y)
        || !Number.isFinite(bounds.width)
        || bounds.width <= 0
        || bounds.width > 1
        || !Number.isFinite(bounds.height)
        || bounds.height <= 0
        || bounds.height > 1
        || bounds.x + bounds.width > 1.000001
        || bounds.y + bounds.height > 1.000001
        || !Number.isSafeInteger(region.lineCount)
        || region.lineCount < 1
        || region.lineCount > 3
        || !Number.isSafeInteger(region.textLikeComponentCount)
        || region.textLikeComponentCount < 3
        || region.textLikeComponentCount > 10_000
        || !isUnitRatio(region.candidatePixelRatio)
        || region.candidatePixelRatio <= 0
        || !isUnitRatio(region.technicalTextLikelihood)
        || typeof region.lowerFrameRegion !== 'boolean'
        || region.lowerFrameRegion !== (bounds.y + (bounds.height / 2) >= 0.6)
      ) throw invalidAggregate('asset_caption_region_candidate_invalid')
      regionIds.add(region.regionId)
      derivedRegionCount += 1
      if (region.lowerFrameRegion) derivedLowerRegionCount += 1
      if (region.lineCount === 1) derivedSingleLineCount += 1
    }
  }

  if (
    signal.framesWithCandidates !== derivedFramesWithCandidates
    || signal.totalCandidateRegionCount !== derivedRegionCount
    || signal.lowerRegionCandidateCount !== derivedLowerRegionCount
    || signal.singleLineCandidateCount !== derivedSingleLineCount
    || signal.multiLineCandidateCount !== derivedRegionCount - derivedSingleLineCount
    || Math.abs(signal.candidateFrameRatio - ratioForValidation(derivedFramesWithCandidates, signal.sampleCount)) > 0.000001
    || Math.abs(signal.lowerRegionCandidateRatio - ratioForValidation(derivedLowerRegionCount, derivedRegionCount)) > 0.000001
  ) throw invalidAggregate('asset_caption_region_summary_invalid')

  if (
    signal.status === 'verified_local_bounded'
    && (
      !signal.technicalTextRegionCandidateAnalysisRan
      || signal.sampleCount <= 0
      || signal.scannedDurationSeconds <= 0
      || !['full', 'partial'].includes(signal.coverage)
      || signal.sampleIntervalSeconds === undefined
      || Boolean(signal.blockerCode)
      || Boolean(signal.blockerMessage)
    )
  ) throw invalidAggregate('asset_caption_region_verified_result_invalid')
  if (
    signal.status !== 'verified_local_bounded'
    && (
      signal.technicalTextRegionCandidateAnalysisRan
      || signal.sampleCount !== 0
      || signal.sampleTimesSeconds.length !== 0
      || signal.sampleIntervalSeconds !== undefined
      || signal.observations.length !== 0
      || signal.framesWithCandidates !== 0
      || signal.candidateFrameRatio !== 0
      || signal.totalCandidateRegionCount !== 0
      || signal.lowerRegionCandidateCount !== 0
      || signal.lowerRegionCandidateRatio !== 0
      || signal.singleLineCandidateCount !== 0
      || signal.multiLineCandidateCount !== 0
    )
  ) throw invalidAggregate('asset_caption_region_unverified_result_invalid')
  if (signal.status === 'blocked' && (!signal.blockerCode || !signal.blockerMessage)) {
    throw invalidAggregate('asset_caption_region_blocker_invalid')
  }
  if (
    signal.status === 'not_run'
    && (signal.scannedDurationSeconds !== 0 || signal.coverage !== 'not_run' || signal.blockerCode || signal.blockerMessage)
  ) throw invalidAggregate('asset_caption_region_not_run_invalid')
}

function isUnitRatio(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= 1
}

function optionalBoundedNumber(value: unknown, minimum: number, maximum: number): boolean {
  return value === undefined || (
    typeof value === 'number'
    && Number.isFinite(value)
    && value >= minimum
    && value <= maximum
  )
}

function ratioForValidation(numerator: number, denominator: number): number {
  return denominator <= 0 ? 0 : Number((numerator / denominator).toFixed(6))
}

function assertTechnicalAudioLowLevel(
  signal: NonNullable<EditReferenceAggregate['assets'][number]['technicalAudioLowLevel']>,
): void {
  const allowedStatuses = ['verified_local_bounded', 'blocked', 'not_applicable', 'not_run']
  if (
    !allowedStatuses.includes(signal.status)
    || !Number.isFinite(signal.thresholdDb)
    || signal.thresholdDb < -90
    || signal.thresholdDb > -20
    || !Number.isFinite(signal.minimumDurationSeconds)
    || signal.minimumDurationSeconds < 0.25
    || signal.minimumDurationSeconds > 10
    || !Number.isSafeInteger(signal.maxIntervalCount)
    || signal.maxIntervalCount < 1
    || signal.maxIntervalCount > 50
    || !Number.isSafeInteger(signal.detectedIntervalCount)
    || signal.detectedIntervalCount < 0
    || signal.detectedIntervalCount > 5_000
    || !Array.isArray(signal.intervals)
    || signal.intervals.length > signal.maxIntervalCount
    || signal.intervals.length > signal.detectedIntervalCount
    || typeof signal.intervalsTruncated !== 'boolean'
    || !Number.isFinite(signal.scannedDurationSeconds)
    || signal.scannedDurationSeconds < 0
    || signal.scannedDurationSeconds > 600
    || !['full', 'partial', 'not_run'].includes(signal.coverage)
    || !Number.isFinite(signal.totalLowLevelDurationSeconds)
    || signal.totalLowLevelDurationSeconds < 0
    || signal.totalLowLevelDurationSeconds > 600
    || !Number.isFinite(signal.longestLowLevelDurationSeconds)
    || signal.longestLowLevelDurationSeconds < 0
    || signal.longestLowLevelDurationSeconds > signal.totalLowLevelDurationSeconds
    || signal.intervals.some((interval) => (
      !Number.isFinite(interval.startSeconds)
      || !Number.isFinite(interval.endSeconds)
      || !Number.isFinite(interval.durationSeconds)
      || interval.startSeconds < 0
      || interval.endSeconds <= interval.startSeconds
      || interval.endSeconds > 600
      || interval.durationSeconds < signal.minimumDurationSeconds - 0.01
      || Math.abs(interval.durationSeconds - (interval.endSeconds - interval.startSeconds)) > 0.011
    ))
    || (signal.blockerCode !== undefined && (!signal.blockerCode || signal.blockerCode.length > 120))
    || (signal.blockerMessage !== undefined && (!signal.blockerMessage || signal.blockerMessage.length > 500))
    || signal.semanticAudioAnalysisRan !== false
    || signal.speechPauseClassificationRan !== false
    || signal.musicOrSfxAnalysisRan !== false
    || signal.trimRecommendationRan !== false
    || signal.rawAudioPersisted !== false
    || signal.rawProcessOutputPersisted !== false
  ) throw invalidAggregate('asset_audio_low_level_contract_invalid')
  if (
    signal.status === 'verified_local_bounded'
    && (
      signal.scannedDurationSeconds <= 0
      || !['full', 'partial'].includes(signal.coverage)
      || Boolean(signal.blockerCode)
      || Boolean(signal.blockerMessage)
      || (signal.intervalsTruncated
        ? signal.detectedIntervalCount <= signal.intervals.length
        : signal.detectedIntervalCount !== signal.intervals.length)
      || (signal.detectedIntervalCount === 0
        && (signal.totalLowLevelDurationSeconds !== 0 || signal.longestLowLevelDurationSeconds !== 0))
    )
  ) throw invalidAggregate('asset_audio_low_level_verified_result_invalid')
  if (
    signal.status !== 'verified_local_bounded'
    && (
      signal.detectedIntervalCount !== 0
      || signal.intervals.length !== 0
      || signal.intervalsTruncated
      || signal.totalLowLevelDurationSeconds !== 0
      || signal.longestLowLevelDurationSeconds !== 0
    )
  ) throw invalidAggregate('asset_audio_low_level_unresolved_result_invalid')
  if (
    ['not_applicable', 'not_run'].includes(signal.status)
    && (signal.scannedDurationSeconds !== 0 || signal.coverage !== 'not_run')
  ) throw invalidAggregate('asset_audio_low_level_not_run_state_invalid')
}

function assertTechnicalColorSignal(signal: NonNullable<EditReferenceAggregate['assets'][number]['technicalColorSignal']>): void {
  const measurementValues = [
    signal.lumaAverage8Bit,
    signal.lumaObservedMinimum8Bit,
    signal.lumaObservedMaximum8Bit,
    signal.lumaAverageSpread8Bit,
    signal.saturationAverage8Bit,
    signal.saturationAverageSpread8Bit,
  ]
  const metadataValues = [signal.pixelFormat, signal.colorSpace, signal.colorTransfer, signal.colorPrimaries, signal.colorRange]
  if (
    !['verified_local_bounded', 'blocked', 'not_run'].includes(signal.status)
    || !Number.isSafeInteger(signal.maxSampleCount)
    || signal.maxSampleCount < 1
    || signal.maxSampleCount > 24
    || !Number.isSafeInteger(signal.sampleCount)
    || signal.sampleCount < 0
    || signal.sampleCount > signal.maxSampleCount
    || !Number.isFinite(signal.scannedDurationSeconds)
    || signal.scannedDurationSeconds < 0
    || signal.scannedDurationSeconds > 600
    || !['full', 'partial', 'not_run'].includes(signal.coverage)
    || !['pq', 'hlg', 'not_hdr_signaled', 'unknown'].includes(signal.hdrTransfer)
    || metadataValues.some((value) => value !== undefined && (!value || value.length > 64 || !/^[a-zA-Z0-9_.:+-]+$/.test(value)))
    || measurementValues.some((value) => value !== undefined && (!Number.isFinite(value) || value < 0 || value > 255))
    || (signal.blockerCode !== undefined && (!signal.blockerCode || signal.blockerCode.length > 120))
    || (signal.blockerMessage !== undefined && (!signal.blockerMessage || signal.blockerMessage.length > 500))
    || signal.semanticColorAnalysisRan !== false
    || signal.lutReconstructionRan !== false
    || signal.rawFramePixelsPersisted !== false
    || signal.rawHistogramPersisted !== false
    || signal.rawProcessOutputPersisted !== false
  ) throw invalidAggregate('asset_color_signal_contract_invalid')
  if (
    signal.status === 'verified_local_bounded'
    && (
      signal.sampleCount <= 0
      || signal.scannedDurationSeconds <= 0
      || !['full', 'partial'].includes(signal.coverage)
      || measurementValues.some((value) => value === undefined)
      || signal.lumaObservedMinimum8Bit! > signal.lumaObservedMaximum8Bit!
    )
  ) throw invalidAggregate('asset_color_signal_verified_result_invalid')
  if (
    signal.status !== 'verified_local_bounded'
    && (signal.sampleCount !== 0 || measurementValues.some((value) => value !== undefined))
  ) throw invalidAggregate('asset_color_signal_unverified_result_invalid')
  if (signal.status === 'blocked' && (!signal.blockerCode || !signal.blockerMessage)) {
    throw invalidAggregate('asset_color_signal_blocker_invalid')
  }
  if (signal.status === 'not_run' && signal.coverage !== 'not_run') {
    throw invalidAggregate('asset_color_signal_not_run_invalid')
  }
}

function assertTechnicalMotionSignal(signal: NonNullable<EditReferenceAggregate['assets'][number]['technicalMotionSignal']>): void {
  const measurementValues = [
    signal.lumaDifferenceAverage8Bit,
    signal.lumaDifferenceMaximum8Bit,
    signal.lumaDifferenceSpread8Bit,
    signal.lumaDifferenceMedian8Bit,
    signal.lumaDifference90thPercentile8Bit,
    signal.chromaDifferenceAverage8Bit,
    signal.chromaDifferenceMaximum8Bit,
  ]
  if (
    signal.schemaVersion !== 'edit-reference-technical-motion-signal-v1'
    || !['verified_local_bounded', 'blocked', 'not_run'].includes(signal.status)
    || !Number.isSafeInteger(signal.maxSampleCount)
    || signal.maxSampleCount < 2
    || signal.maxSampleCount > 24
    || !Number.isSafeInteger(signal.maxPeakCount)
    || signal.maxPeakCount < 1
    || signal.maxPeakCount > 12
    || !Number.isSafeInteger(signal.sampleCount)
    || signal.sampleCount < 0
    || signal.sampleCount > signal.maxSampleCount
    || !Array.isArray(signal.sampleTimesSeconds)
    || signal.sampleTimesSeconds.length !== signal.sampleCount
    || signal.sampleTimesSeconds.some((time, index, times) => (
      !Number.isFinite(time)
      || time < 0
      || time > 600
      || (index > 0 && time <= times[index - 1])
    ))
    || (signal.sampleIntervalSeconds !== undefined && (!Number.isFinite(signal.sampleIntervalSeconds) || signal.sampleIntervalSeconds <= 0 || signal.sampleIntervalSeconds > 600))
    || !Number.isFinite(signal.scannedDurationSeconds)
    || signal.scannedDurationSeconds < 0
    || signal.scannedDurationSeconds > 600
    || !['full', 'partial', 'not_run'].includes(signal.coverage)
    || !Number.isFinite(signal.activityThreshold8Bit)
    || signal.activityThreshold8Bit < 0.1
    || signal.activityThreshold8Bit > 255
    || !Number.isFinite(signal.highActivityThreshold8Bit)
    || signal.highActivityThreshold8Bit < signal.activityThreshold8Bit
    || signal.highActivityThreshold8Bit > 255
    || measurementValues.some((value) => value !== undefined && (!Number.isFinite(value) || value < 0 || value > 255))
    || !Number.isSafeInteger(signal.activeSampleCount)
    || signal.activeSampleCount < 0
    || signal.activeSampleCount > signal.sampleCount
    || !Number.isFinite(signal.activeSampleRatio)
    || signal.activeSampleRatio < 0
    || signal.activeSampleRatio > 1
    || !Number.isSafeInteger(signal.highActivitySampleCount)
    || signal.highActivitySampleCount < 0
    || signal.highActivitySampleCount > signal.activeSampleCount
    || !Number.isFinite(signal.highActivitySampleRatio)
    || signal.highActivitySampleRatio < 0
    || signal.highActivitySampleRatio > signal.activeSampleRatio + 0.000001
    || !Array.isArray(signal.peakSamples)
    || signal.peakSamples.length > signal.maxPeakCount
    || signal.peakSamples.length > signal.sampleCount
    || signal.peakSamples.some((peak) => (
      !Number.isFinite(peak.sampleTimeSeconds)
      || peak.sampleTimeSeconds < 0
      || peak.sampleTimeSeconds > 600
      || !Number.isFinite(peak.lumaDifferenceAverage8Bit)
      || peak.lumaDifferenceAverage8Bit < 0
      || peak.lumaDifferenceAverage8Bit > 255
      || !signal.sampleTimesSeconds.includes(peak.sampleTimeSeconds)
    ))
    || (signal.blockerCode !== undefined && (!signal.blockerCode || signal.blockerCode.length > 120))
    || (signal.blockerMessage !== undefined && (!signal.blockerMessage || signal.blockerMessage.length > 500))
    || typeof signal.technicalFrameDifferenceAnalysisRan !== 'boolean'
    || signal.semanticMotionAnalysisRan !== false
    || signal.cameraMotionInferenceRan !== false
    || signal.objectTrackingRan !== false
    || signal.transitionClassificationRan !== false
    || signal.graphicsEntryExitAnalysisRan !== false
    || signal.opticalFlowAnalysisRan !== false
    || signal.rawFramePixelsPersisted !== false
    || signal.rawDifferenceFramesPersisted !== false
    || signal.rawHistogramPersisted !== false
    || signal.rawProcessOutputPersisted !== false
  ) throw invalidAggregate('asset_motion_signal_contract_invalid')
  if (
    signal.status === 'verified_local_bounded'
    && (
      !signal.technicalFrameDifferenceAnalysisRan
      || signal.sampleCount <= 0
      || signal.scannedDurationSeconds <= 0
      || !['full', 'partial'].includes(signal.coverage)
      || signal.sampleIntervalSeconds === undefined
      || measurementValues.some((value) => value === undefined)
      || signal.lumaDifferenceAverage8Bit! > signal.lumaDifferenceMaximum8Bit!
      || signal.lumaDifferenceMedian8Bit! > signal.lumaDifferenceMaximum8Bit!
      || signal.lumaDifference90thPercentile8Bit! > signal.lumaDifferenceMaximum8Bit!
      || signal.chromaDifferenceAverage8Bit! > signal.chromaDifferenceMaximum8Bit!
      || Math.abs(signal.activeSampleRatio - signal.activeSampleCount / signal.sampleCount) > 0.000001
      || Math.abs(signal.highActivitySampleRatio - signal.highActivitySampleCount / signal.sampleCount) > 0.000001
      || signal.peakSamples.length !== Math.min(signal.maxPeakCount, signal.sampleCount)
      || Boolean(signal.blockerCode)
      || Boolean(signal.blockerMessage)
    )
  ) throw invalidAggregate('asset_motion_signal_verified_result_invalid')
  if (
    signal.status !== 'verified_local_bounded'
    && (
      signal.technicalFrameDifferenceAnalysisRan
      || signal.sampleCount !== 0
      || signal.sampleTimesSeconds.length !== 0
      || signal.sampleIntervalSeconds !== undefined
      || measurementValues.some((value) => value !== undefined)
      || signal.activeSampleCount !== 0
      || signal.activeSampleRatio !== 0
      || signal.highActivitySampleCount !== 0
      || signal.highActivitySampleRatio !== 0
      || signal.peakSamples.length !== 0
    )
  ) throw invalidAggregate('asset_motion_signal_unverified_result_invalid')
  if (signal.status === 'blocked' && (!signal.blockerCode || !signal.blockerMessage)) {
    throw invalidAggregate('asset_motion_signal_blocker_invalid')
  }
  if (
    signal.status === 'not_run'
    && (signal.scannedDurationSeconds !== 0 || signal.coverage !== 'not_run' || signal.blockerCode || signal.blockerMessage)
  ) throw invalidAggregate('asset_motion_signal_not_run_invalid')
}

function assertSkillRunRecord(record: EditReferenceAggregate['skillRuns'][number], evidenceIds: Set<string>): void {
  if (
    !record.orchestrationId
    || !record.skillId
    || !['queued', 'running', 'completed', 'failed', 'blocked'].includes(record.status)
    || !['not_started', 'verified_mock', 'verified_local', 'verified_live', 'fallback'].includes(record.runtimeSource)
    || !['verified_live', 'verified_local', 'verified_mock', 'degraded', 'blocked', 'not_implemented'].includes(record.readinessAtRun)
    || !Array.isArray(record.inputEvidenceIds)
    || !Array.isArray(record.outputEvidenceIds)
    || !Array.isArray(record.toolIds)
    || !Array.isArray(record.warnings)
    || !Array.isArray(record.blockedReasons)
    || typeof record.fallbackUsed !== 'boolean'
    || !record.resultSummary
    || record.resultSummary.length > 4_000
  ) throw invalidAggregate('skill_run_contract_invalid')
  assertSkillRunResultContract(record)
  const allLinks = [...record.inputEvidenceIds, ...record.outputEvidenceIds]
  if (allLinks.some((id) => typeof id !== 'string' || !evidenceIds.has(id))) throw invalidAggregate('skill_run_evidence_link_invalid')
  if (record.runtimeAttempt) assertSkillRuntimeAttempt(record.runtimeAttempt, record)
  if (
    typeof record.providerCallMade !== 'boolean'
    || typeof record.modelCallMade !== 'boolean'
    || record.externalUrlFetched !== false
    || record.workerJobCreated !== false
    || typeof record.fileBytesRead !== 'boolean'
    || typeof record.mediaProcessingStarted !== 'boolean'
    || (record.providerCallMade && record.runtimeSource !== 'verified_live')
    || (record.providerCallMade && !record.runtimeAttempt)
    || (record.modelCallMade && !['verified_local', 'verified_live'].includes(record.runtimeSource))
    || (record.runtimeSource === 'verified_live' && !record.providerCallMade)
    || (record.status === 'completed' && record.resultState === 'analyzed' && !record.modelCallMade && [
      'edit_reference.visual_language.qwen_visual_analysis',
      'edit_reference.color_treatment.evidence',
      'edit_reference.graphics_motion.evidence',
      'edit_reference.caption_design.evidence',
      'edit_reference.story_editorial.qwen_reasoning',
      'edit_reference.speech_pacing.evidence',
      'edit_reference.audio_sound_design.evidence',
    ].includes(record.skillId))
    || (record.fileBytesRead || record.mediaProcessingStarted) && (
      !['verified_local', 'verified_live'].includes(record.runtimeSource)
      || !record.toolIds.some((toolId) => (
        toolId === 'ffprobe'
        || toolId === 'ffmpeg'
        || toolId === 'edit_reference_qwen_visual_language_adapter'
        || toolId === 'edit_reference_qwen_color_treatment_adapter'
        || toolId === 'edit_reference_qwen_graphics_motion_adapter'
        || toolId === 'edit_reference_qwen_caption_design_adapter'
        || toolId === 'edit_reference_qwen_story_editorial_adapter'
        || toolId === 'edit_reference_qwen_speech_pacing_adapter'
        || toolId === 'edit_reference_audio_sound_design_adapter'
        || toolId === 'reeditpro_reviewed_local_qwen25vl_mlx_visual'
        || toolId === 'faster_whisper'
      ))
    )
  ) throw invalidAggregate('skill_run_side_effect_flag_invalid')
}

function assertSkillRuntimeAttempt(
  value: NonNullable<EditReferenceAggregate['skillRuns'][number]['runtimeAttempt']>,
  record: EditReferenceAggregate['skillRuns'][number],
): void {
  const expectedKeys = [
    'schemaVersion', 'adapterId', 'requestDigestSha256', 'providerCallMade', 'modelCallMade',
    'workerJobCreated', 'temporaryInputsCleaned', 'internalCostStatus', 'meteredInternalCostMicros', 'usageEventIds',
    'internalCostRecordIds', 'customerPriceCalculated', 'customerCreditsMutated', 'serviceFeeIncluded',
  ]
  if (
    Object.keys(value).length !== expectedKeys.length
    || expectedKeys.some((key) => !(key in value))
    || value.schemaVersion !== 'edit-reference-skill-runtime-attempt-v1'
    || !/^[A-Za-z0-9][A-Za-z0-9._:-]{0,199}$/.test(value.adapterId)
    || !/^[a-f0-9]{64}$/.test(value.requestDigestSha256)
    || typeof value.providerCallMade !== 'boolean'
    || typeof value.modelCallMade !== 'boolean'
    || typeof value.workerJobCreated !== 'boolean'
    || typeof value.temporaryInputsCleaned !== 'boolean'
    || !['not_incurred', 'metered', 'unverified'].includes(value.internalCostStatus)
    || (value.meteredInternalCostMicros !== null && !/^(?:0|[1-9][0-9]{0,15})$/.test(value.meteredInternalCostMicros))
    || !isBoundedUniqueIds(value.usageEventIds)
    || !isBoundedUniqueIds(value.internalCostRecordIds)
    || value.customerPriceCalculated !== false
    || value.customerCreditsMutated !== false
    || value.serviceFeeIncluded !== false
    || value.providerCallMade !== record.providerCallMade
    || value.modelCallMade !== record.modelCallMade
    || value.workerJobCreated !== record.workerJobCreated
    || (value.modelCallMade && !value.providerCallMade && record.runtimeSource !== 'verified_local')
    || (!value.providerCallMade && (
      value.internalCostStatus !== 'not_incurred'
      || value.meteredInternalCostMicros !== '0'
      || value.usageEventIds.length > 0
      || value.internalCostRecordIds.length > 0
    ))
    || (value.providerCallMade && (
      value.internalCostStatus === 'not_incurred'
      || value.usageEventIds.length < 1
      || value.internalCostRecordIds.length < 1
    ))
    || (value.internalCostStatus === 'metered' && value.meteredInternalCostMicros === null)
    || (value.internalCostStatus === 'unverified' && value.meteredInternalCostMicros !== null)
  ) throw invalidAggregate('skill_run_runtime_attempt_invalid')
}

function assertSkillRunResultContract(record: EditReferenceAggregate['skillRuns'][number]): void {
  const resultFields = [record.resultContractVersion, record.resultState, record.retryAvailable, record.retryReasonCode]
  const resultFieldCount = resultFields.filter((value) => value !== undefined).length
  if (resultFieldCount === 0) return // Additive compatibility for private-v2 records written before this contract.
  if (
    record.resultContractVersion !== 'edit-reference-skill-result-v1'
    || !['analyzed', 'manual_evidence', 'fallback', 'blocked', 'needs_more_evidence'].includes(record.resultState ?? '')
    || typeof record.retryAvailable !== 'boolean'
    || (record.retryAvailable && !['rerun_same_inputs', 'reconnect_source_then_retry', 'add_evidence_then_retry', 'runtime_recovery_then_retry'].includes(record.retryReasonCode ?? ''))
    || (!record.retryAvailable && record.retryReasonCode !== undefined)
  ) throw invalidAggregate('skill_run_result_contract_invalid')
  if (
    (['analyzed', 'manual_evidence', 'fallback'].includes(record.resultState ?? '') && record.status !== 'completed')
    || (['blocked', 'needs_more_evidence'].includes(record.resultState ?? '') && !['blocked', 'failed'].includes(record.status))
    || (record.resultState === 'analyzed' && record.fallbackUsed)
    || (['manual_evidence', 'fallback'].includes(record.resultState ?? '') && (!record.fallbackUsed || record.runtimeSource !== 'fallback'))
    || (record.retryAvailable && !['blocked', 'needs_more_evidence'].includes(record.resultState ?? ''))
  ) throw invalidAggregate('skill_run_result_state_inconsistent')
}

function assertMediaMetadata(value: NonNullable<EditReferenceAggregate['evidence'][number]['mediaMetadata']>): void {
  if (!['portrait', 'landscape', 'square', 'unknown'].includes(value.orientation)) throw invalidAggregate('media_metadata_orientation_invalid')
  if (value.durationSeconds !== undefined && (!Number.isFinite(value.durationSeconds) || value.durationSeconds < 0 || value.durationSeconds > 86_400)) {
    throw invalidAggregate('media_metadata_duration_invalid')
  }
  for (const dimension of [value.width, value.height]) {
    if (dimension !== undefined && (!Number.isSafeInteger(dimension) || dimension < 1 || dimension > 16_384)) {
      throw invalidAggregate('media_metadata_dimension_invalid')
    }
  }
}

function assertWorkspace(value: unknown, workspaceId: string): void {
  if (!isRecord(value) || value.workspaceId !== workspaceId) throw invalidAggregate('workspace_scope_mismatch')
}

function assertUniqueIds(values: unknown[], label: string): void {
  const ids = new Set<string>()
  for (const value of values) {
    if (!isRecord(value) || typeof value.id !== 'string' || !value.id) throw invalidAggregate(`${label}_id_invalid`)
    if (ids.has(value.id)) throw invalidAggregate(`${label}_id_duplicate`)
    ids.add(value.id)
  }
}

function findForbiddenPersistenceKey(value: unknown): boolean {
  if (Array.isArray(value)) return value.some(findForbiddenPersistenceKey)
  if (!isRecord(value)) return false
  for (const [key, child] of Object.entries(value)) {
    const normalized = key.toLowerCase().replace(/[^a-z0-9]/g, '')
    if (['rawframes', 'rawproviderpayload', 'signedurl', 'apikey', 'servicerolekey', 'accesstoken'].includes(normalized)) {
      return true
    }
    if (findForbiddenPersistenceKey(child)) return true
  }
  return false
}

function createIdempotencyResultPointer(
  data: EditReferenceDetailData & { appendedMessageIds?: string[] },
  stableIdsBeforeMutation: Set<string>,
  aggregate: EditReferenceAggregate,
): EditReferenceIdempotencyReceipt['result'] {
  const createdIds = [...collectAggregateStableIds(aggregate)]
    .filter((id) => !stableIdsBeforeMutation.has(id))
  const stableResultIds = unique([
    data.detail.reference.id,
    data.detail.study.id,
    ...createdIds,
    ...(data.appendedMessageIds ?? []),
  ]).sort()
  return {
    resultKind: 'edit_reference_detail',
    editReferenceId: data.detail.reference.id,
    studySessionId: data.detail.study.id,
    stableResultIds,
    ...(data.appendedMessageIds ? { appendedMessageIds: [...data.appendedMessageIds] } : {}),
    resultDigestSha256: sha256(stableStringify(data)),
  }
}

function collectAggregateStableIds(aggregate: EditReferenceAggregate): Set<string> {
  return new Set([
    ...aggregate.references,
    ...aggregate.studies,
    ...aggregate.messages,
    ...aggregate.reasoningAttempts,
    ...aggregate.reasoningProviderRequests,
    ...aggregate.reasoningProviderCheckbacks,
    ...aggregate.reasoningProviderWorkflows,
    ...aggregate.reasoningInternalCostAuthorities,
    ...aggregate.preferenceDnaReasoningAttempts,
    ...aggregate.evidence,
    ...aggregate.assets,
    ...aggregate.skillRuns,
    ...aggregate.dnaVersions,
    ...aggregate.dnaQaResults,
    ...aggregate.applications,
    ...aggregate.usageLogs,
  ].map((record) => record.id))
}

function compactIdempotencyReceipts(aggregate: EditReferenceAggregate): EditReferenceIdempotencyReceipt[] {
  if (aggregate.idempotencyReceipts.length <= MAX_HOT_IDEMPOTENCY_RECEIPTS) return []
  const archived = aggregate.idempotencyReceipts.splice(0, IDEMPOTENCY_COMPACTION_BATCH)
  aggregate.idempotencyState.archivedReceiptCount += archived.length
  aggregate.idempotencyState.compactionCount += 1
  return archived
}

async function findIdempotencyReceipt(
  scope: EditReferenceRepositoryScope,
  aggregate: EditReferenceAggregate,
  idempotencyKeyHashSha256: string,
): Promise<EditReferenceIdempotencyReceipt | undefined> {
  const hot = aggregate.idempotencyReceipts.filter(
    (receipt) => receipt.idempotencyKeyHashSha256 === idempotencyKeyHashSha256,
  )
  const journal = await readJournal(scope, 'idempotency')
  assertJournalMatchesState(
    journal.entries,
    aggregate.idempotencyState.archivedReceiptCount,
    aggregate.idempotencyState.archivedReceiptCount,
    'idempotency',
  )
  const archived = (journal.entries as EditReferenceIdempotencyReceipt[]).filter(
    (receipt) => receipt.idempotencyKeyHashSha256 === idempotencyKeyHashSha256,
  )
  const matches = [...archived, ...hot]
  if (matches.length > 1) throw invalidAggregate('idempotency_key_hash_duplicate')
  return matches[0] ? clone(matches[0]) : undefined
}

function assertReplayResult(
  data: EditReferenceDetailData & { appendedMessageIds?: string[] },
  receipt: EditReferenceIdempotencyReceipt,
): void {
  if (
    data.detail.reference.id !== receipt.result.editReferenceId
    || data.detail.study.id !== receipt.result.studySessionId
    || !sameStringArray(data.appendedMessageIds ?? [], receipt.result.appendedMessageIds ?? [])
  ) throw invalidAggregate('idempotency_replay_result_invalid')
}

function assertIdempotencyReceipt(receipt: EditReferenceIdempotencyReceipt): void {
  if (
    !isRecord(receipt)
    || receipt.receiptVersion !== EDIT_REFERENCE_IDEMPOTENCY_RECEIPT_VERSION
    || typeof receipt.receiptId !== 'string'
    || !receipt.receiptId
    || !Number.isSafeInteger(receipt.ledgerSequence)
    || receipt.ledgerSequence < 1
    || typeof receipt.operation !== 'string'
    || !receipt.operation
    || receipt.operation.length > 240
    || !isSha256(receipt.idempotencyKeyHashSha256)
    || !isSha256(receipt.requestHashSha256)
    || !isRecord(receipt.result)
    || receipt.result.resultKind !== 'edit_reference_detail'
    || typeof receipt.result.editReferenceId !== 'string'
    || !receipt.result.editReferenceId
    || typeof receipt.result.studySessionId !== 'string'
    || !receipt.result.studySessionId
    || !Array.isArray(receipt.result.stableResultIds)
    || receipt.result.stableResultIds.length < 2
    || receipt.result.stableResultIds.length > 1_024
    || receipt.result.stableResultIds.some((id) => typeof id !== 'string' || !id)
    || new Set(receipt.result.stableResultIds).size !== receipt.result.stableResultIds.length
    || (receipt.result.appendedMessageIds !== undefined && (
      !Array.isArray(receipt.result.appendedMessageIds)
      || receipt.result.appendedMessageIds.some((id) => typeof id !== 'string' || !id)
    ))
    || !isSha256(receipt.result.resultDigestSha256)
    || !Number.isSafeInteger(receipt.committedRevision)
    || receipt.committedRevision < 1
    || !isISODate(receipt.completedAt)
  ) throw invalidAggregate('idempotency_receipt_invalid')
}

function assertAuditEvent(event: EditReferenceAuditEvent): void {
  if (
    !isRecord(event)
    || typeof event.id !== 'string'
    || !event.id
    || !Number.isSafeInteger(event.sequence)
    || event.sequence < 1
    || typeof event.eventType !== 'string'
    || !event.eventType
    || typeof event.actorUserId !== 'string'
    || !event.actorUserId
    || (event.reasoningAttemptId !== undefined && (
      typeof event.reasoningAttemptId !== 'string'
      || !event.reasoningAttemptId
    ))
    || (event.reasoningProviderRequestId !== undefined && (
      typeof event.reasoningProviderRequestId !== 'string'
      || !event.reasoningProviderRequestId
    ))
    || (event.reasoningProviderCheckbackId !== undefined && (
      typeof event.reasoningProviderCheckbackId !== 'string'
      || !event.reasoningProviderCheckbackId
    ))
    || (event.reasoningInternalCostAuthorityId !== undefined && (
      typeof event.reasoningInternalCostAuthorityId !== 'string'
      || !event.reasoningInternalCostAuthorityId
    ))
    || (event.preferenceDnaReasoningAttemptId !== undefined && (
      typeof event.preferenceDnaReasoningAttemptId !== 'string'
      || !event.preferenceDnaReasoningAttemptId
    ))
    || (event.providerObservationIdDigestSha256 !== undefined
      && !isSha256(event.providerObservationIdDigestSha256))
    || (event.providerObservationDigestSha256 !== undefined
      && !isSha256(event.providerObservationDigestSha256))
    || ((event.providerObservationIdDigestSha256 === undefined)
      !== (event.providerObservationDigestSha256 === undefined))
    || !Number.isSafeInteger(event.aggregateRevision)
    || event.aggregateRevision < 1
    || !isISODate(event.createdAt)
  ) throw invalidAggregate('audit_event_invalid')
}

function assertJournalMatchesState(
  entries: JournalEntry[],
  expectedCount: number,
  expectedLastSequence: number,
  kind: JournalKind,
): void {
  if (entries.length !== expectedCount) throw invalidAggregate(`${kind}_journal_count_mismatch`)
  const ids = new Set<string>()
  for (let index = 0; index < entries.length; index += 1) {
    const entry = entries[index]
    const expectedSequence = index + 1
    if (entrySequence(kind, entry) !== expectedSequence) throw invalidAggregate(`${kind}_journal_sequence_gap`)
    if (kind === 'audit') {
      const event = entry as EditReferenceAuditEvent
      assertAuditEvent(event)
      if (ids.has(event.id)) throw invalidAggregate('audit_event_id_duplicate')
      ids.add(event.id)
    } else {
      const receipt = entry as EditReferenceIdempotencyReceipt
      assertIdempotencyReceipt(receipt)
      if (ids.has(receipt.receiptId)) throw invalidAggregate('idempotency_receipt_id_duplicate')
      ids.add(receipt.receiptId)
    }
  }
  const lastSequence = entries.length > 0 ? entrySequence(kind, entries[entries.length - 1]) : 0
  if (lastSequence !== expectedLastSequence) throw invalidAggregate(`${kind}_journal_last_sequence_mismatch`)
}

function entrySequence(kind: JournalKind, entry: JournalEntry): number {
  return kind === 'audit'
    ? (entry as EditReferenceAuditEvent).sequence
    : (entry as EditReferenceIdempotencyReceipt).ledgerSequence
}

interface JournalReadResult {
  entries: JournalEntry[]
  manifest?: PersistedJournalManifest
}

async function readJournal(scope: EditReferenceRepositoryScope, kind: JournalKind): Promise<JournalReadResult> {
  const target = pathsFor(scope)
  const journalPath = target.journal(kind)
  const manifestBytes = await readPrivateFile(target.root, journalPath.manifestFile, MAX_JOURNAL_FILE_BYTES)
  const segmentFileNames = await listJournalSegmentFileNames(target.root, journalPath.directory)
  if (!manifestBytes) {
    if (segmentFileNames.length > 0) throw invalidAggregate(`${kind}_journal_manifest_missing`)
    return { entries: [] }
  }

  const manifest = parseJournalManifest(manifestBytes, scope, kind)
  if (segmentFileNames.length !== manifest.segments.length) {
    throw invalidAggregate(`${kind}_journal_segment_inventory_mismatch`)
  }
  if (!sameStringArray(segmentFileNames, manifest.segments.map((segment) => segment.fileName))) {
    throw invalidAggregate(`${kind}_journal_segment_inventory_invalid`)
  }

  const entries: JournalEntry[] = []
  let previousChecksum: string | undefined
  for (let index = 0; index < manifest.segments.length; index += 1) {
    const descriptor = manifest.segments[index]
    const bytes = await readPrivateFile(
      target.root,
      resolve(journalPath.directory, descriptor.fileName),
      MAX_JOURNAL_FILE_BYTES,
    )
    if (!bytes) throw invalidAggregate(`${kind}_journal_segment_missing`)
    const segment = parseJournalSegment(bytes, scope, kind)
    const expectedSegmentNumber = index + 1
    if (
      segment.segmentNumber !== expectedSegmentNumber
      || descriptor.segmentNumber !== expectedSegmentNumber
      || segment.checksumSha256 !== descriptor.checksumSha256
      || segment.previousSegmentChecksumSha256 !== previousChecksum
      || segment.entries.length !== descriptor.entryCount
      || entrySequence(kind, segment.entries[0]) !== descriptor.firstSequence
      || entrySequence(kind, segment.entries[segment.entries.length - 1]) !== descriptor.lastSequence
    ) throw invalidAggregate(`${kind}_journal_segment_descriptor_mismatch`)
    entries.push(...segment.entries)
    previousChecksum = segment.checksumSha256
  }
  if (
    entries.length !== manifest.entryCount
    || (entries.length > 0 ? entrySequence(kind, entries[entries.length - 1]) : 0) !== manifest.lastSequence
  ) throw invalidAggregate(`${kind}_journal_manifest_count_mismatch`)
  assertJournalMatchesState(entries, manifest.entryCount, manifest.lastSequence, kind)
  return { entries, manifest }
}

async function appendJournalEntries(
  scope: EditReferenceRepositoryScope,
  kind: JournalKind,
  requestedEntries: JournalEntry[],
): Promise<void> {
  if (requestedEntries.length === 0) return
  let journal: JournalReadResult
  try {
    journal = await readJournal(scope, kind)
  } catch (error) {
    if (!await persistenceTransactionExists(scope)) throw error
    await rebuildJournalManifestFromSegments(scope, kind)
    journal = await readJournal(scope, kind)
  }
  const entries = [...journal.entries]
  let changed = false
  for (const requestedEntry of requestedEntries) {
    if (kind === 'audit') assertAuditEvent(requestedEntry as EditReferenceAuditEvent)
    else assertIdempotencyReceipt(requestedEntry as EditReferenceIdempotencyReceipt)
    const sequence = entrySequence(kind, requestedEntry)
    if (sequence <= entries.length) {
      const existing = entries[sequence - 1]
      if (!existing || stableStringify(existing) !== stableStringify(requestedEntry)) {
        throw invalidAggregate(`${kind}_journal_replay_conflict`)
      }
      continue
    }
    if (sequence !== entries.length + 1) throw invalidAggregate(`${kind}_journal_append_gap`)
    entries.push(clone(requestedEntry))
    changed = true
  }
  if (!changed) return

  const target = pathsFor(scope)
  const journalPath = target.journal(kind)
  const descriptors: JournalSegmentDescriptor[] = []
  let previousSegmentChecksumSha256: string | undefined
  for (let offset = 0; offset < entries.length; offset += MAX_JOURNAL_SEGMENT_ENTRIES) {
    const segmentNumber = descriptors.length + 1
    const segmentEntries = entries.slice(offset, offset + MAX_JOURNAL_SEGMENT_ENTRIES)
    const payload: JournalSegmentPayload = {
      recordVersion: JOURNAL_SEGMENT_VERSION,
      source: RECORD_SOURCE,
      journalKind: kind,
      scopeHash: editReferenceScopeHash(scope.ownerUserId, scope.workspaceId),
      segmentNumber,
      ...(previousSegmentChecksumSha256 ? { previousSegmentChecksumSha256 } : {}),
      entries: segmentEntries,
    }
    const checksumSha256 = sha256(stableStringify(payload))
    const fileName = journalSegmentFileName(segmentNumber)
    const persisted: PersistedJournalSegment = { ...payload, checksumSha256 }
    const priorDescriptor = journal.manifest?.segments[segmentNumber - 1]
    if (priorDescriptor?.checksumSha256 !== checksumSha256) {
      const content = `${JSON.stringify(persisted, null, 2)}\n`
      if (Buffer.byteLength(content) > MAX_JOURNAL_FILE_BYTES) throw invalidAggregate(`${kind}_journal_segment_too_large`)
      await writePrivateFileAtomic(target.root, resolve(journalPath.directory, fileName), content)
    }
    descriptors.push({
      segmentNumber,
      fileName,
      firstSequence: entrySequence(kind, segmentEntries[0]),
      lastSequence: entrySequence(kind, segmentEntries[segmentEntries.length - 1]),
      entryCount: segmentEntries.length,
      checksumSha256,
    })
    previousSegmentChecksumSha256 = checksumSha256
  }
  if (descriptors.length > MAX_JOURNAL_SEGMENTS) throw invalidAggregate(`${kind}_journal_segment_limit_reached`)
  await writeJournalManifest(scope, kind, descriptors, entries.length)
}

async function writeJournalManifest(
  scope: EditReferenceRepositoryScope,
  kind: JournalKind,
  segments: JournalSegmentDescriptor[],
  entryCount: number,
): Promise<void> {
  const target = pathsFor(scope)
  const payload: JournalManifestPayload = {
    recordVersion: JOURNAL_MANIFEST_VERSION,
    source: RECORD_SOURCE,
    journalKind: kind,
    scopeHash: editReferenceScopeHash(scope.ownerUserId, scope.workspaceId),
    entryCount,
    lastSequence: entryCount,
    segments,
    updatedAt: new Date().toISOString(),
  }
  const persisted: PersistedJournalManifest = {
    ...payload,
    checksumSha256: sha256(stableStringify(payload)),
  }
  const content = `${JSON.stringify(persisted, null, 2)}\n`
  if (Buffer.byteLength(content) > MAX_JOURNAL_FILE_BYTES) throw invalidAggregate(`${kind}_journal_manifest_too_large`)
  await writePrivateFileAtomic(target.root, target.journal(kind).manifestFile, content)
}

async function rebuildJournalManifestFromSegments(
  scope: EditReferenceRepositoryScope,
  kind: JournalKind,
): Promise<void> {
  const target = pathsFor(scope)
  const journalPath = target.journal(kind)
  const fileNames = await listJournalSegmentFileNames(target.root, journalPath.directory)
  if (fileNames.length === 0) return
  const descriptors: JournalSegmentDescriptor[] = []
  let expectedSequence = 1
  let previousChecksumSha256: string | undefined
  for (let index = 0; index < fileNames.length; index += 1) {
    const fileName = fileNames[index]
    const bytes = await readPrivateFile(target.root, resolve(journalPath.directory, fileName), MAX_JOURNAL_FILE_BYTES)
    if (!bytes) throw invalidAggregate(`${kind}_journal_segment_missing_during_recovery`)
    const segment = parseJournalSegment(bytes, scope, kind)
    if (
      segment.segmentNumber !== index + 1
      || segment.previousSegmentChecksumSha256 !== previousChecksumSha256
      || entrySequence(kind, segment.entries[0]) !== expectedSequence
    ) throw invalidAggregate(`${kind}_journal_recovery_chain_invalid`)
    for (const entry of segment.entries) {
      if (entrySequence(kind, entry) !== expectedSequence) throw invalidAggregate(`${kind}_journal_recovery_sequence_invalid`)
      expectedSequence += 1
    }
    descriptors.push({
      segmentNumber: segment.segmentNumber,
      fileName,
      firstSequence: entrySequence(kind, segment.entries[0]),
      lastSequence: entrySequence(kind, segment.entries[segment.entries.length - 1]),
      entryCount: segment.entries.length,
      checksumSha256: segment.checksumSha256,
    })
    previousChecksumSha256 = segment.checksumSha256
  }
  await writeJournalManifest(scope, kind, descriptors, expectedSequence - 1)
}

function parseJournalManifest(
  bytes: Buffer,
  scope: EditReferenceRepositoryScope,
  kind: JournalKind,
): PersistedJournalManifest {
  const parsed = parsePrivateJson(bytes, `${kind}_journal_manifest_invalid_json`)
  if (!isRecord(parsed)) throw invalidAggregate(`${kind}_journal_manifest_invalid`)
  const manifest = parsed as unknown as PersistedJournalManifest
  const { checksumSha256, ...payload } = manifest
  if (
    manifest.recordVersion !== JOURNAL_MANIFEST_VERSION
    || manifest.source !== RECORD_SOURCE
    || manifest.journalKind !== kind
    || manifest.scopeHash !== editReferenceScopeHash(scope.ownerUserId, scope.workspaceId)
    || !Array.isArray(manifest.segments)
    || manifest.segments.length > MAX_JOURNAL_SEGMENTS
    || !Number.isSafeInteger(manifest.entryCount)
    || manifest.entryCount < 0
    || manifest.lastSequence !== manifest.entryCount
    || !isISODate(manifest.updatedAt)
    || !isSha256(checksumSha256)
    || checksumSha256 !== sha256(stableStringify(payload))
  ) throw invalidAggregate(`${kind}_journal_manifest_invalid`)
  for (let index = 0; index < manifest.segments.length; index += 1) {
    const descriptor = manifest.segments[index]
    if (
      !isRecord(descriptor)
      || descriptor.segmentNumber !== index + 1
      || descriptor.fileName !== journalSegmentFileName(index + 1)
      || !Number.isSafeInteger(descriptor.firstSequence)
      || !Number.isSafeInteger(descriptor.lastSequence)
      || !Number.isSafeInteger(descriptor.entryCount)
      || descriptor.entryCount < 1
      || descriptor.entryCount > MAX_JOURNAL_SEGMENT_ENTRIES
      || descriptor.lastSequence - descriptor.firstSequence + 1 !== descriptor.entryCount
      || !isSha256(descriptor.checksumSha256)
    ) throw invalidAggregate(`${kind}_journal_manifest_descriptor_invalid`)
  }
  return manifest
}

function parseJournalSegment(
  bytes: Buffer,
  scope: EditReferenceRepositoryScope,
  kind: JournalKind,
): PersistedJournalSegment {
  const parsed = parsePrivateJson(bytes, `${kind}_journal_segment_invalid_json`)
  if (!isRecord(parsed)) throw invalidAggregate(`${kind}_journal_segment_invalid`)
  const segment = parsed as unknown as PersistedJournalSegment
  const { checksumSha256, ...payload } = segment
  if (
    segment.recordVersion !== JOURNAL_SEGMENT_VERSION
    || segment.source !== RECORD_SOURCE
    || segment.journalKind !== kind
    || segment.scopeHash !== editReferenceScopeHash(scope.ownerUserId, scope.workspaceId)
    || !Number.isSafeInteger(segment.segmentNumber)
    || segment.segmentNumber < 1
    || segment.segmentNumber > MAX_JOURNAL_SEGMENTS
    || (segment.previousSegmentChecksumSha256 !== undefined && !isSha256(segment.previousSegmentChecksumSha256))
    || !Array.isArray(segment.entries)
    || segment.entries.length < 1
    || segment.entries.length > MAX_JOURNAL_SEGMENT_ENTRIES
    || !isSha256(checksumSha256)
    || checksumSha256 !== sha256(stableStringify(payload))
  ) throw invalidAggregate(`${kind}_journal_segment_invalid`)
  for (const entry of segment.entries) {
    if (kind === 'audit') assertAuditEvent(entry as EditReferenceAuditEvent)
    else assertIdempotencyReceipt(entry as EditReferenceIdempotencyReceipt)
  }
  return segment
}

async function commitPersistenceTransaction(
  scope: EditReferenceRepositoryScope,
  aggregate: EditReferenceAggregate,
  auditEvents: EditReferenceAuditEvent[],
  archivedIdempotencyReceipts: EditReferenceIdempotencyReceipt[],
  now: string,
): Promise<void> {
  const payload: PersistenceTransactionPayload = {
    recordVersion: TRANSACTION_VERSION,
    source: RECORD_SOURCE,
    transactionId: `edit-reference-transaction-${randomUUID()}`,
    scopeHash: aggregate.scopeHash,
    targetRevision: aggregate.revision,
    aggregate: clone(aggregate),
    auditEvents: clone(auditEvents),
    archivedIdempotencyReceipts: clone(archivedIdempotencyReceipts),
    createdAt: now,
  }
  await writePersistenceTransaction(scope, payload)
  await appendJournalEntries(scope, 'audit', auditEvents)
  await appendJournalEntries(scope, 'idempotency', archivedIdempotencyReceipts)
  await writeAggregateRaw(scope, aggregate)
  await removePersistenceTransaction(scope)
}

async function recoverPendingTransaction(scope: EditReferenceRepositoryScope): Promise<void> {
  const transaction = await readPersistenceTransaction(scope)
  if (!transaction) return
  await appendJournalEntries(scope, 'audit', transaction.auditEvents)
  await appendJournalEntries(scope, 'idempotency', transaction.archivedIdempotencyReceipts)
  await writeAggregateRaw(scope, transaction.aggregate)
  await removePersistenceTransaction(scope)
}

async function writePersistenceTransaction(
  scope: EditReferenceRepositoryScope,
  payload: PersistenceTransactionPayload,
): Promise<void> {
  assertAggregate(payload.aggregate, scope)
  const persisted: PersistedPersistenceTransaction = {
    ...payload,
    checksumSha256: sha256(stableStringify(payload)),
  }
  const content = `${JSON.stringify(persisted, null, 2)}\n`
  if (Buffer.byteLength(content) > MAX_TRANSACTION_BYTES) throw invalidAggregate('transaction_exceeds_byte_ceiling')
  const target = pathsFor(scope)
  await writePrivateFileAtomic(target.root, target.transactionFile, content)
}

async function readPersistenceTransaction(
  scope: EditReferenceRepositoryScope,
): Promise<PersistedPersistenceTransaction | undefined> {
  const target = pathsFor(scope)
  const bytes = await readPrivateFile(target.root, target.transactionFile, MAX_TRANSACTION_BYTES)
  if (!bytes) return undefined
  const parsed = parsePrivateJson(bytes, 'transaction_invalid_json')
  if (!isRecord(parsed)) throw invalidAggregate('transaction_invalid')
  const transaction = parsed as unknown as PersistedPersistenceTransaction
  const { checksumSha256, ...payload } = transaction
  if (
    transaction.recordVersion !== TRANSACTION_VERSION
    || transaction.source !== RECORD_SOURCE
    || typeof transaction.transactionId !== 'string'
    || !transaction.transactionId
    || transaction.scopeHash !== editReferenceScopeHash(scope.ownerUserId, scope.workspaceId)
    || !Number.isSafeInteger(transaction.targetRevision)
    || transaction.targetRevision < 0
    || !isRecord(transaction.aggregate)
    || transaction.aggregate.revision !== transaction.targetRevision
    || !Array.isArray(transaction.auditEvents)
    || !Array.isArray(transaction.archivedIdempotencyReceipts)
    || !isISODate(transaction.createdAt)
    || !isSha256(checksumSha256)
    || checksumSha256 !== sha256(stableStringify(payload))
  ) throw invalidAggregate('transaction_invalid')
  assertAggregate(transaction.aggregate, scope)
  transaction.auditEvents.forEach(assertAuditEvent)
  transaction.archivedIdempotencyReceipts.forEach(assertIdempotencyReceipt)
  return transaction
}

async function persistenceTransactionExists(scope: EditReferenceRepositoryScope): Promise<boolean> {
  return Boolean(await readPersistenceTransaction(scope))
}

async function removePersistenceTransaction(scope: EditReferenceRepositoryScope): Promise<void> {
  const target = pathsFor(scope)
  await removePrivateFile(target.root, target.transactionFile)
}

async function withScopeLock<T>(scope: EditReferenceRepositoryScope, operation: () => Promise<T>): Promise<T> {
  const key = editReferenceScopeHash(scope.ownerUserId, scope.workspaceId)
  const previous = scopeLocks.get(key) ?? Promise.resolve()
  let release!: () => void
  const current = new Promise<void>((resolvePromise) => { release = resolvePromise })
  const queued = previous.then(() => current)
  scopeLocks.set(key, queued)
  await previous
  try {
    return await operation()
  } finally {
    release()
    if (scopeLocks.get(key) === queued) scopeLocks.delete(key)
  }
}

interface EditReferencePrivatePaths {
  root: string
  scopeDirectory: string
  aggregateFile: string
  transactionFile: string
  journal: (kind: JournalKind) => { directory: string; manifestFile: string }
}

function pathsFor(scope: EditReferenceRepositoryScope): EditReferencePrivatePaths {
  const root = resolve(scope.localStorageRoot)
  const hash = editReferenceScopeHash(scope.ownerUserId, scope.workspaceId)
  const scopeDirectory = resolve(root, 'edit-reference-private', 'scopes', hash)
  return {
    root,
    scopeDirectory,
    aggregateFile: resolve(scopeDirectory, 'aggregate.json'),
    transactionFile: resolve(scopeDirectory, 'transaction.json'),
    journal: (kind) => {
      const directory = resolve(scopeDirectory, kind)
      return { directory, manifestFile: resolve(directory, 'manifest.json') }
    },
  }
}

async function readPrivateFile(root: string, file: string, maximumBytes: number): Promise<Buffer | undefined> {
  assertInside(root, file)
  if (!await validateExistingDirectoryChain(root, dirname(file), true)) return undefined
  let handle: Awaited<ReturnType<typeof open>> | undefined
  try {
    handle = await open(file, constants.O_RDONLY | constants.O_NOFOLLOW)
  } catch (error) {
    if (isNodeError(error, 'ENOENT')) return undefined
    throw error
  }
  try {
    const stat = await handle.stat()
    if (!stat.isFile() || stat.size > maximumBytes) throw unsafePath('private_file_is_not_safe')
    await handle.chmod(FILE_MODE)
    return await handle.readFile()
  } finally {
    await handle.close()
  }
}

async function removePrivateFile(root: string, file: string): Promise<void> {
  assertInside(root, file)
  if (!await validateExistingDirectoryChain(root, dirname(file), true)) return
  await assertSafeTarget(file)
  await rm(file, { force: true })
  const directory = await open(dirname(file), constants.O_RDONLY)
  try { await directory.sync() } finally { await directory.close() }
}

async function listJournalSegmentFileNames(root: string, directory: string): Promise<string[]> {
  if (!await validateExistingDirectoryChain(root, directory, true)) return []
  const entries = await readdir(directory, { withFileTypes: true })
  const fileNames: string[] = []
  for (const entry of entries) {
    if (entry.name === 'manifest.json') {
      if (!entry.isFile() || entry.isSymbolicLink()) throw unsafePath('private_journal_manifest_is_not_safe')
      continue
    }
    if (!/^segment-\d{6}\.json$/.test(entry.name) || !entry.isFile() || entry.isSymbolicLink()) {
      throw unsafePath('private_journal_contains_unexpected_entry')
    }
    fileNames.push(entry.name)
  }
  return fileNames.sort()
}

function journalSegmentFileName(segmentNumber: number): string {
  return `segment-${String(segmentNumber).padStart(6, '0')}.json`
}

async function writePrivateFileAtomic(root: string, file: string, content: string): Promise<void> {
  assertInside(root, file)
  await ensurePrivateDirectoryChain(root, dirname(file))
  await assertSafeTarget(file)
  const temporary = `${file}.tmp-${process.pid}-${randomUUID()}`
  let handle: Awaited<ReturnType<typeof open>> | undefined
  try {
    handle = await open(
      temporary,
      constants.O_WRONLY | constants.O_CREAT | constants.O_EXCL | constants.O_NOFOLLOW,
      FILE_MODE,
    )
    await handle.writeFile(content)
    await handle.chmod(FILE_MODE)
    await handle.sync()
    await handle.close()
    handle = undefined
    await validateExistingDirectoryChain(root, dirname(file), false)
    await assertSafeTarget(file)
    await rename(temporary, file)
    await chmod(file, FILE_MODE)
    const directory = await open(dirname(file), constants.O_RDONLY)
    try { await directory.sync() } finally { await directory.close() }
  } finally {
    await handle?.close().catch(() => undefined)
    await rm(temporary, { force: true }).catch(() => undefined)
  }
}

async function ensurePrivateDirectoryChain(root: string, directory: string): Promise<void> {
  assertInside(root, directory)
  await mkdir(root, { recursive: true, mode: DIRECTORY_MODE })
  await assertDirectory(root)
  let cursor = root
  for (const part of relative(root, directory).split(sep).filter(Boolean)) {
    cursor = resolve(cursor, part)
    try {
      await mkdir(cursor, { mode: DIRECTORY_MODE })
    } catch (error) {
      if (!isNodeError(error, 'EEXIST')) throw error
    }
    await assertDirectory(cursor)
  }
}

async function assertDirectory(path: string): Promise<void> {
  const stat = await lstat(path)
  if (stat.isSymbolicLink() || !stat.isDirectory()) throw unsafePath('private_directory_chain_is_not_safe')
  await chmod(path, DIRECTORY_MODE)
}

async function validateExistingDirectoryChain(root: string, directory: string, allowMissing: boolean): Promise<boolean> {
  assertInside(root, directory)
  const relativePath = relative(root, directory)
  const paths = [root]
  let cursor = root
  for (const part of relativePath.split(sep).filter(Boolean)) {
    cursor = resolve(cursor, part)
    paths.push(cursor)
  }
  for (const path of paths) {
    let stat: Awaited<ReturnType<typeof lstat>>
    try { stat = await lstat(path) } catch (error) {
      if (allowMissing && isNodeError(error, 'ENOENT')) return false
      throw error
    }
    if (stat.isSymbolicLink() || !stat.isDirectory()) throw unsafePath('private_directory_chain_is_not_safe')
    await chmod(path, DIRECTORY_MODE)
  }
  return true
}

async function assertSafeTarget(file: string): Promise<void> {
  try {
    const stat = await lstat(file)
    if (stat.isSymbolicLink() || !stat.isFile()) throw unsafePath('private_target_is_not_regular')
  } catch (error) {
    if (isNodeError(error, 'ENOENT')) return
    throw error
  }
}

function assertInside(root: string, target: string): void {
  const normalizedRoot = resolve(root)
  const normalizedTarget = resolve(target)
  if (normalizedTarget !== normalizedRoot && !normalizedTarget.startsWith(`${normalizedRoot}${sep}`)) {
    throw unsafePath('private_path_escapes_root')
  }
}

function stableStringify(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`
  if (isRecord(value)) {
    return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${stableStringify(value[key])}`).join(',')}}`
  }
  return JSON.stringify(value)
}

function parsePrivateJson(bytes: Buffer, reason: string): unknown {
  try {
    return JSON.parse(bytes.toString('utf8'))
  } catch {
    throw invalidAggregate(reason)
  }
}

function sha256(value: string): string {
  return createHash('sha256').update(value).digest('hex')
}

function isSha256(value: unknown): value is string {
  return typeof value === 'string' && /^[a-f0-9]{64}$/.test(value)
}

function stableId(prefix: string, value: unknown): string {
  return `${prefix}-${sha256(stableStringify(value)).slice(0, 32)}`
}

function unique<T>(values: T[]): T[] {
  return [...new Set(values)]
}

function isISODate(value: unknown): value is string {
  return typeof value === 'string' && Number.isFinite(Date.parse(value)) && new Date(value).toISOString() === value
}

function clone<T>(value: T): T {
  return structuredClone(value)
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function isNodeError(error: unknown, code: string): error is NodeJS.ErrnoException {
  return error instanceof Error && 'code' in error && (error as NodeJS.ErrnoException).code === code
}

function isStudyStatus(value: unknown): boolean {
  return [
    'draft', 'collecting_evidence', 'ready_to_study', 'studying', 'needs_clarification', 'evidence_ready',
    'dna_ready', 'qa_blocked', 'needs_user_review', 'approved', 'applied', 'archived', 'failed',
  ].includes(String(value))
}

function invalidAggregate(reason: string): ApiError {
  return new ApiError('INTERNAL_ERROR', 'Private Edit Reference persistence failed integrity validation.', 500, { reason })
}

function unsafePath(reason: string): ApiError {
  return new ApiError('LOCAL_STORAGE_REQUIRED', 'Private Edit Reference persistence path is unsafe.', 500, { reason })
}
