import {
  buildWorkerRuntimeNoopDryRunExecutionReports,
  writeWorkerRuntimeNoopDryRunExecutionArtifacts,
} from '../activation/worker-runtime-noop-dry-run-execution'

const reports = buildWorkerRuntimeNoopDryRunExecutionReports()
await writeWorkerRuntimeNoopDryRunExecutionArtifacts(reports)
console.log(JSON.stringify(reports.readinessReport, null, 2))
