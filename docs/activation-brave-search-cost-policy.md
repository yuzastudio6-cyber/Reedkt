# Brave Search Cost Policy

Phase 49J records budget controls only. It does not call Brave Search API.

## Defaults

- `BRAVE_SEARCH_ENABLED=false`
- `BRAVE_SEARCH_DAILY_LIMIT=0`
- `BRAVE_SEARCH_MONTHLY_BUDGET_USD=0`
- `BRAVE_SEARCH_MAX_RESULTS=5`
- `BRAVE_SEARCH_MAX_QUERIES_PER_RUN=1`
- `BRAVE_SEARCH_TIMEOUT_MS=8000`
- `BRAVE_SEARCH_STORE_RAW_RESULTS=false`

## Rules

- No Brave call when daily or monthly budget is zero.
- No Brave call when the backend secret is missing.
- No Brave call outside a future explicitly confirmed provider execution phase.
- No unbounded retries.
- No automatic fallback to another paid provider.
- Future QA must record request count and estimated cost.

These rules keep paid provider use disabled by default and prevent surprise
costs.
