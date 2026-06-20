import {
  forbiddenOutputsPresent,
  protectedFilesHaveNoDiff,
  readTrackBMilestone3OcrMlCpuExecutionBlockerFollowupArtifacts,
} from '../activation/trackb-media-oss-milestone-3-ocr-ml-cpu-execution-blocker-followup/index.js'

const reports = readTrackBMilestone3OcrMlCpuExecutionBlockerFollowupArtifacts()
const acceptableDecisions = new Set([
  'trackb_media_oss_milestone3_ocr_ml_cpu_blocker_followup_passed_import_api_shape_no_model_assets',
  'trackb_media_oss_milestone3_ocr_ml_cpu_blocker_followup_passed_ready_for_model_asset_approval',
  'trackb_media_oss_milestone3_ocr_ml_cpu_blocker_followup_blocked_by_paddleocr_import_or_api_shape',
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
