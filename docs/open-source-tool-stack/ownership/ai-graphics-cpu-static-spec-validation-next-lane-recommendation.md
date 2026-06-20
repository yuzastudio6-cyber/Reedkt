# AI Graphics CPU Static Spec Validation Next-Lane Recommendation

Decision: `ai_graphics_cpu_static_spec_validation_approval_passed_with_warnings`

Next prompt recommendation: `AI_GRAPHICS_DRAFT_PACKAGE_PROOF_CPU_STATIC_SPEC_VALIDATION_EXECUTION`

The next lane may execute only the CPU/static spec-validation plan if it performs a fresh source-state recheck and keeps evidence scoped to deterministic local/static validation for:

- `d3`
- `vega_lite`
- `vega`
- `satori`
- `svgdotjs_svg_js`
- `viz_js`

The next lane must not execute `echarts`, `lottie_web`, `animejs`, `three_js`, `pixi_js`, `konva`, or `babylonjs`, and must not enable browser/WebGL/canvas runtime, Tool Route execution, Worker execution, provider runtime, Supabase/SQL/GCS, signed URLs, public artifacts, internal beta, external beta, or production.
