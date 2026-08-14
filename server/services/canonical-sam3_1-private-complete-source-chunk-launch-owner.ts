import { createHash } from 'node:crypto'

import { z } from 'zod'

import {
  assertCanonicalProfessionalGpuPrivateInternalFundedDispatchAdmission,
} from './canonical-professional-gpu-plan-funded-dispatch-service'
import type {
  CanonicalCreateOnlyJsonObjectPort,
} from './canonical-gcs-source-analysis-lifecycle-store'
import {
  assertCanonicalProfessionalGpuFixedTaskPreparingLaunchPort,
  assertCanonicalProfessionalGpuRuntimeLaunchTarget,
  assertPlainSerializedData,
  type CanonicalProfessionalGpuCloudJobLaunchPort,
} from './canonical-professional-gpu-job-lifecycle-service'
import {
  assertCanonicalSam31PrivateCompleteSourceExecutionPlan,
  canonicalSam31PrivateCompleteSourceExecutionPlanRef,
  type CanonicalSam31PrivateCompleteSourceExecutionPlanRepository,
} from './canonical-sam3_1-private-complete-source-execution-plan-owner'
import {
  assertCanonicalSam31PrivateCompleteSourceTaskMaterialization,
  type CanonicalSam31PrivateCompleteSourceTaskAuthorityReadPort,
  type CanonicalSam31PrivateCompleteSourceTaskMaterialization,
  type CanonicalSam31PrivateCompleteSourceTaskMaterializationRepository,
} from './canonical-sam3_1-private-complete-source-task-materialization-owner'
import {
  sha256AuthorityValue,
  stableAuthorityStringify,
} from './private-edit-authority-store'
import {
  CANONICAL_SAM3_1_OPERATION_ID,
} from '../model-artifacts/canonical-sam3_1-source-runtime-candidate'
import {
  assertCanonicalSam31GpuTaskRecord,
  type CanonicalSam31GpuTaskStore,
} from '../workers/masks/canonical-sam3_1-gpu-task-owner-service'

export const CANONICAL_SAM3_1_PRIVATE_COMPLETE_SOURCE_CHUNK_LAUNCH_INTENT_VERSION =
  'canonical-sam3_1-private-complete-source-chunk-launch-intent-v1' as const
export const CANONICAL_SAM3_1_PRIVATE_COMPLETE_SOURCE_CHUNK_LAUNCH_RESULT_VERSION =
  'canonical-sam3_1-private-complete-source-chunk-launch-result-v1' as const
export const CANONICAL_SAM3_1_PRIVATE_COMPLETE_SOURCE_CHUNK_LAUNCH_OWNER_VERSION =
  'canonical-sam3_1-private-complete-source-chunk-launch-owner-v1' as const

const DEFAULT_PREFIX =
  'private/canonical-professional-gpu/sam3_1/v1/private-complete-source-chunk-launches'
const MAXIMUM_RECORD_BYTES = 4 * 1024 * 1024
const safeId = z.string().trim().min(1).max(512)
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

const intentWithoutHashSchema = z.object({
  schemaVersion: z.literal(
    CANONICAL_SAM3_1_PRIVATE_COMPLETE_SOURCE_CHUNK_LAUNCH_INTENT_VERSION,
  ),
  ownerVersion: z.literal(
    CANONICAL_SAM3_1_PRIVATE_COMPLETE_SOURCE_CHUNK_LAUNCH_OWNER_VERSION,
  ),
  source: z.literal(
    'canonical_server_sam3_1_private_complete_source_chunk_launch_owner',
  ),
  evidenceClass: z.literal(
    'canonical_private_materialization_task_admission_target_exact_reread',
  ),
  status: z.literal('private_chunk_cloud_create_reserved'),
  launchIntentId: safeId,
  executionPlanRef: refSchema,
  routeId: routeIdSchema,
  chunkOrdinal: z.number().int().min(1).max(49),
  materializationRef: refSchema,
  taskRecordRef: refSchema,
  runtimeRequestRef: refSchema,
  privateInternalFundedAdmissionRef: refSchema,
  runtimeReleaseRef: refSchema,
  accountEffectiveRateAuthorityRef: refSchema,
  admissionConsumptionRef: refSchema,
  executionEnvelopeRef: refSchema,
  exactPlanMaterializationTaskAdmissionTargetReleaseAndRateReread:
    z.literal(true),
  durableSingleUseIntentPersistedBeforeCloudCreate: z.literal(true),
  previousChunkTerminalAndScaleZeroRereadWhenRequired: z.literal(true),
  maximumSimultaneousRouteAttempts: z.literal(1),
  platformFundedPrivateQualification: z.literal(true),
  automaticRetryOrFallbackAllowed: z.literal(false),
  substantiveCpuExecutionAllowed: z.literal(false),
  sourceResolutionReductionAllowed: z.literal(false),
  customerCreditsMutated: z.literal(false),
  customerOrPublicDispatchAuthorized: z.literal(false),
  publicConcurrencyCapacityRequiredForThisPrivateRun: z.literal(false),
  qaApproved: z.literal(false),
  publicDeliveryAuthorized: z.literal(false),
  productionAuthorityGranted: z.literal(false),
  reservedAt: timestamp,
}).strict()

export const canonicalSam31PrivateCompleteSourceChunkLaunchIntentSchema =
  intentWithoutHashSchema.extend({ intentHash: sha256 }).strict()
export type CanonicalSam31PrivateCompleteSourceChunkLaunchIntent = z.infer<
  typeof canonicalSam31PrivateCompleteSourceChunkLaunchIntentSchema
>

const launchResultPayloadSchema = z.object({
  schemaVersion: z.literal(
    CANONICAL_SAM3_1_PRIVATE_COMPLETE_SOURCE_CHUNK_LAUNCH_RESULT_VERSION,
  ),
  ownerVersion: z.literal(
    CANONICAL_SAM3_1_PRIVATE_COMPLETE_SOURCE_CHUNK_LAUNCH_OWNER_VERSION,
  ),
  source: z.literal(
    'canonical_server_sam3_1_private_complete_source_chunk_launch_owner',
  ),
  evidenceClass: z.literal('canonical_private_single_use_cloud_create_result'),
  status: z.enum([
    'private_chunk_gpu_job_created',
    'private_chunk_cloud_create_rejected_before_creation',
    'private_chunk_cloud_create_outcome_unknown_requires_reconciliation',
  ]),
  launchResultId: safeId,
  launchIntentRef: refSchema,
  executionPlanRef: refSchema,
  routeId: routeIdSchema,
  chunkOrdinal: z.number().int().min(1).max(49),
  materializationRef: refSchema,
  taskRecordRef: refSchema,
  runtimeRequestRef: refSchema,
  privateInternalFundedAdmissionRef: refSchema,
  runtimeReleaseRef: refSchema,
  accountEffectiveRateAuthorityRef: refSchema,
  admissionConsumptionRef: refSchema,
  executionEnvelopeRef: refSchema,
  cloudJobCreateRequestRef: refSchema,
  cloudJobExecutionRef: refSchema.nullable(),
  providerRequestIdDigestSha256: sha256.nullable(),
  providerInferenceOrSubstantiveWorkKnownExecuted: z.enum([
    'not_executed',
    'unknown',
  ]),
  durableSingleUseIntentPersistedBeforeCloudCreate: z.literal(true),
  exactLaunchResultPersistedCreateOnlyAndReread: z.literal(true),
  unknownOutcomeBlocksAnyRetryUntilCanonicalReconciliation: z.boolean(),
  duplicateReplayStartedNewCloudCreate: z.literal(false),
  maximumSimultaneousRouteAttempts: z.literal(1),
  minimumIdleGpuInstances: z.literal(0),
  userTriggeredScaleFromZero: z.literal(true),
  gpuJobDispatched: z.boolean(),
  automaticRetryOrFallbackStarted: z.literal(false),
  customerCreditsMutated: z.literal(false),
  customerOrPublicDispatchAuthorized: z.literal(false),
  qaApproved: z.literal(false),
  publicDeliveryAuthorized: z.literal(false),
  productionAuthorityGranted: z.literal(false),
  observedAt: timestamp,
}).strict()

function refineLaunchResult(
  value: z.infer<typeof launchResultPayloadSchema>,
  context: z.RefinementCtx,
): void {
  const created = value.status === 'private_chunk_gpu_job_created'
  const rejected = value.status ===
    'private_chunk_cloud_create_rejected_before_creation'
  const exact = created
    ? value.cloudJobExecutionRef !== null
      && value.providerInferenceOrSubstantiveWorkKnownExecuted ===
        'not_executed'
      && value.gpuJobDispatched
      && !value.unknownOutcomeBlocksAnyRetryUntilCanonicalReconciliation
    : rejected
      ? value.cloudJobExecutionRef === null
        && value.providerInferenceOrSubstantiveWorkKnownExecuted ===
          'not_executed'
        && !value.gpuJobDispatched
        && !value.unknownOutcomeBlocksAnyRetryUntilCanonicalReconciliation
      : value.providerInferenceOrSubstantiveWorkKnownExecuted === 'unknown'
        && !value.gpuJobDispatched
        && value.unknownOutcomeBlocksAnyRetryUntilCanonicalReconciliation
  if (!exact) context.addIssue({
    code: 'custom',
    message: 'SAM 3.1 private chunk launch outcome is inconsistent.',
  })
}

const launchResultWithoutHashSchema =
  launchResultPayloadSchema.superRefine(refineLaunchResult)
export const canonicalSam31PrivateCompleteSourceChunkLaunchResultSchema =
  launchResultPayloadSchema.extend({ resultHash: sha256 }).strict()
    .superRefine(refineLaunchResult)
export type CanonicalSam31PrivateCompleteSourceChunkLaunchResult = z.infer<
  typeof canonicalSam31PrivateCompleteSourceChunkLaunchResultSchema
>

const cloudLaunchResultSchema = z.object({
  disposition: z.enum([
    'accepted',
    'rejected_before_creation',
    'outcome_unknown',
  ]),
  cloudJobExecutionRef: refSchema.nullable(),
  cloudJobCreateRequestRef: refSchema,
  providerRequestIdDigestSha256: sha256.nullable(),
  observedAt: timestamp,
  providerInferenceOrSubstantiveWorkKnownExecuted: z.enum([
    'executed',
    'not_executed',
    'unknown',
  ]),
}).strict().superRefine((result, context) => {
  const exact = result.disposition === 'accepted'
    ? result.cloudJobExecutionRef !== null
      && result.providerInferenceOrSubstantiveWorkKnownExecuted ===
        'not_executed'
    : result.disposition === 'rejected_before_creation'
      ? result.cloudJobExecutionRef === null
        && result.providerInferenceOrSubstantiveWorkKnownExecuted ===
          'not_executed'
      : result.providerInferenceOrSubstantiveWorkKnownExecuted === 'unknown'
  if (!exact) context.addIssue({
    code: 'custom',
    message: 'SAM 3.1 private cloud launch result is malformed.',
  })
})

export interface CanonicalSam31PrivateCompleteSourceChunkLaunchPortResolver {
  readonly schemaVersion:
    'canonical-sam3_1-private-complete-source-chunk-launch-port-resolver-v1'
  readonly privateInternalOnly: true
  readonly customerOrPublicDispatchAuthorized: false
  resolve(input: {
    readonly routeId: 'a100_80gb_heavy_primary' | 'l4_heavy_fallback'
    readonly runtimeReleaseRef: EvidenceRef
    readonly accountEffectiveRateAuthorityRef: EvidenceRef
    readonly at: string
  }): Promise<CanonicalProfessionalGpuCloudJobLaunchPort | null>
}

export interface CanonicalSam31PrivateCompleteSourceChunkLaunchRepository {
  readonly schemaVersion:
    'canonical-sam3_1-private-complete-source-chunk-launch-repository-v1'
  persistIntentCreateOnly(input: {
    readonly intent: CanonicalSam31PrivateCompleteSourceChunkLaunchIntent
  }): Promise<'created' | 'identical_replay'>
  rereadIntent(input: {
    readonly executionPlanId: string
    readonly chunkOrdinal: number
  }): Promise<CanonicalSam31PrivateCompleteSourceChunkLaunchIntent | null>
  persistResultCreateOnly(input: {
    readonly result: CanonicalSam31PrivateCompleteSourceChunkLaunchResult
  }): Promise<'created' | 'identical_replay'>
  rereadResult(input: {
    readonly executionPlanId: string
    readonly chunkOrdinal: number
  }): Promise<CanonicalSam31PrivateCompleteSourceChunkLaunchResult | null>
}

export function createCanonicalSam31PrivateCompleteSourceChunkLaunchOwner(
  input: {
    readonly executionPlanRepository:
      CanonicalSam31PrivateCompleteSourceExecutionPlanRepository
    readonly materializationRepository:
      CanonicalSam31PrivateCompleteSourceTaskMaterializationRepository
    readonly taskStore: Pick<CanonicalSam31GpuTaskStore, 'rereadTask'>
    readonly taskAuthorityReadPort:
      CanonicalSam31PrivateCompleteSourceTaskAuthorityReadPort
    readonly launchPortResolver:
      CanonicalSam31PrivateCompleteSourceChunkLaunchPortResolver
    readonly repository:
      CanonicalSam31PrivateCompleteSourceChunkLaunchRepository
  },
) {
  assertDependencies(input)
  return Object.freeze({
    schemaVersion:
      CANONICAL_SAM3_1_PRIVATE_COMPLETE_SOURCE_CHUNK_LAUNCH_OWNER_VERSION,
    privateInternalOnly: true as const,
    customerOrPublicDispatchAuthorized: false as const,
    maximumSimultaneousRouteAttempts: 1 as const,
    async start(untrusted: unknown): Promise<
      CanonicalSam31PrivateCompleteSourceChunkLaunchResult
    > {
      assertPlainSerializedData(untrusted,
        'sam31_private_complete_source_chunk_launch_request')
      const request = z.object({
        executionPlanRef: refSchema,
        chunkOrdinal: z.number().int().min(1).max(49),
        startedAt: timestamp,
      }).strict().parse(untrusted)
      const plan = assertCanonicalSam31PrivateCompleteSourceExecutionPlan(
        await input.executionPlanRepository.reread({
          executionPlanRef: request.executionPlanRef,
        }),
        request.startedAt,
      )
      if (!sameRef(
        canonicalSam31PrivateCompleteSourceExecutionPlanRef(plan),
        request.executionPlanRef,
      )) throw new TypeError('SAM 3.1 private launch plan changed.')
      const chunk = plan.chunks[request.chunkOrdinal - 1]
      if (!chunk || chunk.chunkOrdinal !== request.chunkOrdinal) {
        throw new TypeError('SAM 3.1 private launch chunk is absent.')
      }
      const materialization =
        assertCanonicalSam31PrivateCompleteSourceTaskMaterialization(
          await input.materializationRepository.reread({
            executionPlanId: plan.executionPlanId,
            chunkOrdinal: request.chunkOrdinal,
          }),
        )
      const task = assertCanonicalSam31GpuTaskRecord(
        await input.taskStore.rereadTask(chunk.privateInvocationId),
      )
      const authority = await input.taskAuthorityReadPort
        .rereadExactChunkAuthority({
          executionPlanRef: request.executionPlanRef,
          chunkOrdinal: request.chunkOrdinal,
          at: request.startedAt,
        })
      if (!authority) throw new TypeError(
        'SAM 3.1 private launch authority is absent.',
      )
      assertPlainSerializedData(authority,
        'sam31_private_complete_source_chunk_launch_authority')
      const privateAdmission =
        assertCanonicalProfessionalGpuPrivateInternalFundedDispatchAdmission(
          authority.privateInternalFundedAdmission,
        )
      const admission = privateAdmission.fundedDispatchAdmission
        .toolDispatchAdmission
      const target = assertCanonicalProfessionalGpuRuntimeLaunchTarget(
        authority.runtimeLaunchTarget,
      )
      assertExactLineage({
        request,
        plan,
        chunk,
        materialization,
        task,
        privateAdmission,
        admission,
        target,
      })
      const existingResult = await input.repository.rereadResult({
        executionPlanId: plan.executionPlanId,
        chunkOrdinal: chunk.chunkOrdinal,
      })
      if (existingResult) {
        assertResultLineage({
          result: existingResult,
          planRef: request.executionPlanRef,
          materialization,
          task,
        })
        return existingResult
      }
      const intent = buildIntent({
        request,
        plan,
        materialization,
        task,
        privateAdmission,
      })
      const intentDisposition = await input.repository.persistIntentCreateOnly({
        intent,
      })
      const intentReread = await input.repository.rereadIntent({
        executionPlanId: plan.executionPlanId,
        chunkOrdinal: chunk.chunkOrdinal,
      })
      if (!intentReread || intentReread.intentHash !== intent.intentHash) {
        throw new TypeError('SAM 3.1 private launch intent changed.')
      }
      if (intentDisposition === 'identical_replay') {
        return persistAndRereadResult({
          repository: input.repository,
          result: buildUnknownResult({
            intent: intentReread,
            observedAt: request.startedAt,
          }),
        })
      }
      let launchPort: CanonicalProfessionalGpuCloudJobLaunchPort
      try {
        const resolved = await input.launchPortResolver.resolve({
          routeId: plan.routeId,
          runtimeReleaseRef: plan.runtimeReleaseRef,
          accountEffectiveRateAuthorityRef:
            plan.accountEffectiveRateAuthorityRef,
          at: request.startedAt,
        })
        if (!resolved) throw new TypeError(
          'SAM 3.1 private cloud launch port is absent.',
        )
        launchPort =
          assertCanonicalProfessionalGpuFixedTaskPreparingLaunchPort({
            launchPort: resolved,
            toolId: 'sam3_1',
            operationId: CANONICAL_SAM3_1_OPERATION_ID,
            fixedServerTaskContractRef: target.fixedServerTaskContractRef,
          })
      } catch {
        return persistAndRereadResult({
          repository: input.repository,
          result: buildUnknownResult({
            intent: intentReread,
            observedAt: request.startedAt,
          }),
        })
      }
      let launch: z.infer<typeof cloudLaunchResultSchema>
      try {
        launch = cloudLaunchResultSchema.parse(
          await launchPort.startOneShotJob({
            admission,
            target,
            admissionConsumptionRef: task.admissionConsumptionRef,
            executionEnvelopeRef: task.executionEnvelopeRef,
          }),
        )
      } catch {
        return persistAndRereadResult({
          repository: input.repository,
          result: buildUnknownResult({
            intent: intentReread,
            observedAt: request.startedAt,
          }),
        })
      }
      return persistAndRereadResult({
        repository: input.repository,
        result: buildLaunchResult({ intent: intentReread, launch }),
      })
    },
  })
}

export function assertCanonicalSam31PrivateCompleteSourceChunkLaunchIntent(
  value: unknown,
): CanonicalSam31PrivateCompleteSourceChunkLaunchIntent {
  assertPlainSerializedData(value,
    'sam31_private_complete_source_chunk_launch_intent')
  const parsed = canonicalSam31PrivateCompleteSourceChunkLaunchIntentSchema
    .parse(value)
  const { intentHash, ...payload } = parsed
  if (intentHash !== sha256AuthorityValue(payload)) {
    throw new TypeError('SAM 3.1 private launch intent changed.')
  }
  return Object.freeze(structuredClone(parsed))
}

export function assertCanonicalSam31PrivateCompleteSourceChunkLaunchResult(
  value: unknown,
): CanonicalSam31PrivateCompleteSourceChunkLaunchResult {
  assertPlainSerializedData(value,
    'sam31_private_complete_source_chunk_launch_result')
  const parsed = canonicalSam31PrivateCompleteSourceChunkLaunchResultSchema
    .parse(value)
  const { resultHash, ...payload } = parsed
  if (resultHash !== sha256AuthorityValue(payload)) {
    throw new TypeError('SAM 3.1 private chunk launch result changed.')
  }
  return Object.freeze(structuredClone(parsed))
}

export function createCanonicalSam31PrivateCompleteSourceChunkLaunchRepository(
  input: {
    readonly objectPort: CanonicalCreateOnlyJsonObjectPort
    readonly prefix?: string
  },
): CanonicalSam31PrivateCompleteSourceChunkLaunchRepository {
  if (typeof input.objectPort?.createOnly !== 'function'
    || typeof input.objectPort?.readExact !== 'function') {
    throw new TypeError('SAM 3.1 private chunk launch store is absent.')
  }
  const prefix = safePrefix.parse(input.prefix ?? DEFAULT_PREFIX)
  const repository: CanonicalSam31PrivateCompleteSourceChunkLaunchRepository = {
    schemaVersion:
      'canonical-sam3_1-private-complete-source-chunk-launch-repository-v1' as const,
    persistIntentCreateOnly: ({ intent }) => persistExact({
      objectPort: input.objectPort,
      objectPath: recordPath(prefix, intent.executionPlanRef.id,
        intent.chunkOrdinal, 'intent'),
      value: assertCanonicalSam31PrivateCompleteSourceChunkLaunchIntent(intent),
      parser: assertCanonicalSam31PrivateCompleteSourceChunkLaunchIntent,
    }),
    rereadIntent: ({ executionPlanId, chunkOrdinal }) => readExact({
      objectPort: input.objectPort,
      objectPath: recordPath(prefix, executionPlanId, chunkOrdinal, 'intent'),
      parser: assertCanonicalSam31PrivateCompleteSourceChunkLaunchIntent,
    }),
    persistResultCreateOnly: ({ result }) => persistExact({
      objectPort: input.objectPort,
      objectPath: recordPath(prefix, result.executionPlanRef.id,
        result.chunkOrdinal, 'result'),
      value: assertCanonicalSam31PrivateCompleteSourceChunkLaunchResult(result),
      parser: assertCanonicalSam31PrivateCompleteSourceChunkLaunchResult,
    }),
    rereadResult: ({ executionPlanId, chunkOrdinal }) => readExact({
      objectPort: input.objectPort,
      objectPath: recordPath(prefix, executionPlanId, chunkOrdinal, 'result'),
      parser: assertCanonicalSam31PrivateCompleteSourceChunkLaunchResult,
    }),
  }
  return Object.freeze(repository)
}

function buildIntent(input: {
  request: { executionPlanRef: EvidenceRef; chunkOrdinal: number;
    startedAt: string }
  plan: ReturnType<
    typeof assertCanonicalSam31PrivateCompleteSourceExecutionPlan
  >
  materialization: ReturnType<
    typeof assertCanonicalSam31PrivateCompleteSourceTaskMaterialization
  >
  task: ReturnType<typeof assertCanonicalSam31GpuTaskRecord>
  privateAdmission: ReturnType<
    typeof assertCanonicalProfessionalGpuPrivateInternalFundedDispatchAdmission
  >
}): CanonicalSam31PrivateCompleteSourceChunkLaunchIntent {
  const payload = intentWithoutHashSchema.parse({
    schemaVersion:
      CANONICAL_SAM3_1_PRIVATE_COMPLETE_SOURCE_CHUNK_LAUNCH_INTENT_VERSION,
    ownerVersion:
      CANONICAL_SAM3_1_PRIVATE_COMPLETE_SOURCE_CHUNK_LAUNCH_OWNER_VERSION,
    source:
      'canonical_server_sam3_1_private_complete_source_chunk_launch_owner',
    evidenceClass:
      'canonical_private_materialization_task_admission_target_exact_reread',
    status: 'private_chunk_cloud_create_reserved',
    launchIntentId:
      `${input.plan.executionPlanId}:chunk-${input.request.chunkOrdinal}:launch-intent`,
    executionPlanRef: input.request.executionPlanRef,
    routeId: input.plan.routeId,
    chunkOrdinal: input.request.chunkOrdinal,
    materializationRef: ref(
      input.materialization.materializationId,
      input.materialization.materializationHash,
    ),
    taskRecordRef: input.materialization.taskRecordRef,
    runtimeRequestRef: input.materialization.runtimeRequestRef,
    privateInternalFundedAdmissionRef:
      input.materialization.privateInternalFundedAdmissionRef,
    runtimeReleaseRef: input.plan.runtimeReleaseRef,
    accountEffectiveRateAuthorityRef:
      input.plan.accountEffectiveRateAuthorityRef,
    admissionConsumptionRef: input.task.admissionConsumptionRef,
    executionEnvelopeRef: input.task.executionEnvelopeRef,
    exactPlanMaterializationTaskAdmissionTargetReleaseAndRateReread: true,
    durableSingleUseIntentPersistedBeforeCloudCreate: true,
    previousChunkTerminalAndScaleZeroRereadWhenRequired: true,
    maximumSimultaneousRouteAttempts: 1,
    platformFundedPrivateQualification: true,
    automaticRetryOrFallbackAllowed: false,
    substantiveCpuExecutionAllowed: false,
    sourceResolutionReductionAllowed: false,
    customerCreditsMutated: false,
    customerOrPublicDispatchAuthorized: false,
    publicConcurrencyCapacityRequiredForThisPrivateRun: false,
    qaApproved: false,
    publicDeliveryAuthorized: false,
    productionAuthorityGranted: false,
    reservedAt: input.request.startedAt,
  })
  return assertCanonicalSam31PrivateCompleteSourceChunkLaunchIntent({
    ...payload,
    intentHash: sha256AuthorityValue(payload),
  })
}

function buildLaunchResult(input: {
  intent: CanonicalSam31PrivateCompleteSourceChunkLaunchIntent
  launch: z.infer<typeof cloudLaunchResultSchema>
}): CanonicalSam31PrivateCompleteSourceChunkLaunchResult {
  const created = input.launch.disposition === 'accepted'
  const rejected = input.launch.disposition === 'rejected_before_creation'
  const status: z.infer<typeof launchResultPayloadSchema>['status'] = created
    ? 'private_chunk_gpu_job_created'
    : rejected
      ? 'private_chunk_cloud_create_rejected_before_creation'
      : 'private_chunk_cloud_create_outcome_unknown_requires_reconciliation'
  const payload = launchResultWithoutHashSchema.parse({
    schemaVersion:
      CANONICAL_SAM3_1_PRIVATE_COMPLETE_SOURCE_CHUNK_LAUNCH_RESULT_VERSION,
    ownerVersion:
      CANONICAL_SAM3_1_PRIVATE_COMPLETE_SOURCE_CHUNK_LAUNCH_OWNER_VERSION,
    source:
      'canonical_server_sam3_1_private_complete_source_chunk_launch_owner',
    evidenceClass: 'canonical_private_single_use_cloud_create_result',
    status,
    launchResultId:
      `${input.intent.executionPlanRef.id}:chunk-${input.intent.chunkOrdinal}:launch-result`,
    launchIntentRef: ref(input.intent.launchIntentId, input.intent.intentHash),
    executionPlanRef: input.intent.executionPlanRef,
    routeId: input.intent.routeId,
    chunkOrdinal: input.intent.chunkOrdinal,
    materializationRef: input.intent.materializationRef,
    taskRecordRef: input.intent.taskRecordRef,
    runtimeRequestRef: input.intent.runtimeRequestRef,
    privateInternalFundedAdmissionRef:
      input.intent.privateInternalFundedAdmissionRef,
    runtimeReleaseRef: input.intent.runtimeReleaseRef,
    accountEffectiveRateAuthorityRef:
      input.intent.accountEffectiveRateAuthorityRef,
    admissionConsumptionRef: input.intent.admissionConsumptionRef,
    executionEnvelopeRef: input.intent.executionEnvelopeRef,
    cloudJobCreateRequestRef: input.launch.cloudJobCreateRequestRef,
    cloudJobExecutionRef: input.launch.cloudJobExecutionRef,
    providerRequestIdDigestSha256:
      input.launch.providerRequestIdDigestSha256,
    providerInferenceOrSubstantiveWorkKnownExecuted:
      input.launch.providerInferenceOrSubstantiveWorkKnownExecuted,
    durableSingleUseIntentPersistedBeforeCloudCreate: true,
    exactLaunchResultPersistedCreateOnlyAndReread: true,
    unknownOutcomeBlocksAnyRetryUntilCanonicalReconciliation:
      !created && !rejected,
    duplicateReplayStartedNewCloudCreate: false,
    maximumSimultaneousRouteAttempts: 1,
    minimumIdleGpuInstances: 0,
    userTriggeredScaleFromZero: true,
    gpuJobDispatched: created,
    automaticRetryOrFallbackStarted: false,
    customerCreditsMutated: false,
    customerOrPublicDispatchAuthorized: false,
    qaApproved: false,
    publicDeliveryAuthorized: false,
    productionAuthorityGranted: false,
    observedAt: input.launch.observedAt,
  })
  return assertCanonicalSam31PrivateCompleteSourceChunkLaunchResult({
    ...payload,
    resultHash: sha256AuthorityValue(payload),
  })
}

function buildUnknownResult(input: {
  intent: CanonicalSam31PrivateCompleteSourceChunkLaunchIntent
  observedAt: string
}): CanonicalSam31PrivateCompleteSourceChunkLaunchResult {
  return buildLaunchResult({
    intent: input.intent,
    launch: cloudLaunchResultSchema.parse({
      disposition: 'outcome_unknown',
      cloudJobExecutionRef: null,
      cloudJobCreateRequestRef: ref(
        `${input.intent.launchIntentId}:cloud-create-unknown`,
        input.intent.intentHash,
      ),
      providerRequestIdDigestSha256: null,
      observedAt: input.observedAt,
      providerInferenceOrSubstantiveWorkKnownExecuted: 'unknown',
    }),
  })
}

async function persistAndRereadResult(input: {
  repository: CanonicalSam31PrivateCompleteSourceChunkLaunchRepository
  result: CanonicalSam31PrivateCompleteSourceChunkLaunchResult
}): Promise<CanonicalSam31PrivateCompleteSourceChunkLaunchResult> {
  await input.repository.persistResultCreateOnly({ result: input.result })
  const reread = await input.repository.rereadResult({
    executionPlanId: input.result.executionPlanRef.id,
    chunkOrdinal: input.result.chunkOrdinal,
  })
  if (!reread || reread.resultHash !== input.result.resultHash) {
    throw new TypeError('SAM 3.1 private chunk launch result changed.')
  }
  return reread
}

function assertExactLineage(input: {
  request: { executionPlanRef: EvidenceRef; chunkOrdinal: number;
    startedAt: string }
  plan: ReturnType<
    typeof assertCanonicalSam31PrivateCompleteSourceExecutionPlan
  >
  chunk: ReturnType<
    typeof assertCanonicalSam31PrivateCompleteSourceExecutionPlan
  >['chunks'][number]
  materialization: ReturnType<
    typeof assertCanonicalSam31PrivateCompleteSourceTaskMaterialization
  >
  task: ReturnType<typeof assertCanonicalSam31GpuTaskRecord>
  privateAdmission: ReturnType<
    typeof assertCanonicalProfessionalGpuPrivateInternalFundedDispatchAdmission
  >
  admission: ReturnType<
    typeof assertCanonicalProfessionalGpuPrivateInternalFundedDispatchAdmission
  >['fundedDispatchAdmission']['toolDispatchAdmission']
  target: ReturnType<typeof assertCanonicalProfessionalGpuRuntimeLaunchTarget>
}): void {
  const { request, plan, chunk, materialization, task, privateAdmission,
    admission, target } = input
  const exact = sameRef(materialization.executionPlanRef,
    request.executionPlanRef)
    && materialization.routeId === plan.routeId
    && materialization.chunkOrdinal === chunk.chunkOrdinal
    && materialization.gpuJobDispatched === false
    && sameRef(materialization.taskRecordRef,
      ref(task.taskId, task.taskRecordHash))
    && sameRef(materialization.runtimeRequestRef, task.runtimeRequestRef)
    && task.invocationId === chunk.privateInvocationId
    && sameRef(task.executionEnvelopeRef,
      materialization.executionEnvelopeRef)
    && sameRef(task.dispatchAdmissionRef,
      ref(admission.admissionId, admission.admissionHash))
    && sameRef(privateAdmission.runtimeReleaseRef, plan.runtimeReleaseRef)
    && sameRef(privateAdmission.currentRateAuthorityRef,
      plan.accountEffectiveRateAuthorityRef)
    && sameRef(materialization.privateInternalFundedAdmissionRef,
      ref(privateAdmission.fundedDispatchAdmission.fundedAdmissionId,
        privateAdmission.privateInternalFundedAdmissionHash))
    && admission.toolId === 'sam3_1'
    && admission.operationId === CANONICAL_SAM3_1_OPERATION_ID
    && admission.routeId === plan.routeId
    && sameRef(admission.scope.executionAttemptRef,
      chunk.executionAttemptRef)
    && sameRef(admission.runtimeReleaseRef, plan.runtimeReleaseRef)
    && sameRef(admission.currentRateAuthorityRef,
      plan.accountEffectiveRateAuthorityRef)
    && target.routeId === plan.routeId
    && target.toolId === 'sam3_1'
    && target.operationId === CANONICAL_SAM3_1_OPERATION_ID
    && sameRef(target.releaseRef, plan.runtimeReleaseRef)
    && target.immutableImageDigest === plan.immutableImageDigest
    && Date.parse(request.startedAt) >= Date.parse(admission.admittedAt)
    && Date.parse(request.startedAt) < Date.parse(admission.expiresAt)
  if (!exact) throw new TypeError(
    'SAM 3.1 private chunk launch lineage changed.',
  )
}

function assertResultLineage(input: {
  result: CanonicalSam31PrivateCompleteSourceChunkLaunchResult
  planRef: EvidenceRef
  materialization: CanonicalSam31PrivateCompleteSourceTaskMaterialization
  task: ReturnType<typeof assertCanonicalSam31GpuTaskRecord>
}): void {
  if (!sameRef(input.result.executionPlanRef, input.planRef)
    || input.result.chunkOrdinal !== input.materialization.chunkOrdinal
    || !sameRef(input.result.materializationRef,
      ref(input.materialization.materializationId,
        input.materialization.materializationHash))
    || !sameRef(input.result.taskRecordRef,
      ref(input.task.taskId, input.task.taskRecordHash))
    || !sameRef(input.result.runtimeRequestRef, input.task.runtimeRequestRef)
    || !sameRef(input.result.executionEnvelopeRef,
      input.task.executionEnvelopeRef)) {
    throw new TypeError('SAM 3.1 private launch replay changed lineage.')
  }
}

function assertDependencies(input: {
  executionPlanRepository:
    CanonicalSam31PrivateCompleteSourceExecutionPlanRepository
  materializationRepository:
    CanonicalSam31PrivateCompleteSourceTaskMaterializationRepository
  taskStore: Pick<CanonicalSam31GpuTaskStore, 'rereadTask'>
  taskAuthorityReadPort:
    CanonicalSam31PrivateCompleteSourceTaskAuthorityReadPort
  launchPortResolver:
    CanonicalSam31PrivateCompleteSourceChunkLaunchPortResolver
  repository: CanonicalSam31PrivateCompleteSourceChunkLaunchRepository
}): void {
  if (typeof input.executionPlanRepository?.reread !== 'function'
    || typeof input.materializationRepository?.reread !== 'function'
    || typeof input.taskStore?.rereadTask !== 'function'
    || input.taskAuthorityReadPort?.schemaVersion !==
      'canonical-sam3_1-private-complete-source-task-authority-read-port-v1'
    || typeof input.taskAuthorityReadPort.rereadExactChunkAuthority !==
      'function'
    || input.launchPortResolver?.schemaVersion !==
      'canonical-sam3_1-private-complete-source-chunk-launch-port-resolver-v1'
    || !input.launchPortResolver.privateInternalOnly
    || input.launchPortResolver.customerOrPublicDispatchAuthorized
    || typeof input.launchPortResolver.resolve !== 'function'
    || typeof input.repository?.persistIntentCreateOnly !== 'function'
    || typeof input.repository?.persistResultCreateOnly !== 'function') {
    throw new TypeError('SAM 3.1 private chunk launcher is incomplete.')
  }
}

function recordPath(
  prefix: string,
  executionPlanId: string,
  chunkOrdinal: number,
  kind: 'intent' | 'result',
): string {
  const planId = safeId.parse(executionPlanId)
  const ordinal = z.number().int().min(1).max(49).parse(chunkOrdinal)
  return `${prefix}/${planId}/chunk-${String(ordinal).padStart(3, '0')}/${kind}.json`
}

async function persistExact<T>(input: {
  objectPort: CanonicalCreateOnlyJsonObjectPort
  objectPath: string
  value: T
  parser: (value: unknown) => T
}): Promise<'created' | 'identical_replay'> {
  const body = Buffer.from(stableAuthorityStringify(input.value), 'utf8')
  const disposition = await input.objectPort.createOnly({
    objectPath: input.objectPath,
    body,
    contentSha256: createHash('sha256').update(body).digest('hex'),
  })
  const reread = await input.objectPort.readExact(input.objectPath)
  if (!reread || !reread.equals(body)) {
    throw new TypeError('SAM 3.1 private launch bytes changed.')
  }
  input.parser(JSON.parse(reread.toString('utf8')) as unknown)
  return disposition === 'created'
    ? 'created' as const : 'identical_replay' as const
}

async function readExact<T>(input: {
  objectPort: CanonicalCreateOnlyJsonObjectPort
  objectPath: string
  parser: (value: unknown) => T
}): Promise<T | null> {
  const body = await input.objectPort.readExact(input.objectPath)
  if (!body) return null
  if (!Buffer.isBuffer(body) || body.byteLength < 2
    || body.byteLength > MAXIMUM_RECORD_BYTES) {
    throw new TypeError('SAM 3.1 private launch bytes changed.')
  }
  const parsed = input.parser(JSON.parse(body.toString('utf8')) as unknown)
  if (stableAuthorityStringify(parsed) !== body.toString('utf8')) {
    throw new TypeError('SAM 3.1 private launch canonical bytes changed.')
  }
  return parsed
}

function ref(id: string, hash: string, version = 1): EvidenceRef {
  return refSchema.parse({ id, version, contentHash: `sha256:${hash}` })
}

function sameRef(left: EvidenceRef, right: EvidenceRef): boolean {
  return left.id === right.id && left.version === right.version
    && left.contentHash === right.contentHash
}
