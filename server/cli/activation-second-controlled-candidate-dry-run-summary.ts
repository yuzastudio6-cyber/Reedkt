import { buildSecondControlledCandidateDryRunReports } from '../activation/second-controlled-candidate-dry-run'

const reports = buildSecondControlledCandidateDryRunReports()
console.log(
  JSON.stringify(
    {
      decision: reports.decision.decision,
      readiness: reports.readinessReport.readiness,
      blockers: reports.blockerReport.blockers,
      selectedCandidate: reports.decision.selectedCandidate,
      secondCandidateExecuted: reports.decision.secondCandidateExecuted,
      supabaseClassification: reports.decision.supabaseClassification,
      nextPrompt: reports.decision.nextPrompt,
    },
    null,
    2
  )
)
