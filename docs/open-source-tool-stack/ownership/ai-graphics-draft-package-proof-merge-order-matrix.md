# AI Graphics Draft Package Proof Merge-Order Matrix

Decision: `ai_graphics_draft_package_proof_merge_order_review_passed_with_warnings`

| Order | Source PR | Batch | Tools | Package diff | Validation evidence | Risk | Later readiness |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | PR #425 | Batch 1 | `d3`, `echarts`, `vega_lite`, `vega` | package.json and package-lock expected in source PR | accepted with warnings from PR #550 and PR #552 | low if merged first and source state remains clean | mark-ready later: true; merge later: true |
| 2 | PR #433 | Batch 2 | `satori`, `svgdotjs_svg_js`, `viz_js`, `lottie_web` | package.json and package-lock expected in source PR | accepted with warnings from PR #550 and PR #552 | medium until PR #425 lands or base order is rechecked | mark-ready later: true; merge later: true |
| 3 | PR #441 | Batch 3 | `animejs`, `three_js`, `pixi_js`, `konva`, `babylonjs` | package.json and package-lock expected in source PR | accepted with warnings from PR #550 and PR #552 | medium until PR #425 and PR #433 land or base order is rechecked | mark-ready later: true; merge later: true |

All 13 target tools appear exactly once across the reviewed source PRs. The current merge-order review branch records no dependency install, no package-lock mutation, no import smoke now, no synthetic fixture now, and no runtime execution.
