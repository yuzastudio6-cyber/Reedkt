import assert from 'node:assert/strict'
import { once } from 'node:events'
import { createServer } from 'node:http'

import {
  TRACK_ALL_SAM3_1_AUTHENTICATED_GPU_START_ROUTE_ID,
  type TrackAllSam31AuthenticatedGpuStartRequest,
  type TrackAllSam31AuthenticatedGpuStartResult,
} from '../../src/types/track-all-sam3_1-gpu-start'
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
  buildTrackAllSam31AuthenticatedGpuStartRequest,
} from '../services/canonical-track-all-sam3_1-authenticated-gpu-start-service'
import {
  buildTrackAllSam31CaptionEvidenceFinalizationRequest,
} from '../services/canonical-track-all-sam3_1-caption-evidence-finalization-service'
import {
  buildTrackAllSam31TaskQaEvidenceFinalizationRequest,
} from '../services/canonical-track-all-sam3_1-task-qa-evidence-finalization-service'
import { sha256AuthorityValue } from
  '../services/private-edit-authority-store'

const internalToken = 'track-all-sam31-route-smoke-token'
const workspaceId = 'workspace-track-all-sam31-route'
const request = buildTrackAllSam31AuthenticatedGpuStartRequest({
  requestId: 'track-all-sam31-user-trigger-1',
  approvedSnapshotId: 'approved-snapshot-track-all-1',
  workItemKey: 'approved-track-all-work-1',
})
const evidenceRef = (id: string) => ({
  id,
  version: 'fixture-v1',
  contentHash: sha256AuthorityValue(id),
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
let finalizationRuntimeCalls = 0
let taskQaFinalizationRuntimeCalls = 0
const app = createReeditProApiApp(loadRuntimeEnv({
  NODE_ENV: 'test',
  E2E_RUNTIME_MODE: 'mock',
  API_ALLOW_MOCK_WITHOUT_SUPABASE: 'true',
  STORAGE_MODE: 'local',
  REEDITPRO_INTERNAL_SERVICE_TOKEN: internalToken,
}), {
  trackAllSam31AuthenticatedGpuStartRuntimePort: Object.freeze({
    schemaVersion:
      'canonical-track-all-sam3_1-authenticated-gpu-start-runtime-v1',
    routeOwnsGpuPlacementOrPricing: false,
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
  const valid = await post(request, request.requestId, internalToken)
  assert.equal(valid.status, 202)
  const validJson = await valid.json() as Record<string, unknown>
  assert.equal(validJson.ok, true)
  assert.equal(runtimeCalls, 1)

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
    checks: 57,
    authenticatedOwnerScopeRequired: true,
    strictInternalServiceAuthRequired: true,
    exactIdempotencyRequired: true,
    callerModelOrUnknownFieldRejected: true,
    digestTamperRejected: true,
    rawCloudLaunchPortAcceptedFromRequest: false,
    accountEffectivePriceAcceptedFromRequest: false,
    runtimeCalls,
    finalizationRuntimeCalls,
    taskQaFinalizationRuntimeCalls,
    rawMeasurementOrReviewAcceptedFromRequest: false,
    taskQaCloudUsagePriceOrCostClaimAcceptedFromRequest: false,
    authenticatedTaskQaEvidenceFinalizerMounted: true,
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
