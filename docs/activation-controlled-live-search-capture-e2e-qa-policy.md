# Phase 49G Controlled Private Live Search/Capture E2E QA Policy

Mandatory gates:

- `phase49f_evidence`
- `plan_snapshot_integrity`
- `private_searxng_query`
- `result_normalization`
- `allowlisted_capture_policy`
- `playwright_capture`
- `sharp_processing`
- `readability_extraction`
- `combined_manifest`
- `artifact_privacy`
- `blocked_features`

Phase 49G passes only if Phase 49F evidence is approved, private SearXNG responses are available, normalized sources are attributed and bounded, at least one allowlisted Playwright capture succeeds, Sharp derivatives exist for captures, at least one Readability extraction is sanitized and display-safe, the combined manifest links all records, artifacts remain private, and paid providers/public SearXNG/arbitrary capture/production/beta gates remain blocked.

If no allowlisted result is returned or capture/extraction fails for all selected pages, Phase 49G is blocked with the exact reason. It must not substitute non-allowlisted pages, paid providers, public SearXNG instances, or fixture data.
