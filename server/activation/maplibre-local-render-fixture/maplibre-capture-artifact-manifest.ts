import { mapLibreLocalRenderSafetyFlags } from './maplibre-local-render-policy'
import type {
  MapLibreLocalCaptureManifest,
  MapLibreLocalRenderArtifact,
  MapLibreLocalStyle,
  MapLibreRenderMetadata,
  NetworkRequestRecord,
} from './maplibre-local-render-types'

export function buildMapLibreLocalCaptureManifest(input: {
  runId: string
  style: MapLibreLocalStyle
  renderMetadata: MapLibreRenderMetadata
  networkRequestsObserved: NetworkRequestRecord[]
  externalNetworkRequestsObserved: NetworkRequestRecord[]
  artifacts: MapLibreLocalRenderArtifact[]
  warnings: string[]
  blockers: string[]
}): MapLibreLocalCaptureManifest {
  return {
    runId: input.runId,
    phase: '50C',
    fixtureMode: 'maplibre_local_offline_render_capture_fixture',
    generatedFixture: true,
    mapLibreVersion: input.renderMetadata.mapLibreVersion,
    playwrightVersion: input.renderMetadata.playwrightVersion,
    viewport: input.renderMetadata.viewport,
    styleSummary: {
      sourceCount: Object.keys(input.style.sources).length,
      layerCount: input.style.layers.length,
      noRemoteTileGlyphSpriteImageUrls: true,
      noPaidProviderUrls: true,
      noSymbolLayers: input.style.layers.every((layer) => String(layer.type) !== 'symbol'),
    },
    sourceSummary: {
      pointCount: input.renderMetadata.renderMetadata.pointCount,
      routeCount: input.renderMetadata.renderMetadata.routeCount,
      polygonCount: input.renderMetadata.renderMetadata.polygonCount,
      combinedFeatureCount: input.renderMetadata.renderMetadata.pointCount + input.renderMetadata.renderMetadata.routeCount + input.renderMetadata.renderMetadata.polygonCount,
    },
    networkRequestsObserved: input.networkRequestsObserved,
    externalNetworkRequestsObserved: input.externalNetworkRequestsObserved,
    screenshotArtifacts: input.artifacts.filter((artifact) => artifact.id === 'maplibre_local_render_screenshot'),
    optionalSharpArtifacts: input.artifacts.filter((artifact) => artifact.id.startsWith('maplibre_render_') && artifact.id !== 'maplibre_local_render_screenshot'),
    blockedFeatures: Object.entries(mapLibreLocalRenderSafetyFlags)
      .filter(([, value]) => value === false)
      .map(([key]) => key),
    warnings: Array.from(new Set(input.warnings)),
    blockers: Array.from(new Set(input.blockers)),
  }
}
