import {
  writeWorkerRuntimeJobsAuditReport,
} from '../activation/worker-runtime-jobs-audit'

const bundle = await writeWorkerRuntimeJobsAuditReport()
console.log(JSON.stringify(bundle.report, null, 2))
