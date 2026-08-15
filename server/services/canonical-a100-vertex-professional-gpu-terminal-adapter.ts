import {
  assertCanonicalA100VertexCustomJobTerminalRead,
  type CanonicalA100VertexCustomJobTerminalRead,
} from './canonical-a100-vertex-custom-job-terminal-port'
import {
  assertCanonicalProfessionalGpuJobLaunch,
  CANONICAL_PROFESSIONAL_GPU_TERMINAL_OBSERVATION_VERSION,
  canonicalProfessionalGpuTerminalObservationSchema,
  type CanonicalProfessionalGpuJobLaunch,
  type CanonicalProfessionalGpuTerminalObservationPort,
} from './canonical-professional-gpu-job-lifecycle-service'
import { sha256AuthorityValue } from './private-edit-authority-store'

export const CANONICAL_A100_VERTEX_PROFESSIONAL_GPU_TERMINAL_ADAPTER_VERSION =
  'canonical-a100-vertex-professional-gpu-terminal-adapter-v1' as const

interface VertexTerminalReadPort {
  reread(input: {
    readonly executionRef: CanonicalProfessionalGpuJobLaunch[
      'cloudJobExecutionRef'
    ]
  }): Promise<unknown>
}

/**
 * Converts the exact Vertex Custom Job terminal reread into the provider-neutral
 * GPU lifecycle observation. Pending, unknown, and expired attempts remain
 * unrecorded: they require checkback or reconciliation and can never be cast
 * into a terminal lifecycle record.
 */
export function createCanonicalA100VertexProfessionalGpuTerminalObservationPort(
  input: { readonly terminalReadPort: VertexTerminalReadPort },
): CanonicalProfessionalGpuTerminalObservationPort {
  if (typeof input.terminalReadPort?.reread !== 'function') {
    throw new Error('Vertex A100 terminal read port is unavailable.')
  }
  return Object.freeze({
    async rereadTerminalUsagePriceAndCost({
      launch: untrustedLaunch,
    }: { readonly launch: CanonicalProfessionalGpuJobLaunch }) {
      const launch = assertCanonicalProfessionalGpuJobLaunch(untrustedLaunch)
      if (
        launch.launchDisposition !== 'job_created'
        || launch.cloudJobExecutionRef === null
        || launch.toolId !== 'sam3_1'
        || launch.operationId !==
          'tool.sam3_1.segment_and_track_subject.v1'
        || launch.routeId !== 'a100_80gb_heavy_primary'
        || launch.executionTarget !==
          'google_cloud_vertex_custom_job_a2_ultra'
        || launch.accelerator !== 'nvidia_a100_80gb'
      ) throw new Error('Vertex A100 terminal adapter received another route.')

      const terminal = assertCanonicalA100VertexCustomJobTerminalRead(
        await input.terminalReadPort.reread({
          executionRef: launch.cloudJobExecutionRef,
        }),
      )
      assertTerminalMatchesLaunch({ launch, terminal })
      if (terminal.disposition !== 'terminal') {
        throw new Error(
          terminal.disposition === 'pending'
            ? 'Vertex A100 job is pending; terminal checkback is required.'
            : 'Vertex A100 terminal outcome requires reconciliation.',
        )
      }
      if (terminal.terminalOutcome === 'expired') {
        throw new Error(
          'Expired Vertex A100 job requires an explicit lifecycle successor.',
        )
      }
      const payload = {
        schemaVersion:
          CANONICAL_PROFESSIONAL_GPU_TERMINAL_OBSERVATION_VERSION,
        source:
          'canonical_server_cloud_terminal_usage_and_cost_owner' as const,
        evidenceClass: 'canonical_private_reread' as const,
        launchRef: ref(launch.launchRecordId, launch.launchHash),
        cloudJobExecutionRef: launch.cloudJobExecutionRef,
        cloudTerminalObservationRef: terminal.cloudTerminalObservationRef!,
        cloudCapacityTeardownObservationRef:
          terminal.cloudCapacityTeardownObservationRef!,
        workerUsageEvidenceRef: terminal.workerUsageEvidenceRef!,
        currentAccountPriceAuthorityRef:
          terminal.currentAccountPriceAuthorityRef!,
        attemptCostReceiptRef: terminal.attemptCostReceiptRef!,
        terminalOutcome: terminal.terminalOutcome,
        providerInferenceOrSubstantiveWorkOutcome:
          terminal.providerInferenceOrSubstantiveWorkOutcome,
        cloudJobTerminalStateReread:
          terminal.providerJobTerminalStateReread,
        workerStoppedVerified: terminal.workerStoppedVerified,
        activeGpuInstancesAfterTerminalObservation:
          terminal.activeA100GpuInstancesAfterObservation,
        exactPlatformUsageAndAccountPriceReread:
          terminal.exactVertexPlatformUsageAndAccountEffectivePriceReread,
        costReceiptPersistedBeforeSettlement:
          terminal.costReceiptPersistedBeforeSettlement,
        systemFailureOrUnknownCostChargedToCustomer:
          terminal.systemFailureOrUnknownCostChargedToCustomer,
        unapprovedOverageChargedToCustomer:
          terminal.unapprovedOverageChargedToCustomer,
        customerWalletOrLedgerMutated:
          terminal.customerWalletOrLedgerMutated,
        callerOrPlanTerminalClaimAccepted: false as const,
        observedAt: terminal.observedAt,
      }
      return Object.freeze(
        canonicalProfessionalGpuTerminalObservationSchema.parse({
          ...payload,
          observationHash: sha256AuthorityValue(payload),
        }),
      )
    },
  })
}

function assertTerminalMatchesLaunch(input: {
  launch: CanonicalProfessionalGpuJobLaunch
  terminal: CanonicalA100VertexCustomJobTerminalRead
}): void {
  if (
    input.launch.cloudJobExecutionRef === null
    || !sameRef(input.terminal.executionRef,
      input.launch.cloudJobExecutionRef)
    || Date.parse(input.terminal.observedAt) <
      Date.parse(input.launch.launchedAt)
  ) throw new Error('Vertex A100 terminal read differs from its launch.')
}

function ref(id: string, hash: string) {
  return Object.freeze({
    id,
    version: 1,
    contentHash: `sha256:${hash}` as const,
  })
}

function sameRef(
  left: { id: string, version: number, contentHash: string },
  right: { id: string, version: number, contentHash: string },
): boolean {
  return left.id === right.id && left.version === right.version
    && left.contentHash === right.contentHash
}
