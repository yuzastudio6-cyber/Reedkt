# Phase 49A Web Search/Capture QA Policy

Phase 49A QA is static. It proves that the approval workflow is scoped, fail-closed, and non-mutating.

## QA Gates

- `tool_evidence`
- `license_review`
- `free_open_source_default`
- `paid_provider_disabled`
- `frontend_secret_safety`
- `no_live_search`
- `no_browser_execution`
- `no_public_artifacts`
- `risk_register_complete`
- `future_scope_defined`
- `package_scripts_present`
- `blocked_features`

## Passing Criteria

The phase passes only when:

- SearXNG, Playwright, Sharp, and Mozilla Readability have evidence records.
- Optional paid providers are disabled by default and require future approval.
- Live search, browser capture, screenshot processing, Readability runtime, provider calls, public artifacts, production, external beta, paid production, broad real media, and Revideo are false.
- Risk records include blocker and warning risks with mitigation and evidence required to clear.
- Future phases 49B-49F are defined without executable commands.

No runtime search/capture QA occurs in Phase 49A.
