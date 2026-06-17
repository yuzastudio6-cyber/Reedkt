# AI_TOOLS_CREATIVE_GRAPHICS Route Manifest QA Acceptance Matrix

Decision: `ai_graphics_route_manifest_integration_qa_passed_with_warnings`

| Tool | Source proof | Route eligibility reviewed | QA classification | Runtime boundary | Next action |
| --- | --- | --- | --- | --- | --- |
| `d3` | Batch 1 QA `ai_graphics_batch_1_qa_passed_with_warnings` | `eligible_metadata_only` | `accepted_with_warnings` | DOM/browser/SVG output and route execution blocked. | Tool Route metadata handoff only. |
| `echarts` | Batch 1 QA `ai_graphics_batch_1_qa_passed_with_warnings` | `eligible_metadata_only` | `accepted_with_warnings` | Chart initialization, browser/canvas rendering, and route execution blocked. | Tool Route metadata handoff only. |
| `vega-lite` | Batch 1 QA `ai_graphics_batch_1_qa_passed_with_warnings` | `eligible_metadata_only` | `accepted_with_warnings` | Compile/render output, browser rendering, and route execution blocked. | Tool Route metadata handoff only. |
| `vega` | Batch 1 peer QA `ai_graphics_batch_1_qa_passed_with_warnings` | `eligible_metadata_only` | `accepted_with_warnings` | Runtime view/render execution blocked. | Pair only with Vega-Lite metadata handoff. |
| `satori` | Batch 2 QA `ai_graphics_batch_2_qa_passed_with_warnings` | `eligible_metadata_only` | `accepted_with_warnings` | SVG output, rasterization, external fonts, and render/export blocked. | Metadata handoff plus Track A review note. |
| `@svgdotjs/svg.js` | Batch 2 QA `ai_graphics_batch_2_qa_passed_with_warnings` | `eligible_manifest_only` | `accepted_with_warnings` | DOM/browser construction, SVG output writing, and route execution blocked. | Manifest-only route metadata handoff. |
| `@viz-js/viz` | Batch 2 QA `ai_graphics_batch_2_qa_passed_with_warnings` | `eligible_metadata_only` | `accepted_with_warnings` | Public SVG output, external binary/network execution, and route execution blocked. | DOT metadata route handoff only. |
| `lottie-web` | Batch 2 QA `ai_graphics_batch_2_qa_passed_with_warnings` | `eligible_manifest_only` | `accepted_with_warnings` | Browser/player runtime, animation playback, and route execution blocked. | Lottie manifest route metadata only. |
| `animejs` | Batch 3 QA `ai_graphics_batch_3_qa_passed_with_warnings` | `eligible_manifest_only` | `accepted_with_warnings` | Browser animation playback, motion runtime, and route execution blocked. | Timing manifest route metadata only. |
| `three` | Batch 3 QA `ai_graphics_batch_3_qa_passed_with_warnings` | `eligible_manifest_only` | `accepted_with_warnings` | WebGL renderer, canvas/WebGL context, and route execution blocked. | Scene manifest route metadata only. |
| `pixi.js` | Batch 3 QA `ai_graphics_batch_3_qa_passed_with_warnings` | `eligible_manifest_only` | `accepted_with_warnings` | Application, renderer, canvas runtime, and route execution blocked. | Sprite/effects manifest route metadata only. |
| `konva` | Batch 3 QA `ai_graphics_batch_3_qa_passed_with_warnings` | `eligible_manifest_only` | `accepted_with_warnings` | Browser canvas/stage output and route execution blocked. | Layer/shape manifest route metadata only. |
| `babylonjs` | Batch 3 QA `ai_graphics_batch_3_qa_passed_with_warnings` | `eligible_manifest_only` | `accepted_with_warnings` | Engine creation, WebGL/canvas runtime, scene render output, and route execution blocked. | Scene manifest route metadata only. |

All 13 tools are accepted with warnings for route-manifest metadata integration QA. No tool row is accepted for live route execution, actual tool execution, worker execution, browser/WebGL/canvas runtime, render/export, Supabase mutation, GCS upload, signed URL delivery, public artifact creation, beta, or production.
