# AI Graphics Tool Route Source Evidence Lockfile

Decision: `approved_with_warnings_for_tool_route_ai_graphics_metadata_integration`

| Evidence | Live state at implementation | Role in this packet |
| --- | --- | --- |
| PR #454 | Open draft, mergeable clean, head `03ad9b668e22f69c347cb0874d754453f44b9404` | Immediate source: AI graphics route-manifest QA passed with warnings. |
| PR #451 | Open draft, mergeable clean, head `f497302fc5f80bf891cc3d17336627ffcb0132b0` | Approval source: AI graphics route-manifest integration approved with warnings. |
| PR #449 | Open draft, mergeable clean | Batch 4 policy QA source evidence. |
| PR #445 | Open draft, mergeable clean | Batch 3 QA source evidence for `animejs`, `three`, `pixi.js`, `konva`, `babylonjs`. |
| PR #437 | Open draft, mergeable clean | Batch 2 QA source evidence for `satori`, `@svgdotjs/svg.js`, `@viz-js/viz`, `lottie-web`. |
| PR #428 | Open draft, mergeable clean | Batch 1 QA source evidence for `d3`, `echarts`, `vega-lite`, `vega`. |
| PR #404 | Merged | Tool Route fixture planning and manifest context. |
| PR #398 | Merged | Tool Route offline dry-run QA context. |
| PR #164 | Open non-draft, mergeable clean, head `1553d50118919bf013d35bbc23a534af9d86c8ae` | Track B route-manifest policy context only. |

## Evidence Boundary

AI graphics owns tool eligibility and metadata proof status. Tool Route owns future route registry intake, scoped tool-call manifest intake, fail-closed route selection, and worker handoff metadata. Track B remains policy context only. Track A remains required before Remotion render/export or final composition claims.

Supabase classification remains `no write` / `docs_only`; environment touched: `none`; SQL executed: `none`; migration deployed: `no`; milestone sync: `not_performed`.
