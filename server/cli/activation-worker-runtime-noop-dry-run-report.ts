import {
  buildWorkerRuntimeNoopDryRunReports,
  writeWorkerRuntimeNoopDryRunArtifacts,
} from '../activation/worker-runtime-noop-dry-run'

const reports = buildWorkerRuntimeNoopDryRunReports()
await writeWorkerRuntimeNoopDryRunArtifacts(reports)
console.log(JSON.stringify(reports.readinessReport, null, 2))
