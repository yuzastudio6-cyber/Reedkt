import { readTrackBMilestone1BuildContextFollowupArtifacts } from '../activation/trackb-media-oss-milestone-1-build-context-blocker-followup/index.js'

const reports = readTrackBMilestone1BuildContextFollowupArtifacts()

console.log(
  JSON.stringify(
    {
      decision: reports.decisionReport.decision,
      nextPrompt: reports.decisionReport.nextPrompt,
      imageTag: reports.decisionReport.imageTag,
      buildContextOutputs: reports.decisionReport.buildContextOutputs,
      dockerBuildExitCode: reports.dockerBuildReport.exitCode,
      tools: reports.statusMatrix.tools,
      supabaseClassification: reports.decisionReport.supabaseClassification,
    },
    null,
    2,
  ),
)
