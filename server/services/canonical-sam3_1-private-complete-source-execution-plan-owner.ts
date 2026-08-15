import { createHash } from 'node:crypto'

import { z } from 'zod'

import type {
  CanonicalCreateOnlyJsonObjectPort,
} from './canonical-gcs-source-analysis-lifecycle-store'
import {
  assertPlainSerializedData,
} from './canonical-professional-gpu-job-lifecycle-service'
import {
  parseCanonicalSam31EightMinuteQualificationSourcePlan,
  parseCanonicalSam31EightMinuteQualificationSourcePreparation,
  type CanonicalSam31EightMinuteQualificationSourcePlan,
  type CanonicalSam31EightMinuteQualificationSourcePreparation,
} from './canonical-sam3_1-eight-minute-qualification-source-owner'
import {
  assertCanonicalSam31EightMinuteSourcePreparationTerminal,
  type CanonicalSam31EightMinuteSourcePreparationTerminal,
} from './canonical-sam3_1-eight-minute-source-preparation-terminal-owner'
import {
  assertCanonicalSam31PrivateInternalDispatchAllowed,
  assertCanonicalSam31PrivateInternalDispatchReadiness,
  type CanonicalSam31PrivateInternalDispatchReadiness,
} from './canonical-sam3_1-private-internal-dispatch-readiness-owner'
import {
  sha256AuthorityValue,
  stableAuthorityStringify,
} from './private-edit-authority-store'

export const CANONICAL_SAM3_1_PRIVATE_COMPLETE_SOURCE_EXECUTION_PLAN_VERSION =
  'canonical-sam3_1-private-complete-source-execution-plan-v1' as const
export const CANONICAL_SAM3_1_PRIVATE_COMPLETE_SOURCE_EXECUTION_PLAN_OWNER_VERSION =
  'canonical-sam3_1-private-complete-source-execution-plan-owner-v1' as const

const DEFAULT_PREFIX =
  'private/canonical-professional-gpu/sam3_1/v1/private-complete-source-execution-plans'
const MAXIMUM_RECORD_BYTES = 4 * 1024 * 1024
const SOURCE_DURATION_MILLISECONDS = 480_000
const SOURCE_FRAME_COUNT = 11_520
const SOURCE_WIDTH = 3_840
const SOURCE_HEIGHT = 2_160
const FPS_NUMERATOR = 24
const FPS_DENOMINATOR = 1
const CHUNK_COUNT = 49
const CHUNK_FRAME_COUNT = 240
const CHUNK_STRIDE_FRAME_COUNT = 239

const safeId = z.string().trim().min(1).max(240)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:@/+:-]*$/u)
  .refine((value) => !value.includes('..') && !value.includes('//'))
const safePrefix = z.string().trim().min(1).max(512)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._/-]*$/u)
  .refine((value) => !value.includes('..')
    && !value.includes('//') && !value.endsWith('/'))
const sha256 = z.string().regex(/^[a-f0-9]{64}$/u)
const prefixedSha256 = z.string().regex(/^sha256:[a-f0-9]{64}$/u)
const timestamp = z.string().datetime({ offset: true })
const routeIdSchema = z.enum([
  'a100_80gb_heavy_primary',
  'l4_heavy_fallback',
])
const refSchema = z.object({
  id: safeId,
  version: z.number().int().positive().safe(),
  contentHash: prefixedSha256,
}).strict()
type EvidenceRef = z.infer<typeof refSchema>

const chunkSchema = z.object({
  chunkOrdinal: z.number().int().min(1).max(CHUNK_COUNT),
  canonicalStartFrameInclusive: z.number().int().nonnegative().safe(),
  canonicalEndFrameInclusive: z.number().int().nonnegative().safe(),
  overlapWithPreviousFrames: z.union([z.literal(0), z.literal(1)]),
  preparedChunkArtifactRef: refSchema,
  exactSourceRangeMappingRef: refSchema,
  ffprobeEvidenceRef: refSchema,
  gpuPreparationEvidenceRef: refSchema,
  decodedFrameCount: z.number().int().min(1).max(CHUNK_FRAME_COUNT),
  byteLength: z.number().int().positive().safe(),
  sha256,
  privateInvocationId: safeId,
  executionAttemptRef: refSchema,
  privateTaskInputTransportRef: refSchema,
  privateTaskOutputTransportRef: refSchema,
}).strict()

const planWithoutHashSchema = z.object({
  schemaVersion: z.literal(
    CANONICAL_SAM3_1_PRIVATE_COMPLETE_SOURCE_EXECUTION_PLAN_VERSION,
  ),
  ownerVersion: z.literal(
    CANONICAL_SAM3_1_PRIVATE_COMPLETE_SOURCE_EXECUTION_PLAN_OWNER_VERSION,
  ),
  source: z.literal(
    'canonical_server_sam3_1_private_complete_source_execution_plan_owner',
  ),
  evidenceClass: z.literal(
    'canonical_private_exact_source_preparation_dispatch_and_rate_reread',
  ),
  status: z.literal('ready_for_private_complete_source_task_materialization'),
  executionPlanId: safeId,
  qualificationId: safeId,
  runOrdinal: z.number().int().min(1).max(30).safe(),
  routeId: routeIdSchema,
  operationId: z.literal('tool.sam3_1.segment_and_track_subject.v1'),
  approvedSubjectText: z.string().trim().min(1).max(240),
  compiledSubjectIntentRef: refSchema,
  promptApprovalRef: refSchema,
  privateInternalDispatchReadinessRef: refSchema,
  runtimeReleaseRef: refSchema,
  accountEffectiveRateAuthorityRef: refSchema,
  immutableImageDigest: prefixedSha256,
  qualificationSourcePlanRef: refSchema,
  sourcePreparationRef: refSchema,
  sourcePreparationTerminalRef: refSchema,
  exactEightMinuteSourceRef: refSchema,
  sourceDurationMilliseconds: z.literal(SOURCE_DURATION_MILLISECONDS),
  sourceFrameCount: z.literal(SOURCE_FRAME_COUNT),
  sourceWidth: z.literal(SOURCE_WIDTH),
  sourceHeight: z.literal(SOURCE_HEIGHT),
  fpsNumerator: z.literal(FPS_NUMERATOR),
  fpsDenominator: z.literal(FPS_DENOMINATOR),
  chunkFrameCount: z.literal(CHUNK_FRAME_COUNT),
  chunkOverlapFrameCount: z.literal(1),
  chunkStrideFrameCount: z.literal(CHUNK_STRIDE_FRAME_COUNT),
  exactChunkCount: z.literal(CHUNK_COUNT),
  chunks: z.array(chunkSchema).length(CHUNK_COUNT),
  exactSourcePlanPreparationTerminalAndDispatchReread: z.literal(true),
  everyPreparedChunkBoundExactlyOnce: z.literal(true),
  exactAccountEffectiveRouteRateBoundBeforeTaskMaterialization:
    z.literal(true),
  platformFundedPrivateQualification: z.literal(true),
  userTriggeredScaleFromZeroRequired: z.literal(true),
  maximumSimultaneousRouteAttempts: z.literal(1),
  chunksMustExecuteSequentially: z.literal(true),
  otherGpuRouteMayStartBeforeThisRunTerminates: z.literal(false),
  capacityMustReturnToZeroBeforeOtherRoute: z.literal(true),
  substantiveCpuExecutionAllowed: z.literal(false),
  sourceResolutionReductionAllowed: z.literal(false),
  automaticRetryOrFallbackAllowed: z.literal(false),
  completeSourcePerformanceEvidencePending: z.literal(true),
  independentTemporalQualityEvidencePending: z.literal(true),
  gpuJobDispatched: z.literal(false),
  customerCreditsMutated: z.literal(false),
  customerOrPublicDispatchAuthorized: z.literal(false),
  publicConcurrencyCapacityRequiredForThisPrivateRun: z.literal(false),
  futurePublicA100ConcurrencyTarget: z.literal(16),
  futurePublicL4ConcurrencyTarget: z.literal(16),
  qaApprovalGranted: z.literal(false),
  publicDeliveryAuthorized: z.literal(false),
  productionAuthorityGranted: z.literal(false),
  plannedAt: timestamp,
  expiresAt: timestamp,
}).strict().superRefine((value, context) => {
  if (Date.parse(value.expiresAt) <= Date.parse(value.plannedAt)
    || !exactChunkSet(value.chunks, value.executionPlanId)) {
    context.addIssue({
      code: 'custom',
      message: 'SAM 3.1 private complete-source plan is inconsistent.',
    })
  }
})

export const canonicalSam31PrivateCompleteSourceExecutionPlanSchema =
  planWithoutHashSchema.extend({ planHash: sha256 }).strict()
    .superRefine((value, context) => {
      if (Date.parse(value.expiresAt) <= Date.parse(value.plannedAt)
        || !exactChunkSet(value.chunks, value.executionPlanId)) {
        context.addIssue({
          code: 'custom',
          message: 'SAM 3.1 private complete-source plan is inconsistent.',
        })
      }
    })
export type CanonicalSam31PrivateCompleteSourceExecutionPlan = z.infer<
  typeof canonicalSam31PrivateCompleteSourceExecutionPlanSchema
>

export interface CanonicalSam31PrivateCompleteSourceExecutionPlanRepository {
  readonly schemaVersion:
    'canonical-sam3_1-private-complete-source-execution-plan-repository-v1'
  persistCreateOnly(input: {
    readonly plan: CanonicalSam31PrivateCompleteSourceExecutionPlan
  }): Promise<'created' | 'identical_replay'>
  reread(input: {
    readonly executionPlanRef: EvidenceRef
  }): Promise<CanonicalSam31PrivateCompleteSourceExecutionPlan | null>
}

export function createCanonicalSam31PrivateCompleteSourceExecutionPlanOwner() {
  return Object.freeze({
    schemaVersion:
      CANONICAL_SAM3_1_PRIVATE_COMPLETE_SOURCE_EXECUTION_PLAN_OWNER_VERSION,
    privateInternalOnly: true as const,
    customerOrPublicDispatchAuthorized: false as const,
    build(untrusted: unknown): CanonicalSam31PrivateCompleteSourceExecutionPlan {
      assertPlainSerializedData(untrusted,
        'sam31_private_complete_source_execution_plan_input')
      const input = z.object({
        executionPlanId: safeId,
        qualificationId: safeId,
        runOrdinal: z.number().int().min(1).max(30).safe(),
        routeId: routeIdSchema,
        approvedSubjectText: z.string().trim().min(1).max(240),
        compiledSubjectIntentRef: refSchema,
        promptApprovalRef: refSchema,
        sourcePlan: z.unknown(),
        sourcePreparation: z.unknown(),
        sourcePreparationTerminal: z.unknown(),
        privateInternalDispatchReadiness: z.unknown(),
        plannedAt: timestamp,
        expiresAt: timestamp,
      }).strict().parse(untrusted)
      rejectUnsafeText(input.approvedSubjectText)
      const sourcePlan =
        parseCanonicalSam31EightMinuteQualificationSourcePlan(input.sourcePlan)
      const preparation =
        parseCanonicalSam31EightMinuteQualificationSourcePreparation(
          input.sourcePreparation,
        )
      const terminal =
        assertCanonicalSam31EightMinuteSourcePreparationTerminal(
          input.sourcePreparationTerminal,
        )
      const readiness = assertCanonicalSam31PrivateInternalDispatchReadiness(
        input.privateInternalDispatchReadiness,
        input.plannedAt,
      )
      const runtimeReleaseRef = input.routeId === 'a100_80gb_heavy_primary'
        ? readiness.a100RuntimeReleaseRef : readiness.l4RuntimeReleaseRef
      const rateAuthorityRef = input.routeId === 'a100_80gb_heavy_primary'
        ? readiness.currentA100RateAuthorityRef
        : readiness.currentL4RateAuthorityRef
      const immutableImageDigest = input.routeId ===
        'a100_80gb_heavy_primary'
        ? readiness.a100ImmutableImageDigest : readiness.l4ImmutableImageDigest
      assertCanonicalSam31PrivateInternalDispatchAllowed({
        readiness,
        routeId: input.routeId,
        runtimeReleaseRef,
        rateAuthorityRef,
        immutableImageDigest,
        at: input.plannedAt,
      })
      assertExactSourceLineage({ sourcePlan, preparation, terminal, readiness,
        plannedAt: input.plannedAt, expiresAt: input.expiresAt })
      const chunks = preparation.preparedChunks.map((chunk) => {
        const suffix = String(chunk.chunkOrdinal).padStart(3, '0')
        const basis = {
          executionPlanId: input.executionPlanId,
          qualificationId: input.qualificationId,
          runOrdinal: input.runOrdinal,
          routeId: input.routeId,
          chunkOrdinal: chunk.chunkOrdinal,
          preparedChunkArtifactRef: chunk.preparedChunkArtifactRef,
          exactSourceRangeMappingRef: chunk.exactSourceRangeMappingRef,
        }
        return chunkSchema.parse({
          chunkOrdinal: chunk.chunkOrdinal,
          canonicalStartFrameInclusive: chunk.canonicalStartFrameInclusive,
          canonicalEndFrameInclusive: chunk.canonicalEndFrameInclusive,
          overlapWithPreviousFrames: chunk.overlapWithPreviousFrames,
          preparedChunkArtifactRef: chunk.preparedChunkArtifactRef,
          exactSourceRangeMappingRef: chunk.exactSourceRangeMappingRef,
          ffprobeEvidenceRef: chunk.ffprobeEvidenceRef,
          gpuPreparationEvidenceRef: chunk.gpuPreparationEvidenceRef,
          decodedFrameCount: chunk.decodedFrameCount,
          byteLength: chunk.byteLength,
          sha256: chunk.sha256,
          privateInvocationId: `${input.executionPlanId}:chunk-${suffix}`,
          executionAttemptRef: opaqueRef(
            `${input.executionPlanId}:attempt-${suffix}`, { ...basis,
              kind: 'private_complete_source_execution_attempt' },
          ),
          privateTaskInputTransportRef: opaqueRef(
            `${input.executionPlanId}:input-${suffix}`, { ...basis,
              kind: 'private_exact_prepared_chunk_input' },
          ),
          privateTaskOutputTransportRef: opaqueRef(
            `${input.executionPlanId}:output-${suffix}`, { ...basis,
              kind: 'private_exact_mask_output' },
          ),
        })
      })
      const payload = planWithoutHashSchema.parse({
        schemaVersion:
          CANONICAL_SAM3_1_PRIVATE_COMPLETE_SOURCE_EXECUTION_PLAN_VERSION,
        ownerVersion:
          CANONICAL_SAM3_1_PRIVATE_COMPLETE_SOURCE_EXECUTION_PLAN_OWNER_VERSION,
        source:
          'canonical_server_sam3_1_private_complete_source_execution_plan_owner',
        evidenceClass:
          'canonical_private_exact_source_preparation_dispatch_and_rate_reread',
        status: 'ready_for_private_complete_source_task_materialization',
        executionPlanId: input.executionPlanId,
        qualificationId: input.qualificationId,
        runOrdinal: input.runOrdinal,
        routeId: input.routeId,
        operationId: 'tool.sam3_1.segment_and_track_subject.v1',
        approvedSubjectText: input.approvedSubjectText,
        compiledSubjectIntentRef: input.compiledSubjectIntentRef,
        promptApprovalRef: input.promptApprovalRef,
        privateInternalDispatchReadinessRef: ref(
          readiness.readinessId,
          readiness.readinessHash,
        ),
        runtimeReleaseRef,
        accountEffectiveRateAuthorityRef: rateAuthorityRef,
        immutableImageDigest,
        qualificationSourcePlanRef: ref(
          sourcePlan.qualificationSourceId,
          sourcePlan.planHash,
        ),
        sourcePreparationRef: ref(
          preparation.preparationId,
          preparation.preparationHash,
        ),
        sourcePreparationTerminalRef: ref(
          terminal.invocationId,
          terminal.terminalHash,
        ),
        exactEightMinuteSourceRef: sourcePlan.exactEightMinuteSourceRef,
        sourceDurationMilliseconds: SOURCE_DURATION_MILLISECONDS,
        sourceFrameCount: SOURCE_FRAME_COUNT,
        sourceWidth: SOURCE_WIDTH,
        sourceHeight: SOURCE_HEIGHT,
        fpsNumerator: FPS_NUMERATOR,
        fpsDenominator: FPS_DENOMINATOR,
        chunkFrameCount: CHUNK_FRAME_COUNT,
        chunkOverlapFrameCount: 1,
        chunkStrideFrameCount: CHUNK_STRIDE_FRAME_COUNT,
        exactChunkCount: CHUNK_COUNT,
        chunks,
        exactSourcePlanPreparationTerminalAndDispatchReread: true,
        everyPreparedChunkBoundExactlyOnce: true,
        exactAccountEffectiveRouteRateBoundBeforeTaskMaterialization: true,
        platformFundedPrivateQualification: true,
        userTriggeredScaleFromZeroRequired: true,
        maximumSimultaneousRouteAttempts: 1,
        chunksMustExecuteSequentially: true,
        otherGpuRouteMayStartBeforeThisRunTerminates: false,
        capacityMustReturnToZeroBeforeOtherRoute: true,
        substantiveCpuExecutionAllowed: false,
        sourceResolutionReductionAllowed: false,
        automaticRetryOrFallbackAllowed: false,
        completeSourcePerformanceEvidencePending: true,
        independentTemporalQualityEvidencePending: true,
        gpuJobDispatched: false,
        customerCreditsMutated: false,
        customerOrPublicDispatchAuthorized: false,
        publicConcurrencyCapacityRequiredForThisPrivateRun: false,
        futurePublicA100ConcurrencyTarget: 16,
        futurePublicL4ConcurrencyTarget: 16,
        qaApprovalGranted: false,
        publicDeliveryAuthorized: false,
        productionAuthorityGranted: false,
        plannedAt: input.plannedAt,
        expiresAt: input.expiresAt,
      })
      return assertCanonicalSam31PrivateCompleteSourceExecutionPlan({
        ...payload,
        planHash: sha256AuthorityValue(payload),
      }, input.plannedAt)
    },
  })
}

export function assertCanonicalSam31PrivateCompleteSourceExecutionPlan(
  value: unknown,
  at?: string,
): CanonicalSam31PrivateCompleteSourceExecutionPlan {
  assertPlainSerializedData(value,
    'sam31_private_complete_source_execution_plan')
  const parsed = canonicalSam31PrivateCompleteSourceExecutionPlanSchema
    .parse(value)
  const { planHash, ...payload } = parsed
  if (planHash !== sha256AuthorityValue(payload)) {
    throw new TypeError('SAM 3.1 private complete-source plan changed.')
  }
  if (at && (Date.parse(timestamp.parse(at)) < Date.parse(parsed.plannedAt)
    || Date.parse(at) >= Date.parse(parsed.expiresAt))) {
    throw new TypeError('SAM 3.1 private complete-source plan is stale.')
  }
  return Object.freeze(structuredClone(parsed))
}

export function canonicalSam31PrivateCompleteSourceExecutionPlanRef(
  value: unknown,
): EvidenceRef {
  const parsed = assertCanonicalSam31PrivateCompleteSourceExecutionPlan(value)
  return ref(parsed.executionPlanId, parsed.planHash)
}

export function createCanonicalSam31PrivateCompleteSourceExecutionPlanRepository(
  input: {
    readonly objectPort: CanonicalCreateOnlyJsonObjectPort
    readonly prefix?: string
  },
): CanonicalSam31PrivateCompleteSourceExecutionPlanRepository {
  if (typeof input.objectPort?.createOnly !== 'function'
    || typeof input.objectPort?.readExact !== 'function') {
    throw new TypeError('SAM 3.1 private execution-plan store is absent.')
  }
  const prefix = safePrefix.parse(input.prefix ?? DEFAULT_PREFIX)
  const reread = async (executionPlanRef: EvidenceRef) => {
    const exactRef = refSchema.parse(executionPlanRef)
    const path = `${prefix}/${exactRef.id}.json`
    const body = await input.objectPort.readExact(path)
    if (!body) return null
    if (!Buffer.isBuffer(body) || body.byteLength < 2
      || body.byteLength > MAXIMUM_RECORD_BYTES) {
      throw new TypeError('SAM 3.1 private execution-plan bytes changed.')
    }
    const plan = assertCanonicalSam31PrivateCompleteSourceExecutionPlan(
      JSON.parse(body.toString('utf8')) as unknown,
    )
    if (!sameRef(canonicalSam31PrivateCompleteSourceExecutionPlanRef(plan),
      exactRef) || stableAuthorityStringify(plan) !== body.toString('utf8')) {
      throw new TypeError('SAM 3.1 private execution-plan reread changed.')
    }
    return plan
  }
  return Object.freeze({
    schemaVersion:
      'canonical-sam3_1-private-complete-source-execution-plan-repository-v1' as const,
    async persistCreateOnly({ plan: untrusted }: {
      readonly plan: CanonicalSam31PrivateCompleteSourceExecutionPlan
    }) {
      const plan = assertCanonicalSam31PrivateCompleteSourceExecutionPlan(
        untrusted,
      )
      const body = Buffer.from(stableAuthorityStringify(plan), 'utf8')
      const disposition = await input.objectPort.createOnly({
        objectPath: `${prefix}/${plan.executionPlanId}.json`,
        body,
        contentSha256: createHash('sha256').update(body).digest('hex'),
      })
      const exact = await reread(
        canonicalSam31PrivateCompleteSourceExecutionPlanRef(plan),
      )
      if (!exact || exact.planHash !== plan.planHash) {
        throw new TypeError('SAM 3.1 private execution-plan reread changed.')
      }
      return disposition === 'created'
        ? 'created' as const : 'identical_replay' as const
    },
    reread: ({ executionPlanRef }: {
      readonly executionPlanRef: EvidenceRef
    }) => reread(executionPlanRef),
  })
}

function assertExactSourceLineage(input: {
  sourcePlan: CanonicalSam31EightMinuteQualificationSourcePlan
  preparation: CanonicalSam31EightMinuteQualificationSourcePreparation
  terminal: CanonicalSam31EightMinuteSourcePreparationTerminal
  readiness: CanonicalSam31PrivateInternalDispatchReadiness
  plannedAt: string
  expiresAt: string
}) {
  const planRef = ref(input.sourcePlan.qualificationSourceId,
    input.sourcePlan.planHash)
  const preparationRef = ref(input.preparation.preparationId,
    input.preparation.preparationHash)
  if (input.preparation.disposition !== 'ready'
    || !sameRef(input.preparation.qualificationSourcePlanRef, planRef)
    || !sameRef(input.preparation.exactEightMinuteSourceRef,
      input.sourcePlan.exactEightMinuteSourceRef)
    || input.preparation.preparedChunkCount !== CHUNK_COUNT
    || !sameRef(input.terminal.qualificationSourcePlanRef, planRef)
    || !sameRef(input.terminal.preparationRef, preparationRef)
    || input.terminal.exactPreparedChunkCount !== CHUNK_COUNT
    || !input.terminal.sourcePreparationReadyForA100QualificationInput
    || !input.terminal.terminalWorkerStopped
    || input.terminal.activeGpuExecutionsAfterObservation !== 0
    || !input.terminal.scaleBackToZeroVerified
    || Date.parse(input.plannedAt) < Date.parse(input.terminal.observedAt)
    || Date.parse(input.expiresAt) > Date.parse(input.readiness.expiresAt)) {
    throw new TypeError(
      'SAM 3.1 private execution plan lost source-preparation lineage.',
    )
  }
}

function exactChunkSet(
  chunks: ReadonlyArray<z.infer<typeof chunkSchema>>,
  executionPlanId: string,
) {
  const uniqueArtifacts = new Set(chunks.map((chunk) =>
    `${chunk.preparedChunkArtifactRef.id}:` +
    `${chunk.preparedChunkArtifactRef.version}:` +
    chunk.preparedChunkArtifactRef.contentHash))
  const uniqueInvocations = new Set(chunks.map((chunk) =>
    chunk.privateInvocationId))
  return chunks.length === CHUNK_COUNT
    && uniqueArtifacts.size === CHUNK_COUNT
    && uniqueInvocations.size === CHUNK_COUNT
    && chunks.every((chunk, index) => {
      const start = index * CHUNK_STRIDE_FRAME_COUNT
      const end = Math.min(SOURCE_FRAME_COUNT - 1,
        start + CHUNK_FRAME_COUNT - 1)
      return chunk.chunkOrdinal === index + 1
        && chunk.canonicalStartFrameInclusive === start
        && chunk.canonicalEndFrameInclusive === end
        && chunk.overlapWithPreviousFrames === (index === 0 ? 0 : 1)
        && chunk.decodedFrameCount === end - start + 1
        && chunk.preparedChunkArtifactRef.contentHash ===
          `sha256:${chunk.sha256}`
        && chunk.privateInvocationId ===
          `${executionPlanId}:chunk-${String(index + 1).padStart(3, '0')}`
    })
}

function rejectUnsafeText(value: string) {
  if (/(?:https?:|file:|data:|blob:|javascript:|\\|\/Users\/|\/Volumes\/|\/tmp\/|api[_-]?key|password|credential|secret|access[_-]?token|refresh[_-]?token|\bsk-[A-Za-z0-9_-]+)/iu
    .test(value)) {
    throw new TypeError('SAM 3.1 approved subject text is unsafe.')
  }
}

function opaqueRef(id: string, value: unknown): EvidenceRef {
  return ref(id, sha256AuthorityValue(value))
}

function ref(id: string, hash: string): EvidenceRef {
  return refSchema.parse({
    id,
    version: 1,
    contentHash: hash.startsWith('sha256:') ? hash : `sha256:${hash}`,
  })
}

function sameRef(left: EvidenceRef, right: EvidenceRef) {
  return left.id === right.id && left.version === right.version
    && left.contentHash === right.contentHash
}
