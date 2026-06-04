import { existsSync, readFileSync } from 'node:fs'
import { buildGeneratedPlanningSourceRecords } from './planning-source-fixture-builder'
import { normalizePlanningSourcesToLocationCandidates } from './location-candidate-normalizer'
import { buildWebSearchMapPlanningGeoJson } from './map-planning-geojson-builder'
import { runWebSearchMapPlanningTurfCalculations } from './map-planning-turf-runner'
import { resolveWebSearchMapPlanningEvidenceChain } from './web-search-map-evidence-resolver'
import { webSearchMapPlanningConfig, webSearchMapPlanningSafetyFlags } from './web-search-map-planning-policy'
import { buildWebSearchMapPlanningQaSummary } from './web-search-map-planning-qa-summary'
import type { WebSearchMapPlanningExecutionReport, WebSearchMapPlanningReport } from './web-search-map-planning-types'

export const WEB_SEARCH_MAP_PLANNING_LOCAL_REPORT_PATH = 'activation-logs/web-search-map-planning-e2e/phase50f/job-execution/phase50f-report.json'

export function buildWebSearchMapPlanningReport(): WebSearchMapPlanningReport {
  const executionReport = readLocalExecutionReport()
  if (executionReport) return executionToReport(executionReport)

  const evidenceChain = resolveWebSearchMapPlanningEvidenceChain()
  const planningSources = buildGeneratedPlanningSourceRecords()
  const locationCandidates = normalizePlanningSourcesToLocationCandidates(planningSources)
  const geojson = buildWebSearchMapPlanningGeoJson(locationCandidates)
  const turfCalculations = runWebSearchMapPlanningTurfCalculations(geojson)
  const qa = buildWebSearchMapPlanningQaSummary({
    evidenceChain,
    planningSources,
    locationCandidates,
    geojson,
    turfCalculations,
    preflightBlockers: ['Phase 50F execution has not run yet.'],
    publicAccessBlocked: true,
  })
  return {
    reportId: 'activation-phase-50f-web-search-map-planning-e2e',
    createdAt: new Date().toISOString(),
    phase: '50F',
    status: 'planned',
    config: webSearchMapPlanningConfig,
    evidenceChain,
    qa,
    safetyFlags: webSearchMapPlanningSafetyFlags,
    phase50GReadiness: 'blocked',
    blockers: qa.blockers,
    warnings: qa.warnings,
  }
}

export function summarizeWebSearchMapPlanningReport(report: WebSearchMapPlanningReport): string {
  return [
    'Phase 50F web search + map planning private E2E',
    `Status: ${report.status}`,
    `Run ID: ${report.executionReport?.runId ?? 'not_executed'}`,
    `Mode: ${report.config.mode}`,
    `Evidence status: ${report.evidenceChain.evidenceStatus}`,
    `Planning sources: ${report.executionReport?.planningSources.length ?? 'not_executed'}`,
    `Location candidates: ${report.executionReport?.locationCandidates.length ?? 'not_executed'}`,
    `2D screenshot: ${report.executionReport?.map2D.renderMetadata?.screenshotDimensions ? `${report.executionReport.map2D.renderMetadata.screenshotDimensions.width}x${report.executionReport.map2D.renderMetadata.screenshotDimensions.height}` : 'not_executed'}`,
    `3D screenshot: ${report.executionReport?.map3D.renderMetadata?.screenshotDimensions ? `${report.executionReport.map3D.renderMetadata.screenshotDimensions.width}x${report.executionReport.map3D.renderMetadata.screenshotDimensions.height}` : 'not_executed'}`,
    `Phase50G readiness: ${report.phase50GReadiness}`,
    'Live search/geocoding/routing/tiles/paid providers/production/beta: blocked',
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

function executionToReport(executionReport: WebSearchMapPlanningExecutionReport): WebSearchMapPlanningReport {
  return {
    reportId: 'activation-phase-50f-web-search-map-planning-e2e',
    createdAt: new Date().toISOString(),
    phase: '50F',
    status: executionReport.ok ? 'completed' : 'blocked',
    config: webSearchMapPlanningConfig,
    executionReport,
    evidenceChain: executionReport.evidenceChain,
    qa: executionReport.qa,
    safetyFlags: webSearchMapPlanningSafetyFlags,
    phase50GReadiness: executionReport.phase50GReadiness,
    blockers: executionReport.blockers,
    warnings: executionReport.warnings,
  }
}

function readLocalExecutionReport(): WebSearchMapPlanningExecutionReport | undefined {
  if (!existsSync(WEB_SEARCH_MAP_PLANNING_LOCAL_REPORT_PATH)) return undefined
  try {
    return JSON.parse(readFileSync(WEB_SEARCH_MAP_PLANNING_LOCAL_REPORT_PATH, 'utf8')) as WebSearchMapPlanningExecutionReport
  } catch {
    return undefined
  }
}
