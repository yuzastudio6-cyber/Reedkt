import {
  TRACK_B_READINESS_ROLLUP_REPORT_DIR,
  writeTrackBReadinessRollupArtifacts,
} from '../activation/track-b-readiness-rollup'

await writeTrackBReadinessRollupArtifacts()

console.log(JSON.stringify({
  status: 'passed',
  reportDir: TRACK_B_READINESS_ROLLUP_REPORT_DIR,
  reportsWritten: true,
}, null, 2))
