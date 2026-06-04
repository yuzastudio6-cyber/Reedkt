export function buildMapLibreTurfFixtureCommandPlan() {
  return {
    phase: '50B',
    defaultMode: 'static_report_only',
    executeCommand: 'GCP_PROJECT_ID=reeditpro GCP_REGION=us-central1 REEDITPRO_ENV=staging REEDITPRO_CONFIRM_MAPLIBRE_TURF_GENERATED_FIXTURE=true npm run activation:maplibre-turf-fixture -- --execute',
    allowedWhenConfirmed: ['generate synthetic GeoJSON', 'run Turf locally on generated data', 'build MapLibre-compatible manifest JSON', 'upload private JSON/GeoJSON artifacts'],
    blockedAlways: ['map rendering', 'tile downloads', 'live tile providers', 'geocoding APIs', 'routing APIs', 'Mapbox', 'Google Maps', 'Cesium ion', 'public OSM tiles', 'Playwright', 'screenshots', 'Docker', 'Cloud Run mutation', 'public artifacts', 'production', 'external beta', 'broad media'],
  }
}
