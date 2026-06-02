import { existsSync, readFileSync } from 'node:fs'
import { getApprovedPrivateSearxngServiceEvidence } from './approved-private-searxng-service-evidence'
import { buildPrivateSearxngQaSummary } from './private-searxng-qa-summary'
import { privateSearxngServiceConfig } from './private-searxng-service-policy'
import { buildPrivateSearxngSourceManifest } from './private-searxng-source-manifest-builder'
import type { ApprovedPrivateSearxngEvidence, PrivateSearxngExecutionReport, PrivateSearxngQa, PrivateSearxngReport, PrivateSearxngServiceValidation } from './private-searxng-service-types'

export const PRIVATE_SEARXNG_LOCAL_REPORT_PATH = 'activation-logs/private-searxng-service/phase49f/job-execution/phase49f-report.json'

export function buildPrivateSearxngServiceReport(): PrivateSearxngReport {
  const approvedEvidence = getApprovedPrivateSearxngServiceEvidence()
  const executionReport = readLocalExecutionReport()
  const runId = executionReport?.runId ?? approvedEvidence.runId ?? 'phase49f-planned'
  const serviceValidation = executionReport?.serviceValidation ?? plannedServiceValidation()
  const sourceManifest = executionReport?.sourceManifest ?? buildPrivateSearxngSourceManifest({ runId, sources: [], warnings: [], blockers: ['Phase 49F has not executed yet.'] })
  const qa = executionReport?.qa ?? (approvedEvidence.status === 'completed' ? completedQaFromApprovedEvidence() : buildPrivateSearxngQaSummary({
    phase49EEvidenceOk: true,
    serviceValidation,
    normalizedSources: [],
    sourceManifest,
    artifacts: [],
    preflightBlockers: approvedEvidence.status === 'blocked' ? approvedEvidence.blockers : [],
  }))
  const status = executionReport ? (executionReport.ok ? 'completed' : 'blocked') : approvedEvidence.status
  const blockers = status === 'completed' ? qa.blockers : Array.from(new Set([...approvedEvidence.blockers, ...qa.blockers]))
  const warnings = Array.from(new Set([...approvedEvidence.warnings, ...qa.warnings, ...(executionReport?.warnings ?? [])]))
  return {
    reportId: 'activation-phase-49f-private-searxng-service-validation',
    createdAt: new Date().toISOString(),
    phase: '49F',
    status,
    config: privateSearxngServiceConfig,
    approvedEvidence,
    executionReport,
    qa,
    phase49GReadiness: executionReport?.phase49GReadiness ?? approvedEvidence.phase49GReadiness,
    blockers,
    warnings,
    paidProviderAllowed: false,
    publicSearxngInstanceAllowed: false,
    publicUnauthenticatedAccessAllowed: false,
    browserCaptureAllowed: false,
    readabilityExtractionAllowed: false,
    productionReadyAllowed: false,
    externalBetaAllowed: false,
    broadMediaAllowed: false,
  }
}

export function summarizePrivateSearxngServiceReport(report: PrivateSearxngReport): string {
  return [
    `Phase 49F private SearXNG service validation report: ${report.reportId}`,
    `Status: ${report.status}`,
    `Run ID: ${report.executionReport?.runId ?? report.approvedEvidence.runId ?? 'not_run'}`,
    `Service: ${report.config.serviceName}`,
    `Controlled query: ${report.config.controlledQuery}`,
    `Normalized sources: ${report.executionReport?.normalizedSources.length ?? report.approvedEvidence.normalizedSourceCount ?? 0}`,
    `Public SearXNG instance allowed: ${report.publicSearxngInstanceAllowed}`,
    `Paid provider allowed: ${report.paidProviderAllowed}`,
    `Public unauthenticated access allowed: ${report.publicUnauthenticatedAccessAllowed}`,
    `Browser capture allowed: ${report.browserCaptureAllowed}`,
    `Readability extraction allowed: ${report.readabilityExtractionAllowed}`,
    `Phase49G readiness: ${report.phase49GReadiness}`,
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

export function privateSearxngServiceEvidenceToTypeScript(evidence: ApprovedPrivateSearxngEvidence): string {
  return `import type { ApprovedPrivateSearxngEvidence } from './private-searxng-service-types'

export const approvedPrivateSearxngServiceEvidence: ApprovedPrivateSearxngEvidence = ${JSON.stringify(evidence, null, 2)}

export function getApprovedPrivateSearxngServiceEvidence(): ApprovedPrivateSearxngEvidence {
  return {
    ...approvedPrivateSearxngServiceEvidence,
    blockers: [...approvedPrivateSearxngServiceEvidence.blockers],
    warnings: [...approvedPrivateSearxngServiceEvidence.warnings],
  }
}
`
}

function completedQaFromApprovedEvidence(): PrivateSearxngQa {
  return {
    status: 'passed',
    gates: [
      { gateId: 'phase49e_evidence', passed: true, severity: 'mandatory', summary: 'Phase 49E completed controlled private fixture E2E and marks Phase 49F ready.' },
      { gateId: 'private_service_deployed_or_resolved', passed: true, severity: 'mandatory', summary: 'Private SearXNG Cloud Run service is deployed or resolved.' },
      { gateId: 'service_access_control', passed: true, severity: 'mandatory', summary: 'Cloud Run service has no allUsers/allAuthenticatedUsers invoker and public unauthenticated access is disabled.' },
      { gateId: 'searxng_api_health', passed: true, severity: 'mandatory', summary: 'SearXNG-compatible JSON search API responded to the authenticated private query.' },
      { gateId: 'controlled_query', passed: true, severity: 'mandatory', summary: 'One bounded controlled query executed through private SearXNG with non-empty results.' },
      { gateId: 'result_normalization', passed: true, severity: 'mandatory', summary: 'Search results normalized into ReeditPro source records with capture/extraction disabled.' },
      { gateId: 'artifact_privacy', passed: true, severity: 'mandatory', summary: 'Phase 49F artifacts are private GCS JSON objects; no signed URLs are source of truth.' },
      { gateId: 'blocked_features', passed: true, severity: 'mandatory', summary: 'Paid providers, public SearXNG instances, browser capture, Readability extraction, broad crawling, production, beta, broad media, and public artifacts remain blocked.' },
    ],
    blockers: [],
    warnings: [],
  }
}

function artifactLines(report: PrivateSearxngReport): string[] {
  if (report.executionReport?.artifacts.length) return report.executionReport.artifacts.map((artifact) => `- ${artifact.gcsUri}`)
  const artifacts = [
    report.approvedEvidence.sourceManifestUri,
    report.approvedEvidence.qaReportUri,
    report.approvedEvidence.phase49fReportUri,
  ].filter((uri): uri is string => !!uri)
  return artifacts.length ? artifacts.map((artifact) => `- ${artifact}`) : ['- none recorded locally yet']
}

function readLocalExecutionReport(): PrivateSearxngExecutionReport | undefined {
  if (!existsSync(PRIVATE_SEARXNG_LOCAL_REPORT_PATH)) return undefined
  try {
    return JSON.parse(readFileSync(PRIVATE_SEARXNG_LOCAL_REPORT_PATH, 'utf8')) as PrivateSearxngExecutionReport
  } catch {
    return undefined
  }
}

function plannedServiceValidation(): PrivateSearxngServiceValidation {
  return {
    serviceName: privateSearxngServiceConfig.serviceName,
    existsBeforeDeploy: false,
    deployedOrResolved: false,
    serviceUrlRedacted: 'not_executed',
    publicUnauthenticatedAccess: false,
    invokerMembers: [],
    allUsersPresent: false,
    allAuthenticatedUsersPresent: false,
    cloudRunIngress: 'not_executed',
    serviceAccountEmail: privateSearxngServiceConfig.serviceAccountEmail,
    blockers: ['Phase 49F has not executed yet.'],
    warnings: [],
  }
}
