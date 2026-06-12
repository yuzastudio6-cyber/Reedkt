# TOOL-STUDY-0 Web Search Capture Capability Routing Contract

Owner: `WEB_SEARCH_CAPTURE`

Branch: `codex/rp-tool-study-0-web-search-capture`

Base: `origin/codex/rp-model-orchestration-qwen-schema-timeout-target-calibration`

## Goal

Create the WEB_SEARCH_CAPTURE tool study and capability routing contract for ReEditPro. The study maps owned web-search/capture capabilities, tool combinations, routing rules, evidence handoffs, and blockers before future route or tool execution is separately considered.

## Source-Of-Truth Inputs

- `docs/activation-phase-tool-route-0-execution-unlock-audit-results.md`
- `docs/activation-phase-worker-1-approved-plan-snapshot-dry-run-results.md`
- `docs/activation-worker-approved-plan-dry-run-reports/dry-run/worker-job-batch-plan.json`
- `docs/activation-worker-approved-plan-dry-run-reports/evidence/plan-snapshot-evidence-context.json`
- `open-source-tool-registry.md`
- `tool-settings-catalog.md`
- `tool-strategy-planner.md`
- `docs/activation-phase-44d-web-capability-profiler.md`
- `docs/activation-phase-44d-web-capability-privacy-policy.md`
- `docs/activation-phase-44d-web-capability-route-handoff.md`
- `docs/activation-phase-44d-web-capability-blocked-scope-matrix.md`

## Owned Tools And Records

- `private_searxng`
- `brave_search_fallback`
- `provider_routing_confidence_scoring`
- `playwright_controlled_capture`
- `mozilla_readability_extraction`
- `web_capture_screenshot_processing`
- `source_manifest`
- `capture_manifest`
- `extraction_manifest`
- `search_capture_qa_report`

## Explicitly Not Owned

- general provider/model execution
- Worker Runtime execution
- Track A render/export
- Track B media processing
- AI Tools graphics
- Map/geospatial rendering
- Supabase schema/RLS/migrations
- public artifact delivery
- signed URL delivery
- production/external beta unlock

## Related Workstreams

- `PROVIDER_GATEWAY_MODELS`
- `WORKER_RUNTIME_JOBS`
- `TRACK_A_RENDER_EXPORT`
- `TRACK_B_MEDIA_PROCESSING`
- `AI_TOOLS_CREATIVE_GRAPHICS`
- `MAP_GEOSPATIAL`
- `SUPABASE_RLS_STORAGE_DATABASE`
- `OBSERVABILITY_AUDIT_COST`
- `COMPLIANCE_SECURITY`
- `FRONTEND_PRODUCT_UX`

## Required Deliverables

- `docs/tool-studies/web-search-capture-tool-study.md`
- `docs/tool-studies/web-search-capture-capability-map.md`
- `docs/tool-studies/web-search-capture-tool-combination-map.md`
- `docs/tool-studies/web-search-capture-routing-policy.md`
- `docs/tool-studies/web-search-capture-handoff-contract.md`
- `docs/tool-studies/web-search-capture-internal-beta-gap-map.md`
- `docs/tool-studies/web-search-capture-blocked-use-register.md`
- `docs/prompt-tool-study-0-web-search-capture-validation-results.md`
- `scripts/validation/tool-study-web-search-capture-diagnostics.mjs`

## Routing Policy Requirements

Define how the AI chooses:

- no search
- private SearXNG
- Brave fallback
- controlled browser capture
- Readability extraction
- screenshot processing
- manifest-only handoff

The policy must explain that sanitized source manifests, capture manifests, extraction manifests, and QA reports are the only source-of-truth evidence outputs. Raw provider/search responses, raw snippets, signed URLs, raw prompts, and public artifacts are not source-of-truth.

## Blocked Scope

- web search execution
- browser capture execution
- SearXNG calls
- Brave calls
- Playwright browser launch
- Mozilla Readability execution
- screenshot processing execution
- provider/model calls
- tool execution
- worker execution
- route execution
- Supabase mutation
- SQL/migrations/schema/RLS changes
- Google Cloud API calls
- Secret Manager API calls
- GCS upload/storage transfer
- public artifacts
- signed URL creation
- raw prompt execution
- production/internal beta/external beta/paid production unlock

## Validation

Run local docs/diagnostics checks only:

- `DEVELOPER_DIR=/Library/Developer/CommandLineTools git diff --check`
- `npm ci`
- `npm run lint`
- `npm run typecheck:server`
- `npm run --silent tool-study:web-search-capture:diagnostics`
- `npm run build`
- `npm run build:server`
- changed-file and staged safety scans
- `DEVELOPER_DIR=/Library/Developer/CommandLineTools git diff --cached --check`

## Final Response Format

Include branch, PR link, draft status, commit hash, files changed, source-of-truth read status, tools studied, capability map, tool combination map, routing policy, handoff contract, internal beta gap map, blocked-use register, diagnostics status, readiness decision, blockers, Supabase classification, cross-chat impact, handoff needed, duplicate risk, evidence docs, next Supabase action, Supabase milestone sync, exact no-scope statement, and recommended next prompt.
