import { existsSync, readFileSync } from 'node:fs'
import { buildCesiumJsLocal3DFixtureData } from './cesiumjs-3d-fixture-data'
import { cesiumJsLocal3DConfig } from './cesiumjs-local-3d-policy'
import { buildCesiumJsLocal3DQaSummary } from './cesiumjs-local-3d-qa-summary'
import type { CesiumJsLocal3DExecutionReport, CesiumJsLocal3DReport } from './cesiumjs-local-3d-types'

export const CESIUMJS_LOCAL_3D_LOCAL_REPORT_PATH = 'activation-logs/cesiumjs-local-3d-fixture/phase50e/job-execution/phase50e-report.json'

export function buildCesiumJsLocal3DReport(): CesiumJsLocal3DReport {
  const executionReport = readLocalExecutionReport()
  const fixtureData = buildCesiumJsLocal3DFixtureData()
  const qa = executionReport?.qa ?? buildCesiumJsLocal3DQaSummary({
    phase50dEvidencePresent: true,
    fixture: fixtureData.fixture,
    planningData: fixtureData.planningData,
    sceneConfig: fixtureData.sceneConfig,
    publicAccessBlocked: true,
  })
  const status = executionReport ? (executionReport.ok ? 'completed' : 'blocked') : 'planned'
  return {
    reportId: 'activation-phase-50e-cesiumjs-local-3d-fixture',
    createdAt: new Date().toISOString(),
    phase: '50E',
    status,
    config: cesiumJsLocal3DConfig,
    executionReport,
    qa,
    phase50FReadiness: executionReport?.phase50FReadiness ?? 'blocked',
    blockers: executionReport?.blockers ?? qa.blockers,
    warnings: Array.from(new Set([...(executionReport?.warnings ?? []), ...qa.warnings])),
    cesiumJsRuntimeAllowed: true,
    cesiumJsRuntimeScope: 'generated_local_offline_3d_planning_fixture_only',
    cesiumIonAllowed: false,
    liveImageryProviderAllowed: false,
    liveTerrainProviderAllowed: false,
    threeDTilesAllowed: false,
    tileDownloadAllowed: false,
    geocodingAllowed: false,
    routingAllowed: false,
    paidMapProviderAllowed: false,
    deckGlRuntimeAllowed: false,
    d3RuntimeAllowed: false,
    threeJsRuntimeAllowed: false,
    productionReadyAllowed: false,
    externalBetaAllowed: false,
    broadMediaAllowed: false,
  }
}

export function summarizeCesiumJsLocal3DReport(report: CesiumJsLocal3DReport): string {
  return [
    `Phase 50E CesiumJS local 3D fixture report: ${report.reportId}`,
    `Status: ${report.status}`,
    `Run ID: ${report.executionReport?.runId ?? 'not_executed'}`,
    `Mode: ${report.config.mode}`,
    `CesiumJS runtime allowed: ${report.cesiumJsRuntimeAllowed}`,
    `CesiumJS runtime scope: ${report.cesiumJsRuntimeScope}`,
    `Cesium ion allowed: ${report.cesiumIonAllowed}`,
    `Live imagery provider allowed: ${report.liveImageryProviderAllowed}`,
    `Live terrain provider allowed: ${report.liveTerrainProviderAllowed}`,
    `3D Tiles allowed: ${report.threeDTilesAllowed}`,
    `Tile download allowed: ${report.tileDownloadAllowed}`,
    `Geocoding allowed: ${report.geocodingAllowed}`,
    `Routing allowed: ${report.routingAllowed}`,
    `Paid map provider allowed: ${report.paidMapProviderAllowed}`,
    `deck.gl runtime allowed: ${report.deckGlRuntimeAllowed}`,
    `D3 runtime allowed: ${report.d3RuntimeAllowed}`,
    `Three.js runtime allowed: ${report.threeJsRuntimeAllowed}`,
    `Screenshot dimensions: ${report.executionReport?.renderMetadata ? `${report.executionReport.renderMetadata.screenshotDimensions.width}x${report.executionReport.renderMetadata.screenshotDimensions.height}` : 'not_executed'}`,
    `External requests observed: ${report.executionReport?.externalNetworkRequestsObserved.length ?? 'not_executed'}`,
    `Phase50F readiness: ${report.phase50FReadiness}`,
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

function readLocalExecutionReport(): CesiumJsLocal3DExecutionReport | undefined {
  if (!existsSync(CESIUMJS_LOCAL_3D_LOCAL_REPORT_PATH)) return undefined
  try {
    return JSON.parse(readFileSync(CESIUMJS_LOCAL_3D_LOCAL_REPORT_PATH, 'utf8')) as CesiumJsLocal3DExecutionReport
  } catch {
    return undefined
  }
}
