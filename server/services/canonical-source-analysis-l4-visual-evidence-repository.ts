import { createHash } from 'node:crypto'

import { z } from 'zod'

import type {
  VisualIntelligenceEvidenceRef,
} from '../../src/types/visual-intelligence'
import { ApiError } from '../errors/api-error'
import {
  VISUAL_INTELLIGENCE_CANONICAL_TOOL_OPERATION_IDS,
} from '../visual-intelligence/visual-intelligence-orchestra-capability-manifest'
import type {
  CanonicalCreateOnlyJsonObjectPort,
} from './canonical-gcs-source-analysis-lifecycle-store'
import {
  canonicalSourceLedSourceFrameAuthoritySchema,
} from './canonical-source-led-content-analysis-evidence'
import type {
  CanonicalSourceTranscriptOrchestraReadScope,
} from './canonical-source-led-orchestra-content-analysis-reconciliation'
import {
  assertPlainSerializedData,
} from './canonical-professional-gpu-job-lifecycle-service'
import {
  sha256AuthorityValue,
  stableAuthorityStringify,
} from './private-edit-authority-store'

export const CANONICAL_SOURCE_ANALYSIS_L4_VISUAL_EVIDENCE_RESULT_VERSION =
  'canonical-source-analysis-l4-visual-evidence-result-v1' as const
export const CANONICAL_SOURCE_ANALYSIS_L4_VISUAL_EVIDENCE_READ_PORT_VERSION =
  'canonical-source-analysis-l4-visual-evidence-read-port-v1' as const
export const CANONICAL_SOURCE_ANALYSIS_L4_VISUAL_EVIDENCE_REPOSITORY_VERSION =
  'canonical-source-analysis-l4-visual-evidence-repository-v1' as const
export const CANONICAL_SOURCE_ANALYSIS_L4_VISUAL_EVIDENCE_OPERATION_ID =
  'internal.visual_intelligence.prepare_source_visual_evidence.v1' as const

const DEFAULT_PREFIX =
  'private/orchestra/v1/source-analysis-l4-visual-evidence'
const MAXIMUM_RECORD_BYTES = 16 * 1024 * 1024
const SAFE_ID = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,239}$/u
const RAW_SHA256 = /^[a-f0-9]{64}$/u
const PREFIXED_SHA256 = /^sha256:[a-f0-9]{64}$/u
const STORAGE_BUCKET = /^[a-z0-9][a-z0-9._-]{1,220}[a-z0-9]$/u
const STORAGE_PATH = /^[A-Za-z0-9][A-Za-z0-9._/:-]{0,1023}$/u

const safeId = z.string().regex(SAFE_ID).refine((value) =>
  !value.includes('..'))
const rawSha256 = z.string().regex(RAW_SHA256)
const prefixedSha256 = z.string().regex(PREFIXED_SHA256)
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
  uploadedOrder: positiveInteger.max(64),
  checksumSha256: rawSha256,
  byteLength: positiveInteger,
  durationFrames: positiveInteger,
  sourceFrameAuthority: canonicalSourceLedSourceFrameAuthoritySchema,
  finalizedMediaAuthorityRef: evidenceRefSchema,
  sourceProbeAuthorityRef: evidenceRefSchema,
}).strict()
const sourceObjectSchema = z.object({
  storageProvider: z.literal('google_cloud_storage'),
  storageBucket: z.string().regex(STORAGE_BUCKET),
  storagePath: z.string().regex(STORAGE_PATH)
    .refine((value) => !value.includes('..') && !value.includes('//')),
  storageGeneration: z.string().regex(/^[1-9][0-9]{0,30}$/u),
  storageEtag: z.string().trim().min(1).max(1_024)
    .refine((value) => !/[\0\r\n]/u.test(value)),
  contentType: z.literal('video/mp4'),
  checksumSha256: rawSha256,
  byteLength: positiveInteger,
  finalizedStorageObjectAuthorityRef: evidenceRefSchema,
  exactGenerationEtagChecksumAndLengthRereadVerified: z.literal(true),
}).strict()

const roles = [
  'media_probe',
  'private_media_transform',
  'scene_detection',
  'pixel_measurement',
  'exact_visible_text',
  'sampling_policy',
] as const
export type CanonicalSourceAnalysisL4VisualEvidenceRole =
  typeof roles[number]

const roleDefinitions = Object.freeze({
  media_probe: {
    tool: 'ffprobe',
    operationId: VISUAL_INTELLIGENCE_CANONICAL_TOOL_OPERATION_IDS.ffprobe,
  },
  private_media_transform: {
    tool: 'ffmpeg',
    operationId: VISUAL_INTELLIGENCE_CANONICAL_TOOL_OPERATION_IDS.ffmpeg,
  },
  scene_detection: {
    tool: 'pyscenedetect',
    operationId:
      VISUAL_INTELLIGENCE_CANONICAL_TOOL_OPERATION_IDS.pyscenedetect,
  },
  pixel_measurement: {
    tool: 'opencv',
    operationId: VISUAL_INTELLIGENCE_CANONICAL_TOOL_OPERATION_IDS.opencv,
  },
  exact_visible_text: {
    tool: 'ocr',
    operationId: VISUAL_INTELLIGENCE_CANONICAL_TOOL_OPERATION_IDS.paddleocr,
  },
  sampling_policy: {
    tool: 'ffmpeg',
    operationId: VISUAL_INTELLIGENCE_CANONICAL_TOOL_OPERATION_IDS.ffmpeg,
  },
} as const)

const toolItemSchema = z.object({
  role: z.enum(roles),
  tool: z.enum([
    'ffprobe', 'ffmpeg', 'pyscenedetect', 'opencv', 'ocr',
  ]),
  operationId: safeId,
  toolVersion: z.string().trim().min(1).max(240),
  evidenceRef: evidenceRefSchema,
  runtimeReleaseRef: evidenceRefSchema,
  executionRef: evidenceRefSchema,
  exactSourceChecksumBound: z.literal(true),
  exactCanonicalResultRereadVerified: z.literal(true),
  substantiveCpuExecutionUsed: z.literal(false),
}).strict()

const resultWithoutDigestSchema = z.object({
  schemaVersion: z.literal(
    CANONICAL_SOURCE_ANALYSIS_L4_VISUAL_EVIDENCE_RESULT_VERSION,
  ),
  source: z.literal('canonical_l4_source_visual_evidence_execution_owner'),
  evidenceClass: z.literal('canonical_private_reread'),
  scope: scopeSchema,
  sourceObject: sourceObjectSchema,
  operationId: z.literal(
    CANONICAL_SOURCE_ANALYSIS_L4_VISUAL_EVIDENCE_OPERATION_ID,
  ),
  routeProfileId: z.literal('quality_l4_user_triggered_standard_media_job_v1'),
  acceleratorClass: z.literal('nvidia_l4'),
  cloudRunJobName: z.literal('reeditpro-professional-l4'),
  cloudRunExecutionRef: evidenceRefSchema,
  attemptCostEvidenceRef: evidenceRefSchema,
  toolEvidence: z.array(toolItemSchema).length(roles.length),
  userTriggeredScaleFromZero: z.literal(true),
  minimumIdleInstances: z.literal(0),
  maximumAttempts: z.literal(1),
  uncertainOutcomeRetryAllowed: z.literal(false),
  runtimeNetworkDownloadPerformed: z.literal(false),
  exactSourceReleaseExecutionAndCostRereadVerified: z.literal(true),
  privateEvidencePersistedAndReread: z.literal(true),
  browserOrCallerEvidenceAccepted: z.literal(false),
  callerPathUrlBytesCommandOrEnvironmentAccepted: z.literal(false),
  customerCreditMutated: z.literal(false),
  systemFailureChargedToCustomer: z.literal(false),
  unapprovedOverageChargedToCustomer: z.literal(false),
  directProviderCallMade: z.literal(false),
  directTimelineMutationPerformed: z.literal(false),
  qaApprovalGranted: z.literal(false),
  publicDeliveryGranted: z.literal(false),
  productionAuthorityGranted: z.literal(false),
}).strict()
const resultSchema = resultWithoutDigestSchema.extend({
  resultDigestSha256: rawSha256,
}).strict()

export type CanonicalSourceAnalysisL4VisualEvidenceResult = z.infer<
  typeof resultSchema
>

export interface CanonicalSourceAnalysisL4VisualEvidenceReadPort {
  readonly schemaVersion:
    typeof CANONICAL_SOURCE_ANALYSIS_L4_VISUAL_EVIDENCE_READ_PORT_VERSION
  readCompleted(
    scope: CanonicalSourceTranscriptOrchestraReadScope,
  ): Promise<CanonicalSourceAnalysisL4VisualEvidenceResult | null>
}

export interface CanonicalSourceAnalysisL4VisualEvidenceRepository
  extends CanonicalSourceAnalysisL4VisualEvidenceReadPort {
  readonly repositoryVersion:
    typeof CANONICAL_SOURCE_ANALYSIS_L4_VISUAL_EVIDENCE_REPOSITORY_VERSION
  persistCreateOnly(input: Readonly<{
    scope: CanonicalSourceTranscriptOrchestraReadScope
    result: CanonicalSourceAnalysisL4VisualEvidenceResult
  }>): Promise<Readonly<{
    disposition: 'created' | 'identical_replay'
    repositoryRecordRef: VisualIntelligenceEvidenceRef
    exactCreateOnlyRereadVerified: true
    gpuJobStarted: false
    providerCalled: false
    customerCreditMutated: false
    publicDeliveryGranted: false
    productionAuthorityGranted: false
  }>>
}

interface StoredRecord {
  readonly schemaVersion:
    typeof CANONICAL_SOURCE_ANALYSIS_L4_VISUAL_EVIDENCE_REPOSITORY_VERSION
  readonly source: 'canonical_source_analysis_l4_visual_evidence_repository'
  readonly evidenceClass: 'canonical_private_reread'
  readonly scope: CanonicalSourceTranscriptOrchestraReadScope
  readonly result: CanonicalSourceAnalysisL4VisualEvidenceResult
  readonly recordDigestSha256: string
}

export function createCanonicalSourceAnalysisL4VisualEvidenceResult(
  input: Omit<
    CanonicalSourceAnalysisL4VisualEvidenceResult,
    'schemaVersion' | 'source' | 'evidenceClass' | 'resultDigestSha256'
  >,
): CanonicalSourceAnalysisL4VisualEvidenceResult {
  assertPlainSerializedData(input, 'source_analysis_l4_visual_evidence_input')
  const payload = resultWithoutDigestSchema.parse({
    schemaVersion:
      CANONICAL_SOURCE_ANALYSIS_L4_VISUAL_EVIDENCE_RESULT_VERSION,
    source: 'canonical_l4_source_visual_evidence_execution_owner',
    evidenceClass: 'canonical_private_reread',
    ...input,
  })
  assertResultSemantics(payload)
  return Object.freeze(resultSchema.parse({
    ...payload,
    resultDigestSha256: sha256AuthorityValue(payload),
  }))
}

export function assertCanonicalSourceAnalysisL4VisualEvidenceResult(
  value: unknown,
): CanonicalSourceAnalysisL4VisualEvidenceResult {
  assertPlainSerializedData(value, 'source_analysis_l4_visual_evidence_result')
  const result = resultSchema.parse(value)
  const { resultDigestSha256, ...payload } = result
  if (resultDigestSha256 !== sha256AuthorityValue(payload)) {
    throw conflict('source_analysis_l4_visual_evidence_digest_invalid')
  }
  assertResultSemantics(payload)
  return Object.freeze(result)
}

export function createCanonicalSourceAnalysisL4VisualEvidenceRepository(
  input: Readonly<{
    objectPort: CanonicalCreateOnlyJsonObjectPort
    prefix?: string
  }>,
): CanonicalSourceAnalysisL4VisualEvidenceRepository {
  if (
    typeof input.objectPort?.createOnly !== 'function'
    || typeof input.objectPort?.readExact !== 'function'
  ) throw notReady('source_analysis_l4_visual_evidence_object_port_invalid')
  const prefix = normalizePrefix(input.prefix ?? DEFAULT_PREFIX)

  const readRecord = async (
    untrustedScope: CanonicalSourceTranscriptOrchestraReadScope,
  ): Promise<StoredRecord | null> => {
    const scope = parseScope(untrustedScope)
    const body = await input.objectPort.readExact(recordPath(prefix, scope))
    if (!body) return null
    if (
      !Buffer.isBuffer(body)
      || body.byteLength < 2
      || body.byteLength > MAXIMUM_RECORD_BYTES
    ) throw conflict('source_analysis_l4_visual_evidence_bytes_invalid')
    let value: unknown
    try {
      value = JSON.parse(body.toString('utf8'))
    } catch {
      throw conflict('source_analysis_l4_visual_evidence_json_invalid')
    }
    const record = parseRecord(value, scope)
    if (body.toString('utf8') !== stableAuthorityStringify(record)) {
      throw conflict('source_analysis_l4_visual_evidence_not_canonical')
    }
    return record
  }

  return Object.freeze({
    schemaVersion:
      CANONICAL_SOURCE_ANALYSIS_L4_VISUAL_EVIDENCE_READ_PORT_VERSION,
    repositoryVersion:
      CANONICAL_SOURCE_ANALYSIS_L4_VISUAL_EVIDENCE_REPOSITORY_VERSION,
    async persistCreateOnly(untrusted) {
      assertPlainSerializedData(
        untrusted,
        'source_analysis_l4_visual_evidence_persistence_input',
      )
      const scope = parseScope(untrusted.scope)
      const result = assertCanonicalSourceAnalysisL4VisualEvidenceResult(
        untrusted.result,
      )
      assertResultMatchesScope(result, scope)
      const withoutDigest = {
        schemaVersion:
          CANONICAL_SOURCE_ANALYSIS_L4_VISUAL_EVIDENCE_REPOSITORY_VERSION,
        source:
          'canonical_source_analysis_l4_visual_evidence_repository' as const,
        evidenceClass: 'canonical_private_reread' as const,
        scope,
        result,
      }
      const record: StoredRecord = Object.freeze({
        ...withoutDigest,
        recordDigestSha256: sha256AuthorityValue(withoutDigest),
      })
      const body = Buffer.from(stableAuthorityStringify(record), 'utf8')
      if (body.byteLength > MAXIMUM_RECORD_BYTES) throw conflict(
        'source_analysis_l4_visual_evidence_record_too_large',
      )
      const disposition = await input.objectPort.createOnly({
        objectPath: recordPath(prefix, scope),
        body,
        contentSha256: rawBufferSha256(body),
      })
      const reread = await readRecord(scope)
      if (!reread || stableAuthorityStringify(reread) !==
        stableAuthorityStringify(record)) throw conflict(
        'source_analysis_l4_visual_evidence_create_reread_mismatch',
      )
      return Object.freeze({
        disposition: disposition === 'created'
          ? 'created' as const
          : 'identical_replay' as const,
        repositoryRecordRef: ref(
          `source-l4-visual-evidence-${record.recordDigestSha256.slice(0, 32)}`,
          rawBufferSha256(body),
        ),
        exactCreateOnlyRereadVerified: true as const,
        gpuJobStarted: false as const,
        providerCalled: false as const,
        customerCreditMutated: false as const,
        publicDeliveryGranted: false as const,
        productionAuthorityGranted: false as const,
      })
    },
    async readCompleted(untrustedScope) {
      const record = await readRecord(untrustedScope)
      return record ? structuredClone(record.result) : null
    },
  })
}

function assertResultSemantics(
  result: z.infer<typeof resultWithoutDigestSchema>,
): void {
  const scope = parseScope(result.scope)
  const expectedRoles = [...roles]
  const actualRoles = result.toolEvidence.map((item) => item.role)
  const evidenceRefs = result.toolEvidence.map((item) => refKey(
    item.evidenceRef,
  ))
  const executionRefs = result.toolEvidence.map((item) => refKey(
    item.executionRef,
  ))
  if (
    stableAuthorityStringify(actualRoles) !==
      stableAuthorityStringify(expectedRoles)
    || result.toolEvidence.some((item) => {
      const expected = roleDefinitions[item.role]
      return item.tool !== expected.tool
        || item.operationId !== expected.operationId
        || refKey(item.runtimeReleaseRef) === refKey(item.executionRef)
    })
    || new Set(evidenceRefs).size !== evidenceRefs.length
    || new Set(executionRefs).size !== executionRefs.length
    || result.sourceObject.checksumSha256 !== scope.checksumSha256
    || result.sourceObject.byteLength !== scope.byteLength
  ) throw conflict('source_analysis_l4_visual_evidence_semantics_invalid')
}

function parseRecord(
  untrusted: unknown,
  expectedScope: CanonicalSourceTranscriptOrchestraReadScope,
): StoredRecord {
  assertPlainSerializedData(untrusted, 'source_analysis_l4_visual_record')
  if (!untrusted || typeof untrusted !== 'object' || Array.isArray(untrusted)) {
    throw conflict('source_analysis_l4_visual_record_invalid')
  }
  const value = untrusted as Record<string, unknown>
  const keys = [
    'evidenceClass', 'recordDigestSha256', 'result', 'schemaVersion', 'scope',
    'source',
  ].sort(compare)
  if (stableAuthorityStringify(Object.keys(value).sort(compare)) !==
    stableAuthorityStringify(keys)) throw conflict(
    'source_analysis_l4_visual_record_shape_invalid',
  )
  const scope = parseScope(value.scope)
  const result = assertCanonicalSourceAnalysisL4VisualEvidenceResult(
    value.result,
  )
  const withoutDigest = {
    schemaVersion:
      CANONICAL_SOURCE_ANALYSIS_L4_VISUAL_EVIDENCE_REPOSITORY_VERSION,
    source: 'canonical_source_analysis_l4_visual_evidence_repository' as const,
    evidenceClass: 'canonical_private_reread' as const,
    scope,
    result,
  }
  if (
    value.schemaVersion !== withoutDigest.schemaVersion
    || value.source !== withoutDigest.source
    || value.evidenceClass !== withoutDigest.evidenceClass
    || stableAuthorityStringify(scope) !==
      stableAuthorityStringify(expectedScope)
    || typeof value.recordDigestSha256 !== 'string'
    || value.recordDigestSha256 !== sha256AuthorityValue(withoutDigest)
  ) throw conflict('source_analysis_l4_visual_record_authority_invalid')
  assertResultMatchesScope(result, scope)
  return Object.freeze({
    ...withoutDigest,
    recordDigestSha256: value.recordDigestSha256,
  })
}

function assertResultMatchesScope(
  result: CanonicalSourceAnalysisL4VisualEvidenceResult,
  scope: CanonicalSourceTranscriptOrchestraReadScope,
): void {
  if (stableAuthorityStringify(result.scope) !== stableAuthorityStringify(scope)) {
    throw conflict('source_analysis_l4_visual_evidence_scope_mismatch')
  }
}

function parseScope(
  value: unknown,
): CanonicalSourceTranscriptOrchestraReadScope {
  assertPlainSerializedData(value, 'source_analysis_l4_visual_scope')
  return Object.freeze(scopeSchema.parse(value))
}

function recordPath(
  prefix: string,
  scope: CanonicalSourceTranscriptOrchestraReadScope,
): string {
  return `${prefix}/${sha256AuthorityValue(scope)}.json`
}

function normalizePrefix(value: string): string {
  const normalized = value.replace(/^\/+|\/+$/gu, '')
  if (
    !normalized
    || normalized.includes('..')
    || !STORAGE_PATH.test(normalized)
  ) throw notReady('source_analysis_l4_visual_evidence_prefix_invalid')
  return normalized
}

function ref(id: string, rawHash: string): VisualIntelligenceEvidenceRef {
  if (!SAFE_ID.test(id) || !RAW_SHA256.test(rawHash)) throw conflict(
    'source_analysis_l4_visual_evidence_ref_invalid',
  )
  return Object.freeze({
    id,
    version: 1,
    contentHash: `sha256:${rawHash}`,
  })
}

function refKey(value: VisualIntelligenceEvidenceRef): string {
  return `${value.id}:${value.version}:${value.contentHash}`
}

function rawBufferSha256(value: Buffer): string {
  return createHash('sha256').update(value).digest('hex')
}

function compare(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0
}

function conflict(requiredGate: string): ApiError {
  return new ApiError(
    'IDEMPOTENCY_CONFLICT',
    'Canonical source Visual Intelligence L4 evidence conflicts with its immutable authority.',
    409,
    { requiredGate },
  )
}

function notReady(requiredGate: string): ApiError {
  return new ApiError(
    'TOOL_NOT_READY',
    'Canonical source Visual Intelligence L4 evidence is not ready.',
    503,
    { requiredGate },
  )
}
