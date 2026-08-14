import { z } from 'zod'

import {
  assertCanonicalProfessionalGpuJobLaunch,
  assertCanonicalProfessionalGpuJobTerminal,
  assertPlainSerializedData,
  recordCanonicalProfessionalGpuJobTerminal,
  type CanonicalProfessionalGpuTerminalObservationPort,
} from './canonical-professional-gpu-job-lifecycle-service'
import type {
  CanonicalProfessionalGpuDurableLifecycleStore,
} from './canonical-professional-gpu-durable-lifecycle-store'
import {
  admitCanonicalSam31GpuRuntimeResult,
  assertCanonicalSam31GpuRuntimeResultAdmission,
  assertCanonicalSam31PrivateOutputRereadEvidence,
  type CanonicalSam31GpuRuntimeResultStore,
  type CanonicalSam31PrivateOutputRereadPort,
} from '../workers/masks/canonical-sam3_1-gpu-runtime-result-service'
import {
  assertCanonicalSam31GpuRuntimeResponse,
} from '../workers/masks/canonical-sam3_1-gpu-runtime-contract'
import {
  assertCanonicalSam31GpuTaskRecord,
  type CanonicalSam31GpuTaskStore,
} from '../workers/masks/canonical-sam3_1-gpu-task-owner-service'

export const CANONICAL_SAM3_1_L4_RESULT_FINALIZATION_VERSION =
  'canonical-sam3_1-l4-result-finalization-v1' as const

const safeId = z.string().trim().min(1).max(180)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/u)
  .refine((value) => !value.includes('..'))
const timestamp = z.string().datetime({ offset: true })
const finalizationRequestSchema = z.object({
  invocationId: safeId,
  launchRecordId: safeId,
}).strict()

export interface CanonicalSam31L4ResultFinalizationRuntimePort {
  readonly schemaVersion:
    typeof CANONICAL_SAM3_1_L4_RESULT_FINALIZATION_VERSION
  readonly evidenceClass:
    'canonical_terminal_private_output_and_result_reread'
  finalize(input: {
    readonly invocationId: string
    readonly launchRecordId: string
  }): Promise<ReturnType<typeof assertCanonicalSam31GpuRuntimeResultAdmission>>
}

/**
 * Restart-safe L4 terminal-to-result owner for the independently qualified
 * heavy fallback. It reuses the exact provider-neutral terminal, output, and
 * result contracts used by A100 and cannot launch, retry, approve QA, mutate
 * assets, settle credits, or authorize public work.
 */
export function createCanonicalSam31L4ResultFinalizationRuntime(input: {
  readonly lifecycleStore: CanonicalProfessionalGpuDurableLifecycleStore
  readonly terminalObservationPort:
    CanonicalProfessionalGpuTerminalObservationPort
  readonly taskStore: CanonicalSam31GpuTaskStore
  readonly privateOutputRereadPort: CanonicalSam31PrivateOutputRereadPort
  readonly resultStore: CanonicalSam31GpuRuntimeResultStore
  readonly now?: () => string
}): CanonicalSam31L4ResultFinalizationRuntimePort {
  assertPorts(input)
  const now = input.now ?? (() => new Date().toISOString())
  return Object.freeze({
    schemaVersion: CANONICAL_SAM3_1_L4_RESULT_FINALIZATION_VERSION,
    evidenceClass:
      'canonical_terminal_private_output_and_result_reread' as const,
    async finalize(untrusted: Parameters<
      CanonicalSam31L4ResultFinalizationRuntimePort['finalize']
    >[0]) {
      assertPlainSerializedData(
        untrusted,
        'sam3_1_l4_result_finalization_request',
      )
      const { invocationId, launchRecordId } =
        finalizationRequestSchema.parse(untrusted)
      const launch = assertCanonicalProfessionalGpuJobLaunch(
        await input.lifecycleStore.rereadLaunchRecord({ launchRecordId }),
      )
      if (launch.executionEnvelopeRef.id !== invocationId
        || launch.routeId !== 'l4_heavy_fallback'
        || launch.executionTarget !== 'google_cloud_run_l4_job'
        || launch.accelerator !== 'nvidia_l4') {
        throw new Error('SAM 3.1 L4 finalization launch scope differs.')
      }
      const terminalRecordId = boundedId(
        `sam31-l4-terminal:${invocationId}`,
      )
      const existingTerminal = await input.lifecycleStore
        .rereadTerminalRecord({ terminalRecordId })
      const terminal = existingTerminal === null
        ? await recordCanonicalProfessionalGpuJobTerminal({
          terminalRecordId,
          launch,
          terminalObservationPort: input.terminalObservationPort,
          store: input.lifecycleStore,
        })
        : assertCanonicalProfessionalGpuJobTerminal(existingTerminal)
      if (terminal.launchRef.id !== launch.launchRecordId
        || terminal.launchRef.contentHash !== `sha256:${launch.launchHash}`
        || terminal.terminalOutcome !== 'completed'
        || terminal.providerInferenceOrSubstantiveWorkOutcome !== 'executed') {
        throw new Error('SAM 3.1 L4 attempt did not complete successfully.')
      }

      const existingResult = await input.resultStore
        .rereadResultAdmission(invocationId)
      if (existingResult !== null) {
        const result = assertCanonicalSam31GpuRuntimeResultAdmission(
          existingResult,
        )
        if (result.routeId !== 'l4_heavy_fallback'
          || result.accelerator !== 'nvidia_l4'
          || result.launchRef.id !== launch.launchRecordId
          || result.terminalRef.id !== terminal.terminalRecordId) {
          throw new Error('SAM 3.1 existing L4 result lineage differs.')
        }
        const outputValue =
          await input.resultStore.rereadPrivateOutputRereadEvidence(
            invocationId,
            result.privateOutputRereadEvidenceRef,
          )
        if (!outputValue) throw new Error(
          'SAM 3.1 existing L4 private output evidence is missing.',
        )
        const output = assertCanonicalSam31PrivateOutputRereadEvidence(
          outputValue,
        )
        if (result.privateOutputRereadEvidenceRef.contentHash !==
          `sha256:${output.evidenceHash}`
          || result.runtimeResponseObjectRef.contentHash !==
            output.runtimeResponseObjectRef.contentHash) {
          throw new Error('SAM 3.1 existing L4 private output differs.')
        }
        return result
      }

      const task = assertCanonicalSam31GpuTaskRecord(
        await input.taskStore.rereadTask(invocationId),
      )
      const response = assertCanonicalSam31GpuRuntimeResponse({
        request: task.runtimeRequest,
        response: await input.taskStore.rereadRuntimeResponse(invocationId),
      })
      const privateOutput =
        await input.privateOutputRereadPort.rereadExactPrivateOutput({
          task,
          response,
          launch,
        })
      return admitCanonicalSam31GpuRuntimeResult({
        invocationId,
        launch,
        terminal,
        taskStore: input.taskStore,
        privateOutputRereadPort: Object.freeze({
          async rereadExactPrivateOutput() {
            return structuredClone(privateOutput)
          },
        }),
        resultStore: input.resultStore,
        resultAdmissionId: boundedId(`sam31-l4-result:${invocationId}`),
        admittedAt: timestamp.parse(now()),
      })
    },
  })
}

function assertPorts(input: {
  lifecycleStore: CanonicalProfessionalGpuDurableLifecycleStore
  terminalObservationPort: CanonicalProfessionalGpuTerminalObservationPort
  taskStore: CanonicalSam31GpuTaskStore
  privateOutputRereadPort: CanonicalSam31PrivateOutputRereadPort
  resultStore: CanonicalSam31GpuRuntimeResultStore
}): void {
  if (typeof input.lifecycleStore?.rereadLaunchRecord !== 'function'
    || typeof input.lifecycleStore?.rereadTerminalRecord !== 'function'
    || typeof input.lifecycleStore?.createTerminalRecordOnly !== 'function'
    || typeof input.terminalObservationPort
      ?.rereadTerminalUsagePriceAndCost !== 'function'
    || typeof input.taskStore?.rereadTask !== 'function'
    || typeof input.taskStore?.rereadRuntimeResponse !== 'function'
    || typeof input.privateOutputRereadPort
      ?.rereadExactPrivateOutput !== 'function'
    || typeof input.resultStore
      ?.persistPrivateOutputRereadEvidenceCreateOnly !== 'function'
    || typeof input.resultStore
      ?.rereadPrivateOutputRereadEvidence !== 'function'
    || typeof input.resultStore
      ?.rereadPrivateOutputRereadEvidenceForInvocation !== 'function'
    || typeof input.resultStore?.rereadResultAdmission !== 'function'
    || typeof input.resultStore?.persistResultAdmissionCreateOnly !==
      'function') {
    throw new Error('SAM 3.1 L4 result finalization ports are incomplete.')
  }
}

function boundedId(value: string): string {
  return safeId.parse(value.length <= 180 ? value : value.slice(0, 180))
}
