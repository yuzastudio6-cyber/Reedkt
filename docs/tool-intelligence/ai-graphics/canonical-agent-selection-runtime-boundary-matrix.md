# AI Graphics Canonical Agent Selection Runtime Boundary Matrix

Decision: `ai_graphics_canonical_agent_selection_runtime_boundary_review_passed_with_warnings`

## Runtime Buckets
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

## Tool Matrix
| Tool | Primary Runtime Bucket | Planning Selection | Agent Execution | Required Next Approval |
| --- | --- | --- | --- | --- |
| torch_torchvision | model_cpu_gpu_runtime_later | true | false | CPU import, model provenance, model-weight, and GPU/runtime approvals required |
| transformers | model_cpu_gpu_runtime_later | true | false | CPU import, model provenance, model-weight, and GPU/runtime approvals required |
| sam2 | model_cpu_gpu_runtime_later | true | false | CPU import, model provenance, model-weight, and GPU/runtime approvals required |
| birefnet | model_cpu_gpu_runtime_later | true | false | CPU import, model provenance, model-weight, and GPU/runtime approvals required |
| real_esrgan | model_cpu_gpu_runtime_later | true | false | CPU import, model provenance, model-weight, and GPU/runtime approvals required |
| kornia | model_cpu_gpu_runtime_later | true | false | CPU import and later model/runtime approvals required |
| rembg | model_cpu_gpu_runtime_later | true | false | CPU import, model provenance, model-weight, and GPU/runtime approvals required |
| transparent_background | model_cpu_gpu_runtime_later | true | false | CPU import, model provenance, model-weight, and GPU/runtime approvals required |
| d3 | cpu_static_execution_previously_validated_but_not_agent_executable_now | true | false | CPU/static proof exists, but agent execution remains blocked |
| echarts | browser_chart_runtime_later | true | false | Browser chart runtime approval required |
| vega_lite | cpu_static_execution_previously_validated_but_not_agent_executable_now | true | false | CPU/static proof exists, but agent execution remains blocked |
| vega | cpu_static_execution_previously_validated_but_not_agent_executable_now | true | false | CPU/static proof exists, but agent execution remains blocked |
| satori | cpu_static_execution_previously_validated_but_not_agent_executable_now | true | false | CPU/static proof exists, but agent execution remains blocked |
| svgdotjs_svg_js | cpu_static_execution_previously_validated_but_not_agent_executable_now | true | false | CPU/static proof exists, but agent execution remains blocked |
| viz_js | cpu_static_execution_previously_validated_but_not_agent_executable_now | true | false | CPU/static proof exists, but agent execution remains blocked |
| lottie_web | animation_runtime_later | true | false | Animation manifest/runtime approval required |
| animejs | animation_runtime_later | true | false | Animation manifest/runtime approval required |
| three_js | browser_canvas_webgl_runtime_later | true | false | Browser/canvas/WebGL sandbox approval required |
| pixi_js | browser_canvas_webgl_runtime_later | true | false | Browser/canvas/WebGL sandbox approval required |
| konva | browser_canvas_webgl_runtime_later | true | false | Browser/canvas/WebGL sandbox approval required |
| babylonjs | browser_canvas_webgl_runtime_later | true | false | Browser/canvas/WebGL sandbox approval required |

## Capability Matrix
| Capability | Primary Runtime Bucket | Candidate Tools | Planning Selection | Agent Execution |
| --- | --- | --- | --- | --- |
| chart_overlay | planning_metadata_allowed_now | `vega_lite`, `d3`, `echarts` | true | false |
| data_visualization | planning_metadata_allowed_now | `vega_lite`, `vega`, `d3`, `echarts` | true | false |
| svg_graphics | planning_metadata_allowed_now | `svgdotjs_svg_js`, `satori`, `d3` | true | false |
| diagram_graphics | planning_metadata_allowed_now | `viz_js`, `svgdotjs_svg_js` | true | false |
| animation_overlay | animation_runtime_later | `lottie_web`, `animejs` | true | false |
| canvas_scene | browser_canvas_webgl_runtime_later | `pixi_js`, `konva` | true | false |
| webgl_3d_scene | browser_canvas_webgl_runtime_later | `three_js`, `babylonjs` | true | false |
| background_removal | model_cpu_gpu_runtime_later | `sam2`, `birefnet`, `rembg`, `transparent_background` | true | false |
| subject_segmentation | model_cpu_gpu_runtime_later | `sam2`, `birefnet` | true | false |
| upscaling | model_cpu_gpu_runtime_later | `real_esrgan` | true | false |
| tensor_image_ops | model_cpu_gpu_runtime_later | `torch_torchvision`, `kornia` | true | false |
| model_runtime_foundation | model_cpu_gpu_runtime_later | `torch_torchvision`, `transformers` | true | false |
