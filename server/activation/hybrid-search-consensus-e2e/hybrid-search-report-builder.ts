import { existsSync, readFileSync } from 'node:fs'
import { buildBraveLiveBudgetGuard, buildBraveLiveApiValidationReport } from '../brave-live-api-validation'
import { buildHybridSearchPlanSnapshot } from './hybrid-search-plan-snapshot'
import { hybridSearchConfig } from './hybrid-search-consensus-policy'
import { buildHybridSearchQaSummary } from './hybrid-search-qa-summary'
import { buildHybridConsensusManifest } from './hybrid-consensus-manifest-builder'
import type {
  BraveLiveApiCallSummary,
  BraveLiveSecretMetadata,
  BraveLiveSecretResolution,
} from '../brave-live-api-validation'
import type {
  HybridConsensusReport,
  HybridSearchExecutionReport,
  HybridSearchReport,
} from './hybrid-search-consensus-types'

export const HYBRID_SEARCH_LOCAL_REPORT_PATH = 'activation-logs/hybrid-search-consensus-e2e/phase49m/job-execution/phase49m-report.json'

export function buildHybridSearchConsensusReport(): HybridSearchReport {
  const executionReport = readLocalExecutionReport()
  if (executionReport) {
    return {
      reportId: 'activation-phase-49m-hybrid-search-consensus-e2e',
      createdAt: new Date().toISOString(),
      phase: '49M',
      status: executionReport.ok ? 'completed' : 'blocked',
      config: hybridSearchConfig,
      executionReport,
      planSnapshot: executionReport.planSnapshot,
      qa: executionReport.qa,
      phase49NReadiness: executionReport.phase49NReadiness,
      searxngDefaultProvider: true,
      braveOptionalFallback: true,
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
  const runId = 'phase49m-planned'
  const planSnapshot = buildHybridSearchPlanSnapshot(runId)
  const phase49LReport = buildBraveLiveApiValidationReport()
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
  const braveApiCall: BraveLiveApiCallSummary = {
    attempted: false,
    completed: false,
    endpoint: hybridSearchConfig.braveEndpoint,
    method: 'GET',
    resultCount: 0,
    callCount: 0,
    requestHeadersStored: false,
    secretValuePrinted: false,
    rawResponseStored: false,
    snippetsStored: false,
    disallowedEndpointUsed: false,
  }
  const consensusReport: HybridConsensusReport = {
    query: hybridSearchConfig.query,
    searxngSourceCount: 0,
    braveSourceCount: 0,
    mergedSourceCount: 0,
    duplicateGroupCount: 0,
    duplicateGroups: [],
    providerAgreementScore: 0,
    sourceDiversityScore: 0,
    braveContributionCount: 0,
    searxngContributionCount: 0,
    searxngDefaultProvider: true,
    braveOptionalFallback: true,
    rawBraveResponseStored: false,
    braveSnippetStored: false,
    warnings: ['Static report mode does not run search, capture, or extraction.'],
    blockers: ['Live execution has not run yet.'],
  }
  const manifest = buildHybridConsensusManifest({
    runId,
    searxngSources: [],
    braveSources: [],
    mergedSources: [],
    duplicateGroups: [],
    selectedCaptureTargets: [],
    skippedCaptureTargets: [],
    captureRecords: [],
    sharpRecords: [],
    extractionRecords: [],
    warnings: ['Static report mode only.'],
    blockers: ['Live execution has not run yet.'],
  })
  const qa = buildHybridSearchQaSummary({
    phase49LEvidenceOk: phase49LReport.phase49MReadiness === 'ready_for_searxng_brave_hybrid_consensus_e2e',
    secret: safeSecret,
    secretMetadata,
    budget,
    braveApiCall,
    searxngSources: [],
    braveSources: [],
    mergedSources: [],
    consensusReport,
    captureRecords: [],
    sharpRecords: [],
    extractionRecords: [],
    manifest,
    blockers: ['Live execution has not run yet.'],
  })
  return {
    reportId: 'activation-phase-49m-hybrid-search-consensus-e2e',
    createdAt: new Date().toISOString(),
    phase: '49M',
    status: 'planned',
    config: hybridSearchConfig,
    planSnapshot,
    qa,
    phase49NReadiness: 'blocked',
    searxngDefaultProvider: true,
    braveOptionalFallback: true,
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

export function summarizeHybridSearchConsensusReport(report: HybridSearchReport): string {
  return [
    `Phase 49M SearXNG + Brave hybrid consensus E2E report: ${report.reportId}`,
    `Status: ${report.status}`,
    `Query: ${report.config.query}`,
    `SearXNG default provider: ${report.searxngDefaultProvider}`,
    `Brave optional fallback/confidence booster: ${report.braveOptionalFallback}`,
    `Raw Brave storage allowed: ${report.rawBraveStorageAllowed}`,
    `Snippets stored: ${report.snippetsStored}`,
    `Phase49N readiness: ${report.phase49NReadiness}`,
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

export function hybridSearchEvidenceToTypeScript(report: HybridSearchExecutionReport): string {
  return [
    'export const approvedHybridSearchConsensusEvidence = ',
    JSON.stringify({
      phase: report.phase,
      status: report.status,
      runId: report.runId,
      query: report.planSnapshot.query,
      searxngSourceCount: report.normalizedSearxngSources.length,
      braveSourceCount: report.normalizedBraveSources.length,
      mergedSourceCount: report.mergedSources.length,
      captureCount: report.captureRecords.length,
      extractionCount: report.extractionRecords.length,
      phase49NReadiness: report.phase49NReadiness,
      blockers: report.blockers,
      warnings: report.warnings,
    }, null, 2),
    ' as const\n',
  ].join('')
}

function readLocalExecutionReport(): HybridSearchExecutionReport | undefined {
  if (!existsSync(HYBRID_SEARCH_LOCAL_REPORT_PATH)) return undefined
  try {
    return JSON.parse(readFileSync(HYBRID_SEARCH_LOCAL_REPORT_PATH, 'utf8')) as HybridSearchExecutionReport
  } catch {
    return undefined
  }
}
