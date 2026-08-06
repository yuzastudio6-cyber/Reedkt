import { createHash, randomUUID } from 'node:crypto'
import { ApiError } from '../errors/api-error'
import {
  readPrivateTextFileIfExistsWithinRoot,
  writePrivateTextFileAtomicWithinRoot,
} from '../security/private-local-persistence'
import type {
  PreferenceApplicationSource,
  PreferenceContextAudience,
  PreferenceEvidenceType,
  PreferenceObservationInput,
  PreferenceRuleCategory,
  PreferenceRuntimeState,
} from '../validation/preference-intelligence-schemas'
import { findApprovedSnapshotSecretLikePaths } from './approved-snapshot-validation'
import {
  type PlanningDomainMutationScope,
  withPlanningDomainMutationLock,
} from './planning-domain-mutation-lock'

export const PRIVATE_PREFERENCE_INTELLIGENCE_VERSION = 'private-preference-intelligence-v1' as const
const PRIVATE_PREFERENCE_INTELLIGENCE_SOURCE = 'private_preference_intelligence_store' as const
const MAX_AGGREGATE_BYTES = 8 * 1024 * 1024
export const MAX_PREFERENCE_INTELLIGENCE_AUDIT_EVENTS = 2_000
export const MAX_PREFERENCE_INTELLIGENCE_IDEMPOTENCY_RECORDS = 512

export const PREFERENCE_INSTRUCTION_PRIORITY = [
  'safety_legal_and_do_not_copy',
  'latest_explicit_user_instruction',
  'confirmed_edit_brief_marker',
  'approved_project_override',
  'selected_preference_dna',
  'general_defaults',
  'deterministic_fallback',
] as const

export interface PreferenceIntelligenceScope {
  localStorageRoot: string
  ownerUserId: string
  workspaceId: string
}

export interface ReusableEditPreferenceRecord {
  id: string
  ownerUserId: string
  workspaceId: string
  name: string
  description?: string
  status: 'active' | 'archived'
  revision: number
  currentApprovedDnaVersionId?: string
  createdAt: string
  updatedAt: string
  archivedAt?: string
}

export interface PreferenceStudySessionRecord {
  id: string
  preferenceId: string
  title: string
  status: 'active' | 'needs_user_answers' | 'ready_to_build' | 'dna_draft_ready' | 'closed'
  revision: number
  latestDnaVersionId?: string
  createdAt: string
  updatedAt: string
}

export interface PreferenceStudyMessageRecord {
  id: string
  studySessionId: string
  preferenceId: string
  role: 'user' | 'assistant' | 'system'
  content: string
  clientMessageId?: string
  runtimeState: PreferenceRuntimeState
  createdAt: string
}

export interface PreferenceStudyQuestionRecord {
  id: string
  studySessionId: string
  preferenceId: string
  prompt: string
  category: PreferenceRuleCategory
  responseType: 'free_text' | 'single_choice' | 'multi_choice' | 'boolean'
  options: string[]
  required: boolean
  status: 'open' | 'answered'
  runtimeState: PreferenceRuntimeState
  createdAt: string
  answeredAt?: string
}

export interface PreferenceStudyAnswerRecord {
  id: string
  questionId: string
  studySessionId: string
  preferenceId: string
  answerText: string
  selectedOptions: string[]
  createdAt: string
}

export interface PreferenceEvidenceObservation extends PreferenceObservationInput {
  observationId: string
}

export interface PreferenceEvidenceRecord {
  id: string
  studySessionId: string
  preferenceId: string
  evidenceType: PreferenceEvidenceType
  label: string
  privateAssetId?: string
  manualDescription?: string
  metadata: {
    mimeType?: string
    durationSeconds?: number
    width?: number
    height?: number
    hasAudioTrack?: boolean
    sourceKind?: 'user_upload' | 'previous_approved_edit' | 'manual' | 'private_asset'
  }
  observations: PreferenceEvidenceObservation[]
  evidenceStatus: 'registered' | 'metadata_ready' | 'analysis_blocked' | 'analysis_complete'
  analysisRuntimeState: PreferenceRuntimeState
  analysisWarnings: string[]
  rawFramesPersisted: false
  fullVideoSentToReasoningModel: false
  createdAt: string
  updatedAt: string
}

export interface PreferenceDnaRuleRecord {
  ruleId: string
  category: PreferenceRuleCategory
  instruction: string
  reason: string
  evidenceRefs: string[]
  confidence: number
  transferability: 'transferable' | 'non_transferable'
  conditions: string[]
  exceptions: string[]
  prohibitedCopy: boolean
  userApproved: boolean
}

export interface PreferenceDnaVersionRecord {
  id: string
  preferenceId: string
  studySessionId: string
  version: number
  status: 'draft' | 'ready_for_qa' | 'qa_passed' | 'qa_warning' | 'qa_blocked' | 'approved' | 'superseded'
  runtimeState: PreferenceRuntimeState
  summary: string
  bestUseCases: string[]
  rulesByCategory: Record<PreferenceRuleCategory, PreferenceDnaRuleRecord[]>
  doNotCopyRules: string[]
  nonTransferableElements: string[]
  copyRiskWarnings: string[]
  evidenceRefs: string[]
  evidenceCoverage: number
  confidence: number
  qaStatus: 'not_run' | 'passed' | 'warning' | 'blocked'
  approvedForApplication: boolean
  createdAt: string
  approvedAt?: string
  supersededAt?: string
}

export interface PreferenceDnaQaResultRecord {
  id: string
  preferenceId: string
  dnaVersionId: string
  status: 'passed' | 'warning' | 'blocked'
  blockingIssues: string[]
  warnings: string[]
  needsUserReview: boolean
  approvedForApplication: boolean
  confidence: number
  runtimeState: PreferenceRuntimeState
  createdAt: string
}

export interface PreferenceDnaApprovalRecord {
  id: string
  preferenceId: string
  dnaVersionId: string
  dnaVersion: number
  approvedByUserId: string
  approvedAt: string
  qaResultId: string
}

export interface PreferenceContextSummary {
  compact: true
  audience: PreferenceContextAudience
  preferenceId: string
  preferenceName: string
  preferenceDNAId: string
  preferenceDNAVersion: number
  runtimeState: PreferenceRuntimeState
  qaStatus: PreferenceDnaVersionRecord['qaStatus']
  confidence: number
  relevantRules: Partial<Record<PreferenceRuleCategory, string[]>>
  doNotCopyRules: string[]
  nonTransferableElements: string[]
  qaWarnings: string[]
  instructionPriority: typeof PREFERENCE_INSTRUCTION_PRIORITY
}

export interface PreferenceDnaApplicationRecord {
  id: string
  ownerUserId: string
  workspaceId: string
  projectId: string
  editSessionId: string
  applicationVersion: number
  status: 'applied' | 'cleared'
  selectedEditPreferenceId?: string
  selectedPreferenceDNAId?: string
  source: PreferenceApplicationSource
  tagReferenceId?: string
  preferenceWarnings: string[]
  doNotCopyRules: string[]
  preferenceSummaryForPlanner?: PreferenceContextSummary
  preferenceSummaryForMainChat?: PreferenceContextSummary
  preferenceSummaryForMarkerChat?: PreferenceContextSummary
  preferenceSummaryForEditBrief?: PreferenceContextSummary
  runtimeState: 'mock_local'
  appliedAt?: string
  clearedAt?: string
  updatedAt: string
}

export interface PreferenceUsageLogRecord {
  id: string
  preferenceId?: string
  dnaVersionId?: string
  applicationId: string
  projectId: string
  editSessionId: string
  eventType: 'applied' | 'replaced' | 'cleared' | 'context_package_read'
  source: PreferenceApplicationSource | 'backend_context_package'
  applicationVersion: number
  audience?: PreferenceContextAudience
  createdAt: string
}

export interface PreferenceIntelligenceAuditEvent {
  id: string
  eventType: string
  actorUserId: string
  preferenceId?: string
  studySessionId?: string
  dnaVersionId?: string
  applicationId?: string
  projectId?: string
  editSessionId?: string
  aggregateRevision: number
  createdAt: string
}

export interface PreferenceIntelligenceIdempotencyRecord {
  operation: string
  idempotencyKey: string
  requestHash: string
  responseEntityId: string
  responseSnapshot?: unknown
  committedAggregateRevision: number
  completedAt: string
}

export interface PrivatePreferenceIntelligenceAggregate {
  schemaVersion: typeof PRIVATE_PREFERENCE_INTELLIGENCE_VERSION
  ownerUserId: string
  workspaceId: string
  revision: number
  preferences: ReusableEditPreferenceRecord[]
  studySessions: PreferenceStudySessionRecord[]
  studyMessages: PreferenceStudyMessageRecord[]
  studyQuestions: PreferenceStudyQuestionRecord[]
  studyAnswers: PreferenceStudyAnswerRecord[]
  evidence: PreferenceEvidenceRecord[]
  dnaVersions: PreferenceDnaVersionRecord[]
  qaResults: PreferenceDnaQaResultRecord[]
  approvals: PreferenceDnaApprovalRecord[]
  applications: PreferenceDnaApplicationRecord[]
  usageLogs: PreferenceUsageLogRecord[]
  auditEvents: PreferenceIntelligenceAuditEvent[]
  idempotencyRecords: PreferenceIntelligenceIdempotencyRecord[]
  createdAt: string
  updatedAt: string
  privateInternalOnly: true
}

interface PersistedPreferenceIntelligenceAggregate {
  recordVersion: typeof PRIVATE_PREFERENCE_INTELLIGENCE_VERSION
  source: typeof PRIVATE_PREFERENCE_INTELLIGENCE_SOURCE
  aggregate: PrivatePreferenceIntelligenceAggregate
  checksumSha256: string
}

const scopeLocks = new Map<string, Promise<void>>()

export function clearPrivatePreferenceIntelligenceProcessStateForSmoke(): void {
  scopeLocks.clear()
}

export async function readPrivatePreferenceIntelligenceAggregate(
  scope: PreferenceIntelligenceScope,
): Promise<PrivatePreferenceIntelligenceAggregate | undefined> {
  const content = await readPrivateTextFileIfExistsWithinRoot({
    rootPath: scope.localStorageRoot,
    relativePath: preferenceIntelligenceRecordRelativePath(scope.ownerUserId, scope.workspaceId),
  })
  if (!content) return undefined
  let parsed: unknown
  try {
    parsed = JSON.parse(content)
  } catch {
    throw invalidAggregate('Private preference intelligence aggregate is not valid JSON.')
  }
  if (!isRecord(parsed)) throw invalidAggregate('Private preference intelligence aggregate is not an object.')
  const envelope = parsed as Partial<PersistedPreferenceIntelligenceAggregate>
  if (
    envelope.recordVersion !== PRIVATE_PREFERENCE_INTELLIGENCE_VERSION
    || envelope.source !== PRIVATE_PREFERENCE_INTELLIGENCE_SOURCE
    || !envelope.aggregate
    || typeof envelope.checksumSha256 !== 'string'
  ) {
    throw invalidAggregate('Private preference intelligence aggregate envelope is invalid.')
  }
  if (envelope.checksumSha256 !== sha256(stableStringify(envelope.aggregate))) {
    throw invalidAggregate('Private preference intelligence aggregate checksum is invalid.')
  }
  assertPreferenceIntelligenceAggregate(envelope.aggregate, scope)
  return envelope.aggregate
}

export async function mutatePrivatePreferenceIntelligenceAggregate<T>(input: {
  scope: PreferenceIntelligenceScope
  planningDomainScope?: PlanningDomainMutationScope
  now: string
  mutation: (
    aggregate: PrivatePreferenceIntelligenceAggregate,
  ) => Promise<{ result: T; changed: boolean }> | { result: T; changed: boolean }
}): Promise<T> {
  const lockKey = preferenceIntelligenceScopeHash(input.scope.ownerUserId, input.scope.workspaceId)
  const mutate = async () => withProcessLock(lockKey, async () => {
    const existing = await readPrivatePreferenceIntelligenceAggregate(input.scope)
    const aggregate = existing ?? createPreferenceIntelligenceAggregate(input.scope, input.now)
    const mutation = await input.mutation(aggregate)
    if (!mutation.changed) return mutation.result

    aggregate.revision += 1
    aggregate.updatedAt = input.now
    assertPreferenceIntelligenceAggregate(aggregate, input.scope)
    const secretLikePaths = findApprovedSnapshotSecretLikePaths(aggregate)
    if (secretLikePaths.length > 0) {
      throw new ApiError(
        'VALIDATION_FAILED',
        'Preference intelligence persistence rejected secret-like content.',
        400,
        { secretLikePaths: secretLikePaths.slice(0, 32) },
      )
    }
    const envelope: PersistedPreferenceIntelligenceAggregate = {
      recordVersion: PRIVATE_PREFERENCE_INTELLIGENCE_VERSION,
      source: PRIVATE_PREFERENCE_INTELLIGENCE_SOURCE,
      aggregate,
      checksumSha256: sha256(stableStringify(aggregate)),
    }
    const content = `${JSON.stringify(envelope)}\n`
    const byteLength = Buffer.byteLength(content, 'utf8')
    if (byteLength > MAX_AGGREGATE_BYTES) {
      throw new ApiError(
        'IDEMPOTENCY_CAPACITY_EXCEEDED',
        'Private preference intelligence aggregate reached its safe capacity.',
        503,
        { byteLength, maxBytes: MAX_AGGREGATE_BYTES },
      )
    }
    await writePrivateTextFileAtomicWithinRoot({
      rootPath: input.scope.localStorageRoot,
      relativePath: preferenceIntelligenceRecordRelativePath(input.scope.ownerUserId, input.scope.workspaceId),
      content,
    })
    return mutation.result
  })
  return input.planningDomainScope
    ? withPlanningDomainMutationLock(input.planningDomainScope, mutate)
    : mutate()
}

export function createEmptyRulesByCategory(): Record<PreferenceRuleCategory, PreferenceDnaRuleRecord[]> {
  return {
    visual_style: [],
    captions: [],
    color_grade: [],
    spacing_layout: [],
    motion_zoom: [],
    transitions: [],
    pacing: [],
    story_structure: [],
    broll: [],
    audio: [],
    graphics: [],
    platform_export: [],
    accessibility_readability: [],
    do_not_copy: [],
  }
}

export function preferenceIntelligenceHash(value: unknown): string {
  return sha256(stableStringify(value))
}

function createPreferenceIntelligenceAggregate(
  scope: PreferenceIntelligenceScope,
  now: string,
): PrivatePreferenceIntelligenceAggregate {
  return {
    schemaVersion: PRIVATE_PREFERENCE_INTELLIGENCE_VERSION,
    ownerUserId: scope.ownerUserId,
    workspaceId: scope.workspaceId,
    revision: 0,
    preferences: [],
    studySessions: [],
    studyMessages: [],
    studyQuestions: [],
    studyAnswers: [],
    evidence: [],
    dnaVersions: [],
    qaResults: [],
    approvals: [],
    applications: [],
    usageLogs: [],
    auditEvents: [],
    idempotencyRecords: [],
    createdAt: now,
    updatedAt: now,
    privateInternalOnly: true,
  }
}

function assertPreferenceIntelligenceAggregate(
  aggregate: PrivatePreferenceIntelligenceAggregate,
  scope: PreferenceIntelligenceScope,
): void {
  if (
    aggregate.schemaVersion !== PRIVATE_PREFERENCE_INTELLIGENCE_VERSION
    || aggregate.ownerUserId !== scope.ownerUserId
    || aggregate.workspaceId !== scope.workspaceId
    || aggregate.privateInternalOnly !== true
    || !Number.isInteger(aggregate.revision)
    || aggregate.revision < 0
  ) throw invalidAggregate('Private preference intelligence tenancy or revision is invalid.')

  const collections = [
    aggregate.preferences,
    aggregate.studySessions,
    aggregate.studyMessages,
    aggregate.studyQuestions,
    aggregate.studyAnswers,
    aggregate.evidence,
    aggregate.dnaVersions,
    aggregate.qaResults,
    aggregate.approvals,
    aggregate.applications,
    aggregate.usageLogs,
    aggregate.auditEvents,
    aggregate.idempotencyRecords,
  ]
  if (collections.some((collection) => !Array.isArray(collection))) {
    throw invalidAggregate('Private preference intelligence collections are invalid.')
  }
  if (
    aggregate.auditEvents.length > MAX_PREFERENCE_INTELLIGENCE_AUDIT_EVENTS
    || aggregate.idempotencyRecords.length > MAX_PREFERENCE_INTELLIGENCE_IDEMPOTENCY_RECORDS
  ) throw invalidAggregate('Private preference intelligence evidence capacity is invalid.')

  for (const collection of collections.slice(0, -1)) assertUniqueIds(collection as Array<{ id: string }>)
  const preferenceIds = new Set(aggregate.preferences.map((preference) => preference.id))
  const sessionIds = new Set(aggregate.studySessions.map((session) => session.id))
  const evidenceIds = new Set(aggregate.evidence.map((evidence) => evidence.id))
  const dnaIds = new Set(aggregate.dnaVersions.map((dna) => dna.id))
  const qaIds = new Set(aggregate.qaResults.map((qa) => qa.id))

  for (const preference of aggregate.preferences) {
    if (preference.ownerUserId !== scope.ownerUserId || preference.workspaceId !== scope.workspaceId) {
      throw invalidAggregate('Reusable Edit Preference ownership scope is invalid.')
    }
    if (preference.currentApprovedDnaVersionId && !dnaIds.has(preference.currentApprovedDnaVersionId)) {
      throw invalidAggregate('Reusable Edit Preference approved DNA link is invalid.')
    }
  }
  for (const session of aggregate.studySessions) {
    if (!preferenceIds.has(session.preferenceId)) throw invalidAggregate('Preference Study Session link is invalid.')
  }
  for (const message of aggregate.studyMessages) {
    if (!sessionIds.has(message.studySessionId) || !preferenceIds.has(message.preferenceId)) {
      throw invalidAggregate('Preference Study Message link is invalid.')
    }
  }
  for (const question of aggregate.studyQuestions) {
    if (!sessionIds.has(question.studySessionId) || !preferenceIds.has(question.preferenceId)) {
      throw invalidAggregate('Preference Study Question link is invalid.')
    }
  }
  for (const answer of aggregate.studyAnswers) {
    if (!sessionIds.has(answer.studySessionId) || !preferenceIds.has(answer.preferenceId)) {
      throw invalidAggregate('Preference Study Answer link is invalid.')
    }
    if (!aggregate.studyQuestions.some((question) => question.id === answer.questionId)) {
      throw invalidAggregate('Preference Study Answer question link is invalid.')
    }
  }
  for (const evidence of aggregate.evidence) {
    if (!sessionIds.has(evidence.studySessionId) || !preferenceIds.has(evidence.preferenceId)) {
      throw invalidAggregate('Preference Evidence link is invalid.')
    }
    if (evidence.rawFramesPersisted || evidence.fullVideoSentToReasoningModel) {
      throw invalidAggregate('Preference Evidence violated bounded-media policy.')
    }
  }
  for (const dna of aggregate.dnaVersions) {
    if (!preferenceIds.has(dna.preferenceId) || !sessionIds.has(dna.studySessionId)) {
      throw invalidAggregate('Preference DNA ownership link is invalid.')
    }
    if (dna.evidenceRefs.some((evidenceId) => !evidenceIds.has(evidenceId))) {
      throw invalidAggregate('Preference DNA evidence link is invalid.')
    }
    const flattenedRules = Object.values(dna.rulesByCategory).flat()
    if (flattenedRules.some((rule) => rule.evidenceRefs.some((evidenceId) => !evidenceIds.has(evidenceId)))) {
      throw invalidAggregate('Preference DNA rule evidence link is invalid.')
    }
    if (flattenedRules.some((rule) => rule.transferability === 'non_transferable' && !rule.prohibitedCopy)) {
      throw invalidAggregate('Preference DNA non-transferable rule is not prohibited from copying.')
    }
  }
  for (const qa of aggregate.qaResults) {
    if (!preferenceIds.has(qa.preferenceId) || !dnaIds.has(qa.dnaVersionId)) {
      throw invalidAggregate('Preference DNA QA link is invalid.')
    }
  }
  for (const approval of aggregate.approvals) {
    if (!preferenceIds.has(approval.preferenceId) || !dnaIds.has(approval.dnaVersionId) || !qaIds.has(approval.qaResultId)) {
      throw invalidAggregate('Preference DNA approval link is invalid.')
    }
  }

  const applicationKeys = new Set<string>()
  for (const application of aggregate.applications) {
    if (
      application.ownerUserId !== scope.ownerUserId
      || application.workspaceId !== scope.workspaceId
    ) throw invalidAggregate('Preference DNA Application ownership scope is invalid.')
    const key = `${application.projectId}\u0000${application.editSessionId}`
    if (applicationKeys.has(key)) throw invalidAggregate('Project Edit Session has duplicate preference application state.')
    applicationKeys.add(key)
    if (application.status === 'applied') assertAppliedPreferenceApplication(application, aggregate)
    if (application.status === 'cleared') assertClearedPreferenceApplication(application)
  }

  const idempotencyKeys = new Set<string>()
  for (const entry of aggregate.idempotencyRecords) {
    const key = `${entry.operation}\u0000${entry.idempotencyKey}`
    if (idempotencyKeys.has(key)) throw invalidAggregate('Preference intelligence idempotency key is duplicated.')
    idempotencyKeys.add(key)
    if (entry.committedAggregateRevision > aggregate.revision) {
      throw invalidAggregate('Preference intelligence idempotency revision is ahead of the aggregate.')
    }
  }
}

function assertAppliedPreferenceApplication(
  application: PreferenceDnaApplicationRecord,
  aggregate: PrivatePreferenceIntelligenceAggregate,
): void {
  if (!application.selectedEditPreferenceId || !application.selectedPreferenceDNAId || !application.appliedAt) {
    throw invalidAggregate('Applied preference application is missing stable selection state.')
  }
  const preference = aggregate.preferences.find((candidate) => candidate.id === application.selectedEditPreferenceId)
  const dna = aggregate.dnaVersions.find((candidate) => candidate.id === application.selectedPreferenceDNAId)
  if (!preference || !dna || dna.preferenceId !== preference.id || dna.status !== 'approved') {
    throw invalidAggregate('Applied preference application does not reference approved DNA.')
  }
  const summaries = [
    application.preferenceSummaryForPlanner,
    application.preferenceSummaryForMainChat,
    application.preferenceSummaryForMarkerChat,
    application.preferenceSummaryForEditBrief,
  ]
  if (summaries.some((summary) => !summary)) {
    throw invalidAggregate('Applied preference application is missing compact context summaries.')
  }
  for (const summary of summaries as PreferenceContextSummary[]) {
    if (
      summary.preferenceId !== preference.id
      || summary.preferenceDNAId !== dna.id
      || stableStringify(summary.doNotCopyRules) !== stableStringify(dna.doNotCopyRules)
      || stableStringify(summary.instructionPriority) !== stableStringify(PREFERENCE_INSTRUCTION_PRIORITY)
    ) throw invalidAggregate('Preference application context lost stable DNA or do-not-copy priority.')
  }
  if (stableStringify(application.doNotCopyRules) !== stableStringify(dna.doNotCopyRules)) {
    throw invalidAggregate('Preference application lost do-not-copy rules.')
  }
}

function assertClearedPreferenceApplication(application: PreferenceDnaApplicationRecord): void {
  if (
    application.selectedEditPreferenceId
    || application.selectedPreferenceDNAId
    || application.appliedAt
    || !application.clearedAt
    || application.doNotCopyRules.length > 0
    || application.preferenceSummaryForPlanner
    || application.preferenceSummaryForMainChat
    || application.preferenceSummaryForMarkerChat
    || application.preferenceSummaryForEditBrief
  ) throw invalidAggregate('Cleared preference application retained selected DNA context.')
}

function assertUniqueIds(collection: Array<{ id: string }>): void {
  if (collection.some((entry) => !entry || typeof entry.id !== 'string' || !entry.id.trim())) {
    throw invalidAggregate('Preference intelligence record ID is invalid.')
  }
  if (new Set(collection.map((entry) => entry.id)).size !== collection.length) {
    throw invalidAggregate('Preference intelligence record IDs are not unique.')
  }
}

export function preferenceIntelligenceRecordRelativePath(ownerUserId: string, workspaceId: string): string {
  return [
    'preference-intelligence',
    'private-internal-v1',
    `scope-${preferenceIntelligenceScopeHash(ownerUserId, workspaceId)}.json`,
  ].join('/')
}

function preferenceIntelligenceScopeHash(ownerUserId: string, workspaceId: string): string {
  return sha256(`${ownerUserId}\u0000${workspaceId}`)
}

function stableStringify(value: unknown): string {
  return JSON.stringify(stableJsonValue(value))
}

function stableJsonValue(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(stableJsonValue)
  if (!value || typeof value !== 'object') return value
  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>)
      .filter(([, entryValue]) => entryValue !== undefined)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, entryValue]) => [key, stableJsonValue(entryValue)]),
  )
}

function sha256(value: string): string {
  return createHash('sha256').update(value).digest('hex')
}

async function withProcessLock<T>(key: string, operation: () => Promise<T>): Promise<T> {
  const previous = scopeLocks.get(key) ?? Promise.resolve()
  let release: () => void = () => undefined
  const current = new Promise<void>((resolve) => {
    release = resolve
  })
  const queued = previous.catch(() => undefined).then(() => current)
  scopeLocks.set(key, queued)
  await previous.catch(() => undefined)
  try {
    return await operation()
  } finally {
    release()
    if (scopeLocks.get(key) === queued) scopeLocks.delete(key)
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value))
}

function invalidAggregate(message: string): ApiError {
  return new ApiError('VALIDATION_FAILED', message, 409)
}

export function createPreferenceIntelligenceId(prefix: string): string {
  return `${prefix}_${randomUUID()}`
}
