import { executeToolRouteDryRun } from '../activation/tool-route-dry-run-planning'

const execute = process.argv.includes('--execute')
const result = await executeToolRouteDryRun({ execute })
console.log(JSON.stringify(result.summary, null, 2))
process.exit(result.exitCode)
