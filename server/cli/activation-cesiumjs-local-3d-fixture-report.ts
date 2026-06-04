import { buildCesiumJsLocal3DReport, summarizeCesiumJsLocal3DReport } from '../activation/cesiumjs-local-3d-fixture'

const report = buildCesiumJsLocal3DReport()

if (process.argv.includes('--json')) {
  console.log(JSON.stringify(report, null, 2))
} else {
  console.log(summarizeCesiumJsLocal3DReport(report))
}
