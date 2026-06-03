# Brave Search Fallback Policy

SearXNG remains ReeditPro's default free/open-source web search provider.
Brave Search API is recorded only as an optional paid fallback/confidence
booster for future phases.

## Brave Evidence

- Provider ID: `brave_search`
- Role: optional paid fallback/confidence booster
- Endpoint: `https://api.search.brave.com/res/v1/web/search`
- Auth header: `X-Subscription-Token`
- Secret name: `BRAVE_SEARCH_API_KEY`
- Search plan evidence: `$5 per 1,000 requests`
- Free credit evidence: `$5 in free monthly credits`
- Source evidence:
  - `https://brave.com/search/api/`
  - `https://api-dashboard.search.brave.com/documentation/pricing`
  - `https://api-dashboard.search.brave.com/documentation/resources/terms-of-service`

## Default State

- `SEARCH_PROVIDER_MODE=searxng_only`
- `BRAVE_SEARCH_ENABLED=false`
- Brave is not the free/open-source default.
- Brave must not replace SearXNG as the default provider.
- Live Brave API calls are blocked in Phase 49J.

## Future Use Conditions

Brave may be considered in a later phase only when SearXNG confidence is low or
freshness/currentness needs a confidence boost, and all of these are true:

- Admin policy enables Brave.
- `BRAVE_SEARCH_API_KEY` exists server-side.
- Budget limits allow the planned call.
- Storage-rights policy allows the planned persistence mode.
- Query/result counts are bounded.
- A future provider execution phase explicitly confirms Brave use.

No frontend code may receive or log a Brave API key.
