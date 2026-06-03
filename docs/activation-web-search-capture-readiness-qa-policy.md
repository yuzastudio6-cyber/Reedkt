# Phase 49H Web Search/Capture QA Policy

Mandatory QA gates:

- `phase_evidence_chain`: Phase 49A-49G evidence exists and has no active blockers.
- `private_searxng_ready`: private authenticated service exists and has no public invoker principal.
- `provider_scope_integrity`: SearXNG remains default and paid providers remain disabled.
- `controlled_search_scope`: no new search or broad crawling runs in Phase 49H.
- `capture_scope_integrity`: capture remains allowlisted-only from existing Phase 49G evidence; no new capture runs.
- `extraction_scope_integrity`: extraction remains bounded/sanitized from existing Phase 49G evidence; no new extraction runs.
- `artifact_privacy`: private GCS paths only; no signed/public URLs as source of truth.
- `frontend_secret_safety`: frontend keeps no provider secrets and performs no heavy browser automation.
- `failure_policy`: failures fail closed without public/paid/arbitrary fallback.
- `readiness_docs_consistency`: docs and scripts agree on internal-readiness-only scope.
- `blocked_features`: production, beta, paid providers, public SearXNG, broad crawling, arbitrary capture, public artifacts, and final delivery remain blocked.

All mandatory gates must pass before `webSearchCaptureInternalTestingReady=true`.
