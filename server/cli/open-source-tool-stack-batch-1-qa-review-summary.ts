import {
  buildOpenSourceToolStackBatch1QaReviewReports,
  readOpenSourceToolStackBatch1QaReviewArtifacts,
} from '../activation/open-source-tool-stack-batch-1-qa-review'

const reports = readOpenSourceToolStackBatch1QaReviewArtifacts() ?? buildOpenSourceToolStackBatch1QaReviewReports()
console.log(
  JSON.stringify(
    {
      decision: reports.decision.decision,
      readiness: reports.readinessReport.readiness,
      acceptedWithWarnings: reports.decision.acceptedWithWarnings,
      missingOptionalInstallReviewRequired: reports.missingOptionalToolImpactReview.installReviewRequiredBeforeCountingMissingTools,
      nextPrompt: reports.decision.nextPrompt,
      blockers: reports.blockerReport.blockers,
    },
    null,
    2
  )
)
