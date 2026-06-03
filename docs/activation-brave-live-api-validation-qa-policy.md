# Phase 49L Brave Live API Validation QA Policy

Phase 49L passes only when all mandatory gates pass.

## Gates

- `phase49k_evidence`: Phase 49K fixture normalizer evidence exists and marks
  Phase 49L ready.
- `secret_safety`: Brave key is backend-only, not logged, not stored, not
  printed, not committed, and not exposed to frontend code.
- `budget_guard`: one query, max five results, daily/monthly budget, and no
  pagination or extra snippets.
- `brave_live_api_call`: one Brave Search web endpoint call succeeds; request
  headers and raw response are not stored.
- `result_normalization`: live results become minimal ReeditPro source records.
- `storage_rights_enforcement`: raw response and snippets remain blocked.
- `paid_provider_scope`: only Brave Search is called; no other paid provider is
  used.
- `artifact_privacy`: artifacts stay private; no signed URLs are source of
  truth.
- `blocked_features`: browser capture, extraction, production, beta, paid
  production, and broad media remain blocked.

Phase49M is ready only for SearXNG + Brave hybrid consensus E2E when these
gates pass.
