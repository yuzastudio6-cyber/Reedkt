import {
  buildOpenSourceToolStackBatch1ExecutionReports,
  readOpenSourceToolStackBatch1ExecutionArtifacts,
} from '../activation/open-source-tool-stack-batch-1-execution'

const reports = readOpenSourceToolStackBatch1ExecutionArtifacts() ?? buildOpenSourceToolStackBatch1ExecutionReports()

console.log(
  JSON.stringify(
    {
      decision: reports.decision.decision,
      readiness: reports.readinessReport.readiness,
      readyWithMissingOptional: reports.readinessReport.readyWithMissingOptional,
      blockers: reports.blockerReport.blockers,
      missingOptionalTargets: reports.decision.missingOptionalTargets,
      nextPrompt: reports.decision.nextPrompt,
      supabaseClassification: reports.decision.supabaseClassification,
    },
    null,
    2
  )
)
