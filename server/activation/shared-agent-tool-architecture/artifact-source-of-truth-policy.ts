import type { SourceOfTruthPolicy } from './shared-agent-tool-architecture-types'

export const artifactSourceOfTruthPolicy: SourceOfTruthPolicy = {
  policyId: 'phase52a-artifact-source-of-truth-policy',
  signedUrlsSourceOfTruthAllowed: false,
  publicArtifactsAllowed: false,
  domains: [
    {
      domain: 'video',
      sourceOfTruth: ['source media', 'timeline', 'approved plan snapshot', 'render manifest'],
      reviewArtifactsOnly: ['preview screenshots', 'review thumbnails'],
      rules: ['Preview screenshots are not editable source of truth.'],
    },
    {
      domain: 'map_geospatial',
      sourceOfTruth: ['planning source records', 'location candidates', 'GeoJSON', 'Turf calculations', 'map style manifest', 'camera manifest', 'timing manifest', 'render manifest'],
      reviewArtifactsOnly: ['preview screenshots', 'map review thumbnails'],
      rules: ['Final map/video overlays must be regenerated from manifests, not edited from screenshots.'],
    },
    {
      domain: 'web_search',
      sourceOfTruth: ['source manifest', 'capture manifest', 'extraction manifest'],
      reviewArtifactsOnly: ['rendered page screenshots', 'summary previews'],
      rules: ['Raw provider response storage follows provider storage policy.', 'Brave raw/snippet storage is blocked by default.'],
    },
    {
      domain: 'graphics',
      sourceOfTruth: ['graphic intent', 'design spec', 'vector/SVG/Lottie/Remotion source', 'render manifest'],
      reviewArtifactsOnly: ['preview raster', 'thumbnail'],
      rules: ['Preview rasters are review artifacts only.'],
    },
    {
      domain: 'audio',
      sourceOfTruth: ['approved source audio', 'processing plan', 'model/tool manifest', 'output manifest'],
      reviewArtifactsOnly: ['waveform previews', 'spectrogram previews'],
      rules: ['Waveform and spectrogram previews are review artifacts only.'],
    },
    {
      domain: 'supabase',
      sourceOfTruth: ['activation milestone registry rows', 'private gs:// artifact references', 'readiness snapshots', 'tool capability rows', 'feature gate rows'],
      reviewArtifactsOnly: ['sanitized report excerpts', 'PR summaries'],
      rules: ['Supabase stores structured metadata and private artifact references only.', 'GCS remains the private artifact store for blobs and reports.', 'Secret values, raw provider payloads, and signed URLs are never source of truth.'],
    },
  ],
}
