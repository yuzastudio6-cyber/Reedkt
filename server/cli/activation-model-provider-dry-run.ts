import { executeModelProviderDryRun } from '../activation/model-orchestration-provider-dry-run'

const execute = process.argv.includes('--execute')
const result = await executeModelProviderDryRun({ execute })

console.log(JSON.stringify(result.reports.readinessReport, null, 2))
process.exitCode = result.exitCode
