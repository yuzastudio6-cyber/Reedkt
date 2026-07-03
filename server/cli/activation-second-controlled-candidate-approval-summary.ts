import { buildSecondControlledCandidateApprovalReports } from '../activation/second-controlled-candidate-approval'

const reports = buildSecondControlledCandidateApprovalReports()
console.log(
  JSON.stringify(
    {
      decision: reports.decision.decision,
      readiness: reports.readinessReport.readiness,
      blockers: reports.blockerReport.blockers,
      selectedCandidate: reports.decision.selectedCandidate,
      approvedForFutureSecondControlledCandidateDryRun: reports.decision.approvedForFutureSecondControlledCandidateDryRun,
      supabaseClassification: reports.decision.supabaseClassification,
      nextPrompt: reports.decision.nextPrompt,
    },
    null,
    2
  )
)
