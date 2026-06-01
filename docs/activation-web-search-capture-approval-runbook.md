# Phase 49A Web Search/Capture Approval Runbook

Phase 49A is a static approval workflow for ReeditPro web search, source research, browser capture, screenshot processing, and article extraction planning.

It does not run live search, crawl websites, scrape websites, launch Playwright, capture screenshots, run SearXNG, process images with Sharp, extract public pages with Readability, call providers, build Docker images, mutate GCP, or create public artifacts.

## Default Stack

- SearXNG: default self-hosted metasearch planning path.
- Playwright: future worker-side browser capture and rendered-page validation.
- Sharp: future screenshot/image post-processing.
- Mozilla Readability: future safe article extraction after approved fetch/render.

Optional paid providers are disabled by default: Brave Search API, Tavily, Exa, Firecrawl, and Browserless/Browserbase.

## Commands

```sh
npm run smoke:activation-web-search-capture-approval-workflow
npm run activation:web-search-capture-approval:plan
npm run activation:web-search-capture-approval:report
npm run activation:web-search-tool:summary
```

All commands are static/report-only. They do not require provider secrets and do not access the public web.

## Future Phase Path

1. Phase 49B: private SearXNG endpoint planning and generated/static search fixtures.
2. Phase 49C: Playwright plus Sharp generated/local capture fixture.
3. Phase 49D: Readability local/static HTML extraction fixture.
4. Phase 49E: controlled private search/capture E2E with allowlists and source manifests.
5. Phase 49F: internal readiness gate.

Production, external beta, paid production, broad real media, providers, Revideo, public artifacts, live web search, and browser capture remain blocked.
