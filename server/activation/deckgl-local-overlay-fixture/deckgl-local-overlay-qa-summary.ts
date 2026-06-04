import type { GeneratedGeoJsonFixture } from '../maplibre-turf-fixture'
import type { MapLibreLocalStyle, MapLibreLocalStyleValidation, NetworkRequestRecord } from '../maplibre-local-render-fixture'
import type {
  DeckGlLayerManifest,
  DeckGlLocalOverlayArtifact,
  DeckGlLocalOverlayCaptureManifest,
  DeckGlLocalOverlayQaGate,
  DeckGlLocalOverlayQaSummary,
  DeckGlOverlayData,
  DeckGlRenderMetadata,
  SharpDeckGlScreenshotProcessing,
} from './deckgl-local-overlay-types'

export function buildDeckGlLocalOverlayQaSummary(input: {
  phase50cEvidencePresent: boolean
  fixture?: GeneratedGeoJsonFixture
  style?: MapLibreLocalStyle
  styleValidation?: MapLibreLocalStyleValidation
  overlayData?: DeckGlOverlayData
  layerManifest?: DeckGlLayerManifest
  renderMetadata?: DeckGlRenderMetadata
  networkRequestsObserved?: NetworkRequestRecord[]
  externalNetworkRequestsObserved?: NetworkRequestRecord[]
  sharpProcessing?: SharpDeckGlScreenshotProcessing
  captureManifest?: DeckGlLocalOverlayCaptureManifest
  artifacts?: DeckGlLocalOverlayArtifact[]
  preflightBlockers?: string[]
  publicAccessBlocked?: boolean
}): DeckGlLocalOverlayQaSummary {
  const fixture = input.fixture
  const style = input.style
  const styleValidation = input.styleValidation
  const overlayData = input.overlayData
  const layerManifest = input.layerManifest
  const renderMetadata = input.renderMetadata
  const externalNetworkRequestsObserved = input.externalNetworkRequestsObserved ?? []
  const artifacts = input.artifacts ?? []
  const preflightBlockers = input.preflightBlockers ?? []
  const generatedOverlayDataIntegrity = !!fixture
    && !!overlayData
    && fixture.generatedFixture
    && fixture.userLocationUsed === false
    && fixture.realWorldVerified === false
    && overlayData.generatedFixture
    && overlayData.realWorldVerified === false
    && overlayData.routingUsed === false
    && overlayData.captureAllowed === false
    && overlayData.points.length >= 5
    && overlayData.points.length <= 8
    && overlayData.paths.length >= 1
    && overlayData.polygons.length >= 1
    && overlayData.arcs.length >= 1
    && overlayData.arcs.length <= 4
  const localStyleIntegrity = !!style
    && !!styleValidation
    && styleValidation.blockers.length === 0
    && styleValidation.noRemoteTileGlyphSpriteImageUrls
    && styleValidation.noPaidProviderUrls
    && styleValidation.noSymbolLayers
  const deckGlOverlayRender = !!renderMetadata
    && !!layerManifest
    && renderMetadata.readyMarkerObserved
    && renderMetadata.renderMetadata.deckGlLayerCount === layerManifest.layers.length
    && renderMetadata.renderMetadata.deckGlLayerCount === 4
    && renderMetadata.renderMetadata.mapboxOverlayAttached
    && layerManifest.validation.blockers.length === 0
  const mapLibreBaseRender = !!renderMetadata
    && renderMetadata.renderMetadata.mapLibreSourceCount === 3
    && renderMetadata.renderMetadata.mapLibreLayerCount >= 5
    && renderMetadata.renderMetadata.labelsRenderedAsHtmlOverlay
  const networkGuard = externalNetworkRequestsObserved.length === 0
  const playwrightCapture = !!renderMetadata
    && renderMetadata.screenshotDimensions.width === 1280
    && renderMetadata.screenshotDimensions.height === 720
  const optionalScreenshotProcessing = !!input.sharpProcessing
    && input.sharpProcessing.preview.width > 0
    && input.sharpProcessing.thumbnail.width > 0
    && input.sharpProcessing.remoteImagesFetched === false
  const artifactPrivacy = artifacts.length === 0
    ? true
    : artifacts.every((artifact) => artifact.gcsUri.startsWith('gs://reeditpro-staging-reeditpro-') && artifact.kind.startsWith('private_') && !artifact.gcsUri.includes('http'))
      && input.publicAccessBlocked !== false
  const blockedFeatures = preflightBlockers.length === 0
    && networkGuard
    && localStyleIntegrity
    && deckGlOverlayRender

  const gates: DeckGlLocalOverlayQaGate[] = [
    gate('phase50c_evidence', input.phase50cEvidencePresent, 'Phase 50C canonical local/offline MapLibre render evidence is present.'),
    gate('generated_overlay_data_integrity', generatedOverlayDataIntegrity, 'Generated deck.gl overlay data is bounded, synthetic, and does not use user location, live routing, or real-world verification.'),
    gate('local_style_integrity', localStyleIntegrity, 'MapLibre local style uses local GeoJSON sources only and no remote glyph/sprite/tile/image/provider URLs.'),
    gate('deckgl_overlay_render', deckGlOverlayRender, 'deck.gl rendered local Scatterplot, Path, Polygon, and Arc layers through MapboxOverlay.'),
    gate('maplibre_base_render', mapLibreBaseRender, 'The MapLibre base render remained local/offline with source/layer metadata.'),
    gate('network_guard', networkGuard, 'Network guard observed no external requests, tiles, public OSM, Mapbox, Google, Cesium ion, geocoding, or routing calls.'),
    gate('playwright_capture', playwrightCapture, 'Playwright captured a 1280x720 screenshot from the local fixture only.'),
    gate('optional_screenshot_processing', optionalScreenshotProcessing, 'Sharp preview, thumbnail, and image metadata were created from the Phase 50D screenshot.'),
    gate('artifact_privacy', artifactPrivacy, 'Artifacts are private GCS objects with no public or signed URL source of truth.'),
    gate('blocked_features', blockedFeatures, 'Live tiles, geocoding, routing, paid providers, CesiumJS, D3, Three.js, production, beta, and broad media remain blocked.'),
  ]
  const blockers = [
    ...preflightBlockers,
    ...(input.phase50cEvidencePresent ? [] : ['Phase 50C canonical evidence is not present.']),
    ...(generatedOverlayDataIntegrity ? [] : ['Generated deck.gl overlay data integrity failed.']),
    ...(localStyleIntegrity ? [] : ['Local MapLibre style integrity failed.']),
    ...(deckGlOverlayRender ? [] : ['deck.gl local overlay render QA failed.']),
    ...(mapLibreBaseRender ? [] : ['MapLibre base render QA failed.']),
    ...(networkGuard ? [] : ['Network guard observed forbidden external or tile/provider requests.']),
    ...(playwrightCapture ? [] : ['Playwright capture QA failed.']),
    ...(optionalScreenshotProcessing ? [] : ['Optional Sharp screenshot processing QA failed.']),
    ...(artifactPrivacy ? [] : ['Artifact privacy QA failed.']),
    ...(blockedFeatures ? [] : ['Blocked Phase 50D feature policy failed.']),
  ]
  const warnings = Array.from(new Set([
    ...(styleValidation?.warnings ?? []),
    ...(layerManifest?.validation.warnings ?? []),
    ...(input.captureManifest?.warnings ?? []),
    'Phase 50D uses local/offline deck.gl overlays only; live tiles and geocoding/routing remain blocked.',
  ]))
  return {
    status: gates.every((entry) => entry.passed) && blockers.length === 0 ? 'passed' : 'blocked',
    gates,
    blockers: Array.from(new Set(blockers)),
    warnings,
  }
}

function gate(gateId: DeckGlLocalOverlayQaGate['gateId'], passed: boolean, summary: string): DeckGlLocalOverlayQaGate {
  return { gateId, passed, severity: 'mandatory', summary }
}
