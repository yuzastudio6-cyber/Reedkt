import type {
  GeneratedGeoJsonFixture,
} from '../maplibre-turf-fixture'
import type {
  MapLibreLocalCaptureManifest,
  MapLibreLocalRenderArtifact,
  MapLibreLocalRenderQaGate,
  MapLibreLocalRenderQaSummary,
  MapLibreLocalStyle,
  MapLibreLocalStyleValidation,
  MapLibreRenderMetadata,
  NetworkRequestRecord,
  SharpMapScreenshotProcessing,
} from './maplibre-local-render-types'

export function buildMapLibreLocalRenderQaSummary(input: {
  phase50bEvidencePresent: boolean
  fixture?: GeneratedGeoJsonFixture
  style?: MapLibreLocalStyle
  styleValidation?: MapLibreLocalStyleValidation
  renderMetadata?: MapLibreRenderMetadata
  networkRequestsObserved?: NetworkRequestRecord[]
  externalNetworkRequestsObserved?: NetworkRequestRecord[]
  sharpProcessing?: SharpMapScreenshotProcessing
  captureManifest?: MapLibreLocalCaptureManifest
  artifacts?: MapLibreLocalRenderArtifact[]
  preflightBlockers?: string[]
  publicAccessBlocked?: boolean
}): MapLibreLocalRenderQaSummary {
  const fixture = input.fixture
  const style = input.style
  const styleValidation = input.styleValidation
  const renderMetadata = input.renderMetadata
  const externalNetworkRequestsObserved = input.externalNetworkRequestsObserved ?? []
  const artifacts = input.artifacts ?? []
  const preflightBlockers = input.preflightBlockers ?? []
  const generatedGeoJsonIntegrity = !!fixture
    && fixture.generatedFixture
    && fixture.userLocationUsed === false
    && fixture.realWorldVerified === false
    && fixture.points.features.length >= 5
    && fixture.points.features.length <= 8
    && fixture.routes.features.length >= 1
    && fixture.routes.features.length <= 2
    && fixture.polygons.features.length >= 1
    && fixture.polygons.features.length <= 2
    && fixture.combined.features.every((feature) => feature.properties.source === 'generated_fixture' && feature.properties.captureAllowed === false && feature.properties.realWorldVerified === false)
  const localStyleIntegrity = !!style
    && !!styleValidation
    && styleValidation.blockers.length === 0
    && styleValidation.noRemoteTileGlyphSpriteImageUrls
    && styleValidation.noPaidProviderUrls
    && styleValidation.noSymbolLayers
  const mapLibreLocalRender = !!renderMetadata
    && renderMetadata.readyMarkerObserved
    && renderMetadata.renderMetadata.sourceCount === 3
    && renderMetadata.renderMetadata.layerCount >= 5
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

  const gates: MapLibreLocalRenderQaGate[] = [
    gate('phase50b_evidence', input.phase50bEvidencePresent, 'Phase 50B canonical generated fixture evidence is present.'),
    gate('generated_geojson_integrity', generatedGeoJsonIntegrity, 'Generated GeoJSON is bounded, synthetic, and does not use user location, geocoding, or routing.'),
    gate('local_style_integrity', localStyleIntegrity, 'MapLibre local style uses local GeoJSON sources only and no remote glyph/sprite/tile/image/provider URLs.'),
    gate('maplibre_local_render', mapLibreLocalRender, 'MapLibre rendered the generated local/offline fixture and exposed source/layer metadata.'),
    gate('network_guard', networkGuard, 'Network guard observed no external requests, tile requests, public OSM, Mapbox, Google, Cesium ion, geocoding, or routing calls.'),
    gate('playwright_capture', playwrightCapture, 'Playwright captured a 1280x720 screenshot from the local fixture only.'),
    gate('optional_screenshot_processing', optionalScreenshotProcessing, 'Sharp preview, thumbnail, and image metadata were created from the Phase 50C screenshot.'),
    gate('artifact_privacy', artifactPrivacy, 'Artifacts are private GCS objects with no public or signed URL source of truth.'),
    gate('blocked_features', blockedFeatures, 'Live tiles, geocoding, routing, paid providers, deck.gl, CesiumJS, production, beta, and broad media remain blocked.'),
  ]
  const blockers = [
    ...preflightBlockers,
    ...(input.phase50bEvidencePresent ? [] : ['Phase 50B canonical evidence is not present.']),
    ...(generatedGeoJsonIntegrity ? [] : ['Generated GeoJSON integrity failed.']),
    ...(localStyleIntegrity ? [] : ['Local MapLibre style integrity failed.']),
    ...(mapLibreLocalRender ? [] : ['MapLibre local render QA failed.']),
    ...(networkGuard ? [] : ['Network guard observed forbidden external or tile/provider requests.']),
    ...(playwrightCapture ? [] : ['Playwright capture QA failed.']),
    ...(optionalScreenshotProcessing ? [] : ['Optional Sharp screenshot processing QA failed.']),
    ...(artifactPrivacy ? [] : ['Artifact privacy QA failed.']),
    ...(blockedFeatures ? [] : ['Blocked Phase 50C feature policy failed.']),
  ]
  const warnings = Array.from(new Set([
    ...(styleValidation?.warnings ?? []),
    ...(input.captureManifest?.warnings ?? []),
    'Phase 50C uses local/offline MapLibre rendering only; live tiles and geocoding/routing remain blocked.',
  ]))
  return {
    status: gates.every((entry) => entry.passed) && blockers.length === 0 ? 'passed' : 'blocked',
    gates,
    blockers: Array.from(new Set(blockers)),
    warnings,
  }
}

function gate(gateId: MapLibreLocalRenderQaGate['gateId'], passed: boolean, summary: string): MapLibreLocalRenderQaGate {
  return { gateId, passed, severity: 'mandatory', summary }
}
