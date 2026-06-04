import type { GeneratedGeoJsonFixture } from '../maplibre-turf-fixture'
import type { MapLibreLocalStyle, MapLibreLocalStyleValidation } from './maplibre-local-render-types'

const forbiddenUrlPatterns = [
  /https?:\/\//i,
  /pmtiles:\/\//i,
  /mapbox:\/\//i,
  /mapbox\.com/i,
  /api\.mapbox\.com/i,
  /maps\.googleapis\.com/i,
  /googleapis\.com/i,
  /cesium\.com\/ion/i,
  /api\.cesium\.com/i,
  /tile\.openstreetmap\.org/i,
  /openstreetmap\.org\/tile/i,
]

export function buildMapLibreLocalStyle(fixture: GeneratedGeoJsonFixture): MapLibreLocalStyle {
  return {
    version: 8,
    name: 'ReeditPro Phase 50C local offline generated map style',
    metadata: {
      generatedFixture: true,
      noRemoteTiles: true,
      noGlyphs: true,
      noSprites: true,
      noPaidProviders: true,
      renderingMode: 'maplibre_local_offline_render_capture_fixture',
    },
    sources: {
      generated_polygons: { type: 'geojson', data: fixture.polygons },
      generated_routes: { type: 'geojson', data: fixture.routes },
      generated_points: { type: 'geojson', data: fixture.points },
    },
    layers: [
      { id: 'generated-background', type: 'background', paint: { 'background-color': '#eef3f0' } },
      { id: 'generated-polygon-fill', type: 'fill', source: 'generated_polygons', paint: { 'fill-color': '#6e9ad7', 'fill-opacity': 0.22 } },
      { id: 'generated-polygon-outline', type: 'line', source: 'generated_polygons', paint: { 'line-color': '#244d85', 'line-width': 2 } },
      { id: 'generated-route-line', type: 'line', source: 'generated_routes', paint: { 'line-color': '#e05252', 'line-width': 5, 'line-opacity': 0.92 } },
      { id: 'generated-point-circle', type: 'circle', source: 'generated_points', paint: { 'circle-color': '#0f9f6e', 'circle-radius': 7, 'circle-stroke-width': 2, 'circle-stroke-color': '#ffffff' } },
    ],
  }
}

export function validateMapLibreLocalStyle(style: MapLibreLocalStyle): MapLibreLocalStyleValidation {
  const blockers: string[] = []
  const warnings = ['Symbol/text layers are intentionally omitted to avoid glyph URL requirements in Phase 50C.']
  const sourceIds = Object.keys(style.sources)
  const layerIds = style.layers.map((layer) => layer.id)
  const sourceIdsUnique = new Set(sourceIds).size === sourceIds.length
  const layerIdsUnique = new Set(layerIds).size === layerIds.length
  const layerReferencesValid = style.layers.every((layer) => !layer.source || sourceIds.includes(layer.source))
  const serialized = JSON.stringify(style)
  const noRemoteTileGlyphSpriteImageUrls = !forbiddenUrlPatterns.some((pattern) => pattern.test(serialized))
    && !('glyphs' in style)
    && !('sprite' in style)
  const noPaidProviderUrls = !['mapbox', 'google', 'cesium'].some((provider) => serialized.toLowerCase().includes(provider))
  const noSymbolLayers = style.layers.every((layer) => String(layer.type) !== 'symbol')
  if (!sourceIdsUnique) blockers.push('MapLibre local style source IDs must be unique.')
  if (!layerIdsUnique) blockers.push('MapLibre local style layer IDs must be unique.')
  if (!layerReferencesValid) blockers.push('MapLibre local style layers must reference existing local GeoJSON sources.')
  if (!noRemoteTileGlyphSpriteImageUrls) blockers.push('MapLibre local style contains a remote tile/glyph/sprite/image URL.')
  if (!noPaidProviderUrls) blockers.push('MapLibre local style contains a paid-provider URL or token reference.')
  if (!noSymbolLayers) blockers.push('MapLibre local style must not use symbol layers in Phase 50C.')
  return {
    sourceIdsUnique,
    layerIdsUnique,
    layerReferencesValid,
    noRemoteTileGlyphSpriteImageUrls,
    noPaidProviderUrls,
    noSymbolLayers,
    blockers,
    warnings,
  }
}
