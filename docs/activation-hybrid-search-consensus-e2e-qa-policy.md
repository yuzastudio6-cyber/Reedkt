# Phase 49M Hybrid Search Consensus QA Policy

Mandatory gates:

- `phase49l_evidence`
- `secret_safety`
- `searxng_default_integrity`
- `brave_confidence_booster`
- `storage_rights_enforcement`
- `result_normalization`
- `dedupe_consensus`
- `allowlisted_capture`
- `playwright_capture`
- `sharp_processing`
- `readability_extraction`
- `artifact_privacy`
- `blocked_features`

Phase 49M completes only if every mandatory gate passes. Missing SearXNG
results, Brave secret/API failure, no merged sources, no allowlisted capture,
no sanitized extraction, public access, or any enabled production/beta/broad
media gate blocks the phase.
