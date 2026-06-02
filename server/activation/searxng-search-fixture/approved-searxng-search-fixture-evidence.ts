import type { ApprovedSearxngSearchFixtureEvidence } from './searxng-search-fixture-types'
import { searxngSearchFixtureConfig } from './searxng-search-fixture-policy'

export const approvedSearxngSearchFixtureEvidence: ApprovedSearxngSearchFixtureEvidence = {
  phase: '49B',
  status: 'completed',
  runId: 'phase49b-20260602T01332',
  defaultProvider: 'searxng',
  query: searxngSearchFixtureConfig.query,
  fixtureResultCount: 6,
  normalizedSourceCount: 6,
  planSnapshotUri: 'gs://reeditpro-staging-reeditpro-generated-assets/activation-web-search/phase49b/phase49b-20260602T01332/plan/approved-search-plan-snapshot.json',
  fixtureResponseUri: 'gs://reeditpro-staging-reeditpro-generated-assets/activation-web-search/phase49b/phase49b-20260602T01332/fixture/searxng-generated-fixture-response.json',
  normalizedResultsUri: 'gs://reeditpro-staging-reeditpro-generated-assets/activation-web-search/phase49b/phase49b-20260602T01332/normalized/normalized-search-results.json',
  sourceManifestUri: 'gs://reeditpro-staging-reeditpro-generated-assets/activation-web-search/phase49b/phase49b-20260602T01332/sources/source-manifest.json',
  metadataUri: 'gs://reeditpro-staging-reeditpro-generated-assets/activation-web-search/phase49b/phase49b-20260602T01332/metadata/searxng-fixture-metadata.json',
  qaReportUri: 'gs://reeditpro-staging-reeditpro-qa-artifacts/activation-web-search/phase49b/phase49b-20260602T01332/qa/searxng-search-fixture-qa.json',
  phase49bReportUri: 'gs://reeditpro-staging-reeditpro-qa-artifacts/activation-web-search/phase49b/phase49b-20260602T01332/reports/phase49b-report.json',
  phase49CReadiness: 'ready_for_playwright_sharp_generated_capture_fixture',
  blockers: [],
  warnings: [
    'Phase 49B proves only the generated search-provider contract; live search remains blocked.',
    'Generated fixture URLs are example domains and were not fetched.',
    'Phase 49C may begin only as a Playwright + Sharp generated capture fixture.',
    'Phase 49B executes a generated/private search fixture only.',
    'No live search, public web request, browser capture, paid provider, Docker, Cloud Run, or public artifact is allowed.',
  ],
}

export function getApprovedSearxngSearchFixtureEvidence(): ApprovedSearxngSearchFixtureEvidence {
  return {
    ...approvedSearxngSearchFixtureEvidence,
    blockers: [...approvedSearxngSearchFixtureEvidence.blockers],
    warnings: [...approvedSearxngSearchFixtureEvidence.warnings],
  }
}
