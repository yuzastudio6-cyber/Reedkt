import { readBatch1FinalRollupArtifacts } from '../activation/open-source-tool-stack-batch-1-final-rollup-after-ffmpeg-ffprobe-proof'

const reports = readBatch1FinalRollupArtifacts()

console.log(
  JSON.stringify(
    {
      decision: reports.decision.decision,
      readiness: reports.readinessReport.readiness,
      acceptedToolsMatrixAccepted: reports.acceptedToolsMatrix.accepted,
      stillBlockedScopeMatrixAccepted: reports.stillBlockedScopeMatrix.accepted,
      primaryNextPrompt: reports.decision.primaryNextPrompt,
      secondaryNextPrompt: reports.decision.secondaryNextPrompt,
      supabaseClassification: reports.decision.supabaseClassification,
    },
    null,
    2,
  ),
)
