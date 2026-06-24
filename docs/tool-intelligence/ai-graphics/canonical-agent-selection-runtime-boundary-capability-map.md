# AI Graphics Canonical Agent Selection Runtime Boundary Capability Map

Decision: `ai_graphics_canonical_agent_selection_runtime_boundary_review_passed_with_warnings`

| Capability | Runtime Bucket | Candidate Tools | Next Proof Milestone |
| --- | --- | --- | --- |
| chart_overlay | planning_metadata_allowed_now | `vega_lite`, `d3`, `echarts` | CPU/static and browser chart runtime approvals remain separate future gates. |
| data_visualization | planning_metadata_allowed_now | `vega_lite`, `vega`, `d3`, `echarts` | Agent may rank chart candidates, but cannot compile, render, or export charts. |
| svg_graphics | planning_metadata_allowed_now | `svgdotjs_svg_js`, `satori`, `d3` | CPU/static proof may be referenced; SVG/string/artifact generation remains blocked. |
| diagram_graphics | planning_metadata_allowed_now | `viz_js`, `svgdotjs_svg_js` | DOT/diagram tool execution and artifact creation remain blocked. |
| animation_overlay | animation_runtime_later | `lottie_web`, `animejs` | Animation manifest/runtime approval is required before execution. |
| canvas_scene | browser_canvas_webgl_runtime_later | `pixi_js`, `konva` | Browser/canvas sandbox approval is required before execution. |
| webgl_3d_scene | browser_canvas_webgl_runtime_later | `three_js`, `babylonjs` | Browser/WebGL sandbox approval is required before execution. |
| background_removal | model_cpu_gpu_runtime_later | `sam2`, `birefnet`, `rembg`, `transparent_background` | Model provenance, weight, CPU import, and runtime approvals are required before execution. |
| subject_segmentation | model_cpu_gpu_runtime_later | `sam2`, `birefnet` | Segmentation model execution remains blocked pending model proof. |
| upscaling | model_cpu_gpu_runtime_later | `real_esrgan` | Upscaling model execution remains blocked pending model/GPU/provenance proof. |
| tensor_image_ops | model_cpu_gpu_runtime_later | `torch_torchvision`, `kornia` | Tensor/image operation runtime remains blocked pending CPU/GPU/runtime proof. |
| model_runtime_foundation | model_cpu_gpu_runtime_later | `torch_torchvision`, `transformers` | Foundation model runtime remains blocked pending model/provenance/runtime proof. |
