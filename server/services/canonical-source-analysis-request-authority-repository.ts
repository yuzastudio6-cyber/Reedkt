import { createHash } from 'node:crypto'

import type { VisualIntelligenceEvidenceRef } from
  '../../src/types/visual-intelligence'
import { ApiError } from '../errors/api-error'
import type {
  CanonicalCreateOnlyJsonObjectPort,
} from './canonical-gcs-source-analysis-lifecycle-store'
import {
  CANONICAL_SOURCE_ANALYSIS_REQUEST_AUTHORITY_READ_PORT_VERSION,
  verifyCanonicalSourceAnalysisPlanningScope,
  verifyCanonicalSourceAnalysisPreparedRequestForPlanning,
  type CanonicalSourceAnalysisPlanningScope,
  type CanonicalSourceAnalysisRequestAuthorityReadPort,
} from './canonical-source-led-orchestra-planning-reconciliation'
import type {
  CanonicalSourceLedProfessionalContentAnalysisInput,
} from './canonical-source-led-professional-content-analysis-port'

export const CANONICAL_SOURCE_ANALYSIS_REQUEST_AUTHORITY_REPOSITORY_VERSION =
  'canonical-source-analysis-request-authority-repository-v1' as const

const DEFAULT_PREFIX =
  'private/orchestra/v1/source-analysis-prepared-requests'
const RAW_SHA256 = /^[a-f0-9]{64}$/u
const MAXIMUM_RECORD_BYTES = 4 * 1024 * 1024

export interface CanonicalSourceAnalysisRequestAuthorityRepository
  extends CanonicalSourceAnalysisRequestAuthorityReadPort {
  readonly repositoryVersion:
    typeof CANONICAL_SOURCE_ANALYSIS_REQUEST_AUTHORITY_REPOSITORY_VERSION
  persistCreateOnly(input: {
    readonly scope: CanonicalSourceAnalysisPlanningScope
    readonly request: CanonicalSourceLedProfessionalContentAnalysisInput
  }): Promise<Readonly<{
    disposition: 'created' | 'identical_replay'
    analysisRunId: string
    requestDigestSha256: string
    repositoryRecordRef: VisualIntelligenceEvidenceRef
    exactPreparedRequestRereadVerified: true
    transcriptDispatched: false
    visualIntelligenceDispatched: false
    providerCalled: false
    gpuJobStarted: false
    customerCreditMutated: false
  }>>
}

interface StoredRecord {
  readonly schemaVersion:
    typeof CANONICAL_SOURCE_ANALYSIS_REQUEST_AUTHORITY_REPOSITORY_VERSION
  readonly scope: CanonicalSourceAnalysisPlanningScope
  readonly analysisRunId: string
  readonly requestDigestSha256: string
  readonly request: CanonicalSourceLedProfessionalContentAnalysisInput
  readonly authority: ReturnType<typeof closedAuthority>
  readonly recordDigestSha256: string
}

/**
 * Durable one-writer handoff between source preparation and Orchestra. This
 * repository persists only a byte-free, already-probed request. It cannot run
 * FFprobe, transcript, GPU, Gemini, Head reasoning, or customer billing.
 */
export function createCanonicalSourceAnalysisRequestAuthorityRepository(
  input: {
    readonly objectPort: CanonicalCreateOnlyJsonObjectPort
    readonly prefix?: string
  },
): CanonicalSourceAnalysisRequestAuthorityRepository {
  if (
    typeof input.objectPort?.createOnly !== 'function'
    || typeof input.objectPort?.readExact !== 'function'
  ) throw notReady('source_analysis_request_repository_object_port_invalid')
  const prefix = normalizePrefix(input.prefix ?? DEFAULT_PREFIX)

  const readRecord = async (
    untrustedScope: CanonicalSourceAnalysisPlanningScope,
  ): Promise<StoredRecord | null> => {
    const scope = verifyCanonicalSourceAnalysisPlanningScope(untrustedScope)
    const bytes = await input.objectPort.readExact(objectPath(prefix, scope))
    if (!bytes) return null
    if (
      !Buffer.isBuffer(bytes)
      || bytes.byteLength < 2
      || bytes.byteLength > MAXIMUM_RECORD_BYTES
    ) throw conflict('source_analysis_request_record_bytes_invalid')
    let untrusted: unknown
    try {
      untrusted = JSON.parse(bytes.toString('utf8'))
    } catch {
      throw conflict('source_analysis_request_record_json_invalid')
    }
    const record = parseRecord(untrusted, scope)
    if (bytes.toString('utf8') !== stableStringify(record)) {
      throw conflict('source_analysis_request_record_not_canonical')
    }
    return record
  }

  return Object.freeze({
    schemaVersion:
      CANONICAL_SOURCE_ANALYSIS_REQUEST_AUTHORITY_READ_PORT_VERSION,
    repositoryVersion:
      CANONICAL_SOURCE_ANALYSIS_REQUEST_AUTHORITY_REPOSITORY_VERSION,

    async persistCreateOnly(value: {
      readonly scope: CanonicalSourceAnalysisPlanningScope
      readonly request: CanonicalSourceLedProfessionalContentAnalysisInput
    }) {
      const scope = verifyCanonicalSourceAnalysisPlanningScope(value.scope)
      const identity =
        verifyCanonicalSourceAnalysisPreparedRequestForPlanning({
          scope,
          request: value.request,
        })
      const withoutDigest = {
        schemaVersion:
          CANONICAL_SOURCE_ANALYSIS_REQUEST_AUTHORITY_REPOSITORY_VERSION,
        scope,
        analysisRunId: identity.analysisRunId,
        requestDigestSha256: identity.requestDigest,
        request: identity.request,
        authority: closedAuthority(),
      } as const
      const record: StoredRecord = Object.freeze({
        ...withoutDigest,
        recordDigestSha256: digest(withoutDigest),
      })
      const body = Buffer.from(stableStringify(record), 'utf8')
      if (body.byteLength > MAXIMUM_RECORD_BYTES) {
        throw conflict('source_analysis_request_record_too_large')
      }
      const disposition = await input.objectPort.createOnly({
        objectPath: objectPath(prefix, scope),
        body,
        contentSha256: rawSha256(body),
      })
      const reread = await readRecord(scope)
      if (!reread || stableStringify(reread) !== stableStringify(record)) {
        throw conflict('source_analysis_request_create_reread_mismatch')
      }
      return Object.freeze({
        disposition: disposition === 'created'
          ? 'created' as const
          : 'identical_replay' as const,
        analysisRunId: reread.analysisRunId,
        requestDigestSha256: reread.requestDigestSha256,
        repositoryRecordRef: recordRef(reread),
        exactPreparedRequestRereadVerified: true as const,
        transcriptDispatched: false as const,
        visualIntelligenceDispatched: false as const,
        providerCalled: false as const,
        gpuJobStarted: false as const,
        customerCreditMutated: false as const,
      })
    },

    async readExactPreparedRequest(
      scope: CanonicalSourceAnalysisPlanningScope,
    ) {
      const record = await readRecord(scope)
      return record ? structuredClone(record.request) : null
    },
  })
}

function parseRecord(
  untrusted: unknown,
  expectedScope: CanonicalSourceAnalysisPlanningScope,
): StoredRecord {
  const record = exactRecord(untrusted, [
    'schemaVersion',
    'scope',
    'analysisRunId',
    'requestDigestSha256',
    'request',
    'authority',
    'recordDigestSha256',
  ]) as unknown as StoredRecord
  const scope = verifyCanonicalSourceAnalysisPlanningScope(record.scope)
  const identity = verifyCanonicalSourceAnalysisPreparedRequestForPlanning({
    scope,
    request: record.request,
  })
  if (
    record.schemaVersion !==
      CANONICAL_SOURCE_ANALYSIS_REQUEST_AUTHORITY_REPOSITORY_VERSION
    || stableStringify(scope) !== stableStringify(expectedScope)
    || record.analysisRunId !== identity.analysisRunId
    || record.requestDigestSha256 !== identity.requestDigest
    || !RAW_SHA256.test(record.recordDigestSha256)
    || stableStringify(record.authority) !== stableStringify(closedAuthority())
  ) throw conflict('source_analysis_request_record_authority_invalid')
  const normalized = {
    schemaVersion:
      CANONICAL_SOURCE_ANALYSIS_REQUEST_AUTHORITY_REPOSITORY_VERSION,
    scope,
    analysisRunId: identity.analysisRunId,
    requestDigestSha256: identity.requestDigest,
    request: identity.request,
    authority: closedAuthority(),
    recordDigestSha256: record.recordDigestSha256,
  } as const
  const withoutDigest = { ...normalized }
  Reflect.deleteProperty(withoutDigest, 'recordDigestSha256')
  if (record.recordDigestSha256 !== digest(withoutDigest)) {
    throw conflict('source_analysis_request_record_digest_invalid')
  }
  return structuredClone(normalized)
}

function closedAuthority() {
  return Object.freeze({
    owner: 'head_orchestra_source_analysis_preparation' as const,
    authenticatedUserTriggerRequired: true as const,
    exactFinalizedGcsSourceRereadRequired: true as const,
    exactGenerationEtagShaLengthRereadRequired: true as const,
    exactSourceProbeRereadRequired: true as const,
    exactSourceBindingManifestRereadRequired: true as const,
    exactAnalysisConsentRereadRequired: true as const,
    exactPlatformCostCapRereadRequired: true as const,
    browserFrameRateAccepted: false as const,
    browserFrameCountAccepted: false as const,
    browserTimebaseAccepted: false as const,
    browserAudioProbeAccepted: false as const,
    callerPathUrlBytesOrCommandAccepted: false as const,
    transcriptDispatched: false as const,
    visualIntelligenceDispatched: false as const,
    providerCalled: false as const,
    gpuJobStarted: false as const,
    planPublished: false as const,
    approvalGranted: false as const,
    customerCreditMutated: false as const,
    publicDeliveryGranted: false as const,
    productionAuthorityGranted: false as const,
  })
}

function recordRef(record: StoredRecord): VisualIntelligenceEvidenceRef {
  return Object.freeze({
    id: `source-analysis-request-${record.recordDigestSha256.slice(0, 32)}`,
    version: 1,
    contentHash: `sha256:${rawSha256(Buffer.from(
      stableStringify(record),
      'utf8',
    ))}`,
  })
}

function objectPath(
  prefix: string,
  scope: CanonicalSourceAnalysisPlanningScope,
): string {
  return [
    prefix,
    scope.ownerUserId,
    scope.workspaceId,
    scope.projectId,
    scope.editSessionId,
    `${digest(scope)}.json`,
  ].join('/')
}

function normalizePrefix(value: string): string {
  const normalized = value.replace(/^\/+|\/+$/gu, '')
  if (
    !normalized
    || normalized.includes('..')
    || normalized.includes('//')
    || !/^[A-Za-z0-9][A-Za-z0-9._:/-]{0,800}$/u.test(normalized)
  ) throw conflict('source_analysis_request_prefix_invalid')
  return normalized
}

function exactRecord(
  value: unknown,
  keys: readonly string[],
): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw conflict('source_analysis_request_record_shape_invalid')
  }
  let prototype: object | null
  let actualKeys: readonly (string | symbol)[]
  let descriptors: PropertyDescriptorMap
  try {
    prototype = Object.getPrototypeOf(value)
    actualKeys = Reflect.ownKeys(value)
    descriptors = Object.getOwnPropertyDescriptors(value)
  } catch {
    throw conflict('source_analysis_request_record_shape_invalid')
  }
  if (
    (prototype !== Object.prototype && prototype !== null)
    || actualKeys.some((key) => typeof key !== 'string')
    || actualKeys.length !== keys.length
    || keys.some((key) => !Object.hasOwn(value, key))
    || Object.values(descriptors).some((descriptor) =>
      'get' in descriptor || 'set' in descriptor)
  ) throw conflict('source_analysis_request_record_shape_invalid')
  return value as Record<string, unknown>
}

function digest(value: unknown): string {
  return rawSha256(Buffer.from(stableStringify(value), 'utf8'))
}

function rawSha256(value: Buffer): string {
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
    'Canonical prepared source-analysis request failed exact immutable reread.',
    409,
    { reason },
  )
}

function notReady(reason: string): ApiError {
  return new ApiError(
    'TOOL_NOT_READY',
    'Canonical prepared source-analysis request persistence is not ready.',
    503,
    { reason },
  )
}
