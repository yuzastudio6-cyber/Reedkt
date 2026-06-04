import { webSearchMapPlanningConfig } from './web-search-map-planning-policy'
import type { WebSearchMapEvidenceChain, WebSearchMapEvidencePhase } from './web-search-map-planning-types'

export function resolveWebSearchMapPlanningEvidenceChain(): WebSearchMapEvidenceChain {
  const phases: WebSearchMapEvidencePhase[] = [
    phase('49P', 'completed', webSearchMapPlanningConfig.canonicalPhase49PRunId, 'Web search/capture internal beta candidate closure passed for controlled internal beta candidate scope.', [
      gcs(webSearchMapPlanningConfig.generatedAssetsBucket, `activation-web-search/phase49p/${webSearchMapPlanningConfig.canonicalPhase49PRunId}/readiness/web-search-internal-beta-candidate-manifest.json`),
      gcs(webSearchMapPlanningConfig.qaBucket, `activation-web-search/phase49p/${webSearchMapPlanningConfig.canonicalPhase49PRunId}/reports/phase49p-report.json`),
    ]),
    phase('50A', 'approval_review_complete', undefined, 'Map/geospatial free/open-source approval architecture completed with runtime blocked.', []),
    phase('50B', 'completed', 'phase50b-20260604T01114', 'Generated GeoJSON, Turf calculations, and MapLibre-compatible manifest passed.', [
      gcs(webSearchMapPlanningConfig.qaBucket, 'activation-map-geospatial/phase50b/phase50b-20260604T01114/reports/phase50b-report.json'),
    ]),
    phase('50C', 'completed', 'phase50c-20260604T020852', 'MapLibre local/offline render and Playwright capture fixture passed.', [
      gcs(webSearchMapPlanningConfig.qaBucket, 'activation-map-geospatial/phase50c/phase50c-20260604T020852/reports/phase50c-report.json'),
    ]),
    phase('50D', 'completed', 'phase50d-20260604T030406', 'deck.gl local/offline overlay fixture passed.', [
      gcs(webSearchMapPlanningConfig.qaBucket, 'activation-map-geospatial/phase50d/phase50d-20260604T030406/reports/phase50d-report.json'),
    ]),
    phase('50E', 'completed', webSearchMapPlanningConfig.canonicalPhase50ERunId, 'CesiumJS local/offline 3D planning fixture passed.', [
      gcs(webSearchMapPlanningConfig.qaBucket, `activation-map-geospatial/phase50e/${webSearchMapPlanningConfig.canonicalPhase50ERunId}/reports/phase50e-report.json`),
    ]),
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
  phaseId: string,
  status: WebSearchMapEvidencePhase['status'],
  runId: string | undefined,
  summary: string,
  artifactUris: string[],
): WebSearchMapEvidencePhase {
  return {
    phase: phaseId,
    status,
    runId,
    summary,
    artifactUris,
    blockers: [],
    warnings: phaseId === '50A' ? ['Phase 50A was static approval only and created no GCS runtime artifacts.'] : [],
  }
}

function gcs(bucket: string, objectPath: string): string {
  return `gs://${bucket}/${objectPath}`
}
