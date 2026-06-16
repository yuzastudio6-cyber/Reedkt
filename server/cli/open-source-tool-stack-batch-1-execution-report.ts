import {
  buildOpenSourceToolStackBatch1ExecutionReports,
  readOpenSourceToolStackBatch1ExecutionArtifacts,
  summarizeOpenSourceToolStackBatch1Execution,
} from '../activation/open-source-tool-stack-batch-1-execution'

console.log(summarizeOpenSourceToolStackBatch1Execution(readOpenSourceToolStackBatch1ExecutionArtifacts() ?? buildOpenSourceToolStackBatch1ExecutionReports()))
