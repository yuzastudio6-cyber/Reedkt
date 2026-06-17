import {
  buildOpenSourceToolStackPackageBinaryExecutionReports,
  readOpenSourceToolStackPackageBinaryExecutionArtifacts,
} from '../activation/open-source-missing-optional-package-binary-execution'

const reports = readOpenSourceToolStackPackageBinaryExecutionArtifacts() ?? buildOpenSourceToolStackPackageBinaryExecutionReports()

console.log(
  JSON.stringify(
    {
      decision: reports.decision.decision,
      readiness: reports.readinessReport.readiness,
      packageInstallStatus: reports.packageInstallReport.installStatus,
      duckdbStatus: reports.duckdbProofReport.status,
      polarsStatus: reports.polarsProofReport.status,
      ffmpegStatus: reports.ffmpegVersionCheckReport.status,
      ffprobeStatus: reports.ffprobeVersionCheckReport.status,
      nextPrompt: reports.decision.nextPrompt,
      supabaseClassification: reports.decision.supabaseClassification,
    },
    null,
    2
  )
)
