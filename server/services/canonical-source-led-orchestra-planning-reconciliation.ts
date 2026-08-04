import { createHash } from 'node:crypto'

import { ApiError } from '../errors/api-error'
import {
  createCanonicalSourceLedProfessionalContentAnalysisRequestIdentity,
} from './canonical-source-visual-intelligence-analysis-contract'
import type {
  CanonicalSourceCleanupAuthorityReadPort,
  CanonicalSourceCleanupAuthorityReadResult,
  CanonicalSourceCleanupAuthorityScope,
} from './canonical-source-cleanup-authority-repository'
import {
  CANONICAL_SOURCE_LED_ORCHESTRA_RECONCILIATION_VERSION,
  type CanonicalSourceLedOrchestraReconciliationPort,
} from './canonical-source-led-orchestra-content-analysis-reconciliation'
import type {
  CanonicalSourceLedProfessionalContentAnalysisInput,
} from './canonical-source-led-professional-content-analysis-port'

export const CANONICAL_SOURCE_ANALYSIS_REQUEST_AUTHORITY_READ_PORT_VERSION =
  'canonical-source-analysis-request-authority-read-port-v1' as const
export const CANONICAL_SOURCE_LED_ORCHESTRA_PLANNING_RECONCILIATION_VERSION =
  'canonical-source-led-orchestra-planning-reconciliation-v1' as const

const SAFE_ID = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,239}$/u
const RAW_SHA256 = /^[a-f0-9]{64}$/u

export interface CanonicalSourceAnalysisPlanningSourceIdentity {
  readonly sourceSequenceItemId: string
  readonly mediaAssetId: string
  readonly uploadedOrder: number
  readonly storageProvider: 'google_cloud_storage'
  readonly storageBucket: string
  readonly storagePath: string
  readonly contentType: 'video/mp4'
  readonly checksumSha256: string
  readonly byteLength: number
  readonly storageGeneration: string
  readonly storageEtag: string
}

/**
 * Exact authenticated planning scope available before the Head/Orchestra
 * source-analysis request is reread. Frame count, timebase, audio streams, and
 * evidence refs are deliberately absent: only the canonical preparation owner
 * may supply those values.
 */
export interface CanonicalSourceAnalysisPlanningScope {
  readonly ownerUserId: string
  readonly workspaceId: string
  readonly projectId: string
  readonly editSessionId: string
  readonly planningDirection: string
  readonly planningDirectionDigestSha256: string
  readonly userInstructionDigestSha256: string
  readonly sources: readonly CanonicalSourceAnalysisPlanningSourceIdentity[]
}

/**
 * Read-only Orchestra preparation boundary. It cannot dispatch a transcript,
 * GPU, or provider job. A missing record means preparation is still pending.
 */
export interface CanonicalSourceAnalysisRequestAuthorityReadPort {
  readonly schemaVersion:
    typeof CANONICAL_SOURCE_ANALYSIS_REQUEST_AUTHORITY_READ_PORT_VERSION
  readExactPreparedRequest(
    scope: CanonicalSourceAnalysisPlanningScope,
  ): Promise<CanonicalSourceLedProfessionalContentAnalysisInput | null>
}

export type CanonicalSourceLedOrchestraPlanningReconciliationResult =
  | Readonly<{
      status: 'not_ready'
      blockerCode: 'canonical_source_analysis_request_not_ready'
      preparedRequestReread: false
      cleanupAuthorityPersisted: false
      directProviderDispatchAllowed: false
      directGpuDispatchAllowed: false
      browserSourceAuthorityAccepted: false
    }>
  | Readonly<{
      status: 'ready'
      analysisRunId: string
      requestDigestSha256: string
      evidenceDigestSha256: string
      preparedRequestReread: true
      cleanupAuthorityPersisted: true
      completedTranscriptRereadRequired: true
      completedVisualIntelligenceRereadRequired: true
      visualIntelligenceResultReturnedThroughOrchestra: true
      directProviderDispatchAllowed: false
      directGpuDispatchAllowed: false
      browserSourceAuthorityAccepted: false
    }>

export interface CanonicalSourceLedOrchestraPlanningReconciliationPort {
  readonly schemaVersion:
    typeof CANONICAL_SOURCE_LED_ORCHESTRA_PLANNING_RECONCILIATION_VERSION
  readonly preparedRequestRereadRequired: true
  readonly completedTranscriptRereadRequired: true
  readonly completedVisualIntelligenceRereadRequired: true
  readonly visualIntelligenceResultMustReturnThroughOrchestra: true
  readonly headDirectProviderDispatchAllowed: false
  readonly headDirectGpuDispatchAllowed: false
  reconcileForPlanning(
    scope: CanonicalSourceAnalysisPlanningScope,
  ): Promise<CanonicalSourceLedOrchestraPlanningReconciliationResult>
}

/**
 * Joins an immutable prepared request to the completed-evidence reconciler.
 * The returned result is only a coordination receipt; planning must reread the
 * cleanup repository before it can consume any decision.
 */
export function createCanonicalSourceLedOrchestraPlanningReconciliationPort(
  input: {
    readonly requestAuthorityReadPort:
      CanonicalSourceAnalysisRequestAuthorityReadPort
    readonly reconciliationPort: CanonicalSourceLedOrchestraReconciliationPort
  },
): CanonicalSourceLedOrchestraPlanningReconciliationPort {
  if (
    input.requestAuthorityReadPort?.schemaVersion !==
      CANONICAL_SOURCE_ANALYSIS_REQUEST_AUTHORITY_READ_PORT_VERSION
    || typeof input.requestAuthorityReadPort.readExactPreparedRequest !==
      'function'
    || input.reconciliationPort?.schemaVersion !==
      CANONICAL_SOURCE_LED_ORCHESTRA_RECONCILIATION_VERSION
    || typeof input.reconciliationPort.analyze !== 'function'
    || !input.reconciliationPort.completedTranscriptRereadRequired
    || !input.reconciliationPort.completedVisualIntelligenceRereadRequired
    || !input.reconciliationPort
      .visualIntelligenceResultMustReturnThroughOrchestra
    || input.reconciliationPort.headDirectProviderDispatchAllowed
    || input.reconciliationPort.headDirectGpuDispatchAllowed
  ) throw notReady('source_planning_reconciliation_dependencies_invalid')

  return Object.freeze({
    schemaVersion:
      CANONICAL_SOURCE_LED_ORCHESTRA_PLANNING_RECONCILIATION_VERSION,
    preparedRequestRereadRequired: true as const,
    completedTranscriptRereadRequired: true as const,
    completedVisualIntelligenceRereadRequired: true as const,
    visualIntelligenceResultMustReturnThroughOrchestra: true as const,
    headDirectProviderDispatchAllowed: false as const,
    headDirectGpuDispatchAllowed: false as const,
    async reconcileForPlanning(
      untrustedScope: CanonicalSourceAnalysisPlanningScope,
    ) {
      const scope = parsePlanningScope(untrustedScope)
      const prepared = await input.requestAuthorityReadPort
        .readExactPreparedRequest(scope)
      if (!prepared) return Object.freeze({
        status: 'not_ready' as const,
        blockerCode:
          'canonical_source_analysis_request_not_ready' as const,
        preparedRequestReread: false as const,
        cleanupAuthorityPersisted: false as const,
        directProviderDispatchAllowed: false as const,
        directGpuDispatchAllowed: false as const,
        browserSourceAuthorityAccepted: false as const,
      })
      const identity =
        createCanonicalSourceLedProfessionalContentAnalysisRequestIdentity(
          prepared,
        )
      assertPreparedRequestMatchesPlanningScope(identity.request, scope)
      const evidence = await input.reconciliationPort.analyze(
        identity.request,
      )
      if (
        evidence.identity.analysisRunId !== identity.analysisRunId
        || evidence.identity.workspaceId !== scope.workspaceId
        || evidence.identity.projectId !== scope.projectId
        || evidence.identity.editSessionId !== scope.editSessionId
        || evidence.identity.userInstructionDigestSha256 !==
          scope.userInstructionDigestSha256
        || !RAW_SHA256.test(evidence.evidenceDigestSha256)
      ) throw conflict('source_planning_reconciliation_evidence_mismatch')
      return Object.freeze({
        status: 'ready' as const,
        analysisRunId: identity.analysisRunId,
        requestDigestSha256: identity.requestDigest,
        evidenceDigestSha256: evidence.evidenceDigestSha256,
        preparedRequestReread: true as const,
        cleanupAuthorityPersisted: true as const,
        completedTranscriptRereadRequired: true as const,
        completedVisualIntelligenceRereadRequired: true as const,
        visualIntelligenceResultReturnedThroughOrchestra: true as const,
        directProviderDispatchAllowed: false as const,
        directGpuDispatchAllowed: false as const,
        browserSourceAuthorityAccepted: false as const,
      })
    },
  })
}

/**
 * Planning integration point. Existing authority is always preferred. When it
 * is absent, only the exact prepared-request/Orchestra reconciliation port may
 * populate it, and the repository is then reread before planning continues.
 */
export async function readOrReconcileCanonicalSourceCleanupAuthority(input: {
  readonly readPort: CanonicalSourceCleanupAuthorityReadPort
  readonly reconciliationPort?:
    CanonicalSourceLedOrchestraPlanningReconciliationPort
  readonly cleanupScope: CanonicalSourceCleanupAuthorityScope
  readonly planningScope: CanonicalSourceAnalysisPlanningScope
}): Promise<CanonicalSourceCleanupAuthorityReadResult> {
  const cleanupScope = parseCleanupScope(input.cleanupScope)
  const planningScope = parsePlanningScope(input.planningScope)
  assertCleanupAndPlanningScopesMatch(cleanupScope, planningScope)
  const existing = await input.readPort.readForPlanning(cleanupScope)
  if (existing.status === 'ready' || !input.reconciliationPort) return existing
  assertPlanningReconciliationPort(input.reconciliationPort)
  const reconciliation = await input.reconciliationPort
    .reconcileForPlanning(planningScope)
  if (reconciliation.status === 'not_ready') return existing
  const reread = await input.readPort.readForPlanning(cleanupScope)
  if (reread.status !== 'ready') {
    throw conflict('source_planning_reconciliation_not_persisted')
  }
  return reread
}

function assertPreparedRequestMatchesPlanningScope(
  request: CanonicalSourceLedProfessionalContentAnalysisInput,
  scope: CanonicalSourceAnalysisPlanningScope,
): void {
  if (
    request.workspaceId !== scope.workspaceId
    || request.projectId !== scope.projectId
    || request.editSessionId !== scope.editSessionId
    || request.planningDirection !== scope.planningDirection
    || request.planningDirectionDigestSha256 !==
      scope.planningDirectionDigestSha256
    || request.userInstructionDigestSha256 !==
      scope.userInstructionDigestSha256
    || request.sources.length !== scope.sources.length
  ) throw conflict('source_prepared_request_planning_scope_mismatch')
  request.sources.forEach((source, index) => {
    const expected = scope.sources[index]!
    const authority = source.managedApiAuthority!
    if (
      source.sourceSequenceItemId !== expected.sourceSequenceItemId
      || source.mediaAssetId !== expected.mediaAssetId
      || source.uploadedOrder !== expected.uploadedOrder
      || source.storageProvider !== expected.storageProvider
      || source.storageBucket !== expected.storageBucket
      || source.storagePath !== expected.storagePath
      || source.checksumSha256 !== expected.checksumSha256
      || source.byteLength !== expected.byteLength
      || authority.ownerUserId !== scope.ownerUserId
      || authority.storageBucket !== expected.storageBucket
      || authority.storagePath !== expected.storagePath
      || authority.contentType !== expected.contentType
      || authority.storageGeneration !== expected.storageGeneration
      || authority.storageEtag !== expected.storageEtag
    ) throw conflict(`source_prepared_request_source_${index + 1}_mismatch`)
  })
}

function assertCleanupAndPlanningScopesMatch(
  cleanup: CanonicalSourceCleanupAuthorityScope,
  planning: CanonicalSourceAnalysisPlanningScope,
): void {
  if (
    cleanup.ownerUserId !== planning.ownerUserId
    || cleanup.workspaceId !== planning.workspaceId
    || cleanup.projectId !== planning.projectId
    || cleanup.editSessionId !== planning.editSessionId
    || cleanup.planningDirectionDigestSha256 !==
      planning.planningDirectionDigestSha256
    || cleanup.userInstructionDigestSha256 !==
      planning.userInstructionDigestSha256
    || cleanup.sources.length !== planning.sources.length
    || cleanup.sources.some((source, index) => {
      const planned = planning.sources[index]!
      return source.sourceSequenceItemId !== planned.sourceSequenceItemId
        || source.mediaAssetId !== planned.mediaAssetId
        || source.uploadedOrder !== planned.uploadedOrder
        || source.checksumSha256 !== planned.checksumSha256
    })
  ) throw conflict('source_cleanup_and_planning_scope_mismatch')
}

function parsePlanningScope(
  untrusted: unknown,
): CanonicalSourceAnalysisPlanningScope {
  const record = exactRecord(untrusted, [
    'ownerUserId',
    'workspaceId',
    'projectId',
    'editSessionId',
    'planningDirection',
    'planningDirectionDigestSha256',
    'userInstructionDigestSha256',
    'sources',
  ])
  const planningDirection = text(record.planningDirection, 1, 8_000)
  const scope = {
    ownerUserId: safeId(record.ownerUserId),
    workspaceId: safeId(record.workspaceId),
    projectId: safeId(record.projectId),
    editSessionId: safeId(record.editSessionId),
    planningDirection,
    planningDirectionDigestSha256: rawSha(record.planningDirectionDigestSha256),
    userInstructionDigestSha256: rawSha(record.userInstructionDigestSha256),
    sources: parsePlanningSources(record.sources),
  }
  if (
    rawDigestText(planningDirection) !==
      scope.planningDirectionDigestSha256
  ) throw conflict('source_planning_direction_digest_mismatch')
  return Object.freeze({
    ...scope,
    sources: Object.freeze(scope.sources),
  })
}

function parsePlanningSources(
  untrusted: unknown,
): readonly CanonicalSourceAnalysisPlanningSourceIdentity[] {
  if (!Array.isArray(untrusted) || untrusted.length < 1 || untrusted.length > 8) {
    throw conflict('source_planning_sources_invalid')
  }
  const sourceIds = new Set<string>()
  const mediaIds = new Set<string>()
  return untrusted.map((value, index) => {
    const source = exactRecord(value, [
      'sourceSequenceItemId',
      'mediaAssetId',
      'uploadedOrder',
      'storageProvider',
      'storageBucket',
      'storagePath',
      'contentType',
      'checksumSha256',
      'byteLength',
      'storageGeneration',
      'storageEtag',
    ])
    const sourceSequenceItemId = safeId(source.sourceSequenceItemId)
    const mediaAssetId = safeId(source.mediaAssetId)
    if (
      source.uploadedOrder !== index + 1
      || source.storageProvider !== 'google_cloud_storage'
      || source.contentType !== 'video/mp4'
      || sourceIds.has(sourceSequenceItemId)
      || mediaIds.has(mediaAssetId)
    ) throw conflict(`source_planning_source_${index + 1}_invalid`)
    sourceIds.add(sourceSequenceItemId)
    mediaIds.add(mediaAssetId)
    return Object.freeze({
      sourceSequenceItemId,
      mediaAssetId,
      uploadedOrder: index + 1,
      storageProvider: 'google_cloud_storage' as const,
      storageBucket: storageBucket(source.storageBucket),
      storagePath: storagePath(source.storagePath),
      contentType: 'video/mp4' as const,
      checksumSha256: rawSha(source.checksumSha256),
      byteLength: positiveInteger(source.byteLength),
      storageGeneration: generation(source.storageGeneration),
      storageEtag: text(source.storageEtag, 1, 1_024),
    })
  })
}

function parseCleanupScope(
  untrusted: unknown,
): CanonicalSourceCleanupAuthorityScope {
  const record = exactRecord(untrusted, [
    'ownerUserId',
    'workspaceId',
    'projectId',
    'editSessionId',
    'planningDirectionDigestSha256',
    'userInstructionDigestSha256',
    'sources',
  ])
  if (!Array.isArray(record.sources) || record.sources.length < 1
    || record.sources.length > 8) {
    throw conflict('source_cleanup_scope_sources_invalid')
  }
  const sources = record.sources.map((value, index) => {
    const source = exactRecord(value, [
      'sourceSequenceItemId',
      'mediaAssetId',
      'uploadedOrder',
      'checksumSha256',
    ])
    if (source.uploadedOrder !== index + 1) {
      throw conflict(`source_cleanup_scope_source_${index + 1}_invalid`)
    }
    return {
      sourceSequenceItemId: safeId(source.sourceSequenceItemId),
      mediaAssetId: safeId(source.mediaAssetId),
      uploadedOrder: index + 1,
      checksumSha256: rawSha(source.checksumSha256),
    }
  })
  return {
    ownerUserId: safeId(record.ownerUserId),
    workspaceId: safeId(record.workspaceId),
    projectId: safeId(record.projectId),
    editSessionId: safeId(record.editSessionId),
    planningDirectionDigestSha256: rawSha(
      record.planningDirectionDigestSha256,
    ),
    userInstructionDigestSha256: rawSha(
      record.userInstructionDigestSha256,
    ),
    sources,
  }
}

function assertPlanningReconciliationPort(
  port: CanonicalSourceLedOrchestraPlanningReconciliationPort,
): void {
  if (
    port.schemaVersion !==
      CANONICAL_SOURCE_LED_ORCHESTRA_PLANNING_RECONCILIATION_VERSION
    || typeof port.reconcileForPlanning !== 'function'
    || !port.preparedRequestRereadRequired
    || !port.completedTranscriptRereadRequired
    || !port.completedVisualIntelligenceRereadRequired
    || !port.visualIntelligenceResultMustReturnThroughOrchestra
    || port.headDirectProviderDispatchAllowed
    || port.headDirectGpuDispatchAllowed
  ) throw notReady('source_planning_reconciliation_port_invalid')
}

function exactRecord(
  value: unknown,
  keys: readonly string[],
): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw conflict('source_planning_record_invalid')
  }
  let prototype: object | null
  let actualKeys: readonly (string | symbol)[]
  let descriptors: PropertyDescriptorMap
  try {
    prototype = Object.getPrototypeOf(value)
    actualKeys = Reflect.ownKeys(value)
    descriptors = Object.getOwnPropertyDescriptors(value)
  } catch {
    throw conflict('source_planning_record_invalid')
  }
  if (
    (prototype !== Object.prototype && prototype !== null)
    || actualKeys.some((key) => typeof key !== 'string')
    || actualKeys.length !== keys.length
    || keys.some((key) => !Object.hasOwn(value, key))
    || Object.values(descriptors).some((descriptor) =>
      'get' in descriptor || 'set' in descriptor)
  ) throw conflict('source_planning_record_invalid')
  return value as Record<string, unknown>
}

function safeId(value: unknown): string {
  if (typeof value !== 'string' || !SAFE_ID.test(value)
    || value.includes('..')) throw conflict('source_planning_identity_invalid')
  return value
}

function rawSha(value: unknown): string {
  if (typeof value !== 'string' || !RAW_SHA256.test(value)) {
    throw conflict('source_planning_digest_invalid')
  }
  return value
}

function positiveInteger(value: unknown): number {
  if (!Number.isSafeInteger(value) || Number(value) < 1) {
    throw conflict('source_planning_positive_integer_invalid')
  }
  return Number(value)
}

function text(value: unknown, minimum: number, maximum: number): string {
  if (typeof value !== 'string' || value !== value.trim()
    || value.length < minimum || value.length > maximum
    || /[\0\r]/u.test(value)) throw conflict('source_planning_text_invalid')
  return value
}

function storageBucket(value: unknown): string {
  const result = text(value, 3, 222)
  if (!/^[a-z0-9][a-z0-9._-]*[a-z0-9]$/u.test(result)
    || result.includes('..')) throw conflict('source_planning_bucket_invalid')
  return result
}

function storagePath(value: unknown): string {
  const result = text(value, 1, 2_048)
  if (
    result.startsWith('/')
    || result.includes('\\')
    || /^[A-Za-z][A-Za-z0-9+.-]*:/u.test(result)
    || result.split('/').some((segment) =>
      !segment || segment === '.' || segment === '..')
  ) throw conflict('source_planning_storage_path_invalid')
  return result
}

function generation(value: unknown): string {
  const result = text(value, 1, 31)
  if (!/^[1-9][0-9]{0,30}$/u.test(result)) {
    throw conflict('source_planning_generation_invalid')
  }
  return result
}

function rawDigestText(value: string): string {
  return createHash('sha256').update(value, 'utf8').digest('hex')
}

function conflict(reason: string): ApiError {
  return new ApiError(
    'IDEMPOTENCY_CONFLICT',
    'Canonical source-analysis planning authority is stale or inconsistent.',
    409,
    { reason },
  )
}

function notReady(reason: string): ApiError {
  return new ApiError(
    'TOOL_NOT_READY',
    'Canonical Head/Orchestra source-analysis reconciliation is not ready.',
    503,
    { reason },
  )
}
