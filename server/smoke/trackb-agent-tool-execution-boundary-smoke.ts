import assert from 'node:assert/strict'
import { executeTrackBAgentTool } from '../agents/trackb-agent-tool-execution'
import { buildTrackBAgentRuntimeReadinessReport } from '../beta-readiness/trackb-agent-runtime-readiness'

const report = buildTrackBAgentRuntimeReadinessReport()
assert.equal(report.toolCount, 16)
assert.equal(report.agentContractsReady, true)
assert.equal(report.paymentIndependentRuntimeReady, true)
assert.equal(report.liveAgentExecutionReady, false)

for (const contract of report.contracts) {
  const result = await executeTrackBAgentTool({
    workspaceId: 'workspace-trackb-agent-smoke',
    projectId: 'project-trackb-agent-smoke',
    jobId: `job-trackb-agent-smoke-${contract.toolId}`,
    agentInvocationId: contract.agentInvocationId,
    toolId: contract.toolId,
    action: contract.supportedActions[0],
    approvedSnapshotId: 'approved-snapshot-trackb-agent-smoke',
    editPlanId: 'edit-plan-trackb-agent-smoke',
    toolExecutionPlanId: `tool-exec-trackb-agent-smoke-${contract.toolId}`,
    mediaAssetId: 'media-asset-trackb-agent-smoke',
    mode: contract.toolId === 'hyperframe' ? 'frontend_preview_boundary' : 'mock_safe_worker_dispatch',
    storageReferenceIds: contract.toolId === 'hyperframe'
      ? undefined
      : [`source_media/workspaces/workspace-trackb-agent-smoke/projects/project-trackb-agent-smoke/${contract.toolId}/source-reference`],
    approvedPreviewStateReference: contract.toolId === 'hyperframe'
      ? 'preview_state/workspaces/workspace-trackb-agent-smoke/projects/project-trackb-agent-smoke/hyperframe-approved-state'
      : undefined,
    apiIdempotencyKey: `api-idempotency-trackb-agent-smoke-${contract.toolId}`,
  })

  assert.equal(result.status, 'completed', `${contract.toolId} should complete the admitted boundary`)
  assert.equal(result.serviceFeeIncluded, false)
  assert.equal(result.paymentScope, 'excluded_from_this_runtime_boundary')
  assert.equal(result.liveExecutionReady, false)

  if (contract.toolId === 'hyperframe') {
    assert.equal(result.decision, 'trackb_agent_tool_execution_frontend_preview_boundary_admitted')
    assert.equal(result.previewBoundary?.workerDispatchSkipped, true)
    assert.equal(result.workerResult, undefined)
  } else {
    assert.equal(result.decision, 'trackb_agent_tool_execution_mock_safe_worker_dispatch_completed')
    assert.equal(result.workerPayload?.executionMode, 'mock_safe')
    assert.equal(result.workerPayload?.requestedToolIds[0], contract.toolId)
    assert.ok(result.workerPayload?.idempotencyKey.startsWith('prod-worker:'))
    assert.equal(result.workerResult?.status, 'completed')
    assert.equal(result.workerResult?.toolCostMetadata?.serviceFeeIncluded, false)
    assert.equal(result.workerResult?.toolCostMetadata?.mockOnly, true)
  }
}

const liveBlocked = await executeTrackBAgentTool({
  workspaceId: 'workspace-trackb-agent-smoke',
  projectId: 'project-trackb-agent-smoke',
  jobId: 'job-trackb-agent-live-blocked',
  agentInvocationId: 'trackb.media_oss.ffmpeg',
  toolId: 'ffmpeg',
  action: 'proxy_encode',
  approvedSnapshotId: 'approved-snapshot-trackb-agent-smoke',
  toolExecutionPlanId: 'tool-exec-trackb-agent-live-blocked',
  mode: 'deployed_live_execution',
  storageReferenceIds: ['source_media/workspaces/workspace-trackb-agent-smoke/projects/project-trackb-agent-smoke/source-reference'],
})
assert.equal(liveBlocked.status, 'blocked')
assert.match(liveBlocked.blockedReason ?? '', /deployed product-ready evidence/i)
assert.equal(liveBlocked.workerResult, undefined)

const rawPromptBlocked = await executeTrackBAgentTool({
  workspaceId: 'workspace-trackb-agent-smoke',
  projectId: 'project-trackb-agent-smoke',
  jobId: 'job-trackb-agent-raw-prompt',
  agentInvocationId: 'trackb.media_oss.ffprobe',
  toolId: 'ffprobe',
  action: 'stream_probe',
  approvedSnapshotId: 'approved-snapshot-trackb-agent-smoke',
  toolExecutionPlanId: 'tool-exec-trackb-agent-raw-prompt',
  mode: 'mock_safe_worker_dispatch',
  storageReferenceIds: ['source_media/workspaces/workspace-trackb-agent-smoke/projects/project-trackb-agent-smoke/source-reference'],
  metadata: { rawPrompt: 'cut this however the chat says' },
})
assert.equal(rawPromptBlocked.status, 'blocked')
assert.match(rawPromptBlocked.blockedReason ?? '', /forbidden raw prompt/i)

const unsupportedAction = await executeTrackBAgentTool({
  workspaceId: 'workspace-trackb-agent-smoke',
  projectId: 'project-trackb-agent-smoke',
  jobId: 'job-trackb-agent-unsupported-action',
  agentInvocationId: 'trackb.media_oss.polars',
  toolId: 'polars',
  action: 'run_arbitrary_python',
  approvedSnapshotId: 'approved-snapshot-trackb-agent-smoke',
  toolExecutionPlanId: 'tool-exec-trackb-agent-unsupported-action',
  mode: 'mock_safe_worker_dispatch',
  storageReferenceIds: ['analysis_artifacts/workspaces/workspace-trackb-agent-smoke/projects/project-trackb-agent-smoke/table-reference'],
})
assert.equal(unsupportedAction.status, 'blocked')
assert.match(unsupportedAction.blockedReason ?? '', /Unsupported action/)

console.log(JSON.stringify({
  ok: true,
  admittedToolCount: report.contracts.length,
  liveExecutionReady: report.liveAgentExecutionReady,
  checks: [
    'all_16_trackb_agent_invocations_admit',
    'backend_tools_dispatch_mock_safe_worker_payloads',
    'hyperframe_stays_frontend_preview_boundary',
    'live_execution_blocks_until_deployed_evidence',
    'raw_prompt_blocks_before_dispatch',
    'unsupported_actions_block',
    'service_fee_excluded',
  ],
}, null, 2))
