import {
  forbiddenOutputsPresent,
  protectedFilesHaveNoDiff,
  readTrackBMilestone3OcrMlCpuGpuReviewArtifacts,
  stagedModelOrMediaArtifacts,
} from '../activation/trackb-media-oss-milestone-3-ocr-ml-cpu-gpu-review/index.js'

const reports = readTrackBMilestone3OcrMlCpuGpuReviewArtifacts()

if (
  reports.decisionReport.decision !==
  'trackb_media_oss_milestone3_ocr_ml_cpu_gpu_review_passed_ready_for_cpu_execution'
) {
  throw new Error(`unexpected_decision:${reports.decisionReport.decision}`)
}
if (reports.decisionReport.counts.acceptedProvenBounded !== 12) throw new Error('accepted_count_not_12')
if (reports.decisionReport.counts.blockedNotInstalledProven !== 4) throw new Error('blocked_count_not_4')
if (reports.decisionReport.counts.endToEndProductReady !== 0) throw new Error('product_ready_tools_claimed')
if (reports.modelAssetPolicy.ocrInferenceAllowedInNextCpuExecution !== false) throw new Error('ocr_inference_unblocked')
if (reports.gpuPolicy.gpuExecutionApprovedThisPhase !== false) throw new Error('gpu_execution_unblocked')
if (!protectedFilesHaveNoDiff()) throw new Error('protected_files_changed')
const outputs = forbiddenOutputsPresent()
if (outputs.length) throw new Error(`forbidden_outputs_present:${outputs.join(',')}`)
const stagedArtifacts = stagedModelOrMediaArtifacts()
if (stagedArtifacts.length) throw new Error(`staged_model_or_media_artifacts:${stagedArtifacts.join(',')}`)

console.log('Track B Milestone 3 OCR/ML CPU-GPU review smoke passed.')
