# Phase 49F Private SearXNG Service Policy

Phase 49F is limited to private authenticated SearXNG service validation in staging.

Allowed: CPU-only Docker build/push, authenticated Cloud Run service deploy/update, one bounded controlled SearXNG query, source normalization, private GCS JSON upload, and sanitized evidence updates.

Blocked: public SearXNG instances, paid search APIs, provider calls, API keys, Playwright, screenshots, Readability extraction, crawling, scraping, CAPTCHA/login/paywall bypass, public URLs as source of truth, public artifacts, production, external beta, paid production, and broad media.

The Cloud Run service must not grant `allUsers` or `allAuthenticatedUsers`. Any invoker grant must be limited to the approved active principal or a specific service account.
