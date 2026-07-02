import assert from 'node:assert/strict'
import { buildTrackBProductReadySourceReconciliationReport } from '../cli/beta-trackb-product-ready-source-reconciliation.mjs'

const result = buildTrackBProductReadySourceReconciliationReport()

assert.equal(result.ok, true)
assert.equal(result.decision, 'beta_trackb_product_ready_source_reconciliation_passed_ready_for_deployed_product_ready_evidence_collection')
assert.equal(result.trackBProductReadySourceCount, 16)
assert.equal(result.activeBetaProductReadyDeployedEvidenceCount, 0)
assert.equal(result.remainingBlockedScopes.includes('paid_production_until_separate_paid_production_evidence_collector_passes'), true)
assert.equal(result.failures.length, 0)

console.log(JSON.stringify({
  ok: result.ok,
  decision: result.decision,
  trackBProductReadySourceCount: result.trackBProductReadySourceCount,
  activeBetaProductReadyDeployedEvidenceCount: result.activeBetaProductReadyDeployedEvidenceCount,
}, null, 2))
