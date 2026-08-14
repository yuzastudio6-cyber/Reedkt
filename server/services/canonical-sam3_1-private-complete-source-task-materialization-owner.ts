import { createHash } from 'node:crypto'

import { z } from 'zod'

import {
  assertCanonicalProfessionalGpuPrivateInternalFundedDispatchAdmission,
} from './canonical-professional-gpu-plan-funded-dispatch-service'
import type {
  CanonicalCreateOnlyJsonObjectPort,
} from './canonical-gcs-source-analysis-lifecycle-store'
import {
  assertCanonicalProfessionalGpuRuntimeLaunchTarget,
  assertPlainSerializedData,
} from './canonical-professional-gpu-job-lifecycle-service'
import {
  assertCanonicalSam31PrivateCompleteSourceExecutionPlan,
  canonicalSam31PrivateCompleteSourceExecutionPlanRef,
  type CanonicalSam31PrivateCompleteSourceExecutionPlanRepository,
} from './canonical-sam3_1-private-complete-source-execution-plan-owner'
import {
  assertCanonicalSam31PrivateInternalDispatchAllowed,
  assertCanonicalSam31PrivateInternalDispatchReadiness,
  type CanonicalSam31PrivateInternalDispatchReadinessReadPort,
} from './canonical-sam3_1-private-internal-dispatch-readiness-owner'
import {
  sha256AuthorityValue,
  stableAuthorityStringify,
} from './private-edit-authority-store'
import {
  assertCanonicalSam31GpuPrivateInputStagingEvidence,
  type CanonicalSam31GpuPrivateInputStagingPort,
} from '../workers/masks/canonical-sam3_1-gpu-private-input-staging-service'
import {
  assertCanonicalSam31GpuTaskRecord,
  buildCanonicalSam31GpuTaskContext,
  buildCanonicalSam31GpuTaskRecord,
  type CanonicalSam31GpuTaskStore,
} from '../workers/masks/canonical-sam3_1-gpu-task-owner-service'

export const CANONICAL_SAM3_1_PRIVATE_COMPLETE_SOURCE_TASK_MATERIALIZATION_VERSION =
  'canonical-sam3_1-private-complete-source-task-materialization-v1' as const
export const CANONICAL_SAM3_1_PRIVATE_COMPLETE_SOURCE_TASK_MATERIALIZATION_OWNER_VERSION =
  'canonical-sam3_1-private-complete-source-task-materialization-owner-v1' as const
export const CANONICAL_SAM3_1_PRIVATE_COMPLETE_SOURCE_CHUNK_TERMINAL_REREAD_VERSION =
  'canonical-sam3_1-private-complete-source-chunk-terminal-reread-v1' as const

const DEFAULT_PREFIX =
  'private/canonical-professional-gpu/sam3_1/v1/private-complete-source-task-materializations'
const MAXIMUM_RECORD_BYTES = 4 * 1024 * 1024
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
const refSchema = z.object({
  id: safeId,
  version: z.number().int().positive().safe(),
  contentHash: prefixedSha256,
}).strict()
type EvidenceRef = z.infer<typeof refSchema>

const chunkTerminalWithoutHashSchema = z.object({
  schemaVersion: z.literal(
    CANONICAL_SAM3_1_PRIVATE_COMPLETE_SOURCE_CHUNK_TERMINAL_REREAD_VERSION,
  ),
  source: z.literal(
    'canonical_server_sam3_1_private_complete_source_chunk_terminal_owner',
  ),
  evidenceClass: z.literal(
    'canonical_private_exact_task_response_output_cost_and_scale_zero_reread',
  ),
  executionPlanRef: refSchema,
  routeId: z.enum(['a100_80gb_heavy_primary', 'l4_heavy_fallback']),
  chunkOrdinal: z.number().int().min(1).max(49),
  taskRecordRef: refSchema,
  runtimeResponseRef: refSchema,
  privateOutputRereadEvidenceRef: refSchema,
  accountEffectiveAttemptCostReceiptRef: refSchema,
  scaleBackToZeroObservationRef: refSchema,
  providerOutcome: z.literal('executed'),
  runtimeStatus: z.literal('completed'),
  exactTaskResponseOutputAndAccountCostReread: z.literal(true),
  activeGpuExecutionsAfterTerminal: z.literal(0),
  minimumIdleGpuInstancesAfterTerminal: z.literal(0),
  scaleBackToZeroVerified: z.literal(true),
  nextChunkTaskMaterializationAllowed: z.literal(true),
  automaticRetryOrFallbackStarted: z.literal(false),
  customerCreditsMutated: z.literal(false),
  qaApproved: z.literal(false),
  publicDeliveryAuthorized: z.literal(false),
  productionAuthorityGranted: z.literal(false),
  completedAt: timestamp,
}).strict()

export const canonicalSam31PrivateCompleteSourceChunkTerminalRereadSchema =
  chunkTerminalWithoutHashSchema.extend({ terminalHash: sha256 }).strict()
export type CanonicalSam31PrivateCompleteSourceChunkTerminalReread = z.infer<
  typeof canonicalSam31PrivateCompleteSourceChunkTerminalRereadSchema
>

const taskAuthoritySchema = z.object({
  trackAllOrchestraBinding: z.unknown(),
  editPlanVersionId: safeId,
  editPlanVersionRef: refSchema,
  outputId: safeId,
  confirmedOutputFrameRef: refSchema,
  sceneId: safeId,
  sourceBindingRef: refSchema,
  specializedRuntimeRelease: z.unknown(),
  primaryRateAuthorityRef: refSchema,
  fallbackRateAuthorityRef: refSchema,
  exactApprovedPlanFrameTimingTrackAllAndRuntimeReread: z.literal(true),
  callerTaskContextAccepted: z.literal(false),
}).strict()

const materializationWithoutHashSchema = z.object({
  schemaVersion: z.literal(
    CANONICAL_SAM3_1_PRIVATE_COMPLETE_SOURCE_TASK_MATERIALIZATION_VERSION,
  ),
  ownerVersion: z.literal(
    CANONICAL_SAM3_1_PRIVATE_COMPLETE_SOURCE_TASK_MATERIALIZATION_OWNER_VERSION,
  ),
  source: z.literal(
    'canonical_server_sam3_1_private_complete_source_task_materialization_owner',
  ),
  evidenceClass: z.literal(
    'canonical_private_plan_admission_readiness_staging_and_task_reread',
  ),
  status: z.literal('private_chunk_task_materialized_not_dispatched'),
  materializationId: safeId,
  executionPlanRef: refSchema,
  routeId: z.enum(['a100_80gb_heavy_primary', 'l4_heavy_fallback']),
  chunkOrdinal: z.number().int().min(1).max(49),
  canonicalStartFrameInclusive: z.number().int().nonnegative().safe(),
  canonicalEndFrameInclusive: z.number().int().nonnegative().safe(),
  overlapWithPreviousFrames: z.union([z.literal(0), z.literal(1)]),
  preparedChunkArtifactRef: refSchema,
  exactSourceRangeMappingRef: refSchema,
  privateInternalFundedAdmissionRef: refSchema,
  privateInternalDispatchReadinessRef: refSchema,
  runtimeReleaseRef: refSchema,
  accountEffectiveRateAuthorityRef: refSchema,
  executionEnvelopeRef: refSchema,
  previousChunkTerminalRef: refSchema.nullable(),
  taskContextRef: refSchema,
  privateInputStagingEvidenceRef: refSchema,
  taskRecordRef: refSchema,
  runtimeRequestRef: refSchema,
  exactPlanAdmissionReadinessReleaseRateAndChunkReread: z.literal(true),
  exactPreparedChunkStagedAndRereadBeforeTaskPersistence: z.literal(true),
  exactTaskPersistedCreateOnlyAndReread: z.literal(true),
  previousChunkTerminalAndScaleZeroRereadWhenRequired: z.literal(true),
  nextChunkMayMaterializeOnlyAfterThisChunkTerminalAndScaleZero:
    z.literal(true),
  maximumSimultaneousRouteAttempts: z.literal(1),
  platformFundedPrivateQualification: z.literal(true),
  substantiveCpuExecutionAllowed: z.literal(false),
  sourceResolutionReductionAllowed: z.literal(false),
  automaticRetryOrFallbackAllowed: z.literal(false),
  gpuJobDispatched: z.literal(false),
  customerCreditsMutated: z.literal(false),
  customerOrPublicDispatchAuthorized: z.literal(false),
  publicConcurrencyCapacityRequiredForThisPrivateRun: z.literal(false),
  futurePublicA100ConcurrencyTarget: z.literal(16),
  futurePublicL4ConcurrencyTarget: z.literal(16),
  qaApproved: z.literal(false),
  publicDeliveryAuthorized: z.literal(false),
  productionAuthorityGranted: z.literal(false),
  materializedAt: timestamp,
}).strict().superRefine((value, context) => {
  const first = value.chunkOrdinal === 1
  if (
    value.canonicalEndFrameInclusive < value.canonicalStartFrameInclusive
    || (first ? value.previousChunkTerminalRef !== null
      || value.overlapWithPreviousFrames !== 0
      : value.previousChunkTerminalRef === null
        || value.overlapWithPreviousFrames !== 1)
  ) context.addIssue({
    code: 'custom',
    message: 'SAM 3.1 private chunk task lost sequence geometry.',
  })
})

export const canonicalSam31PrivateCompleteSourceTaskMaterializationSchema =
  materializationWithoutHashSchema.extend({ materializationHash: sha256 })
    .strict()
export type CanonicalSam31PrivateCompleteSourceTaskMaterialization = z.infer<
  typeof canonicalSam31PrivateCompleteSourceTaskMaterializationSchema
>

export interface CanonicalSam31PrivateCompleteSourceTaskAuthorityReadPort {
  readonly schemaVersion:
    'canonical-sam3_1-private-complete-source-task-authority-read-port-v1'
  readonly privateInternalOnly: true
  readonly customerOrPublicDispatchAuthorized: false
  rereadExactChunkAuthority(input: {
    readonly executionPlanRef: EvidenceRef
    readonly chunkOrdinal: number
    readonly at: string
  }): Promise<{
    readonly privateInternalFundedAdmission: unknown
    readonly runtimeLaunchTarget: unknown
    readonly taskAuthority: unknown
  } | null>
}

export interface CanonicalSam31PrivateCompleteSourceChunkTerminalReadPort {
  readonly schemaVersion:
    'canonical-sam3_1-private-complete-source-chunk-terminal-read-port-v1'
  readonly privateInternalOnly: true
  readonly customerOrPublicDispatchAuthorized: false
  rereadExactTerminal(input: {
    readonly executionPlanRef: EvidenceRef
    readonly chunkOrdinal: number
  }): Promise<unknown | null>
}

export interface CanonicalSam31PrivateCompleteSourceTaskMaterializationRepository {
  readonly schemaVersion:
    'canonical-sam3_1-private-complete-source-task-materialization-repository-v1'
  persistCreateOnly(input: {
    readonly materialization:
      CanonicalSam31PrivateCompleteSourceTaskMaterialization
  }): Promise<'created' | 'identical_replay'>
  reread(input: {
    readonly executionPlanId: string
    readonly chunkOrdinal: number
  }): Promise<CanonicalSam31PrivateCompleteSourceTaskMaterialization | null>
}

export function createCanonicalSam31PrivateCompleteSourceTaskMaterializationOwner(
  input: {
    readonly executionPlanRepository:
      CanonicalSam31PrivateCompleteSourceExecutionPlanRepository
    readonly privateInternalDispatchReadinessReadPort:
      CanonicalSam31PrivateInternalDispatchReadinessReadPort
    readonly taskAuthorityReadPort:
      CanonicalSam31PrivateCompleteSourceTaskAuthorityReadPort
    readonly priorChunkTerminalReadPort:
      CanonicalSam31PrivateCompleteSourceChunkTerminalReadPort
    readonly privateInputStagingPort:
      CanonicalSam31GpuPrivateInputStagingPort
    readonly taskStore: CanonicalSam31GpuTaskStore
    readonly materializationRepository:
      CanonicalSam31PrivateCompleteSourceTaskMaterializationRepository
  },
) {
  assertDependencies(input)
  return Object.freeze({
    schemaVersion:
      CANONICAL_SAM3_1_PRIVATE_COMPLETE_SOURCE_TASK_MATERIALIZATION_OWNER_VERSION,
    privateInternalOnly: true as const,
    customerOrPublicDispatchAuthorized: false as const,
    async materialize(untrusted: unknown): Promise<
      CanonicalSam31PrivateCompleteSourceTaskMaterialization
    > {
      assertPlainSerializedData(untrusted,
        'sam31_private_complete_source_task_materialization_request')
      const request = z.object({
        executionPlanRef: refSchema,
        chunkOrdinal: z.number().int().min(1).max(49),
        materializedAt: timestamp,
      }).strict().parse(untrusted)
      const untrustedPlan = await input.executionPlanRepository.reread({
        executionPlanRef: request.executionPlanRef,
      })
      const plan = assertCanonicalSam31PrivateCompleteSourceExecutionPlan(
        untrustedPlan,
        request.materializedAt,
      )
      if (!sameRef(
        canonicalSam31PrivateCompleteSourceExecutionPlanRef(plan),
        request.executionPlanRef,
      )) throw new TypeError('SAM 3.1 private task plan reread changed.')
      const chunk = plan.chunks[request.chunkOrdinal - 1]
      if (!chunk || chunk.chunkOrdinal !== request.chunkOrdinal) {
        throw new TypeError('SAM 3.1 private task chunk is absent.')
      }
      const readiness = assertCanonicalSam31PrivateInternalDispatchReadiness(
        await input.privateInternalDispatchReadinessReadPort.rereadCurrent({
          runtimeReleaseRef: plan.runtimeReleaseRef,
          rateAuthorityRef: plan.accountEffectiveRateAuthorityRef,
          at: request.materializedAt,
        }),
        request.materializedAt,
      )
      assertCanonicalSam31PrivateInternalDispatchAllowed({
        readiness,
        routeId: plan.routeId,
        runtimeReleaseRef: plan.runtimeReleaseRef,
        rateAuthorityRef: plan.accountEffectiveRateAuthorityRef,
        immutableImageDigest: plan.immutableImageDigest,
        at: request.materializedAt,
      })
      if (!sameRef(plan.privateInternalDispatchReadinessRef,
        ref(readiness.readinessId, readiness.readinessHash))) {
        throw new TypeError('SAM 3.1 private task readiness changed.')
      }
      const prior = await readPriorTerminal({
        request,
        plan,
        repository: input.materializationRepository,
        terminalPort: input.priorChunkTerminalReadPort,
      })
      const serverAuthority = await input.taskAuthorityReadPort
        .rereadExactChunkAuthority({
          executionPlanRef: request.executionPlanRef,
          chunkOrdinal: request.chunkOrdinal,
          at: request.materializedAt,
        })
      if (!serverAuthority) {
        throw new TypeError('SAM 3.1 private chunk authority is absent.')
      }
      assertPlainSerializedData(serverAuthority,
        'sam31_private_complete_source_task_authority')
      const privateAdmission =
        assertCanonicalProfessionalGpuPrivateInternalFundedDispatchAdmission(
          serverAuthority.privateInternalFundedAdmission,
        )
      const admission = privateAdmission.fundedDispatchAdmission
        .toolDispatchAdmission
      const target = assertCanonicalProfessionalGpuRuntimeLaunchTarget(
        serverAuthority.runtimeLaunchTarget,
      )
      const authority = taskAuthoritySchema.parse(serverAuthority.taskAuthority)
      assertAuthorityMatches({
        plan,
        chunk,
        readiness,
        privateAdmission,
        admission,
        target,
        authority,
        materializedAt: request.materializedAt,
      })
      const sourceMedia = {
        mediaForm: 'private_read_only_mp4' as const,
        finalizedSourceArtifactRef: plan.exactEightMinuteSourceRef,
        gpuPreparedMaskProxyArtifactRef: chunk.preparedChunkArtifactRef,
        exactSourceReadEvidenceRef: plan.sourcePreparationRef,
        ffprobeOrFrameDirectoryEvidenceRef: chunk.ffprobeEvidenceRef,
        sourceFrameRangeMappingRef: chunk.exactSourceRangeMappingRef,
        proxyPixelGeometryQaRef: chunk.gpuPreparationEvidenceRef,
        byteLength: chunk.byteLength,
        sha256: chunk.sha256,
        width: plan.sourceWidth,
        height: plan.sourceHeight,
        decodedFrameCount: chunk.decodedFrameCount,
        fpsNumerator: plan.fpsNumerator,
        fpsDenominator: plan.fpsDenominator,
        selectedStartFrameInclusive: 0,
        selectedEndFrameInclusive: chunk.decodedFrameCount - 1,
        canonicalSourceStartFrameInclusive:
          chunk.canonicalStartFrameInclusive,
        canonicalSourceEndFrameInclusive: chunk.canonicalEndFrameInclusive,
        boundedChunkOverlapAndStitchPlanRef: ref(
          `${plan.executionPlanId}:chunk-overlap-and-stitch-plan`,
          sha256AuthorityValue({
            executionPlanRef: request.executionPlanRef,
            exactChunkCount: plan.exactChunkCount,
            chunkFrameCount: plan.chunkFrameCount,
            chunkOverlapFrameCount: plan.chunkOverlapFrameCount,
            chunkStrideFrameCount: plan.chunkStrideFrameCount,
          }),
        ),
        variableFrameRateAllowed: false as const,
        callerPathOrUrlAccepted: false as const,
      }
      const taskContext = buildCanonicalSam31GpuTaskContext({
        taskContextId:
          `${chunk.privateInvocationId}:private-task-context`,
        trackAllOrchestraBinding: authority.trackAllOrchestraBinding,
        editPlanVersionId: authority.editPlanVersionId,
        editPlanVersionRef: authority.editPlanVersionRef,
        outputId: authority.outputId,
        confirmedOutputFrameRef: authority.confirmedOutputFrameRef,
        sceneId: authority.sceneId,
        sourceBindingRef: authority.sourceBindingRef,
        sourceMedia,
        approvedPrompt: {
          promptType: 'server_compiled_text_subject' as const,
          approvedSubjectText: plan.approvedSubjectText,
          promptFrameIndex: 0 as const,
          compiledIntentRef: plan.compiledSubjectIntentRef,
          promptApprovalRef: plan.promptApprovalRef,
          sourceFrameLineageRef: chunk.exactSourceRangeMappingRef,
          rawUserChatIncluded: false as const,
          executableTextIncluded: false as const,
        },
        specializedRuntimeRelease: authority.specializedRuntimeRelease,
        primaryRateAuthorityRef: authority.primaryRateAuthorityRef,
        fallbackRateAuthorityRef: authority.fallbackRateAuthorityRef,
        privateTaskInputTransportRef: chunk.privateTaskInputTransportRef,
        privateTaskOutputTransportRef: chunk.privateTaskOutputTransportRef,
        preparedAt: request.materializedAt,
      })
      const executionEnvelopeRef = ref(
        chunk.privateInvocationId,
        sha256AuthorityValue({
          executionPlanRef: request.executionPlanRef,
          chunkOrdinal: chunk.chunkOrdinal,
          executionAttemptRef: chunk.executionAttemptRef,
          privateTaskInputTransportRef: chunk.privateTaskInputTransportRef,
          privateTaskOutputTransportRef: chunk.privateTaskOutputTransportRef,
        }),
      )
      const dispatchAdmissionRef = ref(
        admission.admissionId,
        admission.admissionHash,
      )
      const staging = assertCanonicalSam31GpuPrivateInputStagingEvidence(
        await input.privateInputStagingPort.stageAndRereadExactMaskProxy({
          invocationId: chunk.privateInvocationId,
          scope: {
            ownerUserId: admission.scope.ownerUserId,
            workspaceId: admission.scope.workspaceId,
            projectId: admission.scope.projectId,
            editSessionId: admission.scope.editSessionId,
            approvedSnapshotRef: admission.scope.approvedSnapshotRef,
            approvedWorkItemRef: admission.scope.approvedWorkItemRef,
            workerLeaseRef: admission.scope.workerLeaseRef,
            executionAttemptRef: admission.scope.executionAttemptRef,
          },
          dispatchAdmissionRef,
          executionEnvelopeRef,
          sourceBindingRef: authority.sourceBindingRef,
          sourceMedia,
          privateTaskInputTransportRef: chunk.privateTaskInputTransportRef,
          stagedAt: request.materializedAt,
        }),
      )
      const admissionConsumptionRef = ref(
        `${privateAdmission.fundedDispatchAdmission.fundedAdmissionId}:private-consumption`,
        sha256AuthorityValue({
          privateInternalFundedAdmissionHash:
            privateAdmission.privateInternalFundedAdmissionHash,
          executionPlanRef: request.executionPlanRef,
          chunkOrdinal: chunk.chunkOrdinal,
          executionEnvelopeRef,
        }),
      )
      const task = buildCanonicalSam31GpuTaskRecord({
        admission,
        target,
        admissionConsumptionRef,
        executionEnvelopeRef,
        context: taskContext,
        privateInputStagingEvidence: staging,
        preparedAt: request.materializedAt,
      })
      const persisted = await input.taskStore.persistTaskCreateOnly(task)
      const taskReread = assertCanonicalSam31GpuTaskRecord(
        await input.taskStore.rereadTask(task.invocationId),
      )
      if (taskReread.taskRecordHash !== task.taskRecordHash
        || (persisted !== 'created' && persisted !== 'already_exists')) {
        throw new TypeError('SAM 3.1 private fixed-task reread changed.')
      }
      const priorRef = prior ? ref(
        `${prior.executionPlanRef.id}:chunk-${prior.chunkOrdinal}:terminal`,
        prior.terminalHash,
      ) : null
      const payload = materializationWithoutHashSchema.parse({
        schemaVersion:
          CANONICAL_SAM3_1_PRIVATE_COMPLETE_SOURCE_TASK_MATERIALIZATION_VERSION,
        ownerVersion:
          CANONICAL_SAM3_1_PRIVATE_COMPLETE_SOURCE_TASK_MATERIALIZATION_OWNER_VERSION,
        source:
          'canonical_server_sam3_1_private_complete_source_task_materialization_owner',
        evidenceClass:
          'canonical_private_plan_admission_readiness_staging_and_task_reread',
        status: 'private_chunk_task_materialized_not_dispatched',
        materializationId:
          `${plan.executionPlanId}:chunk-${chunk.chunkOrdinal}:task-materialization`,
        executionPlanRef: request.executionPlanRef,
        routeId: plan.routeId,
        chunkOrdinal: chunk.chunkOrdinal,
        canonicalStartFrameInclusive: chunk.canonicalStartFrameInclusive,
        canonicalEndFrameInclusive: chunk.canonicalEndFrameInclusive,
        overlapWithPreviousFrames: chunk.overlapWithPreviousFrames,
        preparedChunkArtifactRef: chunk.preparedChunkArtifactRef,
        exactSourceRangeMappingRef: chunk.exactSourceRangeMappingRef,
        privateInternalFundedAdmissionRef: ref(
          privateAdmission.fundedDispatchAdmission.fundedAdmissionId,
          privateAdmission.privateInternalFundedAdmissionHash,
        ),
        privateInternalDispatchReadinessRef:
          plan.privateInternalDispatchReadinessRef,
        runtimeReleaseRef: plan.runtimeReleaseRef,
        accountEffectiveRateAuthorityRef:
          plan.accountEffectiveRateAuthorityRef,
        executionEnvelopeRef,
        previousChunkTerminalRef: priorRef,
        taskContextRef: taskContext.taskContextRef,
        privateInputStagingEvidenceRef: ref(
          staging.stagingId,
          staging.evidenceHash,
        ),
        taskRecordRef: ref(task.taskId, task.taskRecordHash),
        runtimeRequestRef: task.runtimeRequestRef,
        exactPlanAdmissionReadinessReleaseRateAndChunkReread: true,
        exactPreparedChunkStagedAndRereadBeforeTaskPersistence: true,
        exactTaskPersistedCreateOnlyAndReread: true,
        previousChunkTerminalAndScaleZeroRereadWhenRequired: true,
        nextChunkMayMaterializeOnlyAfterThisChunkTerminalAndScaleZero: true,
        maximumSimultaneousRouteAttempts: 1,
        platformFundedPrivateQualification: true,
        substantiveCpuExecutionAllowed: false,
        sourceResolutionReductionAllowed: false,
        automaticRetryOrFallbackAllowed: false,
        gpuJobDispatched: false,
        customerCreditsMutated: false,
        customerOrPublicDispatchAuthorized: false,
        publicConcurrencyCapacityRequiredForThisPrivateRun: false,
        futurePublicA100ConcurrencyTarget: 16,
        futurePublicL4ConcurrencyTarget: 16,
        qaApproved: false,
        publicDeliveryAuthorized: false,
        productionAuthorityGranted: false,
        materializedAt: request.materializedAt,
      })
      const materialization =
        assertCanonicalSam31PrivateCompleteSourceTaskMaterialization({
          ...payload,
          materializationHash: sha256AuthorityValue(payload),
        })
      await input.materializationRepository.persistCreateOnly({
        materialization,
      })
      const reread = await input.materializationRepository.reread({
        executionPlanId: plan.executionPlanId,
        chunkOrdinal: chunk.chunkOrdinal,
      })
      if (!reread || reread.materializationHash !==
        materialization.materializationHash) {
        throw new TypeError('SAM 3.1 private task materialization changed.')
      }
      return reread
    },
  })
}

export function assertCanonicalSam31PrivateCompleteSourceChunkTerminalReread(
  value: unknown,
): CanonicalSam31PrivateCompleteSourceChunkTerminalReread {
  assertPlainSerializedData(value,
    'sam31_private_complete_source_chunk_terminal_reread')
  const parsed = canonicalSam31PrivateCompleteSourceChunkTerminalRereadSchema
    .parse(value)
  const { terminalHash, ...payload } = parsed
  if (terminalHash !== sha256AuthorityValue(payload)) {
    throw new TypeError('SAM 3.1 private chunk terminal changed.')
  }
  return Object.freeze(structuredClone(parsed))
}

export function assertCanonicalSam31PrivateCompleteSourceTaskMaterialization(
  value: unknown,
): CanonicalSam31PrivateCompleteSourceTaskMaterialization {
  assertPlainSerializedData(value,
    'sam31_private_complete_source_task_materialization')
  const parsed = canonicalSam31PrivateCompleteSourceTaskMaterializationSchema
    .parse(value)
  const { materializationHash, ...payload } = parsed
  if (materializationHash !== sha256AuthorityValue(payload)) {
    throw new TypeError('SAM 3.1 private task materialization changed.')
  }
  return Object.freeze(structuredClone(parsed))
}

export function createCanonicalSam31PrivateCompleteSourceTaskMaterializationRepository(
  input: {
    readonly objectPort: CanonicalCreateOnlyJsonObjectPort
    readonly prefix?: string
  },
): CanonicalSam31PrivateCompleteSourceTaskMaterializationRepository {
  if (typeof input.objectPort?.createOnly !== 'function'
    || typeof input.objectPort?.readExact !== 'function') {
    throw new TypeError('SAM 3.1 private task-materialization store is absent.')
  }
  const prefix = safePrefix.parse(input.prefix ?? DEFAULT_PREFIX)
  const reread = async (executionPlanId: string, chunkOrdinal: number) => {
    const planId = safeId.parse(executionPlanId)
    const ordinal = z.number().int().min(1).max(49).parse(chunkOrdinal)
    const body = await input.objectPort.readExact(
      `${prefix}/${planId}/chunk-${String(ordinal).padStart(3, '0')}.json`,
    )
    if (!body) return null
    if (!Buffer.isBuffer(body) || body.byteLength < 2
      || body.byteLength > MAXIMUM_RECORD_BYTES) {
      throw new TypeError('SAM 3.1 private task-materialization bytes changed.')
    }
    const record = assertCanonicalSam31PrivateCompleteSourceTaskMaterialization(
      JSON.parse(body.toString('utf8')) as unknown,
    )
    if (record.executionPlanRef.id !== planId
      || record.chunkOrdinal !== ordinal
      || stableAuthorityStringify(record) !== body.toString('utf8')) {
      throw new TypeError('SAM 3.1 private task-materialization reread changed.')
    }
    return record
  }
  const repository:
    CanonicalSam31PrivateCompleteSourceTaskMaterializationRepository = {
    schemaVersion:
      'canonical-sam3_1-private-complete-source-task-materialization-repository-v1' as const,
    async persistCreateOnly({ materialization: untrusted }) {
      const record =
        assertCanonicalSam31PrivateCompleteSourceTaskMaterialization(untrusted)
      const body = Buffer.from(stableAuthorityStringify(record), 'utf8')
      const objectPath = `${prefix}/${record.executionPlanRef.id}/chunk-${String(
        record.chunkOrdinal,
      ).padStart(3, '0')}.json`
      const disposition = await input.objectPort.createOnly({
        objectPath,
        body,
        contentSha256: createHash('sha256').update(body).digest('hex'),
      })
      const exact = await reread(
        record.executionPlanRef.id,
        record.chunkOrdinal,
      )
      if (!exact || exact.materializationHash !== record.materializationHash) {
        throw new TypeError('SAM 3.1 private task-materialization reread changed.')
      }
      return disposition === 'created'
        ? 'created' as const : 'identical_replay' as const
    },
    reread: ({ executionPlanId, chunkOrdinal }) =>
      reread(executionPlanId, chunkOrdinal),
  }
  return Object.freeze(repository)
}

async function readPriorTerminal(input: {
  request: { executionPlanRef: EvidenceRef; chunkOrdinal: number }
  plan: ReturnType<
    typeof assertCanonicalSam31PrivateCompleteSourceExecutionPlan
  >
  repository: CanonicalSam31PrivateCompleteSourceTaskMaterializationRepository
  terminalPort: CanonicalSam31PrivateCompleteSourceChunkTerminalReadPort
}): Promise<CanonicalSam31PrivateCompleteSourceChunkTerminalReread | null> {
  if (input.request.chunkOrdinal === 1) return null
  const priorOrdinal = input.request.chunkOrdinal - 1
  const priorMaterialization = await input.repository.reread({
    executionPlanId: input.plan.executionPlanId,
    chunkOrdinal: priorOrdinal,
  })
  if (!priorMaterialization) {
    throw new TypeError('SAM 3.1 prior private chunk task is absent.')
  }
  const untrustedTerminal = await input.terminalPort.rereadExactTerminal({
    executionPlanRef: input.request.executionPlanRef,
    chunkOrdinal: priorOrdinal,
  })
  if (!untrustedTerminal) {
    throw new TypeError('SAM 3.1 prior private chunk terminal is absent.')
  }
  const terminal = assertCanonicalSam31PrivateCompleteSourceChunkTerminalReread(
    untrustedTerminal,
  )
  if (!sameRef(terminal.executionPlanRef, input.request.executionPlanRef)
    || terminal.routeId !== input.plan.routeId
    || terminal.chunkOrdinal !== priorOrdinal
    || !sameRef(terminal.taskRecordRef,
      priorMaterialization.taskRecordRef)
    || Date.parse(terminal.completedAt) <
      Date.parse(priorMaterialization.materializedAt)) {
    throw new TypeError('SAM 3.1 prior private chunk terminal changed.')
  }
  return terminal
}

function assertAuthorityMatches(input: {
  plan: ReturnType<
    typeof assertCanonicalSam31PrivateCompleteSourceExecutionPlan
  >
  chunk: ReturnType<
    typeof assertCanonicalSam31PrivateCompleteSourceExecutionPlan
  >['chunks'][number]
  readiness: ReturnType<
    typeof assertCanonicalSam31PrivateInternalDispatchReadiness
  >
  privateAdmission: ReturnType<
    typeof assertCanonicalProfessionalGpuPrivateInternalFundedDispatchAdmission
  >
  admission: ReturnType<
    typeof assertCanonicalProfessionalGpuPrivateInternalFundedDispatchAdmission
  >['fundedDispatchAdmission']['toolDispatchAdmission']
  target: ReturnType<typeof assertCanonicalProfessionalGpuRuntimeLaunchTarget>
  authority: z.infer<typeof taskAuthoritySchema>
  materializedAt: string
}): void {
  const { plan, chunk, readiness, privateAdmission, admission, target,
    authority } = input
  const selectedRate = plan.routeId === 'a100_80gb_heavy_primary'
    ? authority.primaryRateAuthorityRef : authority.fallbackRateAuthorityRef
  if (
    privateAdmission.status !==
      'private_internal_sequential_dispatch_admitted'
    || !privateAdmission.privateInternalQualificationOnly
    || privateAdmission.customerOrPublicDispatchAuthorized
    || !sameRef(privateAdmission.privateInternalDispatchReadinessRef,
      plan.privateInternalDispatchReadinessRef)
    || admission.routeId !== plan.routeId
    || admission.scope.executionAttemptRef.id !== chunk.executionAttemptRef.id
    || !sameRef(admission.scope.executionAttemptRef,
      chunk.executionAttemptRef)
    || !sameRef(admission.runtimeReleaseRef, plan.runtimeReleaseRef)
    || !sameRef(admission.currentRateAuthorityRef,
      plan.accountEffectiveRateAuthorityRef)
    || !sameRef(privateAdmission.runtimeReleaseRef, plan.runtimeReleaseRef)
    || !sameRef(privateAdmission.currentRateAuthorityRef,
      plan.accountEffectiveRateAuthorityRef)
    || !sameRef(target.releaseRef, plan.runtimeReleaseRef)
    || target.routeId !== plan.routeId
    || target.immutableImageDigest !== plan.immutableImageDigest
    || !sameRef(selectedRate, plan.accountEffectiveRateAuthorityRef)
    || !sameRef(authority.confirmedOutputFrameRef,
      admission.scope.confirmedOutputFrameRef)
    || authority.editPlanVersionRef.version !==
      admission.scope.editPlanVersion
    || Date.parse(input.materializedAt) < Date.parse(admission.admittedAt)
    || Date.parse(input.materializedAt) >= Date.parse(admission.expiresAt)
    || !sameRef(ref(readiness.readinessId, readiness.readinessHash),
      plan.privateInternalDispatchReadinessRef)
  ) throw new TypeError(
    'SAM 3.1 private task authority differs from plan or admission.',
  )
}

function assertDependencies(input: {
  executionPlanRepository:
    CanonicalSam31PrivateCompleteSourceExecutionPlanRepository
  privateInternalDispatchReadinessReadPort:
    CanonicalSam31PrivateInternalDispatchReadinessReadPort
  taskAuthorityReadPort:
    CanonicalSam31PrivateCompleteSourceTaskAuthorityReadPort
  priorChunkTerminalReadPort:
    CanonicalSam31PrivateCompleteSourceChunkTerminalReadPort
  privateInputStagingPort: CanonicalSam31GpuPrivateInputStagingPort
  taskStore: CanonicalSam31GpuTaskStore
  materializationRepository:
    CanonicalSam31PrivateCompleteSourceTaskMaterializationRepository
}): void {
  if (typeof input.executionPlanRepository?.reread !== 'function'
    || input.privateInternalDispatchReadinessReadPort?.schemaVersion !==
      'canonical-sam3_1-private-internal-dispatch-readiness-read-port-v1'
    || typeof input.privateInternalDispatchReadinessReadPort.rereadCurrent !==
      'function'
    || input.taskAuthorityReadPort?.schemaVersion !==
      'canonical-sam3_1-private-complete-source-task-authority-read-port-v1'
    || typeof input.taskAuthorityReadPort.rereadExactChunkAuthority !==
      'function'
    || input.priorChunkTerminalReadPort?.schemaVersion !==
      'canonical-sam3_1-private-complete-source-chunk-terminal-read-port-v1'
    || typeof input.priorChunkTerminalReadPort.rereadExactTerminal !==
      'function'
    || typeof input.privateInputStagingPort?.stageAndRereadExactMaskProxy !==
      'function'
    || input.taskStore?.schemaVersion !== 'canonical-sam3_1-gpu-task-store-v1'
    || typeof input.taskStore.persistTaskCreateOnly !== 'function'
    || typeof input.materializationRepository?.persistCreateOnly !== 'function'
  ) throw new TypeError('SAM 3.1 private task materializer is incomplete.')
}

function ref(id: string, hash: string, version = 1): EvidenceRef {
  return refSchema.parse({
    id,
    version,
    contentHash: `sha256:${hash}`,
  })
}

function sameRef(left: EvidenceRef, right: EvidenceRef): boolean {
  return left.id === right.id && left.version === right.version
    && left.contentHash === right.contentHash
}
