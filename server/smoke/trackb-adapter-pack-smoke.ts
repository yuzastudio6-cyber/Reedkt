import assert from 'node:assert/strict'

import { createToolExecutionGatewayService } from '../services/tool-execution-gateway-service'
import { TRACK_B_MEDIA_OSS_TOOL_IDS } from '../skill-capability-registry'
import type { ServiceContext } from '../types'
import {
  TRACK_B_ADAPTER_TOOL_IDS,
  listTrackBAdapterContracts,
  runTrackBAdapter,
  trackBAdapterResultSchema,
  type TrackBAdapterExecutionMode,
  type TrackBAdapterToolId,
} from '../trackb-adapters'
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
  requestId: 'trackb-adapter-pack-smoke',
  auth: {
    userId: 'user-trackb-smoke',
    email: 'trackb-smoke@reeditpro.local',
    isMockUser: true,
  },
}

assert.equal(TRACK_B_ADAPTER_TOOL_IDS.length, 16, 'Track B adapter pack must cover exactly 16 tools')
assert.deepEqual(
  [...TRACK_B_ADAPTER_TOOL_IDS],
  [...TRACK_B_MEDIA_OSS_TOOL_IDS],
  'Track B adapter tool set must match the unified Track B source of truth',
)

const contracts = listTrackBAdapterContracts()
assert.equal(contracts.length, 16, 'every Track B tool should have an adapter contract')

function inputArtifactFor(toolId: TrackBAdapterToolId) {
  const contract = contracts.find((item) => item.toolId === toolId)
  assert.ok(contract, `missing contract for ${toolId}`)
  const requirement = contract.inputManifest.find((item) => item.required) ?? contract.inputManifest[0]
  assert.ok(requirement, `${toolId} should define an input manifest requirement`)

  return {
    id: `${toolId}-input-artifact`,
    artifactType: requirement.artifactType,
    storageBucketPurpose: requirement.storageBucketPurpose,
    storageObjectPath: `workspaces/workspace-trackb/projects/project-trackb/source/${toolId}/${requirement.artifactType}.artifact`,
    contentType: 'application/octet-stream',
    isPrivate: true as const,
    sourceOfTruth: true as const,
    description: `Private smoke input for ${toolId}.`,
  }
}

function runDirectAdapter(toolId: TrackBAdapterToolId, executionMode: TrackBAdapterExecutionMode) {
  return runTrackBAdapter({
    workspaceId: 'workspace-trackb',
    projectId: 'project-trackb',
    jobId: `job-${toolId}-${executionMode}`,
    toolExecutionPlanId: `plan-${toolId}-${executionMode}`,
    approvedPlanSnapshotId: 'approved-snapshot-trackb',
    creditEstimateId: 'credit-estimate-trackb',
    creditReservationId: 'credit-reservation-trackb',
    toolId,
    workerType: contracts.find((contract) => contract.toolId === toolId)?.workerType ?? 'cpu_analysis_worker',
    executionMode,
    inputArtifacts: [inputArtifactFor(toolId)],
    metadata: {
      smoke: true,
    },
  })
}

for (const toolId of TRACK_B_ADAPTER_TOOL_IDS) {
  for (const mode of ['dry_run', 'bounded_execution'] as const) {
    const result = runDirectAdapter(toolId, mode)
    assert.doesNotThrow(() => trackBAdapterResultSchema.parse(result), `${toolId} ${mode} result should match schema`)
    assert.notEqual(result.status, 'blocked', `${toolId} ${mode} should validate with private manifests`)
    assert.equal(result.mockSafe, true, `${toolId} ${mode} should remain mock-safe`)
    assert.equal(result.realToolExecution, false, `${toolId} ${mode} must not execute the real tool`)
    assert.ok(result.outputManifest.length > 0, `${toolId} ${mode} should plan private output manifests`)
    assert.ok(result.outputManifest.every((artifact) => artifact.isPrivate && artifact.sourceOfTruth), `${toolId} ${mode} outputs should be private source-of-truth manifests`)
    assert.ok(result.qaChecks.every((check) => check.status === 'passed'), `${toolId} ${mode} QA checks should pass`)
  }
}

const unsafe = runTrackBAdapter({
  workspaceId: 'workspace-trackb',
  projectId: 'project-trackb',
  jobId: 'job-unsafe-trackb',
  toolExecutionPlanId: 'plan-unsafe-trackb',
  approvedPlanSnapshotId: 'approved-snapshot-trackb',
  creditEstimateId: 'credit-estimate-trackb',
  creditReservationId: 'credit-reservation-trackb',
  toolId: 'ffprobe',
  workerType: 'cpu_analysis_worker',
  executionMode: 'bounded_execution',
  inputArtifacts: [{
    ...inputArtifactFor('ffprobe'),
    storageObjectPath: 'https://storage.example.com/private/source.mp4?X-Goog-Signature=abc',
  }],
  metadata: {
    smoke: true,
  },
})
assert.equal(unsafe.status, 'blocked', 'signed URL input should block Track B adapter validation')
assert.ok(
  unsafe.blockers.some((blocker) => blocker.code === 'TRACKB_ADAPTER_PRIVATE_ARTIFACT_REQUIRED'),
  'unsafe input should identify private artifact blocker',
)

const secretMetadata = runTrackBAdapter({
  workspaceId: 'workspace-trackb',
  projectId: 'project-trackb',
  jobId: 'job-secret-trackb',
  toolExecutionPlanId: 'plan-secret-trackb',
  approvedPlanSnapshotId: 'approved-snapshot-trackb',
  creditEstimateId: 'credit-estimate-trackb',
  creditReservationId: 'credit-reservation-trackb',
  toolId: 'opencv',
  workerType: 'cpu_analysis_worker',
  executionMode: 'bounded_execution',
  inputArtifacts: [inputArtifactFor('opencv')],
  metadata: {
    providerApiKey: 'should-not-be-here',
  },
})
assert.equal(secretMetadata.status, 'blocked', 'secret-like adapter metadata should block')
assert.ok(
  secretMetadata.blockers.some((blocker) => blocker.code === 'TRACKB_ADAPTER_FORBIDDEN_METADATA'),
  'secret metadata should identify forbidden metadata blocker',
)

const service = createToolExecutionGatewayService(context)

for (const toolId of TRACK_B_ADAPTER_TOOL_IDS) {
  const contract = contracts.find((item) => item.toolId === toolId)
  assert.ok(contract, `missing gateway contract for ${toolId}`)
  const gatewayInput: ToolExecutionGatewayDispatchBody & { apiIdempotencyKey: string } = {
    workspaceId: 'workspace-trackb',
    projectId: 'project-trackb',
    jobId: `gateway-${toolId}`,
    toolExecutionPlanId: `gateway-plan-${toolId}`,
    editPlanId: 'edit-plan-trackb',
    mediaAssetId: 'media-trackb',
    approvedPlanSnapshotId: 'approved-snapshot-trackb',
    creditEstimateId: 'credit-estimate-trackb',
    creditReservationId: 'credit-reservation-trackb',
    approvedReservationRemainingCredits: 100,
    estimatedHighCredits: 3,
    workerType: contract.workerType,
    executionMode: 'mock_safe',
    adapterId: `${contract.workerType}_placeholder`,
    trackBAdapterToolId: toolId,
    trackBAdapterExecutionMode: 'bounded_execution',
    requestedToolIds: [toolId],
    requestedRecipeIds: [`${toolId}-adapter-smoke-recipe`],
    artifactReferences: [{
      id: `${toolId}-gateway-input`,
      storageBucketPurpose: inputArtifactFor(toolId).storageBucketPurpose,
      storageObjectPath: inputArtifactFor(toolId).storageObjectPath,
      isPrivate: true,
      sourceOfTruth: true,
    }],
    attempt: 1,
    maxAttempts: 1,
    metadata: {
      trackBAdapterSmoke: true,
    },
    apiIdempotencyKey: `api-idempotency-${toolId}`,
  }

  const dispatch = await service.dispatchApprovedToolCall(gatewayInput)
  assert.equal(dispatch.gateway.status, 'dispatched', `${toolId} should dispatch through the mock-safe gateway`)
  assert.equal(dispatch.trackBAdapterResult?.status, 'bounded_execution_ready', `${toolId} should expose bounded adapter readiness`)
  assert.equal(dispatch.trackBAdapterResult?.realToolExecution, false, `${toolId} gateway path must not run the real tool`)
  assert.equal(dispatch.workerResult?.status, 'completed', `${toolId} placeholder worker should complete`)
  assert.equal(dispatch.workerResult?.output?.mockOnly, true, `${toolId} worker output should stay mock-only`)
}

console.log(JSON.stringify({
  ok: true,
  adapterPackVersion: 'trackb-adapter-pack-v1',
  adapterCount: TRACK_B_ADAPTER_TOOL_IDS.length,
  executionModes: ['dry_run', 'bounded_execution'],
  gatewayCoveredTools: [...TRACK_B_ADAPTER_TOOL_IDS],
  realToolExecution: false,
}, null, 2))
