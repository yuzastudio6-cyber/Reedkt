import {
  buildOpenSourceToolStackBatch1QaReviewReports,
  readOpenSourceToolStackBatch1QaReviewArtifacts,
  summarizeOpenSourceToolStackBatch1QaReview,
} from '../activation/open-source-tool-stack-batch-1-qa-review'

console.log(summarizeOpenSourceToolStackBatch1QaReview(readOpenSourceToolStackBatch1QaReviewArtifacts() ?? buildOpenSourceToolStackBatch1QaReviewReports()))
