import {
  forbiddenOutputsPresent,
  protectedFilesHaveNoDiff,
  readTrackBMilestone3OcrMlCpuExecutionArtifacts,
} from '../activation/trackb-media-oss-milestone-3-ocr-ml-cpu-execution/index.js'

const reports = readTrackBMilestone3OcrMlCpuExecutionArtifacts()
const acceptableDecisions = new Set([
  'trackb_media_oss_milestone3_ocr_ml_cpu_execution_passed_import_api_shape_no_model_assets',
  'trackb_media_oss_milestone3_ocr_ml_cpu_execution_passed_ready_for_model_asset_approval',
])

if (!acceptableDecisions.has(reports.decisionReport.decision)) {
  throw new Error(`unexpected_or_blocked_decision:${reports.decisionReport.decision}`)
}
if (reports.decisionReport.endToEndProductReadyTools !== 0) throw new Error('product_ready_tools_claimed')
if (reports.decisionReport.fortyPlusEndToEndClaimAllowed !== false) throw new Error('forty_plus_claim_allowed')
if (reports.decisionReport.ocrInferenceRunInThisPhase !== false) throw new Error('ocr_inference_claimed')
if (reports.decisionReport.modelDownloadRunInThisPhase !== false) throw new Error('model_download_claimed')
if (reports.decisionReport.gpuRunInThisPhase !== false) throw new Error('gpu_execution_claimed')
if (!protectedFilesHaveNoDiff()) throw new Error('protected_files_changed')
const outputs = forbiddenOutputsPresent()
if (outputs.length) throw new Error(`forbidden_outputs_present:${outputs.join(',')}`)

console.log('Track B Milestone 3 OCR/ML CPU execution smoke passed.')
