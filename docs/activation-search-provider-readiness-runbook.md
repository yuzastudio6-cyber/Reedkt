# Phase 49N Search Provider Readiness Runbook

Phase 49N closes the ReeditPro search provider stack for controlled internal
testing only. It audits existing Phase 49A-49M evidence, private SearXNG
metadata, Brave Secret Manager metadata, provider gates, storage policy, cost
policy, and fail-closed behavior.

## Static Checks

```sh
npm run smoke:activation-search-provider-readiness
npm run activation:search-provider-readiness:report
npm run activation:search-provider-readiness:iam-plan
```

These commands are report-only. They do not query SearXNG, call Brave, launch
Playwright, run Sharp, run Readability, deploy Cloud Run, or mutate GCP.

## Execution

```sh
GCP_PROJECT_ID=reeditpro \
GCP_REGION=us-central1 \
REEDITPRO_ENV=staging \
REEDITPRO_CONFIRM_SEARCH_PROVIDER_READINESS_GATE=true \
npm run activation:search-provider-readiness -- --execute
```

Execution verifies private GCS evidence objects, inspects the private SearXNG
Cloud Run service/IAM, inspects Brave Secret Manager metadata without reading
the value, and uploads private JSON readiness artifacts.

## Blocked Scope

New live search, Brave API calls, public SearXNG, public crawling, arbitrary URL
capture, browser capture, Sharp processing, Readability extraction, raw Brave
storage, snippet storage, public artifacts, signed URLs as source of truth,
production, external beta, paid production, and broad media remain blocked.
