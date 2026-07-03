import {
  buildOwnerLaneReconciliationPlan,
  readOwnerLaneReconciliationArtifacts,
} from '../activation/open-source-tool-stack-owner-lane-reconciliation-after-batch-1-rollup'

const plan = buildOwnerLaneReconciliationPlan()
const reports = readOwnerLaneReconciliationArtifacts()

if (plan.expectedDecision !== 'owner_lane_reconciliation_passed_ready_for_staged_owner_merge_plan') {
  throw new Error('unexpected_expected_decision')
}
if (reports.decision.decision !== plan.expectedDecision) throw new Error('unexpected_owner_lane_decision')
if (reports.ownerLaneStatusMatrix.accepted !== true) throw new Error('owner_lane_matrix_not_accepted')
if (reports.reconciledToolCountSummary.details.endToEndProductReadyTools !== 0) {
  throw new Error('end_to_end_product_ready_tools_claimed')
}
if (reports.decision.fortyPlusToolsEndToEndProven !== false) throw new Error('forty_plus_tools_claimed')
if (reports.decision.mediaProcessingAccepted !== false) throw new Error('media_processing_not_blocked')
if (reports.decision.productionUnlocked !== false) throw new Error('production_unlocked')

console.log('Owner-lane reconciliation after Batch 1 rollup smoke passed.')
