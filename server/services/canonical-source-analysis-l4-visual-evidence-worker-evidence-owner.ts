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
  assertPlainSerializedData,
} from './canonical-professional-gpu-job-lifecycle-service'
import {
  assertCanonicalSourceAnalysisL4VisualEvidenceWorkerBootstrap,
  type CanonicalSourceAnalysisL4VisualEvidenceWorkerBootstrap,
} from './canonical-source-analysis-l4-visual-evidence-worker-bootstrap-owner'
import {
  sha256AuthorityValue,
  stableAuthorityStringify,
} from './private-edit-authority-store'

export const
CANONICAL_SOURCE_ANALYSIS_L4_VISUAL_EVIDENCE_WORKER_EVIDENCE_OWNER_VERSION =
  'canonical-source-analysis-l4-visual-evidence-worker-evidence-owner-v1' as const
export const
CANONICAL_SOURCE_ANALYSIS_L4_VISUAL_EVIDENCE_WORKER_EVIDENCE_VERSION =
  'canonical-source-analysis-l4-visual-evidence-worker-evidence-v1' as const

const DEFAULT_PREFIX =
  'private/orchestra/v1/source-analysis-l4-visual-evidence-worker-evidence'
const safeId = z.string().trim().min(1).max(240)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/u)
  .refine((value) => !value.includes('..'))
const rawSha256 = z.string().regex(/^[a-f0-9]{64}$/u)
const positiveInteger = z.number().int().positive().safe()
const nonnegativeInteger = z.number().int().nonnegative().safe()
const timestamp = z.string().datetime({ offset: true })
const evidenceRefSchema = z.object({
  id: safeId,
  version: positiveInteger,
  contentHash: z.string().regex(/^sha256:[a-f0-9]{64}$/u),
}).strict()
const roles = [
  'media_probe',
  'private_media_transform',
  'scene_detection',
  'pixel_measurement',
  'exact_visible_text',
  'sampling_policy',
] as const
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
    operationId: VISUAL_INTELLIGENCE_CANONICAL_TOOL_OPERATION_IDS.pyscenedetect,
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

const toolEvidenceSchema = z.object({
  role: z.enum(roles),
  tool: z.enum(['ffprobe', 'ffmpeg', 'pyscenedetect', 'opencv', 'ocr']),
  operationId: safeId,
  toolVersion: z.string().trim().min(1).max(240),
  evidenceRef: evidenceRefSchema,
  runtimeReleaseRef: evidenceRefSchema,
  executionRef: evidenceRefSchema,
  exactSourceChecksumBound: z.literal(true),
  exactCanonicalResultRereadVerified: z.literal(true),
  substantiveCpuExecutionUsed: z.literal(false),
}).strict()

const evidenceWithoutDigestSchema = z.object({
  schemaVersion: z.literal(
    CANONICAL_SOURCE_ANALYSIS_L4_VISUAL_EVIDENCE_WORKER_EVIDENCE_VERSION,
  ),
  source: z.literal(
    'canonical_l4_source_visual_evidence_private_gpu_worker',
  ),
  evidenceClass: z.literal('canonical_private_reread'),
  invocationId: safeId,
  bootstrapRef: evidenceRefSchema,
  envelopeRef: evidenceRefSchema,
  consumptionRef: evidenceRefSchema,
  admissionRef: evidenceRefSchema,
  releaseRef: evidenceRefSchema,
  cloudRunOperationRef: evidenceRefSchema,
  sourceObjectIdentityDigestSha256: rawSha256,
  sourceTimelineDigestSha256: rawSha256,
  sourceProbeAuthorityRef: evidenceRefSchema,
  acceleratorClass: z.literal('nvidia_l4'),
  allocatedGpuCount: z.literal(1),
  gpuDeviceEvidenceRef: evidenceRefSchema,
  cudaRuntimeEvidenceRef: evidenceRefSchema,
  gpuDecodeEvidenceRef: evidenceRefSchema,
  completeSourceCoverageEvidenceRef: evidenceRefSchema,
  toolEvidence: z.array(toolEvidenceSchema).length(roles.length),
  exactGenerationEtagChecksumAndLengthRereadVerified: z.literal(true),
  substantiveGpuExecutionVerified: z.literal(true),
  gpuDecodeVerified: z.literal(true),
  allCanonicalSourceFramesAccountedFor: z.literal(true),
  skippedCanonicalFrameCount: z.literal(0),
  substantiveCpuMediaProcessingUsed: z.literal(false),
  runtimeNetworkDownloadPerformed: z.literal(false),
  callerPathUrlBytesCommandOrEnvironmentAccepted: z.literal(false),
  workerStartedAt: timestamp,
  workerCompletedAt: timestamp,
  activeExecutionMilliseconds: positiveInteger,
  persistedPrivateArtifactBytes: nonnegativeInteger,
  classAOperationCount: positiveInteger,
  classBOperationCount: positiveInteger,
  terminalCloudRunExecutionClaimed: z.literal(false),
  scaleBackToZeroClaimedByWorker: z.literal(false),
  accountEffectiveCostClaimedByWorker: z.literal(false),
  customerCreditMutated: z.literal(false),
  publicDeliveryGranted: z.literal(false),
  productionAuthorityGranted: z.literal(false),
}).strict()
const evidenceSchema = evidenceWithoutDigestSchema.extend({
  workerEvidenceDigestSha256: rawSha256,
}).strict()
export type CanonicalSourceAnalysisL4VisualEvidenceWorkerEvidence = z.infer<
  typeof evidenceSchema
>

const recordWithoutDigestSchema = z.object({
  schemaVersion: z.literal(
    CANONICAL_SOURCE_ANALYSIS_L4_VISUAL_EVIDENCE_WORKER_EVIDENCE_OWNER_VERSION,
  ),
  recordKind: z.literal('worker_evidence'),
  evidence: evidenceSchema,
}).strict()
const recordSchema = recordWithoutDigestSchema.extend({
  recordDigestSha256: rawSha256,
}).strict()

export interface CanonicalSourceAnalysisL4VisualEvidenceWorkerEvidenceOwner {
  readonly schemaVersion:
    typeof CANONICAL_SOURCE_ANALYSIS_L4_VISUAL_EVIDENCE_WORKER_EVIDENCE_OWNER_VERSION
  persistCreateOnly(input: Readonly<{
    bootstrap: CanonicalSourceAnalysisL4VisualEvidenceWorkerBootstrap
    evidence: CanonicalSourceAnalysisL4VisualEvidenceWorkerEvidence
  }>): Promise<Readonly<{
    disposition: 'created' | 'identical_replay'
    workerEvidenceRef: VisualIntelligenceEvidenceRef
    exactCreateOnlyRereadVerified: true
    terminalCloudRunExecutionClaimed: false
    scaleBackToZeroClaimedByWorker: false
    customerCreditMutated: false
  }>>
  readExact(invocationId: string): Promise<
    CanonicalSourceAnalysisL4VisualEvidenceWorkerEvidence | null
  >
}

export function createCanonicalSourceAnalysisL4VisualEvidenceWorkerEvidence(
  input: Omit<z.input<typeof evidenceWithoutDigestSchema>,
    'schemaVersion' | 'source' | 'evidenceClass'> & Readonly<{
      bootstrap: CanonicalSourceAnalysisL4VisualEvidenceWorkerBootstrap
    }>,
): CanonicalSourceAnalysisL4VisualEvidenceWorkerEvidence {
  assertPlainSerializedData(input, 'source_visual_worker_evidence_input')
  const bootstrap = assertCanonicalSourceAnalysisL4VisualEvidenceWorkerBootstrap(
    input.bootstrap,
  )
  const { bootstrap: ignoredBootstrap, ...provided } = input
  void ignoredBootstrap
  const payload = evidenceWithoutDigestSchema.parse({
    schemaVersion:
      CANONICAL_SOURCE_ANALYSIS_L4_VISUAL_EVIDENCE_WORKER_EVIDENCE_VERSION,
    source: 'canonical_l4_source_visual_evidence_private_gpu_worker',
    evidenceClass: 'canonical_private_reread',
    ...provided,
  })
  assertEvidenceBindings(payload, bootstrap)
  return assertCanonicalSourceAnalysisL4VisualEvidenceWorkerEvidence({
    ...payload,
    workerEvidenceDigestSha256: sha256AuthorityValue(payload),
  })
}

export function assertCanonicalSourceAnalysisL4VisualEvidenceWorkerEvidence(
  value: unknown,
): CanonicalSourceAnalysisL4VisualEvidenceWorkerEvidence {
  assertPlainSerializedData(value, 'source_visual_worker_evidence')
  const evidence = evidenceSchema.parse(value)
  const { workerEvidenceDigestSha256, ...payload } = evidence
  if (workerEvidenceDigestSha256 !== sha256AuthorityValue(payload)) {
    throw conflict('source_visual_worker_evidence_digest_invalid')
  }
  return Object.freeze(evidence)
}

export function
createCanonicalSourceAnalysisL4VisualEvidenceWorkerEvidenceOwner(input: Readonly<{
  objectPort: CanonicalCreateOnlyJsonObjectPort
  prefix?: string
}>): CanonicalSourceAnalysisL4VisualEvidenceWorkerEvidenceOwner {
  if (
    typeof input.objectPort?.createOnly !== 'function'
    || typeof input.objectPort?.readExact !== 'function'
  ) throw notReady('source_visual_worker_evidence_object_port_invalid')
  const prefix = normalizePrefix(input.prefix ?? DEFAULT_PREFIX)
  const readExact = async (untrustedInvocationId: string) => {
    const invocationId = safeId.parse(untrustedInvocationId)
    const body = await input.objectPort.readExact(
      `${prefix}/${invocationId}.json`,
    )
    if (!body) return null
    if (!Buffer.isBuffer(body) || body.byteLength < 2
      || body.byteLength > 16 * 1024 * 1024) {
      throw conflict('source_visual_worker_evidence_bytes_invalid')
    }
    let parsed: unknown
    try {
      parsed = JSON.parse(body.toString('utf8'))
    } catch {
      throw conflict('source_visual_worker_evidence_json_invalid')
    }
    assertPlainSerializedData(parsed, 'source_visual_worker_evidence_record')
    const record = recordSchema.parse(parsed)
    const { recordDigestSha256, ...payload } = record
    if (
      recordDigestSha256 !== sha256AuthorityValue(payload)
      || record.evidence.invocationId !== invocationId
      || body.toString('utf8') !== stableAuthorityStringify(record)
    ) throw conflict('source_visual_worker_evidence_record_invalid')
    return structuredClone(
      assertCanonicalSourceAnalysisL4VisualEvidenceWorkerEvidence(
        record.evidence,
      ),
    )
  }
  return Object.freeze({
    schemaVersion:
      CANONICAL_SOURCE_ANALYSIS_L4_VISUAL_EVIDENCE_WORKER_EVIDENCE_OWNER_VERSION,
    async persistCreateOnly({
      bootstrap: rawBootstrap,
      evidence: rawEvidence,
    }: Readonly<{
      bootstrap: CanonicalSourceAnalysisL4VisualEvidenceWorkerBootstrap
      evidence: CanonicalSourceAnalysisL4VisualEvidenceWorkerEvidence
    }>) {
      const bootstrap = assertCanonicalSourceAnalysisL4VisualEvidenceWorkerBootstrap(
        rawBootstrap,
      )
      const evidence = assertCanonicalSourceAnalysisL4VisualEvidenceWorkerEvidence(
        rawEvidence,
      )
      assertEvidenceBindings(evidence, bootstrap)
      const payload = recordWithoutDigestSchema.parse({
        schemaVersion:
          CANONICAL_SOURCE_ANALYSIS_L4_VISUAL_EVIDENCE_WORKER_EVIDENCE_OWNER_VERSION,
        recordKind: 'worker_evidence',
        evidence,
      })
      const record = recordSchema.parse({
        ...payload,
        recordDigestSha256: sha256AuthorityValue(payload),
      })
      const body = Buffer.from(stableAuthorityStringify(record), 'utf8')
      const created = await input.objectPort.createOnly({
        objectPath: `${prefix}/${evidence.invocationId}.json`,
        body,
        contentSha256: createHash('sha256').update(body).digest('hex'),
      })
      const reread = await readExact(evidence.invocationId)
      if (!reread || stableAuthorityStringify(reread) !==
        stableAuthorityStringify(evidence)) {
        throw conflict('source_visual_worker_evidence_reread_mismatch')
      }
      return Object.freeze({
        disposition: created === 'created'
          ? 'created' as const
          : 'identical_replay' as const,
        workerEvidenceRef: ref(
          `${evidence.invocationId}.worker-evidence`,
          evidence.workerEvidenceDigestSha256,
        ),
        exactCreateOnlyRereadVerified: true as const,
        terminalCloudRunExecutionClaimed: false as const,
        scaleBackToZeroClaimedByWorker: false as const,
        customerCreditMutated: false as const,
      })
    },
    readExact,
  })
}

function assertEvidenceBindings(
  evidence: z.infer<typeof evidenceWithoutDigestSchema>
    | CanonicalSourceAnalysisL4VisualEvidenceWorkerEvidence,
  bootstrap: CanonicalSourceAnalysisL4VisualEvidenceWorkerBootstrap,
): void {
  const roleOrder = evidence.toolEvidence.map((item) => item.role)
  const evidenceRefs = evidence.toolEvidence.map((item) => refKey(
    item.evidenceRef,
  ))
  const executionRefs = evidence.toolEvidence.map((item) => refKey(
    item.executionRef,
  ))
  const elapsed = Date.parse(evidence.workerCompletedAt)
    - Date.parse(evidence.workerStartedAt)
  if (
    evidence.invocationId !== bootstrap.invocationId
    || !sameRef(evidence.bootstrapRef,
      ref(`${bootstrap.invocationId}.bootstrap`,
        bootstrap.bootstrapDigestSha256))
    || !sameRef(evidence.envelopeRef, bootstrap.envelopeRef)
    || !sameRef(evidence.consumptionRef, bootstrap.consumptionRef)
    || !sameRef(evidence.admissionRef, bootstrap.admissionRef)
    || !sameRef(evidence.releaseRef, bootstrap.releaseRef)
    || !sameRef(evidence.cloudRunOperationRef,
      bootstrap.cloudRunOperationRef)
    || evidence.sourceObjectIdentityDigestSha256 !==
      sha256AuthorityValue(bootstrap.sourceObject)
    || evidence.sourceTimelineDigestSha256 !==
      sha256AuthorityValue(bootstrap.sourceTimeline)
    || !sameRef(evidence.sourceProbeAuthorityRef,
      bootstrap.sourceTimeline.sourceProbeAuthorityRef)
    || stableAuthorityStringify(roleOrder) !== stableAuthorityStringify(roles)
    || new Set(evidenceRefs).size !== evidenceRefs.length
    || new Set(executionRefs).size !== executionRefs.length
    || !sameRef(evidence.toolEvidence[0]!.evidenceRef,
      bootstrap.sourceTimeline.sourceProbeAuthorityRef)
    || evidence.toolEvidence.some((item, index) => {
      const expected = roleDefinitions[item.role]
      const release = bootstrap.toolReleaseRefs[index]
      return item.tool !== expected.tool
        || item.operationId !== expected.operationId
        || !release
        || release.role !== item.role
        || release.operationId !== item.operationId
        || !sameRef(release.runtimeReleaseRef, item.runtimeReleaseRef)
    })
    || !Number.isFinite(elapsed)
    || elapsed !== evidence.activeExecutionMilliseconds
  ) throw conflict('source_visual_worker_evidence_binding_invalid')
}

function normalizePrefix(value: string): string {
  const prefix = value.replace(/^\/+|\/+$/gu, '')
  if (!prefix || prefix.includes('..') || prefix.includes('//')
    || !/^[A-Za-z0-9][A-Za-z0-9._/:-]{0,1023}$/u.test(prefix)) {
    throw notReady('source_visual_worker_evidence_prefix_invalid')
  }
  return prefix
}

function ref(id: string, hash: string): VisualIntelligenceEvidenceRef {
  return Object.freeze({ id, version: 1, contentHash: `sha256:${hash}` })
}

function refKey(value: VisualIntelligenceEvidenceRef): string {
  return `${value.id}:${value.version}:${value.contentHash}`
}

function sameRef(
  left: VisualIntelligenceEvidenceRef,
  right: VisualIntelligenceEvidenceRef,
): boolean {
  return refKey(left) === refKey(right)
}

function conflict(requiredGate: string): ApiError {
  return new ApiError(
    'IDEMPOTENCY_CONFLICT',
    'The L4 source visual evidence worker output conflicts with authority.',
    409,
    { requiredGate },
  )
}

function notReady(requiredGate: string): ApiError {
  return new ApiError(
    'TOOL_NOT_READY',
    'The L4 source visual evidence worker output owner is not ready.',
    503,
    { requiredGate },
  )
}
