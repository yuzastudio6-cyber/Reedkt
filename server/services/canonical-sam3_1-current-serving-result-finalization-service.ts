import { z } from 'zod'

import {
  assertPlainSerializedData,
} from './canonical-professional-gpu-job-lifecycle-service'
import {
  canonicalSam31CompleteSourceChunkPlanRef,
  canonicalSam31CompleteSourceChunkReceiptRef,
  parseCanonicalSam31CompleteSourceChunkPlan,
  parseCanonicalSam31CompleteSourceChunkReceipt,
  type CanonicalSam31CompleteSourceChunkRepository,
} from './canonical-sam3_1-complete-source-chunk-coordinator'
import {
  assertCanonicalSam31VertexServingTerminalAttemptRecord,
  type CanonicalSam31VertexServingTerminalAttemptOwner,
} from './canonical-sam3_1-vertex-serving-terminal-attempt-owner'
import {
  buildTrackAllSam31AuthenticatedGpuInvocationRequest,
  parseTrackAllSam31AuthenticatedGpuInvocationResult,
  type CanonicalTrackAllSam31AuthenticatedGpuInvocationResultReadPort,
} from './canonical-track-all-sam3_1-authenticated-gpu-start-service'
import {
  assertCanonicalSam31GpuRuntimeResponse,
} from '../workers/masks/canonical-sam3_1-gpu-runtime-contract'
import {
  assertCanonicalSam31AnyRuntimeResultAdmission,
  assertCanonicalSam31CurrentServingResultAdmission,
  assertCanonicalSam31PrivateOutputRereadEvidence,
  buildCanonicalSam31CurrentServingResultAdmission,
  type CanonicalSam31CurrentServingResultAdmission,
  type CanonicalSam31GpuRuntimeResultStore,
} from '../workers/masks/canonical-sam3_1-gpu-runtime-result-service'
import {
  assertCanonicalSam31GpuTaskRecord,
  type CanonicalSam31GpuTaskStore,
} from '../workers/masks/canonical-sam3_1-gpu-task-owner-service'

export const CANONICAL_SAM3_1_CURRENT_SERVING_RESULT_FINALIZATION_VERSION =
  'canonical-sam3_1-current-serving-result-finalization-v1' as const

const safeId = z.string().trim().min(1).max(240)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/u)
  .refine((value) => !value.includes('..'))
const refSchema = z.object({
  id: safeId,
  version: z.number().int().positive().safe(),
  contentHash: z.string().regex(/^sha256:[a-f0-9]{64}$/u),
}).strict()
const timestamp = z.string().datetime({ offset: true })

export interface CanonicalSam31CurrentServingResultFinalizationRuntimePort {
  readonly schemaVersion:
    typeof CANONICAL_SAM3_1_CURRENT_SERVING_RESULT_FINALIZATION_VERSION
  readonly currentServingAdmissionIsNotHistoricalCloudJobAdmission: true
  readonly servingWindowCostAndCreditSettlementRequiredLater: true
  readonly directGpuInvocationAllowed: false
  readonly automaticRetryAllowed: false
  readonly customerCreditsMutated: false
  readonly productionAuthority: false
  finalize(input: {
    readonly authenticatedOwnerUserId: string
    readonly workspaceId: string
    readonly executionGroupRef: z.infer<typeof refSchema>
    readonly chunkOrdinal: number
  }): Promise<CanonicalSam31CurrentServingResultAdmission>
}

export function createCanonicalSam31CurrentServingResultFinalizationRuntime(
  input: {
    readonly chunkRepository: CanonicalSam31CompleteSourceChunkRepository
    readonly invocationResultReadPort:
      CanonicalTrackAllSam31AuthenticatedGpuInvocationResultReadPort
    readonly terminalAttemptOwner: Pick<
      CanonicalSam31VertexServingTerminalAttemptOwner,
      'rereadTerminalAttempt'
    >
    readonly taskStore: Pick<
      CanonicalSam31GpuTaskStore, 'rereadTask' | 'rereadRuntimeResponse'
    >
    readonly resultStore: Pick<
      CanonicalSam31GpuRuntimeResultStore,
      'rereadPrivateOutputRereadEvidenceForInvocation'
        | 'persistResultAdmissionCreateOnly' | 'rereadResultAdmission'
    >
    readonly now?: () => string
  },
): CanonicalSam31CurrentServingResultFinalizationRuntimePort {
  const now = input.now ?? (() => new Date().toISOString())
  return Object.freeze({
    schemaVersion:
      CANONICAL_SAM3_1_CURRENT_SERVING_RESULT_FINALIZATION_VERSION,
    currentServingAdmissionIsNotHistoricalCloudJobAdmission: true as const,
    servingWindowCostAndCreditSettlementRequiredLater: true as const,
    directGpuInvocationAllowed: false as const,
    automaticRetryAllowed: false as const,
    customerCreditsMutated: false as const,
    productionAuthority: false as const,
    async finalize(untrusted: Parameters<
      CanonicalSam31CurrentServingResultFinalizationRuntimePort['finalize']
    >[0]) {
      assertPlainSerializedData(untrusted,
        'sam31_current_serving_result_finalization')
      const request = z.object({
        authenticatedOwnerUserId: safeId,
        workspaceId: safeId,
        executionGroupRef: refSchema,
        chunkOrdinal: z.number().int().min(1).max(256),
      }).strict().parse(untrusted)
      const plan = parseCanonicalSam31CompleteSourceChunkPlan(
        await input.chunkRepository.rereadPlan({
          executionGroupRef: request.executionGroupRef,
        }),
      )
      if (plan.ownerUserId !== request.authenticatedOwnerUserId
        || plan.workspaceId !== request.workspaceId
        || request.chunkOrdinal > plan.exactChunkCount) {
        throw new TypeError('Current SAM 3.1 result scope changed.')
      }
      const chunk = plan.chunks[request.chunkOrdinal - 1]!
      const receipt = parseCanonicalSam31CompleteSourceChunkReceipt(
        await input.chunkRepository.rereadChunkReceipt({
          executionGroupId: plan.executionGroupId,
          chunkOrdinal: request.chunkOrdinal,
        }),
      )
      const invocationRequest =
        buildTrackAllSam31AuthenticatedGpuInvocationRequest({
          requestId: chunk.requestId,
          approvedSnapshotId: plan.approvedSnapshotRef.id,
          workItemKey: chunk.workItemKey,
        })
      const rawInvocation = await input.invocationResultReadPort
        .rereadApprovedTrackAllWorkResult({
          authenticatedOwnerUserId: plan.ownerUserId,
          workspaceId: plan.workspaceId,
          idempotencyKey: chunk.requestId,
          request: invocationRequest,
        })
      const invocation =
        parseTrackAllSam31AuthenticatedGpuInvocationResult(rawInvocation)
      if (invocation.invocationDisposition !== 'completed'
        || invocation.providerOutcome !== 'executed'
        || invocation.runtimeStatus !== 'completed'
        || invocation.runtimeResponseRef === null) {
        throw new TypeError(
          'Current SAM 3.1 result is not a completed endpoint outcome.',
        )
      }
      const invocationId = invocation.endpointInvocationResultRef.id
      const task = assertCanonicalSam31GpuTaskRecord(
        await input.taskStore.rereadTask(invocationId),
      )
      const response = assertCanonicalSam31GpuRuntimeResponse({
        request: task.runtimeRequest,
        response: await input.taskStore.rereadRuntimeResponse(invocationId),
      })
      const output = assertCanonicalSam31PrivateOutputRereadEvidence(
        await input.resultStore
          .rereadPrivateOutputRereadEvidenceForInvocation(invocationId),
      )
      const rawTerminalAttempt = await input.terminalAttemptOwner
        .rereadTerminalAttempt({
          executionAttemptRef: invocation.executionAttemptRef,
        })
      if (!rawTerminalAttempt) throw new TypeError(
        'Current SAM 3.1 terminal usage attempt is not available.',
      )
      const terminalAttempt =
        assertCanonicalSam31VertexServingTerminalAttemptRecord(
          rawTerminalAttempt,
        )
      assertExactLineage({
        plan,
        chunk,
        receipt,
        invocation,
        task,
        response,
        output,
        terminalAttempt,
      })
      const admittedAt = timestamp.parse(now())
      if (Date.parse(admittedAt) < Date.parse(receipt.completedAt)
        || Date.parse(admittedAt) < Date.parse(terminalAttempt.recordedAt)
        || Date.parse(admittedAt) < Date.parse(output.rereadAt)) {
        throw new TypeError('Current SAM 3.1 result admission time changed.')
      }
      const gpu = response.gpuEvidence!
      const measurement = response.runtimeMeasurement!
      if (gpu.nvdecHardwareDecodeMeasured !== true
        || gpu.decodedFramesResidentOnCuda !== true
        || gpu.cudaKernelExecutionMeasured !== true
        || gpu.bfloat16AutocastUsed !== true
        || gpu.cpuOnlyInferenceUsed !== false) {
        throw new TypeError(
          'Current SAM 3.1 result lacks exact NVDEC/CUDA/bfloat16 evidence.',
        )
      }
      const result = buildCanonicalSam31CurrentServingResultAdmission({
        schemaVersion: 'canonical-sam3_1-current-serving-result-admission-v2',
        source: 'canonical_server_sam3_1_current_serving_result_owner',
        evidenceClass: 'canonical_private_exact_response_reread',
        status: 'ready_for_independent_mask_artifact_qa',
        resultAdmissionId: `sam31-serving-result:${receipt.receiptHash}`,
        taskRef: ref(task.taskId, task.taskRecordHash),
        runtimeRequestRef: task.runtimeRequestRef,
        dispatchAdmissionRef: task.dispatchAdmissionRef,
        admissionConsumptionRef: task.admissionConsumptionRef,
        executionEnvelopeRef: task.executionEnvelopeRef,
        runtimeReleaseRef: task.runtimeReleaseRef,
        specializedRuntimeReleaseRef: task.specializedRuntimeReleaseRef,
        endpointInvocationResultRef: invocation.endpointInvocationResultRef,
        executionAttemptRef: invocation.executionAttemptRef,
        terminalServingAttemptRef: ref(
          `sam31-serving-terminal:${terminalAttempt.recordHash}`,
          terminalAttempt.recordHash,
        ),
        completeSourceChunkPlanRef:
          canonicalSam31CompleteSourceChunkPlanRef(plan),
        completeSourceChunkReceiptRef:
          canonicalSam31CompleteSourceChunkReceiptRef(receipt),
        previousChunkReceiptRef: receipt.previousChunkReceiptRef,
        privateOutputRereadEvidenceRef: ref(
          `sam31-private-output:${output.evidenceHash}`,
          output.evidenceHash,
        ),
        runtimeResponseObjectRef: output.runtimeResponseObjectRef,
        runtimeResponseBindingSha256: response.responseBindingSha256,
        manifestRef: output.manifestRef,
        maskSequenceArtifactRef: output.maskSequenceArtifactRef,
        routeId: 'a100_80gb_heavy_primary',
        accelerator: 'nvidia_a100_80gb',
        chunkOrdinal: chunk.chunkOrdinal,
        canonicalStartFrameInclusive: chunk.canonicalStartFrameInclusive,
        canonicalEndFrameInclusive: chunk.canonicalEndFrameInclusive,
        wallTimeMilliseconds: measurement.wallTimeMilliseconds,
        cudaEventInferenceMilliseconds:
          measurement.cudaEventInferenceMilliseconds,
        peakCudaAllocatedBytes: measurement.peakCudaAllocatedBytes,
        propagatedFrameCount: output.propagatedFrameCount,
        maskFileCount: output.maskFileCount,
        exactTaskResponseEndpointTerminalChunkAndOutputReread: true,
        exactGpuAndApprovedFrameRangeVerified: true,
        actualNvdecCudaBfloat16ExecutionVerified: true,
        durableQueueConsumerRecordedTerminalAttempt: true,
        accountEffectiveServingRateRereadBeforeInvocation: true,
        servingWindowUsageCostAndCreditSettlementPending: true,
        terminalScaleToZeroClaimedByPerChunkResult: false,
        independentMaskArtifactQaPending: true,
        assetManifestReconciliationPending: true,
        rendererLayerAdmissionPending: true,
        customerCreditsMutated: false,
        qaApproved: false,
        assetManifestMutated: false,
        renderAuthorized: false,
        publicDeliveryAuthorized: false,
        productionAuthorityGranted: false,
        admittedAt,
      })
      const disposition = await input.resultStore
        .persistResultAdmissionCreateOnly(result)
      if (disposition !== 'created' && disposition !== 'already_exists') {
        throw new TypeError('Current SAM 3.1 result was not persisted.')
      }
      const reread = assertCanonicalSam31CurrentServingResultAdmission(
        await input.resultStore.rereadResultAdmission(invocationId),
      )
      if (reread.resultAdmissionHash !== result.resultAdmissionHash
        || assertCanonicalSam31AnyRuntimeResultAdmission(reread)
          .resultAdmissionHash !== result.resultAdmissionHash) {
        throw new TypeError('Current SAM 3.1 result exact reread changed.')
      }
      return Object.freeze(structuredClone(reread))
    },
  })
}

function assertExactLineage(input: {
  plan: ReturnType<typeof parseCanonicalSam31CompleteSourceChunkPlan>
  chunk: ReturnType<typeof parseCanonicalSam31CompleteSourceChunkPlan>[
    'chunks'
  ][number]
  receipt: ReturnType<typeof parseCanonicalSam31CompleteSourceChunkReceipt>
  invocation: ReturnType<
    typeof parseTrackAllSam31AuthenticatedGpuInvocationResult
  >
  task: ReturnType<typeof assertCanonicalSam31GpuTaskRecord>
  response: ReturnType<typeof assertCanonicalSam31GpuRuntimeResponse>
  output: ReturnType<typeof assertCanonicalSam31PrivateOutputRereadEvidence>
  terminalAttempt: NonNullable<Awaited<ReturnType<
    CanonicalSam31VertexServingTerminalAttemptOwner['rereadTerminalAttempt']
  >>>
}): void {
  const source = input.task.runtimeRequest.sourceMedia
  const terminal = input.terminalAttempt
  const exact = sameRef(input.receipt.executionGroupRef,
    canonicalSam31CompleteSourceChunkPlanRef(input.plan))
    && input.receipt.chunkOrdinal === input.chunk.chunkOrdinal
    && sameRef(input.receipt.endpointInvocationResultRef,
      input.invocation.endpointInvocationResultRef)
    && sameRef(input.receipt.executionAttemptRef,
      input.invocation.executionAttemptRef)
    && input.task.invocationId ===
      input.invocation.endpointInvocationResultRef.id
    && sameRef(input.receipt.taskRef,
      ref(input.task.taskId, input.task.taskRecordHash))
    && sameRef(input.receipt.manifestRef, input.output.manifestRef)
    && sameRef(input.receipt.maskSequenceArtifactRef,
      input.output.maskSequenceArtifactRef)
    && input.response.status === 'completed'
    && input.output.runtimeResponseBindingSha256 ===
      input.response.responseBindingSha256
    && source.canonicalSourceStartFrameInclusive ===
      input.chunk.canonicalStartFrameInclusive
    && source.canonicalSourceEndFrameInclusive ===
      input.chunk.canonicalEndFrameInclusive
    && source.decodedFrameCount === input.output.propagatedFrameCount
    && sameRef(terminal.executionAttemptRef,
      input.invocation.executionAttemptRef)
    && sameRef(terminal.endpointInvocationResultRef,
      input.invocation.endpointInvocationResultRef)
    && terminal.invocationId === input.task.invocationId
    && terminal.attempt.terminalOutcome === 'completed'
    && terminal.attempt.providerInferenceOrSubstantiveWorkOutcome ===
      'executed'
    && terminal.servingWindowCostReceiptPending
    && !terminal.customerCreditsMutated
  if (!exact) throw new TypeError(
    'Current SAM 3.1 result finalization crossed canonical lineage.',
  )
}

function sameRef(
  left: z.infer<typeof refSchema>,
  right: z.infer<typeof refSchema>,
): boolean {
  return left.id === right.id && left.version === right.version
    && left.contentHash === right.contentHash
}

function ref(id: string, hash: string) {
  return refSchema.parse({
    id,
    version: 1,
    contentHash: hash.startsWith('sha256:') ? hash : `sha256:${hash}`,
  })
}
