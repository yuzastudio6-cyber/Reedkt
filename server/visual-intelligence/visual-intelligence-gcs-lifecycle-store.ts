import { createHash } from 'node:crypto'

import type {
  VisualIntelligenceEvidenceRef,
  VisualIntelligenceReport,
  VisualIntelligenceRequest,
  VisualIntelligenceSpatialEvidence,
} from '../../src/types/visual-intelligence'
import { ApiError } from '../errors/api-error'
import type {
  CanonicalCreateOnlyJsonObjectPort,
} from '../services/canonical-gcs-source-analysis-lifecycle-store'
import {
  createVisualIntelligenceEvidenceRef,
  parseVisualIntelligenceReport,
  parseVisualIntelligenceSpatialEvidence,
  visualIntelligenceCanonicalJson,
} from './visual-intelligence-contract'
import type {
  VisualIntelligenceAttemptStore,
  VisualIntelligenceReportRepository,
  VisualIntelligenceSpatialEvidenceRepository,
} from './visual-intelligence-lifecycle-service'
import {
  visualIntelligenceProfileRequiresSpatialEvidence,
} from './visual-intelligence-profile-registry'

export const VISUAL_INTELLIGENCE_GCS_LIFECYCLE_STORE_VERSION =
  'visual-intelligence-gcs-lifecycle-store-v2' as const

const DEFAULT_PREFIX = 'private/visual-intelligence/v1'
const MAX_RECORD_BYTES = 16 * 1024 * 1024
const SAFE_ID = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,239}$/u
const PREFIXED_SHA256 = /^sha256:[a-f0-9]{64}$/u

export type VisualIntelligenceDurableLifecycleStore =
  VisualIntelligenceAttemptStore
  & VisualIntelligenceReportRepository
  & VisualIntelligenceSpatialEvidenceRepository
  & {
    readonly schemaVersion:
      typeof VISUAL_INTELLIGENCE_GCS_LIFECYCLE_STORE_VERSION
    readonly evidenceClass:
      'gcs_generation_create_only_visual_intelligence_lifecycle_store'
  }

interface AttemptIntentRecord {
  readonly schemaVersion: 'visual-intelligence-attempt-intent-v1'
  readonly requestId: string
  readonly idempotencyKey: string
  readonly requestDigestSha256: string
  readonly cacheIdentitySha256: string
}

interface AttemptStartedRecord {
  readonly schemaVersion: 'visual-intelligence-attempt-provider-start-v1'
  readonly attemptRef: VisualIntelligenceEvidenceRef
  readonly dispatchConfigurationDigestSha256: string
  readonly maximumAttempts: 1
  readonly attemptOrdinal: 1
  readonly uncertainProviderOutcomeRetryAllowed: false
}

interface AttemptFailureRecord {
  readonly schemaVersion: 'visual-intelligence-attempt-failure-v1'
  readonly attemptRef: VisualIntelligenceEvidenceRef
  readonly outcome: 'not_executed' | 'unknown' | 'executed_rejected'
  readonly blockerCode: string
  readonly automaticRetryAllowed: false
}

interface AttemptCompletionRecord {
  readonly schemaVersion: 'visual-intelligence-attempt-completion-v1'
  readonly attemptRef: VisualIntelligenceEvidenceRef
  readonly reportRef: VisualIntelligenceEvidenceRef
  readonly providerCallOutcome: 'executed'
  readonly accountEffectiveCostSettled: true
}

interface CacheIndexRecord {
  readonly schemaVersion: 'visual-intelligence-cache-index-v1'
  readonly cacheIdentitySha256: string
  readonly scope: VisualIntelligenceRequest['scope']
  readonly reportRef: VisualIntelligenceEvidenceRef
}

const admittedStores = new WeakSet<object>()

export function createVisualIntelligenceDurableLifecycleStore(input: {
  readonly objectPort: CanonicalCreateOnlyJsonObjectPort
  readonly prefix?: string
}): VisualIntelligenceDurableLifecycleStore {
  if (
    !input.objectPort
    || typeof input.objectPort.createOnly !== 'function'
    || typeof input.objectPort.readExact !== 'function'
  ) throw notReady('visual_intelligence_object_port_invalid')
  const prefix = normalizePrefix(input.prefix ?? DEFAULT_PREFIX)

  const storeImplementation: VisualIntelligenceDurableLifecycleStore = {
    schemaVersion: VISUAL_INTELLIGENCE_GCS_LIFECYCLE_STORE_VERSION,
    evidenceClass:
      'gcs_generation_create_only_visual_intelligence_lifecycle_store',

    async beginCreateOnly(value) {
      const intent = parseAttemptIntent({
        schemaVersion: 'visual-intelligence-attempt-intent-v1',
        ...value,
      })
      const intentPath = attemptPath(prefix, intent.requestId, 'intent')
      const status = await persistRecord(input.objectPort, intentPath, intent)
      const persisted = parseAttemptIntent(
        requireRecord(await readRecord(input.objectPort, intentPath)),
      )
      if (!same(intent, persisted)) return { status: 'conflict' }
      const attemptRef = attemptReference(intent)
      const refIntentPath = attemptReferencePath(prefix, attemptRef)
      await persistRecord(input.objectPort, refIntentPath, intent)
      const refIntent = parseAttemptIntent(
        requireRecord(await readRecord(input.objectPort, refIntentPath)),
      )
      if (!same(intent, refIntent)) return { status: 'conflict' }
      const completed = await readRecord(
        input.objectPort,
        attemptPath(prefix, intent.requestId, 'completed'),
      )
      if (completed) {
        const terminal = parseAttemptCompletion(completed)
        if (refKey(terminal.attemptRef) !== refKey(attemptRef)) {
          return { status: 'conflict' }
        }
        return { status: 'already_completed', reportRef: terminal.reportRef }
      }
      const failed = await readRecord(
        input.objectPort,
        attemptPath(prefix, intent.requestId, 'failed'),
      )
      if (failed) {
        const terminal = parseAttemptFailure(failed)
        if (refKey(terminal.attemptRef) !== refKey(attemptRef)) {
          return { status: 'conflict' }
        }
        return { status: 'conflict' }
      }
      if (status === 'already_exists') return { status: 'already_in_progress' }
      return { status: 'created', attemptRef }
    },

    async markProviderCallStarted(value) {
      const record = parseAttemptStarted({
        schemaVersion: 'visual-intelligence-attempt-provider-start-v1',
        ...value,
      })
      const intent = await requireMatchingIntent(
        input.objectPort,
        prefix,
        record.attemptRef,
      )
      const requestId = intent.requestId
      if (await terminalExists(input.objectPort, prefix, requestId)) {
        throw conflict('visual_intelligence_attempt_already_terminal')
      }
      const objectPath = attemptPath(prefix, requestId, 'provider-started')
      await persistRecord(input.objectPort, objectPath, record)
      const reread = parseAttemptStarted(
        requireRecord(await readRecord(input.objectPort, objectPath)),
      )
      if (!same(record, reread)) {
        throw conflict('visual_intelligence_provider_start_reread_mismatch')
      }
      return { exactCreateOnlyRereadVerified: true }
    },

    async markFailed(value) {
      const record = parseAttemptFailure({
        schemaVersion: 'visual-intelligence-attempt-failure-v1',
        ...value,
      })
      const intent = await requireMatchingIntent(
        input.objectPort,
        prefix,
        record.attemptRef,
      )
      const requestId = intent.requestId
      const completed = await readRecord(
        input.objectPort,
        attemptPath(prefix, requestId, 'completed'),
      )
      if (completed) throw conflict('visual_intelligence_completed_attempt_cannot_fail')
      const objectPath = attemptPath(prefix, requestId, 'failed')
      await persistRecord(input.objectPort, objectPath, record)
      const reread = parseAttemptFailure(
        requireRecord(await readRecord(input.objectPort, objectPath)),
      )
      if (!same(record, reread)) {
        throw conflict('visual_intelligence_failure_reread_mismatch')
      }
    },

    async markCompleted(value) {
      const record = parseAttemptCompletion({
        schemaVersion: 'visual-intelligence-attempt-completion-v1',
        ...value,
      })
      const intent = await requireMatchingIntent(
        input.objectPort,
        prefix,
        record.attemptRef,
      )
      const requestId = intent.requestId
      const failed = await readRecord(
        input.objectPort,
        attemptPath(prefix, requestId, 'failed'),
      )
      if (failed) throw conflict('visual_intelligence_failed_attempt_cannot_complete')
      const report = await readReportByRef(
        input.objectPort,
        prefix,
        record.reportRef,
      )
      if (
        !report
        || report.provenance.requestDigestSha256
          !== intent.requestDigestSha256
        || report.provenance.cacheIdentitySha256
          !== intent.cacheIdentitySha256
      ) throw conflict('visual_intelligence_attempt_report_lineage_mismatch')
      const started = parseAttemptStarted(requireRecord(await readRecord(
        input.objectPort,
        attemptPath(prefix, requestId, 'provider-started'),
      )))
      if (refKey(started.attemptRef) !== refKey(record.attemptRef)) {
        throw conflict('visual_intelligence_started_attempt_mismatch')
      }
      const objectPath = attemptPath(prefix, requestId, 'completed')
      await persistRecord(input.objectPort, objectPath, record)
      const reread = parseAttemptCompletion(
        requireRecord(await readRecord(input.objectPort, objectPath)),
      )
      if (!same(record, reread)) {
        throw conflict('visual_intelligence_completion_reread_mismatch')
      }
      return { exactTerminalRereadVerified: true }
    },

    async readAcceptedByCacheIdentity(value) {
      const cacheIdentity = requireDigest(value.cacheIdentitySha256)
      const rawIndex = await readRecord(
        input.objectPort,
        cachePath(prefix, cacheIdentity),
      )
      if (!rawIndex) return null
      const index = parseCacheIndex(rawIndex)
      if (
        index.cacheIdentitySha256 !== cacheIdentity
        || !same(index.scope, value.scope)
      ) throw conflict('visual_intelligence_cache_scope_mismatch')
      return await readReportByRef(input.objectPort, prefix, index.reportRef)
    },

    readAcceptedByRef(reportRef) {
      return readReportByRef(input.objectPort, prefix, reportRef)
    },

    async persistImmutable(value) {
      const report = parseVisualIntelligenceReport(value.report)
      const cacheIdentitySha256 = requireDigest(value.cacheIdentitySha256)
      if (
        report.provenance.cacheIdentitySha256 !== cacheIdentitySha256
        || !validDigest(report.provenance.requestDigestSha256)
      ) throw conflict('visual_intelligence_report_cache_identity_mismatch')
      const reportRef = reportReference(report)
      const reportPath = pathFor(prefix, 'reports', report.reportId)
      await persistRecord(input.objectPort, reportPath, report)
      const reportReread = await readReportByRef(
        input.objectPort,
        prefix,
        reportRef,
      )
      if (!reportReread || !same(report, reportReread)) {
        throw conflict('visual_intelligence_report_reread_mismatch')
      }
      const index: CacheIndexRecord = {
        schemaVersion: 'visual-intelligence-cache-index-v1',
        cacheIdentitySha256,
        scope: report.scope,
        reportRef,
      }
      const indexPath = cachePath(prefix, cacheIdentitySha256)
      await persistRecord(input.objectPort, indexPath, index)
      const indexReread = parseCacheIndex(
        requireRecord(await readRecord(input.objectPort, indexPath)),
      )
      if (!same(index, indexReread)) {
        throw conflict('visual_intelligence_cache_index_reread_mismatch')
      }
      return {
        reportRef,
        createOnlyPersisted: true,
        exactRereadVerified: true,
      }
    },

    async readAcceptedSpatialEvidenceByReportRef(reportRef) {
      return readSpatialEvidenceByReportRef(input.objectPort, prefix, reportRef)
    },

    async persistSpatialEvidenceImmutable(value) {
      const reportRef = requireRef(value.reportRef)
      const report = await readReportByRef(input.objectPort, prefix, reportRef)
      if (!report) {
        throw conflict('visual_intelligence_spatial_report_missing')
      }
      const spatialEvidence = parseVisualIntelligenceSpatialEvidence(
        value.spatialEvidence,
      )
      if (
        refKey(spatialEvidence.reportRef) !== refKey(reportRef)
        || refKey(spatialEvidence.requestRef) !== refKey(report.requestRef)
        || !same(spatialEvidence.scope, report.scope)
        || spatialEvidence.operation !== report.operation
        || spatialEvidence.profile !== report.profile
      ) throw conflict('visual_intelligence_spatial_report_lineage_mismatch')
      assertSpatialEvidenceAgainstReport(spatialEvidence, report)
      const objectPath = spatialEvidencePath(prefix, reportRef)
      await persistRecord(input.objectPort, objectPath, spatialEvidence)
      const reread = await readSpatialEvidenceByReportRef(
        input.objectPort,
        prefix,
        reportRef,
      )
      if (!reread || !same(spatialEvidence, reread)) {
        throw conflict('visual_intelligence_spatial_evidence_reread_mismatch')
      }
      return {
        spatialEvidenceRef: spatialEvidenceReference(spatialEvidence),
        createOnlyPersisted: true,
        exactRereadVerified: true,
      }
    },
  }
  const store = Object.freeze(storeImplementation)
  admittedStores.add(store)
  return store
}

export function isVisualIntelligenceDurableLifecycleStore(
  value: unknown,
): value is VisualIntelligenceDurableLifecycleStore {
  return Boolean(value && typeof value === 'object'
    && admittedStores.has(value as object))
}

async function requireMatchingIntent(
  port: CanonicalCreateOnlyJsonObjectPort,
  prefix: string,
  attemptRef: VisualIntelligenceEvidenceRef,
): Promise<AttemptIntentRecord> {
  const ref = requireRef(attemptRef)
  if (!ref.id.startsWith('vi-attempt-')) {
    throw conflict('visual_intelligence_attempt_ref_invalid')
  }
  const refIntent = parseAttemptIntent(requireRecord(await readRecord(
    port,
    attemptReferencePath(prefix, ref),
  )))
  const requestId = refIntent.requestId
  const intent = parseAttemptIntent(requireRecord(await readRecord(
    port,
    attemptPath(prefix, requestId, 'intent'),
  )))
  const expectedRef = attemptReference(intent)
  if (refKey(expectedRef) !== refKey(attemptRef)) {
    throw conflict('visual_intelligence_attempt_ref_mismatch')
  }
  return intent
}

async function terminalExists(
  port: CanonicalCreateOnlyJsonObjectPort,
  prefix: string,
  requestId: string,
): Promise<boolean> {
  return Boolean(
    await readRecord(port, attemptPath(prefix, requestId, 'failed'))
    || await readRecord(port, attemptPath(prefix, requestId, 'completed')),
  )
}

async function readReportByRef(
  port: CanonicalCreateOnlyJsonObjectPort,
  prefix: string,
  untrustedRef: VisualIntelligenceEvidenceRef,
): Promise<VisualIntelligenceReport | null> {
  const reportRef = requireRef(untrustedRef)
  const raw = await readRecord(port, pathFor(prefix, 'reports', reportRef.id))
  if (!raw) return null
  const report = parseVisualIntelligenceReport(raw)
  if (refKey(reportReference(report)) !== refKey(reportRef)) {
    throw conflict('visual_intelligence_report_ref_mismatch')
  }
  return report
}

async function readSpatialEvidenceByReportRef(
  port: CanonicalCreateOnlyJsonObjectPort,
  prefix: string,
  untrustedReportRef: VisualIntelligenceEvidenceRef,
): Promise<VisualIntelligenceSpatialEvidence | null> {
  const reportRef = requireRef(untrustedReportRef)
  const raw = await readRecord(port, spatialEvidencePath(prefix, reportRef))
  if (!raw) return null
  const evidence = parseVisualIntelligenceSpatialEvidence(raw)
  if (refKey(evidence.reportRef) !== refKey(reportRef)) {
    throw conflict('visual_intelligence_spatial_report_ref_mismatch')
  }
  const report = await readReportByRef(port, prefix, reportRef)
  if (!report) throw conflict('visual_intelligence_spatial_report_missing')
  assertSpatialEvidenceAgainstReport(evidence, report)
  return evidence
}

function assertSpatialEvidenceAgainstReport(
  evidence: VisualIntelligenceSpatialEvidence,
  report: VisualIntelligenceReport,
): void {
  const expectedArtifacts = [
    ...report.sourceArtifacts,
    ...report.comparisonArtifacts,
  ]
  const actualArtifacts = [
    ...evidence.sourceArtifacts,
    ...evidence.comparisonArtifacts,
  ]
  const reportEvidence = new Set(report.evidence.map((item) =>
    refKey(item.evidenceRef)))
  const reportFindingIds = new Set(report.findings.map((item) => item.findingId))
  if (
    expectedArtifacts.length !== actualArtifacts.length
    || expectedArtifacts.some((expected, index) => {
      const actual = actualArtifacts[index]
      return !actual
        || actual.artifactId !== expected.artifactId
        || actual.checksumSha256 !== expected.checksumSha256
        || actual.durationFrames !== expected.durationFrames
    })
    || (visualIntelligenceProfileRequiresSpatialEvidence(
      report.operation,
      report.profile,
    ) && (
      evidence.outputFrame === null
      || evidence.observations.length === 0
    ))
    || evidence.observations.some((observation) => {
      const artifact = actualArtifacts.find((candidate) =>
        candidate.artifactId === observation.artifactId)
      return !artifact
        || observation.range.endFrameExclusive > artifact.durationFrames
        || observation.range.frameRate.numerator
          !== artifact.frameRate.numerator
        || observation.range.frameRate.denominator
          !== artifact.frameRate.denominator
        || !report.coverage.requestedRanges.some((range) =>
          containsRange(range, observation.range))
        || observation.evidenceRefs.some((reference) =>
          !reportEvidence.has(refKey(reference)))
        || observation.findingIds.some((findingId) =>
          !reportFindingIds.has(findingId))
    })
  ) throw conflict('visual_intelligence_spatial_report_evidence_mismatch')
}

function containsRange(
  outer: VisualIntelligenceRequest['requestedRanges'][number],
  inner: VisualIntelligenceRequest['requestedRanges'][number],
): boolean {
  return outer.frameRate.numerator === inner.frameRate.numerator
    && outer.frameRate.denominator === inner.frameRate.denominator
    && outer.startFrame <= inner.startFrame
    && outer.endFrameExclusive >= inner.endFrameExclusive
}

function parseAttemptIntent(value: unknown): AttemptIntentRecord {
  const record = exactRecord(value, [
    'schemaVersion', 'requestId', 'idempotencyKey',
    'requestDigestSha256', 'cacheIdentitySha256',
  ])
  if (
    record.schemaVersion !== 'visual-intelligence-attempt-intent-v1'
    || !safeId(record.requestId)
    || !safeId(record.idempotencyKey)
    || !validDigest(record.requestDigestSha256)
    || !validDigest(record.cacheIdentitySha256)
  ) throw conflict('visual_intelligence_attempt_intent_invalid')
  return record as unknown as AttemptIntentRecord
}

function parseAttemptStarted(value: unknown): AttemptStartedRecord {
  const record = exactRecord(value, [
    'schemaVersion', 'attemptRef', 'dispatchConfigurationDigestSha256',
    'maximumAttempts', 'attemptOrdinal',
    'uncertainProviderOutcomeRetryAllowed',
  ])
  if (
    record.schemaVersion !== 'visual-intelligence-attempt-provider-start-v1'
    || !validDigest(record.dispatchConfigurationDigestSha256)
    || record.maximumAttempts !== 1
    || record.attemptOrdinal !== 1
    || record.uncertainProviderOutcomeRetryAllowed !== false
  ) throw conflict('visual_intelligence_attempt_start_invalid')
  return { ...record, attemptRef: requireRef(record.attemptRef) } as AttemptStartedRecord
}

function parseAttemptFailure(value: unknown): AttemptFailureRecord {
  const record = exactRecord(value, [
    'schemaVersion', 'attemptRef', 'outcome', 'blockerCode',
    'automaticRetryAllowed',
  ])
  if (
    record.schemaVersion !== 'visual-intelligence-attempt-failure-v1'
    || (
      record.outcome !== 'not_executed'
      && record.outcome !== 'unknown'
      && record.outcome !== 'executed_rejected'
    )
    || !safeId(record.blockerCode)
    || record.automaticRetryAllowed !== false
  ) throw conflict('visual_intelligence_attempt_failure_invalid')
  return { ...record, attemptRef: requireRef(record.attemptRef) } as AttemptFailureRecord
}

function parseAttemptCompletion(value: unknown): AttemptCompletionRecord {
  const record = exactRecord(value, [
    'schemaVersion', 'attemptRef', 'reportRef', 'providerCallOutcome',
    'accountEffectiveCostSettled',
  ])
  if (
    record.schemaVersion !== 'visual-intelligence-attempt-completion-v1'
    || record.providerCallOutcome !== 'executed'
    || record.accountEffectiveCostSettled !== true
  ) throw conflict('visual_intelligence_attempt_completion_invalid')
  return {
    ...record,
    attemptRef: requireRef(record.attemptRef),
    reportRef: requireRef(record.reportRef),
  } as AttemptCompletionRecord
}

function parseCacheIndex(value: unknown): CacheIndexRecord {
  const record = exactRecord(value, [
    'schemaVersion', 'cacheIdentitySha256', 'scope', 'reportRef',
  ])
  if (
    record.schemaVersion !== 'visual-intelligence-cache-index-v1'
    || !validDigest(record.cacheIdentitySha256)
  ) throw conflict('visual_intelligence_cache_index_invalid')
  return {
    ...record,
    scope: parseScope(record.scope),
    reportRef: requireRef(record.reportRef),
  } as CacheIndexRecord
}

function parseScope(value: unknown): VisualIntelligenceRequest['scope'] {
  const record = exactRecord(value, [
    'ownerUserId', 'workspaceId', 'projectId', 'editSessionId',
    'approvedSnapshotId',
  ])
  if (
    !safeId(record.ownerUserId)
    || !safeId(record.workspaceId)
    || !safeId(record.projectId)
    || !safeId(record.editSessionId)
    || (record.approvedSnapshotId !== null
      && !safeId(record.approvedSnapshotId))
  ) throw conflict('visual_intelligence_cache_scope_invalid')
  return record as unknown as VisualIntelligenceRequest['scope']
}

async function persistRecord(
  port: CanonicalCreateOnlyJsonObjectPort,
  objectPath: string,
  value: unknown,
): Promise<'created' | 'already_exists'> {
  const body = Buffer.from(visualIntelligenceCanonicalJson(value), 'utf8')
  if (body.byteLength < 2 || body.byteLength > MAX_RECORD_BYTES) {
    throw conflict('visual_intelligence_record_size_invalid')
  }
  return port.createOnly({
    objectPath,
    body,
    contentSha256: rawSha256(body),
  })
}

async function readRecord(
  port: CanonicalCreateOnlyJsonObjectPort,
  objectPath: string,
): Promise<unknown | null> {
  const body = await port.readExact(objectPath)
  if (!body) return null
  if (body.byteLength < 2 || body.byteLength > MAX_RECORD_BYTES) {
    throw conflict('visual_intelligence_record_size_invalid')
  }
  try {
    return JSON.parse(body.toString('utf8')) as unknown
  } catch {
    throw conflict('visual_intelligence_record_json_invalid')
  }
}

function reportReference(report: VisualIntelligenceReport) {
  return Object.freeze({
    id: report.reportId,
    version: 1,
    contentHash: report.reportDigestSha256,
  })
}

function spatialEvidenceReference(evidence: VisualIntelligenceSpatialEvidence) {
  return Object.freeze({
    id: evidence.spatialEvidenceId,
    version: 1,
    contentHash: evidence.spatialEvidenceDigestSha256,
  })
}

function attemptReference(
  intent: AttemptIntentRecord,
): VisualIntelligenceEvidenceRef {
  const contentRef = createVisualIntelligenceEvidenceRef('digest', intent)
  return Object.freeze({
    id: `vi-attempt-${contentRef.contentHash.slice('sha256:'.length)}`,
    version: 1,
    contentHash: contentRef.contentHash,
  })
}

function attemptReferencePath(
  prefix: string,
  attemptRef: VisualIntelligenceEvidenceRef,
): string {
  const ref = requireRef(attemptRef)
  return `${prefix}/attempt-refs/${requireSafeId(ref.id)}/intent.json`
}

function attemptPath(prefix: string, requestId: string, leaf: string): string {
  return `${prefix}/attempts/${requireSafeId(requestId)}/${leaf}.json`
}

function cachePath(prefix: string, digest: string): string {
  return `${prefix}/cache/${requireDigest(digest).slice('sha256:'.length)}.json`
}

function spatialEvidencePath(
  prefix: string,
  reportRef: VisualIntelligenceEvidenceRef,
): string {
  const ref = requireRef(reportRef)
  return `${prefix}/spatial-evidence-by-report/${requireSafeId(ref.id)}.json`
}

function pathFor(prefix: string, family: string, id: string): string {
  return `${prefix}/${family}/${requireSafeId(id)}.json`
}

function normalizePrefix(value: string): string {
  const normalized = value.trim().replace(/^\/+|\/+$/gu, '')
  if (
    !normalized
    || normalized.length > 400
    || normalized.includes('..')
    || normalized.includes('\\')
    || normalized.split('/').some((part) => !safeId(part))
  ) throw notReady('visual_intelligence_store_prefix_invalid')
  return normalized
}

function requireRef(value: unknown): VisualIntelligenceEvidenceRef {
  const record = exactRecord(value, ['id', 'version', 'contentHash'])
  if (
    !safeId(record.id)
    || !Number.isSafeInteger(record.version)
    || Number(record.version) < 1
    || !validDigest(record.contentHash)
  ) throw conflict('visual_intelligence_evidence_ref_invalid')
  return {
    id: String(record.id),
    version: Number(record.version),
    contentHash: String(record.contentHash),
  }
}

function exactRecord(
  value: unknown,
  keys: readonly string[],
): Record<string, unknown> {
  if (!isPlainRecord(value)) {
    throw conflict('visual_intelligence_record_invalid')
  }
  const actual = Reflect.ownKeys(value)
  if (
    actual.some((key) => typeof key !== 'string')
    || actual.length !== keys.length
    || keys.some((key) => !Object.hasOwn(value, key))
  ) throw conflict('visual_intelligence_record_shape_invalid')
  return value
}

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false
  const prototype = Object.getPrototypeOf(value)
  return prototype === Object.prototype || prototype === null
}

function requireRecord(value: unknown): Record<string, unknown> {
  if (!isPlainRecord(value)) throw conflict('visual_intelligence_record_missing')
  return value
}

function requireSafeId(value: unknown): string {
  if (!safeId(value)) throw conflict('visual_intelligence_identity_invalid')
  return value
}

function requireDigest(value: unknown): string {
  if (!validDigest(value)) throw conflict('visual_intelligence_digest_invalid')
  return value
}

function safeId(value: unknown): value is string {
  return typeof value === 'string'
    && SAFE_ID.test(value)
    && !value.includes('..')
}

function validDigest(value: unknown): value is string {
  return typeof value === 'string' && PREFIXED_SHA256.test(value)
}

function refKey(value: VisualIntelligenceEvidenceRef): string {
  return `${value.id}:${value.version}:${value.contentHash}`
}

function same(left: unknown, right: unknown): boolean {
  return visualIntelligenceCanonicalJson(left)
    === visualIntelligenceCanonicalJson(right)
}

function rawSha256(value: Buffer): string {
  return createHash('sha256').update(value).digest('hex')
}

function notReady(requiredGate: string): ApiError {
  return new ApiError(
    'TOOL_NOT_READY',
    'The durable Visual Intelligence lifecycle store is not ready.',
    503,
    { requiredGate },
  )
}

function conflict(requiredGate: string): ApiError {
  return new ApiError(
    'IDEMPOTENCY_CONFLICT',
    'The durable Visual Intelligence lifecycle store rejected conflicting evidence.',
    409,
    { requiredGate },
  )
}
