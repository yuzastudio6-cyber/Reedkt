import { existsSync, readFileSync } from 'node:fs'
import { getApprovedWebSearchCaptureReadinessEvidence } from './approved-web-search-capture-readiness-evidence'
import { buildPlannedWebSearchArtifactVerification } from './web-search-artifact-verifier'
import { webSearchCaptureReadinessConfig, webSearchCaptureReadinessSafetyFlags } from './web-search-capture-readiness-policy'
import { resolveWebSearchCaptureEvidenceChain } from './web-search-evidence-resolver'
import { buildWebSearchFailurePolicy } from './web-search-failure-policy'
import { buildWebSearchInternalScopeManifest } from './web-search-internal-scope-manifest'
import { buildWebSearchProviderGateAudit } from './web-search-provider-gate'
import { buildWebSearchReadinessQaSummary } from './web-search-readiness-qa-summary'
import type {
  ApprovedWebSearchCaptureReadinessEvidence,
  WebSearchReadinessExecutionReport,
  WebSearchReadinessReport,
  WebSearchServiceAccessAudit,
} from './web-search-capture-readiness-types'

export const WEB_SEARCH_CAPTURE_READINESS_LOCAL_REPORT_PATH = 'activation-logs/web-search-capture-readiness/phase49h/job-execution/phase49h-report.json'

export function buildWebSearchCaptureReadinessReport(): WebSearchReadinessReport {
  const approvedEvidence = getApprovedWebSearchCaptureReadinessEvidence()
  const executionReport = readLocalExecutionReport()
  const evidenceChain = executionReport?.evidenceChain ?? resolveWebSearchCaptureEvidenceChain()
  const artifactVerification = executionReport?.artifactVerification ?? buildPlannedWebSearchArtifactVerification(evidenceChain)
  const serviceAccessAudit = executionReport?.serviceAccessAudit ?? plannedServiceAccessAudit()
  const providerGateAudit = executionReport?.providerGateAudit ?? buildWebSearchProviderGateAudit()
  const phase49IReadiness = executionReport?.phase49IReadiness ?? approvedEvidence.phase49IReadiness
  const internalTestingReady = executionReport?.ok ?? approvedEvidence.webSearchCaptureInternalTestingReady
  const internalScopeManifest = executionReport?.internalScopeManifest ?? buildWebSearchInternalScopeManifest({
    runId: executionReport?.runId ?? approvedEvidence.runId ?? 'phase49h-planned',
    internalTestingReady,
    phase49IReadiness,
  })
  const failurePolicy = executionReport?.failurePolicy ?? buildWebSearchFailurePolicy()
  const qa = executionReport?.qa ?? buildWebSearchReadinessQaSummary({
    evidenceChain,
    providerGateAudit,
    artifactVerification,
    serviceAccessAudit,
    docsConsistent: docsConsistent(),
    executionBlockers: approvedEvidence.status === 'blocked' ? approvedEvidence.blockers : [],
    executionWarnings: approvedEvidence.warnings,
  })
  const status = executionReport ? (executionReport.ok ? 'completed' : 'blocked') : (approvedEvidence.runId ? approvedEvidence.status : 'planned')
  const blockers = status === 'completed' ? qa.blockers : Array.from(new Set([...approvedEvidence.blockers, ...qa.blockers]))
  const warnings = Array.from(new Set([...approvedEvidence.warnings, ...qa.warnings, ...(executionReport?.warnings ?? [])]))
  return {
    reportId: 'activation-phase-49h-web-search-capture-internal-readiness',
    createdAt: new Date().toISOString(),
    phase: '49H',
    status,
    config: webSearchCaptureReadinessConfig,
    approvedEvidence,
    executionReport,
    evidenceChain,
    internalScopeManifest,
    providerGateAudit,
    artifactVerification,
    serviceAccessAudit,
    failurePolicy,
    qa,
    phase49IReadiness,
    webSearchCaptureInternalTestingReady: internalTestingReady && qa.status === 'passed',
    blockers,
    warnings,
    safetyFlags: webSearchCaptureReadinessSafetyFlags,
  }
}

export function summarizeWebSearchCaptureReadinessReport(report: WebSearchReadinessReport): string {
  return [
    'Phase 49H web search/capture internal readiness gate',
    `Status: ${report.status}`,
    `Run ID: ${report.executionReport?.runId ?? report.approvedEvidence.runId ?? 'not_executed'}`,
    `Private SearXNG service: ${report.config.serviceName}`,
    `Evidence phases: ${report.evidenceChain.phases.map((phase) => `${phase.phase}:${phase.status}`).join(', ')}`,
    `Private SearXNG ready: ${report.serviceAccessAudit.exists && !report.serviceAccessAudit.publicUnauthenticatedAccess}`,
    `Internal testing ready: ${report.webSearchCaptureInternalTestingReady}`,
    `Phase49I readiness: ${report.phase49IReadiness}`,
    `Paid providers/public SearXNG/broad crawling: blocked`,
    `Production/external beta/broad media: blocked`,
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

export function webSearchCaptureReadinessEvidenceToTypeScript(evidence: ApprovedWebSearchCaptureReadinessEvidence): string {
  return `import type { ApprovedWebSearchCaptureReadinessEvidence } from './web-search-capture-readiness-types'

export const approvedWebSearchCaptureReadinessEvidence: ApprovedWebSearchCaptureReadinessEvidence = ${JSON.stringify(evidence, null, 2)}

export function getApprovedWebSearchCaptureReadinessEvidence(): ApprovedWebSearchCaptureReadinessEvidence {
  return {
    ...approvedWebSearchCaptureReadinessEvidence,
    blockers: [...approvedWebSearchCaptureReadinessEvidence.blockers],
    warnings: [...approvedWebSearchCaptureReadinessEvidence.warnings],
  }
}
`
}

function artifactLines(report: WebSearchReadinessReport): string[] {
  if (report.executionReport?.artifacts.length) return report.executionReport.artifacts.map((artifact) => `- ${artifact.gcsUri}`)
  const artifacts = [
    report.approvedEvidence.readinessManifestUri,
    report.approvedEvidence.evidenceChainUri,
    report.approvedEvidence.providerGateAuditUri,
    report.approvedEvidence.artifactVerificationUri,
    report.approvedEvidence.serviceAccessAuditUri,
    report.approvedEvidence.qaReportUri,
    report.approvedEvidence.phase49hReportUri,
  ].filter((uri): uri is string => Boolean(uri))
  return artifacts.length ? artifacts.map((artifact) => `- ${artifact}`) : ['- none recorded locally yet']
}

function readLocalExecutionReport(): WebSearchReadinessExecutionReport | undefined {
  if (!existsSync(WEB_SEARCH_CAPTURE_READINESS_LOCAL_REPORT_PATH)) return undefined
  try {
    return JSON.parse(readFileSync(WEB_SEARCH_CAPTURE_READINESS_LOCAL_REPORT_PATH, 'utf8')) as WebSearchReadinessExecutionReport
  } catch {
    return undefined
  }
}

function plannedServiceAccessAudit(): WebSearchServiceAccessAudit {
  return {
    serviceName: webSearchCaptureReadinessConfig.serviceName,
    exists: false,
    projectId: webSearchCaptureReadinessConfig.projectId,
    region: webSearchCaptureReadinessConfig.region,
    serviceUrlRedacted: 'not_checked',
    allUsersPresent: false,
    allAuthenticatedUsersPresent: false,
    invokerMembers: [],
    publicUnauthenticatedAccess: false,
    metadataSource: 'not_checked',
    blockers: ['Phase 49H has not executed Cloud Run metadata verification yet.'],
    warnings: [],
  }
}

function docsConsistent(): boolean {
  const requiredDocs = [
    'docs/activation-web-search-capture-readiness-runbook.md',
    'docs/activation-web-search-capture-readiness-policy.md',
    'docs/activation-web-search-capture-readiness-artifact-policy.md',
    'docs/activation-web-search-capture-readiness-qa-policy.md',
    'docs/activation-phase-49h-web-search-capture-readiness-results.md',
  ]
  return requiredDocs.every((doc) => existsSync(doc))
}
