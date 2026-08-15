import { createHash } from 'node:crypto'

import { z } from 'zod'

import type {
  CanonicalCreateOnlyJsonObjectPort,
} from './canonical-gcs-source-analysis-lifecycle-store'
import {
  assertCanonicalProfessionalGpuJobLaunch,
  assertCanonicalProfessionalGpuJobTerminal,
  assertPlainSerializedData,
  type CanonicalProfessionalGpuJobLaunch,
  type CanonicalProfessionalGpuJobTerminal,
} from './canonical-professional-gpu-job-lifecycle-service'
import {
  assertCanonicalSam31PrivateCompleteSourceChunkLaunchResult,
  type CanonicalSam31PrivateCompleteSourceChunkLaunchRepository,
} from './canonical-sam3_1-private-complete-source-chunk-launch-owner'
import {
  assertCanonicalSam31PrivateCompleteSourceExecutionPlan,
  canonicalSam31PrivateCompleteSourceExecutionPlanRef,
  type CanonicalSam31PrivateCompleteSourceExecutionPlanRepository,
} from './canonical-sam3_1-private-complete-source-execution-plan-owner'
import {
  assertCanonicalSam31PrivateCompleteSourceChunkTerminalReread,
  assertCanonicalSam31PrivateCompleteSourceTaskMaterialization,
  type CanonicalSam31PrivateCompleteSourceChunkTerminalReadPort,
  type CanonicalSam31PrivateCompleteSourceChunkTerminalReread,
  type CanonicalSam31PrivateCompleteSourceTaskMaterializationRepository,
} from './canonical-sam3_1-private-complete-source-task-materialization-owner'
import {
  sha256AuthorityValue,
  stableAuthorityStringify,
} from './private-edit-authority-store'
import {
  assertCanonicalSam31GpuRuntimeResultAdmission,
  assertCanonicalSam31PrivateOutputRereadEvidence,
  type CanonicalSam31GpuRuntimeResultAdmission,
  type CanonicalSam31PrivateOutputRereadEvidence,
} from '../workers/masks/canonical-sam3_1-gpu-runtime-result-service'
import {
  assertCanonicalSam31GpuTaskRecord,
  type CanonicalSam31GpuTaskStore,
} from '../workers/masks/canonical-sam3_1-gpu-task-owner-service'

export const CANONICAL_SAM3_1_PRIVATE_COMPLETE_SOURCE_CHUNK_TERMINAL_OWNER_VERSION =
  'canonical-sam3_1-private-complete-source-chunk-terminal-owner-v1' as const

const DEFAULT_PREFIX =
  'private/canonical-professional-gpu/sam3_1/v1/private-complete-source-chunk-terminals'
const MAXIMUM_RECORD_BYTES = 4 * 1024 * 1024
const safeId = z.string().trim().min(1).max(512)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:@/+:-]*$/u)
  .refine((value) => !value.includes('..') && !value.includes('//'))
const safePrefix = z.string().trim().min(1).max(512)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._/-]*$/u)
  .refine((value) => !value.includes('..')
    && !value.includes('//') && !value.endsWith('/'))
const prefixedSha256 = z.string().regex(/^sha256:[a-f0-9]{64}$/u)
const timestamp = z.string().datetime({ offset: true })
const refSchema = z.object({
  id: safeId,
  version: z.number().int().positive().safe(),
  contentHash: prefixedSha256,
}).strict()
type EvidenceRef = z.infer<typeof refSchema>

export interface CanonicalSam31PrivateCompleteSourceChunkResultFinalizationPort {
  readonly schemaVersion:
    'canonical-sam3_1-private-complete-source-chunk-result-finalization-port-v1'
  readonly privateInternalOnly: true
  readonly customerOrPublicDispatchAuthorized: false
  finalize(input: {
    readonly routeId: 'a100_80gb_heavy_primary' | 'l4_heavy_fallback'
    readonly invocationId: string
    readonly launchRecordId: string
    readonly executionPlanRef: EvidenceRef
    readonly chunkOrdinal: number
  }): Promise<CanonicalSam31GpuRuntimeResultAdmission>
}

export interface CanonicalSam31PrivateCompleteSourceChunkResultReadPort {
  readonly schemaVersion:
    'canonical-sam3_1-private-complete-source-chunk-result-read-port-v1'
  readonly privateInternalOnly: true
  readonly customerOrPublicDispatchAuthorized: false
  rereadLaunch(input: {
    readonly launchRef: EvidenceRef
  }): Promise<CanonicalProfessionalGpuJobLaunch>
  rereadTerminal(input: {
    readonly terminalRef: EvidenceRef
  }): Promise<CanonicalProfessionalGpuJobTerminal>
  rereadResultAdmission(input: {
    readonly invocationId: string
    readonly resultAdmissionRef: EvidenceRef
  }): Promise<CanonicalSam31GpuRuntimeResultAdmission>
  rereadPrivateOutputEvidence(input: {
    readonly invocationId: string
    readonly privateOutputRereadEvidenceRef: EvidenceRef
  }): Promise<CanonicalSam31PrivateOutputRereadEvidence>
}

export interface CanonicalSam31PrivateCompleteSourceChunkTerminalRepository
  extends CanonicalSam31PrivateCompleteSourceChunkTerminalReadPort {
  readonly repositoryVersion:
    'canonical-sam3_1-private-complete-source-chunk-terminal-repository-v1'
  persistCreateOnly(input: {
    readonly terminal: CanonicalSam31PrivateCompleteSourceChunkTerminalReread
  }): Promise<'created' | 'identical_replay'>
}

export function createCanonicalSam31PrivateCompleteSourceChunkTerminalOwner(
  input: {
    readonly executionPlanRepository:
      CanonicalSam31PrivateCompleteSourceExecutionPlanRepository
    readonly materializationRepository:
      CanonicalSam31PrivateCompleteSourceTaskMaterializationRepository
    readonly launchRepository:
      CanonicalSam31PrivateCompleteSourceChunkLaunchRepository
    readonly taskStore: Pick<CanonicalSam31GpuTaskStore, 'rereadTask'>
    readonly resultFinalizationPort:
      CanonicalSam31PrivateCompleteSourceChunkResultFinalizationPort
    readonly resultReadPort:
      CanonicalSam31PrivateCompleteSourceChunkResultReadPort
    readonly repository:
      CanonicalSam31PrivateCompleteSourceChunkTerminalRepository
  },
) {
  assertDependencies(input)
  return Object.freeze({
    schemaVersion:
      CANONICAL_SAM3_1_PRIVATE_COMPLETE_SOURCE_CHUNK_TERMINAL_OWNER_VERSION,
    privateInternalOnly: true as const,
    customerOrPublicDispatchAuthorized: false as const,
    async finalize(untrusted: unknown): Promise<
      CanonicalSam31PrivateCompleteSourceChunkTerminalReread
    > {
      assertPlainSerializedData(untrusted,
        'sam31_private_complete_source_chunk_terminal_request')
      const request = z.object({
        executionPlanRef: refSchema,
        chunkOrdinal: z.number().int().min(1).max(49),
        finalizedAt: timestamp,
      }).strict().parse(untrusted)
      const plan = assertCanonicalSam31PrivateCompleteSourceExecutionPlan(
        await input.executionPlanRepository.reread({
          executionPlanRef: request.executionPlanRef,
        }),
        request.finalizedAt,
      )
      if (!sameRef(
        canonicalSam31PrivateCompleteSourceExecutionPlanRef(plan),
        request.executionPlanRef,
      )) throw new TypeError('SAM 3.1 terminal plan changed.')
      const chunk = plan.chunks[request.chunkOrdinal - 1]
      if (!chunk || chunk.chunkOrdinal !== request.chunkOrdinal) {
        throw new TypeError('SAM 3.1 terminal chunk is absent.')
      }
      const existing = await input.repository.rereadExactTerminal({
        executionPlanRef: request.executionPlanRef,
        chunkOrdinal: request.chunkOrdinal,
      })
      if (existing) return assertCanonicalSam31PrivateCompleteSourceChunkTerminalReread(
        existing,
      )
      const materialization =
        assertCanonicalSam31PrivateCompleteSourceTaskMaterialization(
          await input.materializationRepository.reread({
            executionPlanId: plan.executionPlanId,
            chunkOrdinal: chunk.chunkOrdinal,
          }),
        )
      const launchResult =
        assertCanonicalSam31PrivateCompleteSourceChunkLaunchResult(
          await input.launchRepository.rereadResult({
            executionPlanId: plan.executionPlanId,
            chunkOrdinal: chunk.chunkOrdinal,
          }),
        )
      if (launchResult.status !== 'private_chunk_gpu_job_created'
        || launchResult.canonicalProfessionalLaunchRef === null
        || launchResult.cloudJobExecutionRef === null) {
        throw new TypeError('SAM 3.1 chunk has no completed launch to finalize.')
      }
      const task = assertCanonicalSam31GpuTaskRecord(
        await input.taskStore.rereadTask(chunk.privateInvocationId),
      )
      const finalized = assertCanonicalSam31GpuRuntimeResultAdmission(
        await input.resultFinalizationPort.finalize({
          routeId: plan.routeId,
          invocationId: chunk.privateInvocationId,
          launchRecordId: launchResult.canonicalProfessionalLaunchRef.id,
          executionPlanRef: request.executionPlanRef,
          chunkOrdinal: chunk.chunkOrdinal,
        }),
      )
      const resultAdmissionRef = ref(
        finalized.resultAdmissionId,
        finalized.resultAdmissionHash,
      )
      const [launchValue, terminalValue, resultValue, outputValue] =
        await Promise.all([
          input.resultReadPort.rereadLaunch({
            launchRef: launchResult.canonicalProfessionalLaunchRef,
          }),
          input.resultReadPort.rereadTerminal({
            terminalRef: finalized.terminalRef,
          }),
          input.resultReadPort.rereadResultAdmission({
            invocationId: chunk.privateInvocationId,
            resultAdmissionRef,
          }),
          input.resultReadPort.rereadPrivateOutputEvidence({
            invocationId: chunk.privateInvocationId,
            privateOutputRereadEvidenceRef:
              finalized.privateOutputRereadEvidenceRef,
          }),
        ])
      const launch = assertCanonicalProfessionalGpuJobLaunch(launchValue)
      const terminal = assertCanonicalProfessionalGpuJobTerminal(terminalValue)
      const result = assertCanonicalSam31GpuRuntimeResultAdmission(resultValue)
      const output = assertCanonicalSam31PrivateOutputRereadEvidence(outputValue)
      assertExactLineage({
        request,
        plan,
        chunk,
        materialization,
        launchResult,
        task,
        finalized,
        result,
        launch,
        terminal,
        output,
      })
      const payload = {
        schemaVersion:
          'canonical-sam3_1-private-complete-source-chunk-terminal-reread-v1' as const,
        source:
          'canonical_server_sam3_1_private_complete_source_chunk_terminal_owner' as const,
        evidenceClass:
          'canonical_private_exact_task_response_output_cost_and_scale_zero_reread' as const,
        executionPlanRef: request.executionPlanRef,
        routeId: plan.routeId,
        chunkOrdinal: chunk.chunkOrdinal,
        taskRecordRef: materialization.taskRecordRef,
        runtimeResponseRef: result.runtimeResponseObjectRef,
        privateOutputRereadEvidenceRef:
          result.privateOutputRereadEvidenceRef,
        accountEffectiveAttemptCostReceiptRef:
          result.attemptCostReceiptRef,
        scaleBackToZeroObservationRef:
          terminal.cloudCapacityTeardownObservationRef,
        providerOutcome: 'executed' as const,
        runtimeStatus: 'completed' as const,
        exactTaskResponseOutputAndAccountCostReread: true as const,
        activeGpuExecutionsAfterTerminal: 0 as const,
        minimumIdleGpuInstancesAfterTerminal: 0 as const,
        scaleBackToZeroVerified: true as const,
        nextChunkTaskMaterializationAllowed: true as const,
        automaticRetryOrFallbackStarted: false as const,
        customerCreditsMutated: false as const,
        qaApproved: false as const,
        publicDeliveryAuthorized: false as const,
        productionAuthorityGranted: false as const,
        completedAt: terminal.observedAt,
      }
      const record =
        assertCanonicalSam31PrivateCompleteSourceChunkTerminalReread({
          ...payload,
          terminalHash: sha256AuthorityValue(payload),
        })
      await input.repository.persistCreateOnly({ terminal: record })
      const reread = await input.repository.rereadExactTerminal({
        executionPlanRef: request.executionPlanRef,
        chunkOrdinal: request.chunkOrdinal,
      })
      const exact = assertCanonicalSam31PrivateCompleteSourceChunkTerminalReread(
        reread,
      )
      if (exact.terminalHash !== record.terminalHash) {
        throw new TypeError('SAM 3.1 chunk terminal changed after persistence.')
      }
      return exact
    },
  })
}

export function createCanonicalSam31PrivateCompleteSourceChunkTerminalRepository(
  input: {
    readonly objectPort: CanonicalCreateOnlyJsonObjectPort
    readonly prefix?: string
  },
): CanonicalSam31PrivateCompleteSourceChunkTerminalRepository {
  if (typeof input.objectPort?.createOnly !== 'function'
    || typeof input.objectPort?.readExact !== 'function') {
    throw new TypeError('SAM 3.1 chunk terminal store is absent.')
  }
  const prefix = safePrefix.parse(input.prefix ?? DEFAULT_PREFIX)
  const repository: CanonicalSam31PrivateCompleteSourceChunkTerminalRepository = {
    schemaVersion:
      'canonical-sam3_1-private-complete-source-chunk-terminal-read-port-v1',
    repositoryVersion:
      'canonical-sam3_1-private-complete-source-chunk-terminal-repository-v1',
    privateInternalOnly: true,
    customerOrPublicDispatchAuthorized: false,
    async persistCreateOnly({ terminal: untrusted }) {
      const terminal =
        assertCanonicalSam31PrivateCompleteSourceChunkTerminalReread(untrusted)
      const body = Buffer.from(stableAuthorityStringify(terminal), 'utf8')
      const objectPath = recordPath(prefix, terminal.executionPlanRef.id,
        terminal.chunkOrdinal)
      const disposition = await input.objectPort.createOnly({
        objectPath,
        body,
        contentSha256: createHash('sha256').update(body).digest('hex'),
      })
      const reread = await readTerminal({
        objectPort: input.objectPort,
        objectPath,
      })
      if (!reread || reread.terminalHash !== terminal.terminalHash) {
        throw new TypeError('SAM 3.1 chunk terminal reread changed.')
      }
      return disposition === 'created'
        ? 'created' as const : 'identical_replay' as const
    },
    rereadExactTerminal({ executionPlanRef, chunkOrdinal }) {
      return readTerminal({
        objectPort: input.objectPort,
        objectPath: recordPath(prefix, executionPlanRef.id, chunkOrdinal),
      })
    },
  }
  return Object.freeze(repository)
}

function assertExactLineage(input: {
  request: { executionPlanRef: EvidenceRef; chunkOrdinal: number;
    finalizedAt: string }
  plan: ReturnType<
    typeof assertCanonicalSam31PrivateCompleteSourceExecutionPlan
  >
  chunk: ReturnType<
    typeof assertCanonicalSam31PrivateCompleteSourceExecutionPlan
  >['chunks'][number]
  materialization: ReturnType<
    typeof assertCanonicalSam31PrivateCompleteSourceTaskMaterialization
  >
  launchResult: ReturnType<
    typeof assertCanonicalSam31PrivateCompleteSourceChunkLaunchResult
  >
  task: ReturnType<typeof assertCanonicalSam31GpuTaskRecord>
  finalized: ReturnType<typeof assertCanonicalSam31GpuRuntimeResultAdmission>
  result: ReturnType<typeof assertCanonicalSam31GpuRuntimeResultAdmission>
  launch: ReturnType<typeof assertCanonicalProfessionalGpuJobLaunch>
  terminal: ReturnType<typeof assertCanonicalProfessionalGpuJobTerminal>
  output: ReturnType<typeof assertCanonicalSam31PrivateOutputRereadEvidence>
}): void {
  const frameCount = input.chunk.canonicalEndFrameInclusive
    - input.chunk.canonicalStartFrameInclusive + 1
  const exact = sameRef(input.materialization.executionPlanRef,
    input.request.executionPlanRef)
    && input.materialization.chunkOrdinal === input.chunk.chunkOrdinal
    && sameRef(input.materialization.taskRecordRef,
      ref(input.task.taskId, input.task.taskRecordHash))
    && input.task.invocationId === input.chunk.privateInvocationId
    && sameRef(input.launchResult.taskRecordRef,
      input.materialization.taskRecordRef)
    && sameRef(input.launchResult.executionEnvelopeRef,
      input.task.executionEnvelopeRef)
    && input.launchResult.canonicalProfessionalLaunchRef !== null
    && sameRef(input.launchResult.canonicalProfessionalLaunchRef,
      ref(input.launch.launchRecordId, input.launch.launchHash))
    && input.launch.routeId === input.plan.routeId
    && input.launch.launchDisposition === 'job_created'
    && sameRef(input.launch.executionEnvelopeRef,
      input.task.executionEnvelopeRef)
    && sameRef(input.result.taskRef,
      ref(input.task.taskId, input.task.taskRecordHash))
    && input.result.resultAdmissionHash ===
      input.finalized.resultAdmissionHash
    && input.result.routeId === input.plan.routeId
    && input.result.status === 'ready_for_independent_mask_artifact_qa'
    && sameRef(input.result.launchRef,
      ref(input.launch.launchRecordId, input.launch.launchHash))
    && sameRef(input.result.terminalRef,
      ref(input.terminal.terminalRecordId, input.terminal.terminalHash))
    && input.terminal.terminalOutcome === 'completed'
    && input.terminal.providerInferenceOrSubstantiveWorkOutcome === 'executed'
    && input.terminal.cloudJobTerminalStateReread
    && input.terminal.workerStoppedVerified
    && input.terminal.activeGpuInstancesAfterTerminalObservation === 0
    && input.terminal.minimumIdleInstances === 0
    && input.result.terminalWorkerStoppedAndScaleBackToZeroVerified
    && input.result.accountEffectiveAttemptCostReceiptPersisted
    && sameRef(input.result.attemptCostReceiptRef,
      input.terminal.attemptCostReceiptRef)
    && sameRef(input.output.taskRef, input.result.taskRef)
    && sameRef(input.result.privateOutputRereadEvidenceRef, ref(
      `sam31-private-output-reread:${input.output.runtimeResponseObjectRef.id}`,
      input.output.evidenceHash,
    ))
    && sameRef(input.output.runtimeResponseObjectRef,
      input.result.runtimeResponseObjectRef)
    && sameRef(input.output.manifestRef, input.result.manifestRef)
    && sameRef(input.output.maskSequenceArtifactRef,
      input.result.maskSequenceArtifactRef)
    && input.output.propagatedFrameCount === frameCount
    && input.result.propagatedFrameCount === frameCount
    && Date.parse(input.terminal.observedAt) <=
      Date.parse(input.request.finalizedAt)
  if (!exact) throw new TypeError(
    'SAM 3.1 chunk terminal lineage or complete output changed.',
  )
}

function assertDependencies(input: {
  executionPlanRepository:
    CanonicalSam31PrivateCompleteSourceExecutionPlanRepository
  materializationRepository:
    CanonicalSam31PrivateCompleteSourceTaskMaterializationRepository
  launchRepository: CanonicalSam31PrivateCompleteSourceChunkLaunchRepository
  taskStore: Pick<CanonicalSam31GpuTaskStore, 'rereadTask'>
  resultFinalizationPort:
    CanonicalSam31PrivateCompleteSourceChunkResultFinalizationPort
  resultReadPort: CanonicalSam31PrivateCompleteSourceChunkResultReadPort
  repository: CanonicalSam31PrivateCompleteSourceChunkTerminalRepository
}): void {
  if (typeof input.executionPlanRepository?.reread !== 'function'
    || typeof input.materializationRepository?.reread !== 'function'
    || typeof input.launchRepository?.rereadResult !== 'function'
    || typeof input.taskStore?.rereadTask !== 'function'
    || input.resultFinalizationPort?.schemaVersion !==
      'canonical-sam3_1-private-complete-source-chunk-result-finalization-port-v1'
    || !input.resultFinalizationPort.privateInternalOnly
    || input.resultFinalizationPort.customerOrPublicDispatchAuthorized
    || typeof input.resultFinalizationPort.finalize !== 'function'
    || input.resultReadPort?.schemaVersion !==
      'canonical-sam3_1-private-complete-source-chunk-result-read-port-v1'
    || !input.resultReadPort.privateInternalOnly
    || input.resultReadPort.customerOrPublicDispatchAuthorized
    || typeof input.resultReadPort.rereadLaunch !== 'function'
    || typeof input.resultReadPort.rereadTerminal !== 'function'
    || typeof input.resultReadPort.rereadResultAdmission !== 'function'
    || typeof input.resultReadPort.rereadPrivateOutputEvidence !== 'function'
    || typeof input.repository?.persistCreateOnly !== 'function'
    || typeof input.repository.rereadExactTerminal !== 'function') {
    throw new TypeError('SAM 3.1 chunk terminal owner is incomplete.')
  }
}

async function readTerminal(input: {
  objectPort: CanonicalCreateOnlyJsonObjectPort
  objectPath: string
}): Promise<CanonicalSam31PrivateCompleteSourceChunkTerminalReread | null> {
  const body = await input.objectPort.readExact(input.objectPath)
  if (!body) return null
  if (!Buffer.isBuffer(body) || body.byteLength < 2
    || body.byteLength > MAXIMUM_RECORD_BYTES) {
    throw new TypeError('SAM 3.1 chunk terminal bytes changed.')
  }
  const record = assertCanonicalSam31PrivateCompleteSourceChunkTerminalReread(
    JSON.parse(body.toString('utf8')) as unknown,
  )
  if (stableAuthorityStringify(record) !== body.toString('utf8')) {
    throw new TypeError('SAM 3.1 chunk terminal canonical bytes changed.')
  }
  return record
}

function recordPath(
  prefix: string,
  executionPlanId: string,
  chunkOrdinal: number,
): string {
  return `${prefix}/${safeId.parse(executionPlanId)}/chunk-${String(
    z.number().int().min(1).max(49).parse(chunkOrdinal),
  ).padStart(3, '0')}/terminal.json`
}

function ref(id: string, hash: string, version = 1): EvidenceRef {
  return refSchema.parse({ id, version, contentHash: `sha256:${hash}` })
}

function sameRef(left: EvidenceRef, right: EvidenceRef): boolean {
  return left.id === right.id && left.version === right.version
    && left.contentHash === right.contentHash
}
