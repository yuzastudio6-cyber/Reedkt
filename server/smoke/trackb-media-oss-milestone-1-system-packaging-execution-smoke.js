import {
  cpuWorkerDockerfilePatchIsApprovedOnly,
  forbiddenOutputsPresent,
  protectedNoDiffFilesHaveNoDiff,
  readTrackBMilestone1SystemPackagingExecutionArtifacts,
} from '../activation/trackb-media-oss-milestone-1-system-packaging-execution/index.js'

const reports = readTrackBMilestone1SystemPackagingExecutionArtifacts()

if (!reports.decisionReport.decision.startsWith('trackb_media_oss_milestone1_system_packaging_execution_')) {
  throw new Error(`unexpected_decision:${reports.decisionReport.decision}`)
}
if (reports.decisionReport.endToEndProductReadyTools !== 0) throw new Error('product_ready_tools_claimed')
if (reports.decisionReport.fortyPlusEndToEndClaimAllowed !== false) throw new Error('forty_plus_claim_allowed')
if (reports.decisionReport.mediaProcessingAccepted !== false) throw new Error('media_processing_unblocked')
if (reports.decisionReport.renderExportAccepted !== false) throw new Error('render_export_unblocked')
if (reports.decisionReport.betaProductionAccepted !== false) throw new Error('beta_production_unblocked')
if (!cpuWorkerDockerfilePatchIsApprovedOnly()) throw new Error('cpu_worker_dockerfile_patch_not_approved_only')
if (!protectedNoDiffFilesHaveNoDiff()) throw new Error('protected_no_diff_files_changed')
const outputs = forbiddenOutputsPresent()
if (outputs.length) throw new Error(`forbidden_outputs_present:${outputs.join(',')}`)

console.log('Track B Milestone 1 system packaging execution smoke passed.')
