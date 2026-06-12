import {
  buildWorkerRuntimeRepoAuditReports,
  writeWorkerRuntimeRepoAuditArtifacts,
} from '../activation/worker-runtime-repo-audit'

const reports = buildWorkerRuntimeRepoAuditReports()
await writeWorkerRuntimeRepoAuditArtifacts(reports)
console.log(JSON.stringify(reports.readinessReport, null, 2))
