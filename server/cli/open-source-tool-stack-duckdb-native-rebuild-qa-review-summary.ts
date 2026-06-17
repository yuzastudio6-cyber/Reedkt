import {
  buildOpenSourceToolStackDuckdbNativeRebuildQaReviewReports,
  readOpenSourceToolStackDuckdbNativeRebuildQaReviewArtifacts,
} from '../activation/open-source-tool-stack-duckdb-native-rebuild-qa-review'

const reports =
  readOpenSourceToolStackDuckdbNativeRebuildQaReviewArtifacts() ??
  buildOpenSourceToolStackDuckdbNativeRebuildQaReviewReports()

console.log(
  JSON.stringify(
    {
      decision: reports.decision.decision,
      readiness: reports.readinessReport.readiness,
      duckdbAccepted: reports.duckdbProofQa.accepted,
      polarsAccepted: reports.polarsStatusQa.accepted,
      ffmpegStatus: reports.ffmpegFfprobeMissingBinaryQa.ffmpegStatus,
      ffprobeStatus: reports.ffmpegFfprobeMissingBinaryQa.ffprobeStatus,
      nextPrompt: reports.decision.nextPrompt,
      supabaseClassification: reports.decision.supabaseClassification,
    },
    null,
    2,
  ),
)
