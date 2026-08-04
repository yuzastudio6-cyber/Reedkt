import { createHash } from 'node:crypto'

import type {
  VisualIntelligenceEvidenceRef,
  VisualIntelligencePreparedEvidence,
  VisualIntelligenceRequest,
} from '../../src/types/visual-intelligence'
import { ApiError } from '../errors/api-error'
import type {
  CanonicalCreateOnlyJsonObjectPort,
} from '../services/canonical-gcs-source-analysis-lifecycle-store'
import {
  createVisualIntelligenceEvidenceRef,
  parseVisualIntelligenceRequest,
  visualIntelligenceCanonicalJson,
  visualIntelligenceDigest,
} from './visual-intelligence-contract'
import {
  assertVisualIntelligencePreparedEvidenceForRequest,
} from './visual-intelligence-lifecycle-service'
import {
  assertAdmittedVisualIntelligenceRuntimeRelease,
  visualIntelligenceRuntimeReleaseRef,
  type VisualIntelligenceRuntimeRelease,
} from './visual-intelligence-runtime-release'

export const VISUAL_INTELLIGENCE_CANONICAL_PREPARED_EVIDENCE_STORE_VERSION =
  'visual-intelligence-canonical-prepared-evidence-store-v1' as const
export const VISUAL_INTELLIGENCE_CANONICAL_PREPARED_EVIDENCE_RECORD_VERSION =
  'visual-intelligence-canonical-prepared-evidence-record-v1' as const

const DEFAULT_PREFIX = 'private/visual-intelligence/v1/prepared-evidence'
const MAX_RECORD_BYTES = 24 * 1024 * 1024
const SAFE_ID = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,239}$/u
const PREFIXED_SHA256 = /^sha256:[a-f0-9]{64}$/u

export type VisualIntelligenceCanonicalPreparedEvidenceOwnerClass =
  | 'canonical_source_analysis_evidence_owner'
  | 'canonical_reference_analysis_evidence_owner'
  | 'canonical_planning_evidence_owner'
  | 'canonical_edit_inspection_evidence_owner'

export interface VisualIntelligenceCanonicalPreparedEvidenceRead {
  readonly ownerClass: VisualIntelligenceCanonicalPreparedEvidenceOwnerClass
  readonly ownerAuthorityRef: VisualIntelligenceEvidenceRef
  readonly request: VisualIntelligenceRequest
  readonly preparedEvidence: VisualIntelligencePreparedEvidence
  readonly recordRef: VisualIntelligenceEvidenceRef
}

export interface VisualIntelligenceCanonicalPreparedEvidenceReadPort {
  readonly schemaVersion:
    typeof VISUAL_INTELLIGENCE_CANONICAL_PREPARED_EVIDENCE_STORE_VERSION
  readExactForRequest(input: {
    readonly request: VisualIntelligenceRequest
    readonly recordRef: VisualIntelligenceEvidenceRef
  }): Promise<VisualIntelligenceCanonicalPreparedEvidenceRead | null>
}

export interface VisualIntelligenceCanonicalPreparedEvidenceStore
extends VisualIntelligenceCanonicalPreparedEvidenceReadPort {
  persistCreateOnly(input: {
    readonly ownerClass:
      VisualIntelligenceCanonicalPreparedEvidenceOwnerClass
    readonly ownerAuthorityRef: VisualIntelligenceEvidenceRef
    readonly request: VisualIntelligenceRequest
    readonly preparedEvidence: VisualIntelligencePreparedEvidence
  }): Promise<{
    readonly disposition: 'created' | 'identical_replay'
    readonly recordRef: VisualIntelligenceEvidenceRef
  }>
}

interface CanonicalPreparedEvidenceRecord {
  readonly schemaVersion:
    typeof VISUAL_INTELLIGENCE_CANONICAL_PREPARED_EVIDENCE_RECORD_VERSION
  readonly storeVersion:
    typeof VISUAL_INTELLIGENCE_CANONICAL_PREPARED_EVIDENCE_STORE_VERSION
  readonly ownerClass:
    VisualIntelligenceCanonicalPreparedEvidenceOwnerClass
  readonly ownerAuthorityRef: VisualIntelligenceEvidenceRef
  readonly request: VisualIntelligenceRequest
  readonly preparedEvidence: VisualIntelligencePreparedEvidence
  readonly exactOwnerAuthorityRereadRequired: true
  readonly exactToolReleaseAndExecutionRereadRequired: true
  readonly exactSourceGenerationChecksumRereadRequired: true
  readonly exactTranscriptAndOcrAuthorityRereadRequired: true
  readonly browserOrOrchestraPreparedEvidenceAccepted: false
  readonly callerPathUrlBytesCommandOrCredentialAccepted: false
  readonly substantiveCpuMediaOrModelExecutionAccepted: false
  readonly directProviderTimelineArtifactOrQaAuthorityGranted: false
  readonly recordDigestSha256: string
}

/**
 * Durable handoff between deterministic evidence owners and Orchestra.
 * Orchestra may reference this record, but it cannot provide the evidence
 * body that is later sent to the semantic provider.
 */
export function createVisualIntelligenceCanonicalPreparedEvidenceStore(
  input: {
    readonly objectPort: CanonicalCreateOnlyJsonObjectPort
    readonly runtimeRelease: VisualIntelligenceRuntimeRelease
    readonly prefix?: string
  },
): VisualIntelligenceCanonicalPreparedEvidenceStore {
  assertObjectPort(input.objectPort)
  const releaseRef = visualIntelligenceRuntimeReleaseRef(
    assertAdmittedVisualIntelligenceRuntimeRelease(input.runtimeRelease),
  )
  const prefix = normalizePrefix(input.prefix ?? DEFAULT_PREFIX)

  const readByRequestId = async (
    requestId: string,
  ): Promise<CanonicalPreparedEvidenceRecord | null> => {
    const body = await input.objectPort.readExact(recordPath(prefix, requestId))
    if (!body) return null
    return parseRecord(parseJson(body), releaseRef)
  }

  return Object.freeze({
    schemaVersion:
      VISUAL_INTELLIGENCE_CANONICAL_PREPARED_EVIDENCE_STORE_VERSION,

    async persistCreateOnly(untrusted: {
      readonly ownerClass:
        VisualIntelligenceCanonicalPreparedEvidenceOwnerClass
      readonly ownerAuthorityRef: VisualIntelligenceEvidenceRef
      readonly request: VisualIntelligenceRequest
      readonly preparedEvidence: VisualIntelligencePreparedEvidence
    }) {
      assertExactInput(untrusted, [
        'ownerClass', 'ownerAuthorityRef', 'request', 'preparedEvidence',
      ])
      const ownerAuthorityRef = requireRef(untrusted.ownerAuthorityRef)
      const request = parseVisualIntelligenceRequest(untrusted.request)
      const preparedEvidence =
        assertVisualIntelligencePreparedEvidenceForRequest(
          request,
          untrusted.preparedEvidence,
        )
      assertOwnerSemantics(untrusted.ownerClass, request)
      assertReleaseBinding(request, releaseRef)
      const withoutDigest = {
        schemaVersion:
          VISUAL_INTELLIGENCE_CANONICAL_PREPARED_EVIDENCE_RECORD_VERSION,
        storeVersion:
          VISUAL_INTELLIGENCE_CANONICAL_PREPARED_EVIDENCE_STORE_VERSION,
        ownerClass: untrusted.ownerClass,
        ownerAuthorityRef,
        request,
        preparedEvidence,
        exactOwnerAuthorityRereadRequired: true as const,
        exactToolReleaseAndExecutionRereadRequired: true as const,
        exactSourceGenerationChecksumRereadRequired: true as const,
        exactTranscriptAndOcrAuthorityRereadRequired: true as const,
        browserOrOrchestraPreparedEvidenceAccepted: false as const,
        callerPathUrlBytesCommandOrCredentialAccepted: false as const,
        substantiveCpuMediaOrModelExecutionAccepted: false as const,
        directProviderTimelineArtifactOrQaAuthorityGranted: false as const,
      }
      const record: CanonicalPreparedEvidenceRecord = Object.freeze({
        ...withoutDigest,
        recordDigestSha256: visualIntelligenceDigest(withoutDigest),
      })
      const body = recordBody(record)
      const disposition = await input.objectPort.createOnly({
        objectPath: recordPath(prefix, request.requestId),
        body,
        contentSha256: rawDigest(body),
      })
      const reread = await readByRequestId(request.requestId)
      if (!reread || !same(record, reread)) {
        throw conflict(
          'visual_intelligence_prepared_evidence_reread_mismatch',
        )
      }
      return Object.freeze({
        disposition: disposition === 'created'
          ? 'created' as const
          : 'identical_replay' as const,
        recordRef: recordRef(reread),
      })
    },

    async readExactForRequest(untrusted: {
      readonly request: VisualIntelligenceRequest
      readonly recordRef: VisualIntelligenceEvidenceRef
    }) {
      assertExactInput(untrusted, ['request', 'recordRef'])
      const request = parseVisualIntelligenceRequest(untrusted.request)
      const requestedRef = requireRef(untrusted.recordRef)
      const record = await readByRequestId(request.requestId)
      if (
        !record
        || !same(record.request, request)
        || refKey(recordRef(record)) !== refKey(requestedRef)
      ) return null
      return Object.freeze({
        ownerClass: record.ownerClass,
        ownerAuthorityRef: record.ownerAuthorityRef,
        request: record.request,
        preparedEvidence: record.preparedEvidence,
        recordRef: recordRef(record),
      })
    },
  })
}

function parseRecord(
  value: unknown,
  releaseRef: VisualIntelligenceEvidenceRef,
): CanonicalPreparedEvidenceRecord {
  if (!isPlainRecord(value)) {
    throw conflict('visual_intelligence_prepared_evidence_record_invalid')
  }
  const keys = [
    'schemaVersion', 'storeVersion', 'ownerClass', 'ownerAuthorityRef',
    'request', 'preparedEvidence', 'exactOwnerAuthorityRereadRequired',
    'exactToolReleaseAndExecutionRereadRequired',
    'exactSourceGenerationChecksumRereadRequired',
    'exactTranscriptAndOcrAuthorityRereadRequired',
    'browserOrOrchestraPreparedEvidenceAccepted',
    'callerPathUrlBytesCommandOrCredentialAccepted',
    'substantiveCpuMediaOrModelExecutionAccepted',
    'directProviderTimelineArtifactOrQaAuthorityGranted',
    'recordDigestSha256',
  ]
  if (
    Reflect.ownKeys(value).length !== keys.length
    || keys.some((key) => !Object.hasOwn(value, key))
    || value.schemaVersion !==
      VISUAL_INTELLIGENCE_CANONICAL_PREPARED_EVIDENCE_RECORD_VERSION
    || value.storeVersion !==
      VISUAL_INTELLIGENCE_CANONICAL_PREPARED_EVIDENCE_STORE_VERSION
    || !isOwnerClass(value.ownerClass)
    || value.exactOwnerAuthorityRereadRequired !== true
    || value.exactToolReleaseAndExecutionRereadRequired !== true
    || value.exactSourceGenerationChecksumRereadRequired !== true
    || value.exactTranscriptAndOcrAuthorityRereadRequired !== true
    || value.browserOrOrchestraPreparedEvidenceAccepted !== false
    || value.callerPathUrlBytesCommandOrCredentialAccepted !== false
    || value.substantiveCpuMediaOrModelExecutionAccepted !== false
    || value.directProviderTimelineArtifactOrQaAuthorityGranted !== false
    || typeof value.recordDigestSha256 !== 'string'
    || !PREFIXED_SHA256.test(value.recordDigestSha256)
    || value.recordDigestSha256 !== visualIntelligenceDigest(
      omit(value, 'recordDigestSha256'),
    )
  ) throw conflict('visual_intelligence_prepared_evidence_record_invalid')
  const request = parseVisualIntelligenceRequest(value.request)
  const preparedEvidence =
    assertVisualIntelligencePreparedEvidenceForRequest(
      request,
      value.preparedEvidence,
    )
  assertOwnerSemantics(value.ownerClass, request)
  assertReleaseBinding(request, releaseRef)
  return Object.freeze({
    ...value,
    ownerClass: value.ownerClass,
    ownerAuthorityRef: requireRef(value.ownerAuthorityRef),
    request,
    preparedEvidence,
  }) as unknown as CanonicalPreparedEvidenceRecord
}

function assertOwnerSemantics(
  ownerClass: unknown,
  request: VisualIntelligenceRequest,
): asserts ownerClass is VisualIntelligenceCanonicalPreparedEvidenceOwnerClass {
  if (!isOwnerClass(ownerClass)) {
    throw notReady('visual_intelligence_prepared_evidence_owner_invalid')
  }
  const exact = ownerClass === 'canonical_source_analysis_evidence_owner'
    ? request.operation === 'analyze_media'
      && request.profile === 'source_edit_planning'
      && request.admission.mode === 'planning_evidence'
    : ownerClass === 'canonical_reference_analysis_evidence_owner'
      ? request.operation === 'analyze_media'
        && request.profile === 'reference_preference_dna'
        && request.admission.mode === 'planning_evidence'
      : ownerClass === 'canonical_planning_evidence_owner'
        ? request.admission.mode === 'planning_evidence'
          && !(
            request.operation === 'analyze_media'
            && (
              request.profile === 'source_edit_planning'
              || request.profile === 'reference_preference_dna'
            )
          )
        : request.admission.mode === 'approved_edit_inspection'
          && request.operation !== 'analyze_media'
  if (!exact) throw notReady(
    'visual_intelligence_prepared_evidence_owner_scope_mismatch',
  )
}

function assertReleaseBinding(
  request: VisualIntelligenceRequest,
  releaseRef: VisualIntelligenceEvidenceRef,
): void {
  if (
    refKey(request.admission.providerReleaseRef) !== refKey(releaseRef)
    || request.admission.globalKillSwitchOpen
    || request.admission.providerKillSwitchOpen
  ) throw notReady('visual_intelligence_prepared_evidence_release_mismatch')
}

function isOwnerClass(
  value: unknown,
): value is VisualIntelligenceCanonicalPreparedEvidenceOwnerClass {
  return value === 'canonical_source_analysis_evidence_owner'
    || value === 'canonical_reference_analysis_evidence_owner'
    || value === 'canonical_planning_evidence_owner'
    || value === 'canonical_edit_inspection_evidence_owner'
}

function recordRef(
  record: CanonicalPreparedEvidenceRecord,
): VisualIntelligenceEvidenceRef {
  return createVisualIntelligenceEvidenceRef(
    `vi-prepared-record-${record.request.requestDigestSha256.slice(7, 39)}`,
    {
      storeVersion: record.storeVersion,
      recordDigestSha256: record.recordDigestSha256,
    },
  )
}

function recordBody(value: CanonicalPreparedEvidenceRecord): Buffer {
  const body = Buffer.from(visualIntelligenceCanonicalJson(value), 'utf8')
  if (body.byteLength < 2 || body.byteLength > MAX_RECORD_BYTES) {
    throw conflict('visual_intelligence_prepared_evidence_size_invalid')
  }
  return body
}

function recordPath(prefix: string, requestId: string): string {
  if (!SAFE_ID.test(requestId) || requestId.includes('..')) {
    throw conflict('visual_intelligence_prepared_evidence_request_id_invalid')
  }
  return `${prefix}/${visualIntelligenceDigest(requestId).slice(7)}.json`
}

function normalizePrefix(value: string): string {
  const normalized = value.trim().replace(/^\/+|\/+$/gu, '')
  if (
    !normalized
    || normalized.length > 400
    || normalized.includes('..')
    || normalized.includes('\\')
    || normalized.split('/').some((part) => !SAFE_ID.test(part))
  ) throw notReady('visual_intelligence_prepared_evidence_prefix_invalid')
  return normalized
}

function parseJson(body: Buffer): unknown {
  if (body.byteLength < 2 || body.byteLength > MAX_RECORD_BYTES) {
    throw conflict('visual_intelligence_prepared_evidence_size_invalid')
  }
  try {
    return JSON.parse(body.toString('utf8')) as unknown
  } catch {
    throw conflict('visual_intelligence_prepared_evidence_json_invalid')
  }
}

function requireRef(value: unknown): VisualIntelligenceEvidenceRef {
  if (
    !isPlainRecord(value)
    || Reflect.ownKeys(value).length !== 3
    || typeof value.id !== 'string'
    || !SAFE_ID.test(value.id)
    || !Number.isSafeInteger(value.version)
    || Number(value.version) < 1
    || typeof value.contentHash !== 'string'
    || !PREFIXED_SHA256.test(value.contentHash)
  ) throw conflict('visual_intelligence_prepared_evidence_ref_invalid')
  return Object.freeze({
    id: value.id,
    version: Number(value.version),
    contentHash: value.contentHash,
  })
}

function assertObjectPort(port: CanonicalCreateOnlyJsonObjectPort): void {
  if (
    !port
    || typeof port.createOnly !== 'function'
    || typeof port.readExact !== 'function'
  ) throw notReady('visual_intelligence_prepared_evidence_store_invalid')
}

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false
  try {
    const prototype = Object.getPrototypeOf(value)
    const descriptors = Object.getOwnPropertyDescriptors(value)
    return (prototype === Object.prototype || prototype === null)
      && Reflect.ownKeys(value).every((key) => typeof key === 'string')
      && Object.values(descriptors).every(
        (descriptor) => !('get' in descriptor) && !('set' in descriptor),
      )
  } catch {
    return false
  }
}

function assertExactInput(value: unknown, keys: readonly string[]): void {
  if (
    !isPlainRecord(value)
    || Reflect.ownKeys(value).length !== keys.length
    || keys.some((key) => !Object.hasOwn(value, key))
  ) throw notReady('visual_intelligence_prepared_evidence_input_invalid')
}

function omit(
  value: Record<string, unknown>,
  key: string,
): Record<string, unknown> {
  const result = { ...value }
  Reflect.deleteProperty(result, key)
  return result
}

function rawDigest(value: Buffer): string {
  return createHash('sha256').update(value).digest('hex')
}

function same(left: unknown, right: unknown): boolean {
  return visualIntelligenceCanonicalJson(left)
    === visualIntelligenceCanonicalJson(right)
}

function refKey(value: VisualIntelligenceEvidenceRef): string {
  return `${value.id}:${value.version}:${value.contentHash}`
}

function notReady(requiredGate: string): ApiError {
  return new ApiError(
    'TOOL_NOT_READY',
    'Canonical Visual Intelligence deterministic evidence is not ready.',
    503,
    { requiredGate },
  )
}

function conflict(requiredGate: string): ApiError {
  return new ApiError(
    'IDEMPOTENCY_CONFLICT',
    'Canonical Visual Intelligence deterministic evidence changed or is invalid.',
    409,
    { requiredGate },
  )
}
