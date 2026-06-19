import { readTrackBMilestone1Artifacts } from '../activation/trackb-media-oss-milestone-1-low-risk-metadata-tooling-execution/index.js'

const reports = readTrackBMilestone1Artifacts()

console.log(
  JSON.stringify(
    {
      decision: reports.decisionReport.decision,
      readiness: reports.readinessReport.readiness,
      acceptedProvenMilestone1Tools: reports.decisionReport.acceptedProvenMilestone1Tools,
      blockedMilestone1Tools: reports.decisionReport.blockedMilestone1Tools,
      nextPrompt: reports.decisionReport.nextPrompt,
      supabaseClassification: reports.decisionReport.supabaseClassification,
    },
    null,
    2,
  ),
)
