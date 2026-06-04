import { buildLocalMapFixtureData } from '../maplibre-local-render-fixture'
import type { GeoJsonFeature } from '../maplibre-turf-fixture'
import { deckGlLocalOverlayConfig } from './deckgl-local-overlay-policy'
import type { DeckGlLayerManifest, DeckGlLocalFixtureData, DeckGlOverlayData } from './deckgl-local-overlay-types'

export function buildDeckGlLocalOverlayFixtureData(): DeckGlLocalFixtureData {
  const base = buildLocalMapFixtureData()
  const overlayData = buildDeckGlOverlayData(base.fixture.points.features, base.fixture.routes.features, base.fixture.polygons.features)
  const layerManifest = buildDeckGlLayerManifest(overlayData)
  return {
    source: 'phase50b_generated_fixture_code',
    approvedPhase50CRunId: deckGlLocalOverlayConfig.approvedPhase50CRunId,
    fixture: base.fixture,
    style: base.style,
    styleValidation: base.styleValidation,
    overlayData,
    layerManifest,
  }
}

export function buildDeckGlOverlayData(points: GeoJsonFeature[], routes: GeoJsonFeature[], polygons: GeoJsonFeature[]): DeckGlOverlayData {
  const overlayPoints = points.map((feature) => ({
    id: String(feature.id ?? feature.properties.locationId),
    name: String(feature.properties.name ?? feature.id),
    position: feature.geometry.coordinates as [number, number],
    weight: Number(feature.properties.score ?? 0.75),
    source: 'generated_fixture' as const,
  }))
  const paths = routes.map((feature) => ({
    id: String(feature.id ?? feature.properties.locationId),
    name: String(feature.properties.name ?? feature.id),
    path: feature.geometry.coordinates as [number, number][],
    weight: Number(feature.properties.score ?? 0.75),
    source: 'generated_fixture' as const,
  }))
  const overlayPolygons = polygons.map((feature) => ({
    id: String(feature.id ?? feature.properties.locationId),
    name: String(feature.properties.name ?? feature.id),
    polygon: ((feature.geometry.coordinates as [number, number][][])[0] ?? []) as [number, number][],
    weight: Number(feature.properties.score ?? 0.75),
    source: 'generated_fixture' as const,
  }))
  const arcs = [
    flow('generated-flow-001', overlayPoints[0], overlayPoints[2], 0.92),
    flow('generated-flow-002', overlayPoints[1], overlayPoints[5], 0.81),
    flow('generated-flow-003', overlayPoints[4], overlayPoints[3], 0.73),
  ].filter(Boolean)

  return {
    generatedFixture: true,
    realWorldVerified: false,
    routingUsed: false,
    captureAllowed: false,
    points: overlayPoints,
    paths,
    polygons: overlayPolygons,
    arcs,
  }
}

export function buildDeckGlLayerManifest(overlayData: DeckGlOverlayData): DeckGlLayerManifest {
  const layers: DeckGlLayerManifest['layers'] = [
    { id: 'generated-scatterplot-layer', type: 'ScatterplotLayer', dataSource: 'points', generatedFixture: true, realWorldVerified: false },
    { id: 'generated-path-layer', type: 'PathLayer', dataSource: 'paths', generatedFixture: true, realWorldVerified: false },
    { id: 'generated-polygon-layer', type: 'PolygonLayer', dataSource: 'polygons', generatedFixture: true, realWorldVerified: false },
    { id: 'generated-arc-layer', type: 'ArcLayer', dataSource: 'arcs', generatedFixture: true, realWorldVerified: false },
  ]
  const blockers: string[] = []
  const layerIdsUnique = new Set(layers.map((layer) => layer.id)).size === layers.length
  const approvedTypes = new Set(['ScatterplotLayer', 'PathLayer', 'PolygonLayer', 'ArcLayer'])
  const layerTypesApproved = layers.every((layer) => approvedTypes.has(layer.type))
  const layerCountWithinLimit = layers.length <= deckGlLocalOverlayConfig.maxDeckGlLayers
  const noExternalAssets = JSON.stringify(overlayData).toLowerCase().includes('http') === false
  const noD3ThreeCesiumRuntime = true
  if (!layerIdsUnique) blockers.push('deck.gl layer IDs must be unique.')
  if (!layerTypesApproved) blockers.push('deck.gl layer manifest contains an unapproved layer type.')
  if (!layerCountWithinLimit) blockers.push('deck.gl layer count exceeds the Phase 50D limit.')
  if (!noExternalAssets) blockers.push('deck.gl overlay data must not include external assets or URLs.')
  return {
    manifestId: 'phase50d-deckgl-layer-manifest',
    generatedFixture: true,
    deckGlRuntimeScope: 'local_offline_overlay_fixture_only',
    mapboxOverlayUsed: true,
    layers,
    heatmapLayerDeferred: true,
    validation: {
      layerIdsUnique,
      layerTypesApproved,
      layerCountWithinLimit,
      noExternalAssets,
      noD3ThreeCesiumRuntime,
      blockers,
      warnings: ['HeatmapLayer is intentionally deferred in Phase 50D to avoid expanding runtime scope or package requirements.'],
    },
  }
}

function flow(flowId: string, source?: DeckGlOverlayData['points'][number], target?: DeckGlOverlayData['points'][number], weight = 0.75): DeckGlOverlayData['arcs'][number] {
  if (!source || !target) throw new Error(`Missing generated fixture points for ${flowId}.`)
  return {
    flowId,
    sourcePointId: source.id,
    targetPointId: target.id,
    sourcePosition: source.position,
    targetPosition: target.position,
    weight,
    source: 'generated_fixture',
    routingUsed: false,
    realWorldVerified: false,
  }
}
