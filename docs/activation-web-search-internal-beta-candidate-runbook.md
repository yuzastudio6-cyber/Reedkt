# Phase 49P Web Search Internal Beta Candidate Runbook

Phase 49P is a readiness closure for controlled internal beta candidate scope only. It consolidates Phase 49A-49O evidence and audits provider state, UI/API gates, regression coverage, artifact privacy, Cloud Run metadata, and Secret Manager metadata without running new search/capture/extraction work.

## Static Review

```sh
npm run smoke:activation-web-search-internal-beta-candidate
npm run activation:web-search-internal-beta-candidate:report
npm run activation:web-search-internal-beta-candidate:iam-plan
```

Static mode uses committed and canonical evidence only. It does not query GCP, access secrets, run providers, launch a browser, or upload artifacts.

## Execution

```sh
GCP_PROJECT_ID=reeditpro \
GCP_REGION=us-central1 \
REEDITPRO_ENV=staging \
REEDITPRO_CONFIRM_WEB_SEARCH_INTERNAL_BETA_CANDIDATE=true \
npm run activation:web-search-internal-beta-candidate -- --execute
```

Execution verifies canonical private GCS evidence for Phase 49F, 49H, 49I, 49M, 49N, and 49O; inspects Cloud Run metadata/IAM for `reeditpro-staging-private-searxng`; inspects `BRAVE_SEARCH_API_KEY` Secret Manager metadata/IAM without reading the value; uploads private JSON artifacts; and writes an ignored local report under `activation-logs/`.

## Safety

Phase 49P must not run live search, Brave API calls, browser capture, Sharp processing, Readability extraction, Docker, Cloud Run deploys, public SearXNG, broad crawling, arbitrary URL capture, public artifacts, signed URLs as source of truth, production, external beta, paid production, broad media, providers, Revideo, or final delivery.
