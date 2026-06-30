import assert from 'node:assert/strict'
import { type AddressInfo } from 'node:net'
import { createReeditProApiApp } from '../app'
import { loadRuntimeEnv } from '../config/env'
import { buildTrackBAgentRuntimeReadinessReport } from '../beta-readiness/trackb-agent-runtime-readiness'

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
      'http_route_keeps_hyperframe_preview_boundary',
      'http_route_blocks_live_execution_until_deployed_evidence',
      'http_route_blocks_raw_prompt_payloads',
      'http_route_validates_agent_invocation_shape',
    ],
  }, null, 2))
} finally {
  server.close()
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
