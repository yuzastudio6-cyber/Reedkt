# Brave Search Fixture Normalizer Runbook

Phase 49K validates only generated Brave-shaped fixture data and normalization.
It does not call Brave Search API, require a secret, run live search, call paid
providers, launch browser capture, run Readability extraction, deploy services,
or unlock production/beta/broad media.

## Allowed

- Build static Phase 49K reports and IAM plans.
- Generate deterministic Brave-shaped fixture data.
- Normalize fixture-only Brave records into ReeditPro source records.
- Evaluate SearXNG confidence scenarios and planning-only Brave fallback
  recommendations.
- Evaluate provider-router and SearXNG/Brave dedupe fixture decisions.
- Upload private JSON artifacts only when
  `REEDITPRO_CONFIRM_BRAVE_FIXTURE_NORMALIZER=true`.

## Blocked

Do not call the live Brave API, create/read/print a Brave key, store real Brave
responses, store real Brave snippets, run live search, call Tavily/Exa/Firecrawl
or hosted browser providers, launch Playwright, capture screenshots, run
Readability extraction, build Docker images, deploy Cloud Run, create public
URLs, make buckets public, or unlock production/external beta/paid
production/broad media.

## Validation

Run:

```sh
npm run smoke:activation-brave-search-fixture-normalizer
npm run activation:brave-search-fixture-normalizer:report
npm run activation:brave-search-fixture-normalizer:iam-plan
npm run activation:brave-search-fallback-policy:report
npm run activation:brave-search-provider:summary
```

Execution is fixture-only and requires:

```sh
GCP_PROJECT_ID=reeditpro \
GCP_REGION=us-central1 \
REEDITPRO_ENV=staging \
REEDITPRO_CONFIRM_BRAVE_FIXTURE_NORMALIZER=true \
npm run activation:brave-search-fixture-normalizer -- --execute
```

Phase 49L may start only as secret-backed, budgeted, storage-rights-approved
Brave controlled live API validation.
