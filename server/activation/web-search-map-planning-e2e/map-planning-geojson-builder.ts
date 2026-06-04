import type { GeoJsonFeature, GeoJsonFeatureCollection, GeneratedGeoJsonFixture } from '../maplibre-turf-fixture'
import type { LocationCandidate, WebSearchMapPlanningGeoJson } from './web-search-map-planning-types'

export function buildWebSearchMapPlanningGeoJson(candidates: LocationCandidate[]): WebSearchMapPlanningGeoJson {
  const points: GeoJsonFeatureCollection = {
    type: 'FeatureCollection',
    features: candidates.map((candidate) => feature(candidate.candidateId, candidate.name, 'Point', candidate.coordinates, candidate)),
  }
  const routes: GeoJsonFeatureCollection = {
    type: 'FeatureCollection',
    features: [
      feature('generated-planning-route-001', 'Generated web-search planning route alpha', 'LineString', candidates.slice(0, 4).map((candidate) => candidate.coordinates), candidates[0]),
      feature('generated-planning-route-002', 'Generated web-search planning route beta', 'LineString', candidates.slice(3, 6).map((candidate) => candidate.coordinates), candidates[3]),
    ],
  }
  const polygons: GeoJsonFeatureCollection = {
    type: 'FeatureCollection',
    features: [
      feature('generated-planning-area-001', 'Generated web-search map planning area', 'Polygon', [[-73.994, 40.748], [-73.970, 40.748], [-73.970, 40.731], [-73.994, 40.731], [-73.994, 40.748]], candidates[0]),
      feature('generated-planning-area-002', 'Generated local/offline capture planning area', 'Polygon', [[-73.985, 40.738], [-73.966, 40.738], [-73.966, 40.728], [-73.985, 40.728], [-73.985, 40.738]], candidates[5]),
    ],
  }
  const combined: GeoJsonFeatureCollection = {
    type: 'FeatureCollection',
    features: [...points.features, ...routes.features, ...polygons.features],
  }
  const fixture: GeneratedGeoJsonFixture = {
    fixtureId: 'reeditpro-generated-planning-city',
    fixtureMode: 'synthetic_planning_city',
    generatedFixture: true,
    realWorldVerified: false,
    userLocationUsed: false,
    points,
    routes,
    polygons,
    combined,
  }
  return {
    generatedFixture: true,
    realWorldVerified: false,
    userLocationUsed: false,
    liveGeocodingUsed: false,
    liveRoutingUsed: false,
    points,
    routes,
    polygons,
    combined,
    fixture,
  }
}

function feature(
  id: string,
  name: string,
  type: GeoJsonFeature['geometry']['type'],
  coordinates: unknown,
  candidate: LocationCandidate,
): GeoJsonFeature {
  const normalizedCoordinates = type === 'Polygon' ? [coordinates] : coordinates
  return {
    type: 'Feature',
    id,
    properties: {
      locationId: id,
      name,
      sourceCandidateId: candidate.candidateId,
      sourceId: candidate.sourceId,
      type: type === 'Point' ? candidate.role : type === 'LineString' ? 'generated_route' : 'generated_planning_area',
      score: candidate.confidence,
      source: 'generated_fixture',
      generatedFixture: true,
      captureAllowed: false,
      realWorldVerified: false,
      userLocationUsed: false,
      liveGeocodingUsed: false,
      liveRoutingUsed: false,
    },
    geometry: { type, coordinates: normalizedCoordinates },
  }
}
