import type { WebSearchRisk } from './web-search-capture-approval-types'

export function buildWebSearchRiskRegister(): WebSearchRisk[] {
  return [
    blocker('scraping_behind_login', 'Block browser/search capture for authenticated pages until user authorization, redaction, and source-awareness policy are implemented.', 'Approved private capture policy, auth-boundary review, and redaction QA.'),
    blocker('captcha_bypass', 'Do not attempt CAPTCHA solving or bypass. Treat CAPTCHA as a hard stop.', 'Explicit CAPTCHA-block handling in future worker QA.'),
    blocker('paywall_bypass', 'Do not bypass paywalls or subscription gates.', 'Paywall detection and blocked-result reporting.'),
    blocker('robots_terms_violation', 'Respect robots, site terms, rate limits, and source restrictions; do not create bypass logic.', 'Domain policy, rate-limit policy, and terms/robots review.'),
    blocker('copyrighted_full_content_storage', 'Store only source records, metadata, citations, and allowed excerpts unless policy approves broader storage.', 'Content-retention policy and excerpt/copyright QA.'),
    blocker('unsafe_html_script_injection', 'Sanitize extracted HTML/text and never execute scripts from captured pages.', 'Sanitizer tests and HTML storage/display policy.'),
    blocker('api_key_or_provider_secret_leak', 'Keep all provider/search/browser secrets server-side only and disabled in Phase 49A.', 'Secret-boundary audit and frontend bundle scan.'),
    blocker('public_artifact_exposure', 'All screenshots, captures, extracted content, source manifests, and QA artifacts remain private.', 'Private bucket/IAM validation.'),
    blocker('signed_url_source_of_truth', 'Signed URLs may be delivery conveniences later, never canonical source-of-truth records.', 'Artifact manifest schema with private GCS paths as canonical references.'),
    blocker('unbounded_crawling', 'Future search/capture must use result count, domain, timeout, and artifact-size limits.', 'Bounded worker plan and rate-limit QA.'),
    blocker('upstream_search_provider_blocking', 'SearXNG upstream engine failures must degrade gracefully without bypassing restrictions.', 'Failure-mode fixtures and source attribution QA.'),
    blocker('missing_attribution_citation', 'Every result summary must cite source records and private artifact paths.', 'Citation/source manifest checks.'),
    blocker('hallucinated_source_summary', 'Summaries must be grounded in source records and extraction metadata.', 'Summary grounding QA and citation mismatch tests.'),
    blocker('frontend_secret_exposure', 'Frontend displays results/artifacts only; it must not hold search API secrets or run heavy capture.', 'Frontend boundary scan.'),
    blocker('browser_worker_runaway_cost_timeout', 'Browser capture needs strict concurrency, timeout, viewport, artifact, and retry caps.', 'Worker runtime limits and cost guard QA.'),
    blocker('unmanaged_screenshot_storage', 'Screenshots need private prefixes, retention, size checks, and source attribution.', 'Private artifact policy and retention plan.'),
    blocker('unsafe_user_supplied_url_capture', 'User-supplied URLs need allowlist/denylist, scheme validation, and abuse controls before capture.', 'URL policy and fixture-based capture validation.'),
    warning('search_result_quality_variance', 'Rank quality varies by upstream engines.', 'Source diversity and deduplication reports.'),
    warning('stale_sources', 'Search result freshness can lag or drift.', 'Timestamp/source freshness metadata.'),
    warning('page_rendering_flakiness', 'Dynamic pages can render inconsistently.', 'Retry policy and deterministic fixture tests.'),
    warning('screenshots_ads_popups', 'Ads, cookie banners, and popups can affect screenshots.', 'Allowed page policy and screenshot QA flags.'),
    warning('extraction_false_positives', 'Readability extraction can misidentify article bodies.', 'Generated HTML fixture tests and human review flags.'),
    warning('broken_pages', 'Some pages fail to load or render.', 'Graceful blocked/error source records.'),
    warning('multilingual_extraction_limits', 'Extraction metadata may vary by language.', 'Language metadata and future multilingual QA.'),
    warning('source_deduplication_issues', 'Metasearch engines may return duplicate or canonicalized URLs.', 'URL canonicalization and dedupe policy.'),
  ]
}

function blocker(riskId: string, mitigation: string, evidenceRequiredToClear: string): WebSearchRisk {
  return { riskId, severity: 'blocker', currentStatus: 'blocked_by_policy', mitigation, evidenceRequiredToClear }
}

function warning(riskId: string, mitigation: string, evidenceRequiredToClear: string): WebSearchRisk {
  return { riskId, severity: 'warning', currentStatus: 'warning_tracked', mitigation, evidenceRequiredToClear }
}
