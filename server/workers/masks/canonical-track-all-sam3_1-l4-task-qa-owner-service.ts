import { createHash } from 'node:crypto'

import { z } from 'zod'

import {
  assertCanonicalProfessionalToolGpuDispatchAdmission,
  type CanonicalProfessionalToolGpuDispatchAdmission,
} from '../../edit-architecture/canonical-professional-tool-gpu-dispatch-admission'
import {
  assertCanonicalProfessionalGpuRuntimeLaunchTarget,
  assertPlainSerializedData,
  createCanonicalProfessionalGpuFixedTaskPreparingLaunchPort,
  type CanonicalProfessionalGpuCloudJobLaunchPort,
  type CanonicalProfessionalGpuCloudLaunchResult,
  type CanonicalProfessionalGpuRuntimeLaunchTarget,
} from '../../services/canonical-professional-gpu-job-lifecycle-service'
import type {
  CanonicalCreateOnlyJsonObjectPort,
} from '../../services/canonical-gcs-source-analysis-lifecycle-store'
import {
  sha256AuthorityValue,
  stableAuthorityStringify,
} from '../../services/private-edit-authority-store'
import {
  buildCanonicalTrackAllSam31L4TaskQaWorkerRequestV3,
  assertCanonicalTrackAllSam31L4TaskQaWorkerRequestV3,
  canonicalTrackAllSam31L4TaskQaFixedTaskContractRef,
  CANONICAL_TRACK_ALL_SAM3_1_L4_TASK_QA_OPERATION_ID,
  type CanonicalTrackAllSam31L4TaskQaWorkerRequestV3,
} from './canonical-track-all-sam3_1-l4-task-qa-worker-contract'

export const CANONICAL_TRACK_ALL_SAM3_1_L4_TASK_QA_MATERIAL_VERSION =
  'canonical-track-all-sam3_1-l4-task-qa-material-v1' as const
export const CANONICAL_TRACK_ALL_SAM3_1_L4_TASK_QA_MATERIAL_V2_VERSION =
  'canonical-track-all-sam3_1-l4-task-qa-material-v2' as const
export const CANONICAL_TRACK_ALL_SAM3_1_L4_TASK_QA_TASK_STORE_VERSION =
  'canonical-track-all-sam3_1-l4-task-qa-task-store-v1' as const
export const CANONICAL_TRACK_ALL_SAM3_1_L4_TASK_QA_MATERIAL_REPOSITORY_VERSION =
  'canonical-track-all-sam3_1-l4-task-qa-material-repository-v1' as const

const DEFAULT_PREFIX =
  'private/canonical-professional-gpu/sam3_1/v1/invocations'
const MAXIMUM_TASK_BYTES = 16 * 1024 * 1024
const safeId = z.string().trim().min(1).max(240)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/u)
  .refine((value) => !value.includes('..'))
const sha256 = z.string().regex(/^[a-f0-9]{64}$/u)
const prefixedSha256 = z.string().regex(/^sha256:[a-f0-9]{64}$/u)
const timestamp = z.string().datetime({ offset: true })
const positiveInteger = z.number().int().positive().safe()
const nonnegativeInteger = z.number().int().nonnegative().safe()
const evidenceRefSchema = z.object({
  id: safeId,
  version: positiveInteger,
  contentHash: prefixedSha256,
}).strict()
const frameRangeSchema = z.object({
  startFrame: nonnegativeInteger,
  endFrameExclusive: positiveInteger,
}).strict().superRefine((range, context) => {
  if (range.endFrameExclusive <= range.startFrame) context.addIssue({
    code: 'custom', message: 'Track All L4 task-QA material range is empty.',
  })
})
const subjectSchema = z.object({
  subjectRequestId: safeId,
  subjectEvidenceId: safeId,
  subjectRole: z.enum([
    'primary_speaker', 'secondary_speaker', 'hand', 'product',
    'important_object', 'environmental_surface',
  ]),
  maskObjectId: nonnegativeInteger.max(2 ** 31 - 1),
  canonicalFrameRange: frameRangeSchema,
  maskFrameRange: frameRangeSchema,
  trackManifestRef: evidenceRefSchema,
  anchorManifestRef: evidenceRefSchema.nullable(),
  sourceFrameMappingRef: evidenceRefSchema,
  outputFrameDigestSha256: sha256,
}).strict()

const materialBaseSchema = z.object({
  schemaVersion: z.literal(
    CANONICAL_TRACK_ALL_SAM3_1_L4_TASK_QA_MATERIAL_VERSION,
  ),
  source: z.literal(
    'canonical_server_track_all_sam3_1_l4_task_qa_material_owner',
  ),
  evidenceClass: z.literal('canonical_private_reread'),
  materialId: safeId,
  sam31InvocationId: safeId,
  sam31TaskRef: evidenceRefSchema,
  sam31RuntimeRequestBindingSha256: sha256,
  sam31RuntimeResultAdmissionRef: evidenceRefSchema,
  sam31MaskManifestRef: evidenceRefSchema,
  approvedSnapshotRef: evidenceRefSchema,
  confirmedOutputFrameRef: evidenceRefSchema,
  masterTimingRef: evidenceRefSchema,
  approvedWorkItemRef: evidenceRefSchema,
  workerLeaseRef: evidenceRefSchema,
  fundedReservationRef: evidenceRefSchema,
  userTriggerRecordRef: evidenceRefSchema,
  executionAttemptRef: evidenceRefSchema,
  sourceFrameMappingRef: evidenceRefSchema,
  sourceWidth: positiveInteger.max(16_384),
  sourceHeight: positiveInteger.max(16_384),
  maskFrameRange: frameRangeSchema,
  expectedMaskManifestByteLength: positiveInteger.max(64 * 1024 * 1024),
  expectedMaskManifestSha256: sha256,
  expectedMaskPngCount: positiveInteger.max(16 * 240),
  subjects: z.array(subjectSchema).min(1).max(16),
  exactSamTaskContextResultAndPrivateOutputReread: z.literal(true),
  exactApprovedSnapshotFrameTimingWorkLeaseAttemptAndFundingReread:
    z.literal(true),
  materialCreateOnlyPersistenceAndExactRereadRequiredBeforeL4AdmissionConsumption:
    z.literal(true),
  browserOrCallerTaskMaterialAccepted: z.literal(false),
  callerPathUrlCommandCodeModelEnvironmentOrPriceAccepted: z.literal(false),
  customerCreditsMutated: z.literal(false),
  qaApproved: z.literal(false),
  publicDeliveryAuthorized: z.literal(false),
  productionAuthorityGranted: z.literal(false),
  preparedAt: timestamp,
}).strict()

function materialV1ScopeIsExact(material: z.infer<
  typeof materialBaseSchema
>): boolean {
  const frameCount = material.maskFrameRange.endFrameExclusive
    - material.maskFrameRange.startFrame
  return material.sam31MaskManifestRef.contentHash ===
      `sha256:${material.expectedMaskManifestSha256}`
    && material.maskFrameRange.startFrame === 0
    && material.expectedMaskPngCount ===
      frameCount * material.subjects.length
    && material.subjects.every((subject) =>
      subject.maskFrameRange.startFrame === material.maskFrameRange.startFrame
      && subject.maskFrameRange.endFrameExclusive ===
        material.maskFrameRange.endFrameExclusive
      && sameRef(subject.sourceFrameMappingRef,
        material.sourceFrameMappingRef)
      && subject.outputFrameDigestSha256 ===
        material.confirmedOutputFrameRef.contentHash.slice(7))
    && new Set(material.subjects.map((subject) =>
      subject.maskObjectId)).size === material.subjects.length
}

const materialWithoutHashSchema = materialBaseSchema.superRefine(
  (material, context) => {
    if (materialV1ScopeIsExact(material)) return
    context.addIssue({
      code: 'custom',
      message: 'Track All L4 task-QA material lost exact mask scope.',
    })
  },
)

export const canonicalTrackAllSam31L4TaskQaMaterialSchema =
  materialBaseSchema.extend({ materialHash: sha256 }).strict()
    .superRefine((material, context) => {
      if (materialV1ScopeIsExact(material)) return
      context.addIssue({
        code: 'custom',
        message: 'Track All L4 task-QA material lost exact mask scope.',
      })
    })
export type CanonicalTrackAllSam31L4TaskQaMaterial = z.infer<
  typeof canonicalTrackAllSam31L4TaskQaMaterialSchema
>

const previousBoundaryMaterialSubjectSchema = z.object({
  subjectRequestId: safeId,
  previousSubjectEvidenceId: safeId,
  currentSubjectEvidenceId: safeId,
  previousMaskObjectId: nonnegativeInteger.max(2 ** 31 - 1),
  currentMaskObjectId: nonnegativeInteger.max(2 ** 31 - 1),
}).strict()

const previousBoundaryMaterialSchema = z.object({
  previousChunkOrdinal: z.number().int().min(1).max(255),
  previousSam31InvocationId: safeId,
  previousSam31RuntimeRequestBindingSha256: sha256,
  previousSam31RuntimeResultAdmissionRef: evidenceRefSchema,
  previousSam31MaskManifestRef: evidenceRefSchema,
  previousSourceFrameMappingRef: evidenceRefSchema,
  previousConfirmedOutputFrameRef: evidenceRefSchema,
  expectedPreviousMaskManifestByteLength:
    positiveInteger.max(64 * 1024 * 1024),
  expectedPreviousMaskManifestSha256: sha256,
  previousCanonicalStartFrameInclusive: nonnegativeInteger,
  previousCanonicalEndFrameInclusive: nonnegativeInteger,
  previousMaskFrameIndex: nonnegativeInteger.max(239),
  currentMaskFrameIndex: z.literal(0),
  overlapFrameCount: z.literal(1),
  subjects: z.array(previousBoundaryMaterialSubjectSchema).min(1).max(16),
}).strict()

const materialV2BaseSchema = materialBaseSchema.omit({
  schemaVersion: true,
}).extend({
  schemaVersion: z.literal(
    CANONICAL_TRACK_ALL_SAM3_1_L4_TASK_QA_MATERIAL_V2_VERSION,
  ),
  chunkOrdinal: z.number().int().min(1).max(256),
  canonicalStartFrameInclusive: nonnegativeInteger,
  canonicalEndFrameInclusive: nonnegativeInteger,
  previousChunkBoundaryInput: previousBoundaryMaterialSchema.nullable(),
}).strict()

function materialV2ScopeIsExact(material: z.infer<
  typeof materialV2BaseSchema
>): boolean {
  const frameCount = material.maskFrameRange.endFrameExclusive
    - material.maskFrameRange.startFrame
  const boundary = material.previousChunkBoundaryInput
  const currentByRequest = new Map(material.subjects.map((subject) =>
    [subject.subjectRequestId, subject]))
  return material.canonicalEndFrameInclusive
      - material.canonicalStartFrameInclusive + 1 === frameCount
    && frameCount >= 2
    && (material.chunkOrdinal === 1) === (boundary === null)
    && (boundary === null || (
      boundary.previousChunkOrdinal === material.chunkOrdinal - 1
      && boundary.previousSam31InvocationId !== material.sam31InvocationId
      && boundary.previousSam31MaskManifestRef.contentHash
        === `sha256:${boundary.expectedPreviousMaskManifestSha256}`
      && boundary.previousCanonicalEndFrameInclusive
        === material.canonicalStartFrameInclusive
      && boundary.previousMaskFrameIndex
        === boundary.previousCanonicalEndFrameInclusive
          - boundary.previousCanonicalStartFrameInclusive
      && sameRef(boundary.previousConfirmedOutputFrameRef,
        material.confirmedOutputFrameRef)
      && new Set(boundary.subjects.map((subject) =>
        subject.subjectRequestId)).size === boundary.subjects.length
      && boundary.subjects.every((subject) => {
        const current = currentByRequest.get(subject.subjectRequestId)
        return current
          && current.subjectEvidenceId === subject.currentSubjectEvidenceId
          && current.maskObjectId === subject.currentMaskObjectId
      })
    ))
}

const materialV2WithoutHashSchema = materialV2BaseSchema.superRefine(
  (material, context) => {
    if (materialV2ScopeIsExact(material)) return
    context.addIssue({
      code: 'custom',
      message: 'Track All L4 task-QA v2 material lost temporal chunk lineage.',
    })
  },
)

export const canonicalTrackAllSam31L4TaskQaMaterialV2Schema =
  materialV2BaseSchema.extend({ materialHash: sha256 }).strict()
    .superRefine((material, context) => {
      if (materialV2ScopeIsExact(material)) return
      context.addIssue({
        code: 'custom',
        message: 'Track All L4 task-QA v2 material lost temporal chunk lineage.',
      })
    })
export type CanonicalTrackAllSam31L4TaskQaMaterialV2 = z.infer<
  typeof canonicalTrackAllSam31L4TaskQaMaterialV2Schema
>
type CanonicalTrackAllSam31L4TaskQaAnyMaterial =
  | CanonicalTrackAllSam31L4TaskQaMaterial
  | CanonicalTrackAllSam31L4TaskQaMaterialV2

const workerTaskSchema = z.object({
  runtimeRequest: z.unknown(),
}).strict()

export interface CanonicalTrackAllSam31L4TaskQaMaterialReadPort {
  rereadCanonicalL4TaskQaMaterial(input: {
    readonly admission: CanonicalProfessionalToolGpuDispatchAdmission
    readonly target: CanonicalProfessionalGpuRuntimeLaunchTarget
    readonly executionEnvelopeRef: z.infer<typeof evidenceRefSchema>
  }): Promise<unknown>
}

export interface CanonicalTrackAllSam31L4TaskQaMaterialRepository {
  readonly schemaVersion:
    typeof CANONICAL_TRACK_ALL_SAM3_1_L4_TASK_QA_MATERIAL_REPOSITORY_VERSION
  readonly evidenceClass:
    'gcs_create_only_exact_reread_track_all_l4_task_qa_material'
  persistMaterialCreateOnly(input: {
    readonly material: CanonicalTrackAllSam31L4TaskQaAnyMaterial
  }): Promise<'created' | 'already_exists'>
  rereadMaterial(input: {
    readonly executionAttemptRef: z.infer<typeof evidenceRefSchema>
  }): Promise<CanonicalTrackAllSam31L4TaskQaAnyMaterial | null>
}

export interface CanonicalTrackAllSam31L4TaskQaTaskStore {
  readonly schemaVersion:
    typeof CANONICAL_TRACK_ALL_SAM3_1_L4_TASK_QA_TASK_STORE_VERSION
  readonly evidenceClass:
    'gcs_generation_create_only_track_all_l4_task_qa_task_store'
  persistWorkerTaskCreateOnly(input: {
    readonly request: CanonicalTrackAllSam31L4TaskQaWorkerRequestV3
  }): Promise<'created' | 'already_exists'>
  rereadWorkerTask(l4InvocationId: string): Promise<unknown>
  rereadWorkerResponse(l4InvocationId: string): Promise<unknown>
}

export function buildCanonicalTrackAllSam31L4TaskQaMaterial(
  input: z.input<typeof materialWithoutHashSchema>,
): CanonicalTrackAllSam31L4TaskQaMaterial {
  assertPlainSerializedData(input, 'track_all_l4_task_qa_material_input')
  const payload = materialWithoutHashSchema.parse(input)
  return Object.freeze(canonicalTrackAllSam31L4TaskQaMaterialSchema.parse({
    ...payload,
    materialHash: sha256AuthorityValue(payload),
  }))
}

export function assertCanonicalTrackAllSam31L4TaskQaMaterial(
  value: unknown,
): CanonicalTrackAllSam31L4TaskQaMaterial {
  assertPlainSerializedData(value, 'track_all_l4_task_qa_material')
  const material = canonicalTrackAllSam31L4TaskQaMaterialSchema.parse(value)
  const { materialHash, ...payload } = material
  if (materialHash !== sha256AuthorityValue(payload)) {
    throw new TypeError('Track All L4 task-QA material hash is invalid.')
  }
  return structuredClone(material)
}

export function buildCanonicalTrackAllSam31L4TaskQaMaterialV2(
  input: z.input<typeof materialV2WithoutHashSchema>,
): CanonicalTrackAllSam31L4TaskQaMaterialV2 {
  assertPlainSerializedData(input, 'track_all_l4_task_qa_material_v2_input')
  const payload = materialV2WithoutHashSchema.parse(input)
  return canonicalTrackAllSam31L4TaskQaMaterialV2Schema.parse({
    ...payload,
    materialHash: sha256AuthorityValue(payload),
  })
}

export function assertCanonicalTrackAllSam31L4TaskQaMaterialV2(
  value: unknown,
): CanonicalTrackAllSam31L4TaskQaMaterialV2 {
  assertPlainSerializedData(value, 'track_all_l4_task_qa_material_v2')
  const material = canonicalTrackAllSam31L4TaskQaMaterialV2Schema.parse(value)
  const { materialHash, ...payload } = material
  if (materialHash !== sha256AuthorityValue(payload)) {
    throw new TypeError('Track All L4 task-QA v2 material hash is invalid.')
  }
  return structuredClone(material)
}

function assertAnyMaterial(
  value: unknown,
): CanonicalTrackAllSam31L4TaskQaAnyMaterial {
  const version = z.object({ schemaVersion: z.string() }).passthrough()
    .parse(value).schemaVersion
  return version === CANONICAL_TRACK_ALL_SAM3_1_L4_TASK_QA_MATERIAL_V2_VERSION
    ? assertCanonicalTrackAllSam31L4TaskQaMaterialV2(value)
    : assertCanonicalTrackAllSam31L4TaskQaMaterial(value)
}

export function createCanonicalTrackAllSam31L4TaskQaTaskStore(input: {
  readonly objectPort: CanonicalCreateOnlyJsonObjectPort
  readonly prefix?: string
}): CanonicalTrackAllSam31L4TaskQaTaskStore {
  assertObjectPort(input.objectPort)
  const prefix = normalizePrefix(input.prefix ?? DEFAULT_PREFIX)
  const store: CanonicalTrackAllSam31L4TaskQaTaskStore = {
    schemaVersion: CANONICAL_TRACK_ALL_SAM3_1_L4_TASK_QA_TASK_STORE_VERSION,
    evidenceClass:
      'gcs_generation_create_only_track_all_l4_task_qa_task_store' as const,
    async persistWorkerTaskCreateOnly({ request }) {
      const exact = assertCanonicalTrackAllSam31L4TaskQaWorkerRequestV3(
        request,
      )
      const body = Buffer.from(stableAuthorityStringify({
        runtimeRequest: exact,
      }), 'utf8')
      if (body.byteLength < 2 || body.byteLength > MAXIMUM_TASK_BYTES) {
        throw new Error('Track All L4 task-QA task exceeded its byte bound.')
      }
      return input.objectPort.createOnly({
        objectPath: taskPath(prefix, exact.l4InvocationId, 'task'),
        body,
        contentSha256: bytesHash(body),
      })
    },
    rereadWorkerTask(l4InvocationId) {
      return readJson({
        objectPort: input.objectPort,
        objectPath: taskPath(prefix, l4InvocationId, 'task'),
      })
    },
    rereadWorkerResponse(l4InvocationId) {
      return readJson({
        objectPort: input.objectPort,
        objectPath: taskPath(prefix, l4InvocationId, 'response'),
      })
    },
  }
  return Object.freeze(store)
}

export function createCanonicalTrackAllSam31L4TaskQaMaterialRepository(
  input: {
    readonly objectPort: CanonicalCreateOnlyJsonObjectPort
    readonly prefix?: string
  },
): CanonicalTrackAllSam31L4TaskQaMaterialRepository {
  assertObjectPort(input.objectPort)
  const prefix = normalizePrefix(input.prefix
    ?? 'private/track-all/sam3_1/v1/l4-task-qa-material')
  const repository: CanonicalTrackAllSam31L4TaskQaMaterialRepository = {
    schemaVersion:
      CANONICAL_TRACK_ALL_SAM3_1_L4_TASK_QA_MATERIAL_REPOSITORY_VERSION,
    evidenceClass:
      'gcs_create_only_exact_reread_track_all_l4_task_qa_material',
    async persistMaterialCreateOnly({ material }) {
      const exact = assertAnyMaterial(material)
      const body = Buffer.from(stableAuthorityStringify(exact), 'utf8')
      if (body.byteLength < 2 || body.byteLength > MAXIMUM_TASK_BYTES) {
        throw new Error('Track All L4 material exceeded its byte bound.')
      }
      return input.objectPort.createOnly({
        objectPath: materialPath(prefix, exact.executionAttemptRef),
        body,
        contentSha256: bytesHash(body),
      })
    },
    async rereadMaterial({ executionAttemptRef }) {
      const body = await input.objectPort.readExact(materialPath(
        prefix,
        evidenceRefSchema.parse(executionAttemptRef),
      ))
      if (!body) return null
      if (!Buffer.isBuffer(body) || body.byteLength < 2
        || body.byteLength > MAXIMUM_TASK_BYTES) {
        throw new Error('Track All L4 material reread bytes are invalid.')
      }
      let value: unknown
      try {
        value = JSON.parse(body.toString('utf8')) as unknown
      } catch {
        throw new Error('Track All L4 material reread JSON is invalid.')
      }
      const material = assertAnyMaterial(value)
      if (!sameRef(material.executionAttemptRef, executionAttemptRef)
        || stableAuthorityStringify(material) !== body.toString('utf8')) {
        throw new Error('Track All L4 material exact reread changed.')
      }
      return material
    },
  }
  return Object.freeze(repository)
}

export function createCanonicalTrackAllSam31L4TaskQaPreparingLaunchPort(
  input: {
    readonly materialReadPort:
      CanonicalTrackAllSam31L4TaskQaMaterialReadPort
    readonly taskStore: CanonicalTrackAllSam31L4TaskQaTaskStore
    readonly delegate: CanonicalProfessionalGpuCloudJobLaunchPort
    readonly now?: () => string
  },
): CanonicalProfessionalGpuCloudJobLaunchPort {
  assertDependencies(input)
  const now = input.now ?? (() => new Date().toISOString())
  const delegate: CanonicalProfessionalGpuCloudJobLaunchPort = {
    async startOneShotJob(value) {
      let admission: CanonicalProfessionalToolGpuDispatchAdmission | null = null
      let observedAt = now()
      try {
        admission = assertCanonicalProfessionalToolGpuDispatchAdmission(
          value.admission,
        )
        const target = assertCanonicalProfessionalGpuRuntimeLaunchTarget(
          value.target,
        )
        observedAt = timestamp.parse(now())
        if (
          admission.toolId !== 'kornia'
          || admission.operationId !==
            CANONICAL_TRACK_ALL_SAM3_1_L4_TASK_QA_OPERATION_ID
          || admission.routeId !== 'l4_standard_primary'
          || target.toolId !== admission.toolId
          || target.operationId !== admission.operationId
          || target.routeId !== admission.routeId
          || target.accelerator !== 'nvidia_l4'
          || !sameRef(target.fixedServerTaskContractRef,
            canonicalTrackAllSam31L4TaskQaFixedTaskContractRef())
        ) throw new Error('Track All L4 task-QA launch target is invalid.')
        const material = assertCanonicalTrackAllSam31L4TaskQaMaterialV2(
          await input.materialReadPort.rereadCanonicalL4TaskQaMaterial({
            admission,
            target,
            executionEnvelopeRef: value.executionEnvelopeRef,
          }),
        )
        assertMaterialMatches({
          material,
          admission,
          executionEnvelopeRef: value.executionEnvelopeRef,
          observedAt,
        })
        const request = buildCanonicalTrackAllSam31L4TaskQaWorkerRequestV3({
          schemaVersion:
            'canonical-track-all-sam3_1-l4-task-qa-worker-request-v3',
          operationId: CANONICAL_TRACK_ALL_SAM3_1_L4_TASK_QA_OPERATION_ID,
          l4InvocationId: value.executionEnvelopeRef.id,
          sam31InvocationId: material.sam31InvocationId,
          sam31TaskRef: material.sam31TaskRef,
          sam31RuntimeRequestBindingSha256:
            material.sam31RuntimeRequestBindingSha256,
          sam31RuntimeResultAdmissionRef:
            material.sam31RuntimeResultAdmissionRef,
          sam31MaskManifestRef: material.sam31MaskManifestRef,
          l4ExecutionEnvelopeRef: value.executionEnvelopeRef,
          approvedWorkItemRef: admission.scope.approvedWorkItemRef,
          workerLeaseRef: admission.scope.workerLeaseRef,
          executionAttemptRef: admission.scope.executionAttemptRef,
          sourceFrameMappingRef: material.sourceFrameMappingRef,
          confirmedOutputFrameRef: material.confirmedOutputFrameRef,
          sourceWidth: material.sourceWidth,
          sourceHeight: material.sourceHeight,
          maskFrameRange: material.maskFrameRange,
          expectedMaskManifestByteLength:
            material.expectedMaskManifestByteLength,
          expectedMaskManifestSha256: material.expectedMaskManifestSha256,
          expectedMaskPngCount: material.expectedMaskPngCount,
          subjects: material.subjects,
          chunkOrdinal: material.chunkOrdinal,
          canonicalStartFrameInclusive:
            material.canonicalStartFrameInclusive,
          canonicalEndFrameInclusive: material.canonicalEndFrameInclusive,
          previousChunkBoundaryInput: material.previousChunkBoundaryInput,
          executionPolicy: {
            routeId: 'l4_standard_primary',
            gpuProfileId:
              'quality_l4_user_triggered_standard_media_job_v1',
            accelerator: 'nvidia_l4',
            korniaVersion: '0.8.3',
            torchVersion: '2.10.0+cu128',
            cudaRuntimeVersion: '12.8',
            morphologyKernelSize: 3,
            binaryThreshold: 127,
            everyManifestMaskMustBeReread: true,
            everyRequestedFrameAndSubjectMustBeMeasured: true,
            korniaCudaSubstantiveMeasurementRequired: true,
            opencvCudaEveryMaskCrosscheckRequired: true,
            cpuDecodeAndBoundedSerializationOnly: true,
            cpuOnlySubstantiveMaskQaAllowed: false,
            runtimeDownloadAllowed: false,
            automaticRetryAfterUnknownOutcomeAllowed: false,
          },
          byteFreeRequest: true,
          callerPathUrlCommandCodeOrEnvironmentAccepted: false,
          browserOrCallerMeasurementAccepted: false,
        })
        if (await input.taskStore.persistWorkerTaskCreateOnly({ request })
          !== 'created') {
          throw new Error('Track All L4 task already exists; reconcile first.')
        }
        const wrapper = workerTaskSchema.parse(
          await input.taskStore.rereadWorkerTask(request.l4InvocationId),
        )
        const reread = assertCanonicalTrackAllSam31L4TaskQaWorkerRequestV3(
          wrapper.runtimeRequest,
        )
        if (reread.requestBindingSha256 !== request.requestBindingSha256) {
          throw new Error('Track All L4 fixed task exact reread changed.')
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
  return createCanonicalProfessionalGpuFixedTaskPreparingLaunchPort({
    descriptor: {
      schemaVersion:
        'canonical-professional-gpu-fixed-task-preparing-launch-port-v1',
      toolId: 'kornia',
      operationId: CANONICAL_TRACK_ALL_SAM3_1_L4_TASK_QA_OPERATION_ID,
      fixedServerTaskContractRef:
        canonicalTrackAllSam31L4TaskQaFixedTaskContractRef(),
      approvedTaskMaterialPreparedBeforeTaskContextRead: true,
      canonicalTaskContextRereadBeforeCloudJobCreation: true,
      fixedTaskPersistedAndRereadBeforeCloudJobCreation: true,
      rawCloudLaunchPortAcceptedForFixedTaskTool: false,
    },
    delegate: Object.freeze(delegate),
  })
}

function assertMaterialMatches(input: {
  material: CanonicalTrackAllSam31L4TaskQaMaterialV2
  admission: CanonicalProfessionalToolGpuDispatchAdmission
  executionEnvelopeRef: z.infer<typeof evidenceRefSchema>
  observedAt: string
}): void {
  const { material, admission } = input
  if (
    material.sam31InvocationId === input.executionEnvelopeRef.id
    || !sameRef(material.approvedSnapshotRef,
      admission.scope.approvedSnapshotRef)
    || !sameRef(material.confirmedOutputFrameRef,
      admission.scope.confirmedOutputFrameRef)
    || !sameRef(material.masterTimingRef, admission.scope.masterTimingRef)
    || !sameRef(material.approvedWorkItemRef,
      admission.scope.approvedWorkItemRef)
    || !sameRef(material.workerLeaseRef, admission.scope.workerLeaseRef)
    || !sameRef(material.fundedReservationRef,
      admission.scope.fundedReservationRef)
    || !sameRef(material.userTriggerRecordRef,
      admission.scope.userTriggerRecordRef)
    || !sameRef(material.executionAttemptRef,
      admission.scope.executionAttemptRef)
    || Date.parse(material.preparedAt) < Date.parse(admission.admittedAt)
    || Date.parse(material.preparedAt) >= Date.parse(admission.expiresAt)
    || Date.parse(material.preparedAt) > Date.parse(input.observedAt)
  ) throw new Error(
    'Track All L4 task material differs from approved GPU attempt.',
  )
}

function rejectedBeforeCreation(input: {
  admission: CanonicalProfessionalToolGpuDispatchAdmission | null
  executionEnvelopeRef: unknown
  observedAt: string
}): CanonicalProfessionalGpuCloudLaunchResult {
  const envelope = evidenceRefSchema.safeParse(input.executionEnvelopeRef)
  const digest = sha256AuthorityValue({
    admissionId: input.admission?.admissionId ?? 'invalid-admission',
    envelopeRef: envelope.success ? envelope.data : null,
    reasonCode: 'track_all_l4_fixed_task_preparation_rejected',
  })
  return Object.freeze({
    disposition: 'rejected_before_creation',
    cloudJobExecutionRef: null,
    cloudJobCreateRequestRef: {
      id: `track-all-l4-task-rejected.${digest.slice(0, 32)}`,
      version: 1,
      contentHash: `sha256:${digest}`,
    },
    providerRequestIdDigestSha256: null,
    observedAt: input.observedAt,
    providerInferenceOrSubstantiveWorkKnownExecuted: 'not_executed',
  })
}

function assertDependencies(input: {
  materialReadPort: CanonicalTrackAllSam31L4TaskQaMaterialReadPort
  taskStore: CanonicalTrackAllSam31L4TaskQaTaskStore
  delegate: CanonicalProfessionalGpuCloudJobLaunchPort
}): void {
  if (typeof input.materialReadPort?.rereadCanonicalL4TaskQaMaterial
      !== 'function'
    || typeof input.taskStore?.persistWorkerTaskCreateOnly !== 'function'
    || typeof input.taskStore?.rereadWorkerTask !== 'function'
    || typeof input.delegate?.startOneShotJob !== 'function') {
    throw new Error('Track All L4 task-QA launch dependencies are unavailable.')
  }
}

function assertObjectPort(value: CanonicalCreateOnlyJsonObjectPort): void {
  if (!value || typeof value.createOnly !== 'function'
    || typeof value.readExact !== 'function') {
    throw new Error('Track All L4 task-QA object port is unavailable.')
  }
}

async function readJson(input: {
  objectPort: CanonicalCreateOnlyJsonObjectPort
  objectPath: string
}): Promise<unknown> {
  const body = await input.objectPort.readExact(input.objectPath)
  if (!body) return null
  if (!Buffer.isBuffer(body) || body.byteLength < 2
    || body.byteLength > MAXIMUM_TASK_BYTES) {
    throw new Error('Track All L4 task-QA object bytes are invalid.')
  }
  try {
    return JSON.parse(body.toString('utf8')) as unknown
  } catch {
    throw new Error('Track All L4 task-QA object JSON is invalid.')
  }
}

function taskPath(
  prefix: string,
  invocationId: string,
  kind: 'task' | 'response',
): string {
  return `${prefix}/${safeId.parse(invocationId)}/task-qa/${kind}.json`
}

function materialPath(
  prefix: string,
  executionAttemptRef: z.infer<typeof evidenceRefSchema>,
): string {
  const exact = evidenceRefSchema.parse(executionAttemptRef)
  return `${prefix}/${exact.id}.${exact.contentHash.slice(7)}.json`
}

function normalizePrefix(value: string): string {
  const normalized = value.trim().replace(/^\/+|\/+$/gu, '')
  if (!normalized || normalized.length > 400 || normalized.includes('..')
    || normalized.includes('\\')
    || normalized.split('/').some((part) =>
      !safeId.safeParse(part).success)) {
    throw new Error('Track All L4 task-QA store prefix is invalid.')
  }
  return normalized
}

function bytesHash(value: Buffer): string {
  return createHash('sha256').update(value).digest('hex')
}

function sameRef(
  left: z.infer<typeof evidenceRefSchema>,
  right: z.infer<typeof evidenceRefSchema>,
): boolean {
  return stableAuthorityStringify(left) === stableAuthorityStringify(right)
}
