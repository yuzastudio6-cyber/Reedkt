import { readFileSync } from 'node:fs'
import type { MapGeospatialDependencyAudit } from './map-geospatial-readiness-types'

export function buildMapGeospatialDependencyAudit(): MapGeospatialDependencyAudit {
  const packageJson = JSON.parse(readFileSync('package.json', 'utf8')) as {
    dependencies?: Record<string, string>
    devDependencies?: Record<string, string>
  }
  const dependencies = { ...(packageJson.dependencies ?? {}), ...(packageJson.devDependencies ?? {}) }
  const expectedPresent = [
    present('@turf/turf', dependencies, 'map_geospatial'),
    present('maplibre-gl', dependencies, 'map_geospatial'),
    present('@deck.gl/core', dependencies, 'map_geospatial'),
    present('@deck.gl/layers', dependencies, 'map_geospatial'),
    present('@deck.gl/mapbox', dependencies, 'map_geospatial'),
    present('cesium', dependencies, 'map_geospatial'),
    present('playwright', dependencies, 'web_search'),
    present('sharp', dependencies, 'track_b_consumed'),
  ]
  const expectedAbsentOrInactive = [
    absent('d3', dependencies, false),
    absent('three', dependencies, false),
    absent('@googlemaps/js-api-loader', dependencies, true),
    absent('@googlemaps/google-maps-services-js', dependencies, true),
    absent('mapbox-gl', dependencies, true),
    absent('@mapbox/mapbox-sdk', dependencies, true),
    absent('@mapbox/search-js-web', dependencies, true),
    absent('@mapbox/mapbox-gl-geocoder', dependencies, true),
    absent('@mapbox/mapbox-sdk-js', dependencies, true),
    absent('@turf/helpers', dependencies, false),
  ]
  const blockers = [
    ...expectedPresent.filter((entry) => !entry.present).map((entry) => `${entry.packageName} is required from prior map/geospatial phases.`),
    ...expectedAbsentOrInactive.filter((entry) => entry.present && entry.blockerIfPresent).map((entry) => `${entry.packageName} must not be active in Phase 50G.`),
  ]
  const warnings = expectedAbsentOrInactive
    .filter((entry) => entry.present && !entry.blockerIfPresent)
    .map((entry) => `${entry.packageName} is present but remains outside Phase 50G ownership/runtime scope.`)
  return {
    auditId: 'phase50g-map-geospatial-dependency-audit',
    expectedPresent,
    expectedAbsentOrInactive,
    packageLockChangedInPhase50G: false,
    blockers,
    warnings,
  }
}

function present(packageName: string, dependencies: Record<string, string>, ownership: 'map_geospatial' | 'web_search' | 'track_b_consumed') {
  return {
    packageName,
    version: dependencies[packageName] ?? 'missing',
    present: Boolean(dependencies[packageName]),
    ownership,
  }
}

function absent(packageName: string, dependencies: Record<string, string>, blockerIfPresent: boolean) {
  return {
    packageName,
    present: Boolean(dependencies[packageName]),
    expectedState: 'absent' as const,
    blockerIfPresent,
  }
}
