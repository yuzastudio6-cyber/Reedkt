# Phase 49G Controlled Private Live Search/Capture E2E Runbook

Phase 49G validates the real private ReeditPro web-search pipeline using the authenticated Phase 49F SearXNG Cloud Run service, then captures and extracts only explicitly allowlisted documentation pages.

Default report and IAM-plan commands are static. Execution requires `GCP_PROJECT_ID=reeditpro`, `GCP_REGION=us-central1`, `REEDITPRO_ENV=staging`, and `REEDITPRO_CONFIRM_CONTROLLED_PRIVATE_LIVE_SEARCH_CAPTURE_E2E=true`.

Execution runs at most three documentation-focused private SearXNG queries, retains at most five results per query, selects at most two HTTPS allowlisted result pages, captures them with Playwright, processes screenshots with Sharp, extracts/sanitizes article content with Mozilla Readability, and uploads private artifacts.

Do not use public SearXNG instances, paid providers, arbitrary URL capture, broad crawling, login/CAPTCHA/paywall bypass, public artifacts, signed URLs as source of truth, Docker deploys, Cloud Run mutation, production, external beta, paid production, broad media, providers, or Revideo in this phase.
