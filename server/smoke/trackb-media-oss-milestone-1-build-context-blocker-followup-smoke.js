import {
  forbiddenOutputsPresent,
  protectedFilesHaveNoDiff,
  readTrackBMilestone1BuildContextFollowupArtifacts,
} from '../activation/trackb-media-oss-milestone-1-build-context-blocker-followup/index.js'

const reports = readTrackBMilestone1BuildContextFollowupArtifacts()

if (!reports.decisionReport.decision.startsWith('trackb_media_oss_milestone1_build_context_followup_')) {
  throw new Error(`unexpected_decision:${reports.decisionReport.decision}`)
}
if (reports.decisionReport.endToEndProductReadyTools !== 0) throw new Error('product_ready_tools_claimed')
if (reports.decisionReport.fortyPlusEndToEndClaimAllowed !== false) throw new Error('forty_plus_claim_allowed')
if (reports.decisionReport.mediaProcessingAccepted !== false) throw new Error('media_processing_unblocked')
if (reports.decisionReport.renderExportAccepted !== false) throw new Error('render_export_unblocked')
if (reports.decisionReport.betaProductionAccepted !== false) throw new Error('beta_production_unblocked')
if (reports.decisionReport.hostToolProofRun !== false) throw new Error('host_tool_proof_unblocked')
if (reports.decisionReport.dockerImagePushRun !== false) throw new Error('docker_image_push_unblocked')
if (!protectedFilesHaveNoDiff()) throw new Error('protected_files_changed')
const outputs = forbiddenOutputsPresent()
if (outputs.length) throw new Error(`forbidden_outputs_present:${outputs.join(',')}`)

console.log('Track B Milestone 1 build-context blocker follow-up smoke passed.')
