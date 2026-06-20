import { readTrackBMilestone3OcrMlCpuExecutionArtifacts } from '../activation/trackb-media-oss-milestone-3-ocr-ml-cpu-execution/index.js'

const reports = readTrackBMilestone3OcrMlCpuExecutionArtifacts()
console.log(
  [
    `Decision: ${reports.decisionReport.decision}`,
    `Next prompt: ${reports.decisionReport.nextPrompt}`,
    `Docker build exit: ${reports.dockerBuildReport.exitCode ?? 'not_run'}`,
    `PaddlePaddle import/version proven: ${reports.paddlePaddleReport.importVersionProven}`,
    `PaddlePaddle tensor/device proven: ${reports.paddlePaddleReport.tensorDeviceProven}`,
    `PaddleOCR import/API proven: ${reports.paddleOcrReport.importApiProven}`,
    `OCR inference run: ${reports.boundaryReport.ocrInferenceRun}`,
    `Cleanup passed: ${reports.cleanupReport.generatedOutputsCleaned}`,
    `Safety passed: ${reports.safetyReport.passed}`,
  ].join('\n'),
)
