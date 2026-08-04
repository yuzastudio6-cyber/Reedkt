import { existsSync, readFileSync } from 'node:fs'
import { getApprovedPrivateSearxngServiceEvidence } from './approved-private-searxng-service-evidence'
import { privateSearxngServiceConfig } from './private-searxng-service-policy'
import { buildPrivateSearxngSourceManifest } from './private-searxng-source-manifest-builder'
import { buildPrivateSearxngQaSummary } from './private-searxng-qa-summary'
import { createActivationLaunchPermissions } from '../activation-launch-permissions'
import type {
  ApprovedPrivateSearxngServiceEvidence,
  PrivateSearxngExecutionReport,
  PrivateSearxngServiceReport,
  PrivateSearxngServiceValidation,
} from './private-searxng-service-types'

export const PRIVATE_SEARXNG_LOCAL_REPORT_PATH = 'activation-logs/private-searxng-service/phase49f/job-execution/phase49f-report.json'

export function buildPrivateSearxngServiceReport(): PrivateSearxngServiceReport {
  const approvedEvidence = getApprovedPrivateSearxngServiceEvidence()
  const executionReport = readLocalExecutionReport()
  const runId = executionReport?.runId ?? approvedEvidence.runId ?? 'phase49f-planned'
  const serviceValidation = executionReport?.serviceValidation ?? plannedServiceValidation()
  const sourceManifest = executionReport?.sourceManifest ?? buildPrivateSearxngSourceManifest({ runId, sources: [], warnings: [], blockers: ['Phase 49F has not executed yet.'] })
  const qa = executionReport?.qa ?? buildPrivateSearxngQaSummary({
    phase49EEvidenceOk: true,
    serviceValidation,
    normalizedSources: executionReport?.normalizedSources ?? [],
    sourceManifest,
    artifacts: executionReport?.artifacts ?? [],
    preflightBlockers: approvedEvidence.status === 'blocked' ? approvedEvidence.blockers : [],
  })
  const status = executionReport
    ? (executionReport.ok ? 'completed' : 'blocked')
    : approvedEvidence.status
  const blockers = status === 'completed'
    ? qa.blockers
    : Array.from(new Set([...approvedEvidence.blockers, ...qa.blockers]))
  const warnings = Array.from(new Set([...approvedEvidence.warnings, ...qa.warnings, ...(executionReport?.warnings ?? [])]))
  const launchPermissions = createActivationLaunchPermissions({
    phaseQaPassed: qa.status === 'passed',
    phaseReadinessReady: (executionReport?.phase49GReadiness ?? approvedEvidence.phase49GReadiness) !== 'blocked',
    privateArtifactsOnly: true,
    publicAccessBlocked: true,
    broadMediaBlocked: true,
  })
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
    productionReadyAllowed: launchPermissions.productionReadyAllowed,
    externalBetaAllowed: launchPermissions.externalBetaAllowed,
    paidProductionAllowed: launchPermissions.paidProductionAllowed,
    broadMediaAllowed: false,
  }
}

export function summarizePrivateSearxngServiceReport(report: PrivateSearxngServiceReport): string {
  return [
    `Phase 49F private SearXNG service validation report: ${report.reportId}`,
    `Status: ${report.status}`,
    `Run ID: ${report.executionReport?.runId ?? report.approvedEvidence.runId ?? 'not_run'}`,
    `Service: ${report.config.serviceName}`,
    `Service mode: ${report.config.serviceMode}`,
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
    ...(report.executionReport?.artifacts.length
      ? report.executionReport.artifacts.map((artifact) => `- ${artifact.gcsUri}`)
      : ['- none recorded locally yet']),
    '',
    'Blockers:',
    ...(report.blockers.length ? report.blockers.map((blocker) => `- ${blocker}`) : ['- none']),
  ].join('\n')
}

export function privateSearxngServiceEvidenceToTypeScript(evidence: ApprovedPrivateSearxngServiceEvidence): string {
  return `import type { ApprovedPrivateSearxngServiceEvidence } from './private-searxng-service-types'

export const approvedPrivateSearxngServiceEvidence: ApprovedPrivateSearxngServiceEvidence = ${JSON.stringify(evidence, null, 2)}

export function getApprovedPrivateSearxngServiceEvidence(): ApprovedPrivateSearxngServiceEvidence {
  return {
    ...approvedPrivateSearxngServiceEvidence,
    blockers: [...approvedPrivateSearxngServiceEvidence.blockers],
    warnings: [...approvedPrivateSearxngServiceEvidence.warnings],
  }
}
`
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
