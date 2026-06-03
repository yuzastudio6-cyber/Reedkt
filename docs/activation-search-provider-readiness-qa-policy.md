# Phase 49N Search Provider Readiness QA Policy

Mandatory QA gates:

- `phase_evidence_chain`
- `searxng_default_ready`
- `brave_optional_ready`
- `hybrid_consensus_ready`
- `secret_safety`
- `cost_policy`
- `storage_policy`
- `provider_registry`
- `failure_policy`
- `artifact_privacy`
- `blocked_features`

The search provider stack is ready for controlled internal testing only when
every mandatory gate passes.

Failures must fail closed:

- No fallback to public SearXNG.
- No automatic Brave fallback.
- No fallback to Tavily, Exa, Firecrawl, Browserless, Browserbase, or other paid providers.
- No arbitrary URL capture.
- No raw Brave response or snippet persistence.
- No public artifact or signed URL source-of-truth fallback.
