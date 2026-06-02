import type { ApprovedPrivateWebE2EEvidence } from './private-web-search-capture-e2e-types'

export const approvedPrivateWebE2EEvidence: ApprovedPrivateWebE2EEvidence = {
  phase: '49E',
  status: 'completed',
  runId: 'phase49e-20260602T155154',
  providerMode: 'private_fixture_provider',
  query: 'ReeditPro controlled private web search capture E2E fixture',
  sourceCount: 3,
  captureCount: 3,
  extractionCount: 3,
  planSnapshotUri: 'gs://reeditpro-staging-reeditpro-generated-assets/activation-web-search/phase49e/phase49e-20260602T155154/plan/approved-web-e2e-plan-snapshot.json',
  searchResponseUri: 'gs://reeditpro-staging-reeditpro-generated-assets/activation-web-search/phase49e/phase49e-20260602T155154/search/private-search-response.json',
  normalizedResultsUri: 'gs://reeditpro-staging-reeditpro-generated-assets/activation-web-search/phase49e/phase49e-20260602T155154/search/normalized-search-results.json',
  sourceManifestUri: 'gs://reeditpro-staging-reeditpro-generated-assets/activation-web-search/phase49e/phase49e-20260602T155154/sources/source-manifest.json',
  combinedManifestUri: 'gs://reeditpro-staging-reeditpro-generated-assets/activation-web-search/phase49e/phase49e-20260602T155154/manifest/private-web-search-capture-e2e-manifest.json',
  qaReportUri: 'gs://reeditpro-staging-reeditpro-qa-artifacts/activation-web-search/phase49e/phase49e-20260602T155154/qa/private-web-search-capture-e2e-qa.json',
  phase49eReportUri: 'gs://reeditpro-staging-reeditpro-qa-artifacts/activation-web-search/phase49e/phase49e-20260602T155154/reports/phase49e-report.json',
  phase49FReadiness: 'ready_for_web_search_capture_internal_readiness_gate',
  blockers: [],
  warnings: [
    'Phase 49E validates only controlled/private fixture E2E plumbing.',
    'Phase 49F readiness is internal web search/capture readiness gate only, not production or external beta.',
    'No REEDITPRO_SEARXNG_PRIVATE_ENDPOINT configured; using deterministic private fixture provider.',
    'Live public search, public capture, paid providers, production, external beta, and broad media remain blocked.',
  ],
}

export function getApprovedPrivateWebE2EEvidence(): ApprovedPrivateWebE2EEvidence {
  return {
    ...approvedPrivateWebE2EEvidence,
    blockers: [...approvedPrivateWebE2EEvidence.blockers],
    warnings: [...approvedPrivateWebE2EEvidence.warnings],
  }
}
