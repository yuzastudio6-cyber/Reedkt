import { buildMapGeospatialToolEvidence, summarizeMapGeospatialToolSummary } from '../activation/map-geospatial-approval'

if (process.argv.includes('--json')) {
  console.log(JSON.stringify(buildMapGeospatialToolEvidence(), null, 2))
} else {
  console.log(summarizeMapGeospatialToolSummary())
}
