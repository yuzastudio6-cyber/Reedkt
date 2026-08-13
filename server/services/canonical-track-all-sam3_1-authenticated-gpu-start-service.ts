import { z } from 'zod'

import {
  TRACK_ALL_SAM3_1_AUTHENTICATED_GPU_START_REQUEST_VERSION,
  TRACK_ALL_SAM3_1_AUTHENTICATED_GPU_START_RESULT_VERSION,
  type TrackAllSam31AuthenticatedGpuStartRequest,
  type TrackAllSam31AuthenticatedGpuStartResult,
} from '../../src/types/track-all-sam3_1-gpu-start'
import {
  TRACK_ALL_SAM3_1_AUTHENTICATED_GPU_INVOCATION_REQUEST_VERSION,
  TRACK_ALL_SAM3_1_AUTHENTICATED_GPU_INVOCATION_RESULT_VERSION,
  type TrackAllSam31AuthenticatedGpuInvocationRequest,
  type TrackAllSam31AuthenticatedGpuInvocationResult,
} from '../../src/types/track-all-sam3_1-gpu-invocation'
import {
  assertCanonicalProfessionalGpuApprovedFundingObservation,
  assertCanonicalProfessionalGpuAttemptStartAuthority,
  type CanonicalProfessionalGpuApprovedFundingReadPort,
  type CanonicalProfessionalGpuAttemptStartAuthorityReadPort,
  type CanonicalProfessionalGpuPlanPricingAuthorityReadPort,
  type CanonicalProfessionalGpuRuntimeDispatchContextReadPort,
} from './canonical-professional-gpu-plan-funded-dispatch-service'
import {
  assertCanonicalProfessionalGpuFundedLaunchBinding,
  assertCanonicalProfessionalGpuFundedPrelaunch,
  createCanonicalProfessionalGpuFundedLifecycleIdentity,
  type CanonicalProfessionalGpuFundedLaunchBinding,
  type CanonicalProfessionalGpuFundedJobLifecycleStore,
} from './canonical-professional-gpu-plan-funded-job-lifecycle-service'
import type {
  CanonicalProfessionalGpuJobLifecycleStore,
  CanonicalProfessionalGpuRuntimeReleaseReadPort,
} from './canonical-professional-gpu-job-lifecycle-service'
import {
  startCanonicalSam31PlanFundedGpuJob,
  type CanonicalSam31FundedGpuRuntimeComposition,
} from './canonical-sam3_1-funded-gpu-runtime-composition'
import {
  assertPlainSerializedData,
} from './canonical-professional-gpu-job-lifecycle-service'
import {
  sha256AuthorityValue,
} from './private-edit-authority-store'
import type {
  CanonicalSam31CurrentA100CustomerDispatchReadinessReadPort,
} from './canonical-sam3_1-current-a100-customer-dispatch-readiness'
import type {
  CanonicalSam31CurrentVertexCustomerInvocationPort,
  CanonicalSam31CurrentVertexCustomerInvocationResult,
} from './canonical-sam3_1-current-vertex-serving-invocation-service'

export const CANONICAL_TRACK_ALL_SAM3_1_AUTHENTICATED_GPU_START_RUNTIME_VERSION =
  'canonical-track-all-sam3_1-authenticated-gpu-start-runtime-v2' as const
export const CANONICAL_TRACK_ALL_SAM3_1_AUTHENTICATED_GPU_INVOCATION_RUNTIME_VERSION =
  'canonical-track-all-sam3_1-authenticated-gpu-invocation-runtime-v1' as const

const safeId = z.string().trim().min(1).max(240)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/u)
  .refine((value) => !value.includes('..'))
const evidenceId = z.string().trim().min(1).max(240)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:@/-]*$/u)
  .refine((value) => !value.includes('..'))
const sha256 = z.string().regex(/^[a-f0-9]{64}$/u)
const prefixedSha256 = z.string().regex(/^sha256:[a-f0-9]{64}$/u)
const evidenceRefSchema = z.object({
  id: evidenceId,
  version: z.number().int().positive().safe(),
  contentHash: prefixedSha256,
}).strict()
const requestWithoutDigestSchema = z.object({
  schemaVersion: z.literal(
    TRACK_ALL_SAM3_1_AUTHENTICATED_GPU_START_REQUEST_VERSION,
  ),
  requestId: safeId,
  approvedSnapshotId: safeId,
  workItemKey: safeId,
  userTriggeredAfterApprovedPlan: z.literal(true),
  browserOrCallerExecutionMaterialAccepted: z.literal(false),
  callerSelectedGpuRouteModelImageCommandOrPriceAccepted: z.literal(false),
}).strict()
const requestSchema = requestWithoutDigestSchema.extend({
  requestDigestSha256: sha256,
}).strict()
const invocationRequestWithoutDigestSchema = z.object({
  schemaVersion: z.literal(
    TRACK_ALL_SAM3_1_AUTHENTICATED_GPU_INVOCATION_REQUEST_VERSION,
  ),
  requestId: safeId,
  approvedSnapshotId: safeId,
  workItemKey: safeId,
  userTriggeredAfterApprovedPlan: z.literal(true),
  browserOrCallerExecutionMaterialAccepted: z.literal(false),
  callerSelectedEndpointGpuModelImageCommandOrPriceAccepted:
    z.literal(false),
}).strict()
const invocationRequestSchema = invocationRequestWithoutDigestSchema.extend({
  requestDigestSha256: sha256,
}).strict()
const invocationResultSchema = z.object({
  schemaVersion: z.literal(
    TRACK_ALL_SAM3_1_AUTHENTICATED_GPU_INVOCATION_RESULT_VERSION,
  ),
  requestRef: evidenceRefSchema,
  workspaceId: safeId,
  approvedSnapshotId: safeId,
  workItemKey: safeId,
  fundedDispatchAdmissionRef: evidenceRefSchema,
  prelaunchAuthorizationRef: evidenceRefSchema,
  fixedTaskPreparationBridgeRef: evidenceRefSchema,
  endpointInvocationAttemptRef: evidenceRefSchema,
  endpointCallStartRef: evidenceRefSchema,
  endpointInvocationResultRef: evidenceRefSchema,
  executionAttemptRef: evidenceRefSchema,
  runtimeResponseRef: evidenceRefSchema.nullable(),
  invocationDisposition: z.enum([
    'completed',
    'failed',
    'not_executed_scale_from_zero_trigger',
    'outcome_unknown_requires_reconciliation',
  ]),
  providerOutcome: z.enum(['executed', 'not_executed', 'unknown']),
  runtimeStatus: z.enum(['completed', 'failed']).nullable(),
  routeId: z.literal('a100_80gb_heavy_primary'),
  accelerator: z.literal('nvidia_a100_80gb'),
  userTriggeredScaleFromZero: z.literal(true),
  currentDedicatedEndpointInvocation: z.literal(true),
  historicalCloudJobCustomerDispatchUsed: z.literal(false),
  currentEndpointReadinessRereadBeforeInvocation: z.literal(true),
  approvedSourceMaterialRereadByCanonicalServer: z.literal(true),
  fundedPricingReservationAndAttemptRereadBeforeInvocation: z.literal(true),
  accountEffectiveServingRateRereadBeforeInvocation: z.literal(true),
  automaticRetryAllowed: z.literal(false),
  unresolvedOutcomeBlocksRetry: z.boolean(),
  canonicalServingWindowUsageCostAndCreditSettlementPending: z.literal(true),
  callerSuppliedMediaPromptEndpointModelRouteImageCommandOrPriceAccepted:
    z.literal(false),
  customerCreditsMutated: z.literal(false),
  qaApproved: z.literal(false),
  publicDeliveryAuthorized: z.literal(false),
  productionAuthorityGranted: z.literal(false),
  resultDigestSha256: sha256,
}).strict().superRefine((result, context) => {
  const executed = result.providerOutcome === 'executed'
  const notExecuted = result.providerOutcome === 'not_executed'
  const unknown = result.providerOutcome === 'unknown'
  if (
    executed !== (result.invocationDisposition === 'completed'
      || result.invocationDisposition === 'failed')
    || notExecuted !== (result.invocationDisposition ===
      'not_executed_scale_from_zero_trigger')
    || unknown !== (result.invocationDisposition ===
      'outcome_unknown_requires_reconciliation')
    || executed !== (result.runtimeResponseRef !== null)
    || executed !== (result.runtimeStatus !== null)
    || unknown !== result.unresolvedOutcomeBlocksRetry
    || (executed && result.runtimeStatus !== result.invocationDisposition)
  ) context.addIssue({
    code: 'custom',
    message: 'Track All SAM 3.1 invocation result lost terminal truth.',
  })
})

export interface CanonicalTrackAllSam31AuthenticatedGpuStartRuntimePort {
  readonly schemaVersion:
    typeof CANONICAL_TRACK_ALL_SAM3_1_AUTHENTICATED_GPU_START_RUNTIME_VERSION
  readonly routeOwnsGpuPlacementOrPricing: false
  readonly currentA100CustomerDispatchReadinessRereadRequired: true
  readonly rawCloudLaunchPortExposed: false
  startApprovedTrackAllWork(input: {
    readonly authenticatedOwnerUserId: string
    readonly workspaceId: string
    readonly idempotencyKey: string
    readonly request: unknown
  }): Promise<TrackAllSam31AuthenticatedGpuStartResult>
}

export interface CanonicalTrackAllSam31AuthenticatedGpuInvocationRuntimePort {
  readonly schemaVersion:
    typeof CANONICAL_TRACK_ALL_SAM3_1_AUTHENTICATED_GPU_INVOCATION_RUNTIME_VERSION
  readonly currentDedicatedEndpointInvocation: true
  readonly historicalCloudJobCustomerDispatchUsed: false
  readonly routeOwnsGpuPlacementOrPricing: false
  readonly currentA100CustomerDispatchReadinessRereadRequired: true
  readonly rawProviderInvocationPortExposed: false
  invokeApprovedTrackAllWork(input: {
    readonly authenticatedOwnerUserId: string
    readonly workspaceId: string
    readonly idempotencyKey: string
    readonly request: unknown
  }): Promise<TrackAllSam31AuthenticatedGpuInvocationResult>
}

type AuthenticatedStartInput = Parameters<
  CanonicalTrackAllSam31AuthenticatedGpuStartRuntimePort[
    'startApprovedTrackAllWork'
  ]
>[0]
type AuthenticatedInvocationInput = Parameters<
  CanonicalTrackAllSam31AuthenticatedGpuInvocationRuntimePort[
    'invokeApprovedTrackAllWork'
  ]
>[0]
type FundingReadInput = Parameters<
  CanonicalProfessionalGpuApprovedFundingReadPort['rereadApprovedFunding']
>[0]
type AttemptReadInput = Parameters<
  CanonicalProfessionalGpuAttemptStartAuthorityReadPort[
    'rereadCreateOnlyAttemptStart'
  ]
>[0]
const authenticatedStartInputSchema = z.object({
  authenticatedOwnerUserId: safeId,
  workspaceId: safeId,
  idempotencyKey: safeId,
  request: z.unknown(),
}).strict()

export function buildTrackAllSam31AuthenticatedGpuStartRequest(input: {
  readonly requestId: string
  readonly approvedSnapshotId: string
  readonly workItemKey: string
}): TrackAllSam31AuthenticatedGpuStartRequest {
  assertPlainSerializedData(input, 'track_all_sam31_gpu_start_request_input')
  const payload = requestWithoutDigestSchema.parse({
    schemaVersion:
      TRACK_ALL_SAM3_1_AUTHENTICATED_GPU_START_REQUEST_VERSION,
    requestId: input.requestId,
    approvedSnapshotId: input.approvedSnapshotId,
    workItemKey: input.workItemKey,
    userTriggeredAfterApprovedPlan: true,
    browserOrCallerExecutionMaterialAccepted: false,
    callerSelectedGpuRouteModelImageCommandOrPriceAccepted: false,
  })
  return Object.freeze(requestSchema.parse({
    ...payload,
    requestDigestSha256: sha256AuthorityValue(payload),
  }))
}

export function parseTrackAllSam31AuthenticatedGpuStartRequest(
  value: unknown,
): TrackAllSam31AuthenticatedGpuStartRequest {
  assertPlainSerializedData(value, 'track_all_sam31_gpu_start_request')
  const request = requestSchema.parse(value)
  const { requestDigestSha256, ...payload } = request
  if (requestDigestSha256 !== sha256AuthorityValue(payload)) {
    throw new TypeError('Track All SAM 3.1 start request digest is invalid.')
  }
  return structuredClone(request)
}

export function buildTrackAllSam31AuthenticatedGpuInvocationRequest(input: {
  readonly requestId: string
  readonly approvedSnapshotId: string
  readonly workItemKey: string
}): TrackAllSam31AuthenticatedGpuInvocationRequest {
  assertPlainSerializedData(input,
    'track_all_sam31_gpu_invocation_request_input')
  const payload = invocationRequestWithoutDigestSchema.parse({
    schemaVersion:
      TRACK_ALL_SAM3_1_AUTHENTICATED_GPU_INVOCATION_REQUEST_VERSION,
    requestId: input.requestId,
    approvedSnapshotId: input.approvedSnapshotId,
    workItemKey: input.workItemKey,
    userTriggeredAfterApprovedPlan: true,
    browserOrCallerExecutionMaterialAccepted: false,
    callerSelectedEndpointGpuModelImageCommandOrPriceAccepted: false,
  })
  return Object.freeze(invocationRequestSchema.parse({
    ...payload,
    requestDigestSha256: sha256AuthorityValue(payload),
  }))
}

export function parseTrackAllSam31AuthenticatedGpuInvocationRequest(
  value: unknown,
): TrackAllSam31AuthenticatedGpuInvocationRequest {
  assertPlainSerializedData(value, 'track_all_sam31_gpu_invocation_request')
  const request = invocationRequestSchema.parse(value)
  const { requestDigestSha256, ...payload } = request
  if (requestDigestSha256 !== sha256AuthorityValue(payload)) {
    throw new TypeError(
      'Track All SAM 3.1 endpoint invocation request digest is invalid.',
    )
  }
  return structuredClone(request)
}

export function parseTrackAllSam31AuthenticatedGpuInvocationResult(
  value: unknown,
): TrackAllSam31AuthenticatedGpuInvocationResult {
  assertPlainSerializedData(value, 'track_all_sam31_gpu_invocation_result')
  const result = invocationResultSchema.parse(value)
  const { resultDigestSha256, ...payload } = result
  if (resultDigestSha256 !== sha256AuthorityValue(payload)) {
    throw new TypeError(
      'Track All SAM 3.1 endpoint invocation result digest is invalid.',
    )
  }
  return structuredClone(result)
}

/**
 * Authenticated orchestration adapter. It receives identifiers only, rereads
 * the immutable funding/attempt authorities, derives every lifecycle ID on the
 * server, and enters only the branded SAM 3.1 funded runtime composition.
 */
export function createCanonicalTrackAllSam31AuthenticatedGpuStartRuntime(
  input: {
    readonly pricingAuthorityReadPort:
      CanonicalProfessionalGpuPlanPricingAuthorityReadPort
    readonly approvedFundingReadPort:
      CanonicalProfessionalGpuApprovedFundingReadPort
    readonly attemptStartReadPort:
      CanonicalProfessionalGpuAttemptStartAuthorityReadPort
    readonly runtimeContextReadPort:
      CanonicalProfessionalGpuRuntimeDispatchContextReadPort
    readonly a100CustomerDispatchReadinessReadPort:
      CanonicalSam31CurrentA100CustomerDispatchReadinessReadPort
    readonly releaseReadPort: CanonicalProfessionalGpuRuntimeReleaseReadPort
    readonly runtimeComposition: CanonicalSam31FundedGpuRuntimeComposition
    readonly lifecycleStore: CanonicalProfessionalGpuJobLifecycleStore
    readonly fundedLifecycleStore:
      CanonicalProfessionalGpuFundedJobLifecycleStore
    readonly now?: () => string
  },
): CanonicalTrackAllSam31AuthenticatedGpuStartRuntimePort {
  const now = input.now ?? (() => new Date().toISOString())
  return Object.freeze({
    schemaVersion:
      CANONICAL_TRACK_ALL_SAM3_1_AUTHENTICATED_GPU_START_RUNTIME_VERSION,
    routeOwnsGpuPlacementOrPricing: false as const,
    currentA100CustomerDispatchReadinessRereadRequired: true as const,
    rawCloudLaunchPortExposed: false as const,
    async startApprovedTrackAllWork(untrusted: AuthenticatedStartInput) {
      assertPlainSerializedData(untrusted,
        'track_all_sam31_authenticated_start_input')
      const trusted = authenticatedStartInputSchema.parse(untrusted)
      const authenticatedOwnerUserId = trusted.authenticatedOwnerUserId
      const workspaceId = trusted.workspaceId
      const idempotencyKey = trusted.idempotencyKey
      const request = parseTrackAllSam31AuthenticatedGpuStartRequest(
        trusted.request,
      )
      if (request.requestId !== idempotencyKey) {
        throw new TypeError(
          'Track All SAM 3.1 request differs from its idempotency key.',
        )
      }
      const startedAt = z.string().datetime({ offset: true }).parse(now())
      const [untrustedFunding, untrustedAttempt] = await Promise.all([
        input.approvedFundingReadPort.rereadApprovedFunding({
          workspaceId,
          snapshotId: request.approvedSnapshotId,
          workItemKey: request.workItemKey,
          at: startedAt,
        }),
        input.attemptStartReadPort.rereadCreateOnlyAttemptStart({
          workspaceId,
          snapshotId: request.approvedSnapshotId,
          workItemKey: request.workItemKey,
          at: startedAt,
        }),
      ])
      const funding = assertCanonicalProfessionalGpuApprovedFundingObservation(
        untrustedFunding,
        startedAt,
      )
      const attempt = assertCanonicalProfessionalGpuAttemptStartAuthority(
        untrustedAttempt,
        startedAt,
      )
      if (
        funding.scope.ownerUserId !== authenticatedOwnerUserId
        || attempt.scope.ownerUserId !== authenticatedOwnerUserId
        || funding.scope.workspaceId !== workspaceId
        || attempt.scope.workspaceId !== workspaceId
        || funding.approvedSnapshotRef.id !== request.approvedSnapshotId
        || attempt.approvedSnapshotRef.id !== request.approvedSnapshotId
        || funding.approvedWorkItem.workItemKey !== request.workItemKey
        || attempt.approvedWorkItemRef.id !==
          funding.approvedWorkItem.approvedWorkItemRef.id
        || attempt.idempotencyKey !== idempotencyKey
        || !funding.approvedWorkItem.approvedToolIds.includes('sam3_1')
      ) throw new TypeError(
        'Track All SAM 3.1 start scope is not the authenticated approved work.',
      )
      const identity = createCanonicalProfessionalGpuFundedLifecycleIdentity({
        attemptStartAuthority: attempt,
      })
      const exactFundingReadPort:
        CanonicalProfessionalGpuApprovedFundingReadPort = Object.freeze({
          async rereadApprovedFunding(query: FundingReadInput) {
            const reread = assertCanonicalProfessionalGpuApprovedFundingObservation(
              await input.approvedFundingReadPort.rereadApprovedFunding(query),
              query.at,
            )
            if (reread.observationId !== funding.observationId
              || reread.observationHash !== funding.observationHash) {
              throw new TypeError(
                'Approved Track All funding changed between authentication and launch.',
              )
            }
            return reread
          },
        })
      const exactAttemptReadPort:
        CanonicalProfessionalGpuAttemptStartAuthorityReadPort = Object.freeze({
          async rereadCreateOnlyAttemptStart(query: AttemptReadInput) {
            const reread = assertCanonicalProfessionalGpuAttemptStartAuthority(
              await input.attemptStartReadPort
                .rereadCreateOnlyAttemptStart(query),
              query.at,
            )
            if (reread.attemptAuthorityId !== attempt.attemptAuthorityId
              || reread.attemptAuthorityHash !== attempt.attemptAuthorityHash) {
              throw new TypeError(
                'Track All attempt changed between authentication and launch.',
              )
            }
            return reread
          },
        })
      const started = await startCanonicalSam31PlanFundedGpuJob({
        ...identity,
        workspaceId,
        snapshotId: request.approvedSnapshotId,
        workItemKey: request.workItemKey,
        pricingAuthorityReadPort: input.pricingAuthorityReadPort,
        approvedFundingReadPort: exactFundingReadPort,
        attemptStartReadPort: exactAttemptReadPort,
        runtimeContextReadPort: input.runtimeContextReadPort,
        a100CustomerDispatchReadinessReadPort:
          input.a100CustomerDispatchReadinessReadPort,
        releaseReadPort: input.releaseReadPort,
        runtimeComposition: input.runtimeComposition,
        lifecycleStore: input.lifecycleStore,
        fundedLifecycleStore: input.fundedLifecycleStore,
        admittedAt: startedAt,
        admissionExpiresAt: attempt.expiresAt,
        startedAt,
      })
      return buildResult({ request, workspaceId, started })
    },
  })
}

/**
 * Current A100 endpoint adapter. The existing funded lifecycle remains the
 * one writer for admission consumption, fixed task preparation, and exact
 * task persistence. Its intentionally rejected historical Cloud Job bridge
 * is then followed by the separately typed dedicated-endpoint invocation.
 */
export function createCanonicalTrackAllSam31AuthenticatedGpuInvocationRuntime(
  input: {
    readonly fundedPreparationRuntime:
      CanonicalTrackAllSam31AuthenticatedGpuStartRuntimePort
    readonly fundedLifecycleReadPort:
      Pick<CanonicalProfessionalGpuFundedJobLifecycleStore,
        'rereadPrelaunchAuthorization' | 'rereadLaunchBinding'>
    readonly attemptStartReadPort:
      CanonicalProfessionalGpuAttemptStartAuthorityReadPort
    readonly currentVertexInvocationPort:
      CanonicalSam31CurrentVertexCustomerInvocationPort
    readonly now?: () => string
  },
): CanonicalTrackAllSam31AuthenticatedGpuInvocationRuntimePort {
  const now = input.now ?? (() => new Date().toISOString())
  return Object.freeze({
    schemaVersion:
      CANONICAL_TRACK_ALL_SAM3_1_AUTHENTICATED_GPU_INVOCATION_RUNTIME_VERSION,
    currentDedicatedEndpointInvocation: true as const,
    historicalCloudJobCustomerDispatchUsed: false as const,
    routeOwnsGpuPlacementOrPricing: false as const,
    currentA100CustomerDispatchReadinessRereadRequired: true as const,
    rawProviderInvocationPortExposed: false as const,
    async invokeApprovedTrackAllWork(
      untrusted: AuthenticatedInvocationInput,
    ) {
      assertPlainSerializedData(untrusted,
        'track_all_sam31_authenticated_invocation_input')
      const trusted = authenticatedStartInputSchema.parse(untrusted)
      const request = parseTrackAllSam31AuthenticatedGpuInvocationRequest(
        trusted.request,
      )
      if (request.requestId !== trusted.idempotencyKey) {
        throw new TypeError(
          'Track All SAM 3.1 invocation differs from its idempotency key.',
        )
      }
      const at = z.string().datetime({ offset: true }).parse(now())
      const attempt = assertCanonicalProfessionalGpuAttemptStartAuthority(
        await input.attemptStartReadPort.rereadCreateOnlyAttemptStart({
          workspaceId: trusted.workspaceId,
          snapshotId: request.approvedSnapshotId,
          workItemKey: request.workItemKey,
          at,
        }),
        at,
      )
      if (attempt.scope.ownerUserId !== trusted.authenticatedOwnerUserId
        || attempt.scope.workspaceId !== trusted.workspaceId
        || attempt.approvedSnapshotRef.id !== request.approvedSnapshotId
        || attempt.idempotencyKey !== trusted.idempotencyKey
        || attempt.routeId !== 'a100_80gb_heavy_primary'
        || attempt.attemptOrdinal !== 1) {
        throw new TypeError(
          'Track All SAM 3.1 invocation is not the authenticated A100 attempt.',
        )
      }
      const identity = createCanonicalProfessionalGpuFundedLifecycleIdentity({
        attemptStartAuthority: attempt,
      })
      const existingPrelaunch = await input.fundedLifecycleReadPort
        .rereadPrelaunchAuthorization({
          prelaunchAuthorizationId: identity.prelaunchAuthorizationId,
        })
      const prepared = existingPrelaunch === null
        ? await input.fundedPreparationRuntime.startApprovedTrackAllWork({
          authenticatedOwnerUserId: trusted.authenticatedOwnerUserId,
          workspaceId: trusted.workspaceId,
          idempotencyKey: trusted.idempotencyKey,
          request: buildTrackAllSam31AuthenticatedGpuStartRequest({
            requestId: request.requestId,
            approvedSnapshotId: request.approvedSnapshotId,
            workItemKey: request.workItemKey,
          }),
        })
        : null
      const prelaunch = assertCanonicalProfessionalGpuFundedPrelaunch(
        await input.fundedLifecycleReadPort.rereadPrelaunchAuthorization({
          prelaunchAuthorizationId: identity.prelaunchAuthorizationId,
        }),
      )
      const launchBinding =
        assertCanonicalProfessionalGpuFundedLaunchBinding(
          await input.fundedLifecycleReadPort.rereadLaunchBinding({
            launchBindingId: identity.launchBindingId,
          }),
        )
      if (prelaunch.attemptStartAuthorityRef.id !== attempt.attemptAuthorityId
        || prelaunch.attemptStartAuthorityRef.contentHash !==
          `sha256:${attempt.attemptAuthorityHash}`
        || launchBinding.prelaunchAuthorizationRef.id !==
          prelaunch.prelaunchAuthorizationId
        || launchBinding.prelaunchAuthorizationRef.contentHash !==
          `sha256:${prelaunch.prelaunchAuthorizationHash}`
        || launchBinding.routeId !== 'a100_80gb_heavy_primary'
        || launchBinding.accelerator !== 'nvidia_a100_80gb'
        || launchBinding.launchDisposition !==
          'job_rejected_before_creation'
        || launchBinding.providerInferenceOrSubstantiveWorkKnownExecuted !==
          'not_executed'
        || (prepared !== null && (
          prepared.prelaunchAuthorizationRef.contentHash !==
            launchBinding.prelaunchAuthorizationRef.contentHash
          || prepared.launchBindingRef.contentHash !==
            `sha256:${launchBinding.launchBindingHash}`
        ))) {
        throw new TypeError(
          'Current SAM 3.1 fixed-task preparation exact reread changed.',
        )
      }
      const toolAdmission = prelaunch.fundedDispatchAdmission
        .toolDispatchAdmission
      const invocationId = `${toolAdmission.admissionId}.execution-envelope`
      const invoked = await input.currentVertexInvocationPort.invokeOne({
        invocationId,
        dispatchAdmissionDigestSha256: toolAdmission.admissionHash,
      })
      return buildInvocationResult({
        request,
        workspaceId: trusted.workspaceId,
        prelaunch,
        launchBinding,
        invoked,
      })
    },
  })
}

function buildResult(input: {
  readonly request: TrackAllSam31AuthenticatedGpuStartRequest
  readonly workspaceId: string
  readonly started: Awaited<ReturnType<
    typeof startCanonicalSam31PlanFundedGpuJob
  >>
}): TrackAllSam31AuthenticatedGpuStartResult {
  const funded = input.started.prelaunchAuthorization
    .fundedDispatchAdmission
  const launch = input.started.launch
  const binding = input.started.launchBinding
  if (
    funded.toolDispatchAdmission.toolId !== 'sam3_1'
    || (launch.routeId !== 'a100_80gb_heavy_primary'
      && launch.routeId !== 'l4_heavy_fallback')
    || (launch.accelerator !== 'nvidia_a100_80gb'
      && launch.accelerator !== 'nvidia_l4')
  ) throw new TypeError('Track All start returned a non-SAM 3.1 GPU launch.')
  const payload = {
    schemaVersion:
      TRACK_ALL_SAM3_1_AUTHENTICATED_GPU_START_RESULT_VERSION,
    requestRef: ref(input.request.requestId, input.request.requestDigestSha256),
    workspaceId: input.workspaceId,
    approvedSnapshotId: input.request.approvedSnapshotId,
    workItemKey: input.request.workItemKey,
    fundedDispatchAdmissionRef: ref(
      funded.fundedAdmissionId,
      funded.fundedAdmissionHash,
    ),
    prelaunchAuthorizationRef: ref(
      input.started.prelaunchAuthorization.prelaunchAuthorizationId,
      input.started.prelaunchAuthorization.prelaunchAuthorizationHash,
    ),
    launchRef: ref(launch.launchRecordId, launch.launchHash),
    launchBindingRef: ref(binding.launchBindingId, binding.launchBindingHash),
    launchDisposition: launch.launchDisposition,
    routeId: launch.routeId,
    accelerator: launch.accelerator,
    userTriggeredScaleFromZero: true as const,
    a100HeavyPrimaryAndSeparatelyQualifiedL4Fallback: true as const,
    approvedSourceMaterialRereadByCanonicalServer: true as const,
    fundedPricingAndReservationRereadBeforeLaunch: true as const,
    rawCloudLaunchPortExposed: false as const,
    callerSuppliedMediaPromptModelRouteImageCommandOrPriceAccepted:
      false as const,
    customerCreditsMutated: false as const,
    qaApproved: false as const,
    publicDeliveryAuthorized: false as const,
    productionAuthorityGranted: false as const,
  }
  return Object.freeze({
    ...payload,
    resultDigestSha256: sha256AuthorityValue(payload),
  })
}

function buildInvocationResult(input: {
  readonly request: TrackAllSam31AuthenticatedGpuInvocationRequest
  readonly workspaceId: string
  readonly prelaunch: ReturnType<
    typeof assertCanonicalProfessionalGpuFundedPrelaunch
  >
  readonly launchBinding: CanonicalProfessionalGpuFundedLaunchBinding
  readonly invoked: CanonicalSam31CurrentVertexCustomerInvocationResult
}): TrackAllSam31AuthenticatedGpuInvocationResult {
  const invocationId = input.invoked.invocationId
  if (input.launchBinding.routeId !== 'a100_80gb_heavy_primary'
    || input.launchBinding.accelerator !== 'nvidia_a100_80gb'
    || input.launchBinding.launchDisposition !==
      'job_rejected_before_creation'
    || input.invoked.executionAttemptRef.id.length === 0
    || input.invoked.attemptRef.id.length === 0
    || input.invoked.callStartRef.id.length === 0) {
    throw new TypeError(
      'Track All SAM 3.1 endpoint result lost its current A100 lineage.',
    )
  }
  const payload = {
    schemaVersion:
      TRACK_ALL_SAM3_1_AUTHENTICATED_GPU_INVOCATION_RESULT_VERSION,
    requestRef: ref(input.request.requestId,
      input.request.requestDigestSha256),
    workspaceId: input.workspaceId,
    approvedSnapshotId: input.request.approvedSnapshotId,
    workItemKey: input.request.workItemKey,
    fundedDispatchAdmissionRef: input.prelaunch.fundedDispatchAdmissionRef,
    prelaunchAuthorizationRef: ref(
      input.prelaunch.prelaunchAuthorizationId,
      input.prelaunch.prelaunchAuthorizationHash,
    ),
    fixedTaskPreparationBridgeRef: input.launchBinding.launchRef,
    endpointInvocationAttemptRef: input.invoked.attemptRef,
    endpointCallStartRef: input.invoked.callStartRef,
    endpointInvocationResultRef: ref(invocationId, input.invoked.resultHash),
    executionAttemptRef: input.invoked.executionAttemptRef,
    runtimeResponseRef: input.invoked.runtimeResponseRef,
    invocationDisposition: input.invoked.disposition,
    providerOutcome: input.invoked.providerOutcome,
    runtimeStatus: input.invoked.runtimeStatus,
    routeId: 'a100_80gb_heavy_primary' as const,
    accelerator: 'nvidia_a100_80gb' as const,
    userTriggeredScaleFromZero: true as const,
    currentDedicatedEndpointInvocation: true as const,
    historicalCloudJobCustomerDispatchUsed: false as const,
    currentEndpointReadinessRereadBeforeInvocation: true as const,
    approvedSourceMaterialRereadByCanonicalServer: true as const,
    fundedPricingReservationAndAttemptRereadBeforeInvocation: true as const,
    accountEffectiveServingRateRereadBeforeInvocation: true as const,
    automaticRetryAllowed: false as const,
    unresolvedOutcomeBlocksRetry: input.invoked.unresolvedOutcomeBlocksRetry,
    canonicalServingWindowUsageCostAndCreditSettlementPending: true as const,
    callerSuppliedMediaPromptEndpointModelRouteImageCommandOrPriceAccepted:
      false as const,
    customerCreditsMutated: false as const,
    qaApproved: false as const,
    publicDeliveryAuthorized: false as const,
    productionAuthorityGranted: false as const,
  }
  return Object.freeze({
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
