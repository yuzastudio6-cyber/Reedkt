import type { ApprovedPrivateSearxngEvidence } from './private-searxng-service-types'

export const approvedPrivateSearxngServiceEvidence: ApprovedPrivateSearxngEvidence = {
  phase: '49F',
  status: 'completed',
  runId: 'phase49f-20260602T204445',
  serviceName: 'reeditpro-staging-private-searxng',
  serviceMode: 'private_controlled_searxng',
  image: 'us-central1-docker.pkg.dev/reeditpro/reeditpro-staging-workers/reeditpro-staging-private-searxng@sha256:7f56a77c442601d249389e4cb4101da2046fd62c04818c69eabf8caa7f6957ee',
  imageDigest: 'sha256:7f56a77c442601d249389e4cb4101da2046fd62c04818c69eabf8caa7f6957ee',
  controlledQuery: 'ReeditPro open source video editing planning',
  normalizedSourceCount: 5,
  sourceManifestUri: 'gs://reeditpro-staging-reeditpro-generated-assets/activation-web-search/phase49f/phase49f-20260602T204445/sources/source-manifest.json',
  qaReportUri: 'gs://reeditpro-staging-reeditpro-qa-artifacts/activation-web-search/phase49f/phase49f-20260602T204445/qa/private-searxng-service-qa.json',
  phase49fReportUri: 'gs://reeditpro-staging-reeditpro-qa-artifacts/activation-web-search/phase49f/phase49f-20260602T204445/reports/phase49f-report.json',
  phase49GReadiness: 'ready_for_controlled_private_live_search_capture_e2e',
  blockers: [],
  warnings: [
    'Audience-bound identity-token minting was unavailable for the active user account; the private service was invoked with an authenticated default identity token.',
    'Private SearXNG returned more than five results; Phase 49F normalized the first five per policy.',
  ],
}

export function getApprovedPrivateSearxngServiceEvidence(): ApprovedPrivateSearxngEvidence {
  return {
    ...approvedPrivateSearxngServiceEvidence,
    blockers: [...approvedPrivateSearxngServiceEvidence.blockers],
    warnings: [...approvedPrivateSearxngServiceEvidence.warnings],
  }
}
