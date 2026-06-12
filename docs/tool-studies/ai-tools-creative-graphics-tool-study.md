# TOOL-STUDY-0 AI_TOOLS_CREATIVE_GRAPHICS Tool Study

Status: `docs_diagnostics_only`

Owner: `AI_TOOLS_CREATIVE_GRAPHICS`

Base evidence: TOOL-ROUTE-0 passed with run `toolroute0-20260612T201155`; WORKER-1 passed with run `worker1-20260612T193823`; WEB_SEARCH_CAPTURE PR #354 and MAP_GEOSPATIAL PR #356 are merged into `origin/codex/rp-model-orchestration-qwen-schema-timeout-target-calibration` at `c0c96030358d52852b712b9f239a3237490d25ec`.

## Purpose

AI_TOOLS_CREATIVE_GRAPHICS defines how ReEditPro chooses controlled creative graphics capabilities before any route, tool, worker, provider, graphics generation, render, rasterization, or export path is separately approved. The contract covers motion graphics, animated overlays, title cards, lower thirds, infographics, charts, diagrams, SVG graphics, brand-style cards, callouts, timelines, data visualization, UI-style animation, 3D visual elements, canvas effects, Lottie overlays, graph/network diagrams, render-ready asset planning, transparent overlay planning, and social video graphics.

The study outputs review-only docs and diagnostics. It does not run Remotion, D3, Three.js, PixiJS, Anime.js, Lottie-web, SVG.js, ECharts, Vega/Vega-Lite, Viz.js/Graphviz, Satori, resvg, canvas, browser rendering, SVG rasterization, providers, tools, workers, routes, Supabase, SQL, GCS, signed URL creation, public artifacts, beta, production, dependency mutation, or raw prompt execution.

## Source-Of-Truth Reads

| Source | Status |
| --- | --- |
| `README.md` | read |
| `AGENTS.md` | read |
| `design.md` | read |
| `visual-storytelling-architecture.md` | read |
| `open-source-tool-registry.md` | read |
| `tool-settings-catalog.md` | read |
| `tool-strategy-planner.md` | read |
| `render-strategy-planner.md` | read |
| `remotion-capability-matrix.md` | read |
| `remotion-renderer-plan.md` | read |
| `chart-diagram-planning.md` | read |
| `chart-diagram-settings-catalog.md` | read |
| `docs/runtime-unlock/` | missing_on_base |
| `docs/cross-chat/` | missing_on_base |
| `docs/agents/` | missing_on_base |
| `docs/tool-studies/` | read |
| `docs/tool-call-foundation.md` | missing_on_base |
| `docs/provider-gateway-foundation.md` | missing_on_base |
| `docs/worker-claim-execution-contract-hardening.md` | missing_on_base |
| `docs/activation-phase-tool-route-0-execution-unlock-audit-results.md` | read |
| `docs/activation-phase-worker-1-approved-plan-snapshot-dry-run-results.md` | read |
| `docs/implementation-prompts/prompt-tool-study-0-ai-tools-creative-graphics.md` | read and enriched |
| AI Tools related docs/modules | read via local `rg` only |
| `server/tool-registry/production-tool-profiles.ts` | read |
| `package.json` | read |
| `server/activation/supabase-milestone-sync` | missing_on_base |

## Existing Repo Facts

- `package.json` does not list runtime packages for Remotion, D3, Three.js, PixiJS, Anime.js, Lottie-web, SVG.js, ECharts, Vega, Vega-Lite, Viz.js, Satori, or resvg.
- The production tool registry has planning/profile records for `remotion`, `d3`, `echarts`, `vega_lite`, `pixijs`, `three_js`, `lottie`, and `sharp`.
- Current planning docs prefer controlled tools and Remotion for exact cards, charts, labels, diagrams, and data visuals, while keeping rendering and worker execution blocked.

## Owned Capability Records

- `remotion`
- `d3`
- `three_js`
- `pixijs`
- `anime_js`
- `lottie_web`
- `svg_js`
- `echarts`
- `vega`
- `vega_lite`
- `viz_js`
- `graphviz`
- `satori`
- `resvg_js`

## Not Owned

- TRACK_A_RENDER_EXPORT final render/export execution
- TRACK_B_MEDIA_PROCESSING
- WORKER_RUNTIME_JOBS execution
- PROVIDER_GATEWAY_MODELS execution
- SUPABASE_RLS_STORAGE_DATABASE schema/RLS/migrations
- MAP_GEOSPATIAL route logic
- WEB_SEARCH_CAPTURE search/capture
- SOUND_MUSIC_AUDIO runtime
- public artifact delivery
- signed URL delivery
- production or external beta unlock

## Readiness Decision

Decision: `ready_for_TOOL_ROUTE_1_route_dry_run_planning_after_owner_review`

This means TOOL-ROUTE-1 may use AI_TOOLS_CREATIVE_GRAPHICS as a review-only owner contract for route dry-run planning. It does not approve graphics generation, renderer execution, SVG rasterization, final render/export, worker execution, provider execution, Supabase mutation, GCS upload, public artifacts, signed URLs, internal beta, external beta, or production.

## Supabase Classification

Supabase update required: docs/status only

Supabase update status: `docs_only`

Supabase environment touched: none

SQL executed: none

Migration deployed: no

Next Supabase action: none

Supabase milestone sync: `blocked_current_branch_missing_sync_layer`

## Exact No-Scope Statement

No Supabase mutation, SQL execution, Google Cloud API call, Secret Manager API call, provider call, model call, tool execution, worker execution, route execution, browser capture, Docker/Cloud Run execution, storage transfer, signed URL creation, public artifact creation, credit mutation, Stripe checkout/webhook/payment processing, deployment, internal beta unlock, external beta unlock, production unlock, dependency mutation, raw prompt execution, final render/export, or broad service-role handler was enabled.
