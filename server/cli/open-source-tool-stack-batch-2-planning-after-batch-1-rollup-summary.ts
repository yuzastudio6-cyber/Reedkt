import { readBatch2PlanningArtifacts } from '../activation/open-source-tool-stack-batch-2-planning-after-batch-1-rollup'

const reports = readBatch2PlanningArtifacts()

console.log(
  JSON.stringify(
    {
      decision: reports.decision.decision,
      readiness: reports.readinessReport.readiness,
      candidateCount: reports.batch2CandidateInventory.details.candidateCount,
      countsByRecommendedStatus: reports.batch2CandidateInventory.details.countsByRecommendedStatus,
      primaryNextPrompt: reports.decision.primaryNextPrompt,
      supabaseClassification: reports.decision.supabaseClassification,
    },
    null,
    2,
  ),
)
