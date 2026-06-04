import type { MapGeospatialCommandPlan } from './map-geospatial-approval-types'

export function buildMapGeospatialCommandPlans(): MapGeospatialCommandPlan[] {
  return [
    plan('phase50b-generated-geojson-fixture', '50B', 'Generated GeoJSON fixture', 'TEXT ONLY: create deterministic local GeoJSON and validate MapLibre/Turf planning contracts in a later phase.'),
    plan('phase50b-turf-calculation-fixture', '50B', 'Turf calculation fixture', 'TEXT ONLY: run distance/bounds/buffer calculations against generated local data only in a later phase.'),
    plan('phase50c-maplibre-local-render-fixture', '50C', 'MapLibre local render fixture', 'TEXT ONLY: render a generated/local map fixture after dependency/runtime approval.'),
    plan('phase50d-deckgl-overlay-fixture', '50D', 'deck.gl overlay fixture', 'TEXT ONLY: render generated points/routes/arcs/heatmaps after dependency/runtime approval.'),
    plan('phase50e-cesiumjs-3d-fixture', '50E', 'CesiumJS 3D planning fixture', 'TEXT ONLY: evaluate OSS CesiumJS with local/generated data only; no Cesium ion.'),
    plan('phase50f-search-map-private-e2e', '50F', 'Web search + map private E2E', 'TEXT ONLY: use controlled web-search source evidence and generated/private map planning outputs.'),
    plan('phase50g-map-readiness-gate', '50G', 'Map/geospatial internal readiness gate', 'TEXT ONLY: audit evidence and failure policy without unlocking production/beta.'),
  ]
}

function plan(commandId: string, phase: MapGeospatialCommandPlan['phase'], purpose: string, commandText: string): MapGeospatialCommandPlan {
  return {
    commandId,
    phase,
    purpose,
    textOnlyByDefault: true,
    allowedInPhase50A: false,
    blockedReason: 'Phase 50A is approval/architecture only and does not install packages, render maps, download tiles, call geocoding/routing APIs, launch Playwright, mutate GCP, create public artifacts, or run providers.',
    executableCommand: null,
    commandText,
  }
}
