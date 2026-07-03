import { readOwnerLaneReconciliationArtifacts } from '../activation/open-source-tool-stack-owner-lane-reconciliation-after-batch-1-rollup'

const reports = readOwnerLaneReconciliationArtifacts()
const matrixRows = Array.isArray(reports.ownerLaneStatusMatrix.details.rows)
  ? reports.ownerLaneStatusMatrix.details.rows
  : []

console.log(
  JSON.stringify(
    {
      decision: reports.decision.decision,
      readiness: reports.readinessReport.readiness,
      ownerLaneRows: matrixRows.length,
      inventoryCandidateCount: reports.reconciledToolCountSummary.details.inventoryCandidateCount,
      aiGraphicsAcceptedWithWarningsCount:
        reports.reconciledToolCountSummary.details.aiGraphicsAcceptedWithWarningsCount,
      endToEndProductReadyTools: reports.reconciledToolCountSummary.details.endToEndProductReadyTools,
      primaryNextPrompt: reports.decision.primaryNextPrompt,
      supabaseClassification: reports.decision.supabaseClassification,
    },
    null,
    2,
  ),
)
