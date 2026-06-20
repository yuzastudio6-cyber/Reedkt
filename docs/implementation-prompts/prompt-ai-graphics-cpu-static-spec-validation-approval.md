# Implementation Prompt: AI Graphics CPU Static Spec Validation Approval

Create the CPU/static spec-validation approval lane from `origin/codex/rp-ai-graphics-draft-package-proof-runtime-boundary-owner-qa-review`.

Decision: `ai_graphics_cpu_static_spec_validation_approval_passed_with_warnings`

Required branch: `codex/rp-ai-graphics-draft-package-proof-cpu-static-spec-validation-approval`

Required draft PR title: `[tools] AI graphics CPU static spec validation approval`

Created draft PR: [#607](https://github.com/yuzastudio6-cyber/Reedkt/pull/607).

Recorded PR status: open/draft/MERGEABLE at `40f420c9a01e1ce5dc16b9097e38c82728d540a8`; check rollup empty when recorded.

This lane is docs/diagnostics-only. It approves only a future CPU/static spec-validation execution lane for exactly `d3`, `vega_lite`, `vega`, `satori`, `svgdotjs_svg_js`, and `viz_js`.

It explicitly defers `echarts`, `lottie_web`, `animejs`, `three_js`, `pixi_js`, `konva`, and `babylonjs`.

Do not install dependencies, mutate package-lock, run import smoke, run synthetic/static fixtures, execute tools/workers/routes/providers/models, run browser/WebGL/canvas/GPU/model/media/Remotion/resvg runtime, mutate Supabase/SQL/GCS, create signed URLs/public artifacts, unlock beta/production, merge PRs, close PRs, or retarget PRs.

Next prompt recommendation: `AI_GRAPHICS_DRAFT_PACKAGE_PROOF_CPU_STATIC_SPEC_VALIDATION_EXECUTION`.
