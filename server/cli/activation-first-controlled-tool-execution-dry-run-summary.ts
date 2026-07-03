import { buildFirstControlledToolExecutionReports } from '../activation/first-controlled-tool-execution-dry-run'

const reports = buildFirstControlledToolExecutionReports()
console.log(
  JSON.stringify(
    {
      decision: reports.decision.decision,
      readiness: reports.readinessReport.readiness,
      blockers: reports.blockerReport.blockers,
      selectedCandidate: reports.decision.selectedCandidate,
      supabaseClassification: reports.decision.supabaseClassification,
      nextPrompt: 'NEXT_CONTROLLED_CANDIDATE_OR_WORKER_HANDOFF_REVIEW',
    },
    null,
    2
  )
)
