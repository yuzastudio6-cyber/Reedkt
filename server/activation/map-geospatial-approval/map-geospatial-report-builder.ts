import { buildMapGeospatialCommandPlans } from './map-geospatial-command-plan'
import { buildMapGeospatialDataPolicy } from './map-geospatial-data-policy'
import { buildMapGeospatialFutureScope } from './map-geospatial-future-scope'
import { buildMapGeospatialLicenseReviews } from './map-geospatial-license-review'
import { validateMapGeospatialApprovalStaticEnv, mapGeospatialApprovalConfig, mapGeospatialRequiredScripts } from './map-geospatial-approval-policy'
import { buildMapGeospatialQaSummary } from './map-geospatial-qa-summary'
import { buildMapGeospatialRiskRegister } from './map-geospatial-risk-register'
import { buildMapGeospatialToolEvidence } from './map-geospatial-tool-evidence'
import { buildMapGeospatialToolScopes } from './map-geospatial-tool-scope'
import type { MapGeospatialApprovalReport } from './map-geospatial-approval-types'

export function buildMapGeospatialApprovalReport(): MapGeospatialApprovalReport {
  const tools = buildMapGeospatialToolEvidence()
  const licenseReviews = buildMapGeospatialLicenseReviews()
  const toolScopes = buildMapGeospatialToolScopes()
  const dataPolicy = buildMapGeospatialDataPolicy()
  const risks = buildMapGeospatialRiskRegister()
  const futureScope = buildMapGeospatialFutureScope()
  const commandPlans = buildMapGeospatialCommandPlans()
  const envValidation = validateMapGeospatialApprovalStaticEnv()
  const qa = buildMapGeospatialQaSummary({
    tools,
    licenseReviews,
    toolScopes,
    dataPolicy,
    risks,
    futureScope,
    commandPlans,
    requiredScripts: mapGeospatialRequiredScripts,
    envBlockers: envValidation.blockers,
    envWarnings: envValidation.warnings,
  })
  const status = qa.status === 'passed' ? 'approval_review_complete' : 'blocked_pending_evidence'
  const warnings = Array.from(new Set([
    ...qa.warnings,
    'Phase 50A does not install packages, render maps, download tiles, call geocoding/routing APIs, launch Playwright, mutate GCP, or create public artifacts.',
  ]))

  return {
    reportId: 'activation-phase-50a-map-geospatial-approval',
    createdAt: new Date().toISOString(),
    phase: '50A',
    status,
    config: mapGeospatialApprovalConfig,
    tools,
    licenseReviews,
    toolScopes,
    dataPolicy,
    risks,
    futureScope,
    commandPlans,
    codexDecision: 'staging_planning_approved_free_open_source_map_stack',
    recommendedPhase50BPath: 'Start with generated/local MapLibre + Turf fixtures using deterministic GeoJSON, no live tiles, no geocoding/routing calls, no Playwright capture, and no paid map providers.',
    phase50BReadiness: qa.status === 'passed' ? 'ready_for_generated_maplibre_turf_fixture_planning_only' : 'blocked',
    qa,
    blockers: qa.blockers,
    warnings,
    mapLibrePlanningAllowed: true,
    turfPlanningAllowed: true,
    deckGlPlanningAllowed: true,
    cesiumJsPlanningAllowed: true,
    mapRuntimeAllowed: false,
    tileDownloadAllowed: false,
    liveGeocodingAllowed: false,
    liveRoutingAllowed: false,
    paidMapProviderAllowed: false,
    publicArtifactAllowed: false,
    productionReadyAllowed: false,
    externalBetaAllowed: false,
    paidProductionAllowed: false,
    broadMediaAllowed: false,
    providerAllowed: false,
    revideoAllowed: false,
  }
}

export function summarizeMapGeospatialApprovalReport(report: MapGeospatialApprovalReport): string {
  return [
    `Map/geospatial approval report: ${report.reportId}`,
    `Status: ${report.status}`,
    `Codex decision: ${report.codexDecision}`,
    `Default planning stack: ${report.tools.filter((tool) => tool.defaultStack).map((tool) => tool.displayName).join(', ')}`,
    `Phase50B readiness: ${report.phase50BReadiness}`,
    `Map runtime allowed: ${report.mapRuntimeAllowed}`,
    `Tile download allowed: ${report.tileDownloadAllowed}`,
    `Live geocoding allowed: ${report.liveGeocodingAllowed}`,
    `Live routing allowed: ${report.liveRoutingAllowed}`,
    `Paid map provider allowed: ${report.paidMapProviderAllowed}`,
    `Public artifact allowed: ${report.publicArtifactAllowed}`,
    `Production ready allowed: ${report.productionReadyAllowed}`,
    `External beta allowed: ${report.externalBetaAllowed}`,
    `Broad media allowed: ${report.broadMediaAllowed}`,
    '',
    'QA gates:',
    ...report.qa.gates.map((gate) => `- ${gate.gateId}: ${gate.passed ? 'passed' : 'blocked'} - ${gate.summary}`),
    '',
    'Blockers:',
    ...(report.blockers.length ? report.blockers.map((blocker) => `- ${blocker}`) : ['- none']),
    '',
    'Future scope:',
    ...report.futureScope.map((phase) => `- Phase ${phase.phaseId}: ${phase.title}`),
  ].join('\n')
}

export function summarizeMapGeospatialToolSummary(): string {
  return [
    'Map/geospatial tool summary',
    ...buildMapGeospatialToolEvidence().map((tool) => `- ${tool.displayName}: ${tool.defaultStack ? 'default planning stack' : 'future-scoped'}; license=${tool.license}; runtime=blocked_in_phase50a`),
  ].join('\n')
}
