# Canonical Agent Selection Canonicalization QA Ledger

Decision: `ai_graphics_canonical_agent_selection_canonicalization_qa_passed_with_warnings`

The canonical agent-selection source of truth is QA-accepted as the PR #671/#674/#677/#681/#683/#685 chain for planning/study metadata selection only.

## Coverage
- Tools: `torch_torchvision`, `transformers`, `sam2`, `birefnet`, `real_esrgan`, `kornia`, `rembg`, `transparent_background`, `d3`, `echarts`, `vega_lite`, `vega`, `satori`, `svgdotjs_svg_js`, `viz_js`, `lottie_web`, `animejs`, `three_js`, `pixi_js`, `konva`, `babylonjs`
- Capabilities: `chart_overlay`, `data_visualization`, `svg_graphics`, `diagram_graphics`, `animation_overlay`, `canvas_scene`, `webgl_3d_scene`, `background_removal`, `subject_segmentation`, `upscaling`, `tensor_image_ops`, `model_runtime_foundation`

## Runtime Boundary
- Agent can select for planning: true
- Agent can execute tools now: false
- Route execution approved now: false
- Worker execution approved now: false
- Runtime ready now: false
- Internal beta ready now: false
- Production ready now: false

## Exclusions
Track B remains under `TRACK_B_MEDIA_OSS_STEWARD`; Track A render/export exclusion via PR #544 remains evidence-only context.
