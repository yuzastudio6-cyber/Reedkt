import { existsSync, readFileSync } from 'node:fs'
import { getApprovedWebSearchCaptureReadinessEvidence } from '../web-search-capture-readiness'
import { getApprovedWebSearchUiApiGatingEvidence } from './approved-web-search-ui-api-gating-evidence'
import { buildDefaultWebSearchUiApiRequest, buildWebSearchUiApiPlanSnapshot, buildWebSearchUiApiRouteAudit, buildWebSearchUiApiRunEnvelope } from './web-search-ui-api-contract'
import { webSearchUiApiGatingConfig, webSearchUiApiGatingSafetyFlags } from './web-search-ui-api-gating-policy'
import type {
  ApprovedWebSearchUiApiGatingEvidence,
  WebSearchUiApiExecutionReport,
  WebSearchUiApiGatingReport,
} from './web-search-ui-api-gating-types'
import { buildWebSearchUiApiQaSummary } from './web-search-ui-api-qa-summary'
import { validateWebSearchUiApiRequest } from './web-search-ui-api-request-validator'
import { buildWebSearchUiApiUxState } from './web-search-ui-api-ux-state'

export const WEB_SEARCH_UI_API_GATING_LOCAL_REPORT_PATH = 'activation-logs/web-search-ui-api-gating/phase49i/job-execution/phase49i-report.json'

export function buildWebSearchUiApiGatingReport(): WebSearchUiApiGatingReport {
  const approvedEvidence = getApprovedWebSearchUiApiGatingEvidence()
  const executionReport = readLocalExecutionReport()
  const request = buildDefaultWebSearchUiApiRequest()
  const routeAudit = executionReport?.routeAudit ?? buildWebSearchUiApiRouteAudit()
  const requestValidation = executionReport?.requestValidation ?? validateWebSearchUiApiRequest(request)
  const planSnapshot = executionReport?.planSnapshot ?? buildWebSearchUiApiPlanSnapshot({ request })
  const runEnvelope = executionReport?.runEnvelope ?? buildWebSearchUiApiRunEnvelope({ planSnapshot })
  const uxState = executionReport?.uxState ?? buildWebSearchUiApiUxState()
  const qa = executionReport?.qa ?? buildWebSearchUiApiQaSummary({
    routeAudit,
    requestValidation,
    uxState,
    docsConsistent: docsConsistent(),
    artifacts: executionReport?.artifacts,
  })
  const status = executionReport ? (executionReport.ok ? 'completed' : 'blocked') : approvedEvidence.status
  const internalApiRoutesReady = executionReport?.ok ?? approvedEvidence.internalApiRoutesReady
  const internalUxGateReady = executionReport?.ok ?? approvedEvidence.internalUxGateReady
  const phase49JReadiness = executionReport?.phase49JReadiness ?? approvedEvidence.phase49JReadiness
  const blockers = status === 'completed' ? qa.blockers : Array.from(new Set([...approvedEvidence.blockers, ...qa.blockers]))
  const warnings = Array.from(new Set([...approvedEvidence.warnings, ...qa.warnings, ...(executionReport?.warnings ?? [])]))
  return {
    reportId: 'activation-phase-49i-web-search-ui-api-gating',
    createdAt: new Date().toISOString(),
    phase: '49I',
    status,
    config: webSearchUiApiGatingConfig,
    approvedEvidence,
    executionReport,
    routeAudit,
    requestValidation,
    planSnapshot,
    runEnvelope,
    uxState,
    qa,
    internalApiRoutesReady: internalApiRoutesReady && qa.status === 'passed',
    internalUxGateReady: internalUxGateReady && qa.status === 'passed',
    phase49JReadiness,
    blockers,
    warnings,
    safetyFlags: webSearchUiApiGatingSafetyFlags,
  }
}

export function summarizeWebSearchUiApiGatingReport(report: WebSearchUiApiGatingReport): string {
  const phase49H = getApprovedWebSearchCaptureReadinessEvidence()
  return [
    'Phase 49I web search/capture UI API gating',
    `Status: ${report.status}`,
    `Run ID: ${report.executionReport?.runId ?? report.approvedEvidence.runId ?? 'not_executed'}`,
    `Phase 49H evidence: ${phase49H.runId ?? 'not_recorded'} (${phase49H.status})`,
    `Private SearXNG service: ${report.config.serviceName}`,
    `Routes gate-only: ${report.routeAudit.allRoutesGateOnly}`,
    `Request validator passed: ${report.requestValidation.ok}`,
    `Internal UX ready: ${report.internalUxGateReady}`,
    `Phase49J readiness: ${report.phase49JReadiness}`,
    'Live search/browser capture/Readability/paid providers: blocked',
    'Production/external beta/broad media: blocked',
    '',
    'QA gates:',
    ...report.qa.gates.map((gate) => `- ${gate.gateId}: ${gate.passed ? 'passed' : 'blocked'} - ${gate.summary}`),
    '',
    'Artifacts:',
    ...artifactLines(report),
    '',
    'Blockers:',
    ...(report.blockers.length ? report.blockers.map((blocker) => `- ${blocker}`) : ['- none']),
  ].join('\n')
}

export function webSearchUiApiGatingEvidenceToTypeScript(evidence: ApprovedWebSearchUiApiGatingEvidence): string {
  return `import type { ApprovedWebSearchUiApiGatingEvidence } from './web-search-ui-api-gating-types'

export const approvedWebSearchUiApiGatingEvidence: ApprovedWebSearchUiApiGatingEvidence = ${JSON.stringify(evidence, null, 2)}

export function getApprovedWebSearchUiApiGatingEvidence(): ApprovedWebSearchUiApiGatingEvidence {
  return {
    ...approvedWebSearchUiApiGatingEvidence,
    blockers: [...approvedWebSearchUiApiGatingEvidence.blockers],
    warnings: [...approvedWebSearchUiApiGatingEvidence.warnings],
  }
}
`
}

function artifactLines(report: WebSearchUiApiGatingReport): string[] {
  if (report.executionReport?.artifacts.length) return report.executionReport.artifacts.map((artifact) => `- ${artifact.gcsUri}`)
  const artifacts = [
    report.approvedEvidence.planSnapshotUri,
    report.approvedEvidence.routeGateAuditUri,
    report.approvedEvidence.requestValidationUri,
    report.approvedEvidence.uxStateUri,
    report.approvedEvidence.qaReportUri,
    report.approvedEvidence.phase49iReportUri,
  ].filter((uri): uri is string => Boolean(uri))
  return artifacts.length ? artifacts.map((artifact) => `- ${artifact}`) : ['- none recorded locally yet']
}

function readLocalExecutionReport(): WebSearchUiApiExecutionReport | undefined {
  if (!existsSync(WEB_SEARCH_UI_API_GATING_LOCAL_REPORT_PATH)) return undefined
  try {
    return JSON.parse(readFileSync(WEB_SEARCH_UI_API_GATING_LOCAL_REPORT_PATH, 'utf8')) as WebSearchUiApiExecutionReport
  } catch {
    return undefined
  }
}

function docsConsistent(): boolean {
  const requiredDocs = [
    'docs/activation-web-search-ui-api-gating-runbook.md',
    'docs/activation-web-search-ui-api-gating-policy.md',
    'docs/activation-web-search-ui-api-gating-qa-policy.md',
    'docs/activation-phase-49i-web-search-ui-api-gating-results.md',
  ]
  return requiredDocs.every((doc) => existsSync(doc))
}
