import {
  buildOpenSourceToolStackMissingOptionalInstallReviewReports,
  readOpenSourceToolStackMissingOptionalInstallReviewArtifacts,
  summarizeOpenSourceToolStackMissingOptionalInstallReview,
} from '../activation/open-source-tool-stack-missing-optional-install-review'

console.log(
  summarizeOpenSourceToolStackMissingOptionalInstallReview(
    readOpenSourceToolStackMissingOptionalInstallReviewArtifacts() ??
      buildOpenSourceToolStackMissingOptionalInstallReviewReports()
  )
)
