import { webSearchMapPlanningConfig } from './web-search-map-planning-policy'
import type {
  LocationCandidate,
  PlanningSourceRecord,
  WebSearchMap2DRenderResult,
  WebSearchMap3DRenderResult,
  WebSearchMapEvidenceChain,
  WebSearchMapPlanningArtifact,
  WebSearchMapPlanningGeoJson,
  WebSearchMapPlanningManifest,
  WebSearchMapPlanningQaGate,
  WebSearchMapPlanningQaSummary,
} from './web-search-map-planning-types'
import type { TurfCalculationResult } from '../maplibre-turf-fixture'

export function buildWebSearchMapPlanningQaSummary(input: {
  evidenceChain: WebSearchMapEvidenceChain
  planningSources: PlanningSourceRecord[]
  locationCandidates: LocationCandidate[]
  geojson: WebSearchMapPlanningGeoJson
  turfCalculations: TurfCalculationResult
  map2D?: WebSearchMap2DRenderResult
  map3D?: WebSearchMap3DRenderResult
  manifest?: WebSearchMapPlanningManifest
  artifacts?: WebSearchMapPlanningArtifact[]
  preflightBlockers?: string[]
  publicAccessBlocked?: boolean
}): WebSearchMapPlanningQaSummary {
  const preflightBlockers = input.preflightBlockers ?? []
  const artifacts = input.artifacts ?? []
  const webSearchEvidence = input.evidenceChain.evidenceStatus === 'ready'
    && input.evidenceChain.phases.some((phase) => phase.phase === '49P' && phase.runId === webSearchMapPlanningConfig.canonicalPhase49PRunId)
  const mapStackEvidence = ['50A', '50B', '50C', '50D', '50E'].every((phaseId) => input.evidenceChain.phases.some((phase) => phase.phase === phaseId && phase.blockers.length === 0))
  const planningSourceIntegrity = input.planningSources.length >= 5
    && input.planningSources.length <= 6
    && input.planningSources.every((source) => source.generatedFixture && !source.liveSearchUsed && !source.publicSearxngUsed && !source.paidProviderUsed && !source.captureAllowed && !source.extractionAllowed)
  const locationCandidateIntegrity = input.locationCandidates.length <= webSearchMapPlanningConfig.maxLocationCandidates
    && input.locationCandidates.length >= 5
    && input.locationCandidates.every((candidate) => candidate.generatedFixture && !candidate.realWorldVerified && !candidate.userLocationUsed && !candidate.liveGeocodingUsed && !candidate.liveRoutingUsed)
  const turfPlanningCalculations = input.turfCalculations.summary.blockers.length === 0
    && input.turfCalculations.summary.pointCount >= 5
    && input.turfCalculations.records.length >= 9
  const maplibrePlanningRender = !!input.map2D?.renderMetadata
    && input.map2D.renderMetadata.readyMarkerObserved
    && input.map2D.renderMetadata.renderMetadata.mapLibreSourceCount === 3
    && input.map2D.styleValidation.blockers.length === 0
    && input.map2D.externalNetworkRequestsObserved.length === 0
  const deckglPlanningOverlay = !!input.map2D?.renderMetadata
    && input.map2D.renderMetadata.renderMetadata.deckGlLayerCount === input.map2D.layerManifest.layers.length
    && input.map2D.renderMetadata.renderMetadata.mapboxOverlayAttached
    && input.map2D.layerManifest.validation.blockers.length === 0
  const cesiumjs3DPlanning = !!input.map3D?.renderMetadata
    && input.map3D.renderMetadata.readyMarkerObserved
    && input.map3D.renderMetadata.renderMetadata.cesiumIonTokenEmpty
    && input.map3D.renderMetadata.renderMetadata.baseLayerDisabled
    && input.map3D.renderMetadata.renderMetadata.ellipsoidTerrainUsed
    && input.map3D.sceneConfig.validation.blockers.length === 0
    && input.map3D.externalNetworkRequestsObserved.length === 0
  const captureArtifacts = !!input.map2D?.renderMetadata
    && !!input.map3D?.renderMetadata
    && input.map2D.renderMetadata.screenshotDimensions.width === 1280
    && input.map2D.renderMetadata.screenshotDimensions.height === 720
    && input.map3D.renderMetadata.screenshotDimensions.width === 1280
    && input.map3D.renderMetadata.screenshotDimensions.height === 720
    && !!input.map2D.sharpProcessing
    && !!input.map3D.sharpProcessing
  const artifactPrivacy = artifacts.length === 0
    ? true
    : artifacts.every((artifact) => artifact.gcsUri.startsWith('gs://reeditpro-staging-reeditpro-') && artifact.kind.startsWith('private_') && !artifact.gcsUri.includes('http'))
      && input.publicAccessBlocked !== false
  const blockedFeatures = preflightBlockers.length === 0
    && input.geojson.generatedFixture
    && !input.geojson.realWorldVerified
    && !input.geojson.userLocationUsed
    && !input.geojson.liveGeocodingUsed
    && !input.geojson.liveRoutingUsed
    && planningSourceIntegrity
    && locationCandidateIntegrity
    && maplibrePlanningRender
    && deckglPlanningOverlay
    && cesiumjs3DPlanning

  const gates: WebSearchMapPlanningQaGate[] = [
    gate('web_search_evidence', webSearchEvidence, 'Phase 49P web search/capture internal beta candidate evidence is present.'),
    gate('map_stack_evidence', mapStackEvidence, 'Phase 50A-50E map/geospatial evidence is present and consistent.'),
    gate('planning_source_integrity', planningSourceIntegrity, 'Generated planning source records are derived from evidence and do not use live search, paid providers, capture, or extraction.'),
    gate('location_candidate_integrity', locationCandidateIntegrity, 'Location candidates are generated-only and exclude geocoding, routing, user location, and real-world verification.'),
    gate('turf_planning_calculations', turfPlanningCalculations, 'Turf calculations completed on generated planning GeoJSON without blockers.'),
    gate('maplibre_planning_render', maplibrePlanningRender, 'MapLibre rendered the generated local/offline planning map with local sources only.'),
    gate('deckgl_planning_overlay', deckglPlanningOverlay, 'deck.gl rendered generated local/offline planning overlays on the MapLibre fixture.'),
    gate('cesiumjs_3d_planning', cesiumjs3DPlanning, 'CesiumJS rendered generated local/offline 3D planning entities without ion, imagery, terrain, or 3D Tiles.'),
    gate('capture_artifacts', captureArtifacts, '2D and 3D Playwright screenshots and Sharp derivatives were produced from local fixtures.'),
    gate('artifact_privacy', artifactPrivacy, 'Artifacts are private GCS objects with no public or signed URL source of truth.'),
    gate('blocked_features', blockedFeatures, 'Live search, public SearXNG, live tiles, geocoding/routing, paid map providers, production, beta, and broad media remain blocked.'),
  ]
  const blockers = [
    ...preflightBlockers,
    ...(webSearchEvidence ? [] : ['Web search Phase 49P evidence is not ready.']),
    ...(mapStackEvidence ? [] : ['Map stack Phase 50A-50E evidence is not ready.']),
    ...(planningSourceIntegrity ? [] : ['Planning source integrity failed.']),
    ...(locationCandidateIntegrity ? [] : ['Location candidate integrity failed.']),
    ...(turfPlanningCalculations ? [] : ['Turf planning calculations failed.']),
    ...(maplibrePlanningRender ? [] : ['MapLibre planning render failed.']),
    ...(deckglPlanningOverlay ? [] : ['deck.gl planning overlay failed.']),
    ...(cesiumjs3DPlanning ? [] : ['CesiumJS 3D planning failed.']),
    ...(captureArtifacts ? [] : ['Capture artifacts QA failed.']),
    ...(artifactPrivacy ? [] : ['Artifact privacy QA failed.']),
    ...(blockedFeatures ? [] : ['Blocked feature policy failed.']),
  ]
  const warnings = Array.from(new Set([
    ...input.evidenceChain.warnings,
    ...input.turfCalculations.summary.warnings,
    ...(input.map2D?.styleValidation.warnings ?? []),
    ...(input.map2D?.layerManifest.validation.warnings ?? []),
    ...(input.map3D?.sceneConfig.validation.warnings ?? []),
    'Phase 50F connects web-search evidence to generated/local map planning only; live search, geocoding, routing, tiles, and paid providers remain blocked.',
  ]))
  return {
    status: gates.every((entry) => entry.passed) && blockers.length === 0 ? 'passed' : 'blocked',
    gates,
    blockers: Array.from(new Set(blockers)),
    warnings,
  }
}

function gate(gateId: WebSearchMapPlanningQaGate['gateId'], passed: boolean, summary: string): WebSearchMapPlanningQaGate {
  return { gateId, passed, severity: 'mandatory', summary }
}
