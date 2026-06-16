import {
  buildOpenSourceToolStackMissingOptionalInstallReviewReports,
  readOpenSourceToolStackMissingOptionalInstallReviewArtifacts,
} from '../activation/open-source-tool-stack-missing-optional-install-review'

const reports =
  readOpenSourceToolStackMissingOptionalInstallReviewArtifacts() ??
  buildOpenSourceToolStackMissingOptionalInstallReviewReports()

console.log(
  JSON.stringify(
    {
      decision: reports.decision.decision,
      readiness: reports.readinessReport.readiness,
      packageCandidates: reports.decision.packageCandidates,
      systemBinaryCandidates: reports.decision.systemBinaryCandidates,
      nextPrompt: reports.decision.nextPrompt,
      blockers: reports.blockerReport.blockers,
    },
    null,
    2
  )
)
