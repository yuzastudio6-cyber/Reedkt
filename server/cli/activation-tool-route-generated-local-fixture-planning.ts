import { executeToolRouteFixturePlanning } from '../activation/tool-route-generated-local-fixture-planning'

const execute = process.argv.includes('--execute')
const result = await executeToolRouteFixturePlanning({ execute })
console.log(JSON.stringify(result.summary, null, 2))
process.exit(result.exitCode)
