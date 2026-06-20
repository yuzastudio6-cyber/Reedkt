import { readTrackBMilestone3OcrMlCpuGpuReviewArtifacts } from '../activation/trackb-media-oss-milestone-3-ocr-ml-cpu-gpu-review/index.js'

const reports = readTrackBMilestone3OcrMlCpuGpuReviewArtifacts()
console.log(
  [
    `Decision: ${reports.decisionReport.decision}`,
    `Future CPU target: ${reports.workerTarget.selectedFutureCpuTarget}`,
    `Review tools: ${reports.decisionReport.reviewTools.join(', ')}`,
    `Accepted/proven bounded total: ${reports.decisionReport.counts.acceptedProvenBounded}`,
    `Still blocked/not installed-proven: ${reports.decisionReport.counts.blockedNotInstalledProven}`,
    `End-to-end product-ready tools: ${reports.decisionReport.counts.endToEndProductReady}`,
    `Next prompt: ${reports.decisionReport.nextPrompt}`,
  ].join('\n'),
)
