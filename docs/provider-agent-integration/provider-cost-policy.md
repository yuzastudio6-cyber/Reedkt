# Provider Cost Policy

PROVIDER-1 budget is zero. Provider calls are blocked.

Future live validation defaults:

- max calls per phase: `1`
- retry limit: `0`
- timeout: `60000ms`
- automatic provider fallback: blocked
- production paid calls: blocked
- storage: sanitized response summary only
- pricing: current official pricing must be rechecked before any nonzero spend
  cap is enabled

Future phases must define per-call token budgets, per-run token budgets, daily
spend caps, provider timeout, retry limit, max live calls, no automatic fallback
without policy, and cost estimates tied to approved plan snapshots where user
credits could be affected.
