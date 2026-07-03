import { readTrackBMilestone1QaReviewArtifacts } from '../activation/trackb-media-oss-milestone-1-qa-review/index.js'

const reports = readTrackBMilestone1QaReviewArtifacts()

console.log(
  JSON.stringify(
    {
      decision: reports.decisionReport.decision,
      ownerId: reports.decisionReport.ownerId,
      acceptedProvenBoundedAfterQa: reports.statusUpdate.acceptedProvenBoundedTotalAfterQa,
      stillBlockedNotInstalledProven: reports.statusUpdate.stillBlockedNotInstalledProvenCount,
      endToEndProductReadyTools: reports.decisionReport.endToEndProductReadyTools,
      nextPrompt: reports.decisionReport.nextPrompt,
    },
    null,
    2,
  ),
)
