import { readTrackBMilestone3OcrMlCpuQaReviewArtifacts } from '../activation/trackb-media-oss-milestone-3-ocr-ml-cpu-qa-review/index.js'

const reports = readTrackBMilestone3OcrMlCpuQaReviewArtifacts()
console.log(
  [
    `Decision: ${reports.decisionReport.decision}`,
    `Accepted/proven bounded total: ${reports.statusUpdate.acceptedProvenBoundedTotalAfterQa}`,
    `Still blocked/not installed-proven: ${reports.statusUpdate.stillBlockedNotInstalledProvenCount}`,
    `End-to-end product-ready tools: ${reports.decisionReport.endToEndProductReadyTools}`,
    `Next prompt: ${reports.readinessReport.nextPrompt}`,
  ].join('\n'),
)
