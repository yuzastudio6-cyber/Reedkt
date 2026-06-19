import {
  buildTrackBMilestone1Plan,
  forbiddenOutputsPresent,
  protectedFilesHaveNoDiff,
  readTrackBMilestone1Artifacts,
} from '../activation/trackb-media-oss-milestone-1-low-risk-metadata-tooling-execution/index.js'

const plan = buildTrackBMilestone1Plan()
const reports = readTrackBMilestone1Artifacts()

if (plan.tools.length !== 4) throw new Error('unexpected_milestone_1_tool_count')
if (!reports.decisionReport.decision.startsWith('trackb_media_oss_milestone1_')) {
  throw new Error('unexpected_milestone_1_decision')
}
if (reports.decisionReport.endToEndProductReadyTools !== 0) throw new Error('product_ready_tools_claimed')
if (reports.decisionReport.fortyPlusEndToEndClaimAllowed !== false) throw new Error('forty_plus_claim_allowed')
if (reports.decisionReport.mediaProcessingAccepted !== false) throw new Error('media_processing_unblocked')
if (reports.decisionReport.renderExportAccepted !== false) throw new Error('render_export_unblocked')
if (reports.decisionReport.betaProductionAccepted !== false) throw new Error('beta_production_unblocked')
if (!protectedFilesHaveNoDiff()) throw new Error('protected_files_changed')
const forbiddenOutputs = forbiddenOutputsPresent()
if (forbiddenOutputs.length) throw new Error(`forbidden_outputs_present:${forbiddenOutputs.join(',')}`)

console.log('Track B media OSS Milestone 1 low-risk metadata tooling smoke passed.')
