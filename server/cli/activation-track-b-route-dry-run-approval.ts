import {
  readTrackBRouteDryRunApprovalSummary,
  writeTrackBRouteDryRunApprovalArtifacts,
} from '../activation/track-b-route-dry-run-approval'

await writeTrackBRouteDryRunApprovalArtifacts()

console.log(JSON.stringify(readTrackBRouteDryRunApprovalSummary(), null, 2))
