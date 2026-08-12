import { z } from 'zod'

import {
  TRACK_ALL_SAM3_1_AUTHENTICATED_GPU_START_REQUEST_VERSION,
  TRACK_ALL_SAM3_1_AUTHENTICATED_GPU_START_RESULT_VERSION,
  type TrackAllSam31AuthenticatedGpuStartRequest,
  type TrackAllSam31AuthenticatedGpuStartResult,
} from '../../src/types/track-all-sam3_1-gpu-start'
import {
  assertCanonicalProfessionalGpuApprovedFundingObservation,
  assertCanonicalProfessionalGpuAttemptStartAuthority,
  type CanonicalProfessionalGpuApprovedFundingReadPort,
  type CanonicalProfessionalGpuAttemptStartAuthorityReadPort,
  type CanonicalProfessionalGpuPlanPricingAuthorityReadPort,
  type CanonicalProfessionalGpuRuntimeDispatchContextReadPort,
} from './canonical-professional-gpu-plan-funded-dispatch-service'
import {
  createCanonicalProfessionalGpuFundedLifecycleIdentity,
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

export const CANONICAL_TRACK_ALL_SAM3_1_AUTHENTICATED_GPU_START_RUNTIME_VERSION =
  'canonical-track-all-sam3_1-authenticated-gpu-start-runtime-v2' as const

const safeId = z.string().trim().min(1).max(240)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/u)
  .refine((value) => !value.includes('..'))
const sha256 = z.string().regex(/^[a-f0-9]{64}$/u)
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

type AuthenticatedStartInput = Parameters<
  CanonicalTrackAllSam31AuthenticatedGpuStartRuntimePort[
    'startApprovedTrackAllWork'
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

function ref(id: string, hash: string) {
  return Object.freeze({
    id,
    version: 1,
    contentHash: hash.startsWith('sha256:') ? hash : `sha256:${hash}`,
  })
}
