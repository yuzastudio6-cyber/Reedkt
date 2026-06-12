import { readWorkerRuntimeRepoAuditSummary } from '../activation/worker-runtime-repo-audit'

console.log(JSON.stringify(readWorkerRuntimeRepoAuditSummary(), null, 2))
