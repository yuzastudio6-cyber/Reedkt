# Brave Search Fixture Normalizer QA Policy

Phase 49K passes only when all mandatory QA gates pass.

## Gates

- `phase49j_evidence`: Phase 49J policy exists and marks Phase 49K ready only
  for generated Brave-shaped fixture work.
- `brave_fixture_integrity`: fixture is generated-only and no live API/raw real
  response is used.
- `brave_normalizer`: records normalize with provider attribution, fixture
  flags, unsafe URL rejection, and capture/extraction blocked.
- `storage_rights_enforcement`: raw Brave response and snippet storage remain
  blocked by default.
- `secret_safety`: no Brave API key value appears in tracked text.
- `searxng_confidence_policy`: high/low/freshness scenarios produce expected
  fallback recommendations.
- `provider_router_policy`: SearXNG remains default and Brave modes are
  planning-only.
- `dedupe_policy`: fixture dedupe records overlap, agreement, diversity, and
  provider contribution.
- `paid_provider_blocked`: no live Brave or paid provider execution is allowed.
- `artifact_privacy`: private GCS paths only; no signed URLs as source of
  truth.
- `blocked_features`: live search, browser capture, extraction, production,
  external beta, paid production, and broad media remain blocked.

Phase 49L readiness means controlled Brave live API validation may be planned
only after secret setup, budget approval, and storage-rights approval.
