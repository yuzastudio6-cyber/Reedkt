import {
  executeWorkerApprovedPlanDryRun,
} from '../activation/worker-approved-plan-dry-run'

const execute = process.argv.includes('--execute')
const result = await executeWorkerApprovedPlanDryRun({ execute })
console.log(JSON.stringify(result.summary, null, 2))
process.exit(result.exitCode)
