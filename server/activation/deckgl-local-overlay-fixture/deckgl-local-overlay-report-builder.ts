import { existsSync, readFileSync } from 'node:fs'
import { buildDeckGlLocalOverlayFixtureData } from './deckgl-local-overlay-fixture-data'
import { deckGlLocalOverlayConfig } from './deckgl-local-overlay-policy'
import { buildDeckGlLocalOverlayQaSummary } from './deckgl-local-overlay-qa-summary'
import type { DeckGlLocalOverlayExecutionReport, DeckGlLocalOverlayReport } from './deckgl-local-overlay-types'

export const DECKGL_LOCAL_OVERLAY_LOCAL_REPORT_PATH = 'activation-logs/deckgl-local-overlay-fixture/phase50d/job-execution/phase50d-report.json'

export function buildDeckGlLocalOverlayReport(): DeckGlLocalOverlayReport {
  const executionReport = readLocalExecutionReport()
  const localFixture = buildDeckGlLocalOverlayFixtureData()
  const qa = executionReport?.qa ?? buildDeckGlLocalOverlayQaSummary({
    phase50cEvidencePresent: true,
    fixture: localFixture.fixture,
    style: localFixture.style,
    styleValidation: localFixture.styleValidation,
    overlayData: localFixture.overlayData,
    layerManifest: localFixture.layerManifest,
    publicAccessBlocked: true,
  })
  const status = executionReport ? (executionReport.ok ? 'completed' : 'blocked') : 'planned'

  return {
    reportId: 'activation-phase-50d-deckgl-local-overlay-fixture',
    createdAt: new Date().toISOString(),
    phase: '50D',
    status,
    config: deckGlLocalOverlayConfig,
    executionReport,
    qa,
    phase50EReadiness: executionReport?.phase50EReadiness ?? 'blocked',
    blockers: executionReport?.blockers ?? qa.blockers,
    warnings: Array.from(new Set([...(executionReport?.warnings ?? []), ...qa.warnings])),
    deckGlRuntimeAllowed: true,
    deckGlRuntimeScope: 'generated_local_overlay_fixture_only',
    mapLibreBrowserRuntimeAllowed: true,
    mapRenderingAllowed: true,
    liveTileProviderAllowed: false,
    tileDownloadAllowed: false,
    geocodingAllowed: false,
    routingAllowed: false,
    paidMapProviderAllowed: false,
    cesiumJsRuntimeAllowed: false,
    d3RuntimeAllowed: false,
    threeJsRuntimeAllowed: false,
    productionReadyAllowed: false,
    externalBetaAllowed: false,
    broadMediaAllowed: false,
  }
}

export function summarizeDeckGlLocalOverlayReport(report: DeckGlLocalOverlayReport): string {
  return [
    `Phase 50D deck.gl local overlay fixture report: ${report.reportId}`,
    `Status: ${report.status}`,
    `Run ID: ${report.executionReport?.runId ?? 'not_executed'}`,
    `Mode: ${report.config.mode}`,
    `deck.gl runtime allowed: ${report.deckGlRuntimeAllowed}`,
    `deck.gl runtime scope: ${report.deckGlRuntimeScope}`,
    `MapLibre browser runtime allowed: ${report.mapLibreBrowserRuntimeAllowed}`,
    `Map rendering allowed: ${report.mapRenderingAllowed}`,
    `Live tile provider allowed: ${report.liveTileProviderAllowed}`,
    `Tile download allowed: ${report.tileDownloadAllowed}`,
    `Geocoding allowed: ${report.geocodingAllowed}`,
    `Routing allowed: ${report.routingAllowed}`,
    `Paid map provider allowed: ${report.paidMapProviderAllowed}`,
    `CesiumJS runtime allowed: ${report.cesiumJsRuntimeAllowed}`,
    `D3 runtime allowed: ${report.d3RuntimeAllowed}`,
    `Three.js runtime allowed: ${report.threeJsRuntimeAllowed}`,
    `Screenshot dimensions: ${report.executionReport?.renderMetadata ? `${report.executionReport.renderMetadata.screenshotDimensions.width}x${report.executionReport.renderMetadata.screenshotDimensions.height}` : 'not_executed'}`,
    `External requests observed: ${report.executionReport?.externalNetworkRequestsObserved.length ?? 'not_executed'}`,
    `Phase50E readiness: ${report.phase50EReadiness}`,
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

function readLocalExecutionReport(): DeckGlLocalOverlayExecutionReport | undefined {
  if (!existsSync(DECKGL_LOCAL_OVERLAY_LOCAL_REPORT_PATH)) return undefined
  try {
    return JSON.parse(readFileSync(DECKGL_LOCAL_OVERLAY_LOCAL_REPORT_PATH, 'utf8')) as DeckGlLocalOverlayExecutionReport
  } catch {
    return undefined
  }
}
