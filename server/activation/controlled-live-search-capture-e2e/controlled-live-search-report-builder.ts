import { existsSync, readFileSync } from 'node:fs'
import { getApprovedControlledLiveSearchCaptureEvidence } from './approved-controlled-live-search-capture-evidence'
import {
  controlledLiveSearchConfig,
  controlledLiveSearchQaGateIds,
  controlledLiveSearchSafetyFlags,
} from './controlled-live-search-capture-policy'
import type {
  ApprovedControlledLiveSearchEvidence,
  ControlledLiveSearchExecutionReport,
  ControlledLiveSearchQa,
  ControlledLiveSearchReport,
} from './controlled-live-search-capture-types'

export const CONTROLLED_LIVE_SEARCH_LOCAL_REPORT_PATH = 'activation-logs/controlled-live-search-capture-e2e/phase49g/job-execution/phase49g-report.json'

export function buildControlledLiveSearchReport(): ControlledLiveSearchReport {
  const executionReport = readLocalExecutionReport()
  const approvedEvidence = executionReport ? evidenceFromExecutionReport(executionReport) : getApprovedControlledLiveSearchCaptureEvidence()
  const qa = executionReport?.qa ?? plannedQa(approvedEvidence)
  return {
    reportId: 'activation-phase-49g-controlled-private-live-search-capture-e2e',
    createdAt: new Date().toISOString(),
    phase: '49G',
    status: approvedEvidence.status,
    config: controlledLiveSearchConfig,
    approvedEvidence,
    executionReport,
    qa,
    phase49HReadiness: approvedEvidence.phase49HReadiness,
    paidProviderAllowed: controlledLiveSearchSafetyFlags.paidProvidersAllowed,
    publicSearxngInstanceAllowed: controlledLiveSearchSafetyFlags.publicSearxngInstanceAllowed,
    arbitraryUrlCaptureAllowed: controlledLiveSearchSafetyFlags.arbitraryUrlCaptureAllowed,
    productionReadyAllowed: controlledLiveSearchSafetyFlags.productionReadyAllowed,
    externalBetaAllowed: controlledLiveSearchSafetyFlags.externalBetaAllowed,
    broadMediaAllowed: controlledLiveSearchSafetyFlags.broadMediaAllowed,
    blockers: approvedEvidence.blockers,
    warnings: approvedEvidence.warnings,
  }
}

export function summarizeControlledLiveSearchReport(report: ControlledLiveSearchReport): string {
  const lines = [
    'Phase 49G controlled private live-search/capture E2E',
    `Status: ${report.status}`,
    `Run ID: ${report.approvedEvidence.runId ?? 'not_executed'}`,
    `Private SearXNG: ${report.config.serviceName}`,
    `Queries: ${report.config.queries.join(' | ')}`,
    `Normalized sources: ${report.approvedEvidence.normalizedSourceCount ?? 0}`,
    `Captures: ${report.approvedEvidence.successfulCaptureCount ?? 0}`,
    `Readability extractions: ${report.approvedEvidence.successfulExtractionCount ?? 0}`,
    `Combined manifest: ${report.approvedEvidence.combinedManifestUri ?? 'not_created'}`,
    `Phase49H readiness: ${report.phase49HReadiness}`,
    `Production/external beta/broad media: blocked`,
    `Paid providers/public SearXNG/broad crawling: blocked`,
    `Blockers: ${report.blockers.length ? report.blockers.join(' | ') : 'none'}`,
    `Warnings: ${report.warnings.length ? report.warnings.join(' | ') : 'none'}`,
  ]
  return lines.join('\n')
}

export function controlledLiveSearchEvidenceToTypeScript(evidence: ApprovedControlledLiveSearchEvidence): string {
  return `import type { ApprovedControlledLiveSearchEvidence } from './controlled-live-search-capture-types'

export const approvedControlledLiveSearchCaptureEvidence: ApprovedControlledLiveSearchEvidence = ${JSON.stringify(evidence, null, 2)}

export function getApprovedControlledLiveSearchCaptureEvidence(): ApprovedControlledLiveSearchEvidence {
  return {
    ...approvedControlledLiveSearchCaptureEvidence,
    blockers: [...approvedControlledLiveSearchCaptureEvidence.blockers],
    warnings: [...approvedControlledLiveSearchCaptureEvidence.warnings],
  }
}
`
}

function plannedQa(evidence: ApprovedControlledLiveSearchEvidence): ControlledLiveSearchQa {
  const passed = evidence.status === 'completed'
  return {
    status: passed ? 'passed' : 'blocked',
    gates: controlledLiveSearchQaGateIds.map((gateId) => ({
      gateId,
      passed,
      severity: 'mandatory',
      summary: passed ? `${gateId} passed in approved Phase 49G evidence.` : `${gateId} awaits Phase 49G execution.`,
    })),
    blockers: [...evidence.blockers],
    warnings: [...evidence.warnings],
  }
}

function readLocalExecutionReport(): ControlledLiveSearchExecutionReport | undefined {
  if (!existsSync(CONTROLLED_LIVE_SEARCH_LOCAL_REPORT_PATH)) return undefined
  try {
    return JSON.parse(readFileSync(CONTROLLED_LIVE_SEARCH_LOCAL_REPORT_PATH, 'utf8')) as ControlledLiveSearchExecutionReport
  } catch {
    return undefined
  }
}

function evidenceFromExecutionReport(report: ControlledLiveSearchExecutionReport): ApprovedControlledLiveSearchEvidence {
  const prefix = `${controlledLiveSearchConfig.artifactPrefixBase}/${report.runId}`
  return {
    phase: '49G',
    status: report.ok ? 'completed' : 'blocked',
    runId: report.runId,
    serviceName: controlledLiveSearchConfig.serviceName,
    normalizedSourceCount: report.normalizedSources.length,
    selectedCaptureTargetCount: report.selectedCaptureTargets.length,
    successfulCaptureCount: report.captureRecords.length,
    successfulExtractionCount: report.extractionRecords.length,
    sourceManifestUri: `gs://${controlledLiveSearchConfig.generatedAssetsBucket}/${prefix}/sources/source-manifest.json`,
    combinedManifestUri: `gs://${controlledLiveSearchConfig.generatedAssetsBucket}/${prefix}/manifest/controlled-live-search-capture-e2e-manifest.json`,
    qaReportUri: `gs://${controlledLiveSearchConfig.qaBucket}/${prefix}/qa/controlled-live-search-capture-e2e-qa.json`,
    phase49gReportUri: `gs://${controlledLiveSearchConfig.qaBucket}/${prefix}/reports/phase49g-report.json`,
    phase49HReadiness: report.phase49HReadiness,
    blockers: report.blockers,
    warnings: report.warnings,
  }
}
