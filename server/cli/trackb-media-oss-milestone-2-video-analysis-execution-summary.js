import { readTrackBMilestone2VideoAnalysisExecutionArtifacts } from '../activation/trackb-media-oss-milestone-2-video-analysis-execution/index.js'

const reports = readTrackBMilestone2VideoAnalysisExecutionArtifacts()
console.log(
  [
    `Decision: ${reports.decisionReport.decision}`,
    `Next prompt: ${reports.decisionReport.nextPrompt}`,
    `Docker build exit: ${reports.dockerBuildReport.exitCode ?? 'not_run'}`,
    `OpenCV version proven: ${reports.statusMatrix.tools.find((tool) => tool.id === 'opencv')?.containerImportVersionProven}`,
    `PyAV version proven: ${reports.statusMatrix.tools.find((tool) => tool.id === 'pyav')?.containerImportVersionProven}`,
    `PySceneDetect version proven: ${reports.statusMatrix.tools.find((tool) => tool.id === 'pyscenedetect')?.containerImportVersionProven}`,
    `Cleanup passed: ${reports.cleanupReport.generatedOutputsCleaned}`,
    `Safety passed: ${reports.safetyReport.passed}`,
  ].join('\n'),
)
