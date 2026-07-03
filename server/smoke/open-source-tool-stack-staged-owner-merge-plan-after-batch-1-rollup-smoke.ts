import {
  buildStagedOwnerMergePlan,
  readStagedOwnerMergeArtifacts,
} from '../activation/open-source-tool-stack-staged-owner-merge-plan-after-batch-1-rollup'

const plan = buildStagedOwnerMergePlan()
const reports = readStagedOwnerMergeArtifacts()

if (plan.expectedDecision !== 'staged_owner_merge_plan_passed_ready_for_e2e_validation_pr305_hydration_blocker_resolution') {
  throw new Error('unexpected_expected_decision')
}
if (reports.decision.decision !== plan.expectedDecision) throw new Error('unexpected_staged_owner_decision')
if (reports.toolCountAndClaimPolicy.details.endToEndProductReadyTools !== 0) {
  throw new Error('end_to_end_product_ready_tools_claimed')
}
if (reports.decision.fortyPlusToolsEndToEndProven !== false) throw new Error('forty_plus_tools_claimed')
if (reports.decision.mediaProcessingAccepted !== false) throw new Error('media_processing_not_blocked')
if (reports.decision.productionUnlocked !== false) throw new Error('production_unlocked')

console.log('Staged owner merge plan after Batch 1 rollup smoke passed.')
