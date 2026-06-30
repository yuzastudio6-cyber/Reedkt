import assert from 'node:assert/strict'
import { existsSync } from 'node:fs'
import { executeTrackBAgentTool } from '../agents/trackb-agent-tool-execution'
import { buildTrackBAgentRuntimeReadinessReport } from '../beta-readiness/trackb-agent-runtime-readiness'
import { runProductionToolReadiness } from '../workers/production-readiness'
import {
  sharedMockCreditEstimateStore,
  sharedMockCreditReservationStore,
} from '../services/mock-credit-foundation-stores'

const report = buildTrackBAgentRuntimeReadinessReport()
const rehearsalPython = findBoundedRehearsalPython()
assert.ok(
  rehearsalPython,
  'Bounded DuckDB/Polars rehearsal requires REEDITPRO_READINESS_PYTHON_BIN or .reeditpro-tool-readiness-python/bin/python.',
)
process.env.REEDITPRO_READINESS_PYTHON_BIN = rehearsalPython

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
  sharp: 'render_worker_sharp_image_asset_prepare_dry_run',
  duckdb: 'cpu_analysis_worker_duckdb_structured_artifact_query_dry_run',
  polars: 'cpu_analysis_worker_polars_dataframe_transform_dry_run',
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
    assert.notEqual(result.workerResult?.output?.futureHandler, 'trackb_agent_tool_recipe_dry_run')
    if (['sharp', 'duckdb', 'polars'].includes(contract.toolId)) {
      const recipeResult = result.workerResult?.output?.trackBAgentToolRecipeResult as {
        namedHandlerReady?: boolean
        handlerKind?: string
        productRuntimeExecution?: boolean
        realToolBinaryExecution?: boolean
        mediaProcessing?: boolean
      } | undefined
      assert.equal(recipeResult?.namedHandlerReady, true, `${contract.toolId} should resolve to a named Track B handler`)
      assert.equal(recipeResult?.handlerKind, 'explicit_trackb_agent_worker_handler')
      assert.equal(recipeResult?.productRuntimeExecution, false)
      assert.equal(recipeResult?.realToolBinaryExecution, false)
      assert.equal(recipeResult?.mediaProcessing, false)
    }
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

const sharpRehearsal = await executeTrackBAgentTool({
  workspaceId: 'workspace-trackb-agent-smoke',
  projectId: 'project-trackb-agent-smoke',
  jobId: 'job-trackb-agent-sharp-rehearsal',
  agentInvocationId: 'trackb.media_oss.sharp',
  toolId: 'sharp',
  action: 'asset_prepare',
  approvedSnapshotId: 'approved-snapshot-trackb-agent-smoke',
  toolExecutionPlanId: 'tool-exec-trackb-agent-sharp-rehearsal',
  mode: 'bounded_execution_rehearsal',
  storageReferenceIds: ['synthetic_private_rehearsal/workspaces/workspace-trackb-agent-smoke/projects/project-trackb-agent-smoke/sharp/no-user-media-reference'],
})
assert.equal(sharpRehearsal.status, 'completed')
assert.equal(sharpRehearsal.decision, 'trackb_agent_tool_execution_bounded_execution_rehearsal_completed')
assert.equal(sharpRehearsal.workerPayload?.executionMode, 'bounded_rehearsal')
assert.equal(sharpRehearsal.workerResult?.output?.mockOnly, false)
assert.equal(sharpRehearsal.workerResult?.toolCostMetadata?.mockOnly, true)
assert.equal(sharpRehearsal.workerResult?.toolCostMetadata?.emittedEvents[0]?.billableToUser, false)
const sharpRehearsalResult = sharpRehearsal.workerResult?.output?.trackBAgentToolRecipeResult as {
  status?: string
  realToolBinaryExecution?: boolean
  productRuntimeExecution?: boolean
  mediaProcessing?: boolean
  userMediaProcessed?: boolean
  syntheticInputOnly?: boolean
  artifactFileWritten?: boolean
  publicArtifactCreated?: boolean
  sharpVersions?: { sharp?: string; vips?: string }
  syntheticInput?: { format?: string; width?: number; height?: number; sha256?: string }
  syntheticOutput?: { format?: string; width?: number; height?: number; metadataFormat?: string; sha256?: string }
} | undefined
assert.equal(sharpRehearsalResult?.status, 'completed')
assert.equal(sharpRehearsalResult?.realToolBinaryExecution, true)
assert.equal(sharpRehearsalResult?.productRuntimeExecution, false)
assert.equal(sharpRehearsalResult?.mediaProcessing, false)
assert.equal(sharpRehearsalResult?.userMediaProcessed, false)
assert.equal(sharpRehearsalResult?.syntheticInputOnly, true)
assert.equal(sharpRehearsalResult?.artifactFileWritten, false)
assert.equal(sharpRehearsalResult?.publicArtifactCreated, false)
assert.ok(sharpRehearsalResult?.sharpVersions?.sharp)
assert.ok(sharpRehearsalResult?.sharpVersions?.vips)
assert.equal(sharpRehearsalResult?.syntheticInput?.format, 'png')
assert.equal(sharpRehearsalResult?.syntheticInput?.width, 2)
assert.equal(sharpRehearsalResult?.syntheticInput?.height, 2)
assert.match(sharpRehearsalResult?.syntheticInput?.sha256 ?? '', /^[a-f0-9]{64}$/)
assert.equal(sharpRehearsalResult?.syntheticOutput?.format, 'webp')
assert.equal(sharpRehearsalResult?.syntheticOutput?.metadataFormat, 'webp')
assert.equal(sharpRehearsalResult?.syntheticOutput?.width, 1)
assert.equal(sharpRehearsalResult?.syntheticOutput?.height, 1)
assert.match(sharpRehearsalResult?.syntheticOutput?.sha256 ?? '', /^[a-f0-9]{64}$/)

const duckdbRehearsal = await executeTrackBAgentTool({
  workspaceId: 'workspace-trackb-agent-smoke',
  projectId: 'project-trackb-agent-smoke',
  jobId: 'job-trackb-agent-duckdb-rehearsal',
  agentInvocationId: 'trackb.media_oss.duckdb',
  toolId: 'duckdb',
  action: 'query_artifacts',
  approvedSnapshotId: 'approved-snapshot-trackb-agent-smoke',
  toolExecutionPlanId: 'tool-exec-trackb-agent-duckdb-rehearsal',
  mode: 'bounded_execution_rehearsal',
  storageReferenceIds: ['analysis_artifacts/workspaces/workspace-trackb-agent-smoke/projects/project-trackb-agent-smoke/duckdb/source-reference'],
})
assert.equal(duckdbRehearsal.status, 'completed')
assert.equal(duckdbRehearsal.decision, 'trackb_agent_tool_execution_bounded_execution_rehearsal_completed')
assert.equal(duckdbRehearsal.workerPayload?.executionMode, 'bounded_rehearsal')
assert.equal(duckdbRehearsal.workerResult?.output?.mockOnly, false)
const duckdbRehearsalResult = duckdbRehearsal.workerResult?.output?.trackBAgentToolRecipeResult as {
  status?: string
  realToolBinaryExecution?: boolean
  productRuntimeExecution?: boolean
  mediaProcessing?: boolean
  syntheticInputOnly?: boolean
  artifactFileWritten?: boolean
  proof?: { version?: string; database?: string; row_count?: number; total_value?: number }
} | undefined
assert.equal(duckdbRehearsalResult?.status, 'completed')
assert.equal(duckdbRehearsalResult?.realToolBinaryExecution, true)
assert.equal(duckdbRehearsalResult?.productRuntimeExecution, false)
assert.equal(duckdbRehearsalResult?.mediaProcessing, false)
assert.equal(duckdbRehearsalResult?.syntheticInputOnly, true)
assert.equal(duckdbRehearsalResult?.artifactFileWritten, false)
assert.ok(duckdbRehearsalResult?.proof?.version)
assert.equal(duckdbRehearsalResult?.proof?.database, ':memory:')
assert.equal(duckdbRehearsalResult?.proof?.row_count, 1)
assert.equal(duckdbRehearsalResult?.proof?.total_value, 42)

const polarsRehearsal = await executeTrackBAgentTool({
  workspaceId: 'workspace-trackb-agent-smoke',
  projectId: 'project-trackb-agent-smoke',
  jobId: 'job-trackb-agent-polars-rehearsal',
  agentInvocationId: 'trackb.media_oss.polars',
  toolId: 'polars',
  action: 'transform_tables',
  approvedSnapshotId: 'approved-snapshot-trackb-agent-smoke',
  toolExecutionPlanId: 'tool-exec-trackb-agent-polars-rehearsal',
  mode: 'bounded_execution_rehearsal',
  storageReferenceIds: ['analysis_artifacts/workspaces/workspace-trackb-agent-smoke/projects/project-trackb-agent-smoke/polars/source-reference'],
})
assert.equal(polarsRehearsal.status, 'completed')
assert.equal(polarsRehearsal.decision, 'trackb_agent_tool_execution_bounded_execution_rehearsal_completed')
assert.equal(polarsRehearsal.workerPayload?.executionMode, 'bounded_rehearsal')
assert.equal(polarsRehearsal.workerResult?.output?.mockOnly, false)
const polarsRehearsalResult = polarsRehearsal.workerResult?.output?.trackBAgentToolRecipeResult as {
  status?: string
  realToolBinaryExecution?: boolean
  productRuntimeExecution?: boolean
  mediaProcessing?: boolean
  syntheticInputOnly?: boolean
  artifactFileWritten?: boolean
  proof?: { version?: string; operation?: string; shape?: number[]; frames_sum?: number; weighted_sum?: number }
} | undefined
assert.equal(polarsRehearsalResult?.status, 'completed')
assert.equal(polarsRehearsalResult?.realToolBinaryExecution, true)
assert.equal(polarsRehearsalResult?.productRuntimeExecution, false)
assert.equal(polarsRehearsalResult?.mediaProcessing, false)
assert.equal(polarsRehearsalResult?.syntheticInputOnly, true)
assert.equal(polarsRehearsalResult?.artifactFileWritten, false)
assert.ok(polarsRehearsalResult?.proof?.version)
assert.deepEqual(polarsRehearsalResult?.proof?.shape, [3, 2])
assert.equal(polarsRehearsalResult?.proof?.operation, 'synthetic_dataframe_transform')
assert.equal(polarsRehearsalResult?.proof?.frames_sum, 60)
assert.equal(polarsRehearsalResult?.proof?.weighted_sum, 120)

const otioRehearsal = await executeTrackBAgentTool({
  workspaceId: 'workspace-trackb-agent-smoke',
  projectId: 'project-trackb-agent-smoke',
  jobId: 'job-trackb-agent-otio-rehearsal',
  agentInvocationId: 'trackb.media_oss.opentimelineio',
  toolId: 'opentimelineio',
  action: 'serialize_otio',
  approvedSnapshotId: 'approved-snapshot-trackb-agent-smoke',
  toolExecutionPlanId: 'tool-exec-trackb-agent-otio-rehearsal',
  mode: 'bounded_execution_rehearsal',
  storageReferenceIds: ['timeline_artifacts/workspaces/workspace-trackb-agent-smoke/projects/project-trackb-agent-smoke/opentimelineio/source-reference'],
})
assert.equal(otioRehearsal.status, 'completed')
assert.equal(otioRehearsal.decision, 'trackb_agent_tool_execution_bounded_execution_rehearsal_completed')
const otioRehearsalResult = otioRehearsal.workerResult?.output?.trackBAgentToolRecipeResult as {
  realToolBinaryExecution?: boolean
  productRuntimeExecution?: boolean
  mediaProcessing?: boolean
  syntheticInputOnly?: boolean
  artifactFileWritten?: boolean
  proof?: { version?: string; timeline_name?: string; track_count?: number; clip_count?: number; duration_frames?: number; media_reference_kind?: string }
} | undefined
assert.equal(otioRehearsal.workerPayload?.executionMode, 'bounded_rehearsal')
assert.equal(otioRehearsal.workerResult?.output?.mockOnly, false)
assert.equal(otioRehearsalResult?.realToolBinaryExecution, true)
assert.equal(otioRehearsalResult?.productRuntimeExecution, false)
assert.equal(otioRehearsalResult?.mediaProcessing, false)
assert.equal(otioRehearsalResult?.syntheticInputOnly, true)
assert.equal(otioRehearsalResult?.artifactFileWritten, false)
assert.ok(otioRehearsalResult?.proof?.version)
assert.equal(otioRehearsalResult?.proof?.timeline_name, 'synthetic_trackb_timeline')
assert.equal(otioRehearsalResult?.proof?.track_count, 1)
assert.equal(otioRehearsalResult?.proof?.clip_count, 1)
assert.equal(otioRehearsalResult?.proof?.duration_frames, 48)
assert.equal(otioRehearsalResult?.proof?.media_reference_kind, 'MissingReference')

const ocioRehearsal = await executeTrackBAgentTool({
  workspaceId: 'workspace-trackb-agent-smoke',
  projectId: 'project-trackb-agent-smoke',
  jobId: 'job-trackb-agent-ocio-rehearsal',
  agentInvocationId: 'trackb.media_oss.opencolorio',
  toolId: 'opencolorio',
  action: 'validate_color_space',
  approvedSnapshotId: 'approved-snapshot-trackb-agent-smoke',
  toolExecutionPlanId: 'tool-exec-trackb-agent-ocio-rehearsal',
  mode: 'bounded_execution_rehearsal',
  storageReferenceIds: ['color_artifacts/workspaces/workspace-trackb-agent-smoke/projects/project-trackb-agent-smoke/opencolorio/source-reference'],
})
assert.equal(ocioRehearsal.status, 'completed')
assert.equal(ocioRehearsal.decision, 'trackb_agent_tool_execution_bounded_execution_rehearsal_completed')
const ocioRehearsalResult = ocioRehearsal.workerResult?.output?.trackBAgentToolRecipeResult as {
  realToolBinaryExecution?: boolean
  productRuntimeExecution?: boolean
  mediaProcessing?: boolean
  syntheticInputOnly?: boolean
  artifactFileWritten?: boolean
  proof?: { version?: string; config_name?: string; color_spaces?: string[]; processor_created?: boolean; output_rgba?: number[] }
} | undefined
assert.equal(ocioRehearsal.workerPayload?.executionMode, 'bounded_rehearsal')
assert.equal(ocioRehearsal.workerResult?.output?.mockOnly, false)
assert.equal(ocioRehearsalResult?.realToolBinaryExecution, true)
assert.equal(ocioRehearsalResult?.productRuntimeExecution, false)
assert.equal(ocioRehearsalResult?.mediaProcessing, false)
assert.equal(ocioRehearsalResult?.syntheticInputOnly, true)
assert.equal(ocioRehearsalResult?.artifactFileWritten, false)
assert.ok(ocioRehearsalResult?.proof?.version)
assert.equal(ocioRehearsalResult?.proof?.config_name, 'synthetic_trackb_raw_config')
assert.deepEqual(ocioRehearsalResult?.proof?.color_spaces, ['raw'])
assert.equal(ocioRehearsalResult?.proof?.processor_created, true)
assert.deepEqual(ocioRehearsalResult?.proof?.output_rgba, [0.1, 0.2, 0.3, 1])

const oiioRehearsal = await executeTrackBAgentTool({
  workspaceId: 'workspace-trackb-agent-smoke',
  projectId: 'project-trackb-agent-smoke',
  jobId: 'job-trackb-agent-oiio-rehearsal',
  agentInvocationId: 'trackb.media_oss.openimageio',
  toolId: 'openimageio',
  action: 'read_metadata',
  approvedSnapshotId: 'approved-snapshot-trackb-agent-smoke',
  toolExecutionPlanId: 'tool-exec-trackb-agent-oiio-rehearsal',
  mode: 'bounded_execution_rehearsal',
  storageReferenceIds: ['image_artifacts/workspaces/workspace-trackb-agent-smoke/projects/project-trackb-agent-smoke/openimageio/source-reference'],
})
assert.equal(oiioRehearsal.status, 'completed')
assert.equal(oiioRehearsal.decision, 'trackb_agent_tool_execution_bounded_execution_rehearsal_completed')
const oiioRehearsalResult = oiioRehearsal.workerResult?.output?.trackBAgentToolRecipeResult as {
  realToolBinaryExecution?: boolean
  productRuntimeExecution?: boolean
  mediaProcessing?: boolean
  syntheticInputOnly?: boolean
  artifactFileWritten?: boolean
  proof?: { version?: string; spec_width?: number; spec_height?: number; nchannels?: number; format?: string; initialized?: boolean; pixel?: number[] }
} | undefined
assert.equal(oiioRehearsal.workerPayload?.executionMode, 'bounded_rehearsal')
assert.equal(oiioRehearsal.workerResult?.output?.mockOnly, false)
assert.equal(oiioRehearsalResult?.realToolBinaryExecution, true)
assert.equal(oiioRehearsalResult?.productRuntimeExecution, false)
assert.equal(oiioRehearsalResult?.mediaProcessing, false)
assert.equal(oiioRehearsalResult?.syntheticInputOnly, true)
assert.equal(oiioRehearsalResult?.artifactFileWritten, false)
assert.ok(oiioRehearsalResult?.proof?.version)
assert.equal(oiioRehearsalResult?.proof?.spec_width, 2)
assert.equal(oiioRehearsalResult?.proof?.spec_height, 2)
assert.equal(oiioRehearsalResult?.proof?.nchannels, 3)
assert.equal(oiioRehearsalResult?.proof?.format, 'uint8')
assert.equal(oiioRehearsalResult?.proof?.initialized, true)
assert.deepEqual(oiioRehearsalResult?.proof?.pixel, [1, 1, 0])

const ffprobeRehearsalBlocked = await executeTrackBAgentTool({
  workspaceId: 'workspace-trackb-agent-smoke',
  projectId: 'project-trackb-agent-smoke',
  jobId: 'job-trackb-agent-ffprobe-rehearsal-blocked',
  agentInvocationId: 'trackb.media_oss.ffprobe',
  toolId: 'ffprobe',
  action: 'stream_probe',
  approvedSnapshotId: 'approved-snapshot-trackb-agent-smoke',
  toolExecutionPlanId: 'tool-exec-trackb-agent-ffprobe-rehearsal-blocked',
  mode: 'bounded_execution_rehearsal',
  storageReferenceIds: ['source_media/workspaces/workspace-trackb-agent-smoke/projects/project-trackb-agent-smoke/ffprobe/source-reference'],
})
assert.equal(ffprobeRehearsalBlocked.status, 'blocked')
assert.match(ffprobeRehearsalBlocked.blockedReason ?? '', /bounded_execution_rehearsal is not admitted for ffprobe/i)
assert.equal(ffprobeRehearsalBlocked.workerResult, undefined)

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
    'sharp_bounded_execution_rehearsal_runs_real_synthetic_no_user_media_tool_proof',
    'duckdb_bounded_execution_rehearsal_runs_real_synthetic_no_user_media_tool_proof',
    'polars_bounded_execution_rehearsal_runs_real_synthetic_no_user_media_tool_proof',
    'opentimelineio_bounded_execution_rehearsal_runs_real_synthetic_no_user_media_tool_proof',
    'opencolorio_bounded_execution_rehearsal_runs_real_synthetic_no_user_media_tool_proof',
    'openimageio_bounded_execution_rehearsal_runs_real_synthetic_no_user_media_tool_proof',
    'bounded_execution_rehearsal_blocks_tools_without_explicit_handlers',
    'hyperframe_stays_frontend_preview_boundary',
    'live_execution_blocks_until_deployed_evidence',
    'live_execution_admits_production_ready_worker_after_stored_evidence_and_credit_references',
    'hyperframe_never_switches_to_backend_live_execution',
    'raw_prompt_blocks_before_dispatch',
    'unsupported_actions_block',
    'service_fee_excluded',
  ],
}, null, 2))

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
