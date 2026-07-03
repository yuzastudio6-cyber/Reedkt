import { buildToolRouteDryRunApprovalReports } from '../activation/tool-route-dry-run-approval'

const reports = buildToolRouteDryRunApprovalReports()
console.log(
  JSON.stringify(
    {
      decision: reports.decision.decision,
      readiness: reports.readinessReport.readiness,
      blockers: reports.blockerReport.blockers,
      supabaseClassification: reports.decision.supabaseClassification,
      nextPrompt: 'TOOL_ROUTE_EXECUTION - tool-route metadata dry-run execution',
    },
    null,
    2
  )
)
