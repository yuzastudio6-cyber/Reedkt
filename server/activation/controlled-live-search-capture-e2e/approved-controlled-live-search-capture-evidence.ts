import type { ApprovedControlledLiveSearchEvidence } from './controlled-live-search-capture-types'

export const approvedControlledLiveSearchCaptureEvidence: ApprovedControlledLiveSearchEvidence = {
  phase: '49G',
  status: 'completed',
  runId: 'phase49g-20260602T222646',
  serviceName: 'reeditpro-staging-private-searxng',
  normalizedSourceCount: 15,
  selectedCaptureTargetCount: 2,
  successfulCaptureCount: 2,
  successfulExtractionCount: 2,
  sourceManifestUri: 'gs://reeditpro-staging-reeditpro-generated-assets/activation-web-search/phase49g/phase49g-20260602T222646/sources/source-manifest.json',
  combinedManifestUri: 'gs://reeditpro-staging-reeditpro-generated-assets/activation-web-search/phase49g/phase49g-20260602T222646/manifest/controlled-live-search-capture-e2e-manifest.json',
  qaReportUri: 'gs://reeditpro-staging-reeditpro-qa-artifacts/activation-web-search/phase49g/phase49g-20260602T222646/qa/controlled-live-search-capture-e2e-qa.json',
  phase49gReportUri: 'gs://reeditpro-staging-reeditpro-qa-artifacts/activation-web-search/phase49g/phase49g-20260602T222646/reports/phase49g-report.json',
  phase49HReadiness: 'ready_for_web_search_capture_internal_readiness_gate',
  blockers: [],
  warnings: [
    'Audience-bound identity-token minting was unavailable for the active user account; the private service was invoked with an authenticated default identity token.',
    'Private SearXNG returned more than five results for each configured query; Phase 49G retained the first five per query.',
  ],
}

export function getApprovedControlledLiveSearchCaptureEvidence(): ApprovedControlledLiveSearchEvidence {
  return {
    ...approvedControlledLiveSearchCaptureEvidence,
    blockers: [...approvedControlledLiveSearchCaptureEvidence.blockers],
    warnings: [...approvedControlledLiveSearchCaptureEvidence.warnings],
  }
}
