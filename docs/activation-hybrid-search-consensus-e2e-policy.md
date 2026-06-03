# Phase 49M Hybrid Search Consensus E2E Policy

Phase 49M has one provider mode: `hybrid_consensus`.

- Default provider: private SearXNG.
- Optional paid confidence booster: Brave Search.
- Query count: one.
- SearXNG results: max five.
- Brave results: max five.
- Merged sources: max eight.
- Capture pages: max two.
- Extraction pages: max two.

Brave execution requires `BRAVE_SEARCH_ENABLED=true`, a backend-only
`BRAVE_SEARCH_API_KEY`, daily/monthly budget gates, and
`BRAVE_SEARCH_STORE_RAW_RESULTS=false` plus `BRAVE_SEARCH_STORE_SNIPPETS=false`.

Brave raw JSON, snippets, request headers, and key material must never be
persisted. The only Brave output that may be stored is minimal normalized source
metadata.

Capture and extraction are allowed only for merged HTTPS sources on the Phase
49M allowlist. No login, CAPTCHA, paywall, form submission, link clicking,
arbitrary URL capture, or public SearXNG fallback is allowed.
