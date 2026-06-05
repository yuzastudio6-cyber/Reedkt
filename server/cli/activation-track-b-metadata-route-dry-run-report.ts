import {
  TRACK_B_METADATA_ROUTE_DRY_RUN_REPORT_DIR,
  writeTrackBMetadataRouteDryRunArtifacts,
} from '../activation/track-b-metadata-route-dry-run'

await writeTrackBMetadataRouteDryRunArtifacts()

console.log(JSON.stringify({
  status: 'passed',
  reportDir: TRACK_B_METADATA_ROUTE_DRY_RUN_REPORT_DIR,
  reportsWritten: true,
}, null, 2))
