# Runtime Boundary Owner Matrix

Decision: `ai_graphics_canonical_agent_selection_runtime_boundary_owner_review_passed_with_warnings`

## Runtime Buckets
- `planning_metadata_allowed_now`: Agent may select, rank, eliminate, and recommend tools for planning/study metadata only; no execution or artifacts. Tools: torch_torchvision, transformers, sam2, birefnet, real_esrgan, kornia, rembg, transparent_background, d3, echarts, vega_lite, vega, satori, svgdotjs_svg_js, viz_js, lottie_web, animejs, three_js, pixi_js, konva, babylonjs.
- `cpu_static_execution_previously_validated_but_not_agent_executable_now`: CPU/static proof exists as evidence, but canonical agent selection may not execute these tools. Tools: d3, vega_lite, vega, satori, svgdotjs_svg_js, viz_js.
- `browser_chart_runtime_later`: Browser chart runtime approval is required before execution. Tools: echarts.
- `animation_runtime_later`: Animation manifest/runtime approval is required before execution. Tools: lottie_web, animejs.
- `browser_canvas_webgl_runtime_later`: Browser/canvas/WebGL sandbox approval is required before execution. Tools: three_js, pixi_js, konva, babylonjs.
- `model_cpu_gpu_runtime_later`: CPU import, model provenance, model-weight, and later GPU/runtime approvals are required before execution. Tools: torch_torchvision, transformers, sam2, birefnet, real_esrgan, kornia, rembg, transparent_background.
- `tool_route_handoff_later`: Future Tool Route approval may consume canonical agent-selection schema as planning metadata only until execution is separately approved. Tools: torch_torchvision, transformers, sam2, birefnet, real_esrgan, kornia, rembg, transparent_background, d3, echarts, vega_lite, vega, satori, svgdotjs_svg_js, viz_js, lottie_web, animejs, three_js, pixi_js, konva, babylonjs.
- `worker_handoff_later`: Future Worker approval may consume canonical agent-selection schema as planning metadata only until execution is separately approved. Tools: torch_torchvision, transformers, sam2, birefnet, real_esrgan, kornia, rembg, transparent_background, d3, echarts, vega_lite, vega, satori, svgdotjs_svg_js, viz_js, lottie_web, animejs, three_js, pixi_js, konva, babylonjs.
- `public_artifact_and_signed_url_later`: Signed URLs, GCS/public artifacts, and public artifact creation remain blocked. Tools: torch_torchvision, transformers, sam2, birefnet, real_esrgan, kornia, rembg, transparent_background, d3, echarts, vega_lite, vega, satori, svgdotjs_svg_js, viz_js, lottie_web, animejs, three_js, pixi_js, konva, babylonjs.

## Tools
- `torch_torchvision`: Torch/Torchvision; owner bucket `model_cpu_gpu_runtime_later`; planning selection true; execution/runtime false.
- `transformers`: Transformers; owner bucket `model_cpu_gpu_runtime_later`; planning selection true; execution/runtime false.
- `sam2`: SAM2; owner bucket `model_cpu_gpu_runtime_later`; planning selection true; execution/runtime false.
- `birefnet`: BiRefNet; owner bucket `model_cpu_gpu_runtime_later`; planning selection true; execution/runtime false.
- `real_esrgan`: Real-ESRGAN; owner bucket `model_cpu_gpu_runtime_later`; planning selection true; execution/runtime false.
- `kornia`: Kornia; owner bucket `model_cpu_gpu_runtime_later`; planning selection true; execution/runtime false.
- `rembg`: rembg; owner bucket `model_cpu_gpu_runtime_later`; planning selection true; execution/runtime false.
- `transparent_background`: Transparent Background; owner bucket `model_cpu_gpu_runtime_later`; planning selection true; execution/runtime false.
- `d3`: D3; owner bucket `cpu_static_execution_previously_validated_but_not_agent_executable_now`; planning selection true; execution/runtime false.
- `echarts`: ECharts; owner bucket `browser_chart_runtime_later`; planning selection true; execution/runtime false.
- `vega_lite`: Vega-Lite; owner bucket `cpu_static_execution_previously_validated_but_not_agent_executable_now`; planning selection true; execution/runtime false.
- `vega`: Vega; owner bucket `cpu_static_execution_previously_validated_but_not_agent_executable_now`; planning selection true; execution/runtime false.
- `satori`: Satori; owner bucket `cpu_static_execution_previously_validated_but_not_agent_executable_now`; planning selection true; execution/runtime false.
- `svgdotjs_svg_js`: SVG.js; owner bucket `cpu_static_execution_previously_validated_but_not_agent_executable_now`; planning selection true; execution/runtime false.
- `viz_js`: Viz.js; owner bucket `cpu_static_execution_previously_validated_but_not_agent_executable_now`; planning selection true; execution/runtime false.
- `lottie_web`: Lottie Web; owner bucket `animation_runtime_later`; planning selection true; execution/runtime false.
- `animejs`: Anime.js; owner bucket `animation_runtime_later`; planning selection true; execution/runtime false.
- `three_js`: Three.js; owner bucket `browser_canvas_webgl_runtime_later`; planning selection true; execution/runtime false.
- `pixi_js`: PixiJS; owner bucket `browser_canvas_webgl_runtime_later`; planning selection true; execution/runtime false.
- `konva`: Konva; owner bucket `browser_canvas_webgl_runtime_later`; planning selection true; execution/runtime false.
- `babylonjs`: Babylon.js; owner bucket `browser_canvas_webgl_runtime_later`; planning selection true; execution/runtime false.

## Capabilities
- `chart_overlay`: owner accepts vega_lite, d3, echarts for planning/study metadata only; execution/runtime false.
- `data_visualization`: owner accepts vega_lite, vega, d3, echarts for planning/study metadata only; execution/runtime false.
- `svg_graphics`: owner accepts svgdotjs_svg_js, satori, d3 for planning/study metadata only; execution/runtime false.
- `diagram_graphics`: owner accepts viz_js, svgdotjs_svg_js, d3 for planning/study metadata only; execution/runtime false.
- `animation_overlay`: owner accepts lottie_web, animejs for planning/study metadata only; execution/runtime false.
- `canvas_scene`: owner accepts pixi_js, konva for planning/study metadata only; execution/runtime false.
- `webgl_3d_scene`: owner accepts three_js, babylonjs for planning/study metadata only; execution/runtime false.
- `background_removal`: owner accepts sam2, birefnet, rembg, transparent_background for planning/study metadata only; execution/runtime false.
- `subject_segmentation`: owner accepts sam2, birefnet, rembg, transparent_background for planning/study metadata only; execution/runtime false.
- `upscaling`: owner accepts real_esrgan for planning/study metadata only; execution/runtime false.
- `tensor_image_ops`: owner accepts torch_torchvision, kornia for planning/study metadata only; execution/runtime false.
- `model_runtime_foundation`: owner accepts torch_torchvision, transformers for planning/study metadata only; execution/runtime false.

## Scope Boundary
This owner review does not approve agent/tool/route/worker/provider execution, browser/WebGL/canvas runtime, GPU/model runtime, E2E proof, Supabase/GCS mutation, signed URLs, public artifacts, runtime readiness, internal beta, external beta, production readiness, dependency install, package-lock mutation, or generated outputs. Track B remains under `TRACK_B_MEDIA_OSS_STEWARD`; Track A render/export exclusion remains via PR #544.
