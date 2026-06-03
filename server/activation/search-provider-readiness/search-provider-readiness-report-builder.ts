import { existsSync, readFileSync } from 'node:fs'
import { resolveSearchProviderEvidenceChain } from './search-provider-evidence-resolver'
import { buildSearchProviderCostAudit } from './search-provider-cost-audit'
import { buildSearchProviderFailurePolicy } from './search-provider-failure-policy'
import { buildSearchProviderRegistryAudit } from './search-provider-registry-audit'
import { searchProviderReadinessConfig, searchProviderReadinessSafetyFlags } from './search-provider-readiness-policy'
import { buildSearchProviderReadinessQaSummary } from './search-provider-readiness-qa-summary'
import { buildSearchProviderScopeManifest } from './search-provider-scope-manifest'
import { buildSearchProviderStoragePolicyAudit } from './search-provider-storage-policy-audit'
import type {
  SearchProviderArtifactVerificationEntry,
  SearchProviderReadinessExecutionReport,
  SearchProviderReadinessReport,
  SearchProviderSecretAudit,
  SearchProviderServiceAudit,
} from './search-provider-readiness-types'

export const SEARCH_PROVIDER_READINESS_LOCAL_REPORT_PATH = 'activation-logs/search-provider-readiness/phase49n/job-execution/phase49n-report.json'

export function buildSearchProviderReadinessReport(): SearchProviderReadinessReport {
  const executionReport = readLocalExecutionReport()
  if (executionReport) return executionToReport(executionReport)

  const evidenceChain = resolveSearchProviderEvidenceChain()
  const providerRegistryAudit = buildSearchProviderRegistryAudit({ searxngInternalReady: false })
  const serviceAudit = plannedServiceAudit()
  const secretAudit = plannedSecretAudit()
  const costAudit = buildSearchProviderCostAudit()
  const storagePolicyAudit = buildSearchProviderStoragePolicyAudit()
  const failurePolicy = buildSearchProviderFailurePolicy()
  const artifactVerification = plannedArtifactVerification(evidenceChain.phases.flatMap((phase) => phase.artifactUris.map((gcsUri, index) => ({
    artifactId: `${phase.phase.toLowerCase()}-${index + 1}`,
    phase: phase.phase,
    gcsUri,
    required: true,
  }))))
  const scopeManifest = buildSearchProviderScopeManifest({
    runId: 'phase49n-planned',
    searxngInternalReady: false,
    braveOptionalFallbackReady: false,
    hybridConsensusReady: evidenceChain.phases.some((phase) => phase.phase === '49M' && phase.status === 'completed'),
    ready: false,
  })
  const qa = buildSearchProviderReadinessQaSummary({
    evidenceChain,
    scopeManifest,
    providerRegistryAudit,
    serviceAudit,
    secretAudit,
    costAudit,
    storagePolicyAudit,
    failurePolicy,
    artifactVerification,
    executionBlockers: ['Phase 49N execution has not run yet.'],
  })
  return {
    reportId: 'activation-phase-49n-search-provider-readiness-gate',
    createdAt: new Date().toISOString(),
    phase: '49N',
    status: 'planned',
    config: searchProviderReadinessConfig,
    evidenceChain,
    scopeManifest,
    providerRegistryAudit,
    serviceAudit,
    secretAudit,
    costAudit,
    storagePolicyAudit,
    failurePolicy,
    artifactVerification,
    qa,
    searchProviderInternalTestingReady: false,
    phase49OReadiness: 'blocked_until_phase49n_execution_passes',
    blockers: qa.blockers,
    warnings: qa.warnings,
    safetyFlags: searchProviderReadinessSafetyFlags,
  }
}

export function summarizeSearchProviderReadinessReport(report: SearchProviderReadinessReport): string {
  return [
    'Phase 49N search provider readiness gate',
    `Status: ${report.status}`,
    `Run ID: ${report.executionReport?.runId ?? 'not_executed'}`,
    `Evidence phases: ${report.evidenceChain.phases.map((phase) => `${phase.phase}:${phase.status}`).join(', ')}`,
    `SearXNG default ready: ${report.scopeManifest.searxngInternalReady}`,
    `Brave optional fallback ready: ${report.scopeManifest.braveOptionalFallbackReady}`,
    `Hybrid consensus ready: ${report.scopeManifest.hybridConsensusReady}`,
    `Search provider internal testing ready: ${report.searchProviderInternalTestingReady}`,
    `Phase49O readiness: ${report.phase49OReadiness}`,
    `Raw Brave storage/snippet storage: blocked`,
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

function executionToReport(executionReport: SearchProviderReadinessExecutionReport): SearchProviderReadinessReport {
  return {
    reportId: 'activation-phase-49n-search-provider-readiness-gate',
    createdAt: new Date().toISOString(),
    phase: '49N',
    status: executionReport.ok ? 'completed' : 'blocked',
    config: executionReport.config,
    executionReport,
    evidenceChain: executionReport.evidenceChain,
    scopeManifest: executionReport.scopeManifest,
    providerRegistryAudit: executionReport.providerRegistryAudit,
    serviceAudit: executionReport.serviceAudit,
    secretAudit: executionReport.secretAudit,
    costAudit: executionReport.costAudit,
    storagePolicyAudit: executionReport.storagePolicyAudit,
    failurePolicy: executionReport.failurePolicy,
    artifactVerification: executionReport.artifactVerification,
    qa: executionReport.qa,
    searchProviderInternalTestingReady: executionReport.searchProviderInternalTestingReady,
    phase49OReadiness: executionReport.phase49OReadiness,
    blockers: executionReport.blockers,
    warnings: executionReport.warnings,
    safetyFlags: searchProviderReadinessSafetyFlags,
  }
}

function readLocalExecutionReport(): SearchProviderReadinessExecutionReport | undefined {
  if (!existsSync(SEARCH_PROVIDER_READINESS_LOCAL_REPORT_PATH)) return undefined
  try {
    return JSON.parse(readFileSync(SEARCH_PROVIDER_READINESS_LOCAL_REPORT_PATH, 'utf8')) as SearchProviderReadinessExecutionReport
  } catch {
    return undefined
  }
}

function plannedArtifactVerification(entries: SearchProviderArtifactVerificationEntry[]): SearchProviderArtifactVerificationEntry[] {
  return entries.map((entry) => ({
    ...entry,
    privateOnly: entry.gcsUri.startsWith('gs://reeditpro-staging-reeditpro-'),
    warning: 'Static report mode does not verify GCS object metadata.',
  }))
}

function plannedServiceAudit(): SearchProviderServiceAudit {
  return {
    serviceName: searchProviderReadinessConfig.serviceName,
    exists: false,
    projectId: searchProviderReadinessConfig.projectId,
    region: searchProviderReadinessConfig.region,
    serviceUrlRedacted: 'not_checked',
    gpuDetected: false,
    modelWeightsDetected: false,
    allUsersPresent: false,
    allAuthenticatedUsersPresent: false,
    invokerMembers: [],
    publicUnauthenticatedAccess: false,
    metadataSource: 'not_checked',
    blockers: ['Phase 49N has not inspected Cloud Run metadata yet.'],
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
    blockers: ['Phase 49N has not inspected Secret Manager metadata yet.'],
    warnings: [],
  }
}
