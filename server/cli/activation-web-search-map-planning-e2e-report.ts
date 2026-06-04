import { buildWebSearchMapPlanningReport, summarizeWebSearchMapPlanningReport } from '../activation/web-search-map-planning-e2e'

const report = buildWebSearchMapPlanningReport()

if (process.argv.includes('--json')) {
  console.log(JSON.stringify(report, null, 2))
} else {
  console.log(summarizeWebSearchMapPlanningReport(report))
}
