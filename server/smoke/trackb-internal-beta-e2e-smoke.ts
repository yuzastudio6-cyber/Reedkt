import assert from 'node:assert/strict'

import {
  TRACKB_INTERNAL_BETA_E2E_DECISION,
  runTrackBInternalBetaE2E,
} from '../internal-beta'
import { TRACK_B_ADAPTER_TOOL_IDS } from '../trackb-adapters'

const result = await runTrackBInternalBetaE2E({
  sourceSha: 'trackb-internal-beta-e2e-smoke',
})

assert.equal(result.ok, true, 'Milestone 8 Track B internal beta E2E should pass')
assert.equal(
  result.operatorDashboard.decision,
  TRACKB_INTERNAL_BETA_E2E_DECISION,
  'operator dashboard should preserve the Milestone 8 decision',
)
assert.equal(
  result.operatorDashboard.internalBetaCanRunControlledToolAssistedEdits,
  true,
  'operator dashboard should mark controlled internal beta tool-assisted edits ready',
)
assert.equal(result.operatorDashboard.externalBetaAllowed, false, 'external beta must remain blocked')
assert.equal(result.operatorDashboard.realUserMediaBetaAllowed, false, 'real-user-media beta must remain blocked')
assert.equal(result.operatorDashboard.paidProductionAllowed, false, 'paid production must remain blocked')
assert.equal(result.operatorDashboard.productReadyLocalOssCount, 0, 'product-ready local OSS count remains zero')

assert.equal(result.toolRuns.length, TRACK_B_ADAPTER_TOOL_IDS.length, 'all Track B adapters should run once')
assert.deepEqual(
  result.toolRuns.map((toolRun) => toolRun.toolId).sort(),
  [...TRACK_B_ADAPTER_TOOL_IDS].sort(),
  'the E2E run should cover the full 16-tool Track B adapter set',
)

for (const toolRun of result.toolRuns) {
  assert.equal(toolRun.gatewayStatus, 'dispatched', `${toolRun.toolId} should dispatch through the backend gateway`)
  assert.equal(toolRun.adapterStatus, 'bounded_execution_ready', `${toolRun.toolId} adapter should be bounded-ready`)
  assert.equal(toolRun.workerStatus, 'completed', `${toolRun.toolId} worker route should complete mock-safe`)
  assert.equal(toolRun.qaStatus, 'passed', `${toolRun.toolId} QA should pass`)
  assert.ok(toolRun.privateInputCount > 0, `${toolRun.toolId} should use private source/input artifacts`)
  assert.ok(toolRun.privateOutputCount > 0, `${toolRun.toolId} should produce private output artifacts`)
  assert.equal(toolRun.costEstimate.serviceFeeIncluded, false, `${toolRun.toolId} event cost excludes ReEditPro service fee`)
  assert.equal(toolRun.costEvent.billableToUser, true, `${toolRun.toolId} synthetic approved work should be billable`)
  assert.ok(toolRun.costEvent.toolCostCredits >= 1, `${toolRun.toolId} should emit a positive credit event`)
}

assert.equal(result.outputManifest.artifactCount > 0, true, 'the E2E run should produce output artifacts')
assert.equal(
  result.outputManifest.privateArtifactCount,
  result.outputManifest.artifactCount,
  'all output artifacts should remain private',
)
assert.equal(result.outputManifest.publicArtifactCount, 0, 'no public artifacts should be produced')
assert.equal(result.outputManifest.signedUrlArtifactCount, 0, 'no signed URL artifacts should be produced')

assert.equal(result.qaSummary.allAdapterQaPassed, true, 'all adapter QA should pass')
assert.equal(result.qaSummary.allWorkerJobsCompleted, true, 'all worker jobs should complete')
assert.equal(result.qaSummary.allArtifactsPrivate, true, 'all artifacts should be private')
assert.equal(result.qaSummary.noRealToolExecution, true, 'real tool execution must not occur in Milestone 8 smoke')
assert.equal(result.qaSummary.noRealUserMedia, true, 'real user media must not be used in Milestone 8 smoke')

assert.equal(
  result.costSummary.billableEventCount,
  TRACK_B_ADAPTER_TOOL_IDS.length,
  'one idempotent billable event should be recorded for each Track B adapter',
)
assert.equal(result.costSummary.nonBillableEventCount, 0, 'no non-billable events are expected in the approved synthetic pass')
assert.equal(result.costSummary.events.length, TRACK_B_ADAPTER_TOOL_IDS.length, 'duplicate event replay must not double-charge')
assert.ok(
  result.costSummary.events.every((event) => event.creditEstimateId && event.creditReservationId),
  'all cost events should reference estimate and reservation IDs',
)
assert.ok(
  result.costSummary.events.every((event) => event.pricingSnapshot.serviceFeeIncluded === false),
  'all cost events should keep service fees out of tool costs',
)

assert.equal(result.operatorDashboard.gatewayReplayChecked, true, 'gateway idempotency replay should be checked')
assert.equal(result.operatorDashboard.costEventReplayChecked, true, 'cost-event idempotency replay should be checked')
assert.equal(
  result.betaOperatorStatusSnapshot.safeBlockerReductionAllowed,
  true,
  'beta operator status should allow safe blocker reduction after dry-run evidence',
)
assert.equal(result.betaOperatorStatusSnapshot.readyForExternalBeta, false, 'external beta remains blocked')
assert.equal(result.betaOperatorStatusSnapshot.readyForRealUserMediaBeta, false, 'real-user-media beta remains blocked')
assert.equal(result.betaOperatorStatusSnapshot.readyForPaidProduction, false, 'paid production remains blocked')

const warningText = result.warnings.join('\n')
assert.equal(/https?:\/\//i.test(warningText), false, 'Milestone 8 warnings should not contain public URLs')
assert.equal(/X-Goog-Signature|X-Amz-Signature/i.test(warningText), false, 'Milestone 8 warnings should not contain signed URL material')
assert.equal(/rawPrompt/i.test(warningText), false, 'Milestone 8 warnings should not carry raw prompt text')
assert.equal(
  /(?:service[_-]?role[_-]?key|api[_-]?key|secret|token)\s*[:=]/i.test(warningText),
  false,
  'Milestone 8 warnings should not leak credential-shaped secret values',
)

console.log(JSON.stringify({
  ok: true,
  decision: result.operatorDashboard.decision,
  totalTrackBTools: result.operatorDashboard.totalTrackBTools,
  dispatchedToolCount: result.operatorDashboard.dispatchedToolCount,
  qaPassedToolCount: result.operatorDashboard.qaPassedToolCount,
  artifactCount: result.outputManifest.artifactCount,
  billableCostEventCount: result.costSummary.billableEventCount,
  internalBetaCanRunControlledToolAssistedEdits: result.operatorDashboard.internalBetaCanRunControlledToolAssistedEdits,
  externalBetaAllowed: result.operatorDashboard.externalBetaAllowed,
  productReadyLocalOssCount: result.operatorDashboard.productReadyLocalOssCount,
}, null, 2))
