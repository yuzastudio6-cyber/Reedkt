import { createHash } from 'node:crypto'

import { z } from 'zod'

import {
  CANONICAL_QUALITY_FIRST_GPU_PROFILE_IDS,
} from '../../edit-architecture/canonical-quality-first-user-triggered-gpu-policy'
import {
  assertCanonicalProfessionalToolGpuDispatchAdmission,
  type CanonicalProfessionalToolGpuDispatchAdmission,
} from '../../edit-architecture/canonical-professional-tool-gpu-dispatch-admission'
import {
  CANONICAL_SAM3_1_OPERATION_ID,
} from '../../model-artifacts/canonical-sam3_1-source-runtime-candidate'
import {
  parseOrchestraSkillCall,
} from '../../orchestra/orchestra-skill-capability-contract'
import type {
  CanonicalCreateOnlyJsonObjectPort,
} from '../../services/canonical-gcs-source-analysis-lifecycle-store'
import {
  assertCanonicalProfessionalGpuRuntimeLaunchTarget,
  assertPlainSerializedData,
  type CanonicalProfessionalGpuCloudJobLaunchPort,
  type CanonicalProfessionalGpuCloudLaunchResult,
  type CanonicalProfessionalGpuRuntimeLaunchTarget,
} from '../../services/canonical-professional-gpu-job-lifecycle-service'
import {
  sha256AuthorityValue,
  stableAuthorityStringify,
} from '../../services/private-edit-authority-store'
import {
  assertCanonicalSam31GpuRuntimeRequest,
  buildCanonicalSam31GpuRuntimeRequest,
  canonicalSam31GpuApprovedPromptSchema,
  canonicalSam31GpuRuntimeRequestSchema,
  canonicalSam31GpuSourceMediaSchema,
} from './canonical-sam3_1-gpu-runtime-contract'
import {
  assertCanonicalSam31GpuPrivateInputStagingEvidence,
  canonicalSam31GpuPrivateInputStagingEvidenceSchema,
  type CanonicalSam31GpuPrivateInputStagingEvidence,
  type CanonicalSam31GpuPrivateInputStagingPort,
} from './canonical-sam3_1-gpu-private-input-staging-service'
import {
  assertCanonicalSam31GpuRuntimeReleaseObservation,
  canonicalSam31GpuRuntimeReleaseObservationSchema,
} from './canonical-sam3_1-gpu-runtime-release'
import {
  assertCanonicalTrackAllSam31OrchestraBinding,
  canonicalTrackAllSam31OrchestraBindingSchema,
} from './canonical-track-all-sam3_1-orchestra-binding'

export const CANONICAL_SAM3_1_GPU_FIXED_TASK_CONTRACT_VERSION =
  'canonical-sam3_1-gpu-fixed-task-contract-v1' as const
export const CANONICAL_SAM3_1_GPU_TASK_RECORD_VERSION =
  'canonical-sam3_1-gpu-task-record-v1' as const

const DEFAULT_PREFIX =
  'private/canonical-professional-gpu/sam3_1/v1/invocations'
const MAXIMUM_TASK_BYTES = 512 * 1024
const safeId = z.string().trim().min(1).max(240)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/u)
  .refine((value) => !value.includes('..'))
const sha256 = z.string().regex(/^[a-f0-9]{64}$/u)
const prefixedSha256 = z.string().regex(/^sha256:[a-f0-9]{64}$/u)
const timestamp = z.string().datetime({ offset: true })
const positiveInteger = z.number().int().positive().safe()
const evidenceRefSchema = z.object({
  id: safeId,
  version: positiveInteger,
  contentHash: prefixedSha256,
}).strict()

const fixedTaskContractDescriptor = Object.freeze({
  schemaVersion: CANONICAL_SAM3_1_GPU_FIXED_TASK_CONTRACT_VERSION,
  operationId: CANONICAL_SAM3_1_OPERATION_ID,
  invocationEnvironmentName: 'REEDITPRO_GPU_INVOCATION_ID',
  acceleratorEnvironmentName: 'WEEDITPRO_GPU_ACCELERATOR_CLASS',
  taskFileName: 'task.json',
  responseFileName: 'response.json',
  taskRecordVersion: CANONICAL_SAM3_1_GPU_TASK_RECORD_VERSION,
  runtimeRequestVersion: 'canonical-sam3_1-gpu-runtime-request-v1',
  runtimeResponseVersion: 'canonical-sam3_1-gpu-runtime-response-v1',
  privateInputStagingEvidenceVersion:
    'canonical-sam3_1-gpu-private-input-staging-evidence-v1',
  byteFreeCloudEnvelope: true,
  privateCreateOnlyTaskAndResultObjects: true,
  runtimeDownloadAllowed: false,
  cpuOnlySubstantiveExecutionAllowed: false,
})

export function canonicalSam31GpuFixedTaskContractRef() {
  return evidenceRefSchema.parse({
    id: CANONICAL_SAM3_1_GPU_FIXED_TASK_CONTRACT_VERSION,
    version: 1,
    contentHash: `sha256:${sha256AuthorityValue(
      fixedTaskContractDescriptor,
    )}`,
  })
}

const taskContextWithoutRefSchema = z.object({
  schemaVersion: z.literal('canonical-sam3_1-gpu-task-context-v2'),
  source: z.literal('canonical_server_sam3_1_task_context_repository'),
  evidenceClass: z.literal('canonical_private_reread'),
  trackAllOrchestraBinding: canonicalTrackAllSam31OrchestraBindingSchema,
  editPlanVersionId: safeId,
  editPlanVersionRef: evidenceRefSchema,
  outputId: safeId,
  confirmedOutputFrameRef: evidenceRefSchema,
  sceneId: safeId,
  sourceBindingRef: evidenceRefSchema,
  sourceMedia: z.unknown(),
  approvedPrompt: z.unknown(),
  specializedRuntimeRelease:
    canonicalSam31GpuRuntimeReleaseObservationSchema,
  primaryRateAuthorityRef: evidenceRefSchema,
  fallbackRateAuthorityRef: evidenceRefSchema,
  privateTaskInputTransportRef: evidenceRefSchema,
  privateTaskOutputTransportRef: evidenceRefSchema,
  exactApprovedSnapshotWorkLeaseFrameTimingSourceAndPromptReread:
    z.literal(true),
  exactPrimaryAndFallbackAccountEffectiveRatesReread: z.literal(true),
  browserOrCallerTaskContextAccepted: z.literal(false),
  preparedAt: timestamp,
}).strict()
const taskContextSchema = taskContextWithoutRefSchema.extend({
  taskContextRef: evidenceRefSchema.extend({ version: z.literal(1) }).strict(),
}).strict()
export type CanonicalSam31GpuTaskContext = z.infer<
  typeof taskContextSchema
>

export function buildCanonicalSam31GpuTaskContext(input: {
  readonly taskContextId: string
  readonly trackAllOrchestraBinding: unknown
  readonly editPlanVersionId: string
  readonly editPlanVersionRef: z.input<typeof evidenceRefSchema>
  readonly outputId: string
  readonly confirmedOutputFrameRef: z.input<typeof evidenceRefSchema>
  readonly sceneId: string
  readonly sourceBindingRef: z.input<typeof evidenceRefSchema>
  readonly sourceMedia: unknown
  readonly approvedPrompt: unknown
  readonly specializedRuntimeRelease: unknown
  readonly primaryRateAuthorityRef: z.input<typeof evidenceRefSchema>
  readonly fallbackRateAuthorityRef: z.input<typeof evidenceRefSchema>
  readonly privateTaskInputTransportRef: z.input<typeof evidenceRefSchema>
  readonly privateTaskOutputTransportRef: z.input<typeof evidenceRefSchema>
  readonly preparedAt: string
}): CanonicalSam31GpuTaskContext {
  const payload = taskContextWithoutRefSchema.parse({
    schemaVersion: 'canonical-sam3_1-gpu-task-context-v2',
    source: 'canonical_server_sam3_1_task_context_repository',
    evidenceClass: 'canonical_private_reread',
    trackAllOrchestraBinding:
      assertCanonicalTrackAllSam31OrchestraBinding({
        value: input.trackAllOrchestraBinding,
      }),
    editPlanVersionId: input.editPlanVersionId,
    editPlanVersionRef: input.editPlanVersionRef,
    outputId: input.outputId,
    confirmedOutputFrameRef: input.confirmedOutputFrameRef,
    sceneId: input.sceneId,
    sourceBindingRef: input.sourceBindingRef,
    sourceMedia: input.sourceMedia,
    approvedPrompt: input.approvedPrompt,
    specializedRuntimeRelease: input.specializedRuntimeRelease,
    primaryRateAuthorityRef: input.primaryRateAuthorityRef,
    fallbackRateAuthorityRef: input.fallbackRateAuthorityRef,
    privateTaskInputTransportRef: input.privateTaskInputTransportRef,
    privateTaskOutputTransportRef: input.privateTaskOutputTransportRef,
    exactApprovedSnapshotWorkLeaseFrameTimingSourceAndPromptReread: true,
    exactPrimaryAndFallbackAccountEffectiveRatesReread: true,
    browserOrCallerTaskContextAccepted: false,
    preparedAt: input.preparedAt,
  })
  return Object.freeze(taskContextSchema.parse({
    ...payload,
    taskContextRef: {
      id: safeId.parse(input.taskContextId),
      version: 1,
      contentHash: `sha256:${sha256AuthorityValue(payload)}`,
    },
  }))
}

export function assertCanonicalSam31GpuTaskContext(
  value: unknown,
): CanonicalSam31GpuTaskContext {
  assertPlainSerializedData(value, 'sam3_1_gpu_task_context')
  const context = taskContextSchema.parse(value)
  const { taskContextRef, ...payload } = context
  if (taskContextRef.contentHash !==
    `sha256:${sha256AuthorityValue(payload)}`) {
    throw new Error('SAM 3.1 task context hash is invalid.')
  }
  assertCanonicalTrackAllSam31OrchestraBinding({
    value: context.trackAllOrchestraBinding,
  })
  return structuredClone(context)
}

const taskRecordWithoutHashSchema = z.object({
  schemaVersion: z.literal(CANONICAL_SAM3_1_GPU_TASK_RECORD_VERSION),
  source: z.literal('canonical_server_sam3_1_gpu_task_owner'),
  evidenceClass: z.literal('canonical_private_reread'),
  taskId: safeId,
  invocationId: safeId,
  taskContextRef: evidenceRefSchema,
  fixedTaskContractRef: evidenceRefSchema,
  dispatchAdmissionRef: evidenceRefSchema,
  admissionConsumptionRef: evidenceRefSchema,
  executionEnvelopeRef: evidenceRefSchema,
  runtimeReleaseRef: evidenceRefSchema,
  specializedRuntimeReleaseRef: evidenceRefSchema,
  primaryRateAuthorityRef: evidenceRefSchema,
  fallbackRateAuthorityRef: evidenceRefSchema,
  privateTaskInputTransportRef: evidenceRefSchema,
  privateTaskOutputTransportRef: evidenceRefSchema,
  privateInputStagingEvidenceRef: evidenceRefSchema,
  privateInputStagingEvidence:
    canonicalSam31GpuPrivateInputStagingEvidenceSchema,
  runtimeRequestRef: evidenceRefSchema,
  runtimeRequestContentSha256: sha256,
  runtimeRequest: canonicalSam31GpuRuntimeRequestSchema,
  privateWorkerMustRereadThisExactTaskBeforeAnySourceOrModelRead:
    z.literal(true),
  responseMustBeCreateOnlyAndServerRereadBeforeAdmission: z.literal(true),
  callerPathUrlBytesCommandModelRoutePriceOrEnvironmentIncluded:
    z.literal(false),
  cloudJobCreated: z.literal(false),
  customerCreditsMutated: z.literal(false),
  qaApproved: z.literal(false),
  publicDeliveryAuthorized: z.literal(false),
  productionAuthorityGranted: z.literal(false),
  preparedAt: timestamp,
}).strict().superRefine((record, context) => {
  const request = record.runtimeRequest
  const exact = record.invocationId === record.executionEnvelopeRef.id
    && record.runtimeRequestContentSha256 ===
      sha256AuthorityValue(request)
    && record.runtimeRequestRef.contentHash ===
      `sha256:${record.runtimeRequestContentSha256}`
    && sameRef(record.dispatchAdmissionRef,
      request.dispatchAdmissionRef)
    && record.privateInputStagingEvidenceRef.id ===
      record.privateInputStagingEvidence.stagingId
    && record.privateInputStagingEvidenceRef.contentHash ===
      `sha256:${record.privateInputStagingEvidence.evidenceHash}`
    && record.privateInputStagingEvidence.invocationId ===
      record.invocationId
  if (!exact) context.addIssue({
    code: 'custom',
    message: 'SAM 3.1 fixed task lost invocation or request lineage.',
  })
})

export const canonicalSam31GpuTaskRecordSchema =
  taskRecordWithoutHashSchema.extend({ taskRecordHash: sha256 }).strict()
export type CanonicalSam31GpuTaskRecord = z.infer<
  typeof canonicalSam31GpuTaskRecordSchema
>

export interface CanonicalSam31GpuTaskContextReadPort {
  rereadCanonicalTaskContext(input: {
    readonly admission: CanonicalProfessionalToolGpuDispatchAdmission
    readonly target: CanonicalProfessionalGpuRuntimeLaunchTarget
    readonly admissionConsumptionRef: z.infer<typeof evidenceRefSchema>
    readonly executionEnvelopeRef: z.infer<typeof evidenceRefSchema>
  }): Promise<unknown>
}

export interface CanonicalSam31GpuTaskStore {
  readonly schemaVersion: 'canonical-sam3_1-gpu-task-store-v1'
  readonly evidenceClass: 'gcs_generation_create_only_sam3_1_task_store'
  persistTaskCreateOnly(
    record: CanonicalSam31GpuTaskRecord,
  ): Promise<'created' | 'already_exists'>
  rereadTask(invocationId: string): Promise<unknown>
  rereadRuntimeResponse(invocationId: string): Promise<unknown>
}

export function createCanonicalSam31GpuTaskStoreFromObjectPort(input: {
  readonly objectPort: CanonicalCreateOnlyJsonObjectPort
  readonly prefix?: string
}): CanonicalSam31GpuTaskStore {
  if (!input.objectPort
    || typeof input.objectPort.createOnly !== 'function'
    || typeof input.objectPort.readExact !== 'function') {
    throw new Error('SAM 3.1 task object store is unavailable.')
  }
  const prefix = normalizePrefix(input.prefix ?? DEFAULT_PREFIX)
  const store: CanonicalSam31GpuTaskStore = {
    schemaVersion: 'canonical-sam3_1-gpu-task-store-v1' as const,
    evidenceClass:
      'gcs_generation_create_only_sam3_1_task_store' as const,
    async persistTaskCreateOnly(record: CanonicalSam31GpuTaskRecord) {
      const task = assertCanonicalSam31GpuTaskRecord(record)
      const body = Buffer.from(stableAuthorityStringify(task), 'utf8')
      if (body.byteLength > MAXIMUM_TASK_BYTES) {
        throw new Error('SAM 3.1 fixed task exceeded its byte bound.')
      }
      return input.objectPort.createOnly({
        objectPath: taskObjectPath(prefix, task.invocationId, 'task'),
        body,
        contentSha256: rawBytesSha256(body),
      })
    },
    async rereadTask(invocationId: string) {
      return readJsonObject({
        objectPort: input.objectPort,
        objectPath: taskObjectPath(prefix, invocationId, 'task'),
      })
    },
    async rereadRuntimeResponse(invocationId: string) {
      return readJsonObject({
        objectPort: input.objectPort,
        objectPath: taskObjectPath(prefix, invocationId, 'response'),
      })
    },
  }
  return Object.freeze(store)
}

export function createCanonicalSam31PreparingCloudJobLaunchPort(input: {
  readonly taskContextReadPort: CanonicalSam31GpuTaskContextReadPort
  readonly privateInputStagingPort:
    CanonicalSam31GpuPrivateInputStagingPort
  readonly taskStore: CanonicalSam31GpuTaskStore
  readonly delegate: CanonicalProfessionalGpuCloudJobLaunchPort
  readonly now?: () => string
}): CanonicalProfessionalGpuCloudJobLaunchPort {
  const now = input.now ?? (() => new Date().toISOString())
  const port: CanonicalProfessionalGpuCloudJobLaunchPort = {
    async startOneShotJob(
      value: Parameters<
        CanonicalProfessionalGpuCloudJobLaunchPort['startOneShotJob']
      >[0],
    ) {
      const observedAt = now()
      let admission: CanonicalProfessionalToolGpuDispatchAdmission | null = null
      try {
        admission = assertCanonicalProfessionalToolGpuDispatchAdmission(
          value.admission,
        )
        const target = assertCanonicalProfessionalGpuRuntimeLaunchTarget(
          value.target,
        )
        if (admission.toolId !== 'sam3_1'
          || admission.operationId !== CANONICAL_SAM3_1_OPERATION_ID
          || target.toolId !== 'sam3_1'
          || target.operationId !== CANONICAL_SAM3_1_OPERATION_ID
          || !sameRef(target.fixedServerTaskContractRef,
            canonicalSam31GpuFixedTaskContractRef())) {
          throw new Error('SAM 3.1 launch target is not the fixed contract.')
        }
        assertPlainSerializedData(value.admissionConsumptionRef,
          'sam3_1_admission_consumption_ref')
        assertPlainSerializedData(value.executionEnvelopeRef,
          'sam3_1_execution_envelope_ref')
        const context = assertCanonicalSam31GpuTaskContext(
          await input.taskContextReadPort.rereadCanonicalTaskContext({
            admission,
            target,
            admissionConsumptionRef: value.admissionConsumptionRef,
            executionEnvelopeRef: value.executionEnvelopeRef,
          }),
        )
        const specialized = assertCanonicalSam31GpuRuntimeReleaseObservation(
          context.specializedRuntimeRelease,
        )
        assertTaskContextMatches({
          admission,
          target,
          taskContext: context,
          specialized,
        })
        const privateInputStagingEvidence =
          assertCanonicalSam31GpuPrivateInputStagingEvidence(
            await input.privateInputStagingPort
              .stageAndRereadExactMaskProxy({
                invocationId: value.executionEnvelopeRef.id,
                scope: {
                  ownerUserId: admission.scope.ownerUserId,
                  workspaceId: admission.scope.workspaceId,
                  projectId: admission.scope.projectId,
                  editSessionId: admission.scope.editSessionId,
                  approvedSnapshotRef: admission.scope.approvedSnapshotRef,
                  approvedWorkItemRef: admission.scope.approvedWorkItemRef,
                  workerLeaseRef: admission.scope.workerLeaseRef,
                  executionAttemptRef:
                    admission.scope.executionAttemptRef,
                },
                dispatchAdmissionRef: ref(
                  admission.admissionId,
                  admission.admissionHash,
                ),
                executionEnvelopeRef: value.executionEnvelopeRef,
                sourceBindingRef: context.sourceBindingRef,
                sourceMedia: context.sourceMedia,
                privateTaskInputTransportRef:
                  context.privateTaskInputTransportRef,
                stagedAt: observedAt,
              }),
          )
        const task = buildCanonicalSam31GpuTaskRecord({
          admission,
          target,
          admissionConsumptionRef: value.admissionConsumptionRef,
          executionEnvelopeRef: value.executionEnvelopeRef,
          context,
          privateInputStagingEvidence,
          preparedAt: observedAt,
        })
        if (await input.taskStore.persistTaskCreateOnly(task) !== 'created') {
          throw new Error(
            'SAM 3.1 task already exists; launch reconciliation is required.',
          )
        }
        const reread = assertCanonicalSam31GpuTaskRecord(
          await input.taskStore.rereadTask(task.invocationId),
        )
        if (reread.taskRecordHash !== task.taskRecordHash) {
          throw new Error('SAM 3.1 fixed task exact reread changed.')
        }
        return await input.delegate.startOneShotJob(value)
      } catch {
        return rejectedBeforeCreation({
          admission,
          executionEnvelopeRef: value.executionEnvelopeRef,
          observedAt,
        })
      }
    },
  }
  return Object.freeze(port)
}

export function buildCanonicalSam31GpuTaskRecord(input: {
  readonly admission: unknown
  readonly target: unknown
  readonly admissionConsumptionRef: z.input<typeof evidenceRefSchema>
  readonly executionEnvelopeRef: z.input<typeof evidenceRefSchema>
  readonly context: unknown
  readonly privateInputStagingEvidence: unknown
  readonly preparedAt: string
}): CanonicalSam31GpuTaskRecord {
  const admission = assertCanonicalProfessionalToolGpuDispatchAdmission(
    input.admission,
  )
  const target = assertCanonicalProfessionalGpuRuntimeLaunchTarget(
    input.target,
  )
  assertPlainSerializedData(input.context, 'sam3_1_task_context')
  const taskContext = assertCanonicalSam31GpuTaskContext(input.context)
  const privateInputStagingEvidence =
    assertCanonicalSam31GpuPrivateInputStagingEvidence(
      input.privateInputStagingEvidence,
    )
  const specialized = assertCanonicalSam31GpuRuntimeReleaseObservation(
    taskContext.specializedRuntimeRelease,
  )
  const admissionConsumptionRef = evidenceRefSchema.parse(
    input.admissionConsumptionRef,
  )
  const executionEnvelopeRef = evidenceRefSchema.parse(
    input.executionEnvelopeRef,
  )
  assertTaskContextMatches({ admission, target, taskContext, specialized })
  assertPrivateInputStagingMatches({
    admission,
    executionEnvelopeRef,
    taskContext,
    evidence: privateInputStagingEvidence,
  })

  if (admission.routeId === 'l4_standard_primary') {
    throw new Error('SAM 3.1 is not admitted on the standard L4 lane.')
  }
  const routeRole = admission.routeId
  const primary = routeRole === 'a100_80gb_heavy_primary'
  const runtimeRequest = buildCanonicalSam31GpuRuntimeRequest({
    schemaVersion: 'canonical-sam3_1-gpu-runtime-request-v1',
    operationId: CANONICAL_SAM3_1_OPERATION_ID,
    dispatchAdmissionRef: ref(
      admission.admissionId,
      admission.admissionHash,
    ),
    dispatchAdmissionDigestSha256: admission.admissionHash,
    scope: {
      ownerUserId: admission.scope.ownerUserId,
      workspaceId: admission.scope.workspaceId,
      projectId: admission.scope.projectId,
      editSessionId: admission.scope.editSessionId,
      editPlanId: admission.scope.editPlanId,
      editPlanVersionId: taskContext.editPlanVersionId,
      approvedPlanSnapshotId: admission.scope.approvedSnapshotRef.id,
      approvedPlanSnapshotHash:
        admission.scope.approvedSnapshotRef.contentHash.slice(7),
      outputId: taskContext.outputId,
      sceneId: taskContext.sceneId,
      approvedWorkItemRef: admission.scope.approvedWorkItemRef,
      workerLeaseRef: admission.scope.workerLeaseRef,
      executionAttemptRef: admission.scope.executionAttemptRef,
      fundedCreditReservationRef: admission.scope.fundedReservationRef,
      masterTimingRef: admission.scope.masterTimingRef,
      sourceBindingRef: taskContext.sourceBindingRef,
    },
    dispatch: {
      routeRole,
      gpuProfileId: primary
        ? CANONICAL_QUALITY_FIRST_GPU_PROFILE_IDS[0]
        : CANONICAL_QUALITY_FIRST_GPU_PROFILE_IDS[1],
      accelerator: target.accelerator,
      attemptOrdinal: primary ? 1 : 2,
      priorAttemptDisposition: primary
        ? 'not_applicable_primary'
        : 'not_executed_retry_safe',
      priorAttemptDispositionRef: primary
        ? null
        : admission.priorPrimaryTerminalReceiptRef,
      currentPrimaryAndFallbackRateAuthoritiesReread: true,
      exactPerToolEstimateApproved: true,
      userTriggeredAfterApproval: true,
      scaleFromZeroRequired: true,
      scaleBackToZeroAfterTerminalAttemptRequired: true,
      unknownPriorOutcomeMayRetryOrFallback: false,
      cpuOnlyInferenceAllowed: false,
    },
    sourceMedia: taskContext.sourceMedia as never,
    approvedPrompt: taskContext.approvedPrompt as never,
    modelArtifacts: {
      sourceCandidateRef: specialized.sourceCandidateRef,
      privateArtifactIngestReceiptRef:
        specialized.privateArtifactIngestReceiptRef,
      sourceArchiveRef: specialized.sourceArchive.artifactRef,
      sourceRevision: specialized.sourceArchive.revision,
      sourceArchiveByteLength: 73_605_120,
      sourceArchiveSha256:
        '5138f0e396de40a40ef0168c106e089aacbbf1dc7651be2f81c76f89c2f67f2a',
      reeditproGpuDecodePatchSha256:
        specialized.sourceArchive.gpuDecodePatchSha256,
      checkpointRef: specialized.checkpoint.artifactRef,
      checkpointRepositoryRevision:
        specialized.checkpoint.repositoryRevision,
      checkpointFileName: specialized.checkpoint.fileName,
      checkpointByteLength: specialized.checkpoint.byteLength,
      checkpointSha256: specialized.checkpoint.sha256,
      sourceCheckpointCompatibilityQualificationRef:
        specialized.qualification
          .sourceCheckpointCompatibilityQualificationRef,
      immutableImageReleaseRef: target.immutableImageRef,
      immutableImageDigest: target.immutableImageDigest,
      humanTermsAcceptanceAndLegalReviewReread: true,
      sourceAndCheckpointMalwareScanReread: true,
      runtimeDownloadAllowed: false,
    },
    settings: {
      builder: 'build_sam3_multiplex_video_predictor',
      predictorVersion: 'sam3.1',
      maximumTrackedObjectsProductCap: 16,
      multiplexBucketSize: 16,
      useFlashAttention3: false,
      useRealValuedRope: true,
      torchCompileEnabled: false,
      warmupCompilationEnabled: false,
      defaultOutputProbabilityThreshold: 0.5,
      asynchronousFrameLoading: true,
      videoDecodeBackend: 'torchcodec_0_10_cuda_nvdec',
      gpuAcceleratedDecode: true,
      cpuOpenCvOrPillowDecodeAllowed: false,
      strictCheckpointLoadRequired: true,
      cudaOutputTensorsRequired: true,
      boundedCpuOutputSerializationOnly: true,
      offloadVideoToCpu: false,
      offloadStateToCpu: false,
      propagationDirection: 'forward',
      outputFormat: 'lossless_grayscale_png_mask_sequence_v1',
      sourceResolutionPreserved: true,
      sourceFrameRangePreserved: true,
      quantizationAllowed: false,
    },
    byteFreeRequest: true,
    callerCodePathUrlCommandOrEnvironmentAccepted: false,
  })
  const runtimeRequestContentSha256 = sha256AuthorityValue(runtimeRequest)
  const specializedRuntimeReleaseRef = ref(
    specialized.releaseId,
    specialized.releaseObservationHash,
    specialized.releaseVersion,
  )
  const payload = taskRecordWithoutHashSchema.parse({
    schemaVersion: CANONICAL_SAM3_1_GPU_TASK_RECORD_VERSION,
    source: 'canonical_server_sam3_1_gpu_task_owner',
    evidenceClass: 'canonical_private_reread',
    taskId: `sam31-task:${executionEnvelopeRef.id}`,
    invocationId: executionEnvelopeRef.id,
    taskContextRef: taskContext.taskContextRef,
    fixedTaskContractRef: target.fixedServerTaskContractRef,
    dispatchAdmissionRef: runtimeRequest.dispatchAdmissionRef,
    admissionConsumptionRef,
    executionEnvelopeRef,
    runtimeReleaseRef: target.releaseRef,
    specializedRuntimeReleaseRef,
    primaryRateAuthorityRef: taskContext.primaryRateAuthorityRef,
    fallbackRateAuthorityRef: taskContext.fallbackRateAuthorityRef,
    privateTaskInputTransportRef:
      taskContext.privateTaskInputTransportRef,
    privateTaskOutputTransportRef:
      taskContext.privateTaskOutputTransportRef,
    privateInputStagingEvidenceRef: ref(
      privateInputStagingEvidence.stagingId,
      privateInputStagingEvidence.evidenceHash,
    ),
    privateInputStagingEvidence,
    runtimeRequestRef: ref(
      `sam31-runtime-request:${executionEnvelopeRef.id}`,
      runtimeRequestContentSha256,
    ),
    runtimeRequestContentSha256,
    runtimeRequest,
    privateWorkerMustRereadThisExactTaskBeforeAnySourceOrModelRead: true,
    responseMustBeCreateOnlyAndServerRereadBeforeAdmission: true,
    callerPathUrlBytesCommandModelRoutePriceOrEnvironmentIncluded: false,
    cloudJobCreated: false,
    customerCreditsMutated: false,
    qaApproved: false,
    publicDeliveryAuthorized: false,
    productionAuthorityGranted: false,
    preparedAt: input.preparedAt,
  })
  return canonicalSam31GpuTaskRecordSchema.parse({
    ...payload,
    taskRecordHash: sha256AuthorityValue(payload),
  })
}

export function assertCanonicalSam31GpuTaskRecord(
  value: unknown,
): CanonicalSam31GpuTaskRecord {
  assertPlainSerializedData(value, 'sam3_1_gpu_task_record')
  const record = canonicalSam31GpuTaskRecordSchema.parse(value)
  const { taskRecordHash, ...payload } = record
  const request = assertCanonicalSam31GpuRuntimeRequest(record.runtimeRequest)
  if (taskRecordHash !== sha256AuthorityValue(payload)
    || record.runtimeRequestContentSha256 !== sha256AuthorityValue(request)) {
    throw new Error('SAM 3.1 GPU fixed task record hash is invalid.')
  }
  return record
}

function assertTaskContextMatches(input: {
  admission: CanonicalProfessionalToolGpuDispatchAdmission
  target: CanonicalProfessionalGpuRuntimeLaunchTarget
  taskContext: CanonicalSam31GpuTaskContext
  specialized: ReturnType<
    typeof assertCanonicalSam31GpuRuntimeReleaseObservation
  >
}): void {
  const { admission, target, taskContext, specialized } = input
  const trackAllBinding = assertCanonicalTrackAllSam31OrchestraBinding({
    value: taskContext.trackAllOrchestraBinding,
    admission,
  })
  const trackAllCall = parseOrchestraSkillCall(
    trackAllBinding.orchestraCall,
  )
  if (trackAllCall.scope.scopeType !== 'scene') {
    throw new Error('SAM 3.1 Track All binding lost scene scope.')
  }
  const sourceMedia = canonicalSam31GpuSourceMediaSchema.parse(
    taskContext.sourceMedia,
  )
  const approvedPrompt = canonicalSam31GpuApprovedPromptSchema.parse(
    taskContext.approvedPrompt,
  )
  const requiredTrackAllEvidence = [
    trackAllCall.scope.selectedSceneBindingRef,
    taskContext.confirmedOutputFrameRef,
    admission.scope.masterTimingRef,
    approvedPrompt.compiledIntentRef,
    approvedPrompt.promptApprovalRef,
    approvedPrompt.sourceFrameLineageRef,
  ]
  const selectedRate = admission.routeId === 'a100_80gb_heavy_primary'
    ? taskContext.primaryRateAuthorityRef
    : taskContext.fallbackRateAuthorityRef
  if (
    admission.toolId !== 'sam3_1'
    || admission.operationId !== CANONICAL_SAM3_1_OPERATION_ID
    || target.toolId !== admission.toolId
    || target.operationId !== admission.operationId
    || target.routeId !== admission.routeId
    || specialized.evidenceClass !== 'canonical_private_reread'
    || specialized.status !== 'private_internal_qualified'
    || !specialized.authority.privateInternalQualified
    || specialized.route.routeId !== admission.routeId
    || specialized.route.accelerator !== target.accelerator
    || specialized.immutableImageDigest !== target.immutableImageDigest
    || !sameRef(specialized.immutableImageRef, target.immutableImageRef)
    || taskContext.editPlanVersionRef.id !== taskContext.editPlanVersionId
    || taskContext.editPlanVersionRef.version !==
      admission.scope.editPlanVersion
    || taskContext.outputId.length === 0
    || !sameRef(taskContext.confirmedOutputFrameRef,
      admission.scope.confirmedOutputFrameRef)
    || trackAllCall.scope.outputId !== taskContext.outputId
    || trackAllCall.scope.sceneId !== taskContext.sceneId
    || !sameRef(trackAllCall.scope.sourceArtifactRef,
      sourceMedia.finalizedSourceArtifactRef)
    || !sameRef(trackAllCall.scope.selectedSceneBindingRef,
      taskContext.sourceBindingRef)
    || trackAllCall.scope.authorizedRange.startFrame !==
      sourceMedia.canonicalSourceStartFrameInclusive
    || trackAllCall.scope.authorizedRange.endFrameExclusive !==
      sourceMedia.canonicalSourceEndFrameInclusive + 1
    || trackAllCall.scope.authorizedRange.frameRate.numerator !==
      sourceMedia.fpsNumerator
    || trackAllCall.scope.authorizedRange.frameRate.denominator !==
      sourceMedia.fpsDenominator
    || requiredTrackAllEvidence.some((required) =>
      !trackAllCall.requiredEvidenceRefs.some((observed) =>
        sameRef(observed, required)))
    || !sameRef(selectedRate, admission.currentRateAuthorityRef)
    || Date.parse(taskContext.preparedAt) > Date.parse(admission.admittedAt)
  ) throw new Error(
    'SAM 3.1 task context differs from admission, release, frame, or rates.',
  )
}

function assertPrivateInputStagingMatches(input: {
  admission: CanonicalProfessionalToolGpuDispatchAdmission
  executionEnvelopeRef: z.infer<typeof evidenceRefSchema>
  taskContext: CanonicalSam31GpuTaskContext
  evidence: CanonicalSam31GpuPrivateInputStagingEvidence
}): void {
  const { admission, executionEnvelopeRef, taskContext, evidence } = input
  const source = taskContext.sourceMedia as z.infer<
    typeof canonicalSam31GpuRuntimeRequestSchema
  >['sourceMedia']
  if (
    evidence.invocationId !== executionEnvelopeRef.id
    || !sameRef(evidence.executionEnvelopeRef, executionEnvelopeRef)
    || !sameRef(evidence.dispatchAdmissionRef,
      ref(admission.admissionId, admission.admissionHash))
    || evidence.scope.ownerUserId !== admission.scope.ownerUserId
    || evidence.scope.workspaceId !== admission.scope.workspaceId
    || evidence.scope.projectId !== admission.scope.projectId
    || evidence.scope.editSessionId !== admission.scope.editSessionId
    || !sameRef(evidence.scope.approvedSnapshotRef,
      admission.scope.approvedSnapshotRef)
    || !sameRef(evidence.scope.approvedWorkItemRef,
      admission.scope.approvedWorkItemRef)
    || !sameRef(evidence.scope.workerLeaseRef,
      admission.scope.workerLeaseRef)
    || !sameRef(evidence.scope.executionAttemptRef,
      admission.scope.executionAttemptRef)
    || !sameRef(evidence.sourceBindingRef, taskContext.sourceBindingRef)
    || !sameRef(evidence.finalizedSourceArtifactRef,
      source.finalizedSourceArtifactRef)
    || !sameRef(evidence.gpuPreparedMaskProxyArtifactRef,
      source.gpuPreparedMaskProxyArtifactRef)
    || !sameRef(evidence.exactSourceReadEvidenceRef,
      source.exactSourceReadEvidenceRef)
    || !sameRef(evidence.sourceFrameRangeMappingRef,
      source.sourceFrameRangeMappingRef)
    || !sameRef(evidence.proxyPixelGeometryQaRef,
      source.proxyPixelGeometryQaRef)
    || !sameRef(evidence.privateTaskInputTransportRef,
      taskContext.privateTaskInputTransportRef)
    || evidence.byteLength !== source.byteLength
    || evidence.sha256 !== source.sha256
    || evidence.width !== source.width
    || evidence.height !== source.height
    || evidence.decodedFrameCount !== source.decodedFrameCount
    || evidence.selectedStartFrameInclusive !==
      source.selectedStartFrameInclusive
    || evidence.selectedEndFrameInclusive !==
      source.selectedEndFrameInclusive
  ) throw new Error(
    'SAM 3.1 private staged input differs from approved task source.',
  )
}

function rejectedBeforeCreation(input: {
  admission: CanonicalProfessionalToolGpuDispatchAdmission | null
  executionEnvelopeRef: z.input<typeof evidenceRefSchema>
  observedAt: string
}): CanonicalProfessionalGpuCloudLaunchResult {
  const envelope = evidenceRefSchema.safeParse(input.executionEnvelopeRef)
  const digest = sha256AuthorityValue({
    admissionId: input.admission?.admissionId ?? 'invalid-admission',
    envelopeRef: envelope.success ? envelope.data : null,
    reasonCode: 'sam3_1_fixed_task_preparation_rejected',
  })
  return Object.freeze({
    disposition: 'rejected_before_creation',
    cloudJobExecutionRef: null,
    cloudJobCreateRequestRef: {
      id: `sam31-task-rejected.${digest.slice(0, 32)}`,
      version: 1,
      contentHash: `sha256:${digest}`,
    },
    providerRequestIdDigestSha256: null,
    observedAt: input.observedAt,
    providerInferenceOrSubstantiveWorkKnownExecuted: 'not_executed',
  })
}

async function readJsonObject(input: {
  objectPort: CanonicalCreateOnlyJsonObjectPort
  objectPath: string
}): Promise<unknown> {
  const body = await input.objectPort.readExact(input.objectPath)
  if (!body) return null
  if (body.byteLength < 2 || body.byteLength > MAXIMUM_TASK_BYTES) {
    throw new Error('SAM 3.1 task object byte length is invalid.')
  }
  try {
    return JSON.parse(body.toString('utf8')) as unknown
  } catch {
    throw new Error('SAM 3.1 task object JSON is invalid.')
  }
}

function taskObjectPath(
  prefix: string,
  untrustedInvocationId: string,
  kind: 'task' | 'response',
): string {
  const invocationId = safeId.parse(untrustedInvocationId)
  return `${prefix}/${invocationId}/${kind}.json`
}

function normalizePrefix(value: string): string {
  const normalized = value.trim().replace(/^\/+|\/+$/gu, '')
  if (!normalized || normalized.length > 400 || normalized.includes('..')
    || normalized.includes('\\')
    || normalized.split('/').some((part) => !safeId.safeParse(part).success)) {
    throw new Error('SAM 3.1 task store prefix is invalid.')
  }
  return normalized
}

function ref(id: string, rawHash: string, version = 1) {
  return evidenceRefSchema.parse({
    id,
    version,
    contentHash: `sha256:${rawHash}`,
  })
}

function sameRef(
  left: z.infer<typeof evidenceRefSchema>,
  right: z.infer<typeof evidenceRefSchema>,
): boolean {
  return stableAuthorityStringify(left) === stableAuthorityStringify(right)
}

function rawBytesSha256(value: Buffer): string {
  return createHash('sha256').update(value).digest('hex')
}
