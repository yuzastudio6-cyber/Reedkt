import { existsSync, readFileSync } from 'node:fs'
import { buildMapGeospatialApprovalReport } from '../map-geospatial-approval'
import { mapLibreTurfFixtureConfig } from './maplibre-turf-fixture-policy'
import { buildMapLibreTurfFixtureQaSummary } from './maplibre-turf-qa-summary'
import type { MapLibreTurfFixtureExecutionReport, MapLibreTurfFixtureReport } from './maplibre-turf-fixture-types'

export const MAPLIBRE_TURF_FIXTURE_LOCAL_REPORT_PATH = 'activation-logs/maplibre-turf-fixture/phase50b/job-execution/phase50b-report.json'

export function buildMapLibreTurfFixtureReport(): MapLibreTurfFixtureReport {
  const executionReport = readLocalExecutionReport()
  const phase50a = buildMapGeospatialApprovalReport()
  const qa = executionReport?.qa ?? buildMapLibreTurfFixtureQaSummary({ phase50aApproved: phase50a.status === 'approval_review_complete' })
  const status = executionReport ? (executionReport.ok ? 'completed' : 'blocked') : 'planned'
  return {
    reportId: 'activation-phase-50b-maplibre-turf-fixture',
    createdAt: new Date().toISOString(),
    phase: '50B',
    status,
    config: mapLibreTurfFixtureConfig,
    executionReport,
    qa,
    phase50CReadiness: executionReport?.phase50CReadiness ?? 'blocked',
    blockers: executionReport?.blockers ?? qa.blockers,
    warnings: Array.from(new Set([...(executionReport?.warnings ?? []), ...qa.warnings])),
    mapLibreBrowserRuntimeAllowed: false,
    mapRenderingAllowed: false,
    tileDownloadAllowed: false,
    liveTileProviderAllowed: false,
    geocodingAllowed: false,
    routingAllowed: false,
    paidMapProviderAllowed: false,
    productionReadyAllowed: false,
    externalBetaAllowed: false,
    broadMediaAllowed: false,
  }
}

export function summarizeMapLibreTurfFixtureReport(report: MapLibreTurfFixtureReport): string {
  return [
    `Phase 50B MapLibre + Turf fixture report: ${report.reportId}`,
    `Status: ${report.status}`,
    `Run ID: ${report.executionReport?.runId ?? 'not_executed'}`,
    `Generated points: ${report.executionReport?.fixture.points.features.length ?? 'not_executed'}`,
    `Generated routes: ${report.executionReport?.fixture.routes.features.length ?? 'not_executed'}`,
    `Generated polygons: ${report.executionReport?.fixture.polygons.features.length ?? 'not_executed'}`,
    `Turf calculations: ${report.executionReport?.turfCalculations.records.length ?? 'not_executed'}`,
    `MapLibre manifest layers: ${report.executionReport?.mapLibreManifest.layers.length ?? 'not_executed'}`,
    `Phase50C readiness: ${report.phase50CReadiness}`,
    `MapLibre browser runtime allowed: ${report.mapLibreBrowserRuntimeAllowed}`,
    `Map rendering allowed: ${report.mapRenderingAllowed}`,
    `Tile download allowed: ${report.tileDownloadAllowed}`,
    `Live tile provider allowed: ${report.liveTileProviderAllowed}`,
    `Geocoding allowed: ${report.geocodingAllowed}`,
    `Routing allowed: ${report.routingAllowed}`,
    `Paid map provider allowed: ${report.paidMapProviderAllowed}`,
    '',
    'QA gates:',
    ...report.qa.gates.map((gate) => `- ${gate.gateId}: ${gate.passed ? 'passed' : 'blocked'} - ${gate.summary}`),
    '',
    'Artifacts:',
    ...(report.executionReport?.artifacts.length
      ? report.executionReport.artifacts.map((artifact) => `- ${artifact.gcsUri}`)
      : ['- none recorded locally yet']),
    '',
    'Blockers:',
    ...(report.blockers.length ? report.blockers.map((blocker) => `- ${blocker}`) : ['- none']),
  ].join('\n')
}

function readLocalExecutionReport(): MapLibreTurfFixtureExecutionReport | undefined {
  if (!existsSync(MAPLIBRE_TURF_FIXTURE_LOCAL_REPORT_PATH)) return undefined
  try {
    return JSON.parse(readFileSync(MAPLIBRE_TURF_FIXTURE_LOCAL_REPORT_PATH, 'utf8')) as MapLibreTurfFixtureExecutionReport
  } catch {
    return undefined
  }
}
