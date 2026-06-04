import type { GeneratedGeoJsonFixture, MapLibreStyleManifest, TurfCalculationResult } from './maplibre-turf-fixture-types'

const paidProviderUrlPatterns = ['mapbox.com', 'api.mapbox.com', 'maps.googleapis.com', 'googleapis.com', 'cesium.com/ion', 'api.cesium.com']

export function buildMapLibreStyleManifest(fixture: GeneratedGeoJsonFixture, turfResult: TurfCalculationResult): MapLibreStyleManifest {
  const bbox = turfResult.records.find((entry) => entry.calculation === 'bbox')?.output as [number, number, number, number] | undefined
  const center = turfResult.records.find((entry) => entry.calculation === 'centroid')?.output as [number, number] | undefined
  const sources: MapLibreStyleManifest['sources'] = {
    generated_points: { type: 'geojson', data: fixture.points },
    generated_routes: { type: 'geojson', data: fixture.routes },
    generated_polygons: { type: 'geojson', data: fixture.polygons },
  }
  const layers: MapLibreStyleManifest['layers'] = [
    { id: 'generated-polygon-fill', type: 'fill', source: 'generated_polygons', paint: { 'fill-color': '#4077d6', 'fill-opacity': 0.16 } },
    { id: 'generated-polygon-outline', type: 'line', source: 'generated_polygons', paint: { 'line-color': '#244a9b', 'line-width': 2 } },
    { id: 'generated-route-line', type: 'line', source: 'generated_routes', paint: { 'line-color': '#e05252', 'line-width': 4, 'line-opacity': 0.9 } },
    { id: 'generated-point-circle', type: 'circle', source: 'generated_points', paint: { 'circle-color': '#0f9f6e', 'circle-radius': 6, 'circle-stroke-width': 2, 'circle-stroke-color': '#ffffff' } },
    { id: 'generated-point-label', type: 'symbol', source: 'generated_points', layout: { 'text-field': ['get', 'name'], 'text-size': 12, 'text-offset': [0, 1.2] }, paint: { 'text-color': '#182033' } },
  ]
  const sourceIds = Object.keys(sources)
  const layerIds = layers.map((layer) => layer.id)
  const serialized = JSON.stringify({ sources, layers })
  const blockers: string[] = []
  const warnings: string[] = []
  const sourceIdsUnique = new Set(sourceIds).size === sourceIds.length
  const layerIdsUnique = new Set(layerIds).size === layerIds.length
  const layerReferencesValid = layers.every((layer) => sourceIds.includes(layer.source))
  const noRemoteSpriteGlyphTileUrls = !/https?:\/\/|pmtiles:\/\/|mapbox:\/\//i.test(serialized)
  const noPaidProviderUrls = !paidProviderUrlPatterns.some((pattern) => serialized.includes(pattern))
  if (!bbox) blockers.push('Turf bbox output is missing.')
  if (!center) blockers.push('Turf centroid output is missing.')
  if (!sourceIdsUnique) blockers.push('MapLibre source IDs are not unique.')
  if (!layerIdsUnique) blockers.push('MapLibre layer IDs are not unique.')
  if (!layerReferencesValid) blockers.push('One or more MapLibre layers reference an invalid source ID.')
  if (!noRemoteSpriteGlyphTileUrls) blockers.push('MapLibre manifest contains a remote sprite, glyph, tile, or map URL.')
  if (!noPaidProviderUrls) blockers.push('MapLibre manifest contains a paid provider URL.')
  warnings.push('MapLibre browser runtime is deferred to Phase 50C; this manifest is not rendered in Phase 50B.')

  return {
    manifestId: 'phase50b-maplibre-style-manifest',
    styleVersion: 8,
    generatedFixture: true,
    mapLibreBrowserRuntimeUsed: false,
    renderingDeferredToPhase50C: true,
    sources,
    layers,
    initialCamera: {
      center: center ?? [-73.9801, 40.7421],
      zoom: 12,
      bounds: bbox ?? [-73.994, 40.728, -73.966, 40.748],
    },
    attributionPolicy: ['Generated fixture data only.', 'No OSM/open tiles used in Phase 50B.', 'Future OSM-derived output must include attribution.'],
    tilePolicy: ['No live tiles.', 'No public OSM tiles.', 'No Mapbox, Google Maps, or Cesium ion URLs.', 'Rendering deferred to Phase 50C.'],
    validation: {
      sourceIdsUnique,
      layerIdsUnique,
      layerReferencesValid,
      noRemoteSpriteGlyphTileUrls,
      noPaidProviderUrls,
      blockers,
      warnings,
    },
  }
}
