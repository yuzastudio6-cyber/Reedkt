import { existsSync, readFileSync } from 'node:fs'
import { buildLocalMapFixtureData } from './local-map-fixture-data'
import { mapLibreLocalRenderConfig } from './maplibre-local-render-policy'
import { buildMapLibreLocalRenderQaSummary } from './maplibre-local-render-qa-summary'
import type { MapLibreLocalRenderExecutionReport, MapLibreLocalRenderReport } from './maplibre-local-render-types'

export const MAPLIBRE_LOCAL_RENDER_LOCAL_REPORT_PATH = 'activation-logs/maplibre-local-render-fixture/phase50c/job-execution/phase50c-report.json'

export function buildMapLibreLocalRenderReport(): MapLibreLocalRenderReport {
  const executionReport = readLocalExecutionReport()
  const localFixture = buildLocalMapFixtureData()
  const qa = executionReport?.qa ?? buildMapLibreLocalRenderQaSummary({
    phase50bEvidencePresent: true,
    fixture: localFixture.fixture,
    style: localFixture.style,
    styleValidation: localFixture.styleValidation,
    publicAccessBlocked: true,
  })
  const status = executionReport ? (executionReport.ok ? 'completed' : 'blocked') : 'planned'

  return {
    reportId: 'activation-phase-50c-maplibre-local-render-fixture',
    createdAt: new Date().toISOString(),
    phase: '50C',
    status,
    config: mapLibreLocalRenderConfig,
    executionReport,
    qa,
    phase50DReadiness: executionReport?.phase50DReadiness ?? 'blocked',
    blockers: executionReport?.blockers ?? qa.blockers,
    warnings: Array.from(new Set([...(executionReport?.warnings ?? []), ...qa.warnings])),
    mapLibreBrowserRuntimeAllowed: true,
    mapRenderingAllowed: true,
    liveTileProviderAllowed: false,
    tileDownloadAllowed: false,
    geocodingAllowed: false,
    routingAllowed: false,
    paidMapProviderAllowed: false,
    deckGlRuntimeAllowed: false,
    cesiumJsRuntimeAllowed: false,
    productionReadyAllowed: false,
    externalBetaAllowed: false,
    broadMediaAllowed: false,
  }
}

export function summarizeMapLibreLocalRenderReport(report: MapLibreLocalRenderReport): string {
  return [
    `Phase 50C MapLibre local render fixture report: ${report.reportId}`,
    `Status: ${report.status}`,
    `Run ID: ${report.executionReport?.runId ?? 'not_executed'}`,
    `Mode: ${report.config.mode}`,
    `MapLibre browser runtime allowed: ${report.mapLibreBrowserRuntimeAllowed}`,
    `Map rendering allowed: ${report.mapRenderingAllowed}`,
    `Live tile provider allowed: ${report.liveTileProviderAllowed}`,
    `Tile download allowed: ${report.tileDownloadAllowed}`,
    `Geocoding allowed: ${report.geocodingAllowed}`,
    `Routing allowed: ${report.routingAllowed}`,
    `Paid map provider allowed: ${report.paidMapProviderAllowed}`,
    `deck.gl runtime allowed: ${report.deckGlRuntimeAllowed}`,
    `CesiumJS runtime allowed: ${report.cesiumJsRuntimeAllowed}`,
    `Screenshot dimensions: ${report.executionReport?.renderMetadata ? `${report.executionReport.renderMetadata.screenshotDimensions.width}x${report.executionReport.renderMetadata.screenshotDimensions.height}` : 'not_executed'}`,
    `External requests observed: ${report.executionReport?.externalNetworkRequestsObserved.length ?? 'not_executed'}`,
    `Phase50D readiness: ${report.phase50DReadiness}`,
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

function readLocalExecutionReport(): MapLibreLocalRenderExecutionReport | undefined {
  if (!existsSync(MAPLIBRE_LOCAL_RENDER_LOCAL_REPORT_PATH)) return undefined
  try {
    return JSON.parse(readFileSync(MAPLIBRE_LOCAL_RENDER_LOCAL_REPORT_PATH, 'utf8')) as MapLibreLocalRenderExecutionReport
  } catch {
    return undefined
  }
}
