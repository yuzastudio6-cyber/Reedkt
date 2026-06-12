import {
  readWorkerRuntimeJobsAuditSummary,
} from '../activation/worker-runtime-jobs-audit'

console.log(JSON.stringify(readWorkerRuntimeJobsAuditSummary(), null, 2))
