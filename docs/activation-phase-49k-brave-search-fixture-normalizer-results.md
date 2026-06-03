# Phase 49K Brave Search Fixture Normalizer Results

## Status

Completed as a generated fixture and normalizer gate.

Phase 49K proves Brave Search can be represented in ReeditPro's optional
provider architecture using deterministic generated fixture data only. SearXNG
remains the default provider. Brave remains disabled by default and future
scoped.

Run ID: `phase49k-20260603T13270`

## Fixture Summary

- Provider: `brave_search`
- Provider mode: `fixture`
- Query: `ReeditPro AI video editing planning tools`
- Fixture result count: 6 generated records
- Normalized source count: 6 generated records
- Fixture domains: `docs.example.test`, `source.example.test`,
  `planning.example.test`, and `example.invalid`
- Live Brave API used: false
- Paid provider used: false
- Raw real Brave response stored: false

## Normalizer Summary

The normalizer creates ReeditPro source records with provider attribution,
domain, rank, fixture-only snippet preview, generated fixture flags,
`captureAllowed=false`, `extractionAllowed=false`,
`liveProviderCallUsed=false`, and `rawProviderResponseStored=false`.

Unsafe schemes, localhost/private IPs, missing title/URL/description, and
non-fixture domains are rejected.

## Confidence And Router

SearXNG confidence fixture scenarios cover high confidence, low confidence, and
freshness gaps. Brave fallback may be recommended for low confidence or
freshness gaps, but Brave execution remains blocked in Phase 49K.

Router modes exist as planning-only:

- `searxng_only`
- `searxng_with_brave_fallback`
- `hybrid_consensus`
- `brave_only_diagnostic`

## Dedupe Summary

The fixture compares generated SearXNG records with generated Brave records,
records overlapping URLs, provider agreement, source diversity, promoted
sources, and provider contribution. It does not claim real consensus.

## QA Summary

Mandatory gates:

- `phase49j_evidence`
- `brave_fixture_integrity`
- `brave_normalizer`
- `storage_rights_enforcement`
- `secret_safety`
- `searxng_confidence_policy`
- `provider_router_policy`
- `dedupe_policy`
- `paid_provider_blocked`
- `artifact_privacy`
- `blocked_features`

All mandatory gates passed for `phase49k-20260603T13270`.

## Phase49L Handoff

Phase 49L may run only as a secret-backed, budgeted Brave controlled live API
validation. It must keep SearXNG as the default provider, call only the Brave
web search endpoint, persist only minimal normalized metadata, and keep raw
Brave response storage, snippet storage, browser capture, Readability
extraction, other paid providers, production, external beta, paid production,
and broad media blocked.

## Private Artifacts

Generated assets:

- `gs://reeditpro-staging-reeditpro-generated-assets/activation-web-search/phase49k/phase49k-20260603T13270/plan/brave-fixture-normalizer-plan.json`
- `gs://reeditpro-staging-reeditpro-generated-assets/activation-web-search/phase49k/phase49k-20260603T13270/fixture/brave-shaped-fixture-response.json`
- `gs://reeditpro-staging-reeditpro-generated-assets/activation-web-search/phase49k/phase49k-20260603T13270/normalized/brave-normalized-sources.json`
- `gs://reeditpro-staging-reeditpro-generated-assets/activation-web-search/phase49k/phase49k-20260603T13270/confidence/searxng-confidence-scenarios.json`
- `gs://reeditpro-staging-reeditpro-generated-assets/activation-web-search/phase49k/phase49k-20260603T13270/router/provider-router-decisions.json`
- `gs://reeditpro-staging-reeditpro-generated-assets/activation-web-search/phase49k/phase49k-20260603T13270/dedupe/searxng-brave-dedupe-fixture.json`
- `gs://reeditpro-staging-reeditpro-generated-assets/activation-web-search/phase49k/phase49k-20260603T13270/sources/brave-fixture-source-manifest.json`

QA artifacts:

- `gs://reeditpro-staging-reeditpro-qa-artifacts/activation-web-search/phase49k/phase49k-20260603T13270/qa/brave-search-fixture-normalizer-qa.json`
- `gs://reeditpro-staging-reeditpro-qa-artifacts/activation-web-search/phase49k/phase49k-20260603T13270/reports/phase49k-report.json`

## Phase49L Readiness

Ready only for Brave controlled live API validation after secret setup, budget
policy approval, and storage-rights approval.

## Blocked

Live Brave API, real Brave response storage, real snippet persistence, paid
provider execution, live search, browser capture, Readability extraction,
Docker, Cloud Run, public artifacts, production, external beta, paid production,
and broad media remain blocked.
