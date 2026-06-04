import { mapGeospatialReadinessConfig } from './map-geospatial-readiness-policy'
import type { MapGeospatialEvidenceChain, MapGeospatialEvidencePhase, MapGeospatialEvidencePhaseId } from './map-geospatial-readiness-types'

export function resolveMapGeospatialEvidenceChain(): MapGeospatialEvidenceChain {
  const phases: MapGeospatialEvidencePhase[] = [
    phase('49P', 'completed', mapGeospatialReadinessConfig.canonicalPhase49PRunId, 'Web search/capture internal beta candidate evidence is available for generated planning-source handoff.', 'ready_for_map_planning_handoff', [
      gcs(mapGeospatialReadinessConfig.generatedAssetsBucket, `activation-web-search/phase49p/${mapGeospatialReadinessConfig.canonicalPhase49PRunId}/readiness/web-search-internal-beta-candidate-manifest.json`),
      gcs(mapGeospatialReadinessConfig.qaBucket, `activation-web-search/phase49p/${mapGeospatialReadinessConfig.canonicalPhase49PRunId}/reports/phase49p-report.json`),
    ], 'canonical_gcs'),
    phase('50A', 'approval_review_complete', undefined, 'Map/geospatial free/open-source approval architecture completed with runtime blocked.', 'ready_for_generated_fixture_chain', [], 'static_docs', ['Phase 50A was static approval only and created no runtime GCS artifact.']),
    phase('50B', 'completed', mapGeospatialReadinessConfig.canonicalPhase50BRunId, 'Generated GeoJSON, Turf calculations, and MapLibre-compatible manifest passed.', 'ready_for_maplibre_local_render_capture_fixture', [
      gcs(mapGeospatialReadinessConfig.generatedAssetsBucket, `activation-map-geospatial/phase50b/${mapGeospatialReadinessConfig.canonicalPhase50BRunId}/manifest/map-planning-manifest.json`),
      gcs(mapGeospatialReadinessConfig.qaBucket, `activation-map-geospatial/phase50b/${mapGeospatialReadinessConfig.canonicalPhase50BRunId}/qa/maplibre-turf-fixture-qa.json`),
      gcs(mapGeospatialReadinessConfig.qaBucket, `activation-map-geospatial/phase50b/${mapGeospatialReadinessConfig.canonicalPhase50BRunId}/reports/phase50b-report.json`),
    ], 'canonical_gcs'),
    phase('50C', 'completed', mapGeospatialReadinessConfig.canonicalPhase50CRunId, 'MapLibre local/offline render, Playwright capture, network guard, and Sharp derivative evidence passed.', 'ready_for_deckgl_local_overlay_fixture', [
      gcs(mapGeospatialReadinessConfig.generatedAssetsBucket, `activation-map-geospatial/phase50c/${mapGeospatialReadinessConfig.canonicalPhase50CRunId}/manifest/maplibre-local-render-capture-manifest.json`),
      gcs(mapGeospatialReadinessConfig.qaBucket, `activation-map-geospatial/phase50c/${mapGeospatialReadinessConfig.canonicalPhase50CRunId}/qa/maplibre-local-render-qa.json`),
      gcs(mapGeospatialReadinessConfig.qaBucket, `activation-map-geospatial/phase50c/${mapGeospatialReadinessConfig.canonicalPhase50CRunId}/reports/phase50c-report.json`),
    ], 'canonical_gcs'),
    phase('50D', 'completed', mapGeospatialReadinessConfig.canonicalPhase50DRunId, 'deck.gl local/offline overlay fixture passed with MapLibre base render and zero external requests.', 'ready_for_cesiumjs_local_3d_planning_fixture', [
      gcs(mapGeospatialReadinessConfig.generatedAssetsBucket, `activation-map-geospatial/phase50d/${mapGeospatialReadinessConfig.canonicalPhase50DRunId}/manifest/deckgl-local-overlay-capture-manifest.json`),
      gcs(mapGeospatialReadinessConfig.qaBucket, `activation-map-geospatial/phase50d/${mapGeospatialReadinessConfig.canonicalPhase50DRunId}/qa/deckgl-local-overlay-qa.json`),
      gcs(mapGeospatialReadinessConfig.qaBucket, `activation-map-geospatial/phase50d/${mapGeospatialReadinessConfig.canonicalPhase50DRunId}/reports/phase50d-report.json`),
    ], 'canonical_gcs'),
    phase('50E', 'completed', mapGeospatialReadinessConfig.canonicalPhase50ERunId, 'CesiumJS local/offline 3D planning fixture passed with no ion, live terrain, live imagery, 3D Tiles, or external requests.', 'ready_for_web_search_map_planning_private_e2e', [
      gcs(mapGeospatialReadinessConfig.generatedAssetsBucket, `activation-map-geospatial/phase50e/${mapGeospatialReadinessConfig.canonicalPhase50ERunId}/manifest/cesiumjs-local-3d-capture-manifest.json`),
      gcs(mapGeospatialReadinessConfig.qaBucket, `activation-map-geospatial/phase50e/${mapGeospatialReadinessConfig.canonicalPhase50ERunId}/qa/cesiumjs-local-3d-qa.json`),
      gcs(mapGeospatialReadinessConfig.qaBucket, `activation-map-geospatial/phase50e/${mapGeospatialReadinessConfig.canonicalPhase50ERunId}/reports/phase50e-report.json`),
    ], 'canonical_gcs'),
    phase('50F', 'completed', mapGeospatialReadinessConfig.canonicalPhase50FRunId, 'Web-search evidence to generated map planning private E2E passed with 2D and 3D local/offline captures and zero external requests.', 'ready_for_map_geospatial_internal_readiness_gate', [
      gcs(mapGeospatialReadinessConfig.generatedAssetsBucket, `activation-map-geospatial/phase50f/${mapGeospatialReadinessConfig.canonicalPhase50FRunId}/manifest/web-search-map-planning-e2e-manifest.json`),
      gcs(mapGeospatialReadinessConfig.qaBucket, `activation-map-geospatial/phase50f/${mapGeospatialReadinessConfig.canonicalPhase50FRunId}/qa/web-search-map-planning-e2e-qa.json`),
      gcs(mapGeospatialReadinessConfig.qaBucket, `activation-map-geospatial/phase50f/${mapGeospatialReadinessConfig.canonicalPhase50FRunId}/reports/phase50f-report.json`),
    ], 'canonical_gcs'),
  ]
  const blockers = phases.flatMap((entry) => entry.blockers.map((blocker) => `${entry.phase}: ${blocker}`))
  const warnings = phases.flatMap((entry) => entry.warnings.map((warning) => `${entry.phase}: ${warning}`))
  return {
    generatedAt: new Date().toISOString(),
    phases,
    evidenceStatus: blockers.length === 0 ? 'ready' : 'blocked',
    blockers,
    warnings,
  }
}

function phase(
  phaseId: MapGeospatialEvidencePhaseId,
  status: MapGeospatialEvidencePhase['status'],
  runId: string | undefined,
  summary: string,
  readiness: string,
  artifactUris: string[],
  evidenceSource: MapGeospatialEvidencePhase['evidenceSource'],
  warnings: string[] = [],
): MapGeospatialEvidencePhase {
  return {
    phase: phaseId,
    status,
    runId,
    summary,
    readiness,
    artifactUris,
    evidenceSource,
    blockers: [],
    warnings,
  }
}

function gcs(bucket: string, objectPath: string): string {
  return `gs://${bucket}/${objectPath}`
}
