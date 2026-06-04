import { buildMapLibreLocalRenderReport, summarizeMapLibreLocalRenderReport } from '../activation/maplibre-local-render-fixture'

const report = buildMapLibreLocalRenderReport()

if (process.argv.includes('--json')) {
  console.log(JSON.stringify(report, null, 2))
} else {
  console.log(summarizeMapLibreLocalRenderReport(report))
}
