import { createHash } from 'node:crypto'

import { z } from 'zod'

import type { VisualIntelligenceEvidenceRef } from
  '../../src/types/visual-intelligence'
import { ApiError } from '../errors/api-error'
import type {
  CanonicalCreateOnlyJsonObjectPort,
} from './canonical-gcs-source-analysis-lifecycle-store'
import {
  canonicalSourceLedSourceFrameAuthoritySchema,
  createCanonicalSourceLedSourceFrameAuthority,
} from './canonical-source-led-content-analysis-evidence'
import {
  CANONICAL_SOURCE_TRANSCRIPT_ORCHESTRA_READ_PORT_VERSION,
  type CanonicalSourceTranscriptOrchestraReadPort,
  type CanonicalSourceTranscriptOrchestraReadScope,
} from './canonical-source-led-orchestra-content-analysis-reconciliation'
import type {
  CanonicalSourceLedProfessionalContentAnalysisSource,
} from './canonical-source-led-professional-content-analysis-port'
import {
  assertCanonicalVisualIntelligenceSourceTranscriptResult,
  verifyCanonicalVisualIntelligenceSourceTranscriptResult,
  type CanonicalVisualIntelligenceSourceTranscriptResult,
} from './canonical-source-visual-intelligence-analysis-contract'
import {
  assertPlainSerializedData,
} from './canonical-professional-gpu-job-lifecycle-service'
import {
  sha256AuthorityValue,
  stableAuthorityStringify,
} from './private-edit-authority-store'

export const CANONICAL_SOURCE_TRANSCRIPT_ORCHESTRA_REPOSITORY_VERSION =
  'canonical-source-transcript-orchestra-repository-v1' as const

const DEFAULT_PREFIX = 'private/orchestra/v1/source-transcripts'
const MAXIMUM_RECORD_BYTES = 64 * 1024 * 1024
const safeId = z.string().trim().min(1).max(240)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/u)
  .refine((value) => !value.includes('..'))
const rawSha256 = z.string().regex(/^[a-f0-9]{64}$/u)
const prefixedSha256 = z.string().regex(/^sha256:[a-f0-9]{64}$/u)
const positiveInteger = z.number().int().positive().safe()
const evidenceRefSchema = z.object({
  id: safeId,
  version: positiveInteger,
  contentHash: prefixedSha256,
}).strict()
const scopeSchema = z.object({
  ownerUserId: safeId,
  workspaceId: safeId,
  projectId: safeId,
  editSessionId: safeId,
  analysisRunId: safeId,
  sourceSequenceItemId: safeId,
  mediaAssetId: safeId,
  uploadedOrder: positiveInteger.max(8),
  checksumSha256: rawSha256,
  byteLength: positiveInteger,
  durationFrames: positiveInteger,
  sourceFrameAuthority: canonicalSourceLedSourceFrameAuthoritySchema,
  finalizedMediaAuthorityRef: evidenceRefSchema,
  sourceProbeAuthorityRef: evidenceRefSchema,
}).strict()

interface StoredTranscriptRecord {
  readonly schemaVersion:
    typeof CANONICAL_SOURCE_TRANSCRIPT_ORCHESTRA_REPOSITORY_VERSION
  readonly source: 'canonical_source_transcript_execution_owner'
  readonly evidenceClass: 'canonical_private_reread'
  readonly scope: CanonicalSourceTranscriptOrchestraReadScope
  readonly result: CanonicalVisualIntelligenceSourceTranscriptResult
  readonly boundary: ReturnType<typeof closedBoundary>
  readonly recordDigestSha256: string
}

export interface CanonicalSourceTranscriptOrchestraRepository
  extends CanonicalSourceTranscriptOrchestraReadPort {
  readonly repositoryVersion:
    typeof CANONICAL_SOURCE_TRANSCRIPT_ORCHESTRA_REPOSITORY_VERSION
  persistCreateOnly(input: Readonly<{
    scope: CanonicalSourceTranscriptOrchestraReadScope
    source: CanonicalSourceLedProfessionalContentAnalysisSource
    result: CanonicalVisualIntelligenceSourceTranscriptResult
  }>): Promise<Readonly<{
    disposition: 'created' | 'identical_replay'
    repositoryRecordRef: VisualIntelligenceEvidenceRef
    transcriptAuthorityRef: VisualIntelligenceEvidenceRef
    exactCreateOnlyRereadVerified: true
    gpuJobStarted: false
    providerCalled: false
    customerCreditMutated: false
    publicDeliveryGranted: false
    productionAuthorityGranted: false
  }>>
}

type TranscriptPersistenceInput = Readonly<{
  scope: CanonicalSourceTranscriptOrchestraReadScope
  source: CanonicalSourceLedProfessionalContentAnalysisSource
  result: CanonicalVisualIntelligenceSourceTranscriptResult
}>

/**
 * Immutable private handoff from the quality-first transcript router to
 * Head/Orchestra. This repository cannot start A100/L4 work or manufacture a
 * transcript; it only persists and rereads a source-bound completed result.
 */
export function createCanonicalSourceTranscriptOrchestraRepository(input: {
  readonly objectPort: CanonicalCreateOnlyJsonObjectPort
  readonly prefix?: string
}): CanonicalSourceTranscriptOrchestraRepository {
  if (
    typeof input.objectPort?.createOnly !== 'function'
    || typeof input.objectPort?.readExact !== 'function'
  ) throw notReady('source_transcript_repository_object_port_invalid')
  const prefix = normalizePrefix(input.prefix ?? DEFAULT_PREFIX)

  const readRecord = async (
    untrustedScope: CanonicalSourceTranscriptOrchestraReadScope,
  ): Promise<StoredTranscriptRecord | null> => {
    const scope = parseScope(untrustedScope)
    const body = await input.objectPort.readExact(objectPath(prefix, scope))
    if (!body) return null
    if (
      !Buffer.isBuffer(body)
      || body.byteLength < 2
      || body.byteLength > MAXIMUM_RECORD_BYTES
    ) throw conflict('source_transcript_repository_record_bytes_invalid')
    let untrusted: unknown
    try {
      untrusted = JSON.parse(body.toString('utf8'))
    } catch {
      throw conflict('source_transcript_repository_record_json_invalid')
    }
    const record = parseRecord(untrusted, scope)
    if (body.toString('utf8') !== stableAuthorityStringify(record)) {
      throw conflict('source_transcript_repository_record_not_canonical')
    }
    return record
  }

  return Object.freeze({
    schemaVersion: CANONICAL_SOURCE_TRANSCRIPT_ORCHESTRA_READ_PORT_VERSION,
    repositoryVersion:
      CANONICAL_SOURCE_TRANSCRIPT_ORCHESTRA_REPOSITORY_VERSION,
    async persistCreateOnly(value: TranscriptPersistenceInput) {
      const scope = parseScope(value.scope)
      assertSourceMatchesScope(value.source, scope)
      const result = verifyCanonicalVisualIntelligenceSourceTranscriptResult(
        value.source,
        value.result,
      )
      const withoutDigest = {
        schemaVersion:
          CANONICAL_SOURCE_TRANSCRIPT_ORCHESTRA_REPOSITORY_VERSION,
        source: 'canonical_source_transcript_execution_owner' as const,
        evidenceClass: 'canonical_private_reread' as const,
        scope,
        result,
        boundary: closedBoundary(),
      }
      const record: StoredTranscriptRecord = Object.freeze({
        ...withoutDigest,
        recordDigestSha256: sha256AuthorityValue(withoutDigest),
      })
      const body = Buffer.from(stableAuthorityStringify(record), 'utf8')
      if (body.byteLength > MAXIMUM_RECORD_BYTES) {
        throw conflict('source_transcript_repository_record_too_large')
      }
      const disposition = await input.objectPort.createOnly({
        objectPath: objectPath(prefix, scope),
        body,
        contentSha256: rawBufferSha256(body),
      })
      const reread = await readRecord(scope)
      if (!reread || stableAuthorityStringify(reread) !==
        stableAuthorityStringify(record)) {
        throw conflict('source_transcript_repository_create_reread_mismatch')
      }
      return Object.freeze({
        disposition: disposition === 'created'
          ? 'created' as const
          : 'identical_replay' as const,
        repositoryRecordRef: Object.freeze({
          id: `source-transcript-record-${record.recordDigestSha256.slice(0, 32)}`,
          version: 1,
          contentHash: `sha256:${rawBufferSha256(body)}`,
        }),
        transcriptAuthorityRef: cloneRef(result.transcriptAuthorityRef),
        exactCreateOnlyRereadVerified: true as const,
        gpuJobStarted: false as const,
        providerCalled: false as const,
        customerCreditMutated: false as const,
        publicDeliveryGranted: false as const,
        productionAuthorityGranted: false as const,
      })
    },
    async readCompleted(
      untrustedScope: CanonicalSourceTranscriptOrchestraReadScope,
    ) {
      const record = await readRecord(untrustedScope)
      return record ? structuredClone(record.result) : null
    },
  })
}

function parseRecord(
  untrusted: unknown,
  expectedScope: CanonicalSourceTranscriptOrchestraReadScope,
): StoredTranscriptRecord {
  assertPlainSerializedData(untrusted, 'source_transcript_repository_record')
  if (!untrusted || typeof untrusted !== 'object' || Array.isArray(untrusted)) {
    throw conflict('source_transcript_repository_record_invalid')
  }
  const value = untrusted as Record<string, unknown>
  if (stableAuthorityStringify(Object.keys(value).sort()) !==
    stableAuthorityStringify([
      'boundary', 'evidenceClass', 'recordDigestSha256', 'result',
      'schemaVersion', 'scope', 'source',
    ])) throw conflict('source_transcript_repository_record_shape_invalid')
  const scope = parseScope(value.scope)
  const result = assertCanonicalVisualIntelligenceSourceTranscriptResult(
    value.result,
  )
  const boundary = closedBoundary()
  const withoutDigest = {
    schemaVersion:
      CANONICAL_SOURCE_TRANSCRIPT_ORCHESTRA_REPOSITORY_VERSION,
    source: 'canonical_source_transcript_execution_owner' as const,
    evidenceClass: 'canonical_private_reread' as const,
    scope,
    result,
    boundary,
  }
  if (
    value.schemaVersion !== withoutDigest.schemaVersion
    || value.source !== withoutDigest.source
    || value.evidenceClass !== withoutDigest.evidenceClass
    || stableAuthorityStringify(scope) !==
      stableAuthorityStringify(expectedScope)
    || stableAuthorityStringify(value.boundary) !==
      stableAuthorityStringify(boundary)
    || typeof value.recordDigestSha256 !== 'string'
    || value.recordDigestSha256 !== sha256AuthorityValue(withoutDigest)
  ) throw conflict('source_transcript_repository_record_authority_invalid')
  return Object.freeze({
    ...withoutDigest,
    recordDigestSha256: value.recordDigestSha256,
  })
}

function parseScope(
  untrusted: unknown,
): CanonicalSourceTranscriptOrchestraReadScope {
  assertPlainSerializedData(untrusted, 'source_transcript_repository_scope')
  const parsed = scopeSchema.parse(untrusted)
  const expectedFrameAuthority = createCanonicalSourceLedSourceFrameAuthority({
    fpsNumerator: parsed.sourceFrameAuthority.fpsNumerator,
    fpsDenominator: parsed.sourceFrameAuthority.fpsDenominator,
    frameCount: parsed.sourceFrameAuthority.frameCount,
    timeBaseNumerator: parsed.sourceFrameAuthority.timeBaseNumerator,
    timeBaseDenominator: parsed.sourceFrameAuthority.timeBaseDenominator,
  })
  if (
    stableAuthorityStringify(expectedFrameAuthority) !==
      stableAuthorityStringify(parsed.sourceFrameAuthority)
    || parsed.durationFrames !== parsed.sourceFrameAuthority.frameCount
    || refKey(parsed.finalizedMediaAuthorityRef) ===
      refKey(parsed.sourceProbeAuthorityRef)
  ) throw conflict('source_transcript_repository_scope_invalid')
  return Object.freeze(structuredClone(parsed))
}

function assertSourceMatchesScope(
  source: CanonicalSourceLedProfessionalContentAnalysisSource,
  scope: CanonicalSourceTranscriptOrchestraReadScope,
): void {
  const authority = source.managedApiAuthority
  if (!authority) throw conflict('source_transcript_managed_authority_missing')
  const frameAuthority = createCanonicalSourceLedSourceFrameAuthority({
    fpsNumerator: authority.fpsNumerator,
    fpsDenominator: authority.fpsDenominator,
    frameCount: authority.frameCount,
    timeBaseNumerator: authority.sourceTimeBaseNumerator!,
    timeBaseDenominator: authority.sourceTimeBaseDenominator!,
  })
  if (
    authority.ownerUserId !== scope.ownerUserId
    || source.sourceSequenceItemId !== scope.sourceSequenceItemId
    || source.mediaAssetId !== scope.mediaAssetId
    || source.uploadedOrder !== scope.uploadedOrder
    || source.checksumSha256 !== scope.checksumSha256
    || source.byteLength !== scope.byteLength
    || source.durationFrames !== scope.durationFrames
    || stableAuthorityStringify(frameAuthority) !==
      stableAuthorityStringify(scope.sourceFrameAuthority)
    || refKey(authority.finalizedMediaAuthorityRef) !==
      refKey(scope.finalizedMediaAuthorityRef)
    || refKey(authority.sourceProbeAuthorityRef) !==
      refKey(scope.sourceProbeAuthorityRef)
  ) throw conflict('source_transcript_repository_source_scope_mismatch')
}

function closedBoundary() {
  return Object.freeze({
    owner: 'canonical_quality_first_source_transcript_router' as const,
    exactSourceAndFrameAuthorityRequired: true as const,
    completeAudioTimelineRequired: true as const,
    a100PrimaryOrSeparatelyQualifiedL4FallbackRequired: true as const,
    repositoryMayDispatchGpuJob: false as const,
    repositoryMayCallReasoningProvider: false as const,
    repositoryMayMutateCredits: false as const,
    repositoryMayGrantQaApproval: false as const,
    repositoryMayGrantPublicDelivery: false as const,
    repositoryMayGrantProductionAuthority: false as const,
  })
}

function objectPath(
  prefix: string,
  scope: CanonicalSourceTranscriptOrchestraReadScope,
): string {
  return `${prefix}/${sha256AuthorityValue(scope)}.json`
}

function normalizePrefix(value: string): string {
  const normalized = value.trim().replace(/^\/+|\/+$/gu, '')
  if (
    !normalized
    || normalized.length > 600
    || normalized.includes('..')
    || normalized.includes('\\')
    || normalized.includes('//')
    || normalized.split('/').some((part) => !safeId.safeParse(part).success)
  ) throw conflict('source_transcript_repository_prefix_invalid')
  return normalized
}

function cloneRef(
  value: VisualIntelligenceEvidenceRef,
): VisualIntelligenceEvidenceRef {
  return Object.freeze({ ...value })
}

function refKey(value: VisualIntelligenceEvidenceRef): string {
  return `${value.id}:${value.version}:${value.contentHash}`
}

function rawBufferSha256(value: Buffer): string {
  return createHash('sha256').update(value).digest('hex')
}

function conflict(requiredGate: string): ApiError {
  return new ApiError(
    'IDEMPOTENCY_CONFLICT',
    'Canonical source transcript authority conflicts with its exact scope.',
    409,
    { requiredGate },
  )
}

function notReady(requiredGate: string): ApiError {
  return new ApiError(
    'TOOL_NOT_READY',
    'Canonical source transcript authority is not ready.',
    503,
    { requiredGate },
  )
}
