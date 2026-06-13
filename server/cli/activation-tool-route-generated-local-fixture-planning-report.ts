import { writeToolRouteFixturePlanningReport } from '../activation/tool-route-generated-local-fixture-planning'

const bundle = await writeToolRouteFixturePlanningReport()
console.log(JSON.stringify(bundle.report, null, 2))
