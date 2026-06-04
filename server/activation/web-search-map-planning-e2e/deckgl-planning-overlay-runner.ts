import { buildDeckGlLayerManifest, buildDeckGlOverlayData } from '../deckgl-local-overlay-fixture'
import type { DeckGlLayerManifest, DeckGlOverlayData } from '../deckgl-local-overlay-fixture'
import type { WebSearchMapPlanningGeoJson } from './web-search-map-planning-types'

export function buildWebSearchDeckGlPlanningOverlay(geojson: WebSearchMapPlanningGeoJson): {
  overlayData: DeckGlOverlayData
  layerManifest: DeckGlLayerManifest
} {
  const overlayData = buildDeckGlOverlayData(geojson.points.features, geojson.routes.features, geojson.polygons.features)
  const layerManifest = buildDeckGlLayerManifest(overlayData)
  return { overlayData, layerManifest }
}
