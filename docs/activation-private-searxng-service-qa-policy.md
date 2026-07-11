# Phase 49F Private SearXNG QA Policy

Mandatory QA gates:

- `phase49e_evidence`
- `private_service_deployed_or_resolved`
- `service_access_control`
- `searxng_api_health`
- `controlled_query`
- `result_normalization`
- `artifact_privacy`
- `blocked_features`

Phase49G readiness is true only when every mandatory gate passes. If Docker, Cloud Run, authenticated invocation, JSON search, result normalization, or private artifact upload fails, Phase 49F remains blocked with the exact reason.
