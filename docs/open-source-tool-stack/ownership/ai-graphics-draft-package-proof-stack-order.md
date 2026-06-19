# AI Graphics Draft Package Proof Stack Order

Decision: `ai_graphics_draft_package_proof_merge_order_review_passed_with_warnings`

Recommended later order: PR #425 -> PR #433 -> PR #441.

1. PR #425: Batch 1 package proof for `d3`, `echarts`, `vega_lite`, `vega`.
2. PR #433: Batch 2 package proof for `satori`, `svgdotjs_svg_js`, `viz_js`, `lottie_web`.
3. PR #441: Batch 3 package proof for `animejs`, `three_js`, `pixi_js`, `konva`, `babylonjs`.

This recommendation is not a merge authorization. It only states the later order to use if each source PR remains clean, draft-ready approval is granted separately, and final package-lock/conflict/validation checks remain acceptable.

Next prompt: `AI_GRAPHICS_DRAFT_PACKAGE_PROOF_MERGE_ORDER_QA_REVIEW`.
