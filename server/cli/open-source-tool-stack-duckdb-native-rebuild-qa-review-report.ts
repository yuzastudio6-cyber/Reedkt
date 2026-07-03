import {
  buildOpenSourceToolStackDuckdbNativeRebuildQaReviewReports,
  readOpenSourceToolStackDuckdbNativeRebuildQaReviewArtifacts,
  summarizeOpenSourceToolStackDuckdbNativeRebuildQaReview,
} from '../activation/open-source-tool-stack-duckdb-native-rebuild-qa-review'

console.log(
  summarizeOpenSourceToolStackDuckdbNativeRebuildQaReview(
    readOpenSourceToolStackDuckdbNativeRebuildQaReviewArtifacts() ??
      buildOpenSourceToolStackDuckdbNativeRebuildQaReviewReports(),
  ),
)
