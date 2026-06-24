# Runtime Boundary Tool Map Owner Review

Decision: `ai_graphics_canonical_agent_selection_runtime_boundary_owner_review_passed_with_warnings`

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

## Scope Boundary
This owner review does not approve agent/tool/route/worker/provider execution, browser/WebGL/canvas runtime, GPU/model runtime, E2E proof, Supabase/GCS mutation, signed URLs, public artifacts, runtime readiness, internal beta, external beta, production readiness, dependency install, package-lock mutation, or generated outputs. Track B remains under `TRACK_B_MEDIA_OSS_STEWARD`; Track A render/export exclusion remains via PR #544.
