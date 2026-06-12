# AI_TOOLS_CREATIVE_GRAPHICS Internal Beta Gap Map

Internal beta readiness: `blocked_pending_future_runtime_and_artifact_policy`

## Gaps

| Gap | Owner | Status | Required Before Internal Beta |
| --- | --- | --- | --- |
| Graphics runtime boundary | `WORKER_RUNTIME_JOBS` / `TRACK_A_RENDER_EXPORT` | blocked | approved worker, route dry-run, renderer boundary, deterministic private artifacts |
| Package/install policy | `AI_TOOLS_CREATIVE_GRAPHICS` / `COMPLIANCE_SECURITY` | blocked | dependency approval for Remotion, D3, Three.js, PixiJS, Anime.js, Lottie-web, SVG.js, ECharts, Vega, Viz.js, Satori, and resvg |
| Manifest schemas | `AI_TOOLS_CREATIVE_GRAPHICS` | blocked | chart, diagram, card, SVG, motion, 3D, graph, render, and QA schema definitions |
| Source/data truth | `COMPLIANCE_SECURITY` / `OBSERVABILITY_AUDIT_COST` | blocked | source refs, confidence fields, mock-data labeling, retention rules, and audit logs |
| SVG/HTML/DOT sanitization | `COMPLIANCE_SECURITY` | blocked | sanitizer policy for SVG, card HTML/CSS, DOT, external refs, fonts, and generated code |
| Artifact policy | `TRACK_A_RENDER_EXPORT` / `COMPLIANCE_SECURITY` | blocked | private refs, checksum policy, no signed URL source-of-truth |
| Visual QA | `AI_TOOLS_CREATIVE_GRAPHICS` / `FRONTEND_PRODUCT_UX` | blocked | label density, safe zones, text fit, contrast, alpha, motion comfort, and accessibility thresholds |
| Cost and latency | `OBSERVABILITY_AUDIT_COST` | blocked | renderer/runtime caps, timeout policy, cost bands, failure codes, and audit summaries |
| Supabase milestone sync | `SUPABASE_RLS_STORAGE_DATABASE` | blocked_current_branch_missing_sync_layer | approved sync layer on branch if future status writes are required |
| Frontend status language | `FRONTEND_PRODUCT_UX` | blocked | UI states must say planning/review-only, not generated or rendered |

## External Beta Blockers

- live graphics/render route approval;
- public artifact and delivery policy;
- provider/model proposal boundaries;
- dependency/license/security review;
- SVG/HTML/DOT/code sanitization;
- retention/deletion policy;
- worker/runtime monitoring, incident response, and cost controls.

## Production Blockers

- deterministic worker/runtime implementation;
- approved Track A final render/export pipeline;
- production dependency and license review;
- artifact checksum, private storage, and delivery contract;
- source/data provenance and compliance review;
- scale, SLO, alerting, cache, and cost controls;
- final accessibility, safe-zone, and visual QA gates.
