# Phase 49C Playwright + Sharp Capture Fixture QA Policy

Mandatory gates:

- `phase49b_evidence`
- `local_fixture_integrity`
- `playwright_capture`
- `sharp_processing`
- `artifact_manifest`
- `artifact_privacy`
- `blocked_features`

QA must prove Phase 49B evidence is present, the generated HTML fixture has no external assets, Playwright captured only the local fixture, Sharp processed the local screenshot into preview and thumbnail PNGs, the artifact manifest records no live search or paid provider use, and all artifacts remain private.

Passing Phase 49C means only that Phase 49D may validate generated/local Readability extraction fixtures. It does not approve public web capture or live search.
