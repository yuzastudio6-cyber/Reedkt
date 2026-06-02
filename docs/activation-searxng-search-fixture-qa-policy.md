# Phase 49B SearXNG Search Fixture QA Policy

Mandatory gates:

- `phase49a_evidence`
- `fixture_integrity`
- `normalization_integrity`
- `plan_snapshot_integrity`
- `source_manifest_integrity`
- `paid_provider_blocking`
- `browser_capture_blocking`
- `artifact_privacy`
- `blocked_features`

QA must prove the fixture response is deterministic, has 5-8 generated results, normalizes into source records with attribution fields, rejects unsafe URLs, and uploads only private JSON artifacts. It must also prove live search, browser capture, screenshot processing, Readability extraction, paid providers, public artifacts, production, external beta, paid production, broad media, providers, and Revideo remain blocked.

Passing Phase 49B means only that Phase 49C may validate generated/local Playwright + Sharp capture fixtures. It is not approval for live search or public web capture.
