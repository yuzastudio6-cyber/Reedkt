# Brave Search Fixture Normalizer Policy

Phase 49K represents Brave Search API shape with deterministic generated
fixtures only.

## Defaults

- SearXNG remains the default free/open-source provider.
- Brave Search remains optional paid fallback/confidence booster only.
- `BRAVE_SEARCH_ENABLED=false`.
- `BRAVE_SEARCH_API_KEY` is a secret name only; no value is stored in code,
  docs, logs, frontend, or git.
- Live Brave API calls are blocked.
- Paid provider execution is blocked.
- Raw Brave response and real snippet persistence are blocked.

## Fixture Rules

- Fixture query: `ReeditPro AI video editing planning tools`.
- Fixture domains are limited to `example.invalid`, `docs.example.test`,
  `source.example.test`, and `planning.example.test`.
- Fixture source records must be marked `generatedFixture=true`,
  `providerMode=fixture`, and `liveProviderCallUsed=false`.
- Capture and extraction remain false for every normalized source.
- Unsafe schemes, localhost, private IPs, and non-fixture domains are rejected.

## Provider Router

The default provider mode is `searxng_only`. Future Brave modes may be planned
but not executed:

- `searxng_with_brave_fallback`
- `hybrid_consensus`
- `brave_only_diagnostic`

All Brave execution remains blocked until a later explicit phase approves
secret, budget, storage, and runtime controls.
