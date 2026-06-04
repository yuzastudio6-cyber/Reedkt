export function buildMapLibreLocalRenderCommandPlan() {
  return {
    phase: '50C',
    defaultMode: 'static_report_only',
    executeCommand: 'GCP_PROJECT_ID=reeditpro GCP_REGION=us-central1 REEDITPRO_ENV=staging REEDITPRO_CONFIRM_MAPLIBRE_LOCAL_RENDER_CAPTURE=true npm run activation:maplibre-local-render-fixture -- --execute',
    allowedWhenConfirmed: [
      'generate synthetic Phase 50B-style GeoJSON',
      'build local/offline MapLibre style JSON',
      'serve a temporary 127.0.0.1 local fixture',
      'launch Playwright Chromium only against the local fixture',
      'capture a 1280x720 local/offline screenshot',
      'run Sharp only on the Phase 50C screenshot',
      'upload private Phase 50C artifacts',
    ],
    blockedAlways: [
      'live tiles',
      'public OSM tiles',
      'remote glyphs/sprites/images',
      'Mapbox',
      'Google Maps',
      'Cesium ion',
      'geocoding APIs',
      'routing APIs',
      'paid map providers',
      'deck.gl runtime',
      'CesiumJS runtime',
      'public artifacts',
      'signed URLs as source of truth',
      'production',
      'external beta',
      'broad media',
    ],
  }
}
