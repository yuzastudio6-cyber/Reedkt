import {
  readTrackBCapabilityManifestSummary,
  writeTrackBCapabilityManifestArtifacts,
} from '../activation/track-b-capability-manifests'

await writeTrackBCapabilityManifestArtifacts()

console.log(JSON.stringify(readTrackBCapabilityManifestSummary(), null, 2))
