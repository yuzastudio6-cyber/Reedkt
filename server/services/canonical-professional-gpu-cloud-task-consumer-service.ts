import { z } from 'zod'

import {
  assertCanonicalVerifiedServiceIdentity,
  type CanonicalLiveGoogleServiceIdentityVerifier,
} from '../security/canonical-service-identity-verifier'
import {
  CANONICAL_PROFESSIONAL_GPU_CLOUD_TASK_SERVICE_ACCOUNT,
  parseCanonicalProfessionalGpuCloudTaskBody,
} from './canonical-professional-gpu-cloud-task-dispatch'
import type {
  CanonicalProfessionalGpuFundedStartAuthorityStore,
} from './canonical-professional-gpu-funded-start-authority-store'
import {
  assertCanonicalProfessionalGpuFairQueueTransactionResult,
  sealCanonicalProfessionalGpuFairQueueTransactionRequest,
  type CanonicalProfessionalGpuFairQueueTransactionAdapter,
} from './canonical-professional-gpu-fair-queue-transaction-port'
import type {
  CanonicalProfessionalGpuQueueRuntimeReadPort,
} from './canonical-professional-gpu-queue-runtime-read-port'
import {
  assertPlainSerializedData,
} from './canonical-professional-gpu-job-lifecycle-service'
import {
  buildTrackAllSam31AuthenticatedGpuInvocationRequest,
  parseTrackAllSam31AuthenticatedGpuInvocationResult,
  type CanonicalTrackAllSam31AuthenticatedGpuInvocationRuntimePort,
} from './canonical-track-all-sam3_1-authenticated-gpu-start-service'
import {
  sha256AuthorityValue,
  stableAuthorityStringify,
} from './private-edit-authority-store'

export const CANONICAL_PROFESSIONAL_GPU_CLOUD_TASK_CONSUMER_VERSION =
  'canonical-professional-gpu-cloud-task-consumer-v1' as const
export const CANONICAL_PROFESSIONAL_GPU_CLOUD_TASK_CONSUMER_RESULT_VERSION =
  'canonical-professional-gpu-cloud-task-consumer-result-v1' as const

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
const resultPayloadSchema = z.object({
  schemaVersion: z.literal(
    CANONICAL_PROFESSIONAL_GPU_CLOUD_TASK_CONSUMER_RESULT_VERSION,
  ),
  source: z.literal('canonical_server_professional_gpu_cloud_task_consumer'),
  disposition: z.enum([
    'completed_and_queue_finalized',
    'failed_and_queue_finalized',
    'known_not_executed_and_queue_finalized',
    'unknown_outcome_requires_reconciliation',
    'terminal_replay',
  ]),
  queueEntryRef: evidenceRefSchema,
  claimRef: evidenceRefSchema,
  executionAttemptRef: evidenceRefSchema,
  serviceIdentityEvidenceRef: evidenceRefSchema,
  endpointInvocationResultRef: evidenceRefSchema,
  queueTerminalRef: evidenceRefSchema.nullable(),
  invocationDisposition: z.enum([
    'completed',
    'failed',
    'not_executed_scale_from_zero_trigger',
    'outcome_unknown_requires_reconciliation',
  ]).nullable(),
  queueFinalized: z.boolean(),
  exactTaskOutboxClaimFundingAttemptAndInvocationReread: z.literal(true),
  duplicateDeliveryStartedNewInference: z.literal(false),
  automaticNewExecutionAttemptAllowed: z.literal(false),
  unresolvedOutcomeBlocksRetry: z.boolean(),
  canonicalUsageCostAndCreditSettlementPending: z.literal(true),
  customerCreditsMutated: z.literal(false),
  qaApproved: z.literal(false),
  publicDeliveryAuthorized: z.literal(false),
  productionAuthorityGranted: z.literal(false),
  observedAt: timestamp,
}).strict()
function refineResult(
  result: z.infer<typeof resultPayloadSchema>,
  context: z.RefinementCtx,
): void {
  const replay = result.disposition === 'terminal_replay'
  const unknown = result.disposition ===
    'unknown_outcome_requires_reconciliation'
  if (
    result.queueFinalized !== !unknown
    || (result.queueTerminalRef !== null) !== !unknown
    || result.unresolvedOutcomeBlocksRetry !== unknown
    || replay !== (result.invocationDisposition === null)
  ) context.addIssue({
    code: 'custom',
    message: 'Professional GPU consumer disposition is inconsistent.',
  })
}
const resultWithoutDigestSchema = resultPayloadSchema.superRefine(refineResult)
const resultSchema = resultPayloadSchema.extend({
  resultDigestSha256: sha256,
}).strict().superRefine(refineResult)

export type CanonicalProfessionalGpuCloudTaskConsumerResult = z.infer<
  typeof resultSchema
>

export interface CanonicalProfessionalGpuCloudTaskConsumer {
  readonly schemaVersion:
    typeof CANONICAL_PROFESSIONAL_GPU_CLOUD_TASK_CONSUMER_VERSION
  readonly privateGoogleOidcReceiver: true
  readonly exactCanonicalRereadBeforeGpuInvocation: true
  readonly duplicateDeliveryMayStartNewInference: false
  readonly automaticNewExecutionAttemptAllowed: false
  readonly customerCreditsMutatedByConsumer: false
  readonly productionAuthority: false
  consumeOne(input: {
    readonly authorizationHeader: unknown
    readonly body: unknown
  }): Promise<CanonicalProfessionalGpuCloudTaskConsumerResult>
}

export function createCanonicalProfessionalGpuCloudTaskConsumer(input: {
  readonly identityVerifier: CanonicalLiveGoogleServiceIdentityVerifier
  readonly expectedAudience: string
  readonly queueRuntimeReadPort: Pick<
    CanonicalProfessionalGpuQueueRuntimeReadPort,
    'readDeliveryConsumption'
  >
  readonly fundedStartAuthorityStore: Pick<
    CanonicalProfessionalGpuFundedStartAuthorityStore,
    'rereadFundedAttemptByExecutionAttemptRef'
  >
  readonly invocationRuntime:
    CanonicalTrackAllSam31AuthenticatedGpuInvocationRuntimePort
  readonly queueTransactionAdapter:
    CanonicalProfessionalGpuFairQueueTransactionAdapter
  readonly now?: () => string
}): CanonicalProfessionalGpuCloudTaskConsumer {
  const expectedAudience = parseExpectedAudience(input.expectedAudience)
  if (!input.queueTransactionAdapter.multiReplicaDurabilityVerified
    || !input.queueTransactionAdapter.sharedDurableTransactionPerformed
    || input.queueTransactionAdapter.databaseBackend !== 'postgres'
    || input.queueTransactionAdapter.browserOrFrontendClientAllowed
    || input.queueTransactionAdapter.automaticTransportRetryAllowed) {
    throw new TypeError(
      'Professional GPU task consumption requires the durable Postgres owner.',
    )
  }
  const now = input.now ?? (() => new Date().toISOString())
  return Object.freeze({
    schemaVersion: CANONICAL_PROFESSIONAL_GPU_CLOUD_TASK_CONSUMER_VERSION,
    privateGoogleOidcReceiver: true as const,
    exactCanonicalRereadBeforeGpuInvocation: true as const,
    duplicateDeliveryMayStartNewInference: false as const,
    automaticNewExecutionAttemptAllowed: false as const,
    customerCreditsMutatedByConsumer: false as const,
    productionAuthority: false as const,
    async consumeOne(untrusted: {
      readonly authorizationHeader: unknown
      readonly body: unknown
    }) {
      assertPlainSerializedData(untrusted.body,
        'professional_gpu_cloud_task_body')
      const identity = assertCanonicalVerifiedServiceIdentity(
        await input.identityVerifier.verifyAuthorizationHeader(
          untrusted.authorizationHeader,
        ),
      )
      if (identity.authenticationMechanism !== 'google_oidc_id_token'
        || identity.principalEmail !==
          CANONICAL_PROFESSIONAL_GPU_CLOUD_TASK_SERVICE_ACCOUNT
        || identity.audience !== expectedAudience) {
        throw new TypeError(
          'Professional GPU Cloud Task identity differs from receiver authority.',
        )
      }
      const body = parseCanonicalProfessionalGpuCloudTaskBody(untrusted.body)
      const observedAt = timestamp.parse(now())
      const delivery = await input.queueRuntimeReadPort
        .readDeliveryConsumption({
          queueId: 'weeditpro-professional-gpu-production-v1',
          runtimeRegion: 'us-central1',
          claimId: body.claimId,
        })
      if (!delivery
        || stableAuthorityStringify(delivery.outboxRecord.cloudTaskSpec.body)
          !== stableAuthorityStringify(body)
        || delivery.claim.queueEntry.queueEntryId !== body.queueEntryId
        || delivery.claim.claimId !== body.claimId
        || delivery.claim.claimHash !== body.claimHash
        || !sameRef(
          delivery.claim.queueEntry.executionAttemptRef,
          body.executionAttemptRef,
        )) {
        throw new TypeError(
          'Professional GPU Cloud Task was not exactly reread from its queue.',
        )
      }
      const common = {
        queueEntryRef: ref(
          body.queueEntryId,
          sha256AuthorityValue(delivery.claim.queueEntry),
        ),
        claimRef: ref(body.claimId, body.claimHash),
        executionAttemptRef: body.executionAttemptRef,
        serviceIdentityEvidenceRef: ref(
          `gpu-task-identity:${identity.subject}`,
          identity.evidenceHash,
        ),
      }
      if (delivery.terminal) {
        return buildResult({
          ...common,
          disposition: 'terminal_replay',
          endpointInvocationResultRef:
            delivery.terminal.terminalEvidenceRef,
          queueTerminalRef: ref(
            `${body.queueEntryId}:terminal`,
            delivery.terminal.terminalHash,
          ),
          invocationDisposition: null,
          queueFinalized: true,
          unresolvedOutcomeBlocksRetry: false,
          observedAt,
        })
      }
      const pair = await input.fundedStartAuthorityStore
        .rereadFundedAttemptByExecutionAttemptRef({
          executionAttemptRef: body.executionAttemptRef,
          at: observedAt,
        })
      if (!pair) {
        throw new TypeError(
          'Professional GPU funded attempt is not available for delivery.',
        )
      }
      const funding = pair.approvedFunding
      const attempt = pair.attemptStart
      const entry = delivery.claim.queueEntry
      if (!sameRef(attempt.executionAttemptRef, body.executionAttemptRef)
        || attempt.routeId !== 'a100_80gb_heavy_primary'
        || attempt.attemptOrdinal !== 1
        || attempt.scope.ownerUserId !== entry.ownerUserId
        || attempt.scope.workspaceId !== entry.workspaceId
        || funding.scope.ownerUserId !== entry.ownerUserId
        || funding.scope.workspaceId !== entry.workspaceId
        || funding.scope.projectId !== entry.projectId
        || !sameRef(funding.approvedSnapshotRef, entry.approvedSnapshotRef)
        || !sameRef(
          funding.approvedWorkItem.approvedWorkItemRef,
          entry.approvedWorkItemRef,
        )
        || !sameRef(
          attempt.approvedWorkItemRef,
          entry.approvedWorkItemRef,
        )) {
        throw new TypeError(
          'Professional GPU queue entry differs from funded attempt authority.',
        )
      }
      const request = buildTrackAllSam31AuthenticatedGpuInvocationRequest({
        requestId: attempt.idempotencyKey,
        approvedSnapshotId: funding.approvedSnapshotRef.id,
        workItemKey: funding.approvedWorkItem.workItemKey,
      })
      const invocation = parseTrackAllSam31AuthenticatedGpuInvocationResult(
        await input.invocationRuntime.invokeApprovedTrackAllWork({
          authenticatedOwnerUserId: funding.scope.ownerUserId,
          workspaceId: funding.scope.workspaceId,
          idempotencyKey: attempt.idempotencyKey,
          request,
        }),
      )
      if (invocation.requestRef.id !== request.requestId
        || invocation.requestRef.contentHash !==
          `sha256:${request.requestDigestSha256}`
        || invocation.workspaceId !== funding.scope.workspaceId
        || invocation.approvedSnapshotId !== funding.approvedSnapshotRef.id
        || invocation.workItemKey !== funding.approvedWorkItem.workItemKey
        || !sameRef(
          invocation.executionAttemptRef,
          body.executionAttemptRef,
        )
        || !sameRef(
          invocation.fundedDispatchAdmissionRef,
          entry.fundedDispatchAdmissionRef,
        )) {
        throw new TypeError(
          'Professional GPU invocation result differs from queued authority.',
        )
      }
      if (invocation.invocationDisposition ===
        'outcome_unknown_requires_reconciliation') {
        return buildResult({
          ...common,
          disposition: 'unknown_outcome_requires_reconciliation',
          endpointInvocationResultRef: invocation.endpointInvocationResultRef,
          queueTerminalRef: null,
          invocationDisposition: invocation.invocationDisposition,
          queueFinalized: false,
          unresolvedOutcomeBlocksRetry: true,
          observedAt,
        })
      }
      const queueDisposition = invocation.invocationDisposition === 'completed'
        ? 'completed' as const
        : 'failed_reconciled' as const
      const finalizeRequest =
        sealCanonicalProfessionalGpuFairQueueTransactionRequest({
          schemaVersion:
            'canonical-professional-gpu-fair-queue-transaction-port-v1',
          operation: 'finalize',
          requestId: `gpu-consume-${sha256AuthorityValue({
            domain: 'canonical_professional_gpu_cloud_task_consumer_v1',
            claimRef: common.claimRef,
            endpointInvocationResultRef:
              invocation.endpointInvocationResultRef,
            queueDisposition,
          })}`,
          queueId: 'weeditpro-professional-gpu-production-v1',
          runtimeRegion: 'us-central1',
          queueEntryId: body.queueEntryId,
          executionAttemptRef: body.executionAttemptRef,
          claimRef: common.claimRef,
          terminalEvidenceRef: invocation.endpointInvocationResultRef,
          disposition: queueDisposition,
          terminalAt: observedAt,
        })
      const finalized = assertCanonicalProfessionalGpuFairQueueTransactionResult(
        await input.queueTransactionAdapter.finalize(finalizeRequest),
      )
      if (finalized.operation !== 'finalize'
        || (finalized.disposition !== 'finalized'
          && finalized.disposition !== 'terminal_replay')
        || finalized.terminal === null
        || finalized.terminal.disposition !== queueDisposition
        || !sameRef(
          finalized.terminal.terminalEvidenceRef,
          invocation.endpointInvocationResultRef,
        )
        || !sameRef(
          finalized.terminal.executionAttemptRef,
          body.executionAttemptRef,
        )) {
        throw new TypeError(
          'Professional GPU queue terminal differs from invocation result.',
        )
      }
      const disposition = invocation.invocationDisposition === 'completed'
        ? 'completed_and_queue_finalized' as const
        : invocation.invocationDisposition === 'failed'
          ? 'failed_and_queue_finalized' as const
          : 'known_not_executed_and_queue_finalized' as const
      return buildResult({
        ...common,
        disposition,
        endpointInvocationResultRef: invocation.endpointInvocationResultRef,
        queueTerminalRef: ref(
          `${body.queueEntryId}:terminal`,
          finalized.terminal.terminalHash,
        ),
        invocationDisposition: invocation.invocationDisposition,
        queueFinalized: true,
        unresolvedOutcomeBlocksRetry: false,
        observedAt,
      })
    },
  })
}

export function assertCanonicalProfessionalGpuCloudTaskConsumerResult(
  value: unknown,
): CanonicalProfessionalGpuCloudTaskConsumerResult {
  assertPlainSerializedData(value, 'professional_gpu_cloud_task_consumer')
  const parsed = resultSchema.parse(value)
  const { resultDigestSha256, ...payload } = parsed
  if (resultDigestSha256 !== sha256AuthorityValue(payload)) {
    throw new TypeError('Professional GPU Cloud Task consumer result changed.')
  }
  return structuredClone(parsed)
}

type ConsumerResultInput = Omit<
  z.input<typeof resultPayloadSchema>,
  | 'schemaVersion'
  | 'source'
  | 'exactTaskOutboxClaimFundingAttemptAndInvocationReread'
  | 'duplicateDeliveryStartedNewInference'
  | 'automaticNewExecutionAttemptAllowed'
  | 'canonicalUsageCostAndCreditSettlementPending'
  | 'customerCreditsMutated'
  | 'qaApproved'
  | 'publicDeliveryAuthorized'
  | 'productionAuthorityGranted'
>

function buildResult(
  input: ConsumerResultInput,
): CanonicalProfessionalGpuCloudTaskConsumerResult {
  const payload = resultWithoutDigestSchema.parse({
    ...input,
    schemaVersion:
      CANONICAL_PROFESSIONAL_GPU_CLOUD_TASK_CONSUMER_RESULT_VERSION,
    source: 'canonical_server_professional_gpu_cloud_task_consumer',
    exactTaskOutboxClaimFundingAttemptAndInvocationReread: true,
    duplicateDeliveryStartedNewInference: false,
    automaticNewExecutionAttemptAllowed: false,
    canonicalUsageCostAndCreditSettlementPending: true,
    customerCreditsMutated: false,
    qaApproved: false,
    publicDeliveryAuthorized: false,
    productionAuthorityGranted: false,
  })
  return assertCanonicalProfessionalGpuCloudTaskConsumerResult({
    ...payload,
    resultDigestSha256: sha256AuthorityValue(payload),
  })
}

function parseExpectedAudience(value: string): string {
  const parsed = z.string().url().max(512).parse(value)
  const url = new URL(parsed)
  if (url.protocol !== 'https:' || url.username || url.password
    || url.search || url.hash || url.pathname !== '/'
    || !url.hostname.endsWith('.run.app') || parsed.endsWith('/')) {
    throw new TypeError('Professional GPU consumer audience is invalid.')
  }
  return parsed
}

function sameRef(
  left: { id: string; version: number; contentHash: string },
  right: { id: string; version: number; contentHash: string },
): boolean {
  return stableAuthorityStringify(left) === stableAuthorityStringify(right)
}

function ref(id: string, hash: string) {
  return evidenceRefSchema.parse({
    id,
    version: 1,
    contentHash: hash.startsWith('sha256:') ? hash : `sha256:${hash}`,
  })
}
