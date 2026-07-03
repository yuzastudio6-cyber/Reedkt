import { buildToolRouteMetadataDryRunReports } from '../activation/tool-route-metadata-dry-run'

const reports = buildToolRouteMetadataDryRunReports()
console.log(
  JSON.stringify(
    {
      decision: reports.decision.decision,
      readiness: reports.readinessReport.readiness,
      blockers: reports.blockerReport.blockers,
      supabaseClassification: reports.decision.supabaseClassification,
      nextPrompt: 'CONTROLLED_TOOL_EXECUTION - controlled tool execution approval packet after route metadata dry-run',
    },
    null,
    2
  )
)
