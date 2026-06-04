import { buildMapGeospatialApprovalReport, summarizeMapGeospatialApprovalReport } from '../activation/map-geospatial-approval'

const report = buildMapGeospatialApprovalReport()

if (process.argv.includes('--json')) {
  console.log(JSON.stringify(report, null, 2))
} else {
  console.log(summarizeMapGeospatialApprovalReport(report))
}
