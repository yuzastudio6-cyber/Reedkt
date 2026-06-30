import assert from 'node:assert/strict'
import { executeTrackBAgentTool } from '../agents/trackb-agent-tool-execution'
import { buildTrackBAgentRuntimeReadinessReport } from '../beta-readiness/trackb-agent-runtime-readiness'
import { runProductionToolReadiness } from '../workers/production-readiness'
import {
  sharedMockCreditEstimateStore,
  sharedMockCreditReservationStore,
} from '../services/mock-credit-foundation-stores'

const report = buildTrackBAgentRuntimeReadinessReport()
assert.equal(report.toolCount, 16)
assert.equal(report.agentContractsReady, true)
assert.equal(report.paymentIndependentRuntimeReady, true)
assert.equal(report.liveAgentExecutionReady, false)

const expectedWorkerHandlers: Record<string, string> = {
  ffmpeg: 'render_worker_final_render_export_execution',
  ffprobe: 'cpu_analysis_worker_media_foundation',
  pyav: 'cpu_analysis_worker_media_foundation',
  opentimelineio: 'cpu_analysis_worker_timeline_foundation',
  remotion: 'render_worker_final_render_export_execution',
  sharp: 'trackb_agent_tool_recipe_dry_run',
  duckdb: 'trackb_agent_tool_recipe_dry_run',
  polars: 'trackb_agent_tool_recipe_dry_run',
  pyscenedetect: 'cpu_analysis_worker_smart_cut_foundation',
  opencv: 'cpu_analysis_worker_media_foundation',
  opencolorio: 'cpu_analysis_worker_color_execution',
  openimageio: 'cpu_analysis_worker_color_execution',
  audioflux: 'cpu_analysis_worker_audio_foundation',
  signalsmith_stretch: 'cpu_analysis_worker_audio_execution',
  libass: 'render_worker_caption_execution',
}

for (const contract of report.contracts) {
  assert.ok(
    contract.admittedModes.includes('bounded_runtime_probe'),
    `${contract.toolId} should admit bounded runtime probe mode`,
  )

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
    assert.equal(
      result.workerResult?.output?.futureHandler,
      expectedWorkerHandlers[contract.toolId],
      `${contract.toolId} should route to the intended Track B worker recipe handler`,
    )
    assert.notEqual(result.workerResult?.output?.futureHandler, `${contract.workerType}_placeholder`)
    assert.equal(result.workerResult?.toolCostMetadata?.serviceFeeIncluded, false)
    assert.equal(result.workerResult?.toolCostMetadata?.mockOnly, true)
  }
}

const scopedHyperframeProbe = await executeTrackBAgentTool({
  workspaceId: 'workspace-trackb-agent-smoke',
  projectId: 'project-trackb-agent-smoke',
  jobId: 'job-trackb-agent-bounded-probe-hyperframe',
  agentInvocationId: 'trackb.media_oss.hyperframe',
  toolId: 'hyperframe',
  action: 'preview_timeline',
  approvedSnapshotId: 'approved-snapshot-trackb-agent-smoke',
  toolExecutionPlanId: 'tool-exec-trackb-agent-bounded-probe-hyperframe',
  mode: 'bounded_runtime_probe',
  approvedPreviewStateReference: 'preview_state/workspaces/workspace-trackb-agent-smoke/projects/project-trackb-agent-smoke/hyperframe-approved-state',
})
assert.equal(scopedHyperframeProbe.status, 'completed')
assert.equal(scopedHyperframeProbe.decision, 'trackb_agent_tool_execution_bounded_runtime_probe_completed')
assert.equal(scopedHyperframeProbe.runtimeReadinessProof?.toolId, 'hyperframe')
assert.equal(scopedHyperframeProbe.runtimeReadinessProof?.probeKind, 'command_import_package_metadata_only')
assert.equal(scopedHyperframeProbe.runtimeReadinessProof?.mediaProcessing, false)
assert.equal(scopedHyperframeProbe.runtimeReadinessProof?.productRuntimeExecution, false)
assert.equal(scopedHyperframeProbe.runtimeReadinessProof?.backendEvidenceRecorded, false)
assert.deepEqual(scopedHyperframeProbe.runtimeReadinessProof?.checkModes, ['node_package_metadata'])
assert.equal(scopedHyperframeProbe.workerResult, undefined)

const scopedReadiness = runProductionToolReadiness({
  realCheckMode: true,
  strict: false,
  toolIds: ['hyperframe'],
})
assert.deepEqual(scopedReadiness.results.map((item) => item.toolId), ['hyperframe'])
assert.deepEqual(
  scopedReadiness.coreToolReadiness?.results.map((item) => item.toolId),
  ['hyperframe'],
  'scoped Hyperframe readiness must not execute unrelated command/import checks',
)

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

const deployedReadinessReport = buildTrackBAgentRuntimeReadinessReport({
  deployedEvidenceSource: 'stored_operator_status_readback',
  deployedEvidenceWorkspaceId: 'workspace-trackb-agent-smoke',
  deployedEvidencePacketCount: 2,
  deployedEvidenceRecordedToolCount: 16,
})
const liveScenario = createApprovedCreditScenario('live-duckdb')
const liveAdmitted = await executeTrackBAgentTool({
  workspaceId: liveScenario.workspaceId,
  projectId: liveScenario.projectId,
  jobId: 'job-trackb-agent-live-admitted-duckdb',
  agentInvocationId: 'trackb.media_oss.duckdb',
  toolId: 'duckdb',
  action: 'query_artifacts',
  approvedSnapshotId: `approved-snapshot-${liveScenario.projectId}`,
  editPlanId: liveScenario.editPlanId,
  toolExecutionPlanId: 'tool-exec-trackb-agent-live-admitted-duckdb',
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
}, { readinessReport: deployedReadinessReport })
assert.equal(liveAdmitted.status, 'completed')
assert.equal(liveAdmitted.decision, 'trackb_agent_tool_execution_deployed_live_execution_completed')
assert.equal(liveAdmitted.liveExecutionReady, true)
assert.equal(liveAdmitted.workerPayload?.executionMode, 'production_ready')
assert.equal(liveAdmitted.workerPayload?.creditReservationId, liveScenario.creditReservationId)
assert.equal(liveAdmitted.workerResult?.status, 'completed')
assert.equal(liveAdmitted.workerResult?.toolCostMetadata?.serviceFeeIncluded, false)
assert.equal(liveAdmitted.workerResult?.toolCostMetadata?.emittedEvents.length, 1)
assert.equal(liveAdmitted.workerResult?.toolCostMetadata?.emittedEvents[0]?.billableToUser, true)

const liveHyperframeBlocked = await executeTrackBAgentTool({
  workspaceId: 'workspace-trackb-agent-smoke',
  projectId: 'project-trackb-agent-smoke',
  jobId: 'job-trackb-agent-live-hyperframe-blocked',
  agentInvocationId: 'trackb.media_oss.hyperframe',
  toolId: 'hyperframe',
  action: 'preview_timeline',
  approvedSnapshotId: 'approved-snapshot-trackb-agent-smoke',
  toolExecutionPlanId: 'tool-exec-trackb-agent-live-hyperframe-blocked',
  mode: 'deployed_live_execution',
  approvedPreviewStateReference: 'preview_state/workspaces/workspace-trackb-agent-smoke/projects/project-trackb-agent-smoke/hyperframe-approved-state',
}, { readinessReport: deployedReadinessReport })
assert.equal(liveHyperframeBlocked.status, 'blocked')
assert.match(liveHyperframeBlocked.blockedReason ?? '', /not admitted for hyperframe/i)

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
  deployedLiveExecutionReadyWhenEvidenceRecorded: deployedReadinessReport.liveAgentExecutionReady,
  checks: [
    'all_16_trackb_agent_invocations_admit',
    'backend_tools_dispatch_mock_safe_worker_payloads',
    'backend_tools_select_trackb_worker_recipe_handlers',
    'bounded_runtime_probe_runs_scoped_command_import_package_metadata_checks',
    'hyperframe_stays_frontend_preview_boundary',
    'live_execution_blocks_until_deployed_evidence',
    'live_execution_admits_production_ready_worker_after_stored_evidence_and_credit_references',
    'hyperframe_never_switches_to_backend_live_execution',
    'raw_prompt_blocks_before_dispatch',
    'unsupported_actions_block',
    'service_fee_excluded',
  ],
}, null, 2))

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
    reservationReason: 'Track B agent live-admission smoke fixture.',
    idempotencyKey: `reservation-trackb-${label}`,
    reservedAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    metadata: { mockOnly: true, smoke: 'trackb-agent-tool-execution-boundary' },
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
