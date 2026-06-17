import {
  buildOpenSourceToolStackMissingOptionalPackageBinaryApprovalReports,
  readOpenSourceToolStackMissingOptionalPackageBinaryApprovalArtifacts,
  summarizeOpenSourceToolStackMissingOptionalPackageBinaryApproval,
} from '../activation/open-source-tool-stack-missing-optional-package-binary-approval'

console.log(
  summarizeOpenSourceToolStackMissingOptionalPackageBinaryApproval(
    readOpenSourceToolStackMissingOptionalPackageBinaryApprovalArtifacts() ??
      buildOpenSourceToolStackMissingOptionalPackageBinaryApprovalReports()
  )
)
