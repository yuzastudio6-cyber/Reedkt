import {
  executeWorkerRuntimeJobsAudit,
} from '../activation/worker-runtime-jobs-audit'

const execute = process.argv.includes('--execute')
const result = await executeWorkerRuntimeJobsAudit({ execute })
console.log(JSON.stringify(result.summary, null, 2))
process.exit(result.exitCode)
