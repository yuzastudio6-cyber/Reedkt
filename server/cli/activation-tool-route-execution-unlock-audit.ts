import { executeToolRouteAudit } from '../activation/tool-route-execution-unlock-audit'

const execute = process.argv.includes('--execute')
const result = await executeToolRouteAudit({ execute })
console.log(JSON.stringify(result.summary, null, 2))
process.exit(result.exitCode)
