import type { ApprovedWebSearchUiApiGatingEvidence } from './web-search-ui-api-gating-types'

export const approvedWebSearchUiApiGatingEvidence: ApprovedWebSearchUiApiGatingEvidence = {
  phase: '49I',
  status: 'completed',
  runId: 'phase49i-20260603T031706',
  phase49HRunId: 'phase49h-20260603T020009',
  privateSearxngService: 'reeditpro-staging-private-searxng',
  internalApiRoutesReady: true,
  internalUxGateReady: true,
  planSnapshotUri: 'gs://reeditpro-staging-reeditpro-generated-assets/activation-web-search/phase49i/phase49i-20260603T031706/plan/approved-web-search-ui-api-gate-plan.json',
  routeGateAuditUri: 'gs://reeditpro-staging-reeditpro-generated-assets/activation-web-search/phase49i/phase49i-20260603T031706/api/route-gate-audit.json',
  requestValidationUri: 'gs://reeditpro-staging-reeditpro-generated-assets/activation-web-search/phase49i/phase49i-20260603T031706/api/request-validation.json',
  uxStateUri: 'gs://reeditpro-staging-reeditpro-generated-assets/activation-web-search/phase49i/phase49i-20260603T031706/ux/internal-ux-gate-state.json',
  qaReportUri: 'gs://reeditpro-staging-reeditpro-qa-artifacts/activation-web-search/phase49i/phase49i-20260603T031706/qa/web-search-ui-api-gating-qa.json',
  phase49iReportUri: 'gs://reeditpro-staging-reeditpro-qa-artifacts/activation-web-search/phase49i/phase49i-20260603T031706/reports/phase49i-report.json',
  phase49JReadiness: 'ready_for_optional_brave_search_fallback_policy_review',
  blockers: [],
  warnings: [
    'Phase 49I is UI/API gating only; no live search, browser capture, Sharp processing, Readability extraction, paid provider call, public SearXNG use, Docker, Cloud Run deploy, or production/beta unlock occurred.',
  ],
}

export function getApprovedWebSearchUiApiGatingEvidence(): ApprovedWebSearchUiApiGatingEvidence {
  return {
    ...approvedWebSearchUiApiGatingEvidence,
    blockers: [...approvedWebSearchUiApiGatingEvidence.blockers],
    warnings: [...approvedWebSearchUiApiGatingEvidence.warnings],
  }
}
