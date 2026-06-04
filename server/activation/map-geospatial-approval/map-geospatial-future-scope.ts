import type { MapGeospatialFuturePhase } from './map-geospatial-approval-types'

export function buildMapGeospatialFutureScope(): MapGeospatialFuturePhase[] {
  return [
    phase('50B', 'MapLibre + Turf generated fixture', ['Use generated local GeoJSON.', 'Validate map plan schema and Turf calculations.', 'Avoid live tiles, external APIs, rendering, and screenshots unless separately approved.']),
    phase('50C', 'MapLibre local render + capture fixture', ['Install/use MapLibre only if approved.', 'Render a generated/local map fixture.', 'Use local/static tiles or generated style only.', 'Keep public tile providers blocked.']),
    phase('50D', 'deck.gl overlay fixture', ['Use generated points/routes/heatmaps/arcs.', 'Optionally integrate with MapLibre.', 'Keep output private and fixture-only.']),
    phase('50E', 'CesiumJS 3D planning fixture', ['Use generated/fictional or approved coordinates.', 'Do not use Cesium ion.', 'Produce private 3D preview/camera metadata only after approval.']),
    phase('50F', 'Web search + map planning private E2E', ['Use the web-search internal-ready stack.', 'Extract and normalize location candidates only from controlled/allowlisted sources.', 'Map candidates with MapLibre/Turf planning and private manifests.']),
    phase('50G', 'Map/geospatial internal readiness gate', ['Audit evidence, failure modes, UI/API gates, artifact privacy, and internal-only scope.', 'Keep production and external beta blocked.']),
  ]
}

function phase(phaseId: MapGeospatialFuturePhase['phaseId'], title: string, scope: string[]): MapGeospatialFuturePhase {
  return { phaseId, title, scope, allowed: true, blockedInPhase50A: true }
}
