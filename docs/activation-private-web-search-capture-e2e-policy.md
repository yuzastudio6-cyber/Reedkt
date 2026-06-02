# Phase 49E Controlled Private Web Search/Capture E2E Policy

Phase 49E allows only controlled/private fixture E2E execution.

Allowed:

- SearXNG-compatible private fixture provider.
- Three generated local fixture pages.
- Playwright capture of `file://` fixture pages only.
- Sharp processing of Phase 49E screenshots only.
- Mozilla Readability extraction from Phase 49E fixture HTML only.
- Private GCS artifacts under Phase 49E prefixes.

Blocked:

- Public SearXNG instances.
- Live public search.
- Broad crawling or scraping.
- Arbitrary user URLs.
- Login, CAPTCHA, paywall, robots, or terms bypass.
- Brave, Tavily, Exa, Firecrawl, Browserless, Browserbase, or paid provider APIs.
- Public artifacts or signed URLs as source of truth.
- Production, external beta, paid production, broad media, and Revideo.
