import { z } from 'zod'

import type {
  CanonicalProfessionalGpuCloudTaskBody,
} from './canonical-professional-gpu-cloud-task-dispatch'
import type {
  CanonicalProfessionalGpuFundedStartAuthorityStore,
} from './canonical-professional-gpu-funded-start-authority-store'
import {
  assertCanonicalProfessionalGpuFundedPrelaunch,
  createCanonicalProfessionalGpuFundedLifecycleIdentity,
  launchCanonicalProfessionalGpuPreparedPlanFundedJob,
} from './canonical-professional-gpu-plan-funded-job-lifecycle-service'
import type {
  CanonicalProfessionalGpuDurableLifecycleStore,
} from './canonical-professional-gpu-durable-lifecycle-store'
import type {
  CanonicalProfessionalGpuRuntimeReleaseReadPort,
} from './canonical-professional-gpu-job-lifecycle-service'
import type {
  CanonicalProfessionalGpuQueueDeliveryConsumption,
} from './canonical-professional-gpu-queue-runtime-read-port'
import type {
  CanonicalTrackAllSam31L4TaskQaFundedRuntimeComposition,
} from './canonical-track-all-sam3_1-l4-task-qa-funded-gpu-runtime-composition'
import type {
  CanonicalTrackAllSam31L4TaskQaTerminalReconciler,
  CanonicalTrackAllSam31L4TaskQaTerminalReconciliationResult,
} from './canonical-track-all-sam3_1-l4-task-qa-terminal-reconciliation-service'
import {
  assertCanonicalTrackAllSam31L4TaskQaMaterialV2,
  type CanonicalTrackAllSam31L4TaskQaMaterialRepository,
} from '../workers/masks/canonical-track-all-sam3_1-l4-task-qa-owner-service'
import {
  sha256AuthorityValue,
} from './private-edit-authority-store'

export const CANONICAL_TRACK_ALL_SAM3_1_L4_TASK_QA_CLOUD_TASK_CONSUMER_VERSION =
  'canonical-track-all-sam3_1-l4-task-qa-cloud-task-consumer-v1' as const
export const CANONICAL_TRACK_ALL_SAM3_1_L4_TASK_QA_CLOUD_TASK_CONSUMER_RESULT_VERSION =
  'canonical-track-all-sam3_1-l4-task-qa-cloud-task-consumer-result-v1' as const

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
    CANONICAL_TRACK_ALL_SAM3_1_L4_TASK_QA_CLOUD_TASK_CONSUMER_RESULT_VERSION,
  ),
  source: z.literal(
    'canonical_server_track_all_sam3_1_l4_task_qa_cloud_task_consumer',
  ),
  disposition: z.enum([
    'job_created_pending_terminal',
    'job_rejected_before_creation_pending_reconciliation',
    'job_creation_unknown_requires_reconciliation',
    'launch_replay_pending_terminal',
  ]),
  queueEntryRef: evidenceRefSchema,
  claimRef: evidenceRefSchema,
  executionAttemptRef: evidenceRefSchema,
  serviceIdentityEvidenceRef: evidenceRefSchema,
  l4TaskMaterialRef: evidenceRefSchema,
  prelaunchAuthorizationRef: evidenceRefSchema,
  launchRef: evidenceRefSchema,
  launchBindingRef: evidenceRefSchema,
  cloudJobExecutionRef: evidenceRefSchema.nullable(),
  routeId: z.literal('l4_standard_primary'),
  accelerator: z.literal('nvidia_l4'),
  queueFinalized: z.literal(false),
  terminalUsageCostAndZeroActiveGpuObservationPending: z.literal(true),
  exactTaskClaimFundingAttemptMaterialPrelaunchAndReleaseReread:
    z.literal(true),
  duplicateDeliveryStartedNewGpuJob: z.literal(false),
  automaticNewExecutionAttemptAllowed: z.literal(false),
  unresolvedOutcomeBlocksRetry: z.boolean(),
  customerCreditsMutated: z.literal(false),
  qaApproved: z.literal(false),
  publicDeliveryAuthorized: z.literal(false),
  productionAuthorityGranted: z.literal(false),
  observedAt: timestamp,
}).strict().superRefine((result, context) => {
  const unknown = result.disposition ===
    'job_creation_unknown_requires_reconciliation'
  const created = result.disposition === 'job_created_pending_terminal'
    || result.disposition === 'launch_replay_pending_terminal'
  if (unknown !== result.unresolvedOutcomeBlocksRetry
    || created !== (result.cloudJobExecutionRef !== null)) {
    context.addIssue({
      code: 'custom',
      message: 'L4 task consumer launch disposition is inconsistent.',
    })
  }
})
const resultSchema = resultWithoutDigestSchema.extend({
  resultDigestSha256: sha256,
}).strict()

export type CanonicalTrackAllSam31L4TaskQaCloudTaskConsumerResult = z.infer<
  typeof resultSchema
>

export interface CanonicalTrackAllSam31L4TaskQaCloudTaskConsumer {
  readonly schemaVersion:
    typeof CANONICAL_TRACK_ALL_SAM3_1_L4_TASK_QA_CLOUD_TASK_CONSUMER_VERSION
  readonly consumesOnlyVerifiedL4QueueDelivery: true
  readonly exactFundedPrelaunchAndMaterialRereadBeforeGpuLaunch: true
  readonly queueFinalizationBeforeTerminalCostAndZeroActiveProofAllowed: false
  readonly duplicateDeliveryMayStartNewGpuJob: false
  readonly productionAuthority: false
  consumeVerifiedDelivery(input: {
    readonly body: CanonicalProfessionalGpuCloudTaskBody
    readonly delivery: CanonicalProfessionalGpuQueueDeliveryConsumption
    readonly serviceIdentityEvidenceRef: z.infer<typeof evidenceRefSchema>
    readonly observedAt: string
  }): Promise<
    CanonicalTrackAllSam31L4TaskQaCloudTaskConsumerResult
    | CanonicalTrackAllSam31L4TaskQaTerminalReconciliationResult
  >
}

export function createCanonicalTrackAllSam31L4TaskQaCloudTaskConsumer(input: {
  readonly fundedStartAuthorityStore: Pick<
    CanonicalProfessionalGpuFundedStartAuthorityStore,
    'rereadFundedAttemptByExecutionAttemptRef'
  >
  readonly lifecycleStore: CanonicalProfessionalGpuDurableLifecycleStore
  readonly releaseReadPort: CanonicalProfessionalGpuRuntimeReleaseReadPort
  readonly runtimeComposition:
    CanonicalTrackAllSam31L4TaskQaFundedRuntimeComposition
  readonly materialRepository: Pick<
    CanonicalTrackAllSam31L4TaskQaMaterialRepository,
    'rereadMaterial'
  >
  readonly terminalReconciler:
    CanonicalTrackAllSam31L4TaskQaTerminalReconciler
}): CanonicalTrackAllSam31L4TaskQaCloudTaskConsumer {
  return Object.freeze({
    schemaVersion:
      CANONICAL_TRACK_ALL_SAM3_1_L4_TASK_QA_CLOUD_TASK_CONSUMER_VERSION,
    consumesOnlyVerifiedL4QueueDelivery: true as const,
    exactFundedPrelaunchAndMaterialRereadBeforeGpuLaunch: true as const,
    queueFinalizationBeforeTerminalCostAndZeroActiveProofAllowed:
      false as const,
    duplicateDeliveryMayStartNewGpuJob: false as const,
    productionAuthority: false as const,
    async consumeVerifiedDelivery(
      untrusted: Parameters<
        CanonicalTrackAllSam31L4TaskQaCloudTaskConsumer[
          'consumeVerifiedDelivery'
        ]
      >[0],
    ) {
      const observedAt = timestamp.parse(untrusted.observedAt)
      const { body, delivery } = untrusted
      const entry = delivery.claim.queueEntry
      if (entry.routeId !== 'l4_standard_primary'
        || entry.queueEntryId !== body.queueEntryId
        || delivery.claim.claimId !== body.claimId
        || delivery.claim.claimHash !== body.claimHash
        || !sameRef(entry.executionAttemptRef, body.executionAttemptRef)) {
        throw new TypeError('L4 task consumer received another route or claim.')
      }
      if (delivery.terminal) {
        throw new TypeError(
          'L4 terminal delivery must be served by the terminal reconciler.',
        )
      }
      const pair = await input.fundedStartAuthorityStore
        .rereadFundedAttemptByExecutionAttemptRef({
          executionAttemptRef: body.executionAttemptRef,
          at: observedAt,
        })
      if (!pair) throw new TypeError(
        'L4 funded attempt is unavailable for task delivery.',
      )
      const funding = pair.approvedFunding
      const attempt = pair.attemptStart
      if (attempt.routeId !== 'l4_standard_primary'
        || attempt.attemptOrdinal !== 1
        || attempt.scope.ownerUserId !== entry.ownerUserId
        || attempt.scope.workspaceId !== entry.workspaceId
        || funding.scope.ownerUserId !== entry.ownerUserId
        || funding.scope.workspaceId !== entry.workspaceId
        || funding.scope.projectId !== entry.projectId
        || !sameRef(funding.approvedSnapshotRef, entry.approvedSnapshotRef)
        || !sameRef(attempt.executionAttemptRef, entry.executionAttemptRef)
        || !sameRef(attempt.approvedWorkItemRef, entry.approvedWorkItemRef)
        || !sameRef(
          funding.approvedWorkItem.approvedWorkItemRef,
          entry.approvedWorkItemRef,
        )) throw new TypeError(
        'L4 queue entry differs from the funded attempt authority.',
      )
      const identity = createCanonicalProfessionalGpuFundedLifecycleIdentity({
        attemptStartAuthority: attempt,
      })
      const prelaunch = assertCanonicalProfessionalGpuFundedPrelaunch(
        await input.lifecycleStore.rereadPrelaunchAuthorization({
          prelaunchAuthorizationId: identity.prelaunchAuthorizationId,
        }),
      )
      const material = assertCanonicalTrackAllSam31L4TaskQaMaterialV2(
        await input.materialRepository.rereadMaterial({
          executionAttemptRef: body.executionAttemptRef,
        }),
      )
      if (!sameRef(prelaunch.fundedDispatchAdmissionRef,
        entry.fundedDispatchAdmissionRef)
        || !sameRef(prelaunch.attemptStartAuthorityRef, ref(
          attempt.attemptAuthorityId,
          attempt.attemptAuthorityHash,
        ))
        || !sameRef(material.executionAttemptRef, body.executionAttemptRef)
        || !sameRef(material.approvedSnapshotRef, entry.approvedSnapshotRef)
        || !sameRef(material.approvedWorkItemRef, entry.approvedWorkItemRef)
        || material.fundedReservationRef.id !== funding.fundedReservationRef.id
        || material.userTriggerRecordRef.id !== attempt.userTriggerRecordRef.id) {
        throw new TypeError(
          'L4 material or funded prelaunch differs from queued authority.',
        )
      }
      const existing = await input.lifecycleStore.rereadLaunchBinding({
        launchBindingId: identity.launchBindingId,
      })
      if (existing || delivery.terminal) {
        return input.terminalReconciler.reconcileVerifiedDelivery({
          body,
          delivery,
          serviceIdentityEvidenceRef:
            evidenceRefSchema.parse(untrusted.serviceIdentityEvidenceRef),
          observedAt,
        })
      }
      const started = await launchCanonicalProfessionalGpuPreparedPlanFundedJob({
        launchRecordId: identity.launchRecordId,
        launchBindingId: identity.launchBindingId,
        prelaunchAuthorization: prelaunch,
        releaseReadPort: input.releaseReadPort,
        launchPort: input.runtimeComposition.launchPort,
        lifecycleStore: input.lifecycleStore,
        fundedLifecycleStore: input.lifecycleStore,
        startedAt: observedAt,
      })
      const launch = started.launch
      if (launch.routeId !== 'l4_standard_primary'
        || launch.accelerator !== 'nvidia_l4'
        || launch.executionTarget !== 'google_cloud_run_l4_job'
        || !sameRef(started.launchBinding.prelaunchAuthorizationRef, ref(
          prelaunch.prelaunchAuthorizationId,
          prelaunch.prelaunchAuthorizationHash,
        ))) throw new TypeError('L4 launch result changed route or lineage.')
      const disposition = launch.launchDisposition === 'job_created'
        ? 'job_created_pending_terminal' as const
        : launch.launchDisposition === 'job_rejected_before_creation'
          ? 'job_rejected_before_creation_pending_reconciliation' as const
          : 'job_creation_unknown_requires_reconciliation' as const
      if (launch.launchDisposition === 'job_created') {
        return input.terminalReconciler.reconcileVerifiedDelivery({
          body,
          delivery,
          serviceIdentityEvidenceRef:
            evidenceRefSchema.parse(untrusted.serviceIdentityEvidenceRef),
          observedAt,
        })
      }
      return buildResult({
        disposition,
        queueEntryRef: ref(
          entry.queueEntryId,
          sha256AuthorityValue(entry),
        ),
        claimRef: ref(body.claimId, body.claimHash),
        executionAttemptRef: body.executionAttemptRef,
        serviceIdentityEvidenceRef:
          evidenceRefSchema.parse(untrusted.serviceIdentityEvidenceRef),
        l4TaskMaterialRef: ref(material.materialId, material.materialHash),
        prelaunchAuthorizationRef: ref(
          prelaunch.prelaunchAuthorizationId,
          prelaunch.prelaunchAuthorizationHash,
        ),
        launchRef: ref(launch.launchRecordId, launch.launchHash),
        launchBindingRef: ref(
          started.launchBinding.launchBindingId,
          started.launchBinding.launchBindingHash,
        ),
        cloudJobExecutionRef: launch.cloudJobExecutionRef,
        unresolvedOutcomeBlocksRetry:
          disposition === 'job_creation_unknown_requires_reconciliation',
        observedAt,
      })
    },
  })
}

function buildResult(input: Omit<
  z.input<typeof resultWithoutDigestSchema>,
  | 'schemaVersion'
  | 'source'
  | 'routeId'
  | 'accelerator'
  | 'queueFinalized'
  | 'terminalUsageCostAndZeroActiveGpuObservationPending'
  | 'exactTaskClaimFundingAttemptMaterialPrelaunchAndReleaseReread'
  | 'duplicateDeliveryStartedNewGpuJob'
  | 'automaticNewExecutionAttemptAllowed'
  | 'customerCreditsMutated'
  | 'qaApproved'
  | 'publicDeliveryAuthorized'
  | 'productionAuthorityGranted'
>): CanonicalTrackAllSam31L4TaskQaCloudTaskConsumerResult {
  const payload = resultWithoutDigestSchema.parse({
    ...input,
    schemaVersion:
      CANONICAL_TRACK_ALL_SAM3_1_L4_TASK_QA_CLOUD_TASK_CONSUMER_RESULT_VERSION,
    source:
      'canonical_server_track_all_sam3_1_l4_task_qa_cloud_task_consumer',
    routeId: 'l4_standard_primary',
    accelerator: 'nvidia_l4',
    queueFinalized: false,
    terminalUsageCostAndZeroActiveGpuObservationPending: true,
    exactTaskClaimFundingAttemptMaterialPrelaunchAndReleaseReread: true,
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

function ref(id: string, hash: string) {
  return Object.freeze({
    id,
    version: 1,
    contentHash: hash.startsWith('sha256:') ? hash : `sha256:${hash}`,
  })
}

function sameRef(
  left: { id: string; version: number; contentHash: string },
  right: { id: string; version: number; contentHash: string },
): boolean {
  return left.id === right.id
    && left.version === right.version
    && left.contentHash === right.contentHash
}
