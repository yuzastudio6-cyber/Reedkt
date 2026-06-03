# Phase 49I Web Search/Capture UI API Gating Runbook

Phase 49I adds internal-only UI/API gates for ReeditPro web search/capture after Phase 49H readiness closure.

## Scope

- Backend routes are authenticated and gate-only.
- Frontend UX is a chat-native developer detail card.
- Accepted requests are limited to `providerMode=private_fixture_provider`, `mockOnly=true`, `maxResults<=3`, and `maxCapturePages=0`.
- `run-controlled` returns an internal gate envelope only.

## Execute

Static modes:

```sh
npm run smoke:activation-web-search-ui-api-gating
npm run activation:web-search-ui-api-gating:report
npm run activation:web-search-ui-api-gating:iam-plan
```

Execution requires explicit staging confirmation:

```sh
GCP_PROJECT_ID=reeditpro \
GCP_REGION=us-central1 \
REEDITPRO_ENV=staging \
REEDITPRO_CONFIRM_WEB_SEARCH_UI_API_GATING=true \
npm run activation:web-search-ui-api-gating -- --execute
```

## Blocked

Phase 49I must not run live search, browser capture, Sharp processing, Readability extraction, paid providers, public SearXNG, arbitrary URL capture, broad crawling, Docker, Cloud Run deploys, public artifacts, signed URL source-of-truth, production, external beta, paid production, or broad media.

Phase 49J is ready only for optional Brave Search fallback policy review if Phase 49I QA passes.
