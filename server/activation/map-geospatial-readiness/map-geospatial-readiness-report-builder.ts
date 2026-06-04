import { existsSync, readFileSync } from 'node:fs'
import { buildPlannedMapGeospatialArtifactPrivacyAudit } from './map-geospatial-artifact-audit'
import { buildMapGeospatialDependencyAudit } from './map-geospatial-dependency-audit'
import { resolveMapGeospatialEvidenceChain } from './map-geospatial-evidence-resolver'
import { buildMapGeospatialFailurePolicy } from './map-geospatial-failure-policy'
import { buildMapGeospatialOwnershipAudit } from './map-geospatial-ownership-audit'
import { buildMapGeospatialProviderDataAudit } from './map-geospatial-provider-audit'
import { mapGeospatialReadinessConfig, mapGeospatialReadinessSafetyFlags } from './map-geospatial-readiness-policy'
import { buildMapGeospatialReadinessQaSummary } from './map-geospatial-readiness-qa-summary'
import { buildMapGeospatialReadinessScopeManifest } from './map-geospatial-scope-manifest'
import type { MapGeospatialReadinessExecutionReport, MapGeospatialReadinessReport } from './map-geospatial-readiness-types'

export const MAP_GEOSPATIAL_READINESS_LOCAL_REPORT_PATH = 'activation-logs/map-geospatial-readiness/phase50g/job-execution/phase50g-report.json'

export function buildMapGeospatialReadinessReport(): MapGeospatialReadinessReport {
  const executionReport = readLocalExecutionReport()
  if (executionReport) return executionToReport(executionReport)

  const evidenceChain = resolveMapGeospatialEvidenceChain()
  const providerDataAudit = buildMapGeospatialProviderDataAudit()
  const dependencyAudit = buildMapGeospatialDependencyAudit()
  const ownershipAudit = buildMapGeospatialOwnershipAudit()
  const artifactPrivacyAudit = buildPlannedMapGeospatialArtifactPrivacyAudit(evidenceChain)
  const failurePolicy = buildMapGeospatialFailurePolicy()
  const qa = buildMapGeospatialReadinessQaSummary({
    evidenceChain,
    providerDataAudit,
    dependencyAudit,
    ownershipAudit,
    artifactPrivacyAudit,
    failurePolicy,
    docsPresent: true,
    scriptsPresent: true,
  })
  const scopeManifest = buildMapGeospatialReadinessScopeManifest({
    runId: 'phase50g-planned',
    ready: false,
    providerDataAudit,
    ownershipAudit,
    artifactPrivacyAudit,
    failurePolicy,
  })
  return {
    reportId: 'activation-phase-50g-map-geospatial-readiness',
    createdAt: new Date().toISOString(),
    phase: '50G',
    status: 'planned',
    config: mapGeospatialReadinessConfig,
    evidenceChain,
    scopeManifest,
    providerDataAudit,
    dependencyAudit,
    ownershipAudit,
    artifactPrivacyAudit,
    failurePolicy,
    qa,
    safetyFlags: mapGeospatialReadinessSafetyFlags,
    mapGeospatialInternalTestingReady: false,
    phase52AReadiness: 'blocked',
    blockers: qa.blockers,
    warnings: qa.warnings,
  }
}

export function summarizeMapGeospatialReadinessReport(report: MapGeospatialReadinessReport): string {
  return [
    'Phase 50G map/geospatial internal readiness gate',
    `Status: ${report.status}`,
    `Run ID: ${report.executionReport?.runId ?? 'not_executed'}`,
    `Evidence phases: ${report.evidenceChain.phases.map((phase) => `${phase.phase}:${phase.status}`).join(', ')}`,
    `MapLibre: ${gateStatus(report, 'maplibre_ready')}`,
    `Turf: ${gateStatus(report, 'turf_ready')}`,
    `deck.gl: ${gateStatus(report, 'deckgl_ready')}`,
    `CesiumJS: ${gateStatus(report, 'cesiumjs_ready')}`,
    `Web-search + map E2E: ${gateStatus(report, 'web_search_map_e2e_ready')}`,
    `Map/geospatial internal testing ready: ${report.mapGeospatialInternalTestingReady}`,
    `Phase52A readiness: ${report.phase52AReadiness}`,
    'Live tiles/geocoding/routing/paid map providers/Cesium ion/D3/Three.js/production/beta: blocked',
    '',
    'QA gates:',
    ...report.qa.gates.map((gate) => `- ${gate.gateId}: ${gate.passed ? 'passed' : 'blocked'} - ${gate.summary}`),
    '',
    'Artifacts:',
    ...(report.executionReport?.artifacts.length ? report.executionReport.artifacts.map((artifact) => `- ${artifact.gcsUri}`) : ['- none recorded locally yet']),
    '',
    'Blockers:',
    ...(report.blockers.length ? report.blockers.map((blocker) => `- ${blocker}`) : ['- none']),
  ].join('\n')
}

function executionToReport(executionReport: MapGeospatialReadinessExecutionReport): MapGeospatialReadinessReport {
  return {
    reportId: 'activation-phase-50g-map-geospatial-readiness',
    createdAt: new Date().toISOString(),
    phase: '50G',
    status: executionReport.ok ? 'completed' : 'blocked',
    config: mapGeospatialReadinessConfig,
    executionReport,
    evidenceChain: executionReport.evidenceChain,
    scopeManifest: executionReport.scopeManifest,
    providerDataAudit: executionReport.providerDataAudit,
    dependencyAudit: executionReport.dependencyAudit,
    ownershipAudit: executionReport.ownershipAudit,
    artifactPrivacyAudit: executionReport.artifactPrivacyAudit,
    failurePolicy: executionReport.failurePolicy,
    qa: executionReport.qa,
    safetyFlags: executionReport.safetyFlags,
    mapGeospatialInternalTestingReady: executionReport.mapGeospatialInternalTestingReady,
    phase52AReadiness: executionReport.phase52AReadiness,
    blockers: executionReport.blockers,
    warnings: executionReport.warnings,
  }
}

function readLocalExecutionReport(): MapGeospatialReadinessExecutionReport | undefined {
  if (!existsSync(MAP_GEOSPATIAL_READINESS_LOCAL_REPORT_PATH)) return undefined
  try {
    return JSON.parse(readFileSync(MAP_GEOSPATIAL_READINESS_LOCAL_REPORT_PATH, 'utf8')) as MapGeospatialReadinessExecutionReport
  } catch {
    return undefined
  }
}

function gateStatus(report: MapGeospatialReadinessReport, gateId: string): string {
  return report.qa.gates.find((gate) => gate.gateId === gateId)?.passed ? 'ready' : 'blocked'
}
