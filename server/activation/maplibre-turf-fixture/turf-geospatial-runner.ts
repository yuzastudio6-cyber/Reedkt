import * as turf from '@turf/turf'
import type { GeneratedGeoJsonFixture, GeoJsonFeature, TurfCalculationRecord, TurfCalculationResult } from './maplibre-turf-fixture-types'

export function runTurfGeospatialCalculations(fixture: GeneratedGeoJsonFixture): TurfCalculationResult {
  const blockers: string[] = []
  const warnings: string[] = []
  const records: TurfCalculationRecord[] = []
  const combined = fixture.combined
  const points = fixture.points
  const firstPoint = fixture.points.features[0]
  const secondPoint = fixture.points.features[1]
  const route = fixture.routes.features[0]
  const areaFeature = fixture.polygons.features[0]

  const coordinateValidationPassed = validateCoordinates(fixture.combined.features, blockers)
  const bbox = (turf.bbox as (geojson: unknown) => [number, number, number, number])(combined)
  const centroid = (turf.centroid as unknown as (geojson: unknown) => { geometry: { coordinates: [number, number] } })(areaFeature)
  const pointDistance = (turf.distance as (from: unknown, to: unknown, options: { units: 'kilometers' }) => number)(firstPoint, secondPoint, { units: 'kilometers' })
  const routeLength = (turf.length as (geojson: unknown, options: { units: 'kilometers' }) => number)(route, { units: 'kilometers' })
  const buffered = (turf.buffer as (feature: unknown, radius: number, options: { units: 'kilometers' }) => { geometry: unknown } | undefined)(firstPoint, 0.5, { units: 'kilometers' })
  const polygonArea = (turf.area as (geojson: unknown) => number)(areaFeature)
  const pointInPolygon = (turf.booleanPointInPolygon as (point: unknown, polygon: unknown) => boolean)(firstPoint, areaFeature)
  const nearest = (turf.nearestPoint as (target: unknown, points: unknown) => { properties?: Record<string, unknown>; id?: string | number })(secondPoint, points)

  records.push(record('bbox', 'Combined generated fixture FeatureCollection', bbox, undefined, 'west/south/east/north inside synthetic planning city bounds'))
  records.push(record('centroid', 'Generated central planning area polygon', centroid.geometry.coordinates, 'lon/lat', 'centroid inside generated polygon'))
  records.push(record('distance', 'First two generated candidate points', round(pointDistance), 'kilometers', '0.1km to 2km synthetic point spacing'))
  records.push(record('route_length', 'Generated planning route alpha', round(routeLength), 'kilometers', '1km to 5km synthetic route length'))
  records.push(record('buffer', '0.5km buffer around first generated point', buffered?.geometry ?? null, 'kilometers', 'buffer polygon generated without geocoding'))
  records.push(record('area', 'Generated central planning area polygon', Math.round(polygonArea), 'square meters', 'bounded synthetic planning area'))
  records.push(record('boolean_point_in_polygon', 'First generated point within generated central planning area', pointInPolygon, undefined, 'true for fixture anchor point'))
  records.push(record('nearest_point', 'Nearest generated point to second generated point', nearest.properties?.locationId ?? nearest.properties?.name ?? nearest.id, undefined, 'nearest generated source id returned'))
  records.push(record('feature_count', 'Generated fixture feature counts', {
    points: fixture.points.features.length,
    routes: fixture.routes.features.length,
    polygons: fixture.polygons.features.length,
    combined: fixture.combined.features.length,
  }, undefined, 'counts within Phase 50B policy limits'))

  if (pointDistance <= 0 || pointDistance > 2) blockers.push('Generated point distance is outside expected synthetic range.')
  if (routeLength <= 0 || routeLength > 5) blockers.push('Generated route length is outside expected synthetic range.')
  if (!buffered) blockers.push('Turf buffer did not produce a feature.')
  if (!pointInPolygon) blockers.push('Generated anchor point is not inside the generated planning polygon.')
  if (!nearest) blockers.push('Nearest point calculation did not return a feature.')

  return {
    generatedFixture: true,
    coordinateFixtureMode: 'synthetic_planning_city',
    records,
    summary: {
      pointCount: fixture.points.features.length,
      routeCount: fixture.routes.features.length,
      polygonCount: fixture.polygons.features.length,
      coordinateValidationPassed,
      blockers,
      warnings,
    },
  }
}

function validateCoordinates(features: GeoJsonFeature[], blockers: string[]): boolean {
  const values = JSON.stringify(features)
  if (!values.includes('generated_fixture')) blockers.push('Generated fixture source marker is missing.')
  for (const feature of features) {
    if (feature.properties.source !== 'generated_fixture') blockers.push(`Feature ${feature.id ?? 'unknown'} is missing generated_fixture source marker.`)
    if (feature.properties.captureAllowed !== false) blockers.push(`Feature ${feature.id ?? 'unknown'} must keep captureAllowed=false.`)
    if (feature.properties.realWorldVerified !== false) blockers.push(`Feature ${feature.id ?? 'unknown'} must keep realWorldVerified=false.`)
  }
  return blockers.length === 0
}

function record(calculation: string, inputSummary: string, output: unknown, units?: string, expectedRange?: string): TurfCalculationRecord {
  return { calculation, inputSummary, output, units, expectedRange, warnings: [], blockers: [] }
}

function round(value: number): number {
  return Math.round(value * 1000) / 1000
}
