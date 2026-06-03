# Brave Search Fallback Policy Runbook

Phase 49J is a static policy gate. It records Brave Search API as an optional
paid fallback/confidence provider while SearXNG remains the default
free/open-source provider.

## Allowed

- Build static Phase 49J reports.
- Review provider evidence, cost limits, secret policy, storage-rights policy,
  SearXNG confidence scoring, and provider-router modes.
- Proceed to Phase 49K only as a Brave-shaped fixture and normalizer phase.

## Blocked

Do not call Brave Search API, run live search, call paid providers, add a real
API key, launch Playwright, capture screenshots, run Readability extraction,
build or push Docker images, deploy Cloud Run, create public URLs, make buckets
public, or unlock production, external beta, paid production, or broad media.

`activation:brave-search-fallback-policy` is static/report-only. Passing
`--execute` must remain blocked.

## Validation

Run:

```sh
npm run smoke:activation-brave-search-fallback-policy
npm run activation:brave-search-fallback-policy:report
npm run activation:brave-search-provider:summary
```

Then run the broader Phase 49J validation suite from the results doc.
