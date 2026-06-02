# Phase 49G Controlled Private Live Search/Capture E2E Results

Status: completed.

Branch: `codex/rp-activation-49g-controlled-private-live-search-capture-e2e`

Base: `codex/rp-activation-49f-private-searxng-service-validation`

## Scope

Phase 49G validates controlled private live search through the Phase 49F private authenticated SearXNG service, followed by allowlisted Playwright capture, Sharp screenshot processing, and Readability extraction/sanitization.

Allowed query policy:

- `site:docs.searxng.org searxng search api`
- `site:playwright.dev/docs screenshots playwright`
- `site:sharp.pixelplumbing.com sharp resize metadata`

Allowed capture domains: `docs.searxng.org`, `playwright.dev`, `sharp.pixelplumbing.com`, `github.com`, and `developer.mozilla.org`.

## Execution

Run ID: `phase49g-20260602T222646`

Private SearXNG service: `reeditpro-staging-private-searxng`

Invocation: authenticated private Cloud Run request. Audience-bound identity-token minting was unavailable for the active user account, so the run used an authenticated default identity token. No service URL, token, API key, or secret is committed.

Normalized source records: `15`

Selected capture targets: `2`

Successful Playwright captures: `2`

Successful Sharp processing records: `2`

Successful Readability extractions: `2`

## Artifacts

- Plan snapshot: `gs://reeditpro-staging-reeditpro-generated-assets/activation-web-search/phase49g/phase49g-20260602T222646/plan/approved-controlled-live-search-capture-plan.json`
- Private SearXNG query responses: `gs://reeditpro-staging-reeditpro-generated-assets/activation-web-search/phase49g/phase49g-20260602T222646/search/private-searxng-query-responses.json`
- Normalized search results: `gs://reeditpro-staging-reeditpro-generated-assets/activation-web-search/phase49g/phase49g-20260602T222646/search/normalized-search-results.json`
- Source manifest: `gs://reeditpro-staging-reeditpro-generated-assets/activation-web-search/phase49g/phase49g-20260602T222646/sources/source-manifest.json`
- Capture artifacts: `gs://reeditpro-staging-reeditpro-generated-assets/activation-web-search/phase49g/phase49g-20260602T222646/captures/`
- Extraction artifacts: `gs://reeditpro-staging-reeditpro-generated-assets/activation-web-search/phase49g/phase49g-20260602T222646/extraction/`
- Combined manifest: `gs://reeditpro-staging-reeditpro-generated-assets/activation-web-search/phase49g/phase49g-20260602T222646/manifest/controlled-live-search-capture-e2e-manifest.json`
- QA report: `gs://reeditpro-staging-reeditpro-qa-artifacts/activation-web-search/phase49g/phase49g-20260602T222646/qa/controlled-live-search-capture-e2e-qa.json`
- Phase 49G report: `gs://reeditpro-staging-reeditpro-qa-artifacts/activation-web-search/phase49g/phase49g-20260602T222646/reports/phase49g-report.json`

## QA

All mandatory gates passed:

- `phase49f_evidence`
- `plan_snapshot_integrity`
- `private_searxng_query`
- `result_normalization`
- `allowlisted_capture_policy`
- `playwright_capture`
- `sharp_processing`
- `readability_extraction`
- `combined_manifest`
- `artifact_privacy`
- `blocked_features`

## Phase49H Readiness

Ready only for a web search/capture internal readiness gate. This is not production, external beta, paid production, broad crawling, arbitrary URL capture, paid-provider approval, or public artifact approval.

## Warnings

- Audience-bound identity-token minting was unavailable for the active user account; the private service was invoked with an authenticated default identity token.
- Private SearXNG returned more than five results for each configured query; Phase 49G retained the first five per query.

## Blocked

Paid providers, public SearXNG instances, arbitrary URL capture, broad crawling, public artifacts, signed URLs as source of truth, production, external beta, paid production, broad media, providers, Revideo, and final delivery remain blocked.
