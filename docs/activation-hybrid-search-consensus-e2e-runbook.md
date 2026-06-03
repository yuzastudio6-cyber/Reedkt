# Phase 49M Hybrid Search Consensus E2E Runbook

Phase 49M validates one bounded SearXNG + Brave hybrid consensus E2E path.
SearXNG remains the default free/open-source provider. Brave Search is used only
as an explicitly enabled, budgeted, backend-secret-backed confidence booster.

## Static Checks

Run static/report checks without search, capture, extraction, or GCP mutation:

```sh
npm run smoke:activation-hybrid-search-consensus-e2e
npm run activation:hybrid-search-consensus-e2e:report
npm run activation:hybrid-search-consensus-e2e:iam-plan
```

## Execution

Execution requires the staging env and Brave budget/storage gates:

```sh
GCP_PROJECT_ID=reeditpro \
GCP_REGION=us-central1 \
REEDITPRO_ENV=staging \
REEDITPRO_CONFIRM_SEARXNG_BRAVE_HYBRID_E2E=true \
BRAVE_SEARCH_ENABLED=true \
BRAVE_SEARCH_DAILY_LIMIT=1 \
BRAVE_SEARCH_MONTHLY_BUDGET_USD=1 \
BRAVE_SEARCH_MAX_RESULTS=5 \
BRAVE_SEARCH_MAX_QUERIES_PER_RUN=1 \
BRAVE_SEARCH_STORE_RAW_RESULTS=false \
BRAVE_SEARCH_STORE_SNIPPETS=false \
npm run activation:hybrid-search-consensus-e2e -- --execute
```

The runner invokes only the private authenticated SearXNG service and the Brave
web search endpoint. It captures only allowlisted merged result URLs.

## Blocked

Public SearXNG, other paid providers, arbitrary URL capture, broad crawling,
raw Brave response storage, snippet storage, public artifacts, signed URLs as
source of truth, production, external beta, paid production, and broad media are
blocked.
