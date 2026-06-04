import {
  readTrackBToolRouteManifestSummary,
  writeTrackBToolRouteManifestArtifacts,
} from '../activation/track-b-tool-route-manifest'

await writeTrackBToolRouteManifestArtifacts()

console.log(JSON.stringify(readTrackBToolRouteManifestSummary(), null, 2))
