# AI Graphics Canonical Agent Selection Runtime Boundary QA Capability Map

Decision: `ai_graphics_canonical_agent_selection_runtime_boundary_qa_passed_with_warnings`

| Capability | Runtime Bucket | Candidate Tools | QA Result |
| --- | --- | --- | --- |
| chart_overlay | planning_metadata_allowed_now | `vega_lite`, `d3`, `echarts` | accepted with warnings |
| data_visualization | planning_metadata_allowed_now | `vega_lite`, `vega`, `d3`, `echarts` | accepted with warnings |
| svg_graphics | planning_metadata_allowed_now | `svgdotjs_svg_js`, `satori`, `d3` | accepted with warnings |
| diagram_graphics | planning_metadata_allowed_now | `viz_js`, `svgdotjs_svg_js` | accepted with warnings |
| animation_overlay | animation_runtime_later | `lottie_web`, `animejs` | accepted with warnings |
| canvas_scene | browser_canvas_webgl_runtime_later | `pixi_js`, `konva` | accepted with warnings |
| webgl_3d_scene | browser_canvas_webgl_runtime_later | `three_js`, `babylonjs` | accepted with warnings |
| background_removal | model_cpu_gpu_runtime_later | `sam2`, `birefnet`, `rembg`, `transparent_background` | accepted with warnings |
| subject_segmentation | model_cpu_gpu_runtime_later | `sam2`, `birefnet` | accepted with warnings |
| upscaling | model_cpu_gpu_runtime_later | `real_esrgan` | accepted with warnings |
| tensor_image_ops | model_cpu_gpu_runtime_later | `torch_torchvision`, `kornia` | accepted with warnings |
| model_runtime_foundation | model_cpu_gpu_runtime_later | `torch_torchvision`, `transformers` | accepted with warnings |
