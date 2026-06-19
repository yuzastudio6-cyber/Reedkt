# AI Graphics Draft Package Proof Merge-Order QA Matrix

Decision: `ai_graphics_draft_package_proof_merge_order_qa_passed_with_warnings`

| Order | Source PR | Batch | Tools | QA status | Later readiness |
| --- | --- | --- | --- | --- | --- |
| 1 | PR #425 | Batch 1 | `d3`, `echarts`, `vega_lite`, `vega` | accepted with warnings | mark-ready later: true; merge later: true |
| 2 | PR #433 | Batch 2 | `satori`, `svgdotjs_svg_js`, `viz_js`, `lottie_web` | accepted with warnings | mark-ready later: true; merge later: true |
| 3 | PR #441 | Batch 3 | `animejs`, `three_js`, `pixi_js`, `konva`, `babylonjs` | accepted with warnings | mark-ready later: true; merge later: true |

All 13 target tools appear exactly once. The QA accepts source state, stack order, conflict risk, package-lock risk, and validation staleness with warnings. No blocker is recorded.
