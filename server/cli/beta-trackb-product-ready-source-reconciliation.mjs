import { readFileSync } from 'node:fs'

const REPORT_PATH = 'docs/beta-readiness/trackb-product-ready-source-reconciliation/2026-06-30-trackb-product-ready-source-reconciliation.json'
const EXPECTED_DECISION = 'beta_trackb_product_ready_source_reconciliation_passed_ready_for_deployed_product_ready_evidence_collection'
const EXPECTED_TRACKB_DECISION = 'trackb_media_oss_product_beta_runtime_product_ready_closeout_passed_all_16_tools_ready_for_ranked_tools_call_lane'

export function buildTrackBProductReadySourceReconciliationReport(path = REPORT_PATH) {
  const report = JSON.parse(readFileSync(path, 'utf8'))
  const failures = []

  if (report.decision !== EXPECTED_DECISION) {
    failures.push(`decision drift: ${report.decision}`)
  }
  if (report.productReadyCloseout?.pullRequest !== 987) {
    failures.push('PR #987 product-ready closeout evidence is missing.')
  }
  if (report.productReadyCloseout?.state !== 'MERGED') {
    failures.push('PR #987 must be recorded as MERGED.')
  }
  if (report.productReadyCloseout?.decision !== EXPECTED_TRACKB_DECISION) {
    failures.push('Track B product-ready closeout decision drift.')
  }
  if (report.trackBProductReadyTotals?.productReadyForRankedToolCallLane !== 16) {
    failures.push('Track B product-ready source count must be 16.')
  }
  if (report.activeBetaDeployedEvidenceTotals?.productReadyLocalOssRecordedInActiveBetaEvidence !== 0) {
    failures.push('Active beta deployed evidence must not claim product-ready count before deployed readback.')
  }
  if (report.duplicateReview?.openDuplicatePrsObserved !== 0) {
    failures.push('Open duplicate reconciliation PRs must remain 0.')
  }
  if (report.blockedScopeConfirmations?.runtimeRoutesChanged !== false ||
    report.blockedScopeConfirmations?.toolExecutionRan !== false ||
    report.blockedScopeConfirmations?.deployedBackendCalled !== false ||
    report.blockedScopeConfirmations?.backendEvidenceRecorded !== false ||
    report.blockedScopeConfirmations?.externalBetaEnabled !== false ||
    report.blockedScopeConfirmations?.paidProductionEnabled !== false) {
    failures.push('No-scope confirmations drifted.')
  }
  if (report.supabaseClassification?.write !== 'no write' ||
    report.supabaseClassification?.environment !== 'none' ||
    report.supabaseClassification?.sql !== 'none' ||
    report.supabaseClassification?.migration !== 'no') {
    failures.push('Supabase classification drifted.')
  }

  return {
    ok: failures.length === 0,
    reportPath: path,
    decision: report.decision,
    trackBProductReadySourceCount: report.trackBProductReadyTotals?.productReadyForRankedToolCallLane,
    activeBetaProductReadyDeployedEvidenceCount: report.activeBetaDeployedEvidenceTotals?.productReadyLocalOssRecordedInActiveBetaEvidence,
    nextSafeActions: report.nextSafeActions,
    remainingBlockedScopes: report.remainingBlockedScopes,
    failures,
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const result = buildTrackBProductReadySourceReconciliationReport()
  console.log(JSON.stringify(result, null, 2))
  if (!result.ok) process.exitCode = 1
}
