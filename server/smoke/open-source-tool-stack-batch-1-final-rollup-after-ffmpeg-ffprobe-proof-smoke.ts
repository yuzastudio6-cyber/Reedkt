import {
  buildBatch1FinalRollupPlan,
  readBatch1FinalRollupArtifacts,
} from '../activation/open-source-tool-stack-batch-1-final-rollup-after-ffmpeg-ffprobe-proof'

const plan = buildBatch1FinalRollupPlan()
if (
  plan.expectedDecision !==
  'open_source_tool_stack_batch1_final_rollup_passed_media_processing_still_blocked_ready_for_batch2_planning'
) {
  throw new Error('unexpected_expected_decision')
}

const reports = readBatch1FinalRollupArtifacts()
if (reports.decision.decision !== plan.expectedDecision) throw new Error('unexpected_final_rollup_decision')
if (reports.acceptedToolsMatrix.accepted !== true) throw new Error('accepted_tools_matrix_not_accepted')
if (reports.stillBlockedScopeMatrix.accepted !== true) throw new Error('still_blocked_scope_matrix_not_accepted')
if (reports.internalBetaImpactReview.accepted !== true) throw new Error('internal_beta_impact_not_accepted')
if (reports.batch2PlanningHandoff.accepted !== true) throw new Error('batch2_handoff_not_accepted')
if (reports.decision.mediaProcessingAccepted !== false) throw new Error('media_processing_not_blocked')
if (reports.decision.externalBetaUnlocked !== false) throw new Error('external_beta_unlocked')
if (reports.decision.productionUnlocked !== false) throw new Error('production_unlocked')

console.log('Batch 1 final rollup after FFmpeg/FFprobe proof smoke passed.')
