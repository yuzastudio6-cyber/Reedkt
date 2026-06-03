import type { ApprovedWebSearchCaptureReadinessEvidence } from './web-search-capture-readiness-types'

export const approvedWebSearchCaptureReadinessEvidence: ApprovedWebSearchCaptureReadinessEvidence = {
  phase: '49H',
  status: 'completed',
  runId: 'phase49h-20260603T020009',
  privateSearxngService: 'reeditpro-staging-private-searxng',
  readinessManifestUri: 'gs://reeditpro-staging-reeditpro-generated-assets/activation-web-search/phase49h/phase49h-20260603T020009/readiness/web-search-capture-internal-scope-manifest.json',
  evidenceChainUri: 'gs://reeditpro-staging-reeditpro-generated-assets/activation-web-search/phase49h/phase49h-20260603T020009/evidence/evidence-chain.json',
  providerGateAuditUri: 'gs://reeditpro-staging-reeditpro-generated-assets/activation-web-search/phase49h/phase49h-20260603T020009/providers/provider-gate-audit.json',
  artifactVerificationUri: 'gs://reeditpro-staging-reeditpro-generated-assets/activation-web-search/phase49h/phase49h-20260603T020009/artifacts/private-artifact-verification.json',
  serviceAccessAuditUri: 'gs://reeditpro-staging-reeditpro-generated-assets/activation-web-search/phase49h/phase49h-20260603T020009/service/private-searxng-access-audit.json',
  qaReportUri: 'gs://reeditpro-staging-reeditpro-qa-artifacts/activation-web-search/phase49h/phase49h-20260603T020009/qa/web-search-capture-readiness-qa.json',
  phase49hReportUri: 'gs://reeditpro-staging-reeditpro-qa-artifacts/activation-web-search/phase49h/phase49h-20260603T020009/reports/phase49h-report.json',
  webSearchCaptureInternalTestingReady: true,
  phase49IReadiness: 'ready_for_ui_api_integration_internal_ux_gating',
  blockers: [],
  warnings: [
    'Phase 49H inspected Cloud Run metadata and IAM only; it did not issue a health request, search query, capture, or extraction.',
    'Phase 49F/49G evidence records audience-bound identity-token minting warnings; the private service remained authenticated and no public invoker principal was detected in Phase 49H.',
    'Paid providers, public SearXNG instances, broad crawling, arbitrary URL capture, public artifacts, production, external beta, paid production, and broad media remain blocked.',
  ],
}

export function getApprovedWebSearchCaptureReadinessEvidence(): ApprovedWebSearchCaptureReadinessEvidence {
  return {
    ...approvedWebSearchCaptureReadinessEvidence,
    blockers: [...approvedWebSearchCaptureReadinessEvidence.blockers],
    warnings: [...approvedWebSearchCaptureReadinessEvidence.warnings],
  }
}
