import {
  buildWorkerRuntimeDryRunApprovalReports,
  writeWorkerRuntimeDryRunApprovalArtifacts,
} from '../activation/worker-runtime-dry-run-approval'

const reports = buildWorkerRuntimeDryRunApprovalReports()
await writeWorkerRuntimeDryRunApprovalArtifacts(reports)
console.log(JSON.stringify(reports.readinessReport, null, 2))
