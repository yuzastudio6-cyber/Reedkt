import {
  buildBatch2PlanningPlan,
  readBatch2PlanningArtifacts,
} from '../activation/open-source-tool-stack-batch-2-planning-after-batch-1-rollup'

const plan = buildBatch2PlanningPlan()
const reports = readBatch2PlanningArtifacts()

if (
  plan.expectedDecision !==
  'open_source_tool_stack_batch2_planning_passed_ready_for_owner_lane_reconciliation'
) {
  throw new Error('unexpected_expected_decision')
}
if (reports.decision.decision !== plan.expectedDecision) throw new Error('unexpected_batch2_planning_decision')
if (reports.batch2CandidateInventory.accepted !== true) throw new Error('candidate_inventory_not_accepted')
if (reports.ownerLaneReconciliationMap.accepted !== true) throw new Error('owner_lane_map_not_accepted')
if (reports.decision.fortyPlusToolsEndToEndProven !== false) throw new Error('forty_plus_tools_claimed_proven')
if (reports.decision.mediaProcessingAccepted !== false) throw new Error('media_processing_not_blocked')
if (reports.decision.productionUnlocked !== false) throw new Error('production_unlocked')

console.log('Batch 2 planning after Batch 1 rollup smoke passed.')
