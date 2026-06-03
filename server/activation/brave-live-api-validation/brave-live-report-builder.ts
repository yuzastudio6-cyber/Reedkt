import { existsSync, readFileSync } from 'node:fs'
import { buildBraveLiveQueryPlan } from './brave-live-query-plan'
import { braveLiveApiConfig } from './brave-live-api-policy'
import { buildBraveLiveQaSummary } from './brave-live-qa-summary'
import { buildBraveLiveBudgetGuard } from './brave-live-budget-guard'
import { buildBraveLiveSourceManifest } from './brave-live-source-manifest-builder'
import type {
  BraveLiveApiCallSummary,
  BraveLiveExecutionReport,
  BraveLiveReport,
  BraveLiveSecretMetadata,
  BraveLiveSecretResolution,
} from './brave-live-api-types'

export const BRAVE_LIVE_LOCAL_REPORT_PATH = 'activation-logs/brave-live-api-validation/phase49l/job-execution/phase49l-report.json'

export function buildBraveLiveApiValidationReport(): BraveLiveReport {
  const executionReport = readLocalExecutionReport()
  if (executionReport) {
    return {
      reportId: 'activation-phase-49l-brave-live-api-validation',
      createdAt: new Date().toISOString(),
      phase: '49L',
      status: executionReport.ok ? 'completed' : 'blocked',
      config: braveLiveApiConfig,
      executionReport,
      planSnapshot: executionReport.planSnapshot,
      qa: executionReport.qa,
      phase49MReadiness: executionReport.phase49MReadiness,
      braveLiveApiValidated: executionReport.ok,
      rawBraveStorageAllowed: false,
      snippetsStored: false,
      productionReadyAllowed: false,
      externalBetaAllowed: false,
      paidProductionAllowed: false,
      broadMediaAllowed: false,
      blockers: executionReport.blockers,
      warnings: executionReport.warnings,
    }
  }

  const runId = 'phase49l-planned'
  const planSnapshot = buildBraveLiveQueryPlan(runId)
  const budget = buildBraveLiveBudgetGuard()
  const safeSecret: Omit<BraveLiveSecretResolution, 'secretValue'> = {
    configured: false,
    source: 'missing',
    secretName: 'BRAVE_SEARCH_API_KEY',
    secretVersion: 'latest',
    secretValuePrinted: false,
    secretValueStored: false,
    frontendExposure: false,
    blockers: ['Static report mode does not resolve the Brave Search secret.'],
    warnings: [],
  }
  const secretMetadata: BraveLiveSecretMetadata = {
    secretConfigured: false,
    secretName: 'BRAVE_SEARCH_API_KEY',
    projectId: 'reeditpro',
    secretVersion: 'latest',
    versionEnabled: false,
    approvedServiceAccountsHaveAccess: false,
    approvedServiceAccounts: [
      'serviceAccount:reeditpro-stg-api-sa@reeditpro.iam.gserviceaccount.com',
      'serviceAccount:reeditpro-stg-cpu-worker-sa@reeditpro.iam.gserviceaccount.com',
    ],
    missingServiceAccounts: [],
    publicAccessDetected: false,
    broadAccessDetected: false,
    iamChanges: [],
    blockers: ['Static report mode does not inspect Secret Manager metadata.'],
    warnings: [],
  }
  const apiCall: BraveLiveApiCallSummary = {
    attempted: false,
    completed: false,
    endpoint: braveLiveApiConfig.endpoint,
    method: 'GET',
    resultCount: 0,
    callCount: 0,
    requestHeadersStored: false,
    secretValuePrinted: false,
    rawResponseStored: false,
    snippetsStored: false,
    disallowedEndpointUsed: false,
  }
  const sourceManifest = buildBraveLiveSourceManifest({
    runId,
    sources: [],
    budget,
    secret: safeSecret,
    actualCallCount: 0,
    warnings: ['Static report mode does not call Brave Search.'],
    blockers: ['Live execution has not run yet.'],
  })
  const qa = buildBraveLiveQaSummary({
    secret: safeSecret,
    secretMetadata,
    budget,
    apiCall,
    normalizedSources: [],
    sourceManifest,
    blockers: ['Live execution has not run yet.'],
  })

  return {
    reportId: 'activation-phase-49l-brave-live-api-validation',
    createdAt: new Date().toISOString(),
    phase: '49L',
    status: 'planned',
    config: braveLiveApiConfig,
    planSnapshot,
    qa,
    phase49MReadiness: 'blocked',
    braveLiveApiValidated: false,
    rawBraveStorageAllowed: false,
    snippetsStored: false,
    productionReadyAllowed: false,
    externalBetaAllowed: false,
    paidProductionAllowed: false,
    broadMediaAllowed: false,
    blockers: qa.blockers,
    warnings: qa.warnings,
  }
}

export function summarizeBraveLiveApiValidationReport(report: BraveLiveReport): string {
  return [
    `Phase 49L Brave controlled live API validation report: ${report.reportId}`,
    `Status: ${report.status}`,
    `Provider: ${report.config.provider}`,
    `Endpoint: ${report.config.endpoint}`,
    `Max queries/results: ${report.config.maxQueriesPerRun}/${report.config.maxResults}`,
    `Brave live API validated: ${report.braveLiveApiValidated}`,
    `Phase49M readiness: ${report.phase49MReadiness}`,
    `Raw Brave storage allowed: ${report.rawBraveStorageAllowed}`,
    `Snippets stored: ${report.snippetsStored}`,
    `Production/external beta/broad media: blocked`,
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

function readLocalExecutionReport(): BraveLiveExecutionReport | undefined {
  if (!existsSync(BRAVE_LIVE_LOCAL_REPORT_PATH)) return undefined
  try {
    return JSON.parse(readFileSync(BRAVE_LIVE_LOCAL_REPORT_PATH, 'utf8')) as BraveLiveExecutionReport
  } catch {
    return undefined
  }
}
