# Phase 49A Web Search/Capture Approval Results

Status: approval_review_complete.

Branch: `codex/rp-activation-49a-web-search-capture-approval`

Base: `codex/rp-activation-47b-vlm-blocker-resolution`

## Decision

Codex staging planning decision: `staging_planning_approved_free_open_source_default`.

The default Phase 49 planning stack is:

- SearXNG for self-hosted metasearch planning.
- Playwright for future worker-side browser capture and dynamic page validation.
- Sharp for future screenshot/image post-processing.
- Mozilla Readability for future article/content extraction after safe fetch/render.

Optional paid providers remain disabled by default: Brave Search API, Tavily, Exa, Firecrawl, and Browserless/Browserbase.

## Evidence Summary

- SearXNG: official project evidence recorded from `https://github.com/searxng/searxng` and `https://docs.searxng.org/`; license recorded as `AGPL-3.0-or-later`; approved for planning only.
- Playwright: official project evidence recorded from `https://github.com/microsoft/playwright` and `https://playwright.dev/`; license recorded as `Apache-2.0`; approved for planning only.
- Sharp: official project evidence recorded from `https://github.com/lovell/sharp` and `https://sharp.pixelplumbing.com/`; license recorded as `Apache-2.0`; approved for planning only.
- Mozilla Readability: official project evidence recorded from `https://github.com/mozilla/readability`; license recorded as `Apache-2.0`; approved for planning only.

## Scope

- `searxngPlanningAllowed=true`
- `playwrightPlanningAllowed=true`
- `sharpPlanningAllowed=true`
- `readabilityPlanningAllowed=true`
- `liveSearchAllowed=false`
- `browserCaptureAllowed=false`
- `paidProviderAllowed=false`
- `publicArtifactAllowed=false`
- `productionReadyAllowed=false`
- `externalBetaAllowed=false`
- `broadRealMediaAllowed=false`

## QA

- `tool_evidence`: passed.
- `license_review`: passed.
- `free_open_source_default`: passed.
- `paid_provider_disabled`: passed.
- `frontend_secret_safety`: passed.
- `no_live_search`: passed.
- `no_browser_execution`: passed.
- `no_public_artifacts`: passed.
- `risk_register_complete`: passed.
- `future_scope_defined`: passed.
- `package_scripts_present`: passed.
- `blocked_features`: passed.

## Phase49B Readiness

Ready only for private/generated SearXNG planning fixtures and private endpoint planning. Phase 49B must not perform public scraping, paid provider calls, external beta, production, or broad media execution.

## Blocked

Live web search, public crawling, public scraping, Playwright public-internet capture, screenshot capture, Sharp runtime processing, Readability runtime extraction, provider calls, API keys, Docker/GCP mutation, public artifacts, signed URLs as source of truth, production, external beta, paid production, broad real media, providers, and Revideo remain blocked.

## Package Lock

Unchanged.
