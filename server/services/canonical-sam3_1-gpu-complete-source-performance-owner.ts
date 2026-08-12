import { createHash } from 'node:crypto'

import { Storage } from '@google-cloud/storage'
import { z } from 'zod'

import {
  createCanonicalGcsSourceAnalysisJsonObjectPort,
  type CanonicalCreateOnlyJsonObjectPort,
} from './canonical-gcs-source-analysis-lifecycle-store'
import {
  createCanonicalProfessionalGpuDurableLifecycleStore,
} from './canonical-professional-gpu-durable-lifecycle-store'
import {
  assertCanonicalProfessionalGpuJobLaunch,
  assertCanonicalProfessionalGpuJobTerminal,
  assertPlainSerializedData,
  type CanonicalProfessionalGpuJobLaunch,
  type CanonicalProfessionalGpuJobTerminal,
} from './canonical-professional-gpu-job-lifecycle-service'
import {
  canonicalSam31GpuQualificationRouteForLaunch,
} from './canonical-sam3_1-gpu-runtime-driver-qualification-owner'
import {
  sha256AuthorityValue,
  stableAuthorityStringify,
} from './private-edit-authority-store'
import {
  assertCanonicalSam31GpuRuntimeResponse,
  type CanonicalSam31GpuRuntimeResponse,
} from '../workers/masks/canonical-sam3_1-gpu-runtime-contract'
import {
  assertCanonicalSam31PrivateOutputRereadEvidence,
  assertCanonicalSam31GpuRuntimeResultAdmission,
  createCanonicalSam31GpuRuntimeResultStoreFromObjectPort,
  type CanonicalSam31PrivateOutputRereadEvidence,
  type CanonicalSam31GpuRuntimeResultAdmission,
} from '../workers/masks/canonical-sam3_1-gpu-runtime-result-service'
import {
  assertCanonicalSam31GpuTaskRecord,
  createCanonicalSam31GpuTaskStoreFromObjectPort,
  type CanonicalSam31GpuTaskRecord,
} from '../workers/masks/canonical-sam3_1-gpu-task-owner-service'

export const CANONICAL_SAM3_1_GPU_COMPLETE_SOURCE_EXECUTION_OBSERVATION_VERSION =
  'canonical-sam3_1-gpu-complete-source-execution-observation-v1' as const
export const CANONICAL_SAM3_1_GPU_COMPLETE_SOURCE_STITCH_EVIDENCE_VERSION =
  'canonical-sam3_1-gpu-complete-source-stitch-evidence-v1' as const
export const CANONICAL_SAM3_1_GPU_COMPLETE_SOURCE_PERFORMANCE_EVIDENCE_VERSION =
  'canonical-sam3_1-gpu-complete-source-performance-evidence-v1' as const
export const CANONICAL_SAM3_1_GPU_COMPLETE_SOURCE_PERFORMANCE_OWNER_VERSION =
  'canonical-sam3_1-gpu-complete-source-performance-owner-v1' as const

const DEFAULT_PREFIX =
  'private/sam3_1/gpu-runtime-qualification/v1/complete-source-performance'
const MAXIMUM_RECORD_BYTES = 16 * 1024 * 1024
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
const chunkObservationSchema = z.object({
  chunkOrdinal: z.number().int().min(1).max(256),
  invocationId: safeId,
  canonicalStartFrameInclusive: nonnegativeInteger,
  canonicalEndFrameInclusive: nonnegativeInteger,
  overlapWithPreviousFrames: nonnegativeInteger.max(64),
  taskRef: refSchema,
  launchRef: refSchema,
  resultAdmissionRef: refSchema,
  runtimeResponseObjectRef: refSchema,
}).strict()
const phaseTimingSchema = z.object({
  wallTimeMilliseconds: positiveInteger.max(3_600_000),
  coldStartAndImagePullMilliseconds: nonnegativeInteger.max(3_600_000),
  modelLoadMilliseconds: nonnegativeInteger.max(3_600_000),
  decodePromptPropagationAndStitchMilliseconds:
    positiveInteger.max(3_600_000),
  outputPersistenceAndExactRereadMilliseconds:
    nonnegativeInteger.max(3_600_000),
}).strict().superRefine((timing, context) => {
  const sum = timing.coldStartAndImagePullMilliseconds
    + timing.modelLoadMilliseconds
    + timing.decodePromptPropagationAndStitchMilliseconds
    + timing.outputPersistenceAndExactRereadMilliseconds
  if (sum > timing.wallTimeMilliseconds) context.addIssue({
    code: 'custom',
    message: 'SAM 3.1 complete-source phases exceed wall time.',
  })
})

const observationWithoutHashSchema = z.object({
  schemaVersion: z.literal(
    CANONICAL_SAM3_1_GPU_COMPLETE_SOURCE_EXECUTION_OBSERVATION_VERSION,
  ),
  source: z.literal(
    'canonical_sam3_1_gpu_complete_source_execution_telemetry_owner',
  ),
  evidenceClass: z.literal('canonical_private_reread'),
  status: z.literal('complete_source_execution_observed'),
  executionGroupId: safeId,
  executionGroupVersion: z.literal(1),
  qualificationId: safeId,
  runOrdinal: z.number().int().min(1).max(30),
  exactEightMinuteSourceRef: refSchema,
  sourceDurationMilliseconds: z.literal(480_000),
  sourceWidth: positiveInteger.max(16_384),
  sourceHeight: positiveInteger.max(16_384),
  sourceFrameCount: positiveInteger.max(1_000_000),
  fpsNumerator: positiveInteger.max(240_000),
  fpsDenominator: positiveInteger.max(1_001_000),
  chunkPlanRef: refSchema,
  route: routeSchema,
  immutableImageDigest: prefixedSha256,
  chunks: z.array(chunkObservationSchema).min(2).max(256),
  phaseObservationRefs: z.object({
    userTriggeredExecutionGroupRef: refSchema,
    cloudProvisioningObservationSetRef: refSchema,
    workerPhaseTelemetrySetRef: refSchema,
    terminalCapacityObservationSetRef: refSchema,
    accountEffectiveCostReceiptSetRef: refSchema,
  }).strict(),
  phaseTiming: phaseTimingSchema,
  exactCloudJobWorkerAndPhaseTimestampsReread: z.literal(true),
  everyChunkTerminalAndAccountEffectiveCostReread: z.literal(true),
  allGpuCapacityStoppedAfterTerminal: z.literal(true),
  maximumActiveGpuJobsAfterTerminal: z.literal(0),
  callerTimingOrCompletionClaimsAccepted: z.literal(false),
  customerCreditsMutated: z.literal(false),
  qaApprovalGranted: z.literal(false),
  publicDeliveryAuthorized: z.literal(false),
  productionAuthorityGranted: z.literal(false),
  observedAt: timestamp,
}).strict().superRefine((value, context) => {
  const expectedDuration = value.sourceFrameCount
    * value.fpsDenominator * 1_000 / value.fpsNumerator
  const exactCoverage = completeChunkCoverage(
    value.chunks,
    value.sourceFrameCount,
  )
  const uniqueRefs = uniqueChunkRefs(value.chunks)
  if (
    !Number.isInteger(expectedDuration)
    || expectedDuration !== value.sourceDurationMilliseconds
    || !exactCoverage
    || !uniqueRefs
  ) context.addIssue({
    code: 'custom',
    message: 'SAM 3.1 complete-source observation is inconsistent.',
  })
})
export const canonicalSam31GpuCompleteSourceExecutionObservationSchema =
  observationWithoutHashSchema.extend({ observationHash: sha256 }).strict()
export type CanonicalSam31GpuCompleteSourceExecutionObservation = z.infer<
  typeof canonicalSam31GpuCompleteSourceExecutionObservationSchema
>

const stitchWithoutHashSchema = z.object({
  schemaVersion: z.literal(
    CANONICAL_SAM3_1_GPU_COMPLETE_SOURCE_STITCH_EVIDENCE_VERSION,
  ),
  source: z.literal('canonical_track_all_sam3_1_mask_stitch_owner'),
  evidenceClass: z.literal('canonical_private_reread'),
  status: z.literal('complete_source_stitch_evidence_ready'),
  stitchEvidenceId: safeId,
  stitchEvidenceVersion: z.literal(1),
  executionGroupRef: refSchema,
  exactEightMinuteSourceRef: refSchema,
  chunkPlanRef: refSchema,
  orderedChunkResultRefs: z.array(refSchema).min(2).max(256),
  stitchedMaskSequenceRef: refSchema,
  stitchedOutputMaskSetDigestSha256: sha256,
  sourceWidth: positiveInteger.max(16_384),
  sourceHeight: positiveInteger.max(16_384),
  sourceFrameCount: positiveInteger.max(1_000_000),
  firstFrameIndex: z.literal(0),
  lastFrameIndex: nonnegativeInteger,
  everyExpectedFrameAndObjectPresent: z.literal(true),
  completeIntervalNoGapCoverageVerified: z.literal(true),
  deterministicOverlapReconciliationVerified: z.literal(true),
  everyMaskMatchesSourceGeometry: z.literal(true),
  sourceResolutionPreserved: z.literal(true),
  quantizationOrDownscaleUsed: z.literal(false),
  exactStitchedManifestAndEveryMaskByteReread: z.literal(true),
  pathsUrlsCredentialsOrMediaBytesIncluded: z.literal(false),
  assetManifestMutated: z.literal(false),
  qaApprovalGranted: z.literal(false),
  customerCreditsMutated: z.literal(false),
  publicDeliveryAuthorized: z.literal(false),
  productionAuthorityGranted: z.literal(false),
  stitchedAt: timestamp,
}).strict().superRefine((value, context) => {
  if (
    value.lastFrameIndex !== value.sourceFrameCount - 1
    || value.stitchedMaskSequenceRef.contentHash !==
      `sha256:${value.stitchedOutputMaskSetDigestSha256}`
    || new Set(value.orderedChunkResultRefs.map(refKey)).size !==
      value.orderedChunkResultRefs.length
  ) context.addIssue({
    code: 'custom',
    message: 'SAM 3.1 stitch evidence is inconsistent.',
  })
})
export const canonicalSam31GpuCompleteSourceStitchEvidenceSchema =
  stitchWithoutHashSchema.extend({ stitchEvidenceHash: sha256 }).strict()
export type CanonicalSam31GpuCompleteSourceStitchEvidence = z.infer<
  typeof canonicalSam31GpuCompleteSourceStitchEvidenceSchema
>

const performanceEvidenceWithoutHashSchema = z.object({
  schemaVersion: z.literal(
    CANONICAL_SAM3_1_GPU_COMPLETE_SOURCE_PERFORMANCE_EVIDENCE_VERSION,
  ),
  source: z.literal(
    'canonical_sam3_1_gpu_complete_source_performance_owner',
  ),
  evidenceClass: z.literal('canonical_private_reread'),
  status: z.literal('complete_source_performance_evidence_ready'),
  performanceEvidenceId: safeId,
  performanceEvidenceVersion: z.literal(1),
  qualificationId: safeId,
  runOrdinal: z.number().int().min(1).max(30),
  route: routeSchema,
  immutableImageDigest: prefixedSha256,
  fullSourceExecutionRef: refSchema,
  completeChunkResultSetRef: refSchema,
  terminalUsageAndCostReceiptSetRef: refSchema,
  exactEightMinuteSourceRef: refSchema,
  sourceDurationMilliseconds: z.literal(480_000),
  sourceWidth: positiveInteger.max(16_384),
  sourceHeight: positiveInteger.max(16_384),
  sourceFrameCount: positiveInteger.max(1_000_000),
  fpsNumerator: positiveInteger.max(240_000),
  fpsDenominator: positiveInteger.max(1_001_000),
  chunkPlanRef: refSchema,
  chunkCount: z.number().int().min(2).max(256),
  stitchedMaskSequenceRef: refSchema,
  stitchedOutputMaskSetDigestSha256: sha256,
  phaseTiming: phaseTimingSchema,
  sourceResolutionAndCompleteFrameRangePreserved: z.literal(true),
  everyChunkTaskResponseResultAndTerminalCostReread: z.literal(true),
  exactStitchedManifestAndEveryMaskByteReread: z.literal(true),
  allGpuCapacityStoppedAfterTerminal: z.literal(true),
  automaticQualityReductionAllowed: z.literal(false),
  callerPerformanceClaimsAccepted: z.literal(false),
  customerCreditsMutated: z.literal(false),
  qaApprovalGranted: z.literal(false),
  publicDeliveryAuthorized: z.literal(false),
  productionAuthorityGranted: z.literal(false),
  verifiedAt: timestamp,
}).strict()
export const canonicalSam31GpuCompleteSourcePerformanceEvidenceSchema =
  performanceEvidenceWithoutHashSchema.extend({ evidenceHash: sha256 }).strict()
export type CanonicalSam31GpuCompleteSourcePerformanceEvidence = z.infer<
  typeof canonicalSam31GpuCompleteSourcePerformanceEvidenceSchema
>

const ownerRequestSchema = z.object({
  performanceEvidenceId: safeId,
  executionGroupObservationRef: refSchema,
  stitchEvidenceRef: refSchema,
}).strict()

export interface CanonicalSam31GpuCompleteSourcePerformanceReadPort {
  rereadExecutionGroupObservation(input: {
    readonly executionGroupObservationRef: EvidenceRef
  }): Promise<unknown | null>
  rereadStitchEvidence(input: {
    readonly stitchEvidenceRef: EvidenceRef
  }): Promise<unknown | null>
  rereadTask(input: {
    readonly invocationId: string
    readonly taskRef: EvidenceRef
  }): Promise<unknown | null>
  rereadLaunch(input: {
    readonly invocationId: string
    readonly launchRef: EvidenceRef
  }): Promise<unknown | null>
  rereadResultAdmission(input: {
    readonly invocationId: string
    readonly resultAdmissionRef: EvidenceRef
  }): Promise<unknown | null>
  rereadTerminal(input: {
    readonly invocationId: string
    readonly terminalRef: EvidenceRef
  }): Promise<unknown | null>
  rereadPrivateOutputEvidence(input: {
    readonly invocationId: string
    readonly privateOutputRereadEvidenceRef: EvidenceRef
  }): Promise<unknown | null>
  rereadRuntimeResponse(input: {
    readonly invocationId: string
    readonly runtimeResponseObjectRef: EvidenceRef
  }): Promise<unknown | null>
}

export interface CanonicalSam31GpuCompleteSourcePerformanceRepository {
  persistPerformanceEvidenceCreateOnly(input: {
    readonly evidence: CanonicalSam31GpuCompleteSourcePerformanceEvidence
  }): Promise<EvidenceRef>
  rereadPerformanceEvidence(input: {
    readonly evidenceRef: EvidenceRef
  }): Promise<CanonicalSam31GpuCompleteSourcePerformanceEvidence | null>
}

export function sealCanonicalSam31GpuCompleteSourceExecutionObservation(
  value: unknown,
): CanonicalSam31GpuCompleteSourceExecutionObservation {
  assertPlainSerializedData(value, 'sam31_complete_source_observation_build')
  const payload = observationWithoutHashSchema.parse(value)
  return assertCanonicalSam31GpuCompleteSourceExecutionObservation({
    ...payload,
    observationHash: sha256AuthorityValue(payload),
  })
}

export function assertCanonicalSam31GpuCompleteSourceExecutionObservation(
  value: unknown,
): CanonicalSam31GpuCompleteSourceExecutionObservation {
  assertPlainSerializedData(value, 'sam31_complete_source_observation')
  const parsed =
    canonicalSam31GpuCompleteSourceExecutionObservationSchema.parse(value)
  const { observationHash, ...payload } = parsed
  if (observationHash !== sha256AuthorityValue(payload)) {
    throw conflict('execution_group_observation_hash_invalid')
  }
  return parsed
}

export function canonicalSam31GpuCompleteSourceExecutionObservationRef(
  value: unknown,
): EvidenceRef {
  const parsed = assertCanonicalSam31GpuCompleteSourceExecutionObservation(
    value,
  )
  return ref(parsed.executionGroupId, parsed.observationHash)
}

export function sealCanonicalSam31GpuCompleteSourceStitchEvidence(
  value: unknown,
): CanonicalSam31GpuCompleteSourceStitchEvidence {
  assertPlainSerializedData(value, 'sam31_complete_source_stitch_build')
  const payload = stitchWithoutHashSchema.parse(value)
  return assertCanonicalSam31GpuCompleteSourceStitchEvidence({
    ...payload,
    stitchEvidenceHash: sha256AuthorityValue(payload),
  })
}

export function assertCanonicalSam31GpuCompleteSourceStitchEvidence(
  value: unknown,
): CanonicalSam31GpuCompleteSourceStitchEvidence {
  assertPlainSerializedData(value, 'sam31_complete_source_stitch')
  const parsed = canonicalSam31GpuCompleteSourceStitchEvidenceSchema.parse(
    value,
  )
  const { stitchEvidenceHash, ...payload } = parsed
  if (stitchEvidenceHash !== sha256AuthorityValue(payload)) {
    throw conflict('stitch_evidence_hash_invalid')
  }
  return parsed
}

export function canonicalSam31GpuCompleteSourceStitchEvidenceRef(
  value: unknown,
): EvidenceRef {
  const parsed = assertCanonicalSam31GpuCompleteSourceStitchEvidence(value)
  return ref(parsed.stitchEvidenceId, parsed.stitchEvidenceHash)
}

export function assertCanonicalSam31GpuCompleteSourcePerformanceEvidence(
  value: unknown,
): CanonicalSam31GpuCompleteSourcePerformanceEvidence {
  assertPlainSerializedData(value, 'sam31_complete_source_performance')
  const parsed = canonicalSam31GpuCompleteSourcePerformanceEvidenceSchema.parse(
    value,
  )
  const { evidenceHash, ...payload } = parsed
  if (evidenceHash !== sha256AuthorityValue(payload)) {
    throw conflict('performance_evidence_hash_invalid')
  }
  return parsed
}

export function canonicalSam31GpuCompleteSourcePerformanceEvidenceRef(
  value: unknown,
): EvidenceRef {
  const parsed = assertCanonicalSam31GpuCompleteSourcePerformanceEvidence(value)
  return ref(parsed.performanceEvidenceId, parsed.evidenceHash)
}

export function createCanonicalSam31GpuCompleteSourcePerformanceOwner(input: {
  readonly readPort: CanonicalSam31GpuCompleteSourcePerformanceReadPort
  readonly repository: CanonicalSam31GpuCompleteSourcePerformanceRepository
  readonly now?: () => string
}) {
  assertReadPort(input.readPort)
  assertRepository(input.repository)
  const now = input.now ?? (() => new Date().toISOString())
  return Object.freeze({
    schemaVersion: CANONICAL_SAM3_1_GPU_COMPLETE_SOURCE_PERFORMANCE_OWNER_VERSION,
    evidenceClass: 'canonical_chunk_result_and_telemetry_reread' as const,
    async compileAndPersistPerformanceEvidence(untrusted: unknown) {
      assertPlainSerializedData(untrusted, 'sam31_performance_owner_request')
      const request = ownerRequestSchema.parse(untrusted)
      const [observationValue, stitchValue] = await Promise.all([
        input.readPort.rereadExecutionGroupObservation({
          executionGroupObservationRef:
            request.executionGroupObservationRef,
        }),
        input.readPort.rereadStitchEvidence({
          stitchEvidenceRef: request.stitchEvidenceRef,
        }),
      ])
      if (!observationValue || !stitchValue) {
        throw conflict('observation_or_stitch_missing')
      }
      const observation =
        assertCanonicalSam31GpuCompleteSourceExecutionObservation(
          observationValue,
        )
      const stitch = assertCanonicalSam31GpuCompleteSourceStitchEvidence(
        stitchValue,
      )
      if (!sameRef(
        request.executionGroupObservationRef,
        canonicalSam31GpuCompleteSourceExecutionObservationRef(observation),
      ) || !sameRef(
        request.stitchEvidenceRef,
        canonicalSam31GpuCompleteSourceStitchEvidenceRef(stitch),
      )) throw conflict('request_reference_mismatch')
      const chunkRecords = await Promise.all(observation.chunks.map(
        async (chunk) => {
          const values = await Promise.all([
            input.readPort.rereadTask({
              invocationId: chunk.invocationId,
              taskRef: chunk.taskRef,
            }),
            input.readPort.rereadLaunch({
              invocationId: chunk.invocationId,
              launchRef: chunk.launchRef,
            }),
            input.readPort.rereadResultAdmission({
              invocationId: chunk.invocationId,
              resultAdmissionRef: chunk.resultAdmissionRef,
            }),
            input.readPort.rereadRuntimeResponse({
              invocationId: chunk.invocationId,
              runtimeResponseObjectRef: chunk.runtimeResponseObjectRef,
            }),
          ])
          if (values.some((value) => value === null)) {
            throw conflict(`chunk_${chunk.chunkOrdinal}_record_missing`)
          }
          const task = assertCanonicalSam31GpuTaskRecord(values[0])
          const launch = assertCanonicalProfessionalGpuJobLaunch(values[1])
          const result = assertCanonicalSam31GpuRuntimeResultAdmission(values[2])
          const response = assertCanonicalSam31GpuRuntimeResponse({
            request: task.runtimeRequest,
            response: values[3],
          })
          const terminalValue = await input.readPort.rereadTerminal({
            invocationId: chunk.invocationId,
            terminalRef: refSchema.parse(result.terminalRef),
          })
          if (terminalValue === null) {
            throw conflict(`chunk_${chunk.chunkOrdinal}_terminal_missing`)
          }
          const terminal = assertCanonicalProfessionalGpuJobTerminal(
            terminalValue,
          )
          const privateOutputValue =
            await input.readPort.rereadPrivateOutputEvidence({
              invocationId: chunk.invocationId,
              privateOutputRereadEvidenceRef:
                refSchema.parse(result.privateOutputRereadEvidenceRef),
            })
          if (privateOutputValue === null) {
            throw conflict(
              `chunk_${chunk.chunkOrdinal}_private_output_evidence_missing`,
            )
          }
          const privateOutput =
            assertCanonicalSam31PrivateOutputRereadEvidence(
              privateOutputValue,
            )
          assertChunkLineage({
            observation,
            chunk,
            task,
            launch,
            terminal,
            privateOutput,
            result,
            response,
          })
          return { task, launch, terminal, privateOutput, result, response }
        },
      ))
      assertStitchLineage({ observation, stitch, chunkRecords })
      const firstLaunch = chunkRecords[0].launch
      const chunkResultSetPayload = observation.chunks.map((chunk, index) => ({
        chunkOrdinal: chunk.chunkOrdinal,
        resultAdmissionRef: chunk.resultAdmissionRef,
        runtimeResponseObjectRef: chunk.runtimeResponseObjectRef,
        manifestRef: chunkRecords[index].result.manifestRef,
        privateOutputRereadEvidenceRef:
          chunkRecords[index].result.privateOutputRereadEvidenceRef,
        maskSequenceArtifactRef:
          chunkRecords[index].privateOutput.maskSequenceArtifactRef,
      }))
      const costSetPayload = chunkRecords.map(({ terminal, result }, index) => ({
        chunkOrdinal: index + 1,
        terminalRef: result.terminalRef,
        workerUsageEvidenceRef: result.workerUsageEvidenceRef,
        currentAccountPriceAuthorityRef:
          result.currentAccountPriceAuthorityRef,
        attemptCostReceiptRef: result.attemptCostReceiptRef,
        terminalObservedAt: terminal.observedAt,
      }))
      const payload = performanceEvidenceWithoutHashSchema.parse({
        schemaVersion:
          CANONICAL_SAM3_1_GPU_COMPLETE_SOURCE_PERFORMANCE_EVIDENCE_VERSION,
        source: 'canonical_sam3_1_gpu_complete_source_performance_owner',
        evidenceClass: 'canonical_private_reread',
        status: 'complete_source_performance_evidence_ready',
        performanceEvidenceId: request.performanceEvidenceId,
        performanceEvidenceVersion: 1,
        qualificationId: observation.qualificationId,
        runOrdinal: observation.runOrdinal,
        route: canonicalSam31GpuQualificationRouteForLaunch(firstLaunch),
        immutableImageDigest: observation.immutableImageDigest,
        fullSourceExecutionRef: request.executionGroupObservationRef,
        completeChunkResultSetRef: contentRef(
          `${observation.executionGroupId}:complete-chunk-result-set`,
          chunkResultSetPayload,
        ),
        terminalUsageAndCostReceiptSetRef: contentRef(
          `${observation.executionGroupId}:terminal-cost-set`,
          costSetPayload,
        ),
        exactEightMinuteSourceRef: observation.exactEightMinuteSourceRef,
        sourceDurationMilliseconds: observation.sourceDurationMilliseconds,
        sourceWidth: observation.sourceWidth,
        sourceHeight: observation.sourceHeight,
        sourceFrameCount: observation.sourceFrameCount,
        fpsNumerator: observation.fpsNumerator,
        fpsDenominator: observation.fpsDenominator,
        chunkPlanRef: observation.chunkPlanRef,
        chunkCount: observation.chunks.length,
        stitchedMaskSequenceRef: stitch.stitchedMaskSequenceRef,
        stitchedOutputMaskSetDigestSha256:
          stitch.stitchedOutputMaskSetDigestSha256,
        phaseTiming: observation.phaseTiming,
        sourceResolutionAndCompleteFrameRangePreserved: true,
        everyChunkTaskResponseResultAndTerminalCostReread: true,
        exactStitchedManifestAndEveryMaskByteReread: true,
        allGpuCapacityStoppedAfterTerminal: true,
        automaticQualityReductionAllowed: false,
        callerPerformanceClaimsAccepted: false,
        customerCreditsMutated: false,
        qaApprovalGranted: false,
        publicDeliveryAuthorized: false,
        productionAuthorityGranted: false,
        verifiedAt: z.string().datetime({ offset: true }).parse(now()),
      })
      const evidence = assertCanonicalSam31GpuCompleteSourcePerformanceEvidence({
        ...payload,
        evidenceHash: sha256AuthorityValue(payload),
      })
      const persistedRef = await input.repository
        .persistPerformanceEvidenceCreateOnly({ evidence })
      const expectedRef =
        canonicalSam31GpuCompleteSourcePerformanceEvidenceRef(evidence)
      if (!sameRef(persistedRef, expectedRef)) {
        throw conflict('performance_persistence_reference_mismatch')
      }
      const reread = await input.repository.rereadPerformanceEvidence({
        evidenceRef: persistedRef,
      })
      if (!reread || !sameRef(
        canonicalSam31GpuCompleteSourcePerformanceEvidenceRef(reread),
        expectedRef,
      )) throw conflict('performance_exact_reread_failed')
      return reread
    },
  })
}

export function createCanonicalSam31GpuCompleteSourcePerformanceRepository(
  input: {
    readonly objectPort: CanonicalCreateOnlyJsonObjectPort
    readonly prefix?: string
  },
): CanonicalSam31GpuCompleteSourcePerformanceRepository {
  assertObjectPort(input.objectPort)
  const prefix = normalizePrefix(input.prefix ?? DEFAULT_PREFIX)
  return Object.freeze({
    async persistPerformanceEvidenceCreateOnly({ evidence }: {
      readonly evidence: CanonicalSam31GpuCompleteSourcePerformanceEvidence
    }) {
      const parsed = assertCanonicalSam31GpuCompleteSourcePerformanceEvidence(
        evidence,
      )
      const evidenceRef =
        canonicalSam31GpuCompleteSourcePerformanceEvidenceRef(parsed)
      await persistExact(input.objectPort,
        recordPath(prefix, 'performance', evidenceRef), parsed)
      return evidenceRef
    },
    async rereadPerformanceEvidence({ evidenceRef }: {
      readonly evidenceRef: EvidenceRef
    }) {
      const parsedRef = refSchema.parse(evidenceRef)
      const body = await input.objectPort.readExact(
        recordPath(prefix, 'performance', parsedRef),
      )
      if (!body) return null
      const parsed = readRecord(
        body,
        assertCanonicalSam31GpuCompleteSourcePerformanceEvidence,
      )
      if (!sameRef(
        canonicalSam31GpuCompleteSourcePerformanceEvidenceRef(parsed),
        parsedRef,
      )) throw conflict('performance_repository_reference_mismatch')
      return parsed
    },
  })
}

export function createCanonicalSam31GpuCompleteSourcePerformanceOwnerFromObjectPort(
  input: {
    readonly objectPort: CanonicalCreateOnlyJsonObjectPort
    readonly now?: () => string
  },
) {
  return createCanonicalSam31GpuCompleteSourcePerformanceOwnerFromObjectPorts({
    controlPlaneObjectPort: input.objectPort,
    privateGpuObjectPort: input.objectPort,
    now: input.now,
  })
}

export function createCanonicalSam31GpuCompleteSourcePerformanceOwnerFromObjectPorts(
  input: {
    readonly controlPlaneObjectPort: CanonicalCreateOnlyJsonObjectPort
    readonly privateGpuObjectPort: CanonicalCreateOnlyJsonObjectPort
    readonly now?: () => string
  },
) {
  const taskStore = createCanonicalSam31GpuTaskStoreFromObjectPort({
    objectPort: input.privateGpuObjectPort,
  })
  const resultStore = createCanonicalSam31GpuRuntimeResultStoreFromObjectPort({
    objectPort: input.privateGpuObjectPort,
  })
  const lifecycleStore = createCanonicalProfessionalGpuDurableLifecycleStore({
    objectPort: input.controlPlaneObjectPort,
  })
  return createCanonicalSam31GpuCompleteSourcePerformanceOwner({
    readPort: {
      rereadExecutionGroupObservation({ executionGroupObservationRef }) {
        return readTypedObject(input.controlPlaneObjectPort,
          recordPath(DEFAULT_PREFIX, 'execution-groups',
            executionGroupObservationRef),
          assertCanonicalSam31GpuCompleteSourceExecutionObservation)
      },
      rereadStitchEvidence({ stitchEvidenceRef }) {
        return readTypedObject(input.controlPlaneObjectPort,
          recordPath(DEFAULT_PREFIX, 'stitches', stitchEvidenceRef),
          assertCanonicalSam31GpuCompleteSourceStitchEvidence)
      },
      rereadTask({ invocationId }) {
        return taskStore.rereadTask(invocationId)
      },
      rereadLaunch({ launchRef }) {
        return lifecycleStore.rereadLaunchRecord({
          launchRecordId: launchRef.id,
        })
      },
      rereadResultAdmission({ invocationId }) {
        return resultStore.rereadResultAdmission(invocationId)
      },
      rereadTerminal({ terminalRef }) {
        return lifecycleStore.rereadTerminalRecord({
          terminalRecordId: terminalRef.id,
        })
      },
      rereadPrivateOutputEvidence({
        invocationId,
        privateOutputRereadEvidenceRef,
      }) {
        return resultStore.rereadPrivateOutputRereadEvidence(
          invocationId,
          privateOutputRereadEvidenceRef,
        )
      },
      rereadRuntimeResponse({ invocationId }) {
        return taskStore.rereadRuntimeResponse(invocationId)
      },
    },
    repository: createCanonicalSam31GpuCompleteSourcePerformanceRepository({
      objectPort: input.controlPlaneObjectPort,
    }),
    now: input.now,
  })
}

export function createCanonicalSam31GcpGpuCompleteSourcePerformanceOwner(
  input: { readonly storage?: Storage; readonly now?: () => string } = {},
) {
  const storage = input.storage ?? new Storage({ projectId: 'reeditpro' })
  return createCanonicalSam31GpuCompleteSourcePerformanceOwnerFromObjectPorts({
    controlPlaneObjectPort: createCanonicalGcsSourceAnalysisJsonObjectPort({
      storage,
      bucketName: 'reeditpro-production-reeditpro-control-plane-state',
    }),
    privateGpuObjectPort: createCanonicalGcsSourceAnalysisJsonObjectPort({
      storage,
      bucketName: 'reeditpro-production-reeditpro-masks',
    }),
    now: input.now,
  })
}

export async function persistCanonicalSam31GpuCompleteSourceOwnerInput(
  input: {
    readonly objectPort: CanonicalCreateOnlyJsonObjectPort
    readonly observation: CanonicalSam31GpuCompleteSourceExecutionObservation
    readonly stitchEvidence: CanonicalSam31GpuCompleteSourceStitchEvidence
  },
): Promise<{
  executionGroupObservationRef: EvidenceRef
  stitchEvidenceRef: EvidenceRef
}> {
  const observation =
    assertCanonicalSam31GpuCompleteSourceExecutionObservation(input.observation)
  const stitch =
    assertCanonicalSam31GpuCompleteSourceStitchEvidence(input.stitchEvidence)
  const executionGroupObservationRef =
    canonicalSam31GpuCompleteSourceExecutionObservationRef(observation)
  const stitchEvidenceRef =
    canonicalSam31GpuCompleteSourceStitchEvidenceRef(stitch)
  await persistExact(input.objectPort,
    recordPath(DEFAULT_PREFIX, 'execution-groups',
      executionGroupObservationRef), observation)
  await persistExact(input.objectPort,
    recordPath(DEFAULT_PREFIX, 'stitches', stitchEvidenceRef), stitch)
  return { executionGroupObservationRef, stitchEvidenceRef }
}

function assertChunkLineage(input: {
  observation: CanonicalSam31GpuCompleteSourceExecutionObservation
  chunk: z.infer<typeof chunkObservationSchema>
  task: CanonicalSam31GpuTaskRecord
  launch: CanonicalProfessionalGpuJobLaunch
  terminal: CanonicalProfessionalGpuJobTerminal
  privateOutput: CanonicalSam31PrivateOutputRereadEvidence
  result: CanonicalSam31GpuRuntimeResultAdmission
  response: CanonicalSam31GpuRuntimeResponse
}): void {
  const {
    observation,
    chunk,
    task,
    launch,
    terminal,
    privateOutput,
    result,
    response,
  } = input
  const source = task.runtimeRequest.sourceMedia
  const exact = chunk.invocationId === task.invocationId
    && sameRef(chunk.taskRef, ref(task.taskId, task.taskRecordHash))
    && sameRef(chunk.launchRef, ref(launch.launchRecordId, launch.launchHash))
    && sameRef(chunk.resultAdmissionRef,
      ref(result.resultAdmissionId, result.resultAdmissionHash))
    && sameRef(chunk.runtimeResponseObjectRef,
      result.runtimeResponseObjectRef)
    && sameRef(result.taskRef, chunk.taskRef)
    && sameRef(result.launchRef, chunk.launchRef)
    && sameRef(result.terminalRef,
      ref(terminal.terminalRecordId, terminal.terminalHash))
    && sameRef(terminal.launchRef, chunk.launchRef)
    && sameRef(terminal.admissionRef, launch.admissionRef)
    && terminal.cloudJobExecutionRef !== null
    && launch.cloudJobExecutionRef !== null
    && sameRef(terminal.cloudJobExecutionRef, launch.cloudJobExecutionRef)
    && terminal.terminalOutcome === 'completed'
    && terminal.providerInferenceOrSubstantiveWorkOutcome === 'executed'
    && terminal.cloudJobTerminalStateReread
    && terminal.workerStoppedVerified
    && terminal.activeGpuInstancesAfterTerminalObservation === 0
    && terminal.minimumIdleInstances === 0
    && !terminal.retryAllowedWithoutCanonicalReconciliation
    && !terminal.unknownOutcomeBlocksRetry
    && terminal.exactPlatformUsageAndAccountPriceReread
    && terminal.costReceiptPersistedBeforeSettlement
    && !terminal.systemFailureOrUnknownCostChargedToCustomer
    && !terminal.unapprovedOverageChargedToCustomer
    && !terminal.customerWalletOrLedgerMutated
    && sameRef(terminal.workerUsageEvidenceRef,
      result.workerUsageEvidenceRef)
    && sameRef(terminal.currentAccountPriceAuthorityRef,
      result.currentAccountPriceAuthorityRef)
    && sameRef(terminal.attemptCostReceiptRef,
      result.attemptCostReceiptRef)
    && sameRef(result.privateOutputRereadEvidenceRef,
      ref(
        `sam31-private-output-reread:${privateOutput.runtimeResponseObjectRef.id}`,
        privateOutput.evidenceHash,
      ))
    && sameRef(privateOutput.taskRef, chunk.taskRef)
    && sameRef(privateOutput.runtimeResponseObjectRef,
      chunk.runtimeResponseObjectRef)
    && privateOutput.runtimeResponseBindingSha256 ===
      response.responseBindingSha256
    && sameRef(privateOutput.manifestRef, result.manifestRef)
    && sameRef(privateOutput.maskSequenceArtifactRef,
      result.maskSequenceArtifactRef)
    && privateOutput.width === observation.sourceWidth
    && privateOutput.height === observation.sourceHeight
    && privateOutput.firstFrameIndex ===
      chunk.canonicalStartFrameInclusive
    && privateOutput.lastFrameIndex ===
      chunk.canonicalEndFrameInclusive
    && privateOutput.propagatedFrameCount ===
      chunk.canonicalEndFrameInclusive -
        chunk.canonicalStartFrameInclusive + 1
    && privateOutput.exactManifestBytesRereadAndParsed
    && privateOutput.everyMaskPngByteHashReread
    && privateOutput.everyMaskPngDecodedDimensionsMatchSource
    && privateOutput.completeApprovedFrameIntervalCoverageVerified
    && privateOutput.noUnexpectedFilesOrCrossInvocationArtifacts
    && sameRef(result.runtimeRequestRef, task.runtimeRequestRef)
    && result.runtimeResponseBindingSha256 === response.responseBindingSha256
    && sameRef(source.finalizedSourceArtifactRef,
      observation.exactEightMinuteSourceRef)
    && source.width === observation.sourceWidth
    && source.height === observation.sourceHeight
    && source.fpsNumerator === observation.fpsNumerator
    && source.fpsDenominator === observation.fpsDenominator
    && source.canonicalSourceStartFrameInclusive ===
      chunk.canonicalStartFrameInclusive
    && source.canonicalSourceEndFrameInclusive ===
      chunk.canonicalEndFrameInclusive
    && source.decodedFrameCount ===
      chunk.canonicalEndFrameInclusive -
        chunk.canonicalStartFrameInclusive + 1
    && launch.immutableImageDigest === observation.immutableImageDigest
    && result.routeId === observation.route.routeId
    && result.accelerator === observation.route.accelerator
    && launch.routeId === observation.route.routeId
    && launch.accelerator === observation.route.accelerator
    && response.status === 'completed'
    && response.gpuEvidence?.requestedAccelerator ===
      observation.route.accelerator
    && result.exactTaskResponseLaunchTerminalAndOutputReread
    && result.exactGpuAndApprovedFrameRangeVerified
    && result.actualNvdecCudaBfloat16ExecutionVerified
    && result.terminalWorkerStoppedAndScaleBackToZeroVerified
    && result.accountEffectiveAttemptCostReceiptPersisted
    && !result.customerCreditsMutated
    && !result.qaApproved
    && !result.productionAuthorityGranted
  if (!exact) throw conflict(`chunk_${chunk.chunkOrdinal}_lineage_mismatch`)
  const route = canonicalSam31GpuQualificationRouteForLaunch(launch)
  if (stableAuthorityStringify(route) !==
    stableAuthorityStringify(observation.route)) {
    throw conflict(`chunk_${chunk.chunkOrdinal}_route_mismatch`)
  }
}

function assertStitchLineage(input: {
  observation: CanonicalSam31GpuCompleteSourceExecutionObservation
  stitch: CanonicalSam31GpuCompleteSourceStitchEvidence
  chunkRecords: ReadonlyArray<{
    task: CanonicalSam31GpuTaskRecord
    launch: CanonicalProfessionalGpuJobLaunch
    privateOutput: CanonicalSam31PrivateOutputRereadEvidence
    result: CanonicalSam31GpuRuntimeResultAdmission
    response: CanonicalSam31GpuRuntimeResponse
  }>
}): void {
  const { observation, stitch, chunkRecords } = input
  const expectedResultRefs = observation.chunks.map((chunk) =>
    chunk.resultAdmissionRef)
  const exact = sameRef(stitch.executionGroupRef,
    canonicalSam31GpuCompleteSourceExecutionObservationRef(observation))
    && sameRef(stitch.exactEightMinuteSourceRef,
      observation.exactEightMinuteSourceRef)
    && sameRef(stitch.chunkPlanRef, observation.chunkPlanRef)
    && stitch.sourceWidth === observation.sourceWidth
    && stitch.sourceHeight === observation.sourceHeight
    && stitch.sourceFrameCount === observation.sourceFrameCount
    && stableAuthorityStringify(stitch.orderedChunkResultRefs) ===
      stableAuthorityStringify(expectedResultRefs)
    && chunkRecords.every(({ result }, index) =>
      sameRef(ref(result.resultAdmissionId, result.resultAdmissionHash),
        expectedResultRefs[index]))
  if (!exact) throw conflict('stitch_lineage_mismatch')
}

function completeChunkCoverage(
  chunks: ReadonlyArray<z.infer<typeof chunkObservationSchema>>,
  sourceFrameCount: number,
): boolean {
  if (chunks.length < 2) return false
  return chunks.every((chunk, index) => {
    if (
      chunk.chunkOrdinal !== index + 1
      || chunk.canonicalEndFrameInclusive < chunk.canonicalStartFrameInclusive
    ) return false
    if (index === 0) {
      return chunk.canonicalStartFrameInclusive === 0
        && chunk.overlapWithPreviousFrames === 0
    }
    const previous = chunks[index - 1]
    return chunk.canonicalStartFrameInclusive ===
      previous.canonicalEndFrameInclusive -
        chunk.overlapWithPreviousFrames + 1
  }) && chunks[chunks.length - 1].canonicalEndFrameInclusive ===
    sourceFrameCount - 1
}

function uniqueChunkRefs(
  chunks: ReadonlyArray<z.infer<typeof chunkObservationSchema>>,
): boolean {
  return new Set(chunks.flatMap((chunk) => [
    refKey(chunk.taskRef),
    refKey(chunk.launchRef),
    refKey(chunk.resultAdmissionRef),
    refKey(chunk.runtimeResponseObjectRef),
  ])).size === chunks.length * 4
}

function ref(id: string, hash: string): EvidenceRef {
  return { id, version: 1, contentHash: `sha256:${hash}` }
}

function contentRef(id: string, value: unknown): EvidenceRef {
  return ref(id, sha256AuthorityValue(value))
}

function refKey(value: {
  readonly id: string
  readonly version: number
  readonly contentHash: string
}): string {
  return `${value.id}:${value.version}:${value.contentHash}`
}

function sameRef(
  left: { readonly id: string; readonly version: number; readonly contentHash: string },
  right: { readonly id: string; readonly version: number; readonly contentHash: string },
): boolean {
  return left.id === right.id
    && left.version === right.version
    && left.contentHash === right.contentHash
}

function recordPath(
  prefix: string,
  kind: 'execution-groups' | 'stitches' | 'performance',
  value: EvidenceRef,
): string {
  const parsed = refSchema.parse(value)
  const idHash = createHash('sha256').update(parsed.id).digest('hex')
  return `${normalizePrefix(prefix)}/${kind}/${idHash}/${parsed.contentHash.slice(7)}.json`
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
  if (!reread || !reread.equals(body)) {
    throw conflict(status === 'already_exists'
      ? 'create_only_collision' : 'exact_reread_failed')
  }
}

async function readTypedObject<T>(
  port: CanonicalCreateOnlyJsonObjectPort,
  path: string,
  assertValue: (value: unknown) => T,
): Promise<T | null> {
  const body = await port.readExact(path)
  if (!body) return null
  return readRecord(body, assertValue)
}

function readRecord<T>(body: Buffer, assertValue: (value: unknown) => T): T {
  if (!Buffer.isBuffer(body)
    || body.byteLength < 2
    || body.byteLength > MAXIMUM_RECORD_BYTES) {
    throw conflict('record_size_invalid')
  }
  let value: unknown
  try {
    value = JSON.parse(body.toString('utf8'))
  } catch {
    throw conflict('record_json_invalid')
  }
  const parsed = assertValue(value)
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

function assertReadPort(
  port: CanonicalSam31GpuCompleteSourcePerformanceReadPort,
): void {
  if (
    !port
    || typeof port.rereadExecutionGroupObservation !== 'function'
    || typeof port.rereadStitchEvidence !== 'function'
    || typeof port.rereadTask !== 'function'
    || typeof port.rereadLaunch !== 'function'
    || typeof port.rereadResultAdmission !== 'function'
    || typeof port.rereadRuntimeResponse !== 'function'
  ) throw conflict('read_port_invalid')
}

function assertRepository(
  repository: CanonicalSam31GpuCompleteSourcePerformanceRepository,
): void {
  if (
    !repository
    || typeof repository.persistPerformanceEvidenceCreateOnly !== 'function'
    || typeof repository.rereadPerformanceEvidence !== 'function'
  ) throw conflict('repository_invalid')
}

function assertObjectPort(port: CanonicalCreateOnlyJsonObjectPort): void {
  if (!port
    || typeof port.createOnly !== 'function'
    || typeof port.readExact !== 'function') throw conflict('object_port_invalid')
}

function conflict(reason: string): Error {
  return new Error(`SAM31_COMPLETE_SOURCE_PERFORMANCE_CONFLICT:${reason}`)
}
