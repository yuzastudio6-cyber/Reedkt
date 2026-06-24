# AI Graphics Canonical Agent Selection Runtime Boundary QA Runtime Buckets

Decision: `ai_graphics_canonical_agent_selection_runtime_boundary_qa_passed_with_warnings`

| Bucket | Applies To | Meaning |
| --- | --- | --- |
| planning_metadata_allowed_now | all 21 tools and all 12 capabilities | Agent may select, rank, eliminate, and recommend tools for planning/study metadata only; no execution or artifacts. |
| cpu_static_execution_previously_validated_but_not_agent_executable_now | `d3`, `vega_lite`, `vega`, `satori`, `svgdotjs_svg_js`, `viz_js` | CPU/static proof exists as evidence, but canonical agent selection may not execute these tools. |
| browser_chart_runtime_later | `echarts` | Browser chart runtime approval is required before execution. |
| animation_runtime_later | `lottie_web`, `animejs` | Animation manifest/runtime approval is required before execution. |
| browser_canvas_webgl_runtime_later | `three_js`, `pixi_js`, `konva`, `babylonjs` | Browser/canvas/WebGL sandbox approval is required before execution. |
| model_cpu_gpu_runtime_later | `torch_torchvision`, `transformers`, `sam2`, `birefnet`, `real_esrgan`, `kornia`, `rembg`, `transparent_background` | CPU import, model provenance, model-weight, and later GPU/runtime approvals are required before execution. |
| tool_route_handoff_later | `torch_torchvision`, `transformers`, `sam2`, `birefnet`, `real_esrgan`, `kornia`, `rembg`, `transparent_background`, `d3`, `echarts`, `vega_lite`, `vega`, `satori`, `svgdotjs_svg_js`, `viz_js`, `lottie_web`, `animejs`, `three_js`, `pixi_js`, `konva`, `babylonjs` | Future Tool Route approval may consume canonical agent-selection schema as planning metadata only until execution is separately approved. |
| worker_handoff_later | `torch_torchvision`, `transformers`, `sam2`, `birefnet`, `real_esrgan`, `kornia`, `rembg`, `transparent_background`, `d3`, `echarts`, `vega_lite`, `vega`, `satori`, `svgdotjs_svg_js`, `viz_js`, `lottie_web`, `animejs`, `three_js`, `pixi_js`, `konva`, `babylonjs` | Future Worker approval may consume canonical agent-selection schema as planning metadata only until execution is separately approved. |
| public_artifact_and_signed_url_later | `torch_torchvision`, `transformers`, `sam2`, `birefnet`, `real_esrgan`, `kornia`, `rembg`, `transparent_background`, `d3`, `echarts`, `vega_lite`, `vega`, `satori`, `svgdotjs_svg_js`, `viz_js`, `lottie_web`, `animejs`, `three_js`, `pixi_js`, `konva`, `babylonjs` | Signed URLs, GCS/public artifacts, and public artifact creation remain blocked. |

All runtime buckets from PR #694 are QA-accepted with warnings. Planning/study metadata is the only current allowed behavior.
