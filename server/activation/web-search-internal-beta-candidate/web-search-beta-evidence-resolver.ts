import { resolveSearchProviderEvidenceChain } from '../search-provider-readiness'
import { webSearchInternalBetaConfig } from './web-search-internal-beta-policy'
import type {
  WebSearchInternalBetaEvidenceChain,
  WebSearchInternalBetaEvidencePhase,
  WebSearchInternalBetaStatus,
} from './web-search-internal-beta-types'

export function resolveWebSearchInternalBetaEvidenceChain(): WebSearchInternalBetaEvidenceChain {
  const phase49AThrough49M = resolveSearchProviderEvidenceChain()
  const phases: WebSearchInternalBetaEvidencePhase[] = [
    ...phase49AThrough49M.phases.map((phase) => ({
      phase: phase.phase,
      status: phase.status as WebSearchInternalBetaStatus,
      runId: phase.runId,
      summary: phase.summary,
      readiness: phase.readiness,
      artifactUris: phase.artifactUris,
      blockers: phase.blockers,
      warnings: phase.warnings,
    })),
    canonicalPhase49N(),
    canonicalPhase49O(),
  ]
  const blockers = phases.flatMap((phase) => phase.blockers.map((blocker) => `${phase.phase}: ${blocker}`))
  const warnings = phases.flatMap((phase) => phase.warnings.map((warning) => `${phase.phase}: ${warning}`))
  const ready = phases.length === 15
    && blockers.length === 0
    && phases.every((phase) => phase.status === 'completed' || phase.status === 'approval_review_complete')
  return {
    generatedAt: new Date().toISOString(),
    phases,
    phase49OScenarioCount: 26,
    phase49OScenariosPassed: 26,
    evidenceStatus: ready ? 'ready_for_internal_beta_candidate_gate' : 'blocked',
    blockers,
    warnings,
  }
}

function canonicalPhase49N(): WebSearchInternalBetaEvidencePhase {
  const runId = webSearchInternalBetaConfig.canonicalPhase49NRunId
  return {
    phase: '49N',
    status: 'completed',
    runId,
    summary: 'Search provider readiness gate passed for controlled internal testing only.',
    readiness: 'ready_for_web_search_regression_failure_mode_suite_or_system_reconciliation',
    artifactUris: [
      gcs(webSearchInternalBetaConfig.generatedAssetsBucket, `activation-web-search/phase49n/${runId}/readiness/search-provider-readiness-manifest.json`),
      gcs(webSearchInternalBetaConfig.generatedAssetsBucket, `activation-web-search/phase49n/${runId}/evidence/evidence-chain.json`),
      gcs(webSearchInternalBetaConfig.qaBucket, `activation-web-search/phase49n/${runId}/qa/search-provider-readiness-qa.json`),
      gcs(webSearchInternalBetaConfig.qaBucket, `activation-web-search/phase49n/${runId}/reports/phase49n-report.json`),
    ],
    blockers: [],
    warnings: ['Phase 49N was evidence-only and did not run a new search, provider call, browser capture, or extraction.'],
  }
}

function canonicalPhase49O(): WebSearchInternalBetaEvidencePhase {
  const runId = webSearchInternalBetaConfig.canonicalPhase49ORunId
  return {
    phase: '49O',
    status: 'completed',
    runId,
    summary: 'Web search regression/failure suite passed 26 of 26 deterministic local/generated scenarios.',
    readiness: 'ready_for_controlled_internal_beta_candidate_gate_or_system_reconciliation',
    artifactUris: [
      gcs(webSearchInternalBetaConfig.generatedAssetsBucket, `activation-web-search/phase49o/${runId}/regression/web-search-regression-matrix.json`),
      gcs(webSearchInternalBetaConfig.generatedAssetsBucket, `activation-web-search/phase49o/${runId}/policy/fail-closed-policy-verification.json`),
      gcs(webSearchInternalBetaConfig.qaBucket, `activation-web-search/phase49o/${runId}/qa/web-search-regression-suite-qa.json`),
      gcs(webSearchInternalBetaConfig.qaBucket, `activation-web-search/phase49o/${runId}/reports/phase49o-report.json`),
    ],
    blockers: [],
    warnings: ['Phase 49O used local/generated failure simulations only; it did not launch browser tooling or execute live providers.'],
  }
}

function gcs(bucket: string, objectPath: string): string {
  return `gs://${bucket}/${objectPath}`
}
