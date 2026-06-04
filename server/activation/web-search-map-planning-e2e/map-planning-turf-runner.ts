import { runTurfGeospatialCalculations } from '../maplibre-turf-fixture'
import type { TurfCalculationResult } from '../maplibre-turf-fixture'
import type { WebSearchMapPlanningGeoJson } from './web-search-map-planning-types'

export function runWebSearchMapPlanningTurfCalculations(geojson: WebSearchMapPlanningGeoJson): TurfCalculationResult {
  return runTurfGeospatialCalculations(geojson.fixture)
}
