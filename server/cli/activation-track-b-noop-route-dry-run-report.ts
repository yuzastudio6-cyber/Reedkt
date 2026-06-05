import {
  readTrackBNoopRouteDryRunSummary,
  writeTrackBNoopRouteDryRunArtifacts,
} from '../activation/track-b-noop-route-dry-run'

await writeTrackBNoopRouteDryRunArtifacts()

console.log(JSON.stringify(readTrackBNoopRouteDryRunSummary(), null, 2))
