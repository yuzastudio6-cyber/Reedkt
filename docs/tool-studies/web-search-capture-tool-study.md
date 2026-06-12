# WEB_SEARCH_CAPTURE Tool Study

Owner: `WEB_SEARCH_CAPTURE`

Status: `tool_study_completed_docs_diagnostics_only`

Readiness decision: `ready_for_TOOL_ROUTE_1_route_dry_run_planning_after_owner_review`

This study converts the TOOL-ROUTE-0 WEB_SEARCH_CAPTURE owner prompt into a capability routing contract. It is not an execution approval. All search, capture, extraction, screenshot processing, route, worker, provider, Supabase, production, beta, public artifact, signed URL, and raw prompt paths remain blocked.

## Source Evidence

| Evidence | Status | Notes |
| --- | --- | --- |
| #347 TOOL-ROUTE-0 | read | merged into `origin/codex/rp-model-orchestration-qwen-schema-timeout-target-calibration` at `ff9b87d5128dc09f618e7f96c71a4d2b3ac82b49` |
| `docs/activation-phase-tool-route-0-execution-unlock-audit-results.md` | read | TOOL-STUDY-0 required before route/tool execution |
| `docs/activation-phase-worker-1-approved-plan-snapshot-dry-run-results.md` | read | WORKER-1 remains dry-run-only |
| `docs/activation-worker-approved-plan-dry-run-reports/dry-run/worker-job-batch-plan.json` | available | candidate plan dry-run evidence only |
| `docs/activation-worker-approved-plan-dry-run-reports/evidence/plan-snapshot-evidence-context.json` | available | candidate-only source context |
| `open-source-tool-registry.md` | read | controlled tools preferred for browser captures, but no tools run in this phase |
| `tool-settings-catalog.md` | read | Playwright settings catalog exists for planning |
| `tool-strategy-planner.md` | read | `browser_capture_chain` is Playwright + Sharp + Remotion planning |
| Phase 44D web capability docs | read | web capability profiler is metadata-only; web search providers remain blocked |
| `server/activation/supabase-milestone-sync` | missing | milestone sync blocked on this branch; no writer added |

## Owned Scope

WEB_SEARCH_CAPTURE owns future routing policy for:

- private SearXNG search policy
- Brave Search fallback policy
- provider routing and confidence scoring
- Playwright controlled capture policy
- Mozilla Readability extraction policy
- screenshot processing policy for web/search capture only
- source, capture, and extraction manifests
- search/capture QA reports

## Not Owned

WEB_SEARCH_CAPTURE does not own general model/provider execution, Worker Runtime execution, Track A render/export, Track B media processing, AI Tools graphics, Map/geospatial rendering, Supabase schema/RLS/migrations, public artifact delivery, signed URL delivery, production unlock, or external beta unlock.

## Readiness

The main readiness decision is `ready_for_TOOL_ROUTE_1_route_dry_run_planning_after_owner_review`.

Internal beta remains blocked until a future phase approves private search/capture fixtures, privacy review, compliance review, provider-cost guardrails, worker runtime boundaries, and private artifact storage.

External beta and production remain blocked until live search/capture execution, provider fallback, browser sandboxing, source-of-truth manifests, retention, observability, abuse controls, and public delivery policies are separately approved.

## Exact No-Scope Statement

No Supabase mutation, SQL execution, Google Cloud API call, Secret Manager API call, provider call, model call, tool execution, worker execution, route execution, browser capture, Docker/Cloud Run execution, storage transfer, signed URL creation, public artifact creation, credit mutation, Stripe checkout/webhook/payment processing, deployment, internal beta unlock, external beta unlock, production unlock, dependency mutation, raw prompt execution, final render/export, or broad service-role handler was enabled.
