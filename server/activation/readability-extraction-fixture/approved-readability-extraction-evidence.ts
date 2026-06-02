import type { ApprovedReadabilityExtractionEvidence } from './readability-extraction-types'
import { readabilityExtractionConfig } from './readability-extraction-policy'

export const approvedReadabilityExtractionEvidence: ApprovedReadabilityExtractionEvidence = {
  phase: '49D',
  status: 'completed',
  runId: 'phase49d-20260602T150908',
  fixtureMode: readabilityExtractionConfig.fixtureMode,
  localFixtureDescription: 'Generated local article fixture parsed through Mozilla Readability and jsdom; no public web extraction.',
  rawExtractionUri: 'gs://reeditpro-staging-reeditpro-generated-assets/activation-web-search/phase49d/phase49d-20260602T150908/extraction/extracted-article-raw.json',
  sanitizedExtractionUri: 'gs://reeditpro-staging-reeditpro-generated-assets/activation-web-search/phase49d/phase49d-20260602T150908/extraction/extracted-article-sanitized.json',
  textExtractionUri: 'gs://reeditpro-staging-reeditpro-generated-assets/activation-web-search/phase49d/phase49d-20260602T150908/extraction/extracted-article-text.txt',
  extractionMetadataUri: 'gs://reeditpro-staging-reeditpro-generated-assets/activation-web-search/phase49d/phase49d-20260602T150908/extraction/extraction-metadata.json',
  extractionManifestUri: 'gs://reeditpro-staging-reeditpro-generated-assets/activation-web-search/phase49d/phase49d-20260602T150908/manifest/extraction-artifact-manifest.json',
  qaReportUri: 'gs://reeditpro-staging-reeditpro-qa-artifacts/activation-web-search/phase49d/phase49d-20260602T150908/qa/readability-extraction-qa.json',
  phase49dReportUri: 'gs://reeditpro-staging-reeditpro-qa-artifacts/activation-web-search/phase49d/phase49d-20260602T150908/reports/phase49d-report.json',
  phase49EReadiness: 'ready_for_controlled_private_web_search_capture_e2e',
  blockers: [],
  warnings: [
    'Phase 49D proves only generated/local Mozilla Readability extraction and sanitization.',
    'No public page extraction or browser capture was approved.',
    'Phase 49E may begin only as controlled private web search/capture E2E planning with explicit private endpoint policy.',
    'No live search, public web request, browser launch, screenshot capture, paid provider, Docker, Cloud Run deploy, or public artifact was used.',
  ],
}

export function getApprovedReadabilityExtractionEvidence(): ApprovedReadabilityExtractionEvidence {
  return {
    ...approvedReadabilityExtractionEvidence,
    blockers: [...approvedReadabilityExtractionEvidence.blockers],
    warnings: [...approvedReadabilityExtractionEvidence.warnings],
  }
}
