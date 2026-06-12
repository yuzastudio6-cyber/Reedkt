import {
  buildModelOrchestrationAuditReports,
  writeModelOrchestrationAuditArtifacts,
} from '../activation/model-orchestration-qwen-deepseek-audit'

const reports = buildModelOrchestrationAuditReports()
await writeModelOrchestrationAuditArtifacts(reports)
console.log(JSON.stringify(reports.readinessReport, null, 2))
