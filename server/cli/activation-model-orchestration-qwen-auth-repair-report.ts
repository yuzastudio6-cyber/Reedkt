import {
  buildModelOrchestrationQwenAuthRepairReports,
  writeModelOrchestrationQwenAuthRepairArtifacts,
} from '../activation/model-orchestration-qwen-auth-repair'

const reports = buildModelOrchestrationQwenAuthRepairReports()
await writeModelOrchestrationQwenAuthRepairArtifacts(reports)
console.log(JSON.stringify(reports.readinessReport, null, 2))
