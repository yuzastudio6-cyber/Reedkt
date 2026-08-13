import assert from 'node:assert/strict'
import { once } from 'node:events'
import { createServer } from 'node:http'

import {
  TRACK_ALL_SAM3_1_AUTHENTICATED_GPU_START_ROUTE_ID,
  type TrackAllSam31AuthenticatedGpuStartRequest,
  type TrackAllSam31AuthenticatedGpuStartResult,
} from '../../src/types/track-all-sam3_1-gpu-start'
import {
  TRACK_ALL_SAM3_1_AUTHENTICATED_GPU_INVOCATION_ROUTE_ID,
  type TrackAllSam31AuthenticatedGpuInvocationRequest,
  type TrackAllSam31AuthenticatedGpuInvocationResult,
} from '../../src/types/track-all-sam3_1-gpu-invocation'
import {
  TRACK_ALL_SAM3_1_AUTHENTICATED_GPU_QUEUED_START_ROUTE_ID,
  type TrackAllSam31AuthenticatedGpuQueuedStartRequest,
  type TrackAllSam31AuthenticatedGpuQueuedStartResult,
} from '../../src/types/track-all-sam3_1-gpu-queued-start'
import {
  TRACK_ALL_SAM3_1_L4_TASK_QA_GPU_START_ROUTE_ID,
  type TrackAllSam31L4TaskQaGpuStartRequest,
  type TrackAllSam31L4TaskQaGpuStartResult,
} from '../../src/types/track-all-sam3_1-l4-task-qa-gpu-start'
import {
  TRACK_ALL_SAM3_1_L4_TASK_QA_GPU_QUEUED_START_ROUTE_ID,
  type TrackAllSam31L4TaskQaGpuQueuedStartRequest,
  type TrackAllSam31L4TaskQaGpuQueuedStartResult,
} from '../../src/types/track-all-sam3_1-l4-task-qa-gpu-queued-start'
import {
  TRACK_ALL_SAM3_1_CAPTION_EVIDENCE_FINALIZATION_ROUTE_ID,
  type TrackAllSam31CaptionEvidenceFinalizationRequest,
  type TrackAllSam31CaptionEvidenceFinalizationResult,
} from '../../src/types/track-all-sam3_1-caption-evidence-finalization'
import {
  TRACK_ALL_SAM3_1_TASK_QA_EVIDENCE_FINALIZATION_ROUTE_ID,
  type TrackAllSam31TaskQaEvidenceFinalizationRequest,
  type TrackAllSam31TaskQaEvidenceFinalizationResult,
} from '../../src/types/track-all-sam3_1-task-qa-evidence-finalization'
import { getApiRouteById } from '../../src/backend/api/api-route-registry'
import { createReeditProApiApp } from '../app'
import { loadRuntimeEnv } from '../config/env'
import {
  buildTrackAllSam31AuthenticatedGpuInvocationRequest,
  buildTrackAllSam31AuthenticatedGpuStartRequest,
} from '../services/canonical-track-all-sam3_1-authenticated-gpu-start-service'
import {
  buildTrackAllSam31AuthenticatedGpuQueuedStartRequest,
} from '../services/canonical-track-all-sam3_1-queued-gpu-start-service'
import {
  buildTrackAllSam31L4TaskQaGpuStartRequest,
} from '../services/canonical-track-all-sam3_1-l4-task-qa-authenticated-start-service'
import {
  buildTrackAllSam31L4TaskQaGpuQueuedStartRequest,
} from '../services/canonical-track-all-sam3_1-l4-task-qa-queued-start-service'
import {
  buildTrackAllSam31CaptionEvidenceFinalizationRequest,
} from '../services/canonical-track-all-sam3_1-caption-evidence-finalization-service'
import {
  buildTrackAllSam31TaskQaEvidenceFinalizationRequest,
} from '../services/canonical-track-all-sam3_1-task-qa-evidence-finalization-service'
import { sha256AuthorityValue } from
  '../services/private-edit-authority-store'
import type {
  CanonicalProfessionalGpuCloudTaskSchedulerResult,
} from '../services/canonical-professional-gpu-cloud-task-scheduler-service'
import {
  CANONICAL_PROFESSIONAL_GPU_CLOUD_TASK_CONSUMER_PATH,
} from '../services/canonical-professional-gpu-cloud-task-dispatch'
import type {
  CanonicalProfessionalGpuCloudTaskConsumerResult,
} from '../services/canonical-professional-gpu-cloud-task-consumer-service'

const internalToken = 'track-all-sam31-route-smoke-token'
const workspaceId = 'workspace-track-all-sam31-route'
const request = buildTrackAllSam31AuthenticatedGpuStartRequest({
  requestId: 'track-all-sam31-user-trigger-1',
  approvedSnapshotId: 'approved-snapshot-track-all-1',
  workItemKey: 'approved-track-all-work-1',
})
const invocationRequest =
  buildTrackAllSam31AuthenticatedGpuInvocationRequest({
    requestId: 'track-all-sam31-user-invocation-1',
    approvedSnapshotId: 'approved-snapshot-track-all-1',
    workItemKey: 'approved-track-all-work-1',
  })
const queuedStartRequest =
  buildTrackAllSam31AuthenticatedGpuQueuedStartRequest({
    requestId: 'track-all-sam31-user-queued-start-1',
    approvedSnapshotId: 'approved-snapshot-track-all-1',
    workItemKey: 'approved-track-all-work-1',
  })
const evidenceRef = (id: string) => ({
  id,
  version: 'fixture-v1',
  contentHash: sha256AuthorityValue(id),
})
const l4TaskQaRequest = buildTrackAllSam31L4TaskQaGpuStartRequest({
  requestId: 'track-all-sam31-l4-task-qa-user-trigger-1',
  approvedSnapshotId: request.approvedSnapshotId,
  workItemKey: 'approved-track-all-l4-task-qa-work-1',
  sam31InvocationId: 'sam31-invocation-1',
  priorCaptionCallRef: evidenceRef('caption-prior-call'),
  selectedCaptionSupportRequestRef: evidenceRef('caption-support-request'),
})
const l4TaskQaQueuedStartRequest =
  buildTrackAllSam31L4TaskQaGpuQueuedStartRequest({
    requestId: 'track-all-sam31-l4-task-qa-queued-start-1',
    approvedSnapshotId: request.approvedSnapshotId,
    workItemKey: 'approved-track-all-l4-task-qa-work-1',
    sam31InvocationId: 'sam31-invocation-1',
    priorCaptionCallRef: evidenceRef('caption-prior-call'),
    selectedCaptionSupportRequestRef:
      evidenceRef('caption-support-request'),
  })
const finalizationRequest =
  buildTrackAllSam31CaptionEvidenceFinalizationRequest({
    requestId: 'track-all-sam31-caption-finalization-1',
    priorCallRef: evidenceRef('caption-prior-call'),
    selectedSupportRequestRef: evidenceRef('caption-support-request'),
    invocationId: 'sam31-invocation-1',
    runtimeResultAdmissionRef: evidenceRef('sam31-result-admission'),
    l4MaskQaMeasurementRef: evidenceRef('l4-mask-qa-measurement'),
    privateSceneReviewRef: evidenceRef('private-scene-review'),
  })
const taskQaFinalizationRequest =
  buildTrackAllSam31TaskQaEvidenceFinalizationRequest({
    requestId: 'track-all-sam31-task-qa-finalization-1',
    invocationId: 'sam31-invocation-1',
    sam31RuntimeResultAdmissionRef: evidenceRef('sam31-result-admission'),
    l4MaskQaWorkerResultRef: evidenceRef('l4-mask-qa-worker-result'),
    independentPrivateReviewResultRef:
      evidenceRef('independent-private-review-result'),
  })
let runtimeCalls = 0
let invocationRuntimeCalls = 0
let queuedStartRuntimeCalls = 0
let schedulerCalls = 0
let consumerCalls = 0
let l4TaskQaRuntimeCalls = 0
let l4TaskQaQueuedStartRuntimeCalls = 0
let finalizationRuntimeCalls = 0
let taskQaFinalizationRuntimeCalls = 0
const app = createReeditProApiApp(loadRuntimeEnv({
  NODE_ENV: 'test',
  E2E_RUNTIME_MODE: 'mock',
  API_ALLOW_MOCK_WITHOUT_SUPABASE: 'true',
  STORAGE_MODE: 'local',
  REEDITPRO_INTERNAL_SERVICE_TOKEN: internalToken,
}), {
  trackAllSam31AuthenticatedGpuInvocationRuntimePort: Object.freeze({
    schemaVersion:
      'canonical-track-all-sam3_1-authenticated-gpu-invocation-runtime-v1',
    currentDedicatedEndpointInvocation: true,
    historicalCloudJobCustomerDispatchUsed: false,
    routeOwnsGpuPlacementOrPricing: false,
    currentA100CustomerDispatchReadinessRereadRequired: true,
    rawProviderInvocationPortExposed: false,
    async invokeApprovedTrackAllWork(input: {
      authenticatedOwnerUserId: string
      workspaceId: string
      idempotencyKey: string
      request: unknown
    }) {
      invocationRuntimeCalls += 1
      assert.equal(input.authenticatedOwnerUserId, 'mock-user-runtime')
      assert.equal(input.workspaceId, workspaceId)
      assert.equal(input.idempotencyKey, invocationRequest.requestId)
      assert.deepEqual(input.request, invocationRequest)
      return invocationResultFor(invocationRequest)
    },
  }),
  trackAllSam31QueuedGpuStartRuntimePort: Object.freeze({
    schemaVersion:
      'canonical-track-all-sam3_1-queued-gpu-start-runtime-v1',
    queueId: 'weeditpro-professional-gpu-production-v1',
    runtimeRegion: 'us-central1',
    durablePostgresQueueRequired: true,
    directGpuInvocationAllowed: false,
    cloudTaskDispatchOwnedByScheduler: true,
    routeOwnsGpuPlacementOrPricing: false,
    productionAuthority: false,
    async enqueueApprovedTrackAllWork(input: {
      authenticatedOwnerUserId: string
      workspaceId: string
      idempotencyKey: string
      request: unknown
    }) {
      queuedStartRuntimeCalls += 1
      assert.equal(input.authenticatedOwnerUserId, 'mock-user-runtime')
      assert.equal(input.workspaceId, workspaceId)
      assert.equal(input.idempotencyKey, queuedStartRequest.requestId)
      assert.deepEqual(input.request, queuedStartRequest)
      return queuedStartResultFor(queuedStartRequest)
    },
  }),
  professionalGpuCloudTaskScheduler: Object.freeze({
    schemaVersion: 'canonical-professional-gpu-cloud-task-scheduler-v1',
    queueId: 'weeditpro-professional-gpu-production-v1',
    runtimeRegion: 'us-central1',
    directGpuInvocationAllowed: false,
    callerCapacityAccepted: false,
    automaticExternalCreateRetryAllowed: false,
    productionAuthority: false,
    async runOneCycle() {
      schedulerCalls += 1
      return schedulerResultFor()
    },
  }),
  professionalGpuCloudTaskConsumer: Object.freeze({
    schemaVersion: 'canonical-professional-gpu-cloud-task-consumer-v2',
    privateGoogleOidcReceiver: true,
    exactCanonicalRereadBeforeGpuInvocation: true,
    exactTerminalUsageAttemptPersistedBeforeQueueFinalization: true,
    duplicateDeliveryMayStartNewInference: false,
    automaticNewExecutionAttemptAllowed: false,
    customerCreditsMutatedByConsumer: false,
    productionAuthority: false,
    async consumeOne(input: {
      authorizationHeader: unknown
      body: unknown
    }) {
      consumerCalls += 1
      assert.equal(input.authorizationHeader, 'Bearer fixture-google-oidc')
      assert.deepEqual(input.body, { delivery: 'fixture' })
      return consumerResultFor()
    },
  }),
  trackAllSam31AuthenticatedGpuStartRuntimePort: Object.freeze({
    schemaVersion:
      'canonical-track-all-sam3_1-authenticated-gpu-start-runtime-v2',
    routeOwnsGpuPlacementOrPricing: false,
    currentA100CustomerDispatchReadinessRereadRequired: true,
    rawCloudLaunchPortExposed: false,
    async startApprovedTrackAllWork(input: {
      authenticatedOwnerUserId: string
      workspaceId: string
      idempotencyKey: string
      request: unknown
    }) {
      runtimeCalls += 1
      assert.equal(input.authenticatedOwnerUserId, 'mock-user-runtime')
      assert.equal(input.workspaceId, workspaceId)
      assert.equal(input.idempotencyKey, request.requestId)
      assert.deepEqual(input.request, request)
      return resultFor(request)
    },
  }),
  trackAllSam31L4TaskQaAuthenticatedStartRuntimePort: Object.freeze({
    schemaVersion:
      'canonical-track-all-sam3_1-l4-task-qa-authenticated-start-v1',
    routeOwnsGpuPlacementOrPricing: false,
    rawCloudLaunchPortExposed: false,
    async prepareApprovedTaskQaWork() {
      throw new Error('Direct-route smoke does not prepare queued L4 work.')
    },
    async startApprovedTaskQaWork(input: {
      authenticatedOwnerUserId: string
      workspaceId: string
      idempotencyKey: string
      request: unknown
    }) {
      l4TaskQaRuntimeCalls += 1
      assert.equal(input.authenticatedOwnerUserId, 'mock-user-runtime')
      assert.equal(input.workspaceId, workspaceId)
      assert.equal(input.idempotencyKey, l4TaskQaRequest.requestId)
      assert.deepEqual(input.request, l4TaskQaRequest)
      return l4TaskQaResultFor(l4TaskQaRequest)
    },
  }),
  trackAllSam31L4TaskQaQueuedStartRuntimePort: Object.freeze({
    schemaVersion:
      'canonical-track-all-sam3_1-l4-task-qa-queued-start-runtime-v1',
    queueId: 'weeditpro-professional-gpu-production-v1',
    runtimeRegion: 'us-central1',
    durablePostgresQueueRequired: true,
    directGpuInvocationAllowed: false,
    cloudTaskDispatchOwnedByScheduler: true,
    materialPreparedAndRereadBeforeQueueAdmission: true,
    routeOwnsGpuPlacementOrPricing: false,
    productionAuthority: false,
    async enqueueApprovedTaskQaWork(input: {
      authenticatedOwnerUserId: string
      workspaceId: string
      idempotencyKey: string
      request: unknown
    }) {
      l4TaskQaQueuedStartRuntimeCalls += 1
      assert.equal(input.authenticatedOwnerUserId, 'mock-user-runtime')
      assert.equal(input.workspaceId, workspaceId)
      assert.equal(input.idempotencyKey,
        l4TaskQaQueuedStartRequest.requestId)
      assert.deepEqual(input.request, l4TaskQaQueuedStartRequest)
      return l4TaskQaQueuedStartResultFor(l4TaskQaQueuedStartRequest)
    },
  }),
  trackAllSam31CaptionEvidenceFinalizationRuntimePort: Object.freeze({
    schemaVersion:
      'canonical-track-all-sam3_1-caption-evidence-finalization-runtime-v1',
    acceptsRawEvidenceOrMedia: false,
    performsRuntimeOrAssetMutation: false,
    async finalizeCaptionEvidence(input: {
      authenticatedOwnerUserId: string
      workspaceId: string
      idempotencyKey: string
      request: unknown
    }) {
      finalizationRuntimeCalls += 1
      assert.equal(input.authenticatedOwnerUserId, 'mock-user-runtime')
      assert.equal(input.workspaceId, workspaceId)
      assert.equal(input.idempotencyKey, finalizationRequest.requestId)
      assert.deepEqual(input.request, finalizationRequest)
      return finalizationResultFor(finalizationRequest)
    },
  }),
  trackAllSam31TaskQaEvidenceFinalizationRuntimePort: Object.freeze({
    schemaVersion:
      'canonical-track-all-sam3_1-task-qa-evidence-finalization-runtime-v1',
    acceptsRawMeasurementReviewMediaOrCloudClaims: false,
    performsRuntimeAssetQaBillingOrDeliveryMutation: false,
    async finalizeTaskQaEvidence(input: {
      authenticatedOwnerUserId: string
      workspaceId: string
      idempotencyKey: string
      request: unknown
    }) {
      taskQaFinalizationRuntimeCalls += 1
      assert.equal(input.authenticatedOwnerUserId, 'mock-user-runtime')
      assert.equal(input.workspaceId, workspaceId)
      assert.equal(input.idempotencyKey, taskQaFinalizationRequest.requestId)
      assert.deepEqual(input.request, taskQaFinalizationRequest)
      return taskQaFinalizationResultFor(taskQaFinalizationRequest)
    },
  }),
})
const server = createServer(app)
server.listen(0, '127.0.0.1')
await once(server, 'listening')
const address = server.address()
assert.ok(address && typeof address === 'object')
const url = `http://127.0.0.1:${address.port}`

try {
  const validQueuedStart = await postQueuedStart(
    queuedStartRequest,
    queuedStartRequest.requestId,
    internalToken,
  )
  assert.equal(validQueuedStart.status, 202)
  const validQueuedStartJson = await validQueuedStart.json() as
    Record<string, unknown>
  assert.equal(validQueuedStartJson.ok, true)
  assert.equal(queuedStartRuntimeCalls, 1)
  assert.equal(schedulerCalls, 1)

  const consumed = await fetch(
    `${url}${CANONICAL_PROFESSIONAL_GPU_CLOUD_TASK_CONSUMER_PATH}`,
    {
      method: 'POST',
      headers: {
        authorization: 'Bearer fixture-google-oidc',
        'content-type': 'application/json',
      },
      body: JSON.stringify({ delivery: 'fixture' }),
    },
  )
  assert.equal(consumed.status, 200)
  assert.equal((await consumed.json() as Record<string, unknown>).ok, true)
  assert.equal(consumerCalls, 1)

  const queuedStartInjectedPriority = await postQueuedStart({
    ...buildTrackAllSam31AuthenticatedGpuQueuedStartRequest({
      requestId: 'track-all-sam31-injected-queue-priority',
      approvedSnapshotId: queuedStartRequest.approvedSnapshotId,
      workItemKey: queuedStartRequest.workItemKey,
    }),
    queuePriority: 'highest',
  }, 'track-all-sam31-injected-queue-priority', internalToken)
  assert.equal(queuedStartInjectedPriority.status, 400)
  assert.equal(queuedStartRuntimeCalls, 1)
  assert.equal(schedulerCalls, 1)

  const queuedStartIdempotencyMismatch = await postQueuedStart(
    queuedStartRequest,
    'different-queued-start-idempotency',
    internalToken,
  )
  assert.equal(queuedStartIdempotencyMismatch.status, 409)
  assert.equal(queuedStartRuntimeCalls, 1)
  assert.equal(schedulerCalls, 1)

  const queuedStartInvalidToken = await postQueuedStart(
    queuedStartRequest,
    queuedStartRequest.requestId,
    'invalid-internal-token',
  )
  assert.equal(queuedStartInvalidToken.status, 403)
  assert.equal(queuedStartRuntimeCalls, 1)
  assert.equal(schedulerCalls, 1)

  const queuedRoute = getApiRouteById(
    TRACK_ALL_SAM3_1_AUTHENTICATED_GPU_QUEUED_START_ROUTE_ID,
  )
  assert.equal(queuedRoute?.securityLevel, 'backend_service_role')
  assert.equal(queuedRoute?.runtimeMode, 'backend_required')
  assert.equal(queuedRoute?.requiresSupabase, true)
  assert.equal(queuedRoute?.requiresServiceRole, true)
  assert.match(queuedRoute?.notes.join(' ') ?? '', /no direct GPU invocation/u)
  assert.match(queuedRoute?.notes.join(' ') ?? '', /durable Postgres/u)
  assert.match(queuedRoute?.notes.join(' ') ?? '', /Cloud Task/u)

  const validInvocation = await postInvocation(
    invocationRequest,
    invocationRequest.requestId,
    internalToken,
  )
  assert.equal(validInvocation.status, 202)
  const validInvocationJson = await validInvocation.json() as
    Record<string, unknown>
  assert.equal(validInvocationJson.ok, true)
  assert.equal(invocationRuntimeCalls, 1)

  const invocationInjectedEndpoint = await postInvocation({
    ...buildTrackAllSam31AuthenticatedGpuInvocationRequest({
      requestId: 'track-all-sam31-injected-endpoint',
      approvedSnapshotId: invocationRequest.approvedSnapshotId,
      workItemKey: invocationRequest.workItemKey,
    }),
    endpoint: 'https://caller.example.invalid/predict',
  }, 'track-all-sam31-injected-endpoint', internalToken)
  assert.equal(invocationInjectedEndpoint.status, 400)
  assert.equal(invocationRuntimeCalls, 1)

  const invocationIdempotencyMismatch = await postInvocation(
    invocationRequest,
    'different-invocation-idempotency',
    internalToken,
  )
  assert.equal(invocationIdempotencyMismatch.status, 409)
  assert.equal(invocationRuntimeCalls, 1)

  const invocationInvalidToken = await postInvocation(
    invocationRequest,
    invocationRequest.requestId,
    'invalid-internal-token',
  )
  assert.equal(invocationInvalidToken.status, 403)
  assert.equal(invocationRuntimeCalls, 1)

  const invocationRoute = getApiRouteById(
    TRACK_ALL_SAM3_1_AUTHENTICATED_GPU_INVOCATION_ROUTE_ID,
  )
  assert.equal(invocationRoute?.securityLevel, 'backend_service_role')
  assert.equal(invocationRoute?.runtimeMode, 'backend_required')
  assert.equal(invocationRoute?.status, 'disabled')
  assert.equal(invocationRoute?.requiresServiceRole, true)
  assert.match(invocationRoute?.notes.join(' ') ?? '', /endpoint-shaped v2/u)
  assert.match(invocationRoute?.notes.join(' ') ?? '', /automatic retry/u)

  const valid = await post(request, request.requestId, internalToken)
  assert.equal(valid.status, 202)
  const validJson = await valid.json() as Record<string, unknown>
  assert.equal(validJson.ok, true)
  assert.equal(runtimeCalls, 1)

  const l4TaskQaValid = await postL4TaskQa(
    l4TaskQaRequest,
    l4TaskQaRequest.requestId,
    internalToken,
  )
  assert.equal(l4TaskQaValid.status, 202)
  const l4TaskQaValidJson = await l4TaskQaValid.json() as
    Record<string, unknown>
  assert.equal(l4TaskQaValidJson.ok, true)
  assert.equal(l4TaskQaRuntimeCalls, 1)

  const l4QueuedValid = await postL4TaskQaQueuedStart(
    l4TaskQaQueuedStartRequest,
    l4TaskQaQueuedStartRequest.requestId,
    internalToken,
  )
  assert.equal(l4QueuedValid.status, 202)
  assert.equal((await l4QueuedValid.json() as Record<string, unknown>).ok,
    true)
  assert.equal(l4TaskQaQueuedStartRuntimeCalls, 1)
  assert.equal(schedulerCalls, 2)

  const l4QueuedInjected = await postL4TaskQaQueuedStart({
    ...l4TaskQaQueuedStartRequest,
    queuePriority: 'highest',
  }, l4TaskQaQueuedStartRequest.requestId, internalToken)
  assert.equal(l4QueuedInjected.status, 409)
  assert.equal(l4TaskQaQueuedStartRuntimeCalls, 1)
  assert.equal(schedulerCalls, 2)

  const l4QueuedRoute = getApiRouteById(
    TRACK_ALL_SAM3_1_L4_TASK_QA_GPU_QUEUED_START_ROUTE_ID,
  )
  assert.equal(l4QueuedRoute?.securityLevel, 'backend_service_role')
  assert.equal(l4QueuedRoute?.status, 'backend_required')
  assert.equal(l4QueuedRoute?.requiresSupabase, true)
  assert.match(l4QueuedRoute?.notes.join(' ') ?? '', /durable Postgres/u)
  assert.match(l4QueuedRoute?.notes.join(' ') ?? '', /does not directly call/u)

  const injectedL4Source = buildTrackAllSam31L4TaskQaGpuStartRequest({
    requestId: 'track-all-l4-injected-mask-request',
    approvedSnapshotId: l4TaskQaRequest.approvedSnapshotId,
    workItemKey: l4TaskQaRequest.workItemKey,
    sam31InvocationId: l4TaskQaRequest.sam31InvocationId,
    priorCaptionCallRef: l4TaskQaRequest.priorCaptionCallRef,
    selectedCaptionSupportRequestRef:
      l4TaskQaRequest.selectedCaptionSupportRequestRef,
  })
  const injectedL4Mask = await postL4TaskQa({
    ...injectedL4Source,
    maskPath: '/private/caller-mask.png',
  }, injectedL4Source.requestId, internalToken)
  assert.equal(injectedL4Mask.status, 400)
  assert.equal(l4TaskQaRuntimeCalls, 1)

  const tamperedL4Source = buildTrackAllSam31L4TaskQaGpuStartRequest({
    requestId: 'track-all-l4-tampered-work-request',
    approvedSnapshotId: l4TaskQaRequest.approvedSnapshotId,
    workItemKey: l4TaskQaRequest.workItemKey,
    sam31InvocationId: l4TaskQaRequest.sam31InvocationId,
    priorCaptionCallRef: l4TaskQaRequest.priorCaptionCallRef,
    selectedCaptionSupportRequestRef:
      l4TaskQaRequest.selectedCaptionSupportRequestRef,
  })
  const tamperedL4 = await postL4TaskQa({
    ...tamperedL4Source,
    workItemKey: 'cross-work-item',
  }, tamperedL4Source.requestId, internalToken)
  assert.equal(tamperedL4.status, 400)
  assert.equal(l4TaskQaRuntimeCalls, 1)

  const l4IdempotencyMismatch = await postL4TaskQa(
    l4TaskQaRequest,
    'different-l4-idempotency-key',
    internalToken,
  )
  assert.equal(l4IdempotencyMismatch.status, 409)
  assert.equal(l4TaskQaRuntimeCalls, 1)

  const l4InvalidToken = await postL4TaskQa(
    l4TaskQaRequest,
    l4TaskQaRequest.requestId,
    'invalid-internal-token',
  )
  assert.equal(l4InvalidToken.status, 403)
  assert.equal(l4TaskQaRuntimeCalls, 1)

  const l4TaskQaRoute = getApiRouteById(
    TRACK_ALL_SAM3_1_L4_TASK_QA_GPU_START_ROUTE_ID,
  )
  assert.equal(l4TaskQaRoute?.securityLevel, 'backend_service_role')
  assert.equal(l4TaskQaRoute?.runtimeMode, 'backend_required')
  assert.equal(l4TaskQaRoute?.requiresServiceRole, true)
  assert.match(l4TaskQaRoute?.notes.join(' ') ?? '', /preparation boundary/u)
  assert.match(l4TaskQaRoute?.notes.join(' ') ?? '', /never directly calls/u)
  assert.match(l4TaskQaRoute?.notes.join(' ') ?? '', /Anchor-required/u)

  const injectedSource = buildTrackAllSam31AuthenticatedGpuStartRequest({
    requestId: 'track-all-injected-model-request',
    approvedSnapshotId: request.approvedSnapshotId,
    workItemKey: request.workItemKey,
  })
  const injectedModel = await post({
    ...injectedSource,
    model: 'caller-selected-model',
  }, injectedSource.requestId, internalToken)
  assert.equal(injectedModel.status, 400)
  assert.equal(runtimeCalls, 1)

  const tamperSource = buildTrackAllSam31AuthenticatedGpuStartRequest({
    requestId: 'track-all-tampered-digest-request',
    approvedSnapshotId: request.approvedSnapshotId,
    workItemKey: request.workItemKey,
  })
  const tamperedDigest = await post({
    ...tamperSource,
    approvedSnapshotId: 'cross-snapshot',
  }, tamperSource.requestId, internalToken)
  assert.equal(tamperedDigest.status, 400)
  assert.equal(runtimeCalls, 1)

  const mismatchedIdempotency = await post(
    request,
    'different-idempotency-key',
    internalToken,
  )
  assert.equal(mismatchedIdempotency.status, 409)
  assert.equal(runtimeCalls, 1)

  const invalidInternalToken = await post(
    request,
    request.requestId,
    'invalid-internal-token',
  )
  assert.equal(invalidInternalToken.status, 403)
  assert.equal(runtimeCalls, 1)

  const route = getApiRouteById(
    TRACK_ALL_SAM3_1_AUTHENTICATED_GPU_START_ROUTE_ID,
  )
  assert.equal(route?.securityLevel, 'backend_service_role')
  assert.equal(route?.runtimeMode, 'backend_required')
  assert.equal(route?.requiresServiceRole, true)
  assert.match(route?.notes.join(' ') ?? '', /A100 80GB/u)
  assert.match(route?.notes.join(' ') ?? '', /L4/u)

  const taskQaFinalized = await postTaskQaFinalization(
    taskQaFinalizationRequest,
    taskQaFinalizationRequest.requestId,
    internalToken,
  )
  assert.equal(taskQaFinalized.status, 200)
  const taskQaFinalizedJson = await taskQaFinalized.json() as
    Record<string, unknown>
  assert.equal(taskQaFinalizedJson.ok, true)
  assert.equal(taskQaFinalizationRuntimeCalls, 1)

  const injectedTaskQaSource =
    buildTrackAllSam31TaskQaEvidenceFinalizationRequest({
      requestId: 'track-all-sam31-task-qa-injected-measurement',
      invocationId: taskQaFinalizationRequest.invocationId,
      sam31RuntimeResultAdmissionRef:
        taskQaFinalizationRequest.sam31RuntimeResultAdmissionRef,
      l4MaskQaWorkerResultRef:
        taskQaFinalizationRequest.l4MaskQaWorkerResultRef,
      independentPrivateReviewResultRef:
        taskQaFinalizationRequest.independentPrivateReviewResultRef,
    })
  const injectedRawMeasurement = await postTaskQaFinalization({
    ...injectedTaskQaSource,
    measurement: { minimumIouBasisPoints: 10_000 },
  }, injectedTaskQaSource.requestId, internalToken)
  assert.equal(injectedRawMeasurement.status, 400)
  assert.equal(taskQaFinalizationRuntimeCalls, 1)

  const taskQaIdempotencyMismatch = await postTaskQaFinalization(
    taskQaFinalizationRequest,
    'different-task-qa-finalization-key',
    internalToken,
  )
  assert.equal(taskQaIdempotencyMismatch.status, 409)
  assert.equal(taskQaFinalizationRuntimeCalls, 1)

  const taskQaInvalidToken = await postTaskQaFinalization(
    taskQaFinalizationRequest,
    taskQaFinalizationRequest.requestId,
    'invalid-internal-token',
  )
  assert.equal(taskQaInvalidToken.status, 403)
  assert.equal(taskQaFinalizationRuntimeCalls, 1)

  const taskQaRoute = getApiRouteById(
    TRACK_ALL_SAM3_1_TASK_QA_EVIDENCE_FINALIZATION_ROUTE_ID,
  )
  assert.equal(taskQaRoute?.securityLevel, 'backend_service_role')
  assert.equal(taskQaRoute?.runtimeMode, 'backend_required')
  assert.equal(taskQaRoute?.requiresServiceRole, true)
  assert.match(taskQaRoute?.notes.join(' ') ?? '', /references only/u)
  assert.match(taskQaRoute?.notes.join(' ') ?? '', /zero active instances/u)

  const finalized = await postFinalization(
    finalizationRequest,
    finalizationRequest.requestId,
    internalToken,
  )
  assert.equal(finalized.status, 200)
  const finalizedJson = await finalized.json() as Record<string, unknown>
  assert.equal(finalizedJson.ok, true)
  assert.equal(finalizationRuntimeCalls, 1)

  const injectedMeasurementSource =
    buildTrackAllSam31CaptionEvidenceFinalizationRequest({
      requestId: 'track-all-sam31-caption-injected-measurement',
      priorCallRef: finalizationRequest.priorCallRef,
      selectedSupportRequestRef: finalizationRequest.selectedSupportRequestRef,
      invocationId: finalizationRequest.invocationId,
      runtimeResultAdmissionRef:
        finalizationRequest.runtimeResultAdmissionRef,
      l4MaskQaMeasurementRef: finalizationRequest.l4MaskQaMeasurementRef,
      privateSceneReviewRef: finalizationRequest.privateSceneReviewRef,
    })
  const injectedMeasurement = await postFinalization({
    ...injectedMeasurementSource,
    measurement: { minimumIou: 1 },
  }, injectedMeasurementSource.requestId, internalToken)
  assert.equal(injectedMeasurement.status, 400)
  assert.equal(finalizationRuntimeCalls, 1)

  const finalizationIdempotencyMismatch = await postFinalization(
    finalizationRequest,
    'different-finalization-key',
    internalToken,
  )
  assert.equal(finalizationIdempotencyMismatch.status, 409)
  assert.equal(finalizationRuntimeCalls, 1)

  const finalizationInvalidToken = await postFinalization(
    finalizationRequest,
    finalizationRequest.requestId,
    'invalid-internal-token',
  )
  assert.equal(finalizationInvalidToken.status, 403)
  assert.equal(finalizationRuntimeCalls, 1)

  const finalizationRoute = getApiRouteById(
    TRACK_ALL_SAM3_1_CAPTION_EVIDENCE_FINALIZATION_ROUTE_ID,
  )
  assert.equal(finalizationRoute?.securityLevel, 'backend_service_role')
  assert.equal(finalizationRoute?.runtimeMode, 'backend_required')
  assert.equal(finalizationRoute?.requiresServiceRole, true)
  assert.match(finalizationRoute?.notes.join(' ') ?? '', /L4 mask-QA/u)
  assert.match(finalizationRoute?.notes.join(' ') ?? '', /references only/u)

  console.log(JSON.stringify({
    smoke: 'canonical-track-all-sam3_1-authenticated-gpu-start-route',
    checks: 131,
    authenticatedOwnerScopeRequired: true,
    strictInternalServiceAuthRequired: true,
    exactIdempotencyRequired: true,
    callerModelOrUnknownFieldRejected: true,
    digestTamperRejected: true,
    rawCloudLaunchPortAcceptedFromRequest: false,
    accountEffectivePriceAcceptedFromRequest: false,
    runtimeCalls,
    invocationRuntimeCalls,
    queuedStartRuntimeCalls,
    schedulerCalls,
    consumerCalls,
    durablePostgresQueueStartMounted: true,
    queuedStartDirectGpuInvocationPerformed: false,
    l4TaskQaRuntimeCalls,
    l4TaskQaQueuedStartRuntimeCalls,
    authenticatedL4TaskQaQueuedStartMounted: true,
    finalizationRuntimeCalls,
    taskQaFinalizationRuntimeCalls,
    rawMeasurementOrReviewAcceptedFromRequest: false,
    taskQaCloudUsagePriceOrCostClaimAcceptedFromRequest: false,
    authenticatedTaskQaEvidenceFinalizerMounted: true,
    authenticatedL4TaskQaStartMounted: true,
    authenticatedCurrentA100EndpointInvocationMounted: true,
    callerMaskPathOrGpuRuntimeConfigurationAccepted: false,
    authenticatedSpecialistResumeProjectionCreated: true,
    productionReady: false,
  }, null, 2))
} finally {
  server.close()
  await once(server, 'close')
}

async function postTaskQaFinalization(
  body: unknown,
  idempotencyKey: string,
  token: string,
) {
  return fetch(
    `${url}/internal/v1/workspaces/${workspaceId}/track-all/sam3_1/task-qa-evidence/finalize`,
    {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'idempotency-key': idempotencyKey,
        'x-reeditpro-internal-token': token,
      },
      body: JSON.stringify(body),
    },
  )
}

async function postInvocation(
  body: unknown,
  idempotencyKey: string,
  token: string,
) {
  return fetch(
    `${url}/internal/v2/workspaces/${workspaceId}/track-all/sam3_1/gpu-invocations/start`,
    {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'idempotency-key': idempotencyKey,
        'x-reeditpro-internal-token': token,
      },
      body: JSON.stringify(body),
    },
  )
}

async function postQueuedStart(
  body: unknown,
  idempotencyKey: string,
  token: string,
) {
  return fetch(
    `${url}/internal/v3/workspaces/${workspaceId}/track-all/sam3_1/gpu-queue/start`,
    {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'idempotency-key': idempotencyKey,
        'x-reeditpro-internal-token': token,
      },
      body: JSON.stringify(body),
    },
  )
}

async function postL4TaskQa(
  body: unknown,
  idempotencyKey: string,
  token: string,
) {
  return fetch(
    `${url}/internal/v1/workspaces/${workspaceId}/track-all/sam3_1/l4-task-qa/gpu-jobs/start`,
    {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'idempotency-key': idempotencyKey,
        'x-reeditpro-internal-token': token,
      },
      body: JSON.stringify(body),
    },
  )
}

async function postL4TaskQaQueuedStart(
  body: unknown,
  idempotencyKey: string,
  token: string,
) {
  return fetch(
    `${url}/internal/v1/workspaces/${workspaceId}/track-all/sam3_1/l4-task-qa/gpu-queue/start`,
    {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'idempotency-key': idempotencyKey,
        'x-reeditpro-internal-token': token,
      },
      body: JSON.stringify(body),
    },
  )
}

async function postFinalization(
  body: unknown,
  idempotencyKey: string,
  token: string,
) {
  return fetch(
    `${url}/internal/v1/workspaces/${workspaceId}/track-all/sam3_1/caption-evidence/finalize`,
    {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'idempotency-key': idempotencyKey,
        'x-reeditpro-internal-token': token,
      },
      body: JSON.stringify(body),
    },
  )
}

async function post(
  body: unknown,
  idempotencyKey: string,
  token: string,
) {
  return fetch(
    `${url}/internal/v1/workspaces/${workspaceId}/track-all/sam3_1/gpu-jobs/start`,
    {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'idempotency-key': idempotencyKey,
        'x-reeditpro-internal-token': token,
      },
      body: JSON.stringify(body),
    },
  )
}

function resultFor(
  source: TrackAllSam31AuthenticatedGpuStartRequest,
): TrackAllSam31AuthenticatedGpuStartResult {
  const ref = (id: string) => ({
    id,
    version: 1,
    contentHash: `sha256:${sha256AuthorityValue(id)}`,
  })
  const payload = {
    schemaVersion:
      'track-all-sam3_1-authenticated-gpu-start-result-v1' as const,
    requestRef: {
      id: source.requestId,
      version: 1,
      contentHash: `sha256:${source.requestDigestSha256}`,
    },
    workspaceId,
    approvedSnapshotId: source.approvedSnapshotId,
    workItemKey: source.workItemKey,
    fundedDispatchAdmissionRef: ref('funded-admission'),
    prelaunchAuthorizationRef: ref('funded-prelaunch'),
    launchRef: ref('sam31-launch'),
    launchBindingRef: ref('sam31-launch-binding'),
    launchDisposition: 'job_created' as const,
    routeId: 'a100_80gb_heavy_primary' as const,
    accelerator: 'nvidia_a100_80gb' as const,
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
  return { ...payload, resultDigestSha256: sha256AuthorityValue(payload) }
}

function queuedStartResultFor(
  source: TrackAllSam31AuthenticatedGpuQueuedStartRequest,
): TrackAllSam31AuthenticatedGpuQueuedStartResult {
  const ref = (id: string) => ({
    id,
    version: 1,
    contentHash: `sha256:${sha256AuthorityValue(id)}`,
  })
  const payload = {
    schemaVersion:
      'track-all-sam3_1-authenticated-gpu-queued-start-result-v3' as const,
    requestRef: {
      id: source.requestId,
      version: 1,
      contentHash: `sha256:${source.requestDigestSha256}`,
    },
    workspaceId,
    projectId: 'project-track-all-sam31-route',
    approvedSnapshotId: source.approvedSnapshotId,
    workItemKey: source.workItemKey,
    fundedDispatchAdmissionRef: ref('funded-admission'),
    prelaunchAuthorizationRef: ref('funded-prelaunch'),
    fixedTaskPreparationBridgeRef: ref('fixed-task-preparation'),
    executionAttemptRef: ref('execution-attempt'),
    userTriggerRecordRef: ref('user-trigger'),
    queueEntryRef: ref('queue-entry'),
    queueTransactionRef: ref('queue-transaction'),
    queueDisposition: 'queued' as const,
    routeId: 'a100_80gb_heavy_primary' as const,
    accelerator: 'nvidia_a100_80gb' as const,
    queueId: 'weeditpro-professional-gpu-production-v1' as const,
    runtimeRegion: 'us-central1' as const,
    minimumIdleGpuInstances: 0 as const,
    userTriggeredScaleFromZero: true as const,
    a100HeavyPrimaryAndSeparatelyQualifiedL4Fallback: true as const,
    durablePostgresQueueAdmissionCommitted: true as const,
    schedulerOwnsCloudTaskDispatch: true as const,
    taskConsumerMustRereadFundingTaskAndRuntimeAuthorities: true as const,
    directGpuInvocationStartedByRequest: false as const,
    cloudTaskCreationStartedByRequest: false as const,
    callerSuppliedMediaPromptQueuePriorityCapacityRouteModelImageCommandOrPriceAccepted:
      false as const,
    customerCreditsMutated: false as const,
    qaApproved: false as const,
    publicDeliveryAuthorized: false as const,
    productionAuthorityGranted: false as const,
  }
  return { ...payload, resultDigestSha256: sha256AuthorityValue(payload) }
}

function schedulerResultFor():
CanonicalProfessionalGpuCloudTaskSchedulerResult {
  const payload = {
    schemaVersion:
      'canonical-professional-gpu-cloud-task-scheduler-result-v1' as const,
    source: 'canonical_server_professional_gpu_cloud_task_scheduler' as const,
    schedulerCycleId: 'gpu-scheduler-route-smoke-1',
    queueId: 'weeditpro-professional-gpu-production-v1' as const,
    runtimeRegion: 'us-central1' as const,
    recoveryDisposition: 'recovery_completed' as const,
    recoveredBeforeExternalDispatchCount: 0,
    reconciliationRequiredCount: 0,
    claimDisposition: 'no_capacity_available' as const,
    claimedCount: 0,
    dispatchRecords: [],
    createdTaskCount: 0,
    knownNotCreatedCount: 0,
    unknownOrReconciliationCount: 0,
    capacityRereadByServerOwner: true as const,
    durableClaimBeforeExternalDispatch: true as const,
    durableOutboxBeforeCloudTaskCreate: true as const,
    cloudTaskConsumerMustRereadExactAuthorities: true as const,
    directGpuInvocationStartedByScheduler: false as const,
    customerCreditsMutated: false as const,
    qaApproved: false as const,
    publicDeliveryAuthorized: false as const,
    productionAuthorityGranted: false as const,
    startedAt: '2026-08-13T05:00:00.000Z',
    completedAt: '2026-08-13T05:00:00.001Z',
  }
  return {
    ...payload,
    resultDigestSha256: sha256AuthorityValue(payload),
  }
}

function consumerResultFor():
CanonicalProfessionalGpuCloudTaskConsumerResult {
  const gpuRef = (id: string) => ({
    id,
    version: 1,
    contentHash: `sha256:${sha256AuthorityValue(id)}` as const,
  })
  const payload = {
    schemaVersion:
      'canonical-professional-gpu-cloud-task-consumer-result-v2' as const,
    source: 'canonical_server_professional_gpu_cloud_task_consumer' as const,
    disposition: 'completed_and_queue_finalized' as const,
    queueEntryRef: gpuRef('route-smoke-queue-entry'),
    claimRef: gpuRef('route-smoke-claim'),
    executionAttemptRef: gpuRef('route-smoke-attempt'),
    serviceIdentityEvidenceRef: gpuRef('route-smoke-identity'),
    endpointInvocationResultRef: gpuRef('route-smoke-invocation'),
    terminalUsageAttemptRef: gpuRef('route-smoke-terminal-usage'),
    queueTerminalRef: gpuRef('route-smoke-terminal'),
    invocationDisposition: 'completed' as const,
    queueFinalized: true,
    terminalUsageAttemptPersistedBeforeQueueFinalization: true,
    exactTaskOutboxClaimFundingAttemptAndInvocationReread: true as const,
    duplicateDeliveryStartedNewInference: false as const,
    automaticNewExecutionAttemptAllowed: false as const,
    unresolvedOutcomeBlocksRetry: false,
    canonicalUsageCostAndCreditSettlementPending: true as const,
    customerCreditsMutated: false as const,
    qaApproved: false as const,
    publicDeliveryAuthorized: false as const,
    productionAuthorityGranted: false as const,
    observedAt: '2026-08-13T05:00:00.002Z',
  }
  return {
    ...payload,
    resultDigestSha256: sha256AuthorityValue(payload),
  }
}

function invocationResultFor(
  source: TrackAllSam31AuthenticatedGpuInvocationRequest,
): TrackAllSam31AuthenticatedGpuInvocationResult {
  const ref = (id: string) => ({
    id,
    version: 1,
    contentHash: `sha256:${sha256AuthorityValue(id)}`,
  })
  const payload = {
    schemaVersion:
      'track-all-sam3_1-authenticated-gpu-invocation-result-v2' as const,
    requestRef: {
      id: source.requestId,
      version: 1,
      contentHash: `sha256:${source.requestDigestSha256}`,
    },
    workspaceId,
    approvedSnapshotId: source.approvedSnapshotId,
    workItemKey: source.workItemKey,
    fundedDispatchAdmissionRef: ref('funded-admission'),
    prelaunchAuthorizationRef: ref('funded-prelaunch'),
    fixedTaskPreparationBridgeRef: ref('fixed-task-preparation'),
    endpointInvocationAttemptRef: ref('endpoint-attempt'),
    endpointCallStartRef: ref('endpoint-call-start'),
    endpointInvocationResultRef: ref('endpoint-result'),
    executionAttemptRef: ref('execution-attempt'),
    runtimeResponseRef: ref('runtime-response'),
    invocationDisposition: 'completed' as const,
    providerOutcome: 'executed' as const,
    runtimeStatus: 'completed' as const,
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
    unresolvedOutcomeBlocksRetry: false,
    canonicalServingWindowUsageCostAndCreditSettlementPending: true as const,
    callerSuppliedMediaPromptEndpointModelRouteImageCommandOrPriceAccepted:
      false as const,
    customerCreditsMutated: false as const,
    qaApproved: false as const,
    publicDeliveryAuthorized: false as const,
    productionAuthorityGranted: false as const,
  }
  return { ...payload, resultDigestSha256: sha256AuthorityValue(payload) }
}

function l4TaskQaResultFor(
  source: TrackAllSam31L4TaskQaGpuStartRequest,
): TrackAllSam31L4TaskQaGpuStartResult {
  const ref = (id: string) => ({
    id,
    version: 1,
    contentHash: `sha256:${sha256AuthorityValue(id)}`,
  })
  const payload = {
    schemaVersion:
      'track-all-sam3_1-l4-task-qa-gpu-start-result-v1' as const,
    requestRef: {
      id: source.requestId,
      version: 1,
      contentHash: `sha256:${source.requestDigestSha256}`,
    },
    workspaceId,
    approvedSnapshotId: source.approvedSnapshotId,
    workItemKey: source.workItemKey,
    sam31InvocationId: source.sam31InvocationId,
    l4InvocationId: 'l4-task-qa-invocation-1',
    sam31RuntimeResultAdmissionRef: ref('sam31-result-admission'),
    l4TaskMaterialRef: ref('l4-task-material'),
    fundedDispatchAdmissionRef: ref('l4-funded-admission'),
    prelaunchAuthorizationRef: ref('l4-prelaunch'),
    launchRef: ref('l4-launch'),
    launchBindingRef: ref('l4-launch-binding'),
    launchDisposition: 'job_created' as const,
    routeId: 'l4_standard_primary' as const,
    accelerator: 'nvidia_l4' as const,
    userTriggeredScaleFromZero: true as const,
    exactSamTaskResultManifestAndApprovedL4WorkReread: true as const,
    accountEffectivePricingAndFundingRereadBeforeLaunch: true as const,
    fixedTaskPersistedAndRereadBeforeCloudJobCreation: true as const,
    separateSam31InputAndL4JobInvocationRoots: true as const,
    rawCloudLaunchPortExposed: false as const,
    callerSuppliedMaskBytesPathsCommandsImageRouteEnvironmentOrPriceAccepted:
      false as const,
    customerCreditsMutated: false as const,
    qaApproved: false as const,
    publicDeliveryAuthorized: false as const,
    productionAuthorityGranted: false as const,
  }
  return { ...payload, resultDigestSha256: sha256AuthorityValue(payload) }
}

function l4TaskQaQueuedStartResultFor(
  source: TrackAllSam31L4TaskQaGpuQueuedStartRequest,
): TrackAllSam31L4TaskQaGpuQueuedStartResult {
  const ref = (id: string) => ({
    id,
    version: 1,
    contentHash: `sha256:${sha256AuthorityValue(id)}`,
  })
  const payload = {
    schemaVersion:
      'track-all-sam3_1-l4-task-qa-gpu-queued-start-result-v1' as const,
    requestRef: {
      id: source.requestId,
      version: 1,
      contentHash: `sha256:${source.requestDigestSha256}`,
    },
    workspaceId,
    projectId: 'project-track-all-sam31-route',
    approvedSnapshotId: source.approvedSnapshotId,
    workItemKey: source.workItemKey,
    sam31InvocationId: source.sam31InvocationId,
    l4InvocationId: 'l4-task-qa-invocation-1',
    l4TaskMaterialRef: ref('l4-task-material'),
    fundedDispatchAdmissionRef: ref('l4-funded-admission'),
    prelaunchAuthorizationRef: ref('l4-prelaunch'),
    fixedTaskPreparationBridgeRef: ref('l4-preparation-bridge'),
    executionAttemptRef: ref('l4-execution-attempt'),
    userTriggerRecordRef: ref('l4-user-trigger'),
    queueEntryRef: ref('l4-queue-entry'),
    queueTransactionRef: ref('l4-queue-transaction'),
    queueDisposition: 'queued' as const,
    routeId: 'l4_standard_primary' as const,
    accelerator: 'nvidia_l4' as const,
    queueId: 'weeditpro-professional-gpu-production-v1' as const,
    runtimeRegion: 'us-central1' as const,
    minimumIdleGpuInstances: 0 as const,
    userTriggeredScaleFromZero: true as const,
    durablePostgresQueueAdmissionCommitted: true as const,
    schedulerOwnsCloudTaskDispatch: true as const,
    taskConsumerMustRereadFundingMaterialTaskAndRuntimeAuthorities:
      true as const,
    directGpuInvocationStartedByRequest: false as const,
    cloudTaskCreationStartedByRequest: false as const,
    callerSuppliedMaskBytesPathsQueuePriorityCapacityRouteImageCommandEnvironmentOrPriceAccepted:
      false as const,
    customerCreditsMutated: false as const,
    qaApproved: false as const,
    publicDeliveryAuthorized: false as const,
    productionAuthorityGranted: false as const,
  }
  return { ...payload, resultDigestSha256: sha256AuthorityValue(payload) }
}

function finalizationResultFor(
  source: TrackAllSam31CaptionEvidenceFinalizationRequest,
): TrackAllSam31CaptionEvidenceFinalizationResult {
  const payload = {
    schemaVersion:
      'track-all-sam3_1-caption-evidence-finalization-result-v1' as const,
    requestRef: {
      id: source.requestId,
      version: source.schemaVersion,
      contentHash: source.requestDigestSha256,
    },
    workspaceId,
    invocationId: source.invocationId,
    supportRequestRef: source.selectedSupportRequestRef,
    sceneQaAuthorityRef: evidenceRef('scene-qa-authority'),
    sceneEvidenceRef: evidenceRef('scene-evidence'),
    authenticatedEvidenceRecordRef: evidenceRef('authenticated-record'),
    authenticatedOwnerProjectionRef: evidenceRef('owner-projection'),
    disposition: 'ready_for_specialist_resume' as const,
    authenticatedPrincipalVerified: true as const,
    exactPersistedRuntimeMeasurementAndReviewReread: true as const,
    createOnlySceneAuthorityAndEvidenceReread: true as const,
    authenticatedProjectionPersistedAndReread: true as const,
    browserLocalStateUsed: false as const,
    directPeerDispatchPerformed: false as const,
    runtimeExecutionPerformedByFinalizer: false as const,
    assetMutationPerformed: false as const,
    customerCreditsMutated: false as const,
    finalQaApprovalGranted: false as const,
    publicDeliveryGranted: false as const,
    productionAuthorityGranted: false as const,
  }
  return { ...payload, resultDigestSha256: sha256AuthorityValue(payload) }
}

function taskQaFinalizationResultFor(
  source: TrackAllSam31TaskQaEvidenceFinalizationRequest,
): TrackAllSam31TaskQaEvidenceFinalizationResult {
  const payload = {
    schemaVersion:
      'track-all-sam3_1-task-qa-evidence-finalization-result-v1' as const,
    requestRef: {
      id: source.requestId,
      version: source.schemaVersion,
      contentHash: source.requestDigestSha256,
    },
    workspaceId,
    invocationId: source.invocationId,
    l4MaskQaWorkerResultRef: source.l4MaskQaWorkerResultRef,
    independentPrivateReviewResultRef:
      source.independentPrivateReviewResultRef,
    l4MaskQaMeasurementRef: evidenceRef('l4-mask-qa-measurement'),
    privateSceneReviewRef: evidenceRef('private-scene-review'),
    disposition: 'ready_for_caption_evidence_finalization' as const,
    authenticatedPrincipalVerified: true as const,
    exactSamResultWorkerOutputLaunchEnvelopeTerminalAndReviewReread:
      true as const,
    l4TerminalUsageAccountPriceAndCostReread: true as const,
    workerStoppedAndScaleBackToZeroVerified: true as const,
    createOnlyMeasurementAndReviewPersistedAndReread: true as const,
    browserLocalStateUsed: false as const,
    runtimeExecutionPerformedByFinalizer: false as const,
    assetMutationPerformed: false as const,
    customerCreditsMutated: false as const,
    finalQaApprovalGranted: false as const,
    publicDeliveryGranted: false as const,
    productionAuthorityGranted: false as const,
  }
  return { ...payload, resultDigestSha256: sha256AuthorityValue(payload) }
}
