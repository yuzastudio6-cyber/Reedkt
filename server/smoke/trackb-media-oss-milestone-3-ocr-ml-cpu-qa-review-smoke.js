import {
  forbiddenOutputsPresent,
  protectedFilesHaveNoDiff,
  readTrackBMilestone3OcrMlCpuQaReviewArtifacts,
} from '../activation/trackb-media-oss-milestone-3-ocr-ml-cpu-qa-review/index.js'

const reports = readTrackBMilestone3OcrMlCpuQaReviewArtifacts()

if (
  reports.decisionReport.decision !==
  'trackb_media_oss_milestone3_ocr_ml_cpu_qa_passed_ready_for_milestone4_color_image_pipeline_approval'
) {
  throw new Error(`unexpected_decision:${reports.decisionReport.decision}`)
}
if (reports.statusUpdate.acceptedProvenBoundedTotalAfterQa !== 14) throw new Error('accepted_count_not_14')
if (reports.statusUpdate.stillBlockedNotInstalledProvenCount !== 2) throw new Error('blocked_count_not_2')
if (reports.decisionReport.endToEndProductReadyTools !== 0) throw new Error('product_ready_tools_claimed')
if (reports.decisionReport.ocrInferenceAccepted !== false) throw new Error('ocr_inference_accepted')
if (reports.decisionReport.gpuExecutionApproved !== false) throw new Error('gpu_execution_approved')
if (!protectedFilesHaveNoDiff()) throw new Error('protected_files_changed')
const outputs = forbiddenOutputsPresent()
if (outputs.length) throw new Error(`forbidden_outputs_present:${outputs.join(',')}`)

console.log('Track B Milestone 3 OCR/ML CPU QA review smoke passed.')
