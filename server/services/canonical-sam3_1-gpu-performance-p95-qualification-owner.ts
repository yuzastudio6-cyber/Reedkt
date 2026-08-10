import { createHash } from 'node:crypto'

import { Storage } from '@google-cloud/storage'
import { z } from 'zod'

import {
  createCanonicalGcsSourceAnalysisJsonObjectPort,
  type CanonicalCreateOnlyJsonObjectPort,
} from './canonical-gcs-source-analysis-lifecycle-store'
import {
  assertPlainSerializedData,
} from './canonical-professional-gpu-job-lifecycle-service'
import {
  assertCanonicalSam31GpuCompleteSourcePerformanceEvidence,
  canonicalSam31GpuCompleteSourcePerformanceEvidenceRef,
  createCanonicalSam31GpuCompleteSourcePerformanceRepository,
  type CanonicalSam31GpuCompleteSourcePerformanceEvidence,
} from './canonical-sam3_1-gpu-complete-source-performance-owner'
import {
  CANONICAL_SAM3_1_GPU_RUNTIME_QUALIFICATION_COMPONENT_EVIDENCE_VERSION,
  buildCanonicalSam31GpuRuntimeQualificationComponentEvidence,
  canonicalSam31GpuRuntimeQualificationComponentRef,
  type CanonicalSam31GpuRuntimeQualificationComponentEvidence,
} from './canonical-sam3_1-gpu-runtime-qualification-compilation-authority'
import {
  createCanonicalSam31GpuRuntimeQualificationComponentEvidenceRepository,
  type CanonicalSam31GpuRuntimeQualificationComponentEvidenceRepository,
} from './canonical-sam3_1-gpu-runtime-qualification-component-evidence-repository'
import {
  sha256AuthorityValue,
  stableAuthorityStringify,
} from './private-edit-authority-store'
export const CANONICAL_SAM3_1_GPU_PERFORMANCE_P95_EVIDENCE_VERSION =
  'canonical-sam3_1-gpu-performance-p95-evidence-v1' as const
export const CANONICAL_SAM3_1_GPU_PERFORMANCE_P95_OWNER_VERSION =
  'canonical-sam3_1-gpu-performance-p95-owner-v1' as const

const DEFAULT_PREFIX =
  'private/sam3_1/gpu-runtime-qualification/v1/performance-p95'
const MAXIMUM_RECORD_BYTES = 4 * 1024 * 1024
const safeId = z.string().trim().min(1).max(240)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:/+-]*$/u)
  .refine((value) => !value.includes('..'))
const sha256 = z.string().regex(/^[a-f0-9]{64}$/u)
const prefixedSha256 = z.string().regex(/^sha256:[a-f0-9]{64}$/u)
const timestamp = z.string().datetime({ offset: true })
const positiveInteger = z.number().int().positive().safe()
const nonnegativeInteger = z.number().int().nonnegative().safe()
const refSchema = z.object({
  id: safeId,
  version: z.literal(1),
  contentHash: prefixedSha256,
}).strict()
type EvidenceRef = z.infer<typeof refSchema>
const routeSchema = z.object({
  routeId: z.enum(['a100_80gb_heavy_primary', 'l4_heavy_fallback']),
  gpuProfileId: z.enum([
    'quality_a100_80gb_user_triggered_heavy_job_v1',
    'quality_l4_user_triggered_heavy_fallback_job_v1',
  ]),
  runtimeRegion: z.enum(['us-central1', 'europe-west4']),
  executionTarget: z.enum([
    'google_cloud_vertex_custom_job_a2_ultra',
    'google_cloud_run_l4_job',
  ]),
  machineType: z.enum(['a2-ultragpu-1g', 'cloud_run_nvidia_l4']),
  accelerator: z.enum(['nvidia_a100_80gb', 'nvidia_l4']),
}).strict()
const performanceMeasurementSchema = z.object({
  runOrdinal: z.number().int().min(1).max(30),
  fullSourceExecutionRef: refSchema,
  completeChunkResultSetRef: refSchema,
  terminalUsageAndCostReceiptSetRef: refSchema,
  wallTimeMilliseconds: positiveInteger,
  coldStartAndImagePullMilliseconds: nonnegativeInteger,
  modelLoadMilliseconds: nonnegativeInteger,
  decodePromptPropagationAndStitchMilliseconds: positiveInteger,
  outputPersistenceAndExactRereadMilliseconds: nonnegativeInteger,
  sourceResolutionAndCompleteFrameRangePreserved: z.literal(true),
  everyChunkResultAndTerminalCostReread: z.literal(true),
  allGpuCapacityStoppedAfterTerminal: z.literal(true),
  customerCreditsMutated: z.literal(false),
}).strict().superRefine((measurement, context) => {
  const phaseTotal = measurement.coldStartAndImagePullMilliseconds
    + measurement.modelLoadMilliseconds
    + measurement.decodePromptPropagationAndStitchMilliseconds
    + measurement.outputPersistenceAndExactRereadMilliseconds
  if (phaseTotal > measurement.wallTimeMilliseconds) context.addIssue({
    code: 'custom',
    message: 'SAM 3.1 p95 measurement phases exceed wall time.',
  })
})
const performancePayloadSchema = z.object({
  exactEightMinuteSourceRef: refSchema,
  sourceDurationMilliseconds: z.literal(480_000),
  sourceWidth: positiveInteger.max(16_384),
  sourceHeight: positiveInteger.max(16_384),
  sourceFrameCount: positiveInteger,
  fpsNumerator: positiveInteger,
  fpsDenominator: positiveInteger,
  measurements: z.array(performanceMeasurementSchema).min(5).max(30),
  p95WallTimeMilliseconds: positiveInteger,
  targetWallTimeMilliseconds: z.literal(480_000),
  completeSourceIntervalCovered: z.literal(true),
  automaticQualityReductionAllowed: z.literal(false),
}).strict().superRefine((performance, context) => {
  const ordinals = performance.measurements.map((value) => value.runOrdinal)
  const expectedP95 = nearestRankP95(
    performance.measurements.map((value) => value.wallTimeMilliseconds),
  )
  const duration = performance.sourceFrameCount
    * performance.fpsDenominator * 1_000 / performance.fpsNumerator
  const measurementRefs = performance.measurements.flatMap((value) => [
    value.fullSourceExecutionRef,
    value.completeChunkResultSetRef,
    value.terminalUsageAndCostReceiptSetRef,
  ])
  if (
    !ordinals.every((ordinal, index) => ordinal === index + 1)
    || new Set(measurementRefs.map(refKey)).size !== measurementRefs.length
    || expectedP95 !== performance.p95WallTimeMilliseconds
    || performance.p95WallTimeMilliseconds > 480_000
    || !Number.isInteger(duration)
    || duration !== 480_000
  ) context.addIssue({
    code: 'custom',
    message: 'SAM 3.1 p95 performance payload is inconsistent.',
  })
})

const p95WithoutHashSchema = z.object({
  schemaVersion: z.literal(
    CANONICAL_SAM3_1_GPU_PERFORMANCE_P95_EVIDENCE_VERSION,
  ),
  source: z.literal('canonical_sam3_1_gpu_performance_p95_owner'),
  evidenceClass: z.literal('canonical_complete_source_evidence_reread'),
  status: z.literal('performance_p95_evidence_ready'),
  performanceQualificationId: safeId,
  performanceQualificationVersion: z.literal(1),
  qualificationId: safeId,
  route: routeSchema,
  immutableImageDigest: prefixedSha256,
  exactEightMinuteSourceRef: refSchema,
  chunkPlanRef: refSchema,
  completeSourcePerformanceEvidenceRefs:
    z.array(refSchema).min(5).max(30),
  performanceEvidence: performancePayloadSchema,
  exactFiveToThirtyCompleteSourceEvidenceRecordsReread: z.literal(true),
  nearestRankP95Recomputed: z.literal(true),
  p95AtOrBelowEightMinutes: z.literal(true),
  routeImageSourceGeometryAndChunkPlanMatched: z.literal(true),
  callerMeasurementsOrP95Accepted: z.literal(false),
  liveGpuJobStarted: z.literal(false),
  customerCreditsMutated: z.literal(false),
  qaApprovalGranted: z.literal(false),
  publicDeliveryAuthorized: z.literal(false),
  productionAuthorityGranted: z.literal(false),
  qualifiedAt: timestamp,
}).strict().superRefine((value, context) => {
  const refs = value.completeSourcePerformanceEvidenceRefs
  const uniqueRefs = new Set(refs.map(refKey)).size === refs.length
  const sameSource = sameRef(
    value.exactEightMinuteSourceRef,
    value.performanceEvidence.exactEightMinuteSourceRef,
  )
  if (!uniqueRefs || !sameSource) context.addIssue({
    code: 'custom',
    message: 'SAM 3.1 p95 evidence lineage is inconsistent.',
  })
})
export const canonicalSam31GpuPerformanceP95EvidenceSchema =
  p95WithoutHashSchema.extend({ evidenceHash: sha256 }).strict()
export type CanonicalSam31GpuPerformanceP95Evidence = z.infer<
  typeof canonicalSam31GpuPerformanceP95EvidenceSchema
>

const ownerRequestSchema = z.object({
  componentId: safeId,
  performanceQualificationId: safeId,
  qualificationId: safeId,
  completeSourcePerformanceEvidenceRefs:
    z.array(refSchema).min(5).max(30),
}).strict().superRefine((value, context) => {
  const refs = value.completeSourcePerformanceEvidenceRefs
  if (new Set(refs.map(refKey)).size !== refs.length) context.addIssue({
    code: 'custom',
    message: 'SAM 3.1 p95 request repeats performance evidence.',
  })
})

export interface CanonicalSam31GpuPerformanceP95ReadPort {
  rereadCompleteSourcePerformanceEvidence(input: {
    readonly evidenceRef: EvidenceRef
  }): Promise<unknown | null>
}

export interface CanonicalSam31GpuPerformanceP95EvidenceRepository {
  persistP95EvidenceCreateOnly(input: {
    readonly evidence: CanonicalSam31GpuPerformanceP95Evidence
  }): Promise<EvidenceRef>
  rereadP95Evidence(input: {
    readonly evidenceRef: EvidenceRef
  }): Promise<CanonicalSam31GpuPerformanceP95Evidence | null>
}

export interface CanonicalSam31GpuPerformanceP95QualificationOwner {
  readonly schemaVersion:
    typeof CANONICAL_SAM3_1_GPU_PERFORMANCE_P95_OWNER_VERSION
  readonly evidenceClass:
    'canonical_five_to_thirty_complete_source_reread'
  compileAndPersistPerformanceQualificationComponent(input: unknown): Promise<
    CanonicalSam31GpuRuntimeQualificationComponentEvidence
  >
}

export function assertCanonicalSam31GpuPerformanceP95Evidence(
  value: unknown,
): CanonicalSam31GpuPerformanceP95Evidence {
  assertPlainSerializedData(value, 'sam31_gpu_performance_p95_evidence')
  const parsed = canonicalSam31GpuPerformanceP95EvidenceSchema.parse(value)
  const { evidenceHash, ...payload } = parsed
  if (evidenceHash !== sha256AuthorityValue(payload)) {
    throw conflict('p95_evidence_hash_invalid')
  }
  return parsed
}

export function canonicalSam31GpuPerformanceP95EvidenceRef(
  value: unknown,
): EvidenceRef {
  const parsed = assertCanonicalSam31GpuPerformanceP95Evidence(value)
  return ref(parsed.performanceQualificationId, parsed.evidenceHash)
}

export function createCanonicalSam31GpuPerformanceP95QualificationOwner(
  input: {
    readonly readPort: CanonicalSam31GpuPerformanceP95ReadPort
    readonly p95Repository:
      CanonicalSam31GpuPerformanceP95EvidenceRepository
    readonly componentRepository:
      CanonicalSam31GpuRuntimeQualificationComponentEvidenceRepository
    readonly now?: () => string
  },
): CanonicalSam31GpuPerformanceP95QualificationOwner {
  assertReadPort(input.readPort)
  assertP95Repository(input.p95Repository)
  assertComponentRepository(input.componentRepository)
  const now = input.now ?? (() => new Date().toISOString())
  return Object.freeze({
    schemaVersion: CANONICAL_SAM3_1_GPU_PERFORMANCE_P95_OWNER_VERSION,
    evidenceClass:
      'canonical_five_to_thirty_complete_source_reread' as const,

    async compileAndPersistPerformanceQualificationComponent(
      untrusted: unknown,
    ) {
      assertPlainSerializedData(untrusted, 'sam31_gpu_performance_p95_request')
      const request = ownerRequestSchema.parse(untrusted)
      const records = await Promise.all(
        request.completeSourcePerformanceEvidenceRefs.map(async (
          evidenceRef,
        ) => {
          const value = await input.readPort
            .rereadCompleteSourcePerformanceEvidence({ evidenceRef })
          if (!value) throw conflict('complete_source_evidence_missing')
          const record =
            assertCanonicalSam31GpuCompleteSourcePerformanceEvidence(value)
          if (!sameRef(
            canonicalSam31GpuCompleteSourcePerformanceEvidenceRef(record),
            evidenceRef,
          )) throw conflict('complete_source_evidence_ref_crossed')
          return record
        }),
      )
      const performanceEvidence = compilePerformanceEvidence(
        request.qualificationId,
        records,
      )
      const first = records[0]
      const p95Payload = p95WithoutHashSchema.parse({
        schemaVersion: CANONICAL_SAM3_1_GPU_PERFORMANCE_P95_EVIDENCE_VERSION,
        source: 'canonical_sam3_1_gpu_performance_p95_owner',
        evidenceClass: 'canonical_complete_source_evidence_reread',
        status: 'performance_p95_evidence_ready',
        performanceQualificationId: request.performanceQualificationId,
        performanceQualificationVersion: 1,
        qualificationId: request.qualificationId,
        route: first.route,
        immutableImageDigest: first.immutableImageDigest,
        exactEightMinuteSourceRef: first.exactEightMinuteSourceRef,
        chunkPlanRef: first.chunkPlanRef,
        completeSourcePerformanceEvidenceRefs:
          request.completeSourcePerformanceEvidenceRefs,
        performanceEvidence,
        exactFiveToThirtyCompleteSourceEvidenceRecordsReread: true,
        nearestRankP95Recomputed: true,
        p95AtOrBelowEightMinutes: true,
        routeImageSourceGeometryAndChunkPlanMatched: true,
        callerMeasurementsOrP95Accepted: false,
        liveGpuJobStarted: false,
        customerCreditsMutated: false,
        qaApprovalGranted: false,
        publicDeliveryAuthorized: false,
        productionAuthorityGranted: false,
        qualifiedAt: z.string().datetime({ offset: true }).parse(now()),
      })
      const p95Evidence = assertCanonicalSam31GpuPerformanceP95Evidence({
        ...p95Payload,
        evidenceHash: sha256AuthorityValue(p95Payload),
      })
      const persistedP95Ref = await input.p95Repository
        .persistP95EvidenceCreateOnly({ evidence: p95Evidence })
      const expectedP95Ref =
        canonicalSam31GpuPerformanceP95EvidenceRef(p95Evidence)
      if (!sameRef(persistedP95Ref, expectedP95Ref)) {
        throw conflict('p95_persistence_reference_mismatch')
      }
      const p95Reread = await input.p95Repository.rereadP95Evidence({
        evidenceRef: persistedP95Ref,
      })
      if (!p95Reread || !sameRef(
        canonicalSam31GpuPerformanceP95EvidenceRef(p95Reread),
        expectedP95Ref,
      )) throw conflict('p95_exact_reread_failed')

      const component =
        buildCanonicalSam31GpuRuntimeQualificationComponentEvidence({
          schemaVersion:
            CANONICAL_SAM3_1_GPU_RUNTIME_QUALIFICATION_COMPONENT_EVIDENCE_VERSION,
          source:
            'canonical_sam3_1_gpu_runtime_qualification_component_owner',
          evidenceClass: 'canonical_private_reread',
          status: 'component_evidence_ready',
          componentId: request.componentId,
          componentVersion: 1,
          qualificationId: request.qualificationId,
          route: first.route,
          immutableImageDigest: first.immutableImageDigest,
          recordedAt: p95Evidence.qualifiedAt,
          componentKind: 'eight_minute_performance',
          payload: {
            ...performanceEvidence,
            eightMinuteSourcePerformanceQualificationRef: expectedP95Ref,
          },
        })
      const componentRef = await input.componentRepository
        .persistComponentEvidenceCreateOnly({ componentEvidence: component })
      const expectedComponentRef =
        canonicalSam31GpuRuntimeQualificationComponentRef(component)
      if (!sameRef(componentRef, expectedComponentRef)) {
        throw conflict('component_persistence_reference_mismatch')
      }
      const componentReread = await input.componentRepository
        .rereadComponentEvidence({ componentEvidenceRef: componentRef })
      if (!componentReread || !sameRef(
        canonicalSam31GpuRuntimeQualificationComponentRef(componentReread),
        expectedComponentRef,
      )) throw conflict('component_exact_reread_failed')
      return componentReread
    },
  })
}

export function createCanonicalSam31GpuPerformanceP95EvidenceRepository(
  input: {
    readonly objectPort: CanonicalCreateOnlyJsonObjectPort
    readonly prefix?: string
  },
): CanonicalSam31GpuPerformanceP95EvidenceRepository {
  assertObjectPort(input.objectPort)
  const prefix = normalizePrefix(input.prefix ?? DEFAULT_PREFIX)
  return Object.freeze({
    async persistP95EvidenceCreateOnly({ evidence }: {
      readonly evidence: CanonicalSam31GpuPerformanceP95Evidence
    }) {
      const parsed = assertCanonicalSam31GpuPerformanceP95Evidence(evidence)
      const evidenceRef = canonicalSam31GpuPerformanceP95EvidenceRef(parsed)
      await persistExact(input.objectPort, recordPath(prefix, evidenceRef), parsed)
      return evidenceRef
    },
    async rereadP95Evidence({ evidenceRef }: {
      readonly evidenceRef: EvidenceRef
    }) {
      const parsedRef = refSchema.parse(evidenceRef)
      const body = await input.objectPort.readExact(
        recordPath(prefix, parsedRef),
      )
      if (!body) return null
      const parsed = readRecord(body)
      if (!sameRef(
        canonicalSam31GpuPerformanceP95EvidenceRef(parsed),
        parsedRef,
      )) throw conflict('p95_repository_reference_mismatch')
      return parsed
    },
  })
}

export function createCanonicalSam31GpuPerformanceP95QualificationOwnerFromObjectPort(
  input: {
    readonly objectPort: CanonicalCreateOnlyJsonObjectPort
    readonly now?: () => string
  },
): CanonicalSam31GpuPerformanceP95QualificationOwner {
  const performanceRepository =
    createCanonicalSam31GpuCompleteSourcePerformanceRepository({
      objectPort: input.objectPort,
    })
  return createCanonicalSam31GpuPerformanceP95QualificationOwner({
    readPort: {
      rereadCompleteSourcePerformanceEvidence({ evidenceRef }) {
        return performanceRepository.rereadPerformanceEvidence({ evidenceRef })
      },
    },
    p95Repository: createCanonicalSam31GpuPerformanceP95EvidenceRepository({
      objectPort: input.objectPort,
    }),
    componentRepository:
      createCanonicalSam31GpuRuntimeQualificationComponentEvidenceRepository({
        objectPort: input.objectPort,
      }),
    now: input.now,
  })
}

export function createCanonicalSam31GcpGpuPerformanceP95QualificationOwner(
  input: { readonly storage?: Storage; readonly now?: () => string } = {},
): CanonicalSam31GpuPerformanceP95QualificationOwner {
  return createCanonicalSam31GpuPerformanceP95QualificationOwnerFromObjectPort({
    objectPort: createCanonicalGcsSourceAnalysisJsonObjectPort({
      storage: input.storage ?? new Storage({ projectId: 'reeditpro' }),
      bucketName: 'reeditpro-production-reeditpro-control-plane-state',
    }),
    now: input.now,
  })
}

function compilePerformanceEvidence(
  qualificationId: string,
  records: readonly CanonicalSam31GpuCompleteSourcePerformanceEvidence[],
) {
  const first = records[0]
  const exactRecords = records.every((record, index) =>
    record.runOrdinal === index + 1
    && record.qualificationId === qualificationId
    && stableAuthorityStringify(record.route) ===
      stableAuthorityStringify(first.route)
    && record.immutableImageDigest === first.immutableImageDigest
    && sameRef(record.exactEightMinuteSourceRef,
      first.exactEightMinuteSourceRef)
    && sameRef(record.chunkPlanRef, first.chunkPlanRef)
    && record.sourceDurationMilliseconds === 480_000
    && record.sourceWidth === first.sourceWidth
    && record.sourceHeight === first.sourceHeight
    && record.sourceFrameCount === first.sourceFrameCount
    && record.fpsNumerator === first.fpsNumerator
    && record.fpsDenominator === first.fpsDenominator
    && record.sourceResolutionAndCompleteFrameRangePreserved
    && record.everyChunkTaskResponseResultAndTerminalCostReread
    && record.exactStitchedManifestAndEveryMaskByteReread
    && record.allGpuCapacityStoppedAfterTerminal
    && !record.automaticQualityReductionAllowed
    && !record.callerPerformanceClaimsAccepted
    && !record.customerCreditsMutated
    && !record.qaApprovalGranted
    && !record.publicDeliveryAuthorized
    && !record.productionAuthorityGranted)
  const lineageRefs = records.flatMap((record) => [
    record.fullSourceExecutionRef,
    record.completeChunkResultSetRef,
    record.terminalUsageAndCostReceiptSetRef,
    record.stitchedMaskSequenceRef,
  ])
  if (!exactRecords
    || new Set(lineageRefs.map(refKey)).size !== lineageRefs.length) {
    throw conflict('complete_source_evidence_set_mismatch')
  }
  const wallTimes = records.map((record) =>
    record.phaseTiming.wallTimeMilliseconds)
  const p95 = nearestRankP95(wallTimes)
  if (p95 > 480_000) throw conflict('p95_exceeds_eight_minutes')
  return performancePayloadSchema.parse({
    exactEightMinuteSourceRef: first.exactEightMinuteSourceRef,
    sourceDurationMilliseconds: 480_000,
    sourceWidth: first.sourceWidth,
    sourceHeight: first.sourceHeight,
    sourceFrameCount: first.sourceFrameCount,
    fpsNumerator: first.fpsNumerator,
    fpsDenominator: first.fpsDenominator,
    measurements: records.map((record) => ({
      runOrdinal: record.runOrdinal,
      fullSourceExecutionRef: record.fullSourceExecutionRef,
      completeChunkResultSetRef: record.completeChunkResultSetRef,
      terminalUsageAndCostReceiptSetRef:
        record.terminalUsageAndCostReceiptSetRef,
      wallTimeMilliseconds: record.phaseTiming.wallTimeMilliseconds,
      coldStartAndImagePullMilliseconds:
        record.phaseTiming.coldStartAndImagePullMilliseconds,
      modelLoadMilliseconds: record.phaseTiming.modelLoadMilliseconds,
      decodePromptPropagationAndStitchMilliseconds:
        record.phaseTiming.decodePromptPropagationAndStitchMilliseconds,
      outputPersistenceAndExactRereadMilliseconds:
        record.phaseTiming.outputPersistenceAndExactRereadMilliseconds,
      sourceResolutionAndCompleteFrameRangePreserved: true,
      everyChunkResultAndTerminalCostReread: true,
      allGpuCapacityStoppedAfterTerminal: true,
      customerCreditsMutated: false,
    })),
    p95WallTimeMilliseconds: p95,
    targetWallTimeMilliseconds: 480_000,
    completeSourceIntervalCovered: true,
    automaticQualityReductionAllowed: false,
  })
}

function nearestRankP95(values: readonly number[]): number {
  const ordered = [...values].sort((left, right) => left - right)
  return ordered[Math.ceil(0.95 * ordered.length) - 1]
}

function ref(id: string, hash: string): EvidenceRef {
  return { id, version: 1, contentHash: `sha256:${hash}` }
}

function refKey(value: EvidenceRef): string {
  return `${value.id}:${value.version}:${value.contentHash}`
}

function sameRef(left: EvidenceRef, right: EvidenceRef): boolean {
  return refKey(left) === refKey(right)
}

function recordPath(prefix: string, value: EvidenceRef): string {
  const parsed = refSchema.parse(value)
  const idHash = createHash('sha256').update(parsed.id).digest('hex')
  return `${prefix}/${idHash}/${parsed.contentHash.slice(7)}.json`
}

async function persistExact(
  port: CanonicalCreateOnlyJsonObjectPort,
  path: string,
  value: unknown,
): Promise<void> {
  const body = Buffer.from(stableAuthorityStringify(value), 'utf8')
  if (body.byteLength < 2 || body.byteLength > MAXIMUM_RECORD_BYTES) {
    throw conflict('record_size_invalid')
  }
  const status = await port.createOnly({
    objectPath: path,
    body,
    contentSha256: createHash('sha256').update(body).digest('hex'),
  })
  const reread = await port.readExact(path)
  if (!reread || !reread.equals(body)) throw conflict(
    status === 'already_exists'
      ? 'create_only_collision'
      : 'record_exact_reread_failed',
  )
}

function readRecord(body: Buffer): CanonicalSam31GpuPerformanceP95Evidence {
  if (!Buffer.isBuffer(body)
    || body.byteLength < 2
    || body.byteLength > MAXIMUM_RECORD_BYTES) {
    throw conflict('record_size_invalid')
  }
  let untrusted: unknown
  try {
    untrusted = JSON.parse(body.toString('utf8'))
  } catch {
    throw conflict('record_json_invalid')
  }
  const parsed = assertCanonicalSam31GpuPerformanceP95Evidence(untrusted)
  if (stableAuthorityStringify(parsed) !== body.toString('utf8')) {
    throw conflict('record_not_canonical')
  }
  return parsed
}

function normalizePrefix(value: string): string {
  const normalized = value.trim().replace(/^\/+|\/+$/gu, '')
  if (!normalized || normalized.includes('..') || normalized.includes('\\')) {
    throw conflict('repository_prefix_invalid')
  }
  return normalized
}

function assertReadPort(port: CanonicalSam31GpuPerformanceP95ReadPort): void {
  if (!port
    || typeof port.rereadCompleteSourcePerformanceEvidence !== 'function') {
    throw conflict('read_port_invalid')
  }
}

function assertP95Repository(
  repository: CanonicalSam31GpuPerformanceP95EvidenceRepository,
): void {
  if (!repository
    || typeof repository.persistP95EvidenceCreateOnly !== 'function'
    || typeof repository.rereadP95Evidence !== 'function') {
    throw conflict('p95_repository_invalid')
  }
}

function assertComponentRepository(
  repository: CanonicalSam31GpuRuntimeQualificationComponentEvidenceRepository,
): void {
  if (!repository
    || typeof repository.persistComponentEvidenceCreateOnly !== 'function'
    || typeof repository.rereadComponentEvidence !== 'function') {
    throw conflict('component_repository_invalid')
  }
}

function assertObjectPort(port: CanonicalCreateOnlyJsonObjectPort): void {
  if (!port
    || typeof port.createOnly !== 'function'
    || typeof port.readExact !== 'function') throw conflict('object_port_invalid')
}

function conflict(reason: string): Error {
  return new Error(`SAM31_PERFORMANCE_P95_CONFLICT:${reason}`)
}
