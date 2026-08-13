import { z } from 'zod'

import type {
  CanonicalProfessionalGpuCloudTaskBody,
} from './canonical-professional-gpu-cloud-task-dispatch'
import type {
  CanonicalProfessionalGpuFundedStartAuthorityStore,
} from './canonical-professional-gpu-funded-start-authority-store'
import type {
  CanonicalProfessionalGpuDurableLifecycleStore,
} from './canonical-professional-gpu-durable-lifecycle-store'
import {
  assertCanonicalProfessionalGpuJobLaunch,
  assertCanonicalProfessionalGpuJobTerminal,
  assertPlainSerializedData,
  type CanonicalProfessionalGpuTerminalObservationPort,
} from './canonical-professional-gpu-job-lifecycle-service'
import {
  assertCanonicalProfessionalGpuFairQueueTransactionResult,
  sealCanonicalProfessionalGpuFairQueueTransactionRequest,
  type CanonicalProfessionalGpuFairQueueTransactionAdapter,
} from './canonical-professional-gpu-fair-queue-transaction-port'
import type {
  CanonicalProfessionalGpuQueueDeliveryConsumption,
} from './canonical-professional-gpu-queue-runtime-read-port'
import {
  assertCanonicalProfessionalGpuFundedLaunchBinding,
  assertCanonicalProfessionalGpuFundedPrelaunch,
  assertCanonicalProfessionalGpuFundedTerminalBinding,
  createCanonicalProfessionalGpuFundedLifecycleIdentity,
  recordCanonicalProfessionalGpuPlanFundedTerminal,
} from './canonical-professional-gpu-plan-funded-job-lifecycle-service'
import type {
  CanonicalTrackAllSam31L4TaskQaTerminalCostAdapters,
} from './canonical-track-all-sam3_1-l4-task-qa-terminal-cost-adapters'
import {
  sha256AuthorityValue,
  stableAuthorityStringify,
} from './private-edit-authority-store'

export const CANONICAL_TRACK_ALL_SAM3_1_L4_TASK_QA_TERMINAL_RECONCILIATION_VERSION =
  'canonical-track-all-sam3_1-l4-task-qa-terminal-reconciliation-v1' as const
export const CANONICAL_TRACK_ALL_SAM3_1_L4_TASK_QA_TERMINAL_RECONCILIATION_RESULT_VERSION =
  'canonical-track-all-sam3_1-l4-task-qa-terminal-reconciliation-result-v1' as const

const safeId = z.string().trim().min(1).max(240)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:@/-]*$/u)
  .refine((value) => !value.includes('..'))
const sha256 = z.string().regex(/^[a-f0-9]{64}$/u)
const prefixedSha256 = z.string().regex(/^sha256:[a-f0-9]{64}$/u)
const timestamp = z.string().datetime({ offset: true })
const evidenceRefSchema = z.object({
  id: safeId,
  version: z.number().int().positive().safe(),
  contentHash: prefixedSha256,
}).strict()
const resultWithoutDigestSchema = z.object({
  schemaVersion: z.literal(
    CANONICAL_TRACK_ALL_SAM3_1_L4_TASK_QA_TERMINAL_RECONCILIATION_RESULT_VERSION,
  ),
  source: z.literal(
    'canonical_server_track_all_sam3_1_l4_task_qa_terminal_reconciler',
  ),
  disposition: z.enum([
    'pending_cloud_terminal',
    'completed_and_queue_finalized',
    'failed_and_queue_finalized',
    'unknown_outcome_requires_reconciliation',
    'terminal_replay',
  ]),
  queueEntryRef: evidenceRefSchema,
  claimRef: evidenceRefSchema,
  executionAttemptRef: evidenceRefSchema,
  serviceIdentityEvidenceRef: evidenceRefSchema,
  launchRef: evidenceRefSchema,
  launchBindingRef: evidenceRefSchema,
  terminalRef: evidenceRefSchema.nullable(),
  terminalBindingRef: evidenceRefSchema.nullable(),
  attemptCostReceiptRef: evidenceRefSchema.nullable(),
  queueTerminalRef: evidenceRefSchema.nullable(),
  terminalOutcome: z.enum([
    'completed',
    'failed',
    'canceled',
    'outcome_unknown_requires_reconciliation',
  ]).nullable(),
  providerInferenceOrSubstantiveWorkOutcome: z.enum([
    'executed', 'not_executed', 'unknown',
  ]).nullable(),
  queueFinalized: z.boolean(),
  terminalUsageCostAndZeroActiveGpuPersisted: z.boolean(),
  activeGpuResourcesAfterObservation: z.union([z.literal(0), z.null()]),
  duplicateDeliveryStartedNewGpuJob: z.literal(false),
  automaticNewExecutionAttemptAllowed: z.literal(false),
  unresolvedOutcomeBlocksRetry: z.boolean(),
  customerCreditsMutated: z.literal(false),
  qaApproved: z.literal(false),
  publicDeliveryAuthorized: z.literal(false),
  productionAuthorityGranted: z.literal(false),
  observedAt: timestamp,
}).strict().superRefine((result, context) => {
  const pending = result.disposition === 'pending_cloud_terminal'
  const unknown = result.disposition ===
    'unknown_outcome_requires_reconciliation'
  const replay = result.disposition === 'terminal_replay'
  const finalized = result.disposition === 'completed_and_queue_finalized'
    || result.disposition === 'failed_and_queue_finalized'
    || replay
  const terminalPersisted = !pending
  if (result.queueFinalized !== finalized
    || result.unresolvedOutcomeBlocksRetry !== unknown
    || (result.terminalRef !== null) !== terminalPersisted
    || (result.terminalBindingRef !== null) !== terminalPersisted
    || (result.attemptCostReceiptRef !== null) !== terminalPersisted
    || (result.terminalOutcome !== null) !== terminalPersisted
    || (result.providerInferenceOrSubstantiveWorkOutcome !== null)
      !== terminalPersisted
    || (result.activeGpuResourcesAfterObservation === 0)
      !== terminalPersisted
    || result.terminalUsageCostAndZeroActiveGpuPersisted !== terminalPersisted
    || (result.queueTerminalRef !== null) !== finalized) {
    context.addIssue({
      code: 'custom',
      message: 'L4 terminal reconciliation disposition is inconsistent.',
    })
  }
})
const resultSchema = resultWithoutDigestSchema.extend({
  resultDigestSha256: sha256,
}).strict()

export type CanonicalTrackAllSam31L4TaskQaTerminalReconciliationResult =
  z.infer<typeof resultSchema>

export function assertCanonicalTrackAllSam31L4TaskQaTerminalReconciliationResult(
  value: unknown,
): CanonicalTrackAllSam31L4TaskQaTerminalReconciliationResult {
  assertPlainSerializedData(value, 'track_all_l4_terminal_reconciliation')
  const parsed = resultSchema.parse(value)
  const { resultDigestSha256, ...payload } = parsed
  if (resultDigestSha256 !== sha256AuthorityValue(payload)) {
    throw new TypeError('L4 terminal reconciliation digest is invalid.')
  }
  return parsed
}

export interface CanonicalTrackAllSam31L4TaskQaTerminalReconciler {
  readonly schemaVersion:
    typeof CANONICAL_TRACK_ALL_SAM3_1_L4_TASK_QA_TERMINAL_RECONCILIATION_VERSION
  readonly terminalUsageCostAndZeroActiveGpuRequiredBeforeQueueFinalization:
    true
  readonly duplicateDeliveryMayStartNewGpuJob: false
  readonly unknownOutcomeMayRetry: false
  readonly customerCreditsMutatedByReconciler: false
  readonly productionAuthority: false
  reconcileVerifiedDelivery(input: Readonly<{
    body: CanonicalProfessionalGpuCloudTaskBody
    delivery: CanonicalProfessionalGpuQueueDeliveryConsumption
    serviceIdentityEvidenceRef: z.infer<typeof evidenceRefSchema>
    observedAt: string
  }>): Promise<CanonicalTrackAllSam31L4TaskQaTerminalReconciliationResult>
}

export function createCanonicalTrackAllSam31L4TaskQaTerminalReconciler(
  input: Readonly<{
    fundedStartAuthorityStore: Pick<
      CanonicalProfessionalGpuFundedStartAuthorityStore,
      'rereadFundedAttemptByExecutionAttemptRef'
    >
    lifecycleStore: CanonicalProfessionalGpuDurableLifecycleStore
    terminalCostAdapters: CanonicalTrackAllSam31L4TaskQaTerminalCostAdapters
    terminalObservationPort: CanonicalProfessionalGpuTerminalObservationPort
    queueTransactionAdapter:
      CanonicalProfessionalGpuFairQueueTransactionAdapter
  }>,
): CanonicalTrackAllSam31L4TaskQaTerminalReconciler {
  assertDependencies(input)
  return Object.freeze({
    schemaVersion:
      CANONICAL_TRACK_ALL_SAM3_1_L4_TASK_QA_TERMINAL_RECONCILIATION_VERSION,
    terminalUsageCostAndZeroActiveGpuRequiredBeforeQueueFinalization:
      true as const,
    duplicateDeliveryMayStartNewGpuJob: false as const,
    unknownOutcomeMayRetry: false as const,
    customerCreditsMutatedByReconciler: false as const,
    productionAuthority: false as const,
    async reconcileVerifiedDelivery(untrusted: Readonly<{
      body: CanonicalProfessionalGpuCloudTaskBody
      delivery: CanonicalProfessionalGpuQueueDeliveryConsumption
      serviceIdentityEvidenceRef: z.infer<typeof evidenceRefSchema>
      observedAt: string
    }>) {
      const observedAt = timestamp.parse(untrusted.observedAt)
      const body = untrusted.body
      const delivery = untrusted.delivery
      const entry = delivery.claim.queueEntry
      const common = {
        queueEntryRef: ref(
          entry.queueEntryId,
          sha256AuthorityValue(entry),
        ),
        claimRef: ref(body.claimId, body.claimHash),
        executionAttemptRef: evidenceRefSchema.parse(
          body.executionAttemptRef,
        ),
        serviceIdentityEvidenceRef: evidenceRefSchema.parse(
          untrusted.serviceIdentityEvidenceRef,
        ),
      }
      if (entry.routeId !== 'l4_standard_primary'
        || entry.queueEntryId !== body.queueEntryId
        || delivery.claim.claimId !== body.claimId
        || delivery.claim.claimHash !== body.claimHash
        || !sameRef(entry.executionAttemptRef, body.executionAttemptRef)) {
        throw new TypeError('L4 terminal reconciler received another claim.')
      }
      const pair = await input.fundedStartAuthorityStore
        .rereadFundedAttemptByExecutionAttemptRef({
          executionAttemptRef: body.executionAttemptRef,
          at: observedAt,
        })
      if (!pair || pair.attemptStart.routeId !== 'l4_standard_primary'
        || !sameRef(
          pair.approvedFunding.approvedWorkItem.approvedWorkItemRef,
          entry.approvedWorkItemRef,
        )) {
        throw new TypeError('L4 terminal funded attempt is unavailable.')
      }
      const identity = createCanonicalProfessionalGpuFundedLifecycleIdentity({
        attemptStartAuthority: pair.attemptStart,
      })
      const prelaunch = assertCanonicalProfessionalGpuFundedPrelaunch(
        await input.lifecycleStore.rereadPrelaunchAuthorization({
          prelaunchAuthorizationId: identity.prelaunchAuthorizationId,
        }),
      )
      const launchBinding = assertCanonicalProfessionalGpuFundedLaunchBinding(
        await input.lifecycleStore.rereadLaunchBinding({
          launchBindingId: identity.launchBindingId,
        }),
      )
      const launch = assertCanonicalProfessionalGpuJobLaunch(
        await input.lifecycleStore.rereadLaunchRecord({
          launchRecordId: identity.launchRecordId,
        }),
      )
      if (!sameRef(launchBinding.launchRef, ref(
        launch.launchRecordId,
        launch.launchHash,
      )) || !sameRef(prelaunch.approvedWorkItemRef,
        entry.approvedWorkItemRef)) {
        throw new TypeError('L4 terminal launch lineage changed.')
      }
      await input.terminalCostAdapters.prepareTerminalCostContext({
        launch,
        launchBinding,
        prelaunch,
        workItemKey: pair.approvedFunding.approvedWorkItem.workItemKey,
      })

      const existingBinding = await input.lifecycleStore
        .rereadTerminalBinding({
          terminalBindingId: identity.terminalBindingId,
        })
      let terminal
      let terminalBinding
      let terminalReplay = false
      if (existingBinding) {
        terminalBinding = assertCanonicalProfessionalGpuFundedTerminalBinding(
          existingBinding,
        )
        terminal = assertCanonicalProfessionalGpuJobTerminal(
          await input.lifecycleStore.rereadTerminalRecord({
            terminalRecordId: identity.terminalRecordId,
          }),
        )
        terminalReplay = true
      } else {
        const readiness = await input.terminalCostAdapters
          .rereadCloudRunTerminalReadiness({ launch })
        if (readiness === 'pending') return buildResult({
          ...common,
          disposition: 'pending_cloud_terminal',
          launchRef: ref(launch.launchRecordId, launch.launchHash),
          launchBindingRef: ref(
            launchBinding.launchBindingId,
            launchBinding.launchBindingHash,
          ),
          terminalRef: null,
          terminalBindingRef: null,
          attemptCostReceiptRef: null,
          queueTerminalRef: null,
          terminalOutcome: null,
          providerInferenceOrSubstantiveWorkOutcome: null,
          queueFinalized: false,
          terminalUsageCostAndZeroActiveGpuPersisted: false,
          activeGpuResourcesAfterObservation: null,
          unresolvedOutcomeBlocksRetry: false,
          observedAt,
        })
        const recorded =
          await recordCanonicalProfessionalGpuPlanFundedTerminal({
            terminalRecordId: identity.terminalRecordId,
            terminalBindingId: identity.terminalBindingId,
            launch,
            launchBindingId: identity.launchBindingId,
            terminalObservationPort: input.terminalObservationPort,
            lifecycleStore: input.lifecycleStore,
            fundedLifecycleStore: input.lifecycleStore,
          })
        terminal = recorded.terminal
        terminalBinding = recorded.terminalBinding
      }
      if (!sameRef(terminalBinding.terminalRef, ref(
        terminal.terminalRecordId,
        terminal.terminalHash,
      )) || terminal.activeGpuInstancesAfterTerminalObservation !== 0
        || !terminal.workerStoppedVerified
        || !terminal.costReceiptPersistedBeforeSettlement) {
        throw new TypeError('L4 terminal cost or zero-active proof changed.')
      }
      const terminalRef = ref(
        terminal.terminalRecordId,
        terminal.terminalHash,
      )
      const unknown = terminal.unknownOutcomeBlocksRetry
        || terminal.providerInferenceOrSubstantiveWorkOutcome === 'unknown'
      if (unknown) return buildResult({
        ...common,
        disposition: 'unknown_outcome_requires_reconciliation',
        launchRef: ref(launch.launchRecordId, launch.launchHash),
        launchBindingRef: ref(
          launchBinding.launchBindingId,
          launchBinding.launchBindingHash,
        ),
        terminalRef,
        terminalBindingRef: ref(
          terminalBinding.terminalBindingId,
          terminalBinding.terminalBindingHash,
        ),
        attemptCostReceiptRef: terminal.attemptCostReceiptRef,
        queueTerminalRef: null,
        terminalOutcome: terminal.terminalOutcome,
        providerInferenceOrSubstantiveWorkOutcome:
          terminal.providerInferenceOrSubstantiveWorkOutcome,
        queueFinalized: false,
        terminalUsageCostAndZeroActiveGpuPersisted: true,
        activeGpuResourcesAfterObservation: 0,
        unresolvedOutcomeBlocksRetry: true,
        observedAt,
      })

      const queueDisposition = terminal.terminalOutcome === 'completed'
        && terminal.providerInferenceOrSubstantiveWorkOutcome === 'executed'
        ? 'completed' as const
        : 'failed_reconciled' as const
      const finalized = assertCanonicalProfessionalGpuFairQueueTransactionResult(
        await input.queueTransactionAdapter.finalize(
          sealCanonicalProfessionalGpuFairQueueTransactionRequest({
            schemaVersion:
              'canonical-professional-gpu-fair-queue-transaction-port-v1',
            operation: 'finalize',
            requestId: `gpu-l4-terminal-${sha256AuthorityValue({
              domain: 'canonical_track_all_l4_terminal_finalize_v1',
              claimRef: common.claimRef,
              terminalRef,
              queueDisposition,
            })}`,
            queueId: 'weeditpro-professional-gpu-production-v1',
            runtimeRegion: 'us-central1',
            queueEntryId: entry.queueEntryId,
            executionAttemptRef: body.executionAttemptRef,
            claimRef: common.claimRef,
            terminalEvidenceRef: terminalRef,
            disposition: queueDisposition,
            terminalAt: terminal.observedAt,
          }),
        ),
      )
      if (finalized.operation !== 'finalize'
        || (finalized.disposition !== 'finalized'
          && finalized.disposition !== 'terminal_replay')
        || finalized.terminal === null
        || finalized.terminal.disposition !== queueDisposition
        || !sameRef(finalized.terminal.terminalEvidenceRef, terminalRef)) {
        throw new TypeError('L4 queue finalization differs from terminal.')
      }
      if (delivery.terminal && !sameRef(
        delivery.terminal.terminalEvidenceRef,
        terminalRef,
      )) throw new TypeError('L4 queue terminal replay changed evidence.')

      return buildResult({
        ...common,
        disposition: terminalReplay || delivery.terminal
          ? 'terminal_replay'
          : queueDisposition === 'completed'
            ? 'completed_and_queue_finalized'
            : 'failed_and_queue_finalized',
        launchRef: ref(launch.launchRecordId, launch.launchHash),
        launchBindingRef: ref(
          launchBinding.launchBindingId,
          launchBinding.launchBindingHash,
        ),
        terminalRef,
        terminalBindingRef: ref(
          terminalBinding.terminalBindingId,
          terminalBinding.terminalBindingHash,
        ),
        attemptCostReceiptRef: terminal.attemptCostReceiptRef,
        queueTerminalRef: ref(
          `${entry.queueEntryId}:terminal`,
          finalized.terminal.terminalHash,
        ),
        terminalOutcome: terminal.terminalOutcome,
        providerInferenceOrSubstantiveWorkOutcome:
          terminal.providerInferenceOrSubstantiveWorkOutcome,
        queueFinalized: true,
        terminalUsageCostAndZeroActiveGpuPersisted: true,
        activeGpuResourcesAfterObservation: 0,
        unresolvedOutcomeBlocksRetry: false,
        observedAt,
      })
    },
  })
}

function buildResult(input: Omit<
  z.input<typeof resultWithoutDigestSchema>,
  | 'schemaVersion'
  | 'source'
  | 'duplicateDeliveryStartedNewGpuJob'
  | 'automaticNewExecutionAttemptAllowed'
  | 'customerCreditsMutated'
  | 'qaApproved'
  | 'publicDeliveryAuthorized'
  | 'productionAuthorityGranted'
>): CanonicalTrackAllSam31L4TaskQaTerminalReconciliationResult {
  const payload = resultWithoutDigestSchema.parse({
    schemaVersion:
      CANONICAL_TRACK_ALL_SAM3_1_L4_TASK_QA_TERMINAL_RECONCILIATION_RESULT_VERSION,
    source:
      'canonical_server_track_all_sam3_1_l4_task_qa_terminal_reconciler',
    ...structuredClone(input),
    duplicateDeliveryStartedNewGpuJob: false,
    automaticNewExecutionAttemptAllowed: false,
    customerCreditsMutated: false,
    qaApproved: false,
    publicDeliveryAuthorized: false,
    productionAuthorityGranted: false,
  })
  return resultSchema.parse({
    ...payload,
    resultDigestSha256: sha256AuthorityValue(payload),
  })
}

function ref(id: string, hash: string, version = 1) {
  return evidenceRefSchema.parse({
    id,
    version,
    contentHash: hash.startsWith('sha256:') ? hash : `sha256:${hash}`,
  })
}

function sameRef(
  left: z.infer<typeof evidenceRefSchema>,
  right: z.infer<typeof evidenceRefSchema>,
): boolean {
  return stableAuthorityStringify(left) === stableAuthorityStringify(right)
}

function assertDependencies(input: Readonly<{
  fundedStartAuthorityStore: Pick<
    CanonicalProfessionalGpuFundedStartAuthorityStore,
    'rereadFundedAttemptByExecutionAttemptRef'
  >
  lifecycleStore: CanonicalProfessionalGpuDurableLifecycleStore
  terminalCostAdapters: CanonicalTrackAllSam31L4TaskQaTerminalCostAdapters
  terminalObservationPort: CanonicalProfessionalGpuTerminalObservationPort
  queueTransactionAdapter: CanonicalProfessionalGpuFairQueueTransactionAdapter
}>): void {
  if (typeof input.fundedStartAuthorityStore
    ?.rereadFundedAttemptByExecutionAttemptRef !== 'function'
    || typeof input.lifecycleStore?.rereadPrelaunchAuthorization !== 'function'
    || typeof input.lifecycleStore?.rereadLaunchBinding !== 'function'
    || typeof input.lifecycleStore?.rereadLaunchRecord !== 'function'
    || typeof input.lifecycleStore?.rereadTerminalBinding !== 'function'
    || typeof input.lifecycleStore?.rereadTerminalRecord !== 'function'
    || typeof input.terminalCostAdapters
      ?.prepareTerminalCostContext !== 'function'
    || typeof input.terminalCostAdapters
      ?.rereadCloudRunTerminalReadiness !== 'function'
    || typeof input.terminalObservationPort
      ?.rereadTerminalUsagePriceAndCost !== 'function'
    || typeof input.queueTransactionAdapter?.finalize !== 'function'
    || !input.queueTransactionAdapter.multiReplicaDurabilityVerified
    || !input.queueTransactionAdapter.sharedDurableTransactionPerformed) {
    throw new TypeError('L4 terminal reconciliation dependency is unavailable.')
  }
}
