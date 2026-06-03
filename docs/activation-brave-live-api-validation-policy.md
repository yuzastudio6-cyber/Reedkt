# Phase 49L Brave Live API Validation Policy

Phase 49L is a controlled live API validation for Brave Search only. It proves
that Brave can be called as an optional paid confidence/fallback provider when
explicitly enabled, budgeted, and backed by backend-only Secret Manager access.

## Provider Policy

- Default provider: SearXNG.
- Brave role: optional paid fallback/confidence validation.
- Allowed endpoint: `https://api.search.brave.com/res/v1/web/search`.
- Allowed query: `ReeditPro AI video editing planning tools`.
- Max queries: 1.
- Max results: 5.
- Search params: `search_lang=en`, `country=us`, `safesearch=moderate`.

Disallowed endpoints include image, news, video, local, answers, rich, LLM
context, autosuggest, search goggles, pagination, and extra snippets.

## Secret Policy

The only approved secret name is `BRAVE_SEARCH_API_KEY`. The key must come from
backend env or Google Secret Manager in project `reeditpro`; GitHub secrets and
frontend exposure are not used.

The secret value must not appear in CLI output, logs, docs, reports, artifacts,
PR body, frontend code, or git.

## Budget Policy

Execution requires:

- `BRAVE_SEARCH_ENABLED=true`
- `BRAVE_SEARCH_DAILY_LIMIT=1`
- `BRAVE_SEARCH_MONTHLY_BUDGET_USD=1`
- `BRAVE_SEARCH_MAX_RESULTS=5`
- `BRAVE_SEARCH_MAX_QUERIES_PER_RUN=1`
- `BRAVE_SEARCH_STORE_RAW_RESULTS=false`
- `BRAVE_SEARCH_STORE_SNIPPETS=false`

If any budget or storage setting fails, the API call is blocked.

## Storage Policy

Raw Brave responses and snippets are blocked. Phase 49L stores only minimal
normalized metadata: provider, provider mode, title, URL, domain, rank,
retrieved time, source type, attribution flag, and blocked capture/extraction
flags.

Production, external beta, paid production, broad media, public artifacts, and
browser/extraction runtime remain blocked.
