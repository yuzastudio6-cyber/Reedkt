import { z } from 'zod'

import {
  assertCanonicalProfessionalGpuJobLaunch,
  assertCanonicalProfessionalGpuJobTerminal,
  recordCanonicalProfessionalGpuJobTerminal,
  type CanonicalProfessionalGpuTerminalObservationPort,
} from './canonical-professional-gpu-job-lifecycle-service'
import type {
  CanonicalProfessionalGpuDurableLifecycleStore,
} from './canonical-professional-gpu-durable-lifecycle-store'
import {
  admitCanonicalSam31GpuRuntimeResult,
  assertCanonicalSam31PrivateOutputRereadEvidence,
  assertCanonicalSam31GpuRuntimeResultAdmission,
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

export const CANONICAL_SAM3_1_A100_RESULT_FINALIZATION_VERSION =
  'canonical-sam3_1-a100-result-finalization-v1' as const

const safeId = z.string().trim().min(1).max(180)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/u)
  .refine((value) => !value.includes('..'))
const timestamp = z.string().datetime({ offset: true })

export interface CanonicalSam31A100ResultFinalizationRuntimePort {
  readonly schemaVersion:
    typeof CANONICAL_SAM3_1_A100_RESULT_FINALIZATION_VERSION
  readonly evidenceClass:
    'canonical_terminal_private_output_and_result_reread'
  finalize(input: {
    readonly invocationId: string
    readonly launchRecordId: string
  }): Promise<ReturnType<typeof assertCanonicalSam31GpuRuntimeResultAdmission>>
}

/**
 * Restart-safe terminal-to-result owner. It does not launch, retry, settle
 * credits, approve QA, mutate assets, or expose bytes. It only finalizes one
 * already-created A100 attempt after exact provider, cost, response, manifest,
 * and every-mask rereads have all succeeded.
 */
export function createCanonicalSam31A100ResultFinalizationRuntime(input: {
  readonly lifecycleStore: CanonicalProfessionalGpuDurableLifecycleStore
  readonly terminalObservationPort:
    CanonicalProfessionalGpuTerminalObservationPort
  readonly taskStore: CanonicalSam31GpuTaskStore
  readonly privateOutputRereadPort: CanonicalSam31PrivateOutputRereadPort
  readonly resultStore: CanonicalSam31GpuRuntimeResultStore
  readonly now?: () => string
}): CanonicalSam31A100ResultFinalizationRuntimePort {
  assertPorts(input)
  const now = input.now ?? (() => new Date().toISOString())
  return Object.freeze({
    schemaVersion: CANONICAL_SAM3_1_A100_RESULT_FINALIZATION_VERSION,
    evidenceClass:
      'canonical_terminal_private_output_and_result_reread' as const,
    async finalize(untrusted: Parameters<
      CanonicalSam31A100ResultFinalizationRuntimePort['finalize']
    >[0]) {
      const invocationId = safeId.parse(untrusted.invocationId)
      const launchRecordId = safeId.parse(untrusted.launchRecordId)
      const launch = assertCanonicalProfessionalGpuJobLaunch(
        await input.lifecycleStore.rereadLaunchRecord({ launchRecordId }),
      )
      if (launch.executionEnvelopeRef.id !== invocationId
        || launch.routeId !== 'a100_80gb_heavy_primary'
        || launch.executionTarget !==
          'google_cloud_vertex_custom_job_a2_ultra'
        || launch.accelerator !== 'nvidia_a100_80gb') {
        throw new Error('SAM 3.1 A100 finalization launch scope differs.')
      }
      const terminalRecordId = boundedId(
        `sam31-a100-terminal:${invocationId}`,
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
        throw new Error('SAM 3.1 A100 attempt did not complete successfully.')
      }

      const existingResult = await input.resultStore
        .rereadResultAdmission(invocationId)
      if (existingResult !== null) {
        const result = assertCanonicalSam31GpuRuntimeResultAdmission(
          existingResult,
        )
        if (result.launchRef.id !== launch.launchRecordId
          || result.terminalRef.id !== terminal.terminalRecordId) {
          throw new Error('SAM 3.1 existing result lineage differs.')
        }
        const outputEvidenceValue =
          await input.resultStore.rereadPrivateOutputRereadEvidence(
            invocationId,
            result.privateOutputRereadEvidenceRef,
          )
        if (!outputEvidenceValue) {
          throw new Error(
            'SAM 3.1 existing private output reread evidence is missing.',
          )
        }
        const outputEvidence =
          assertCanonicalSam31PrivateOutputRereadEvidence(outputEvidenceValue)
        if (
          result.privateOutputRereadEvidenceRef.contentHash
            !== `sha256:${outputEvidence.evidenceHash}`
          || result.runtimeResponseObjectRef.contentHash
            !== outputEvidence.runtimeResponseObjectRef.contentHash
        ) {
          throw new Error(
            'SAM 3.1 existing private output reread evidence differs.',
          )
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
      const privateOutputEvidence =
        await input.privateOutputRereadPort.rereadExactPrivateOutput({
          task, response, launch,
        })
      const admittedAt = timestamp.parse(now())
      return admitCanonicalSam31GpuRuntimeResult({
        invocationId,
        launch,
        terminal,
        taskStore: input.taskStore,
        privateOutputRereadPort: Object.freeze({
          async rereadExactPrivateOutput() {
            return structuredClone(privateOutputEvidence)
          },
        }),
        resultStore: input.resultStore,
        resultAdmissionId: boundedId(`sam31-a100-result:${invocationId}`),
        admittedAt,
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
    throw new Error('SAM 3.1 A100 result finalization ports are incomplete.')
  }
}

function boundedId(value: string): string {
  return safeId.parse(value.length <= 180 ? value : value.slice(0, 180))
}
