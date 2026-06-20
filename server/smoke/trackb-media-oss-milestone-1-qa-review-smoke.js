import {
  forbiddenOutputsPresent,
  protectedFilesHaveNoDiff,
  readTrackBMilestone1QaReviewArtifacts,
} from '../activation/trackb-media-oss-milestone-1-qa-review/index.js'

const reports = readTrackBMilestone1QaReviewArtifacts()

if (
  reports.decisionReport.decision !==
  'trackb_media_oss_milestone1_qa_passed_ready_for_milestone2_video_analysis_approval'
) {
  throw new Error(`unexpected_decision:${reports.decisionReport.decision}`)
}
if (reports.statusUpdate.acceptedProvenBoundedTotalAfterQa !== 9) throw new Error('accepted_count_not_9')
if (reports.statusUpdate.stillBlockedNotInstalledProvenCount !== 7) throw new Error('blocked_count_not_7')
if (reports.decisionReport.endToEndProductReadyTools !== 0) throw new Error('product_ready_tools_claimed')
if (reports.toolMatrix.graphicsMagick.countedAsAcceptedProven !== false) throw new Error('graphicsmagick_counted')
if (!protectedFilesHaveNoDiff()) throw new Error('protected_files_changed')
const outputs = forbiddenOutputsPresent()
if (outputs.length) throw new Error(`forbidden_outputs_present:${outputs.join(',')}`)

console.log('Track B Milestone 1 QA review smoke passed.')
