# Phase 49G Controlled Private Live Search/Capture E2E Policy

Phase 49G is limited to controlled private live-search/capture E2E validation.

Allowed:

- Invoke `reeditpro-staging-private-searxng` with authenticated private Cloud Run access.
- Run the approved bounded documentation queries.
- Normalize private SearXNG results into source records with attribution.
- Capture at most two HTTPS search-result pages from `docs.searxng.org`, `playwright.dev`, `sharp.pixelplumbing.com`, `github.com`, or `developer.mozilla.org`.
- Use Playwright only for selected allowlisted results.
- Use Sharp only on screenshots created in this phase.
- Use Readability only on captured allowlisted HTML from this phase.
- Upload private JSON, PNG, and TXT artifacts to the Phase 49G prefixes.

Blocked:

- Public SearXNG instances.
- Brave, Tavily, Exa, Firecrawl, Browserless, Browserbase, or any paid provider.
- Arbitrary user URL capture.
- Broad crawling or scraping.
- Login, CAPTCHA, paywall, robots, or terms bypass.
- Public artifacts and signed URLs as source of truth.
- Docker build/push, Cloud Run deploy, or service mutation unless a later phase explicitly approves it.
- Production, external beta, paid production, broad media, providers, and Revideo.
