import type { GeneratedGeoJsonFixture, GeoJsonFeature, GeoJsonFeatureCollection } from './maplibre-turf-fixture-types'

function point(id: string, name: string, coordinates: [number, number], type: string, score: number): GeoJsonFeature {
  return {
    type: 'Feature',
    id,
    properties: {
      locationId: id,
      name,
      type,
      score,
      source: 'generated_fixture',
      captureAllowed: false,
      realWorldVerified: false,
    },
    geometry: { type: 'Point', coordinates },
  }
}

function route(id: string, name: string, coordinates: [number, number][], score: number): GeoJsonFeature {
  return {
    type: 'Feature',
    id,
    properties: {
      locationId: id,
      name,
      type: 'generated_route',
      score,
      source: 'generated_fixture',
      captureAllowed: false,
      realWorldVerified: false,
    },
    geometry: { type: 'LineString', coordinates },
  }
}

function polygon(id: string, name: string, coordinates: [number, number][], score: number): GeoJsonFeature {
  return {
    type: 'Feature',
    id,
    properties: {
      locationId: id,
      name,
      type: 'generated_planning_area',
      score,
      source: 'generated_fixture',
      captureAllowed: false,
      realWorldVerified: false,
    },
    geometry: { type: 'Polygon', coordinates: [coordinates] },
  }
}

export function buildGeneratedGeoJsonFixture(): GeneratedGeoJsonFixture {
  const points: GeoJsonFeatureCollection = {
    type: 'FeatureCollection',
    features: [
      point('synthetic-point-001', 'North Studio Node', [-73.9801, 40.7421], 'planning_anchor', 0.94),
      point('synthetic-point-002', 'Market Walk Marker', [-73.9738, 40.7394], 'candidate_location', 0.88),
      point('synthetic-point-003', 'Harbor Edge Marker', [-73.9692, 40.7335], 'candidate_location', 0.82),
      point('synthetic-point-004', 'Transit Loop Marker', [-73.9866, 40.7359], 'candidate_location', 0.79),
      point('synthetic-point-005', 'Archive Square Marker', [-73.9912, 40.7452], 'candidate_location', 0.76),
      point('synthetic-point-006', 'South Review Node', [-73.9782, 40.7298], 'planning_anchor', 0.73),
    ],
  }
  const routes: GeoJsonFeatureCollection = {
    type: 'FeatureCollection',
    features: [
      route('synthetic-route-001', 'Generated planning route alpha', [[-73.9912, 40.7452], [-73.9801, 40.7421], [-73.9738, 40.7394], [-73.9692, 40.7335]], 0.91),
      route('synthetic-route-002', 'Generated planning route beta', [[-73.9866, 40.7359], [-73.9782, 40.7298], [-73.9692, 40.7335]], 0.84),
    ],
  }
  const polygons: GeoJsonFeatureCollection = {
    type: 'FeatureCollection',
    features: [
      polygon('synthetic-area-001', 'Generated central planning area', [[-73.994, 40.748], [-73.970, 40.748], [-73.970, 40.731], [-73.994, 40.731], [-73.994, 40.748]], 0.89),
      polygon('synthetic-area-002', 'Generated south planning area', [[-73.985, 40.738], [-73.966, 40.738], [-73.966, 40.728], [-73.985, 40.728], [-73.985, 40.738]], 0.77),
    ],
  }
  const combined: GeoJsonFeatureCollection = {
    type: 'FeatureCollection',
    features: [...points.features, ...routes.features, ...polygons.features],
  }
  return {
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
}
