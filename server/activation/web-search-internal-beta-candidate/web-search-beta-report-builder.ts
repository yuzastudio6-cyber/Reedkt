import { existsSync, readFileSync } from 'node:fs'
import { resolveWebSearchInternalBetaEvidenceChain } from './web-search-beta-evidence-resolver'
import { buildWebSearchBetaArtifactAudit } from './web-search-beta-artifact-audit'
import { buildWebSearchBetaFailurePolicy } from './web-search-beta-failure-policy'
import { buildWebSearchBetaProviderAudit } from './web-search-beta-provider-audit'
import { buildWebSearchBetaRegressionAudit } from './web-search-beta-regression-audit'
import { buildWebSearchInternalBetaQaSummary } from './web-search-beta-qa-summary'
import { buildWebSearchInternalBetaScopeManifest } from './web-search-beta-scope-manifest'
import { buildWebSearchBetaUiApiAudit } from './web-search-beta-ui-api-audit'
import { webSearchInternalBetaConfig, webSearchInternalBetaSafetyFlags } from './web-search-internal-beta-policy'
import type {
  WebSearchInternalBetaExecutionReport,
  WebSearchInternalBetaReport,
} from './web-search-internal-beta-types'
import type { SearchProviderSecretAudit, SearchProviderServiceAudit } from '../search-provider-readiness'

export const WEB_SEARCH_INTERNAL_BETA_LOCAL_REPORT_PATH = 'activation-logs/web-search-internal-beta-candidate/phase49p/job-execution/phase49p-report.json'

export function buildWebSearchInternalBetaReport(): WebSearchInternalBetaReport {
  const executionReport = readLocalExecutionReport()
  if (executionReport) return executionToReport(executionReport)

  const evidenceChain = resolveWebSearchInternalBetaEvidenceChain()
  const providerAudit = buildWebSearchBetaProviderAudit({
    evidenceChain,
    serviceAudit: plannedServiceAudit(),
    secretAudit: plannedSecretAudit(),
  })
  const uiApiAudit = buildWebSearchBetaUiApiAudit({ evidenceChain })
  const regressionAudit = buildWebSearchBetaRegressionAudit({ evidenceChain })
  const artifactAudit = buildWebSearchBetaArtifactAudit({ evidenceChain, staticMode: true })
  const failurePolicy = buildWebSearchBetaFailurePolicy()
  const scopeManifest = buildWebSearchInternalBetaScopeManifest({ runId: 'phase49p-planned', ready: false })
  const qa = buildWebSearchInternalBetaQaSummary({
    evidenceChain,
    scopeManifest,
    providerAudit,
    uiApiAudit,
    regressionAudit,
    artifactAudit,
    failurePolicy,
    executionBlockers: ['Phase 49P execution has not run yet.'],
  })
  return {
    reportId: 'activation-phase-49p-web-search-internal-beta-candidate',
    createdAt: new Date().toISOString(),
    phase: '49P',
    status: 'planned',
    config: webSearchInternalBetaConfig,
    evidenceChain,
    scopeManifest,
    providerAudit,
    uiApiAudit,
    regressionAudit,
    artifactAudit,
    failurePolicy,
    qa,
    safetyFlags: webSearchInternalBetaSafetyFlags,
    webSearchInternalBetaCandidateReady: false,
    phase50AReadiness: 'blocked_until_phase49p_execution_passes',
    blockers: qa.blockers,
    warnings: qa.warnings,
  }
}

export function summarizeWebSearchInternalBetaReport(report: WebSearchInternalBetaReport): string {
  return [
    'Phase 49P web search/capture internal beta candidate gate',
    `Status: ${report.status}`,
    `Run ID: ${report.executionReport?.runId ?? 'not_executed'}`,
    `Evidence phases: ${report.evidenceChain.phases.map((phase) => `${phase.phase}:${phase.status}`).join(', ')}`,
    `Evidence status: ${report.evidenceChain.evidenceStatus}`,
    `Provider readiness: SearXNG=${report.providerAudit.searxngDefaultReady}, Brave optional=${report.providerAudit.braveOptionalReady}, hybrid=${report.providerAudit.hybridConsensusReady}`,
    `UI/API gating: ${report.uiApiAudit.blockers.length === 0}`,
    `Regression suite: ${report.regressionAudit.passedCount}/${report.regressionAudit.scenarioCount} passed`,
    `Web search internal beta candidate ready: ${report.webSearchInternalBetaCandidateReady}`,
    `Phase50A readiness: ${report.phase50AReadiness}`,
    `Production/external beta/broad media: blocked`,
    `Public SearXNG/broad crawling/arbitrary URL capture: blocked`,
    `Raw Brave response/snippet storage: blocked`,
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

function executionToReport(executionReport: WebSearchInternalBetaExecutionReport): WebSearchInternalBetaReport {
  return {
    reportId: 'activation-phase-49p-web-search-internal-beta-candidate',
    createdAt: new Date().toISOString(),
    phase: '49P',
    status: executionReport.ok ? 'completed' : 'blocked',
    config: executionReport.config,
    executionReport,
    evidenceChain: executionReport.evidenceChain,
    scopeManifest: executionReport.scopeManifest,
    providerAudit: executionReport.providerAudit,
    uiApiAudit: executionReport.uiApiAudit,
    regressionAudit: executionReport.regressionAudit,
    artifactAudit: executionReport.artifactAudit,
    failurePolicy: executionReport.failurePolicy,
    qa: executionReport.qa,
    safetyFlags: webSearchInternalBetaSafetyFlags,
    webSearchInternalBetaCandidateReady: executionReport.webSearchInternalBetaCandidateReady,
    phase50AReadiness: executionReport.phase50AReadiness,
    blockers: executionReport.blockers,
    warnings: executionReport.warnings,
  }
}

function readLocalExecutionReport(): WebSearchInternalBetaExecutionReport | undefined {
  if (!existsSync(WEB_SEARCH_INTERNAL_BETA_LOCAL_REPORT_PATH)) return undefined
  try {
    return JSON.parse(readFileSync(WEB_SEARCH_INTERNAL_BETA_LOCAL_REPORT_PATH, 'utf8')) as WebSearchInternalBetaExecutionReport
  } catch {
    return undefined
  }
}

function plannedServiceAudit(): SearchProviderServiceAudit {
  return {
    serviceName: webSearchInternalBetaConfig.serviceName,
    exists: false,
    projectId: webSearchInternalBetaConfig.projectId,
    region: webSearchInternalBetaConfig.region,
    serviceUrlRedacted: 'not_checked',
    gpuDetected: false,
    modelWeightsDetected: false,
    allUsersPresent: false,
    allAuthenticatedUsersPresent: false,
    invokerMembers: [],
    publicUnauthenticatedAccess: false,
    metadataSource: 'not_checked',
    blockers: ['Phase 49P has not inspected Cloud Run metadata yet.'],
    warnings: [],
  }
}

function plannedSecretAudit(): SearchProviderSecretAudit {
  return {
    secretName: 'BRAVE_SEARCH_API_KEY',
    projectId: 'reeditpro',
    checkedWithoutAccessingValue: true,
    secretExists: false,
    enabledVersionPresent: false,
    approvedServiceAccounts: [
      'serviceAccount:reeditpro-stg-api-sa@reeditpro.iam.gserviceaccount.com',
      'serviceAccount:reeditpro-stg-cpu-worker-sa@reeditpro.iam.gserviceaccount.com',
    ],
    approvedServiceAccountsHaveAccess: false,
    missingApprovedServiceAccounts: [],
    allUsersPresent: false,
    allAuthenticatedUsersPresent: false,
    broadAccessDetected: false,
    secretValueAccessed: false,
    secretValuePrinted: false,
    blockers: ['Phase 49P has not inspected Secret Manager metadata yet.'],
    warnings: [],
  }
}
