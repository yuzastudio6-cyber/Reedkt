import assert from 'node:assert/strict'
import {
  buildTrackBAgentRuntimeReadinessReport,
  TRACKB_AGENT_RUNTIME_TOOL_IDS,
} from '../beta-readiness/trackb-agent-runtime-readiness'

const report = buildTrackBAgentRuntimeReadinessReport()

assert.equal(report.decision, 'trackb_agent_runtime_readiness_admission_passed_ready_for_deployed_execution_evidence')
assert.equal(report.toolCount, 16)
assert.deepEqual(report.expectedToolIds, [...TRACKB_AGENT_RUNTIME_TOOL_IDS])
assert.equal(report.localAcceptedToolCount, 16)
assert.equal(report.productReadySourceCount, 16)
assert.equal(report.agentContractsReady, true)
assert.equal(report.paymentIndependentRuntimeReady, true)
assert.equal(report.liveAgentExecutionReady, false)
assert.equal(report.productReadyLocalOssCount, 0)
assert.equal(report.deployedEvidenceRecordedToolCount, 0)
assert.equal(report.paymentScope, 'excluded_from_this_readiness_gate')
assert.equal(report.serviceFeeIncluded, false)
assert.deepEqual(report.blockedActionScope, [
  'deployed_product_ready_evidence_recording',
  'external_beta_user_media_execution',
  'paid_production_execution',
])
assert.ok(report.allowedForwardProgressScopes.includes('agent_runtime_contract_validation'))
assert.ok(report.allowedForwardProgressScopes.includes('bounded_runtime_probe_validation'))
assert.ok(report.allowedForwardProgressScopes.includes('mock_safe_worker_dispatch_validation'))
assert.ok(report.allowedForwardProgressScopes.includes('deployed_product_ready_evidence_collection'))
assert.ok(report.blockers.some((blocker) => blocker.includes('0/16 Track B tools')))
assert.equal(report.contracts.length, 16)

for (const contract of report.contracts) {
  assert.equal(contract.agentInvocationId, `trackb.media_oss.${contract.toolId}`)
  assert.equal(contract.agentContractReady, true, `${contract.toolId} should have an agent contract`)
  assert.equal(contract.paymentIndependentRuntimeReady, true, `${contract.toolId} should be ready for payment-independent runtime admission`)
  assert.equal(contract.liveExecutionReady, false, `${contract.toolId} should still block live execution before deployed evidence`)
  assert.equal(contract.localAcceptedEvidenceReady, true, `${contract.toolId} should have local accepted evidence`)
  assert.equal(contract.productReadySourceCloseoutReady, true, `${contract.toolId} should have source closeout`)
  assert.equal(contract.deployedEvidenceRecorded, false, `${contract.toolId} should not claim deployed evidence yet`)
  assert.ok(contract.supportedActions.length > 0, `${contract.toolId} should expose supported actions`)
  assert.ok(contract.requiredPayloadReferences.includes('workspaceId'), `${contract.toolId} should require workspaceId`)
  assert.ok(contract.requiredPayloadReferences.includes('projectId'), `${contract.toolId} should require projectId`)
  assert.ok(contract.requiredPayloadReferences.includes('approvedSnapshotId'), `${contract.toolId} should require approvedSnapshotId`)
  assert.ok(contract.requiredPayloadReferences.includes('toolExecutionPlanId'), `${contract.toolId} should require toolExecutionPlanId`)
  assert.ok(contract.requiredPayloadReferences.includes('idempotencyKey'), `${contract.toolId} should require idempotencyKey`)
  assert.ok(contract.requiredSafetyGates.includes('raw_prompt_block_gate'), `${contract.toolId} should block raw prompts`)
  assert.ok(contract.requiredSafetyGates.includes('signed_url_block_gate'), `${contract.toolId} should block signed URLs`)
  assert.ok(contract.requiredSafetyGates.includes('secret_block_gate'), `${contract.toolId} should block secrets`)
  assert.deepEqual(contract.blockedActionScope, [
    'deployed_product_ready_evidence_recording',
    'external_beta_user_media_execution',
    'paid_production_execution',
  ])
}

const hyperframe = report.contracts.find((contract) => contract.toolId === 'hyperframe')
assert.ok(hyperframe, 'hyperframe contract must exist')
assert.deepEqual(hyperframe.admittedModes, ['frontend_preview_boundary', 'bounded_runtime_probe', 'bounded_execution_rehearsal'])
assert.equal(hyperframe.workerType, 'frontend_preview_only')
assert.ok(hyperframe.requiredPayloadReferences.includes('approvedPreviewStateReference'))

for (const toolId of TRACKB_AGENT_RUNTIME_TOOL_IDS.filter((toolId) => toolId !== 'hyperframe')) {
  const contract = report.contracts.find((candidate) => candidate.toolId === toolId)
  assert.ok(contract, `${toolId} contract must exist`)
  assert.ok(contract?.admittedModes.includes('mock_safe_worker_dispatch'), `${toolId} should be mock-safe worker admitted`)
  assert.ok(contract?.admittedModes.includes('bounded_runtime_probe'), `${toolId} should be bounded runtime probe admitted`)
  if (['ffmpeg', 'ffprobe', 'sharp', 'duckdb', 'polars', 'pyav', 'opentimelineio', 'pyscenedetect', 'opencv', 'opencolorio', 'openimageio', 'audioflux', 'signalsmith_stretch', 'remotion'].includes(toolId)) {
    assert.ok(
      contract?.admittedModes.includes('bounded_execution_rehearsal'),
      `${toolId} should admit bounded execution rehearsal`,
    )
  } else {
    assert.equal(
      contract?.admittedModes.includes('bounded_execution_rehearsal'),
      false,
      `${toolId} should not claim bounded execution rehearsal until an explicit handler exists`,
    )
  }
  assert.ok(contract?.expectedWorkerTypes.length, `${toolId} should expose expected worker types`)
  assert.ok(contract?.imageRoles.length, `${toolId} should expose image roles`)
}

const deployedReport = buildTrackBAgentRuntimeReadinessReport({
  deployedEvidenceSource: 'stored_operator_status_readback',
  deployedEvidenceWorkspaceId: 'workspace-trackb-runtime-readiness-smoke',
  deployedEvidencePacketCount: 2,
  deployedEvidenceRecordedToolCount: 16,
})
assert.equal(deployedReport.liveAgentExecutionReady, true)
assert.equal(deployedReport.deployedEvidenceRecordedToolCount, 16)
assert.equal(deployedReport.productReadyLocalOssCount, 16)
assert.equal(deployedReport.sourceEvidence.deployedEvidenceSource, 'stored_operator_status_readback')
assert.equal(deployedReport.sourceEvidence.deployedEvidenceWorkspaceId, 'workspace-trackb-runtime-readiness-smoke')
assert.deepEqual(deployedReport.blockedActionScope, [])
assert.deepEqual(deployedReport.blockers, [])

const deployedHyperframe = deployedReport.contracts.find((contract) => contract.toolId === 'hyperframe')
assert.ok(deployedHyperframe)
assert.deepEqual(deployedHyperframe.admittedModes, ['frontend_preview_boundary', 'bounded_runtime_probe', 'bounded_execution_rehearsal'])
assert.equal(deployedHyperframe.liveExecutionReady, true)

for (const toolId of TRACKB_AGENT_RUNTIME_TOOL_IDS.filter((toolId) => toolId !== 'hyperframe')) {
  const contract = deployedReport.contracts.find((candidate) => candidate.toolId === toolId)
  assert.ok(contract, `${toolId} deployed contract must exist`)
  assert.ok(contract.admittedModes.includes('mock_safe_worker_dispatch'))
  assert.ok(contract.admittedModes.includes('bounded_runtime_probe'))
  if (['ffmpeg', 'ffprobe', 'sharp', 'duckdb', 'polars', 'pyav', 'opentimelineio', 'pyscenedetect', 'opencv', 'opencolorio', 'openimageio', 'audioflux', 'signalsmith_stretch', 'remotion'].includes(toolId)) {
    assert.ok(contract.admittedModes.includes('bounded_execution_rehearsal'))
  } else {
    assert.equal(contract.admittedModes.includes('bounded_execution_rehearsal'), false)
  }
  assert.ok(contract.admittedModes.includes('deployed_live_execution'))
  assert.equal(contract.deployedEvidenceRecorded, true)
  assert.equal(contract.blockedActionScope.length, 0)
}

const serialized = JSON.stringify(report).toLowerCase()
assert.equal(serialized.includes('40+ tools proven end-to-end'), false)
assert.equal(/service_role_key|bearer\s+[a-z0-9._-]+|x-goog-signature|sig=|token=/.test(serialized), false)

console.log(JSON.stringify({
  ok: true,
  toolCount: report.toolCount,
  agentContractsReady: report.agentContractsReady,
  paymentIndependentRuntimeReady: report.paymentIndependentRuntimeReady,
  liveAgentExecutionReady: report.liveAgentExecutionReady,
  deployedEvidenceRecordedToolCount: report.deployedEvidenceRecordedToolCount,
}, null, 2))
