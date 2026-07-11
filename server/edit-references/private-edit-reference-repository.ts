import { createHash, randomUUID } from 'node:crypto'
import { constants } from 'node:fs'
import { chmod, lstat, mkdir, open, rename, rm } from 'node:fs/promises'
import { dirname, relative, resolve, sep } from 'node:path'
import { EDIT_REFERENCE_DNA_QA_CHECK_IDS } from '../../src/types/edit-reference'
import { ApiError } from '../errors/api-error'
import {
  EDIT_REFERENCE_AGGREGATE_VERSION,
  type EditReferenceAggregate,
  type EditReferenceAuditEvent,
  type EditReferenceMutationInput,
  type EditReferenceMutationResult,
  type EditReferenceRepository,
  type EditReferenceRepositoryScope,
} from './edit-reference-repository'

const RECORD_VERSION = 'edit-reference-private-envelope-v1' as const
const RECORD_SOURCE = 'edit_reference_private_repository' as const
const DIRECTORY_MODE = 0o700
const FILE_MODE = 0o600
const MAX_AGGREGATE_BYTES = 8 * 1024 * 1024
const MAX_REFERENCES = 200
const MAX_STUDIES = 1_000
const MAX_MESSAGES = 10_000
const MAX_EVIDENCE_RECORDS = 5_000
const MAX_ASSET_RECORDS = 2_000
const MAX_SKILL_RUNS = 5_000
const MAX_DNA_VERSIONS = 2_000
const MAX_DNA_QA_RESULTS = 2_000
const MAX_DNA_INPUTS_PER_VERSION = 128
const MAX_DNA_RULES_PER_VERSION = 256
const MAX_DNA_CONFLICTS_PER_VERSION = 128
const MAX_AUDIT_EVENTS = 2_000
const MAX_IDEMPOTENCY_RECORDS = 512

interface PersistedEnvelope {
  recordVersion: typeof RECORD_VERSION
  source: typeof RECORD_SOURCE
  aggregate: EditReferenceAggregate
  checksumSha256: string
}

const scopeLocks = new Map<string, Promise<void>>()

export class PrivateEditReferenceRepository implements EditReferenceRepository {
  readonly persistence = 'backend_local_private' as const

  async read(scope: EditReferenceRepositoryScope): Promise<EditReferenceAggregate | undefined> {
    return readAggregate(scope)
  }

  async mutate(input: EditReferenceMutationInput): Promise<EditReferenceMutationResult> {
    return withScopeLock(input.scope, async () => {
      const existing = await readAggregate(input.scope)
      const aggregate = existing ? clone(existing) : createAggregate(input.scope)
      const keyCollision = aggregate.idempotencyRecords.find((record) => record.key === input.idempotencyKey)
      if (keyCollision) {
        if (keyCollision.operation !== input.operation || keyCollision.requestHash !== input.requestHash) {
          throw new ApiError(
            'IDEMPOTENCY_CONFLICT',
            'The idempotency key was already committed for a different Edit Reference request.',
            409,
            { operation: keyCollision.operation, committedRevision: keyCollision.committedRevision },
          )
        }
        return { data: clone(keyCollision.responseSnapshot), replayed: true }
      }
      if (aggregate.idempotencyRecords.length >= MAX_IDEMPOTENCY_RECORDS) {
        throw new ApiError(
          'IDEMPOTENCY_CONFLICT',
          'The private Edit Reference idempotency ledger reached its safe local bound.',
          503,
          { reason: 'idempotency_ledger_capacity_reached', maximumRecords: MAX_IDEMPOTENCY_RECORDS },
        )
      }

      const nextRevision = aggregate.revision + 1
      const now = new Date().toISOString()
      const pendingAuditEvents: EditReferenceAuditEvent[] = []
      const data = input.mutate({
        now,
        actorUserId: input.scope.ownerUserId,
        aggregate,
        addAuditEvent: (event) => pendingAuditEvents.push({
          ...event,
          id: `edit-reference-audit-${randomUUID()}`,
          actorUserId: input.scope.ownerUserId,
          aggregateRevision: nextRevision,
          createdAt: now,
        }),
      })

      aggregate.revision = nextRevision
      aggregate.updatedAt = now
      aggregate.auditEvents.push(...pendingAuditEvents)
      aggregate.auditEvents = aggregate.auditEvents.slice(-MAX_AUDIT_EVENTS)
      aggregate.idempotencyRecords.push({
        operation: input.operation,
        key: input.idempotencyKey,
        requestHash: input.requestHash,
        responseSnapshot: clone(data),
        committedRevision: nextRevision,
        completedAt: now,
      })
      assertAggregate(aggregate, input.scope)
      await writeAggregate(input.scope, aggregate)
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
    evidence: [],
    assets: [],
    skillRuns: [],
    dnaVersions: [],
    dnaQaResults: [],
    applications: [],
    usageLogs: [],
    auditEvents: [],
    idempotencyRecords: [],
    createdAt: now,
    updatedAt: now,
    privateInternalOnly: true,
  }
}

async function readAggregate(scope: EditReferenceRepositoryScope): Promise<EditReferenceAggregate | undefined> {
  const target = pathsFor(scope)
  const bytes = await readPrivateFile(target.root, target.file)
  if (!bytes) return undefined
  if (bytes.byteLength > MAX_AGGREGATE_BYTES) throw invalidAggregate('aggregate_exceeds_byte_ceiling')

  let parsed: unknown
  try {
    parsed = JSON.parse(bytes.toString('utf8'))
  } catch {
    throw invalidAggregate('aggregate_is_not_valid_json')
  }
  if (!isRecord(parsed)) throw invalidAggregate('aggregate_envelope_is_not_an_object')
  const envelope = parsed as Partial<PersistedEnvelope>
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
  const aggregate = envelope.aggregate as unknown as EditReferenceAggregate
  assertAggregate(aggregate, scope)
  return clone(aggregate)
}

async function writeAggregate(scope: EditReferenceRepositoryScope, aggregate: EditReferenceAggregate): Promise<void> {
  const target = pathsFor(scope)
  const envelope: PersistedEnvelope = {
    recordVersion: RECORD_VERSION,
    source: RECORD_SOURCE,
    aggregate,
    checksumSha256: sha256(stableStringify(aggregate)),
  }
  const content = `${JSON.stringify(envelope, null, 2)}\n`
  if (Buffer.byteLength(content) > MAX_AGGREGATE_BYTES) throw invalidAggregate('aggregate_exceeds_byte_ceiling')
  await writePrivateFileAtomic(target.root, target.file, content)
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
    aggregate.evidence,
    aggregate.assets,
    aggregate.skillRuns,
    aggregate.dnaVersions,
    aggregate.dnaQaResults,
    aggregate.applications,
    aggregate.usageLogs,
    aggregate.auditEvents,
    aggregate.idempotencyRecords,
  ]
  if (arrays.some((value) => !Array.isArray(value))) throw invalidAggregate('aggregate_collection_is_invalid')
  if (aggregate.references.length > MAX_REFERENCES) throw invalidAggregate('too_many_references')
  if (aggregate.studies.length > MAX_STUDIES) throw invalidAggregate('too_many_studies')
  if (aggregate.messages.length > MAX_MESSAGES) throw invalidAggregate('too_many_messages')
  if (aggregate.evidence.length > MAX_EVIDENCE_RECORDS) throw invalidAggregate('too_many_evidence_records')
  if (aggregate.assets.length > MAX_ASSET_RECORDS) throw invalidAggregate('too_many_asset_records')
  if (aggregate.skillRuns.length > MAX_SKILL_RUNS) throw invalidAggregate('too_many_skill_runs')
  if (aggregate.dnaVersions.length > MAX_DNA_VERSIONS) throw invalidAggregate('too_many_dna_versions')
  if (aggregate.dnaQaResults.length > MAX_DNA_QA_RESULTS) throw invalidAggregate('too_many_dna_qa_results')
  if (aggregate.auditEvents.length > MAX_AUDIT_EVENTS) throw invalidAggregate('too_many_audit_events')
  if (aggregate.idempotencyRecords.length > MAX_IDEMPOTENCY_RECORDS) throw invalidAggregate('too_many_idempotency_records')

  assertUniqueIds(aggregate.references, 'reference')
  assertUniqueIds(aggregate.studies, 'study')
  assertUniqueIds(aggregate.messages, 'message')
  assertUniqueIds(aggregate.evidence, 'evidence')
  assertUniqueIds(aggregate.assets, 'asset')
  assertUniqueIds(aggregate.skillRuns, 'skill_run')
  assertUniqueIds(aggregate.dnaVersions, 'dna_version')
  assertUniqueIds(aggregate.dnaQaResults, 'dna_qa')
  assertUniqueIds(aggregate.applications, 'application')
  assertUniqueIds(aggregate.usageLogs, 'usage_log')
  assertUniqueIds(aggregate.auditEvents, 'audit_event')
  const idempotencyKeys = new Set<string>()
  for (const record of aggregate.idempotencyRecords) {
    if (
      !isRecord(record)
      || typeof record.key !== 'string'
      || !record.key
      || typeof record.operation !== 'string'
      || typeof record.requestHash !== 'string'
      || !isRecord(record.responseSnapshot)
    ) throw invalidAggregate('idempotency_record_invalid')
    if (idempotencyKeys.has(record.key)) throw invalidAggregate('idempotency_key_duplicate')
    idempotencyKeys.add(record.key)
  }

  const referenceIds = new Set(aggregate.references.map((record) => record.id))
  const studyIds = new Set(aggregate.studies.map((record) => record.id))
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
        'deterministic_dna_qa', 'deterministic_dna_approval',
      ].includes(message.runtimeSource)
      || !message.content
      || message.content.length > 8_000
      || !Number.isSafeInteger(message.sequence)
      || message.sequence < 1
    ) throw invalidAggregate('message_contract_invalid')
    const sequenceKey = `${message.studySessionId}:${message.sequence}`
    if (messageSequences.has(sequenceKey)) throw invalidAggregate('message_sequence_duplicate')
    messageSequences.add(sequenceKey)
    if (!referenceIds.has(message.editReferenceId) || !studyIds.has(message.studySessionId)) {
      throw invalidAggregate('message_link_is_invalid')
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
  for (const record of aggregate.applications) {
    assertWorkspace(record, scope.workspaceId)
    if (!referenceIds.has(record.editReferenceId)) throw invalidAggregate('application_reference_missing')
  }
  for (const record of aggregate.usageLogs) {
    assertWorkspace(record, scope.workspaceId)
    if (!referenceIds.has(record.editReferenceId)) throw invalidAggregate('usage_reference_missing')
  }
  if (findForbiddenPersistenceKey(aggregate)) throw invalidAggregate('forbidden_private_payload_field')
}

function assertDNAVersions(aggregate: EditReferenceAggregate, evidenceIds: Set<string>): void {
  const versionKeys = new Set<string>()
  for (const record of aggregate.dnaVersions) {
    const versionKey = `${record.studySessionId}:${record.version}`
    if (versionKeys.has(versionKey)) throw invalidAggregate('dna_version_number_duplicate')
    versionKeys.add(versionKey)
    if (
      !Number.isSafeInteger(record.version)
      || record.version < 1
      || !['draft', 'review_required', 'approved', 'superseded'].includes(record.status)
      || record.synthesisVersion !== 'edit-reference-dna-synthesis-v1'
      || record.runtimeSource !== 'verified_mock'
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
    ) throw invalidAggregate('dna_version_contract_invalid')
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
        || !['evidence_synthesis', 'deterministic_safety_rule'].includes(rule.source)
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
        || !['review_required_evidence', 'non_transferable_evidence'].includes(conflict.kind)
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
    const immutableContent = {
      synthesisVersion: record.synthesisVersion,
      inputEvidenceRevisions: record.inputEvidenceRevisions,
      inputEvidenceDigest: record.inputEvidenceDigest,
      layers: record.layers,
      rules: record.rules,
      conflicts: record.conflicts,
      overallConfidence: record.overallConfidence,
      overallConfidenceBand: record.overallConfidenceBand,
      adaptedNotCopied: record.adaptedNotCopied,
    }
    if (record.contentDigest !== sha256(stableStringify(immutableContent))) throw invalidAggregate('dna_content_digest_invalid')
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
      || record.qaVersion !== 'edit-reference-dna-qa-v1'
      || record.runtimeSource !== 'verified_mock'
      || !['passed', 'blocked', 'requires_user_review'].includes(record.status)
      || record.dnaContentDigest !== dnaVersion.contentDigest
      || record.inputEvidenceDigest !== dnaVersion.inputEvidenceDigest
      || !Array.isArray(record.checks)
      || record.checks.length !== EDIT_REFERENCE_DNA_QA_CHECK_IDS.length
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
    if (
      checkIds.size !== record.checks.length
      || checkRecordIds.size !== record.checks.length
      || !sameStringSet([...checkIds], [...EDIT_REFERENCE_DNA_QA_CHECK_IDS])
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
    || !['user_input', 'verified_local', 'verified_mock', 'fallback', 'blocked'].includes(record.provenance.runtimeSource)
    || !['not_applicable', 'media_not_studied', 'approved_edit_identity_not_verified'].includes(record.provenance.mediaStudyStatus)
    || !Array.isArray(record.provenance.sourceEvidenceIds)
    || !Array.isArray(record.provenance.toolIds)
    || !Array.isArray(record.provenance.skillIds)
    || !Array.isArray(record.provenance.notes)
    || typeof record.provenance.fallbackUsed !== 'boolean'
  ) throw invalidAggregate('evidence_contract_invalid')
  if (record.provenance.sourceEvidenceIds.some((id) => typeof id !== 'string' || !evidenceIds.has(id))) {
    throw invalidAggregate('evidence_provenance_link_invalid')
  }
  if (record.mediaMetadata) assertMediaMetadata(record.mediaMetadata)
}

function assertAssetRecord(record: EditReferenceAggregate['assets'][number]): void {
  if (
    !record.privateAssetId
    || !['reference_video_metadata', 'previous_approved_edit_snapshot'].includes(record.assetKind)
    || !record.label
    || record.label.length > 240
    || !['user_owned', 'licensed_or_authorized', 'reference_only', 'workspace_approved_edit'].includes(record.rightsBasis)
    || !['media_not_studied', 'approved_edit_identity_not_verified'].includes(record.mediaStudyStatus)
  ) throw invalidAggregate('asset_contract_invalid')
  if (record.mediaMetadata) assertMediaMetadata(record.mediaMetadata)
  if (record.assetKind === 'previous_approved_edit_snapshot' && (!record.projectId || !record.editSessionId || !record.approvedSnapshotId)) {
    throw invalidAggregate('approved_edit_asset_identity_invalid')
  }
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
  const allLinks = [...record.inputEvidenceIds, ...record.outputEvidenceIds]
  if (allLinks.some((id) => typeof id !== 'string' || !evidenceIds.has(id))) throw invalidAggregate('skill_run_evidence_link_invalid')
  const sideEffects = [
    record.providerCallMade,
    record.modelCallMade,
    record.fileBytesRead,
    record.externalUrlFetched,
    record.mediaProcessingStarted,
    record.workerJobCreated,
  ]
  if (sideEffects.some((value) => value !== false)) throw invalidAggregate('skill_run_side_effect_flag_invalid')
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

function pathsFor(scope: EditReferenceRepositoryScope): { root: string; file: string } {
  const root = resolve(scope.localStorageRoot)
  const hash = editReferenceScopeHash(scope.ownerUserId, scope.workspaceId)
  return { root, file: resolve(root, 'edit-reference-private', 'scopes', hash, 'aggregate.json') }
}

async function readPrivateFile(root: string, file: string): Promise<Buffer | undefined> {
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
    if (!stat.isFile() || stat.size > MAX_AGGREGATE_BYTES) throw unsafePath('private_file_is_not_safe')
    await handle.chmod(FILE_MODE)
    return await handle.readFile()
  } finally {
    await handle.close()
  }
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

function sha256(value: string): string {
  return createHash('sha256').update(value).digest('hex')
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
