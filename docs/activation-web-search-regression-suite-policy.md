# Phase 49O Web Search Regression Suite Policy

Phase 49O is a regression/failure-mode hardening phase for controlled internal testing readiness.

Allowed:
- Local/generated fixtures and deterministic mocks.
- Policy validators and API route contract validators.
- Private GCS evidence verification for Phase 49N.
- Private JSON artifact uploads under `activation-web-search/phase49o/`.

Blocked:
- Live search and Brave API calls.
- Public SearXNG instances.
- Tavily, Exa, Firecrawl, Browserless, Browserbase, and other paid providers.
- Broad crawling, arbitrary URL capture, CAPTCHA/login/paywall bypass, public browser capture, Sharp processing, and Readability extraction against live pages.
- Raw Brave response or snippet storage.
- Public artifacts, signed URLs as source of truth, production, external beta, paid production, and broad media.

Every unsafe request must fail closed and must not fallback to a public or paid provider.
