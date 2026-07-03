import { buildControlledToolExecutionApprovalReports } from '../activation/controlled-tool-execution-approval'

const reports = buildControlledToolExecutionApprovalReports()
console.log(
  JSON.stringify(
    {
      decision: reports.decision.decision,
      readiness: reports.readinessReport.readiness,
      blockers: reports.blockerReport.blockers,
      selectedFirstCandidate: reports.decision.selectedFirstCandidate,
      supabaseClassification: reports.decision.supabaseClassification,
      nextPrompt: 'CONTROLLED_TOOL_EXECUTION - first controlled tool execution dry-run',
    },
    null,
    2
  )
)
