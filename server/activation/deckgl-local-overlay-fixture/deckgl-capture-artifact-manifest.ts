import type { DeckGlLocalOverlayArtifact, DeckGlLocalOverlayCaptureManifest, DeckGlRenderMetadata } from './deckgl-local-overlay-types'
import type { MapLibreLocalStyle, NetworkRequestRecord } from '../maplibre-local-render-fixture'

export function buildDeckGlLocalOverlayCaptureManifest(input: {
  runId: string
  style: MapLibreLocalStyle
  renderMetadata: DeckGlRenderMetadata
  networkRequestsObserved: NetworkRequestRecord[]
  externalNetworkRequestsObserved: NetworkRequestRecord[]
  artifacts: DeckGlLocalOverlayArtifact[]
  warnings: string[]
  blockers: string[]
}): DeckGlLocalOverlayCaptureManifest {
  return {
    runId: input.runId,
    phase: '50D',
    fixtureMode: 'deckgl_local_offline_overlay_fixture',
    generatedFixture: true,
    mapLibreVersion: input.renderMetadata.mapLibreVersion,
    deckGlVersion: input.renderMetadata.deckGlVersion,
    playwrightVersion: input.renderMetadata.playwrightVersion,
    viewport: input.renderMetadata.viewport,
    styleSummary: {
      sourceCount: Object.keys(input.style.sources).length,
      layerCount: input.style.layers.length,
      noRemoteTileGlyphSpriteImageUrls: true,
      noPaidProviderUrls: true,
      noSymbolLayers: true,
    },
    overlaySummary: {
      pointCount: input.renderMetadata.renderMetadata.pointCount,
      pathCount: input.renderMetadata.renderMetadata.pathCount,
      polygonCount: input.renderMetadata.renderMetadata.polygonCount,
      arcCount: input.renderMetadata.renderMetadata.arcCount,
      deckGlLayerCount: input.renderMetadata.renderMetadata.deckGlLayerCount,
      heatmapLayerDeferred: true,
    },
    networkRequestsObserved: input.networkRequestsObserved,
    externalNetworkRequestsObserved: input.externalNetworkRequestsObserved,
    screenshotArtifacts: input.artifacts.filter((artifact) => artifact.id === 'deckgl_local_overlay_screenshot'),
    optionalSharpArtifacts: input.artifacts.filter((artifact) => artifact.id.includes('deckgl_overlay_preview') || artifact.id.includes('deckgl_overlay_thumbnail') || artifact.id.includes('deckgl_overlay_image_metadata')),
    blockedFeatures: [
      'live tiles',
      'public OSM tiles',
      'remote glyph/sprite/image URLs',
      'Mapbox provider',
      'Google Maps provider',
      'Cesium ion',
      'geocoding/routing APIs',
      'paid map providers',
      'CesiumJS runtime',
      'D3 runtime',
      'Three.js runtime',
      'public artifacts',
      'signed URLs as source of truth',
      'production',
      'external beta',
      'broad media',
    ],
    warnings: input.warnings,
    blockers: input.blockers,
  }
}
