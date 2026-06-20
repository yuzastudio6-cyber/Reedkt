# AI Graphics Canonical Promotion QA Matrix

Decision: `ai_graphics_draft_package_proof_canonical_promotion_qa_passed_with_warnings`

Accepted proof level: `canonical_merged_package_import_static_fixture_proof`.

| Batch | Source PR | Merge SHA | Tools | QA status |
| --- | --- | --- | --- | --- |
| Batch 1 | PR #425 | `a055ef045db2a6ce127a044bee6219d5933532c3` | `d3`, `echarts`, `vega_lite`, `vega` | accepted with warnings |
| Batch 2 | PR #433 | `dd8cb0a03d47da6463d8ca014cfb3e53b7531ea0` | `satori`, `svgdotjs_svg_js`, `viz_js`, `lottie_web` | accepted with warnings |
| Batch 3 | PR #441 | `d174de59471eacf05bed5a5511d661f2e5ba9f0f` | `animejs`, `three_js`, `pixi_js`, `konva`, `babylonjs` | accepted with warnings |

Every row keeps runtime, Worker, Tool Route, provider, browser/WebGL/canvas, GPU/model, Supabase/SQL/GCS, signed URL, public artifact, internal beta, external beta, and production readiness false.

Track B remains excluded under `TRACK_B_MEDIA_OSS_STEWARD`; Track A render/export remains excluded through PR #544.
