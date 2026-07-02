import assert from 'node:assert/strict'

import { createToolExecutionGatewayService } from '../services/tool-execution-gateway-service'
import type { ServiceContext } from '../types'
import type { ToolExecutionGatewayDispatchBody } from '../validation/tool-execution-gateway-schemas'

const context: ServiceContext = {
  env: {
    mockOnly: true,
    allowMockWithoutSupabase: true,
  } as never,
  clients: {
    admin: null,
    public: null,
  },
  requestId: 'tool-execution-gateway-smoke',
  auth: {
    userId: 'user-smoke',
    email: 'user-smoke@reeditpro.local',
    isMockUser: true,
  },
}

const baseInput: ToolExecutionGatewayDispatchBody & { apiIdempotencyKey: string } = {
  workspaceId: 'workspace-smoke',
  projectId: 'project-smoke',
  jobId: 'job-smoke',
  toolExecutionPlanId: 'tool-execution-plan-smoke',
  editPlanId: 'edit-plan-smoke',
  mediaAssetId: 'media-smoke',
  approvedPlanSnapshotId: 'approved-snapshot-smoke',
  creditEstimateId: 'credit-estimate-smoke',
  creditReservationId: 'credit-reservation-smoke',
  approvedReservationRemainingCredits: 50,
  estimatedHighCredits: 5,
  workerType: 'cpu_analysis_worker',
  executionMode: 'mock_safe',
  requestedToolIds: ['ffprobe'],
  requestedRecipeIds: ['media-probe-recipe'],
  artifactReferences: [{
    id: 'artifact-source-media',
    storageBucketPurpose: 'source_media',
    storageObjectPath: 'workspaces/workspace-smoke/projects/project-smoke/source/source-media.mp4',
    isPrivate: true,
    sourceOfTruth: true,
  }],
  attempt: 1,
  maxAttempts: 1,
  metadata: {
    gatewaySmoke: true,
  },
  apiIdempotencyKey: 'api-idempotency-smoke',
}

const service = createToolExecutionGatewayService(context)

const dispatched = await service.dispatchApprovedToolCall(baseInput)
assert.equal(dispatched.gateway.status, 'dispatched', 'valid request should dispatch through the backend gateway')
assert.equal(dispatched.gateway.blockers.length, 0, 'valid request should not include blockers')
assert.ok(dispatched.gateway.workerIdempotencyKey?.startsWith('prod-worker:'), 'gateway should create stable worker idempotency key')
assert.equal(dispatched.workerResult?.status, 'completed', 'mock-safe production dispatcher should complete placeholder route')
assert.equal(dispatched.workerResult?.output?.mockOnly, true, 'gateway dispatch should stay mock-safe')
assert.equal(dispatched.workerResult?.output?.futureHandler, 'cpu_analysis_worker_placeholder', 'gateway should dispatch only the allowed placeholder adapter')
assert.ok(
  dispatched.warnings.some((warning) => warning.includes('no frontend tool execution')),
  'gateway should confirm frontend direct execution did not occur',
)

const overBudget = await service.dispatchApprovedToolCall({
  ...baseInput,
  jobId: 'job-over-budget',
  approvedReservationRemainingCredits: 1,
})
assert.equal(overBudget.gateway.status, 'blocked', 'over-budget request should block')
assert.ok(
  overBudget.gateway.blockers.some((blocker) => blocker.gateName === 'cost_credit_gate'),
  'over-budget request should identify the cost/credit gate',
)
assert.equal(overBudget.workerResult, undefined, 'blocked gateway request should not dispatch a worker')

const adapterMismatch = await service.dispatchApprovedToolCall({
  ...baseInput,
  jobId: 'job-adapter-mismatch',
  adapterId: 'render_worker_placeholder',
})
assert.equal(adapterMismatch.gateway.status, 'blocked', 'wrong adapter should block')
assert.ok(
  adapterMismatch.gateway.blockers.some((blocker) => blocker.gateName === 'adapter_dispatch'),
  'wrong adapter should identify adapter dispatch blocker',
)

const unfinishedLane = await service.dispatchApprovedToolCall({
  ...baseInput,
  jobId: 'job-unfinished-lane',
  requestedToolIds: ['hyperframe'],
  workerType: 'render_worker',
  adapterId: 'render_worker_placeholder',
})
assert.equal(unfinishedLane.gateway.status, 'blocked', 'frontend-preview or unfinished lanes should block backend dispatch')
assert.ok(
  unfinishedLane.gateway.blockers.some((blocker) => blocker.gateName === 'tool_readiness'),
  'unfinished lane should identify tool readiness blocker',
)

const unsafeArtifact = await service.dispatchApprovedToolCall({
  ...baseInput,
  jobId: 'job-unsafe-artifact',
  artifactReferences: [{
    ...baseInput.artifactReferences[0],
    storageObjectPath: 'https://storage.example.com/signed/source.mp4?X-Goog-Signature=abc',
  }],
})
assert.equal(unsafeArtifact.gateway.status, 'blocked', 'signed URL artifact should block')
assert.ok(
  unsafeArtifact.gateway.blockers.some((blocker) => blocker.gateName === 'artifact_privacy'),
  'signed URL artifact should identify artifact privacy blocker',
)

const rawMetadata = await service.dispatchApprovedToolCall({
  ...baseInput,
  jobId: 'job-raw-metadata',
  metadata: {
    rawPrompt: 'run this directly',
  },
})
assert.equal(rawMetadata.gateway.status, 'blocked', 'raw prompt metadata should block')
assert.ok(
  rawMetadata.gateway.blockers.some((blocker) => blocker.gateName === 'metadata_safety'),
  'raw prompt metadata should identify metadata safety blocker',
)

const reservedRouterMetadata = await service.dispatchApprovedToolCall({
  ...baseInput,
  jobId: 'job-reserved-router-metadata',
  metadata: {
    mediaFoundation: {
      mode: 'fixture',
    },
  },
})
assert.equal(reservedRouterMetadata.gateway.status, 'blocked', 'reserved worker router metadata should block')
assert.equal(reservedRouterMetadata.workerResult, undefined, 'reserved router metadata should not dispatch a worker')
assert.ok(
  reservedRouterMetadata.gateway.blockers.some((blocker) => blocker.code === 'RESERVED_ADAPTER_METADATA'),
  'reserved router metadata should identify adapter metadata blocker',
)

await assert.rejects(
  () => createToolExecutionGatewayService({
    ...context,
    auth: undefined,
  }).dispatchApprovedToolCall(baseInput),
  /Authenticated user context is required/,
  'service should enforce auth even though the route also uses requireAuth',
)

console.log(JSON.stringify({
  ok: true,
  route: 'POST /v1/tool-executions/dispatch',
  dispatchedStatus: dispatched.gateway.status,
  futureHandler: dispatched.workerResult?.output?.futureHandler,
  blockersCovered: [
    overBudget.gateway.blockers[0]?.gateName,
    adapterMismatch.gateway.blockers[0]?.gateName,
    unfinishedLane.gateway.blockers[0]?.gateName,
    unsafeArtifact.gateway.blockers[0]?.gateName,
    rawMetadata.gateway.blockers[0]?.gateName,
    reservedRouterMetadata.gateway.blockers[0]?.gateName,
  ],
}, null, 2))
