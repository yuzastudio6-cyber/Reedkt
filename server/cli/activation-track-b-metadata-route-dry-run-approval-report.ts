import {
  readTrackBMetadataRouteDryRunApprovalSummary,
  writeTrackBMetadataRouteDryRunApprovalArtifacts,
} from '../activation/track-b-metadata-route-dry-run-approval'

await writeTrackBMetadataRouteDryRunApprovalArtifacts()

console.log(JSON.stringify(readTrackBMetadataRouteDryRunApprovalSummary(), null, 2))
