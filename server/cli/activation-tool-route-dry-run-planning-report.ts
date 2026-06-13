import { writeToolRouteDryRunReport } from '../activation/tool-route-dry-run-planning'

const bundle = await writeToolRouteDryRunReport()
console.log(JSON.stringify(bundle.report, null, 2))
