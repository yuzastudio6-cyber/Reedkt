import { writeToolRouteAuditReport } from '../activation/tool-route-execution-unlock-audit'

const bundle = await writeToolRouteAuditReport()
console.log(JSON.stringify(bundle.report, null, 2))
