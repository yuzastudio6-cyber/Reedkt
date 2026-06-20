import {
  forbiddenOutputsPresent,
  protectedFilesHaveNoDiff,
  readTrackBMilestone2QaReviewArtifacts,
} from '../activation/trackb-media-oss-milestone-2-qa-review/index.js'

const reports = readTrackBMilestone2QaReviewArtifacts()

if (
  reports.decisionReport.decision !==
  'trackb_media_oss_milestone2_qa_passed_ready_for_milestone3_ocr_ml_cpu_gpu_review'
) {
  throw new Error(`unexpected_decision:${reports.decisionReport.decision}`)
}
if (reports.statusUpdate.acceptedProvenBoundedTotalAfterQa !== 12) throw new Error('accepted_count_not_12')
if (reports.statusUpdate.stillBlockedNotInstalledProvenCount !== 4) throw new Error('blocked_count_not_4')
if (reports.decisionReport.endToEndProductReadyTools !== 0) throw new Error('product_ready_tools_claimed')
if (reports.decisionReport.gpuExecutionApproved !== false) throw new Error('gpu_execution_approved')
if (!protectedFilesHaveNoDiff()) throw new Error('protected_files_changed')
const outputs = forbiddenOutputsPresent()
if (outputs.length) throw new Error(`forbidden_outputs_present:${outputs.join(',')}`)

console.log('Track B Milestone 2 QA review smoke passed.')
