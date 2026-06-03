# Phase 49J Brave Search Fallback Policy Results

## Status

Completed as a static policy gate.

Phase 49J records Brave Search API as an optional paid fallback/confidence
provider while keeping SearXNG as ReeditPro's default free/open-source provider.
No live Brave API call, paid provider call, live search, browser capture,
Readability extraction, Docker/GCP mutation, secret creation, public URL, public
artifact, production unlock, external beta unlock, paid production unlock, or
broad media unlock occurred.

## Provider Decision

- Default provider: SearXNG
- Brave status: optional fallback/confidence booster only
- Brave enabled by default: false
- Live Brave API allowed: false
- Paid provider allowed: false
- Raw Brave response storage allowed: false

## Evidence Summary

- Endpoint: `https://api.search.brave.com/res/v1/web/search`
- Auth header: `X-Subscription-Token`
- Secret name: `BRAVE_SEARCH_API_KEY`
- Search plan pricing evidence: `$5 per 1,000 requests`
- Free monthly credit evidence: `$5 in free monthly credits`
- Storage-rights warning: raw Brave API result storage requires explicit storage
  rights in the selected plan or terms.

## Confidence Policy

SearXNG confidence is scored from result count, unique domains, official and
allowlisted sources, duplicate ratio, snippet quality, freshness, blocked
domains, and optional source-quality score.

- `high`: 75-100
- `medium`: 50-74
- `low`: below 50

Brave fallback may be recommended only for low confidence or a freshness gap,
but execution remains blocked until a future explicit provider phase.

## QA Summary

All mandatory gates pass:

- `brave_provider_evidence`
- `default_provider_integrity`
- `secret_safety`
- `cost_policy`
- `storage_rights_policy`
- `confidence_policy`
- `provider_router_policy`
- `paid_provider_blocked`
- `blocked_features`

## Phase49K Readiness

Ready for Brave-shaped fixture and normalizer only.

Phase 49K must not call Brave API, require a secret, store real Brave responses,
run live search, call paid providers, launch browser capture, run Readability,
or unlock production/external beta/broad media.

## Blocked Scopes

Live Brave API, paid providers, provider fallback execution, live search,
public SearXNG fallback, browser capture, screenshot processing, Readability
extraction, raw Brave response storage, snippet persistence, API keys,
providers, Docker, Cloud Run, public artifacts, signed URL source-of-truth,
production, external beta, paid production, broad media, and Revideo remain
blocked.
