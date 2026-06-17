import {
  buildOpenSourceToolStackMissingOptionalPackageBinaryApprovalReports,
  readOpenSourceToolStackMissingOptionalPackageBinaryApprovalArtifacts,
} from '../activation/open-source-tool-stack-missing-optional-package-binary-approval'

const reports =
  readOpenSourceToolStackMissingOptionalPackageBinaryApprovalArtifacts() ??
  buildOpenSourceToolStackMissingOptionalPackageBinaryApprovalReports()

console.log(
  JSON.stringify(
    {
      decision: reports.decision.decision,
      readiness: reports.readinessReport.readiness,
      packageCandidates: reports.decision.packageCandidates,
      systemBinaryCandidates: reports.decision.systemBinaryCandidates,
      nextPrompt: reports.decision.nextPrompt,
      blockers: reports.blockerReport.blockers,
    },
    null,
    2
  )
)
