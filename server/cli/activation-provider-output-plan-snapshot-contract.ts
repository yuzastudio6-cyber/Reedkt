import {
  executeProviderOutputPlanSnapshotContract,
} from '../activation/provider-output-plan-snapshot-contract'

const execute = process.argv.includes('--execute')
const result = await executeProviderOutputPlanSnapshotContract({ execute })
console.log(JSON.stringify(result.summary, null, 2))
process.exit(result.exitCode)
