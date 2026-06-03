# Phase 49I Web Search/Capture UI API Gating QA Policy

Mandatory QA gates:

- `phase49h_evidence`: canonical Phase 49H evidence is present and ready.
- `api_route_gating`: internal routes are authenticated and gate-only.
- `request_validation`: unsafe request fields are rejected.
- `provider_gate_integrity`: SearXNG remains default and only private fixture provider mode is accepted.
- `ui_scope_integrity`: UX is internal display/gate only.
- `frontend_secret_safety`: no frontend provider secrets or heavy browser execution.
- `no_live_search_or_capture`: no search, capture, Sharp, or Readability runtime in Phase 49I.
- `artifact_privacy`: private GCS JSON only.
- `docs_scripts_consistency`: scripts and docs match the Phase 49I scope.
- `blocked_features`: production, beta, paid providers, public SearXNG, arbitrary capture, broad crawling, public artifacts, and signed URL source-of-truth remain blocked.

Any mandatory gate failure blocks Phase 49J readiness.
