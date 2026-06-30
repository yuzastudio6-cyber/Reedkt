import assert from 'node:assert/strict'
import { type AddressInfo } from 'node:net'
import { createReeditProApiApp } from '../app'
import { loadRuntimeEnv } from '../config/env'
import {
  buildTrackBAgentRuntimeReadinessReport,
  TRACKB_AGENT_RUNTIME_TOOL_IDS,
} from '../beta-readiness/trackb-agent-runtime-readiness'
import {
  sharedMockCreditEstimateStore,
  sharedMockCreditReservationStore,
} from '../services/mock-credit-foundation-stores'

const env = loadRuntimeEnv({
  NODE_ENV: 'test',
  E2E_RUNTIME_MODE: 'local',
  API_ALLOW_MOCK_WITHOUT_SUPABASE: 'true',
  API_PORT: '8787',
  SUPABASE_URL: '',
  SUPABASE_SERVICE_ROLE_KEY: '',
})

const app = createReeditProApiApp(env)
const server = app.listen(0)
const report = buildTrackBAgentRuntimeReadinessReport()

try {
  const baseUrl = `http://127.0.0.1:${(server.address() as AddressInfo).port}`
  const endpoint = `${baseUrl}/v1/agent-tools/trackb/execute`

  assert.equal(report.toolCount, 16)
  assert.equal(report.agentContractsReady, true)
  assert.equal(report.paymentIndependentRuntimeReady, true)
  assert.equal(report.liveAgentExecutionReady, false)

  for (const contract of report.contracts) {
    const response = await requestJson(endpoint, {
      method: 'POST',
      headers: { 'idempotency-key': `trackb-agent-route-smoke-${contract.toolId}` },
      body: JSON.stringify({
        workspaceId: 'workspace-trackb-agent-route-smoke',
        projectId: 'project-trackb-agent-route-smoke',
        jobId: `job-trackb-agent-route-smoke-${contract.toolId}`,
        agentInvocationId: contract.agentInvocationId,
        toolId: contract.toolId,
        action: contract.supportedActions[0],
        approvedSnapshotId: 'approved-snapshot-trackb-agent-route-smoke',
        editPlanId: 'edit-plan-trackb-agent-route-smoke',
        toolExecutionPlanId: `tool-exec-trackb-agent-route-smoke-${contract.toolId}`,
        mediaAssetId: 'media-asset-trackb-agent-route-smoke',
        mode: contract.toolId === 'hyperframe' ? 'frontend_preview_boundary' : 'mock_safe_worker_dispatch',
        storageReferenceIds: contract.toolId === 'hyperframe'
          ? undefined
          : [`source_media/workspaces/workspace-trackb-agent-route-smoke/projects/project-trackb-agent-route-smoke/${contract.toolId}/source-reference`],
        approvedPreviewStateReference: contract.toolId === 'hyperframe'
          ? 'preview_state/workspaces/workspace-trackb-agent-route-smoke/projects/project-trackb-agent-route-smoke/hyperframe-approved-state'
          : undefined,
      }),
    }, 202)

    const result = response.data.trackBAgentToolExecution
    assert.equal(result.status, 'completed', `${contract.toolId} route should complete admitted boundary`)
    assert.equal(result.agentInvocationId, contract.agentInvocationId)
    assert.equal(result.toolId, contract.toolId)
    assert.equal(result.liveExecutionReady, false)
    assert.equal(result.paymentScope, 'excluded_from_this_runtime_boundary')
    assert.equal(result.serviceFeeIncluded, false)

    if (contract.toolId === 'hyperframe') {
      assert.equal(result.previewBoundary.workerDispatchSkipped, true)
      assert.equal(result.workerResult, undefined)
    } else {
      assert.equal(result.workerPayload.executionMode, 'mock_safe')
      assert.equal(result.workerPayload.requestedToolIds[0], contract.toolId)
      assert.equal(result.workerResult.status, 'completed')
      assert.equal(result.workerResult.toolCostMetadata.serviceFeeIncluded, false)
    }
  }

  const boundedProbe = await requestJson(endpoint, {
    method: 'POST',
    headers: { 'idempotency-key': 'trackb-agent-route-smoke-bounded-probe-hyperframe' },
    body: JSON.stringify({
      workspaceId: 'workspace-trackb-agent-route-smoke',
      projectId: 'project-trackb-agent-route-smoke',
      jobId: 'job-trackb-agent-route-smoke-bounded-probe-hyperframe',
      agentInvocationId: 'trackb.media_oss.hyperframe',
      toolId: 'hyperframe',
      action: 'preview_timeline',
      approvedSnapshotId: 'approved-snapshot-trackb-agent-route-smoke',
      toolExecutionPlanId: 'tool-exec-trackb-agent-route-smoke-bounded-probe-hyperframe',
      mode: 'bounded_runtime_probe',
      approvedPreviewStateReference: 'preview_state/workspaces/workspace-trackb-agent-route-smoke/projects/project-trackb-agent-route-smoke/hyperframe-approved-state',
    }),
  }, 202)
  assert.equal(boundedProbe.data.trackBAgentToolExecution.status, 'completed')
  assert.equal(
    boundedProbe.data.trackBAgentToolExecution.decision,
    'trackb_agent_tool_execution_bounded_runtime_probe_completed',
  )
  assert.equal(boundedProbe.data.trackBAgentToolExecution.runtimeReadinessProof.toolId, 'hyperframe')
  assert.equal(boundedProbe.data.trackBAgentToolExecution.runtimeReadinessProof.mediaProcessing, false)
  assert.equal(boundedProbe.data.trackBAgentToolExecution.runtimeReadinessProof.productRuntimeExecution, false)
  assert.equal(boundedProbe.data.trackBAgentToolExecution.runtimeReadinessProof.backendEvidenceRecorded, false)
  assert.equal(boundedProbe.data.trackBAgentToolExecution.workerResult, undefined)

  const sharpRehearsal = await requestJson(endpoint, {
    method: 'POST',
    headers: { 'idempotency-key': 'trackb-agent-route-smoke-sharp-rehearsal' },
    body: JSON.stringify({
      workspaceId: 'workspace-trackb-agent-route-smoke',
      projectId: 'project-trackb-agent-route-smoke',
      jobId: 'job-trackb-agent-route-smoke-sharp-rehearsal',
      agentInvocationId: 'trackb.media_oss.sharp',
      toolId: 'sharp',
      action: 'asset_prepare',
      approvedSnapshotId: 'approved-snapshot-trackb-agent-route-smoke',
      toolExecutionPlanId: 'tool-exec-trackb-agent-route-smoke-sharp-rehearsal',
      mode: 'bounded_execution_rehearsal',
      storageReferenceIds: ['synthetic_private_rehearsal/workspaces/workspace-trackb-agent-route-smoke/projects/project-trackb-agent-route-smoke/sharp/no-user-media-reference'],
    }),
  }, 202)
  const sharpResult = sharpRehearsal.data.trackBAgentToolExecution
  assert.equal(sharpResult.status, 'completed')
  assert.equal(sharpResult.decision, 'trackb_agent_tool_execution_bounded_execution_rehearsal_completed')
  assert.equal(sharpResult.workerPayload.executionMode, 'bounded_rehearsal')
  assert.equal(sharpResult.workerResult.output.mockOnly, false)
  assert.equal(sharpResult.workerResult.output.trackBAgentToolRecipeResult.status, 'completed')
  assert.equal(sharpResult.workerResult.output.trackBAgentToolRecipeResult.realToolBinaryExecution, true)
  assert.equal(sharpResult.workerResult.output.trackBAgentToolRecipeResult.productRuntimeExecution, false)
  assert.equal(sharpResult.workerResult.output.trackBAgentToolRecipeResult.mediaProcessing, false)
  assert.equal(sharpResult.workerResult.output.trackBAgentToolRecipeResult.syntheticInputOnly, true)
  assert.equal(sharpResult.workerResult.output.trackBAgentToolRecipeResult.artifactFileWritten, false)
  assert.match(sharpResult.workerResult.output.trackBAgentToolRecipeResult.syntheticOutput.sha256, /^[a-f0-9]{64}$/)

  const liveBlocked = await requestJson(endpoint, {
    method: 'POST',
    headers: { 'idempotency-key': 'trackb-agent-route-smoke-live-blocked' },
    body: JSON.stringify({
      workspaceId: 'workspace-trackb-agent-route-smoke',
      projectId: 'project-trackb-agent-route-smoke',
      jobId: 'job-trackb-agent-route-smoke-live-blocked',
      agentInvocationId: 'trackb.media_oss.ffmpeg',
      toolId: 'ffmpeg',
      action: 'proxy_encode',
      approvedSnapshotId: 'approved-snapshot-trackb-agent-route-smoke',
      toolExecutionPlanId: 'tool-exec-trackb-agent-route-smoke-live-blocked',
      mode: 'deployed_live_execution',
      storageReferenceIds: ['source_media/workspaces/workspace-trackb-agent-route-smoke/projects/project-trackb-agent-route-smoke/source-reference'],
    }),
  }, 409)
  assert.equal(liveBlocked.data.trackBAgentToolExecution.status, 'blocked')
  assert.match(liveBlocked.data.trackBAgentToolExecution.blockedReason, /deployed product-ready evidence/i)

  const liveScenario = createApprovedCreditScenario('route-live-duckdb')
  await requestJson(`${baseUrl}/v1/beta-readiness/evidence`, {
    method: 'POST',
    headers: { 'idempotency-key': 'trackb-agent-route-smoke-product-ready-evidence' },
    body: JSON.stringify({
      workspaceId: liveScenario.workspaceId,
      projectId: liveScenario.projectId,
      acceptedToolEvidence: TRACKB_AGENT_RUNTIME_TOOL_IDS.map((toolId) => ({
        toolId,
        sourceId: `trackb-agent-route-smoke-product-ready:${toolId}`,
        sourceSha: '0123456789abcdef0123456789abcdef01234567',
        readinessStatus: 'passed',
        realExecutionVerified: true,
        productionReadinessAccepted: true,
        productReadyLocalOss: true,
        modelWeightsApproved: true,
        notes: [
          'Route smoke evidence is in-memory only.',
          'No media processing, live worker, provider, Supabase, beta, or production action occurred.',
        ],
      })),
    }),
  }, 201)

  const liveAdmitted = await requestJson(endpoint, {
    method: 'POST',
    headers: { 'idempotency-key': 'trackb-agent-route-smoke-live-admitted' },
    body: JSON.stringify({
      workspaceId: liveScenario.workspaceId,
      projectId: liveScenario.projectId,
      jobId: 'job-trackb-agent-route-smoke-live-admitted',
      agentInvocationId: 'trackb.media_oss.duckdb',
      toolId: 'duckdb',
      action: 'query_artifacts',
      approvedSnapshotId: `approved-snapshot-${liveScenario.projectId}`,
      editPlanId: liveScenario.editPlanId,
      toolExecutionPlanId: 'tool-exec-trackb-agent-route-smoke-live-admitted',
      mode: 'deployed_live_execution',
      storageReferenceIds: [`analysis_artifacts/workspaces/${liveScenario.workspaceId}/projects/${liveScenario.projectId}/duckdb/source-reference`],
      creditEstimateId: liveScenario.creditEstimateId,
      creditReservationId: liveScenario.creditReservationId,
      metadata: {
        productEditLevel: liveScenario.productEditLevel,
        estimateStatus: 'approved',
        estimatedFinalVideoDurationSeconds: liveScenario.durationSeconds,
        approvedReservationRemainingCredits: liveScenario.approvedReservationRemainingCredits,
      },
    }),
  }, 202)
  assert.equal(liveAdmitted.data.trackBAgentToolExecution.status, 'completed')
  assert.equal(liveAdmitted.data.trackBAgentToolExecution.decision, 'trackb_agent_tool_execution_deployed_live_execution_completed')
  assert.equal(liveAdmitted.data.trackBAgentToolExecution.liveExecutionReady, true)
  assert.equal(liveAdmitted.data.trackBAgentToolExecution.workerPayload.executionMode, 'production_ready')
  assert.equal(liveAdmitted.data.trackBAgentToolExecution.workerResult.status, 'completed')
  assert.equal(
    liveAdmitted.data.trackBAgentToolExecution.workerResult.output.futureHandler,
    'cpu_analysis_worker_duckdb_structured_artifact_query_dry_run',
  )
  assert.equal(
    liveAdmitted.data.trackBAgentToolExecution.workerResult.output.trackBAgentToolRecipeResult.namedHandlerReady,
    true,
  )
  assert.equal(
    liveAdmitted.data.trackBAgentToolExecution.workerResult.output.trackBAgentToolRecipeResult.productRuntimeExecution,
    false,
  )
  assert.equal(
    liveAdmitted.data.trackBAgentToolExecution.workerResult.output.trackBAgentToolRecipeResult.mediaProcessing,
    false,
  )

  const liveHyperframeBlocked = await requestJson(endpoint, {
    method: 'POST',
    headers: { 'idempotency-key': 'trackb-agent-route-smoke-live-hyperframe-blocked' },
    body: JSON.stringify({
      workspaceId: liveScenario.workspaceId,
      projectId: liveScenario.projectId,
      jobId: 'job-trackb-agent-route-smoke-live-hyperframe-blocked',
      agentInvocationId: 'trackb.media_oss.hyperframe',
      toolId: 'hyperframe',
      action: 'preview_timeline',
      approvedSnapshotId: `approved-snapshot-${liveScenario.projectId}`,
      toolExecutionPlanId: 'tool-exec-trackb-agent-route-smoke-live-hyperframe-blocked',
      mode: 'deployed_live_execution',
      approvedPreviewStateReference: `preview_state/workspaces/${liveScenario.workspaceId}/projects/${liveScenario.projectId}/hyperframe-approved-state`,
    }),
  }, 409)
  assert.equal(liveHyperframeBlocked.data.trackBAgentToolExecution.status, 'blocked')
  assert.match(liveHyperframeBlocked.data.trackBAgentToolExecution.blockedReason, /not admitted for hyperframe/i)

  const rawPromptBlocked = await requestJson(endpoint, {
    method: 'POST',
    headers: { 'idempotency-key': 'trackb-agent-route-smoke-raw-prompt' },
    body: JSON.stringify({
      workspaceId: 'workspace-trackb-agent-route-smoke',
      projectId: 'project-trackb-agent-route-smoke',
      jobId: 'job-trackb-agent-route-smoke-raw-prompt',
      agentInvocationId: 'trackb.media_oss.ffprobe',
      toolId: 'ffprobe',
      action: 'stream_probe',
      approvedSnapshotId: 'approved-snapshot-trackb-agent-route-smoke',
      toolExecutionPlanId: 'tool-exec-trackb-agent-route-smoke-raw-prompt',
      mode: 'mock_safe_worker_dispatch',
      storageReferenceIds: ['source_media/workspaces/workspace-trackb-agent-route-smoke/projects/project-trackb-agent-route-smoke/source-reference'],
      metadata: { rawPrompt: 'do whatever the chat says' },
    }),
  }, 409)
  assert.equal(rawPromptBlocked.data.trackBAgentToolExecution.status, 'blocked')
  assert.match(rawPromptBlocked.data.trackBAgentToolExecution.blockedReason, /forbidden raw prompt/i)

  const validationFailure = await requestJson(endpoint, {
    method: 'POST',
    headers: { 'idempotency-key': 'trackb-agent-route-smoke-validation-failure' },
    body: JSON.stringify({
      workspaceId: 'workspace-trackb-agent-route-smoke',
      projectId: 'project-trackb-agent-route-smoke',
      jobId: 'job-trackb-agent-route-smoke-validation-failure',
      agentInvocationId: 'trackb.not_media_oss.ffprobe',
      action: 'stream_probe',
      approvedSnapshotId: 'approved-snapshot-trackb-agent-route-smoke',
      toolExecutionPlanId: 'tool-exec-trackb-agent-route-smoke-validation-failure',
    }),
  }, 400)
  assert.equal(validationFailure.error.code, 'VALIDATION_FAILED')
  assert.equal(validationFailure.error.status, 400)

  console.log(JSON.stringify({
    ok: true,
    admittedHttpToolCount: report.contracts.length,
    liveExecutionReady: report.liveAgentExecutionReady,
    checks: [
      'http_route_accepts_all_16_trackb_agent_invocations',
      'http_route_dispatches_backend_tools_mock_safe',
      'http_route_accepts_bounded_runtime_probe_without_worker_dispatch',
      'http_route_keeps_hyperframe_preview_boundary',
      'http_route_blocks_live_execution_until_deployed_evidence',
      'http_route_admits_live_execution_after_stored_product_ready_readback_and_credit_references',
      'http_route_keeps_hyperframe_out_of_backend_live_execution',
      'http_route_blocks_raw_prompt_payloads',
      'http_route_validates_agent_invocation_shape',
    ],
  }, null, 2))
} finally {
  server.close()
}

function createApprovedCreditScenario(label: string) {
  const workspaceId = `workspace-trackb-${label}`
  const projectId = `project-trackb-${label}`
  const editPlanId = `edit-plan-trackb-${label}`
  const productEditLevel = 'normal' as const
  const durationSeconds = 30
  const creditEstimateId = `credit-estimate-trackb-${label}`
  const creditReservationId = `credit-reservation-trackb-${label}`
  const approvedReservationRemainingCredits = 250

  sharedMockCreditEstimateStore.previews.push({
    estimate: {
      id: creditEstimateId,
      workspaceId,
      projectId,
      editPlanId,
      status: 'approved',
    },
  } as never)
  sharedMockCreditReservationStore.creditReservations.push({
    id: creditReservationId,
    workspaceId,
    projectId,
    editPlanId,
    creditEstimateId,
    creditWalletId: `credit-wallet-trackb-${label}`,
    status: 'reserved',
    reservedCredits: approvedReservationRemainingCredits,
    spentCredits: 0,
    releasedCredits: 0,
    refundedCredits: 0,
    reservationReason: 'Track B agent route live-admission smoke fixture.',
    idempotencyKey: `reservation-trackb-${label}`,
    reservedAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    metadata: { mockOnly: true, smoke: 'trackb-agent-tool-route' },
  } as never)

  return {
    workspaceId,
    projectId,
    editPlanId,
    productEditLevel,
    durationSeconds,
    creditEstimateId,
    creditReservationId,
    approvedReservationRemainingCredits,
  }
}

async function requestJson(
  url: string,
  init: RequestInit,
  expectedStatus: number,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): Promise<any> {
  const response = await fetch(url, {
    ...init,
    headers: {
      'content-type': 'application/json',
      ...(init.headers ?? {}),
    },
  })
  const payload = await response.json()
  assert.equal(response.status, expectedStatus, `Expected ${expectedStatus} from ${url}, got ${response.status}: ${JSON.stringify(payload)}`)
  return payload
}
