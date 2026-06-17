import {
  buildOpenSourceToolStackPackageBinaryExecutionReports,
  readOpenSourceToolStackPackageBinaryExecutionArtifacts,
  summarizeOpenSourceToolStackPackageBinaryExecution,
} from '../activation/open-source-missing-optional-package-binary-execution'

console.log(
  summarizeOpenSourceToolStackPackageBinaryExecution(
    readOpenSourceToolStackPackageBinaryExecutionArtifacts() ?? buildOpenSourceToolStackPackageBinaryExecutionReports()
  )
)
