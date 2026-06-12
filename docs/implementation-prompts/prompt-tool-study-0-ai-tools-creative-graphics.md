# TOOL-STUDY-0 AI Tools Creative Graphics Capability Routing Contract

Owner: `AI_TOOLS_CREATIVE_GRAPHICS`

## Goal

Create the AI_TOOLS_CREATIVE_GRAPHICS tool study and capability routing contract for ReEditPro. The study maps controlled creative graphics capabilities, tool combinations, routing rules, source-of-truth manifests, evidence handoffs, beta gaps, and blocked runtime uses before future route or tool execution is separately considered.

This is docs/diagnostics only. Do not run Remotion, D3 rendering, ECharts rendering, Vega/Vega-Lite rendering, Three.js/WebGL, PixiJS/canvas, Anime.js, Lottie-web, SVG.js, Viz.js/Graphviz, Satori, resvg, browser/canvas rendering, SVG rasterization, providers, tools, workers, routes, Supabase, SQL, GCS, signed URLs, public artifacts, beta, production, dependency mutation, or raw prompts.

## Source Of Truth

- `README.md`
- `AGENTS.md`
- `design.md`
- `visual-storytelling-architecture.md`
- `open-source-tool-registry.md`
- `tool-settings-catalog.md`
- `tool-strategy-planner.md`
- `render-strategy-planner.md`
- `remotion-capability-matrix.md`
- `remotion-renderer-plan.md`
- `chart-diagram-planning.md`
- `chart-diagram-settings-catalog.md`
- `docs/activation-phase-tool-route-0-execution-unlock-audit-results.md`
- `docs/activation-phase-worker-1-approved-plan-snapshot-dry-run-results.md`
- `docs/tool-studies/web-search-capture-*`
- `docs/tool-studies/map-geospatial-*`
- `server/tool-registry/production-tool-profiles.ts`
- `package.json`

Record missing optional source paths instead of creating unrelated trees.

## Owned Capabilities

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

Each capability record must include owner, strengths, non-goals, best use cases, bad use cases, allowed inputs, blocked inputs, output artifact types, render-readiness, alpha/transparency support, runtime/package needs, browser/server/native/Docker needs, cost/latency risk, quality strengths, failure modes, security/license notes, private artifact policy, source-of-truth policy, Track A/Track B/Supabase/Worker/Provider handoffs, QA requirements, fixture status, beta blockers, production blockers, and next action.

## Explicitly Not Owned

- Track A final render/export execution
- Track B media processing
- Worker Runtime execution
- Provider Gateway execution
- Supabase schema/RLS/migrations
- Map/geospatial route logic
- Web search/capture
- Sound/music/audio runtime
- public artifact delivery
- signed URL delivery
- production or external beta unlock

## Related Workstreams

- TRACK_A_RENDER_EXPORT
- TRACK_B_MEDIA_PROCESSING
- WORKER_RUNTIME_JOBS
- PROVIDER_GATEWAY_MODELS
- SUPABASE_RLS_STORAGE_DATABASE
- OBSERVABILITY_AUDIT_COST
- COMPLIANCE_SECURITY
- FRONTEND_PRODUCT_UX
- MAP_GEOSPATIAL
- WEB_SEARCH_CAPTURE
- SOUND_MUSIC_AUDIO

## Routing Policy Requirements

- Use Remotion planning for deterministic cards, lower thirds, callouts, safe-zone overlays, and motion layer specs.
- Use D3 for custom diagrams, timelines, money flows, exact arrows, and network relationships.
- Use ECharts for standard business charts, metric cards, finance charts, and dashboard visuals.
- Use Vega/Vega-Lite for future declarative chart specs and repeatable structured dataviz.
- Use Satori/resvg for future card-to-SVG and SVG-to-image pipelines after sanitizer, font, and native dependency review.
- Use SVG.js for future safe vector layer specs.
- Use Lottie-web for reusable vector animation overlays with provenance review.
- Use Anime.js for future easing/timing preset specs only.
- Use PixiJS for future high-performance 2D canvas effects when they support meaning.
- Use Three.js for future 3D visual elements only when 3D materially improves the edit.
- Use Viz.js/Graphviz for future DOT graph layouts after sandbox and graph-size review.
- Hand off to Track A only after approved manifests, source refs, checksums, QA, and owner review.
- Hand off to Provider Gateway/DeepSeek for coding/spec proposals only; never for execution.

## Blocked Scope

- final render/export
- direct worker execution
- direct provider/model calls
- direct tool execution
- route execution
- graphics generation
- unreviewed generated code execution
- unapproved package install
- public artifacts
- signed URLs as source-of-truth
- raw prompt execution
- production/external beta/paid production/broad media unlock

## Diagnostics

Add a Node-built-in diagnostics script that verifies expected docs exist, all owned tool IDs are mentioned, the exact no-scope statement is present, Supabase sync is recorded as `blocked_current_branch_missing_sync_layer`, and changed docs do not claim graphics generation, chart rendering, SVG rasterization, runtime execution, Supabase mutation, public delivery, or beta/production unlock.

## Validation

Run local diagnostics, lint, server typecheck, builds, `git diff --check`, changed-file safety scan, staged safety scan, and `git diff --cached --check`. Do not mutate dependencies or `package-lock.json`.

## Final Response Format

Include branch, PR link, draft status, commit hash, files changed, source-of-truth read status, tools studied, capability map, tool combination map, routing policy, handoff contract, internal beta gap map, blocked-use register, diagnostics status, readiness decision, blockers, Supabase classification, cross-chat impact, handoff needed, duplicate risk, evidence docs, next Supabase action, Supabase milestone sync, exact no-scope statement, and recommended next prompt.
