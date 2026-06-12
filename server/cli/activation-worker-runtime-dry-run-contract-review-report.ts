import {
  buildWorkerRuntimeDryRunContractReviewReports,
  writeWorkerRuntimeDryRunContractReviewArtifacts,
} from '../activation/worker-runtime-dry-run-contract-review'

const reports = buildWorkerRuntimeDryRunContractReviewReports()
await writeWorkerRuntimeDryRunContractReviewArtifacts(reports)
console.log(JSON.stringify(reports.decision, null, 2))
