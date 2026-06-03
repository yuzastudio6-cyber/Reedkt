# Phase 49H Web Search/Capture Readiness Runbook

Phase 49H is an audit/readiness closure for controlled internal testing only. It verifies approved Phase 49A-49G evidence, the private authenticated SearXNG Cloud Run service metadata, provider gates, private artifact paths, docs/scripts consistency, and fail-closed behavior.

It must not run a new search query, launch Playwright, capture screenshots, run Sharp, run Mozilla Readability, call paid providers, build or push Docker images, deploy Cloud Run, create public URLs, or unlock production/beta/broad media.

## Required Execution Env

- `GCP_PROJECT_ID=reeditpro`
- `GCP_REGION=us-central1`
- `REEDITPRO_ENV=staging`
- `REEDITPRO_CONFIRM_WEB_SEARCH_CAPTURE_INTERNAL_READINESS=true`

## Commands

Static checks:

```sh
npm run smoke:activation-web-search-capture-readiness
npm run activation:web-search-capture-readiness:report
npm run activation:web-search-capture-readiness:iam-plan
```

Execution:

```sh
GCP_PROJECT_ID=reeditpro \
GCP_REGION=us-central1 \
REEDITPRO_ENV=staging \
REEDITPRO_CONFIRM_WEB_SEARCH_CAPTURE_INTERNAL_READINESS=true \
npm run activation:web-search-capture-readiness -- --execute
```

Execution uploads private JSON only under:

- `gs://reeditpro-staging-reeditpro-generated-assets/activation-web-search/phase49h/<runId>/`
- `gs://reeditpro-staging-reeditpro-qa-artifacts/activation-web-search/phase49h/<runId>/`

## Phase49I Handoff

Phase 49I may begin only as UI/API integration and internal UX gating for the already-approved controlled/private search/capture path. It is not production, external beta, broad crawling, arbitrary URL capture, paid provider approval, or public artifact approval.
