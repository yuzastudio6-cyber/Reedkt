import { createHash } from 'node:crypto'

import { z } from 'zod'

import type {
  CanonicalCreateOnlyJsonObjectPort,
} from '../../services/canonical-gcs-source-analysis-lifecycle-store'
import {
  assertCanonicalProfessionalGpuJobLaunch,
  assertCanonicalProfessionalGpuJobTerminal,
  assertPlainSerializedData,
  type CanonicalProfessionalGpuJobLaunch,
} from '../../services/canonical-professional-gpu-job-lifecycle-service'
import {
  sha256AuthorityValue,
  stableAuthorityStringify,
} from '../../services/private-edit-authority-store'
import {
  assertCanonicalSam31GpuRuntimeResponse,
  canonicalSam31GpuWireStringify,
  type CanonicalSam31GpuRuntimeResponse,
} from './canonical-sam3_1-gpu-runtime-contract'
import {
  assertCanonicalSam31GpuTaskRecord,
  type CanonicalSam31GpuTaskRecord,
  type CanonicalSam31GpuTaskStore,
} from './canonical-sam3_1-gpu-task-owner-service'

export const CANONICAL_SAM3_1_PRIVATE_OUTPUT_REREAD_EVIDENCE_VERSION =
  'canonical-sam3_1-private-output-reread-evidence-v1' as const
export const CANONICAL_SAM3_1_GPU_RUNTIME_RESULT_ADMISSION_VERSION =
  'canonical-sam3_1-gpu-runtime-result-admission-v1' as const

const DEFAULT_PREFIX =
  'private/canonical-professional-gpu/sam3_1/v1/invocations'
const MAXIMUM_RESULT_BYTES = 256 * 1024
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

const privateOutputEvidenceWithoutHashSchema = z.object({
  schemaVersion: z.literal(
    CANONICAL_SAM3_1_PRIVATE_OUTPUT_REREAD_EVIDENCE_VERSION,
  ),
  source: z.literal('canonical_server_sam3_1_private_output_reader'),
  evidenceClass: z.literal('canonical_private_reread'),
  taskRef: evidenceRefSchema,
  runtimeResponseObjectRef: evidenceRefSchema,
  runtimeResponseBindingSha256: sha256,
  manifestRef: evidenceRefSchema,
  manifestSha256: sha256,
  manifestByteLength: positiveInteger.max(64 * 1024 * 1024),
  maskSequenceArtifactRef: evidenceRefSchema,
  maskFileCount: positiveInteger,
  combinedMaskByteLength: positiveInteger,
  width: positiveInteger.max(16_384),
  height: positiveInteger.max(16_384),
  firstFrameIndex: nonnegativeInteger,
  lastFrameIndex: nonnegativeInteger,
  propagatedFrameCount: positiveInteger.max(240),
  distinctObjectIds: z.array(nonnegativeInteger).min(1).max(16),
  responseCreateOnlyPersistenceVerified: z.literal(true),
  exactResponseBytesReread: z.literal(true),
  exactManifestBytesRereadAndParsed: z.literal(true),
  everyMaskPngByteHashReread: z.literal(true),
  everyMaskPngDecodedDimensionsMatchSource: z.literal(true),
  completeApprovedFrameIntervalCoverageVerified: z.literal(true),
  noUnexpectedFilesOrCrossInvocationArtifacts: z.literal(true),
  sourceCheckpointOrTaskBytesMutated: z.literal(false),
  pathsUrlsCredentialsOrMediaBytesIncluded: z.literal(false),
  qaApproved: z.literal(false),
  assetManifestMutated: z.literal(false),
  customerCreditsMutated: z.literal(false),
  publicDeliveryAuthorized: z.literal(false),
  productionAuthorityGranted: z.literal(false),
  rereadAt: timestamp,
}).strict().superRefine((evidence, context) => {
  const orderedUnique = evidence.distinctObjectIds.every((objectId, index) =>
    index === 0 || objectId > evidence.distinctObjectIds[index - 1])
  if (
    evidence.runtimeResponseObjectRef.contentHash.length === 0
    || evidence.manifestRef.contentHash !==
      `sha256:${evidence.manifestSha256}`
    || evidence.lastFrameIndex < evidence.firstFrameIndex
    || evidence.propagatedFrameCount !==
      evidence.lastFrameIndex - evidence.firstFrameIndex + 1
    || !orderedUnique
  ) context.addIssue({
    code: 'custom',
    message: 'SAM 3.1 private output reread evidence is inconsistent.',
  })
})

export const canonicalSam31PrivateOutputRereadEvidenceSchema =
  privateOutputEvidenceWithoutHashSchema.extend({ evidenceHash: sha256 })
    .strict()
export type CanonicalSam31PrivateOutputRereadEvidence = z.infer<
  typeof canonicalSam31PrivateOutputRereadEvidenceSchema
>

const resultWithoutHashSchema = z.object({
  schemaVersion: z.literal(
    CANONICAL_SAM3_1_GPU_RUNTIME_RESULT_ADMISSION_VERSION,
  ),
  source: z.literal('canonical_server_sam3_1_gpu_runtime_result_owner'),
  evidenceClass: z.literal('canonical_private_reread'),
  status: z.literal('ready_for_independent_mask_artifact_qa'),
  resultAdmissionId: safeId,
  taskRef: evidenceRefSchema,
  runtimeRequestRef: evidenceRefSchema,
  dispatchAdmissionRef: evidenceRefSchema,
  admissionConsumptionRef: evidenceRefSchema,
  executionEnvelopeRef: evidenceRefSchema,
  runtimeReleaseRef: evidenceRefSchema,
  specializedRuntimeReleaseRef: evidenceRefSchema,
  launchRef: evidenceRefSchema,
  terminalRef: evidenceRefSchema,
  cloudJobExecutionRef: evidenceRefSchema,
  workerUsageEvidenceRef: evidenceRefSchema,
  currentAccountPriceAuthorityRef: evidenceRefSchema,
  attemptCostReceiptRef: evidenceRefSchema,
  privateOutputRereadEvidenceRef: evidenceRefSchema,
  runtimeResponseObjectRef: evidenceRefSchema,
  runtimeResponseBindingSha256: sha256,
  manifestRef: evidenceRefSchema,
  maskSequenceArtifactRef: evidenceRefSchema,
  routeId: z.enum([
    'a100_80gb_heavy_primary',
    'l4_heavy_fallback',
  ]),
  accelerator: z.enum(['nvidia_a100_80gb', 'nvidia_l4']),
  wallTimeMilliseconds: positiveInteger,
  cudaEventInferenceMilliseconds: positiveInteger,
  peakCudaAllocatedBytes: positiveInteger,
  propagatedFrameCount: positiveInteger.max(240),
  maskFileCount: positiveInteger,
  exactTaskResponseLaunchTerminalAndOutputReread: z.literal(true),
  exactGpuAndApprovedFrameRangeVerified: z.literal(true),
  actualNvdecCudaBfloat16ExecutionVerified: z.literal(true),
  terminalWorkerStoppedAndScaleBackToZeroVerified: z.literal(true),
  accountEffectiveAttemptCostReceiptPersisted: z.literal(true),
  independentMaskArtifactQaPending: z.literal(true),
  assetManifestReconciliationPending: z.literal(true),
  rendererLayerAdmissionPending: z.literal(true),
  customerCreditsMutated: z.literal(false),
  qaApproved: z.literal(false),
  assetManifestMutated: z.literal(false),
  renderAuthorized: z.literal(false),
  publicDeliveryAuthorized: z.literal(false),
  productionAuthorityGranted: z.literal(false),
  admittedAt: timestamp,
}).strict()

export const canonicalSam31GpuRuntimeResultAdmissionSchema =
  resultWithoutHashSchema.extend({ resultAdmissionHash: sha256 }).strict()
export type CanonicalSam31GpuRuntimeResultAdmission = z.infer<
  typeof canonicalSam31GpuRuntimeResultAdmissionSchema
>

export interface CanonicalSam31PrivateOutputRereadPort {
  rereadExactPrivateOutput(input: {
    readonly task: CanonicalSam31GpuTaskRecord
    readonly response: CanonicalSam31GpuRuntimeResponse
    readonly launch: CanonicalProfessionalGpuJobLaunch
  }): Promise<unknown>
}

export interface CanonicalSam31GpuRuntimeResultStore {
  readonly schemaVersion: 'canonical-sam3_1-gpu-runtime-result-store-v1'
  readonly evidenceClass:
    'gcs_generation_create_only_sam3_1_runtime_result_store'
  persistResultAdmissionCreateOnly(
    record: CanonicalSam31GpuRuntimeResultAdmission,
  ): Promise<'created' | 'already_exists'>
  rereadResultAdmission(invocationId: string): Promise<unknown>
}

export function createCanonicalSam31GpuRuntimeResultStoreFromObjectPort(
  input: {
    readonly objectPort: CanonicalCreateOnlyJsonObjectPort
    readonly prefix?: string
  },
): CanonicalSam31GpuRuntimeResultStore {
  if (!input.objectPort
    || typeof input.objectPort.createOnly !== 'function'
    || typeof input.objectPort.readExact !== 'function') {
    throw new Error('SAM 3.1 runtime result object store is unavailable.')
  }
  const prefix = normalizePrefix(input.prefix ?? DEFAULT_PREFIX)
  const store: CanonicalSam31GpuRuntimeResultStore = {
    schemaVersion: 'canonical-sam3_1-gpu-runtime-result-store-v1',
    evidenceClass:
      'gcs_generation_create_only_sam3_1_runtime_result_store',
    async persistResultAdmissionCreateOnly(record) {
      const result = assertCanonicalSam31GpuRuntimeResultAdmission(record)
      const body = Buffer.from(stableAuthorityStringify(result), 'utf8')
      if (body.byteLength > MAXIMUM_RESULT_BYTES) {
        throw new Error('SAM 3.1 runtime result exceeded its byte bound.')
      }
      return input.objectPort.createOnly({
        objectPath: resultObjectPath(
          prefix,
          result.executionEnvelopeRef.id,
        ),
        body,
        contentSha256: rawBytesSha256(body),
      })
    },
    async rereadResultAdmission(invocationId) {
      const body = await input.objectPort.readExact(
        resultObjectPath(prefix, invocationId),
      )
      if (!body) return null
      if (body.byteLength < 2 || body.byteLength > MAXIMUM_RESULT_BYTES) {
        throw new Error('SAM 3.1 runtime result byte length is invalid.')
      }
      try {
        return JSON.parse(body.toString('utf8')) as unknown
      } catch {
        throw new Error('SAM 3.1 runtime result JSON is invalid.')
      }
    },
  }
  return Object.freeze(store)
}

export async function admitCanonicalSam31GpuRuntimeResult(input: {
  readonly invocationId: string
  readonly launch: unknown
  readonly terminal: unknown
  readonly taskStore: CanonicalSam31GpuTaskStore
  readonly privateOutputRereadPort: CanonicalSam31PrivateOutputRereadPort
  readonly resultStore: CanonicalSam31GpuRuntimeResultStore
  readonly resultAdmissionId: string
  readonly admittedAt: string
}): Promise<CanonicalSam31GpuRuntimeResultAdmission> {
  const invocationId = safeId.parse(input.invocationId)
  const launch = assertCanonicalProfessionalGpuJobLaunch(input.launch)
  const terminal = assertCanonicalProfessionalGpuJobTerminal(input.terminal)
  const task = assertCanonicalSam31GpuTaskRecord(
    await input.taskStore.rereadTask(invocationId),
  )
  const response = assertCanonicalSam31GpuRuntimeResponse({
    request: task.runtimeRequest,
    response: await input.taskStore.rereadRuntimeResponse(invocationId),
  })
  assertSuccessfulTerminalLineage({ task, launch, terminal, response })
  const outputEvidence = assertCanonicalSam31PrivateOutputRereadEvidence(
    await input.privateOutputRereadPort.rereadExactPrivateOutput({
      task,
      response,
      launch,
    }),
  )
  assertOutputEvidenceMatches({
    task,
    response,
    outputEvidence,
    terminalObservedAt: terminal.observedAt,
  })
  if (Date.parse(input.admittedAt) < Date.parse(outputEvidence.rereadAt)) {
    throw new Error('SAM 3.1 result was admitted before private reread.')
  }
  const gpu = response.gpuEvidence!
  const runtime = response.runtimeMeasurement!
  const output = response.outputSummary!
  const payload = resultWithoutHashSchema.parse({
    schemaVersion: CANONICAL_SAM3_1_GPU_RUNTIME_RESULT_ADMISSION_VERSION,
    source: 'canonical_server_sam3_1_gpu_runtime_result_owner',
    evidenceClass: 'canonical_private_reread',
    status: 'ready_for_independent_mask_artifact_qa',
    resultAdmissionId: input.resultAdmissionId,
    taskRef: ref(task.taskId, task.taskRecordHash),
    runtimeRequestRef: task.runtimeRequestRef,
    dispatchAdmissionRef: task.dispatchAdmissionRef,
    admissionConsumptionRef: task.admissionConsumptionRef,
    executionEnvelopeRef: task.executionEnvelopeRef,
    runtimeReleaseRef: task.runtimeReleaseRef,
    specializedRuntimeReleaseRef: task.specializedRuntimeReleaseRef,
    launchRef: ref(launch.launchRecordId, launch.launchHash),
    terminalRef: ref(terminal.terminalRecordId, terminal.terminalHash),
    cloudJobExecutionRef: terminal.cloudJobExecutionRef,
    workerUsageEvidenceRef: terminal.workerUsageEvidenceRef,
    currentAccountPriceAuthorityRef:
      terminal.currentAccountPriceAuthorityRef,
    attemptCostReceiptRef: terminal.attemptCostReceiptRef,
    privateOutputRereadEvidenceRef: ref(
      outputEvidence.runtimeResponseObjectRef.id,
      outputEvidence.evidenceHash,
    ),
    runtimeResponseObjectRef: outputEvidence.runtimeResponseObjectRef,
    runtimeResponseBindingSha256: response.responseBindingSha256,
    manifestRef: output.manifestRef,
    maskSequenceArtifactRef: outputEvidence.maskSequenceArtifactRef,
    routeId: launch.routeId,
    accelerator: gpu.requestedAccelerator,
    wallTimeMilliseconds: runtime.wallTimeMilliseconds,
    cudaEventInferenceMilliseconds: runtime.cudaEventInferenceMilliseconds,
    peakCudaAllocatedBytes: runtime.peakCudaAllocatedBytes,
    propagatedFrameCount: output.propagatedFrameCount,
    maskFileCount: outputEvidence.maskFileCount,
    exactTaskResponseLaunchTerminalAndOutputReread: true,
    exactGpuAndApprovedFrameRangeVerified: true,
    actualNvdecCudaBfloat16ExecutionVerified: true,
    terminalWorkerStoppedAndScaleBackToZeroVerified: true,
    accountEffectiveAttemptCostReceiptPersisted: true,
    independentMaskArtifactQaPending: true,
    assetManifestReconciliationPending: true,
    rendererLayerAdmissionPending: true,
    customerCreditsMutated: false,
    qaApproved: false,
    assetManifestMutated: false,
    renderAuthorized: false,
    publicDeliveryAuthorized: false,
    productionAuthorityGranted: false,
    admittedAt: input.admittedAt,
  })
  const result = canonicalSam31GpuRuntimeResultAdmissionSchema.parse({
    ...payload,
    resultAdmissionHash: sha256AuthorityValue(payload),
  })
  if (await input.resultStore.persistResultAdmissionCreateOnly(result)
    !== 'created') {
    throw new Error('SAM 3.1 runtime result admission already exists.')
  }
  const reread = assertCanonicalSam31GpuRuntimeResultAdmission(
    await input.resultStore.rereadResultAdmission(invocationId),
  )
  if (reread.resultAdmissionHash !== result.resultAdmissionHash) {
    throw new Error('SAM 3.1 runtime result exact reread changed.')
  }
  return reread
}

export function assertCanonicalSam31PrivateOutputRereadEvidence(
  value: unknown,
): CanonicalSam31PrivateOutputRereadEvidence {
  assertPlainSerializedData(value, 'sam3_1_private_output_reread_evidence')
  const evidence = canonicalSam31PrivateOutputRereadEvidenceSchema.parse(value)
  const { evidenceHash, ...payload } = evidence
  if (evidenceHash !== sha256AuthorityValue(payload)) {
    throw new Error('SAM 3.1 private output reread evidence hash is invalid.')
  }
  return evidence
}

export function assertCanonicalSam31GpuRuntimeResultAdmission(
  value: unknown,
): CanonicalSam31GpuRuntimeResultAdmission {
  assertPlainSerializedData(value, 'sam3_1_gpu_runtime_result_admission')
  const result = canonicalSam31GpuRuntimeResultAdmissionSchema.parse(value)
  const { resultAdmissionHash, ...payload } = result
  if (resultAdmissionHash !== sha256AuthorityValue(payload)) {
    throw new Error('SAM 3.1 runtime result admission hash is invalid.')
  }
  return result
}

function assertSuccessfulTerminalLineage(input: {
  task: CanonicalSam31GpuTaskRecord
  launch: ReturnType<typeof assertCanonicalProfessionalGpuJobLaunch>
  terminal: ReturnType<typeof assertCanonicalProfessionalGpuJobTerminal>
  response: CanonicalSam31GpuRuntimeResponse
}): void {
  const { task, launch, terminal, response } = input
  if (
    task.invocationId !== task.executionEnvelopeRef.id
    || launch.launchDisposition !== 'job_created'
    || launch.cloudJobExecutionRef === null
    || launch.toolId !== 'sam3_1'
    || launch.operationId !== task.runtimeRequest.operationId
    || launch.routeId !== task.runtimeRequest.dispatch.routeRole
    || launch.accelerator !== task.runtimeRequest.dispatch.accelerator
    || !sameRef(launch.admissionRef, task.dispatchAdmissionRef)
    || !sameRef(launch.admissionConsumptionRef,
      task.admissionConsumptionRef)
    || !sameRef(launch.executionEnvelopeRef, task.executionEnvelopeRef)
    || !sameRef(launch.runtimeReleaseRef, task.runtimeReleaseRef)
    || terminal.terminalOutcome !== 'completed'
    || terminal.providerInferenceOrSubstantiveWorkOutcome !== 'executed'
    || !terminal.cloudJobTerminalStateReread
    || !terminal.workerStoppedVerified
    || terminal.activeGpuInstancesAfterTerminalObservation !== 0
    || !terminal.exactPlatformUsageAndAccountPriceReread
    || !terminal.costReceiptPersistedBeforeSettlement
    || terminal.systemFailureOrUnknownCostChargedToCustomer
    || terminal.unapprovedOverageChargedToCustomer
    || terminal.customerWalletOrLedgerMutated
    || !sameRef(terminal.launchRef,
      ref(launch.launchRecordId, launch.launchHash))
    || !sameRef(terminal.admissionRef, launch.admissionRef)
    || !sameRef(terminal.cloudJobExecutionRef,
      launch.cloudJobExecutionRef)
    || response.status !== 'completed'
  ) throw new Error(
    'SAM 3.1 runtime result lacks exact successful terminal lineage.',
  )
}

function assertOutputEvidenceMatches(input: {
  task: CanonicalSam31GpuTaskRecord
  response: CanonicalSam31GpuRuntimeResponse
  outputEvidence: CanonicalSam31PrivateOutputRereadEvidence
  terminalObservedAt: string
}): void {
  const { task, response, outputEvidence } = input
  const output = response.outputSummary!
  const source = task.runtimeRequest.sourceMedia
  const responseBytesHash = rawBytesSha256(Buffer.from(
    canonicalSam31GpuWireStringify(response),
    'utf8',
  ))
  if (
    !sameRef(outputEvidence.taskRef,
      ref(task.taskId, task.taskRecordHash))
    || outputEvidence.runtimeResponseObjectRef.contentHash !==
      `sha256:${responseBytesHash}`
    || outputEvidence.runtimeResponseBindingSha256 !==
      response.responseBindingSha256
    || !sameRef(outputEvidence.manifestRef, output.manifestRef)
    || outputEvidence.manifestSha256 !== output.manifestSha256
    || outputEvidence.maskFileCount !== output.losslessMaskPngCount
    || outputEvidence.width !== source.width
    || outputEvidence.height !== source.height
    || outputEvidence.firstFrameIndex !==
      source.selectedStartFrameInclusive
    || outputEvidence.lastFrameIndex !==
      source.selectedEndFrameInclusive
    || outputEvidence.propagatedFrameCount !== source.decodedFrameCount
    || stableAuthorityStringify(outputEvidence.distinctObjectIds) !==
      stableAuthorityStringify(output.distinctObjectIds)
    || Date.parse(outputEvidence.rereadAt) <
      Date.parse(input.terminalObservedAt)
  ) throw new Error(
    'SAM 3.1 private output evidence differs from task or response.',
  )
}

function resultObjectPath(prefix: string, invocationId: string): string {
  return `${prefix}/${safeId.parse(invocationId)}/result-admission.json`
}

function normalizePrefix(value: string): string {
  const normalized = value.trim().replace(/^\/+|\/+$/gu, '')
  if (!normalized || normalized.length > 400 || normalized.includes('..')
    || normalized.includes('\\')
    || normalized.split('/').some((part) => !safeId.safeParse(part).success)) {
    throw new Error('SAM 3.1 runtime result store prefix is invalid.')
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
  left: z.infer<typeof evidenceRefSchema> | null,
  right: z.infer<typeof evidenceRefSchema> | null,
): boolean {
  return stableAuthorityStringify(left) === stableAuthorityStringify(right)
}

function rawBytesSha256(value: Buffer): string {
  return createHash('sha256').update(value).digest('hex')
}
