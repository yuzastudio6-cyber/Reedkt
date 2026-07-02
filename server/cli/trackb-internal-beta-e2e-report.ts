import { runTrackBInternalBetaE2E } from '../internal-beta'

const result = await runTrackBInternalBetaE2E()

console.log(JSON.stringify({
  ok: result.ok,
  runId: result.runId,
  decision: result.operatorDashboard.decision,
  sourceSha: result.sourceSha,
  trackBTools: {
    total: result.operatorDashboard.totalTrackBTools,
    dispatched: result.operatorDashboard.dispatchedToolCount,
    qaPassed: result.operatorDashboard.qaPassedToolCount,
  },
  artifacts: result.outputManifest,
  costs: {
    billableEvents: result.costSummary.billableEventCount,
    nonBillableEvents: result.costSummary.nonBillableEventCount,
    actualToolCostCredits: result.costSummary.actualToolCostCredits,
  },
  operatorDashboard: result.operatorDashboard,
  betaOperatorStatusSnapshot: result.betaOperatorStatusSnapshot,
  warnings: result.warnings,
}, null, 2))
