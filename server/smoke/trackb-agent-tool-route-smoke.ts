import assert from 'node:assert/strict'
import { existsSync } from 'node:fs'
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
const rehearsalPython = findBoundedRehearsalPython()
assert.ok(
  rehearsalPython,
  'Python-backed bounded route rehearsals require REEDITPRO_READINESS_PYTHON_BIN or .reeditpro-tool-readiness-python/bin/python.',
)
process.env.REEDITPRO_READINESS_PYTHON_BIN = rehearsalPython

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

  const hyperframeRehearsal = await requestJson(endpoint, {
    method: 'POST',
    headers: { 'idempotency-key': 'trackb-agent-route-smoke-hyperframe-rehearsal' },
    body: JSON.stringify({
      workspaceId: 'workspace-trackb-agent-route-smoke',
      projectId: 'project-trackb-agent-route-smoke',
      jobId: 'job-trackb-agent-route-smoke-hyperframe-rehearsal',
      agentInvocationId: 'trackb.media_oss.hyperframe',
      toolId: 'hyperframe',
      action: 'preview_timeline',
      approvedSnapshotId: 'approved-snapshot-trackb-agent-route-smoke',
      editPlanId: 'edit-plan-trackb-agent-route-smoke',
      mediaAssetId: 'synthetic-media-asset-trackb-agent-route-smoke',
      toolExecutionPlanId: 'tool-exec-trackb-agent-route-smoke-hyperframe-rehearsal',
      mode: 'bounded_execution_rehearsal',
      approvedPreviewStateReference: 'preview_state/workspaces/workspace-trackb-agent-route-smoke/projects/project-trackb-agent-route-smoke/hyperframe-approved-state',
    }),
  }, 202)
  const hyperframeResult = hyperframeRehearsal.data.trackBAgentToolExecution
  assert.equal(hyperframeResult.status, 'completed')
  assert.equal(hyperframeResult.decision, 'trackb_agent_tool_execution_bounded_execution_rehearsal_completed')
  assert.equal(hyperframeResult.previewBoundary.workerDispatchSkipped, true)
  assert.equal(hyperframeResult.workerResult, undefined)
  assert.equal(hyperframeResult.previewRehearsal.status, 'completed')
  assert.equal(hyperframeResult.previewRehearsal.routeClass, 'timeline_bridge_bounded_rehearsal')
  assert.equal(hyperframeResult.previewRehearsal.productRuntimeExecution, false)
  assert.equal(hyperframeResult.previewRehearsal.mediaProcessing, false)
  assert.equal(hyperframeResult.previewRehearsal.artifactFileWritten, false)
  assert.equal(hyperframeResult.previewRehearsal.proof.bridgeType, 'hyperframe_timeline_bridge')
  assert.equal(hyperframeResult.previewRehearsal.proof.clipCount, 1)
  assert.equal(hyperframeResult.previewRehearsal.proof.editDecisionCount, 1)

  const ffmpegRehearsal = await requestJson(endpoint, {
    method: 'POST',
    headers: { 'idempotency-key': 'trackb-agent-route-smoke-ffmpeg-rehearsal' },
    body: JSON.stringify({
      workspaceId: 'workspace-trackb-agent-route-smoke',
      projectId: 'project-trackb-agent-route-smoke',
      jobId: 'job-trackb-agent-route-smoke-ffmpeg-rehearsal',
      agentInvocationId: 'trackb.media_oss.ffmpeg',
      toolId: 'ffmpeg',
      action: 'probe_support',
      approvedSnapshotId: 'approved-snapshot-trackb-agent-route-smoke',
      toolExecutionPlanId: 'tool-exec-trackb-agent-route-smoke-ffmpeg-rehearsal',
      mode: 'bounded_execution_rehearsal',
      storageReferenceIds: ['synthetic_media/workspaces/workspace-trackb-agent-route-smoke/projects/project-trackb-agent-route-smoke/ffmpeg/source-reference'],
    }),
  }, 202)
  const ffmpegResult = ffmpegRehearsal.data.trackBAgentToolExecution
  assert.equal(ffmpegResult.status, 'completed')
  assert.equal(ffmpegResult.decision, 'trackb_agent_tool_execution_bounded_execution_rehearsal_completed')
  assert.equal(ffmpegResult.workerPayload.executionMode, 'bounded_rehearsal')
  assert.equal(ffmpegResult.workerResult.output.mockOnly, false)
  assert.equal(ffmpegResult.workerResult.output.trackBAgentToolRecipeResult.realToolBinaryExecution, true)
  assert.equal(ffmpegResult.workerResult.output.trackBAgentToolRecipeResult.productRuntimeExecution, false)
  assert.equal(ffmpegResult.workerResult.output.trackBAgentToolRecipeResult.mediaProcessing, false)
  assert.equal(ffmpegResult.workerResult.output.trackBAgentToolRecipeResult.syntheticMediaProcessing, true)
  assert.equal(ffmpegResult.workerResult.output.trackBAgentToolRecipeResult.syntheticInputOnly, true)
  assert.equal(ffmpegResult.workerResult.output.trackBAgentToolRecipeResult.artifactFileWritten, false)
  assert.equal(ffmpegResult.workerResult.output.trackBAgentToolRecipeResult.proof.operation, 'synthetic_lavfi_video_to_null_muxer')
  assert.equal(ffmpegResult.workerResult.output.trackBAgentToolRecipeResult.proof.frames, 1)
  assert.equal(ffmpegResult.workerResult.output.trackBAgentToolRecipeResult.proof.progress, 'end')

  const ffprobeRehearsal = await requestJson(endpoint, {
    method: 'POST',
    headers: { 'idempotency-key': 'trackb-agent-route-smoke-ffprobe-rehearsal' },
    body: JSON.stringify({
      workspaceId: 'workspace-trackb-agent-route-smoke',
      projectId: 'project-trackb-agent-route-smoke',
      jobId: 'job-trackb-agent-route-smoke-ffprobe-rehearsal',
      agentInvocationId: 'trackb.media_oss.ffprobe',
      toolId: 'ffprobe',
      action: 'stream_probe',
      approvedSnapshotId: 'approved-snapshot-trackb-agent-route-smoke',
      toolExecutionPlanId: 'tool-exec-trackb-agent-route-smoke-ffprobe-rehearsal',
      mode: 'bounded_execution_rehearsal',
      storageReferenceIds: ['synthetic_media/workspaces/workspace-trackb-agent-route-smoke/projects/project-trackb-agent-route-smoke/ffprobe/source-reference'],
    }),
  }, 202)
  const ffprobeResult = ffprobeRehearsal.data.trackBAgentToolExecution
  assert.equal(ffprobeResult.status, 'completed')
  assert.equal(ffprobeResult.decision, 'trackb_agent_tool_execution_bounded_execution_rehearsal_completed')
  assert.equal(ffprobeResult.workerPayload.executionMode, 'bounded_rehearsal')
  assert.equal(ffprobeResult.workerResult.output.mockOnly, false)
  assert.equal(ffprobeResult.workerResult.output.trackBAgentToolRecipeResult.realToolBinaryExecution, true)
  assert.equal(ffprobeResult.workerResult.output.trackBAgentToolRecipeResult.productRuntimeExecution, false)
  assert.equal(ffprobeResult.workerResult.output.trackBAgentToolRecipeResult.mediaProcessing, false)
  assert.equal(ffprobeResult.workerResult.output.trackBAgentToolRecipeResult.syntheticMediaProcessing, true)
  assert.equal(ffprobeResult.workerResult.output.trackBAgentToolRecipeResult.syntheticInputOnly, true)
  assert.equal(ffprobeResult.workerResult.output.trackBAgentToolRecipeResult.artifactFileWritten, false)
  assert.equal(ffprobeResult.workerResult.output.trackBAgentToolRecipeResult.proof.operation, 'synthetic_lavfi_stream_probe')
  assert.equal(ffprobeResult.workerResult.output.trackBAgentToolRecipeResult.proof.streamCount, 1)
  assert.equal(ffprobeResult.workerResult.output.trackBAgentToolRecipeResult.proof.codecType, 'video')
  assert.equal(ffprobeResult.workerResult.output.trackBAgentToolRecipeResult.proof.width, 16)
  assert.equal(ffprobeResult.workerResult.output.trackBAgentToolRecipeResult.proof.height, 16)

  const remotionRehearsal = await requestJson(endpoint, {
    method: 'POST',
    headers: { 'idempotency-key': 'trackb-agent-route-smoke-remotion-rehearsal' },
    body: JSON.stringify({
      workspaceId: 'workspace-trackb-agent-route-smoke',
      projectId: 'project-trackb-agent-route-smoke',
      jobId: 'job-trackb-agent-route-smoke-remotion-rehearsal',
      agentInvocationId: 'trackb.media_oss.remotion',
      toolId: 'remotion',
      action: 'compose_layers',
      approvedSnapshotId: 'approved-snapshot-trackb-agent-route-smoke',
      editPlanId: 'edit-plan-trackb-agent-route-smoke',
      mediaAssetId: 'synthetic-media-asset-trackb-agent-route-smoke',
      toolExecutionPlanId: 'tool-exec-trackb-agent-route-smoke-remotion-rehearsal',
      mode: 'bounded_execution_rehearsal',
      storageReferenceIds: ['render_manifests/workspaces/workspace-trackb-agent-route-smoke/projects/project-trackb-agent-route-smoke/remotion/synthetic-reference'],
    }),
  }, 202)
  const remotionResult = remotionRehearsal.data.trackBAgentToolExecution
  assert.equal(remotionResult.status, 'completed')
  assert.equal(remotionResult.decision, 'trackb_agent_tool_execution_bounded_execution_rehearsal_completed')
  assert.equal(remotionResult.workerPayload.executionMode, 'bounded_rehearsal')
  assert.equal(remotionResult.workerResult.output.mockOnly, false)
  assert.equal(remotionResult.workerResult.output.futureHandler, 'render_worker_remotion_composition_manifest_bounded_rehearsal')
  assert.equal(remotionResult.workerResult.output.trackBAgentToolRecipeResult.status, 'completed')
  assert.equal(remotionResult.workerResult.output.trackBAgentToolRecipeResult.realToolBinaryExecution, true)
  assert.equal(remotionResult.workerResult.output.trackBAgentToolRecipeResult.realPackageApiExecution, true)
  assert.equal(remotionResult.workerResult.output.trackBAgentToolRecipeResult.renderExecuted, false)
  assert.equal(remotionResult.workerResult.output.trackBAgentToolRecipeResult.browserLaunched, false)
  assert.equal(remotionResult.workerResult.output.trackBAgentToolRecipeResult.productRuntimeExecution, false)
  assert.equal(remotionResult.workerResult.output.trackBAgentToolRecipeResult.mediaProcessing, false)
  assert.equal(remotionResult.workerResult.output.trackBAgentToolRecipeResult.syntheticInputOnly, true)
  assert.equal(remotionResult.workerResult.output.trackBAgentToolRecipeResult.artifactFileWritten, false)
  assert.equal(remotionResult.workerResult.output.trackBAgentToolRecipeResult.proof.operation, 'synthetic_remotion_composition_manifest_api_shape')
  assert.equal(remotionResult.workerResult.output.trackBAgentToolRecipeResult.proof.apiShape.AbsoluteFill, 'object')
  assert.equal(remotionResult.workerResult.output.trackBAgentToolRecipeResult.proof.apiShape.Composition, 'function')
  assert.equal(remotionResult.workerResult.output.trackBAgentToolRecipeResult.proof.apiShape.Sequence, 'object')
  assert.equal(remotionResult.workerResult.output.trackBAgentToolRecipeResult.proof.durationInFrames, 60)
  assert.equal(remotionResult.workerResult.output.trackBAgentToolRecipeResult.proof.clipCount, 1)

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

  const duckdbRehearsal = await requestJson(endpoint, {
    method: 'POST',
    headers: { 'idempotency-key': 'trackb-agent-route-smoke-duckdb-rehearsal' },
    body: JSON.stringify({
      workspaceId: 'workspace-trackb-agent-route-smoke',
      projectId: 'project-trackb-agent-route-smoke',
      jobId: 'job-trackb-agent-route-smoke-duckdb-rehearsal',
      agentInvocationId: 'trackb.media_oss.duckdb',
      toolId: 'duckdb',
      action: 'query_artifacts',
      approvedSnapshotId: 'approved-snapshot-trackb-agent-route-smoke',
      toolExecutionPlanId: 'tool-exec-trackb-agent-route-smoke-duckdb-rehearsal',
      mode: 'bounded_execution_rehearsal',
      storageReferenceIds: ['analysis_artifacts/workspaces/workspace-trackb-agent-route-smoke/projects/project-trackb-agent-route-smoke/duckdb/source-reference'],
    }),
  }, 202)
  const duckdbResult = duckdbRehearsal.data.trackBAgentToolExecution
  assert.equal(duckdbResult.status, 'completed')
  assert.equal(duckdbResult.decision, 'trackb_agent_tool_execution_bounded_execution_rehearsal_completed')
  assert.equal(duckdbResult.workerPayload.executionMode, 'bounded_rehearsal')
  assert.equal(duckdbResult.workerResult.output.mockOnly, false)
  assert.equal(duckdbResult.workerResult.output.trackBAgentToolRecipeResult.realToolBinaryExecution, true)
  assert.equal(duckdbResult.workerResult.output.trackBAgentToolRecipeResult.mediaProcessing, false)
  assert.equal(duckdbResult.workerResult.output.trackBAgentToolRecipeResult.proof.database, ':memory:')
  assert.equal(duckdbResult.workerResult.output.trackBAgentToolRecipeResult.proof.total_value, 42)

  const polarsRehearsal = await requestJson(endpoint, {
    method: 'POST',
    headers: { 'idempotency-key': 'trackb-agent-route-smoke-polars-rehearsal' },
    body: JSON.stringify({
      workspaceId: 'workspace-trackb-agent-route-smoke',
      projectId: 'project-trackb-agent-route-smoke',
      jobId: 'job-trackb-agent-route-smoke-polars-rehearsal',
      agentInvocationId: 'trackb.media_oss.polars',
      toolId: 'polars',
      action: 'transform_tables',
      approvedSnapshotId: 'approved-snapshot-trackb-agent-route-smoke',
      toolExecutionPlanId: 'tool-exec-trackb-agent-route-smoke-polars-rehearsal',
      mode: 'bounded_execution_rehearsal',
      storageReferenceIds: ['analysis_artifacts/workspaces/workspace-trackb-agent-route-smoke/projects/project-trackb-agent-route-smoke/polars/source-reference'],
    }),
  }, 202)
  const polarsResult = polarsRehearsal.data.trackBAgentToolExecution
  assert.equal(polarsResult.status, 'completed')
  assert.equal(polarsResult.decision, 'trackb_agent_tool_execution_bounded_execution_rehearsal_completed')
  assert.equal(polarsResult.workerPayload.executionMode, 'bounded_rehearsal')
  assert.equal(polarsResult.workerResult.output.mockOnly, false)
  assert.equal(polarsResult.workerResult.output.trackBAgentToolRecipeResult.realToolBinaryExecution, true)
  assert.equal(polarsResult.workerResult.output.trackBAgentToolRecipeResult.mediaProcessing, false)
  assert.deepEqual(polarsResult.workerResult.output.trackBAgentToolRecipeResult.proof.shape, [3, 2])
  assert.equal(polarsResult.workerResult.output.trackBAgentToolRecipeResult.proof.weighted_sum, 120)

  const pyavRehearsal = await requestJson(endpoint, {
    method: 'POST',
    headers: { 'idempotency-key': 'trackb-agent-route-smoke-pyav-rehearsal' },
    body: JSON.stringify({
      workspaceId: 'workspace-trackb-agent-route-smoke',
      projectId: 'project-trackb-agent-route-smoke',
      jobId: 'job-trackb-agent-route-smoke-pyav-rehearsal',
      agentInvocationId: 'trackb.media_oss.pyav',
      toolId: 'pyav',
      action: 'sample_frames',
      approvedSnapshotId: 'approved-snapshot-trackb-agent-route-smoke',
      toolExecutionPlanId: 'tool-exec-trackb-agent-route-smoke-pyav-rehearsal',
      mode: 'bounded_execution_rehearsal',
      storageReferenceIds: ['frame_artifacts/workspaces/workspace-trackb-agent-route-smoke/projects/project-trackb-agent-route-smoke/pyav/source-reference'],
    }),
  }, 202)
  const pyavResult = pyavRehearsal.data.trackBAgentToolExecution
  assert.equal(pyavResult.status, 'completed')
  assert.equal(pyavResult.decision, 'trackb_agent_tool_execution_bounded_execution_rehearsal_completed')
  assert.equal(pyavResult.workerPayload.executionMode, 'bounded_rehearsal')
  assert.equal(pyavResult.workerResult.output.mockOnly, false)
  assert.equal(pyavResult.workerResult.output.trackBAgentToolRecipeResult.realToolBinaryExecution, true)
  assert.equal(pyavResult.workerResult.output.trackBAgentToolRecipeResult.productRuntimeExecution, false)
  assert.equal(pyavResult.workerResult.output.trackBAgentToolRecipeResult.mediaProcessing, false)
  assert.equal(pyavResult.workerResult.output.trackBAgentToolRecipeResult.syntheticInputOnly, true)
  assert.equal(pyavResult.workerResult.output.trackBAgentToolRecipeResult.artifactFileWritten, false)
  assert.equal(pyavResult.workerResult.output.trackBAgentToolRecipeResult.proof.operation, 'synthetic_video_frame_roundtrip')
  assert.equal(pyavResult.workerResult.output.trackBAgentToolRecipeResult.proof.format, 'rgb24')
  assert.deepEqual(pyavResult.workerResult.output.trackBAgentToolRecipeResult.proof.mean_rgb, [10, 20, 30])

  const otioRehearsal = await requestJson(endpoint, {
    method: 'POST',
    headers: { 'idempotency-key': 'trackb-agent-route-smoke-otio-rehearsal' },
    body: JSON.stringify({
      workspaceId: 'workspace-trackb-agent-route-smoke',
      projectId: 'project-trackb-agent-route-smoke',
      jobId: 'job-trackb-agent-route-smoke-otio-rehearsal',
      agentInvocationId: 'trackb.media_oss.opentimelineio',
      toolId: 'opentimelineio',
      action: 'serialize_otio',
      approvedSnapshotId: 'approved-snapshot-trackb-agent-route-smoke',
      toolExecutionPlanId: 'tool-exec-trackb-agent-route-smoke-otio-rehearsal',
      mode: 'bounded_execution_rehearsal',
      storageReferenceIds: ['timeline_artifacts/workspaces/workspace-trackb-agent-route-smoke/projects/project-trackb-agent-route-smoke/opentimelineio/source-reference'],
    }),
  }, 202)
  const otioResult = otioRehearsal.data.trackBAgentToolExecution
  assert.equal(otioResult.status, 'completed')
  assert.equal(otioResult.decision, 'trackb_agent_tool_execution_bounded_execution_rehearsal_completed')
  assert.equal(otioResult.workerPayload.executionMode, 'bounded_rehearsal')
  assert.equal(otioResult.workerResult.output.mockOnly, false)
  assert.equal(otioResult.workerResult.output.trackBAgentToolRecipeResult.realToolBinaryExecution, true)
  assert.equal(otioResult.workerResult.output.trackBAgentToolRecipeResult.productRuntimeExecution, false)
  assert.equal(otioResult.workerResult.output.trackBAgentToolRecipeResult.mediaProcessing, false)
  assert.equal(otioResult.workerResult.output.trackBAgentToolRecipeResult.syntheticInputOnly, true)
  assert.equal(otioResult.workerResult.output.trackBAgentToolRecipeResult.artifactFileWritten, false)
  assert.equal(otioResult.workerResult.output.trackBAgentToolRecipeResult.proof.timeline_name, 'synthetic_trackb_timeline')
  assert.equal(otioResult.workerResult.output.trackBAgentToolRecipeResult.proof.track_count, 1)
  assert.equal(otioResult.workerResult.output.trackBAgentToolRecipeResult.proof.clip_count, 1)
  assert.equal(otioResult.workerResult.output.trackBAgentToolRecipeResult.proof.duration_frames, 48)
  assert.equal(otioResult.workerResult.output.trackBAgentToolRecipeResult.proof.media_reference_kind, 'MissingReference')

  const pysceneRehearsal = await requestJson(endpoint, {
    method: 'POST',
    headers: { 'idempotency-key': 'trackb-agent-route-smoke-pyscene-rehearsal' },
    body: JSON.stringify({
      workspaceId: 'workspace-trackb-agent-route-smoke',
      projectId: 'project-trackb-agent-route-smoke',
      jobId: 'job-trackb-agent-route-smoke-pyscene-rehearsal',
      agentInvocationId: 'trackb.media_oss.pyscenedetect',
      toolId: 'pyscenedetect',
      action: 'detect_scenes',
      approvedSnapshotId: 'approved-snapshot-trackb-agent-route-smoke',
      toolExecutionPlanId: 'tool-exec-trackb-agent-route-smoke-pyscene-rehearsal',
      mode: 'bounded_execution_rehearsal',
      storageReferenceIds: ['scene_artifacts/workspaces/workspace-trackb-agent-route-smoke/projects/project-trackb-agent-route-smoke/pyscenedetect/source-reference'],
    }),
  }, 202)
  const pysceneResult = pysceneRehearsal.data.trackBAgentToolExecution
  assert.equal(pysceneResult.status, 'completed')
  assert.equal(pysceneResult.decision, 'trackb_agent_tool_execution_bounded_execution_rehearsal_completed')
  assert.equal(pysceneResult.workerPayload.executionMode, 'bounded_rehearsal')
  assert.equal(pysceneResult.workerResult.output.mockOnly, false)
  assert.equal(pysceneResult.workerResult.output.trackBAgentToolRecipeResult.realToolBinaryExecution, true)
  assert.equal(pysceneResult.workerResult.output.trackBAgentToolRecipeResult.productRuntimeExecution, false)
  assert.equal(pysceneResult.workerResult.output.trackBAgentToolRecipeResult.mediaProcessing, false)
  assert.equal(pysceneResult.workerResult.output.trackBAgentToolRecipeResult.syntheticInputOnly, true)
  assert.equal(pysceneResult.workerResult.output.trackBAgentToolRecipeResult.artifactFileWritten, false)
  assert.equal(pysceneResult.workerResult.output.trackBAgentToolRecipeResult.proof.detector, 'ContentDetector')
  assert.deepEqual(pysceneResult.workerResult.output.trackBAgentToolRecipeResult.proof.cut_frames, [1])
  assert.equal(pysceneResult.workerResult.output.trackBAgentToolRecipeResult.proof.cut_count, 1)

  const opencvRehearsal = await requestJson(endpoint, {
    method: 'POST',
    headers: { 'idempotency-key': 'trackb-agent-route-smoke-opencv-rehearsal' },
    body: JSON.stringify({
      workspaceId: 'workspace-trackb-agent-route-smoke',
      projectId: 'project-trackb-agent-route-smoke',
      jobId: 'job-trackb-agent-route-smoke-opencv-rehearsal',
      agentInvocationId: 'trackb.media_oss.opencv',
      toolId: 'opencv',
      action: 'sample_frames',
      approvedSnapshotId: 'approved-snapshot-trackb-agent-route-smoke',
      toolExecutionPlanId: 'tool-exec-trackb-agent-route-smoke-opencv-rehearsal',
      mode: 'bounded_execution_rehearsal',
      storageReferenceIds: ['frame_artifacts/workspaces/workspace-trackb-agent-route-smoke/projects/project-trackb-agent-route-smoke/opencv/source-reference'],
    }),
  }, 202)
  const opencvResult = opencvRehearsal.data.trackBAgentToolExecution
  assert.equal(opencvResult.status, 'completed')
  assert.equal(opencvResult.decision, 'trackb_agent_tool_execution_bounded_execution_rehearsal_completed')
  assert.equal(opencvResult.workerPayload.executionMode, 'bounded_rehearsal')
  assert.equal(opencvResult.workerResult.output.mockOnly, false)
  assert.equal(opencvResult.workerResult.output.trackBAgentToolRecipeResult.realToolBinaryExecution, true)
  assert.equal(opencvResult.workerResult.output.trackBAgentToolRecipeResult.productRuntimeExecution, false)
  assert.equal(opencvResult.workerResult.output.trackBAgentToolRecipeResult.mediaProcessing, false)
  assert.equal(opencvResult.workerResult.output.trackBAgentToolRecipeResult.syntheticInputOnly, true)
  assert.equal(opencvResult.workerResult.output.trackBAgentToolRecipeResult.artifactFileWritten, false)
  assert.deepEqual(opencvResult.workerResult.output.trackBAgentToolRecipeResult.proof.shape, [16, 16, 3])
  assert.deepEqual(opencvResult.workerResult.output.trackBAgentToolRecipeResult.proof.gray_shape, [16, 16])
  assert.equal(opencvResult.workerResult.output.trackBAgentToolRecipeResult.proof.edge_pixels, 28)

  const ocioRehearsal = await requestJson(endpoint, {
    method: 'POST',
    headers: { 'idempotency-key': 'trackb-agent-route-smoke-ocio-rehearsal' },
    body: JSON.stringify({
      workspaceId: 'workspace-trackb-agent-route-smoke',
      projectId: 'project-trackb-agent-route-smoke',
      jobId: 'job-trackb-agent-route-smoke-ocio-rehearsal',
      agentInvocationId: 'trackb.media_oss.opencolorio',
      toolId: 'opencolorio',
      action: 'validate_color_space',
      approvedSnapshotId: 'approved-snapshot-trackb-agent-route-smoke',
      toolExecutionPlanId: 'tool-exec-trackb-agent-route-smoke-ocio-rehearsal',
      mode: 'bounded_execution_rehearsal',
      storageReferenceIds: ['color_artifacts/workspaces/workspace-trackb-agent-route-smoke/projects/project-trackb-agent-route-smoke/opencolorio/source-reference'],
    }),
  }, 202)
  const ocioResult = ocioRehearsal.data.trackBAgentToolExecution
  assert.equal(ocioResult.status, 'completed')
  assert.equal(ocioResult.decision, 'trackb_agent_tool_execution_bounded_execution_rehearsal_completed')
  assert.equal(ocioResult.workerPayload.executionMode, 'bounded_rehearsal')
  assert.equal(ocioResult.workerResult.output.mockOnly, false)
  assert.equal(ocioResult.workerResult.output.trackBAgentToolRecipeResult.realToolBinaryExecution, true)
  assert.equal(ocioResult.workerResult.output.trackBAgentToolRecipeResult.productRuntimeExecution, false)
  assert.equal(ocioResult.workerResult.output.trackBAgentToolRecipeResult.mediaProcessing, false)
  assert.equal(ocioResult.workerResult.output.trackBAgentToolRecipeResult.syntheticInputOnly, true)
  assert.equal(ocioResult.workerResult.output.trackBAgentToolRecipeResult.artifactFileWritten, false)
  assert.equal(ocioResult.workerResult.output.trackBAgentToolRecipeResult.proof.config_name, 'synthetic_trackb_raw_config')
  assert.deepEqual(ocioResult.workerResult.output.trackBAgentToolRecipeResult.proof.color_spaces, ['raw'])
  assert.equal(ocioResult.workerResult.output.trackBAgentToolRecipeResult.proof.processor_created, true)
  assert.deepEqual(ocioResult.workerResult.output.trackBAgentToolRecipeResult.proof.output_rgba, [0.1, 0.2, 0.3, 1])

  const oiioRehearsal = await requestJson(endpoint, {
    method: 'POST',
    headers: { 'idempotency-key': 'trackb-agent-route-smoke-oiio-rehearsal' },
    body: JSON.stringify({
      workspaceId: 'workspace-trackb-agent-route-smoke',
      projectId: 'project-trackb-agent-route-smoke',
      jobId: 'job-trackb-agent-route-smoke-oiio-rehearsal',
      agentInvocationId: 'trackb.media_oss.openimageio',
      toolId: 'openimageio',
      action: 'read_metadata',
      approvedSnapshotId: 'approved-snapshot-trackb-agent-route-smoke',
      toolExecutionPlanId: 'tool-exec-trackb-agent-route-smoke-oiio-rehearsal',
      mode: 'bounded_execution_rehearsal',
      storageReferenceIds: ['image_artifacts/workspaces/workspace-trackb-agent-route-smoke/projects/project-trackb-agent-route-smoke/openimageio/source-reference'],
    }),
  }, 202)
  const oiioResult = oiioRehearsal.data.trackBAgentToolExecution
  assert.equal(oiioResult.status, 'completed')
  assert.equal(oiioResult.decision, 'trackb_agent_tool_execution_bounded_execution_rehearsal_completed')
  assert.equal(oiioResult.workerPayload.executionMode, 'bounded_rehearsal')
  assert.equal(oiioResult.workerResult.output.mockOnly, false)
  assert.equal(oiioResult.workerResult.output.trackBAgentToolRecipeResult.realToolBinaryExecution, true)
  assert.equal(oiioResult.workerResult.output.trackBAgentToolRecipeResult.productRuntimeExecution, false)
  assert.equal(oiioResult.workerResult.output.trackBAgentToolRecipeResult.mediaProcessing, false)
  assert.equal(oiioResult.workerResult.output.trackBAgentToolRecipeResult.syntheticInputOnly, true)
  assert.equal(oiioResult.workerResult.output.trackBAgentToolRecipeResult.artifactFileWritten, false)
  assert.equal(oiioResult.workerResult.output.trackBAgentToolRecipeResult.proof.spec_width, 2)
  assert.equal(oiioResult.workerResult.output.trackBAgentToolRecipeResult.proof.spec_height, 2)
  assert.equal(oiioResult.workerResult.output.trackBAgentToolRecipeResult.proof.nchannels, 3)
  assert.equal(oiioResult.workerResult.output.trackBAgentToolRecipeResult.proof.format, 'uint8')
  assert.equal(oiioResult.workerResult.output.trackBAgentToolRecipeResult.proof.initialized, true)
  assert.deepEqual(oiioResult.workerResult.output.trackBAgentToolRecipeResult.proof.pixel, [1, 1, 0])

  const audiofluxRehearsal = await requestJson(endpoint, {
    method: 'POST',
    headers: { 'idempotency-key': 'trackb-agent-route-smoke-audioflux-rehearsal' },
    body: JSON.stringify({
      workspaceId: 'workspace-trackb-agent-route-smoke',
      projectId: 'project-trackb-agent-route-smoke',
      jobId: 'job-trackb-agent-route-smoke-audioflux-rehearsal',
      agentInvocationId: 'trackb.media_oss.audioflux',
      toolId: 'audioflux',
      action: 'extract_audio_features',
      approvedSnapshotId: 'approved-snapshot-trackb-agent-route-smoke',
      toolExecutionPlanId: 'tool-exec-trackb-agent-route-smoke-audioflux-rehearsal',
      mode: 'bounded_execution_rehearsal',
      storageReferenceIds: ['audio_artifacts/workspaces/workspace-trackb-agent-route-smoke/projects/project-trackb-agent-route-smoke/audioflux/source-reference'],
    }),
  }, 202)
  const audiofluxResult = audiofluxRehearsal.data.trackBAgentToolExecution
  assert.equal(audiofluxResult.status, 'completed')
  assert.equal(audiofluxResult.decision, 'trackb_agent_tool_execution_bounded_execution_rehearsal_completed')
  assert.equal(audiofluxResult.workerPayload.executionMode, 'bounded_rehearsal')
  assert.equal(audiofluxResult.workerResult.output.mockOnly, false)
  assert.equal(audiofluxResult.workerResult.output.trackBAgentToolRecipeResult.realToolBinaryExecution, true)
  assert.equal(audiofluxResult.workerResult.output.trackBAgentToolRecipeResult.productRuntimeExecution, false)
  assert.equal(audiofluxResult.workerResult.output.trackBAgentToolRecipeResult.mediaProcessing, false)
  assert.equal(audiofluxResult.workerResult.output.trackBAgentToolRecipeResult.syntheticInputOnly, true)
  assert.equal(audiofluxResult.workerResult.output.trackBAgentToolRecipeResult.artifactFileWritten, false)
  assert.equal(audiofluxResult.workerResult.output.trackBAgentToolRecipeResult.proof.operation, 'synthetic_audio_bft_feature_extract')
  assert.deepEqual(audiofluxResult.workerResult.output.trackBAgentToolRecipeResult.proof.feature_shape, [16, 5])
  assert.ok(audiofluxResult.workerResult.output.trackBAgentToolRecipeResult.proof.magnitude_sum > 0)

  const signalsmithRehearsal = await requestJson(endpoint, {
    method: 'POST',
    headers: { 'idempotency-key': 'trackb-agent-route-smoke-signalsmith-rehearsal' },
    body: JSON.stringify({
      workspaceId: 'workspace-trackb-agent-route-smoke',
      projectId: 'project-trackb-agent-route-smoke',
      jobId: 'job-trackb-agent-route-smoke-signalsmith-rehearsal',
      agentInvocationId: 'trackb.media_oss.signalsmith_stretch',
      toolId: 'signalsmith_stretch',
      action: 'stretch_audio',
      approvedSnapshotId: 'approved-snapshot-trackb-agent-route-smoke',
      toolExecutionPlanId: 'tool-exec-trackb-agent-route-smoke-signalsmith-rehearsal',
      mode: 'bounded_execution_rehearsal',
      storageReferenceIds: ['audio_artifacts/workspaces/workspace-trackb-agent-route-smoke/projects/project-trackb-agent-route-smoke/signalsmith/source-reference'],
    }),
  }, 202)
  const signalsmithResult = signalsmithRehearsal.data.trackBAgentToolExecution
  assert.equal(signalsmithResult.status, 'completed')
  assert.equal(signalsmithResult.decision, 'trackb_agent_tool_execution_bounded_execution_rehearsal_completed')
  assert.equal(signalsmithResult.workerPayload.executionMode, 'bounded_rehearsal')
  assert.equal(signalsmithResult.workerResult.output.mockOnly, false)
  assert.equal(signalsmithResult.workerResult.output.trackBAgentToolRecipeResult.realToolBinaryExecution, true)
  assert.equal(signalsmithResult.workerResult.output.trackBAgentToolRecipeResult.productRuntimeExecution, false)
  assert.equal(signalsmithResult.workerResult.output.trackBAgentToolRecipeResult.mediaProcessing, false)
  assert.equal(signalsmithResult.workerResult.output.trackBAgentToolRecipeResult.syntheticInputOnly, true)
  assert.equal(signalsmithResult.workerResult.output.trackBAgentToolRecipeResult.artifactFileWritten, false)
  assert.match(signalsmithResult.workerResult.output.trackBAgentToolRecipeResult.proof.version, /^\d+\.\d+\.\d+/)
  assert.equal(signalsmithResult.workerResult.output.trackBAgentToolRecipeResult.proof.operation, 'signalsmith_stretch_command_shape_version_and_help')
  assert.equal(signalsmithResult.workerResult.output.trackBAgentToolRecipeResult.proof.audioProcessed, false)

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
      'http_route_runs_ffmpeg_ffprobe_remotion_sharp_duckdb_polars_pyav_timeline_scene_opencv_color_imageio_audioflux_signalsmith_bounded_execution_rehearsals',
      'http_route_runs_hyperframe_preview_bridge_bounded_execution_rehearsal_without_worker_dispatch',
      'http_route_keeps_hyperframe_preview_boundary_for_default_and_live_paths',
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

function findBoundedRehearsalPython(): string | undefined {
  const candidates = [
    process.env.REEDITPRO_READINESS_PYTHON_BIN,
    '.reeditpro-tool-readiness-python/bin/python',
  ].filter((candidate): candidate is string => Boolean(candidate))

  return candidates.find((candidate) => existsSync(candidate))
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
