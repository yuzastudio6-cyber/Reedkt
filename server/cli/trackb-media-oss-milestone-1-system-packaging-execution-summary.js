import { readTrackBMilestone1SystemPackagingExecutionArtifacts } from '../activation/trackb-media-oss-milestone-1-system-packaging-execution/index.js'

const reports = readTrackBMilestone1SystemPackagingExecutionArtifacts()

console.log(
  JSON.stringify(
    {
      decision: reports.decisionReport.decision,
      nextPrompt: reports.decisionReport.nextPrompt,
      targetDockerfile: reports.decisionReport.targetDockerfile,
      imageTag: reports.decisionReport.imageTag,
      dockerBuildExitCode: reports.dockerBuildReport.exitCode,
      tools: reports.statusMatrix.tools,
      supabaseClassification: reports.decisionReport.supabaseClassification,
    },
    null,
    2,
  ),
)
