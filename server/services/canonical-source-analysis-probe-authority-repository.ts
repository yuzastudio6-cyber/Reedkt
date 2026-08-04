import { createHash } from 'node:crypto'

import type { VisualIntelligenceEvidenceRef } from
  '../../src/types/visual-intelligence'
import { ApiError } from '../errors/api-error'
import type {
  CanonicalCreateOnlyJsonObjectPort,
} from './canonical-gcs-source-analysis-lifecycle-store'
import {
  CANONICAL_SOURCE_ANALYSIS_PROBE_AUTHORITY_READ_PORT_VERSION,
  verifyCanonicalSourceAnalysisProbeAuthority,
  type CanonicalSourceAnalysisProbeAuthority,
  type CanonicalSourceAnalysisProbeAuthorityReadPort,
  type CanonicalSourceAnalysisProbeAuthorityScope,
} from './canonical-source-analysis-preparation-owner'

export const CANONICAL_SOURCE_ANALYSIS_PROBE_AUTHORITY_REPOSITORY_VERSION =
  'canonical-source-analysis-probe-authority-repository-v1' as const

const DEFAULT_PREFIX = 'private/orchestra/v1/source-analysis-probes'
const MAXIMUM_RECORD_BYTES = 2 * 1024 * 1024
const SAFE_ID = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,239}$/u
const RAW_SHA256 = /^[a-f0-9]{64}$/u
const PREFIXED_SHA256 = /^sha256:[a-f0-9]{64}$/u

export interface CanonicalSourceAnalysisProbeAuthorityRepository
  extends CanonicalSourceAnalysisProbeAuthorityReadPort {
  readonly repositoryVersion:
    typeof CANONICAL_SOURCE_ANALYSIS_PROBE_AUTHORITY_REPOSITORY_VERSION
  persistCreateOnly(input: Readonly<{
    scope: CanonicalSourceAnalysisProbeAuthorityScope
    authority: CanonicalSourceAnalysisProbeAuthority
  }>): Promise<Readonly<{
    disposition: 'created' | 'identical_replay'
    repositoryRecordRef: VisualIntelligenceEvidenceRef
    sourceProbeAuthorityRef: VisualIntelligenceEvidenceRef
    exactCreateOnlyRereadVerified: true
    gpuJobStarted: false
    providerCalled: false
    customerCreditMutated: false
    publicDeliveryGranted: false
    productionAuthorityGranted: false
  }>>
}

interface StoredProbeRecord {
  readonly schemaVersion:
    typeof CANONICAL_SOURCE_ANALYSIS_PROBE_AUTHORITY_REPOSITORY_VERSION
  readonly scope: CanonicalSourceAnalysisProbeAuthorityScope
  readonly probe: CanonicalSourceAnalysisProbeAuthority
  readonly repositoryBoundary: ReturnType<typeof closedBoundary>
  readonly recordDigestSha256: string
}

/**
 * Create-only private persistence for a completed source-timing probe. The
 * separate L4 attempt owner is the only producer; this repository cannot start
 * a GPU, run FFprobe, read media, settle credits, or manufacture probe values.
 */
export function createCanonicalSourceAnalysisProbeAuthorityRepository(input: {
  readonly objectPort: CanonicalCreateOnlyJsonObjectPort
  readonly prefix?: string
}): CanonicalSourceAnalysisProbeAuthorityRepository {
  if (
    typeof input.objectPort?.createOnly !== 'function'
    || typeof input.objectPort?.readExact !== 'function'
  ) throw notReady('source_analysis_probe_repository_object_port_invalid')
  const prefix = normalizePrefix(input.prefix ?? DEFAULT_PREFIX)

  const readRecord = async (
    untrustedScope: CanonicalSourceAnalysisProbeAuthorityScope,
  ): Promise<StoredProbeRecord | null> => {
    const scope = parseScope(untrustedScope)
    const bytes = await input.objectPort.readExact(objectPath(prefix, scope))
    if (!bytes) return null
    if (
      !Buffer.isBuffer(bytes)
      || bytes.byteLength < 2
      || bytes.byteLength > MAXIMUM_RECORD_BYTES
    ) throw conflict('source_analysis_probe_record_bytes_invalid')
    let untrusted: unknown
    try {
      untrusted = JSON.parse(bytes.toString('utf8'))
    } catch {
      throw conflict('source_analysis_probe_record_json_invalid')
    }
    const record = parseRecord(untrusted, scope)
    if (bytes.toString('utf8') !== stableStringify(record)) {
      throw conflict('source_analysis_probe_record_not_canonical')
    }
    return record
  }

  return Object.freeze({
    schemaVersion:
      CANONICAL_SOURCE_ANALYSIS_PROBE_AUTHORITY_READ_PORT_VERSION,
    repositoryVersion:
      CANONICAL_SOURCE_ANALYSIS_PROBE_AUTHORITY_REPOSITORY_VERSION,
    async persistCreateOnly(value: Readonly<{
      scope: CanonicalSourceAnalysisProbeAuthorityScope
      authority: CanonicalSourceAnalysisProbeAuthority
    }>) {
      const scope = parseScope(value.scope)
      const probe = verifyCanonicalSourceAnalysisProbeAuthority({
        untrusted: value.authority,
        expected: scope,
      })
      const withoutDigest = {
        schemaVersion:
          CANONICAL_SOURCE_ANALYSIS_PROBE_AUTHORITY_REPOSITORY_VERSION,
        scope,
        probe,
        repositoryBoundary: closedBoundary(),
      } as const
      const record: StoredProbeRecord = Object.freeze({
        ...withoutDigest,
        recordDigestSha256: rawDigest(withoutDigest),
      })
      const body = Buffer.from(stableStringify(record), 'utf8')
      if (body.byteLength > MAXIMUM_RECORD_BYTES) {
        throw conflict('source_analysis_probe_record_too_large')
      }
      const disposition = await input.objectPort.createOnly({
        objectPath: objectPath(prefix, scope),
        body,
        contentSha256: rawSha(body),
      })
      const reread = await readRecord(scope)
      if (!reread || stableStringify(reread) !== stableStringify(record)) {
        throw conflict('source_analysis_probe_create_reread_mismatch')
      }
      return Object.freeze({
        disposition: disposition === 'created'
          ? 'created' as const
          : 'identical_replay' as const,
        repositoryRecordRef: repositoryRef(reread),
        sourceProbeAuthorityRef: cloneRef(
          reread.probe.sourceProbeAuthorityRef,
        ),
        exactCreateOnlyRereadVerified: true as const,
        gpuJobStarted: false as const,
        providerCalled: false as const,
        customerCreditMutated: false as const,
        publicDeliveryGranted: false as const,
        productionAuthorityGranted: false as const,
      })
    },
    async readCompletedExactProbe(
      scope: CanonicalSourceAnalysisProbeAuthorityScope,
    ) {
      const record = await readRecord(scope)
      return record ? structuredClone(record.probe) : null
    },
  })
}

function parseRecord(
  untrusted: unknown,
  expectedScope: CanonicalSourceAnalysisProbeAuthorityScope,
): StoredProbeRecord {
  const value = exactRecord(untrusted, [
    'schemaVersion', 'scope', 'probe', 'repositoryBoundary',
    'recordDigestSha256',
  ])
  const scope = parseScope(value.scope)
  if (
    stableStringify(scope) !== stableStringify(expectedScope)
    || value.schemaVersion !==
      CANONICAL_SOURCE_ANALYSIS_PROBE_AUTHORITY_REPOSITORY_VERSION
    || stableStringify(value.repositoryBoundary) !==
      stableStringify(closedBoundary())
    || typeof value.recordDigestSha256 !== 'string'
    || !RAW_SHA256.test(value.recordDigestSha256)
  ) throw conflict('source_analysis_probe_record_authority_invalid')
  const probe = verifyCanonicalSourceAnalysisProbeAuthority({
    untrusted: value.probe,
    expected: scope,
  })
  const withoutDigest = {
    schemaVersion:
      CANONICAL_SOURCE_ANALYSIS_PROBE_AUTHORITY_REPOSITORY_VERSION,
    scope,
    probe,
    repositoryBoundary: closedBoundary(),
  } as const
  if (value.recordDigestSha256 !== rawDigest(withoutDigest)) {
    throw conflict('source_analysis_probe_record_digest_invalid')
  }
  return structuredClone({
    ...withoutDigest,
    recordDigestSha256: value.recordDigestSha256,
  })
}

function parseScope(
  untrusted: unknown,
): CanonicalSourceAnalysisProbeAuthorityScope {
  const value = exactRecord(untrusted, [
    'ownerUserId', 'workspaceId', 'projectId', 'editSessionId',
    'sourceSequenceItemId', 'mediaAssetId', 'uploadedOrder',
    'checksumSha256', 'byteLength', 'storageGeneration', 'storageEtag',
    'finalizedMediaAuthorityRef', 'finalizedStorageObjectAuthorityRef',
  ])
  if (
    !safeId(value.ownerUserId)
    || !safeId(value.workspaceId)
    || !safeId(value.projectId)
    || !safeId(value.editSessionId)
    || !safeId(value.sourceSequenceItemId)
    || !safeId(value.mediaAssetId)
    || !positiveInteger(value.uploadedOrder)
    || typeof value.checksumSha256 !== 'string'
    || !RAW_SHA256.test(value.checksumSha256)
    || !positiveInteger(value.byteLength)
    || typeof value.storageGeneration !== 'string'
    || !/^[1-9][0-9]{0,30}$/u.test(value.storageGeneration)
    || typeof value.storageEtag !== 'string'
    || value.storageEtag !== value.storageEtag.trim()
    || value.storageEtag.length < 1
    || value.storageEtag.length > 1_024
    || /[\0\r\n]/u.test(value.storageEtag)
  ) throw conflict('source_analysis_probe_scope_invalid')
  const finalizedMediaAuthorityRef = parseRef(
    value.finalizedMediaAuthorityRef,
  )
  const finalizedStorageObjectAuthorityRef = parseRef(
    value.finalizedStorageObjectAuthorityRef,
  )
  if (
    refKey(finalizedMediaAuthorityRef) ===
      refKey(finalizedStorageObjectAuthorityRef)
  ) throw conflict('source_analysis_probe_scope_refs_invalid')
  return Object.freeze({
    ownerUserId: value.ownerUserId,
    workspaceId: value.workspaceId,
    projectId: value.projectId,
    editSessionId: value.editSessionId,
    sourceSequenceItemId: value.sourceSequenceItemId,
    mediaAssetId: value.mediaAssetId,
    uploadedOrder: Number(value.uploadedOrder),
    checksumSha256: value.checksumSha256,
    byteLength: Number(value.byteLength),
    storageGeneration: value.storageGeneration,
    storageEtag: value.storageEtag,
    finalizedMediaAuthorityRef,
    finalizedStorageObjectAuthorityRef,
  })
}

function closedBoundary() {
  return Object.freeze({
    owner: 'canonical_source_analysis_probe_attempt_owner' as const,
    createOnlyPersistence: true as const,
    completedL4AttemptRereadRequired: true as const,
    exactUsageCostRereadRequired: true as const,
    exactScaleBackToZeroObservationRequired: true as const,
    repositoryMayDispatchGpuJob: false as const,
    repositoryMayReadSourceBytes: false as const,
    repositoryMayRunFfprobe: false as const,
    repositoryMayCallProvider: false as const,
    repositoryMayMutateCredits: false as const,
    repositoryMayGrantPublicDelivery: false as const,
    repositoryMayGrantProductionAuthority: false as const,
  })
}

function repositoryRef(record: StoredProbeRecord): VisualIntelligenceEvidenceRef {
  return Object.freeze({
    id: `source-probe-record-${record.recordDigestSha256.slice(0, 32)}`,
    version: 1,
    contentHash: `sha256:${rawSha(Buffer.from(
      stableStringify(record),
      'utf8',
    ))}`,
  })
}

function objectPath(
  prefix: string,
  scope: CanonicalSourceAnalysisProbeAuthorityScope,
): string {
  return [
    prefix,
    scope.ownerUserId,
    scope.workspaceId,
    scope.projectId,
    scope.editSessionId,
    scope.sourceSequenceItemId,
    `${rawDigest(scope)}.json`,
  ].join('/')
}

function normalizePrefix(value: string): string {
  const normalized = value.replace(/^\/+|\/+$/gu, '')
  if (
    !normalized
    || normalized.includes('..')
    || normalized.includes('//')
    || !/^[A-Za-z0-9][A-Za-z0-9._:/-]{0,800}$/u.test(normalized)
  ) throw conflict('source_analysis_probe_prefix_invalid')
  return normalized
}

function parseRef(untrusted: unknown): VisualIntelligenceEvidenceRef {
  const value = exactRecord(untrusted, ['id', 'version', 'contentHash'])
  if (
    !safeId(value.id)
    || !positiveInteger(value.version)
    || typeof value.contentHash !== 'string'
    || !PREFIXED_SHA256.test(value.contentHash)
  ) throw conflict('source_analysis_probe_ref_invalid')
  return Object.freeze({
    id: value.id,
    version: Number(value.version),
    contentHash: value.contentHash,
  })
}

function cloneRef(ref: VisualIntelligenceEvidenceRef) {
  return Object.freeze({ ...ref })
}

function refKey(ref: VisualIntelligenceEvidenceRef): string {
  return `${ref.id}:${ref.version}:${ref.contentHash}`
}

function safeId(value: unknown): value is string {
  return typeof value === 'string'
    && SAFE_ID.test(value)
    && !value.includes('..')
}

function positiveInteger(value: unknown): boolean {
  return Number.isSafeInteger(value) && Number(value) > 0
}

function exactRecord(
  value: unknown,
  keys: readonly string[],
): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw conflict('source_analysis_probe_record_shape_invalid')
  }
  let prototype: object | null
  let actualKeys: readonly (string | symbol)[]
  let descriptors: PropertyDescriptorMap
  try {
    prototype = Object.getPrototypeOf(value)
    actualKeys = Reflect.ownKeys(value)
    descriptors = Object.getOwnPropertyDescriptors(value)
  } catch {
    throw conflict('source_analysis_probe_record_shape_invalid')
  }
  if (
    (prototype !== Object.prototype && prototype !== null)
    || actualKeys.some((key) => typeof key !== 'string')
    || actualKeys.length !== keys.length
    || keys.some((key) => !Object.hasOwn(value, key))
    || Object.values(descriptors).some((descriptor) =>
      'get' in descriptor || 'set' in descriptor)
  ) throw conflict('source_analysis_probe_record_shape_invalid')
  return value as Record<string, unknown>
}

function rawDigest(value: unknown): string {
  return rawSha(Buffer.from(stableStringify(value), 'utf8'))
}

function rawSha(value: Buffer): string {
  return createHash('sha256').update(value).digest('hex')
}

function stableStringify(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map(stableStringify).join(',')}]`
  }
  if (value && typeof value === 'object') {
    return `{${Object.entries(value as Record<string, unknown>)
      .filter(([, item]) => item !== undefined)
      .sort(([left], [right]) => left < right ? -1 : left > right ? 1 : 0)
      .map(([key, item]) =>
        `${JSON.stringify(key)}:${stableStringify(item)}`)
      .join(',')}}`
  }
  return JSON.stringify(value)
}

function conflict(reason: string): ApiError {
  return new ApiError(
    'IDEMPOTENCY_CONFLICT',
    'Canonical source-analysis probe authority failed exact reread.',
    409,
    { reason },
  )
}

function notReady(reason: string): ApiError {
  return new ApiError(
    'TOOL_NOT_READY',
    'Canonical source-analysis probe repository is not ready.',
    503,
    { reason },
  )
}
