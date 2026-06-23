# Canonicalization Owner Approval Matrix

Decision: `ai_graphics_tool_capability_study_canonical_agent_routing_canonicalization_owner_approved_with_warnings`.

## Tools

- `torch_torchvision`: owner_approved_with_warnings_for_planning_metadata_only; planning selection true; execution false.
- `transformers`: owner_approved_with_warnings_for_planning_metadata_only; planning selection true; execution false.
- `sam2`: owner_approved_with_warnings_for_planning_metadata_only; planning selection true; execution false.
- `birefnet`: owner_approved_with_warnings_for_planning_metadata_only; planning selection true; execution false.
- `real_esrgan`: owner_approved_with_warnings_for_planning_metadata_only; planning selection true; execution false.
- `kornia`: owner_approved_with_warnings_for_planning_metadata_only; planning selection true; execution false.
- `rembg`: owner_approved_with_warnings_for_planning_metadata_only; planning selection true; execution false.
- `transparent_background`: owner_approved_with_warnings_for_planning_metadata_only; planning selection true; execution false.
- `d3`: owner_approved_with_warnings_for_planning_metadata_only; planning selection true; execution false.
- `echarts`: owner_approved_with_warnings_for_planning_metadata_only; planning selection true; execution false.
- `vega_lite`: owner_approved_with_warnings_for_planning_metadata_only; planning selection true; execution false.
- `vega`: owner_approved_with_warnings_for_planning_metadata_only; planning selection true; execution false.
- `satori`: owner_approved_with_warnings_for_planning_metadata_only; planning selection true; execution false.
- `svgdotjs_svg_js`: owner_approved_with_warnings_for_planning_metadata_only; planning selection true; execution false.
- `viz_js`: owner_approved_with_warnings_for_planning_metadata_only; planning selection true; execution false.
- `lottie_web`: owner_approved_with_warnings_for_planning_metadata_only; planning selection true; execution false.
- `animejs`: owner_approved_with_warnings_for_planning_metadata_only; planning selection true; execution false.
- `three_js`: owner_approved_with_warnings_for_planning_metadata_only; planning selection true; execution false.
- `pixi_js`: owner_approved_with_warnings_for_planning_metadata_only; planning selection true; execution false.
- `konva`: owner_approved_with_warnings_for_planning_metadata_only; planning selection true; execution false.
- `babylonjs`: owner_approved_with_warnings_for_planning_metadata_only; planning selection true; execution false.

## Capabilities

- `chart_overlay`: owner-approved; preferred planning vega_lite, d3; conditional echarts; execution false.
- `data_visualization`: owner-approved; preferred planning vega_lite, vega, d3; conditional echarts; execution false.
- `svg_graphics`: owner-approved; preferred planning svgdotjs_svg_js, satori; conditional d3; execution false.
- `diagram_graphics`: owner-approved; preferred planning viz_js; conditional svgdotjs_svg_js; execution false.
- `animation_overlay`: owner-approved; preferred planning lottie_web, animejs; conditional none; execution false.
- `canvas_scene`: owner-approved; preferred planning pixi_js, konva; conditional none; execution false.
- `webgl_3d_scene`: owner-approved; preferred planning three_js, babylonjs; conditional none; execution false.
- `background_removal`: owner-approved; preferred planning sam2, birefnet; conditional rembg, transparent_background; execution false.
- `subject_segmentation`: owner-approved; preferred planning sam2, birefnet; conditional kornia; execution false.
- `upscaling`: owner-approved; preferred planning real_esrgan; conditional none; execution false.
- `tensor_image_ops`: owner-approved; preferred planning kornia; conditional torch_torchvision; execution false.
- `model_runtime_foundation`: owner-approved; preferred planning torch_torchvision, transformers; conditional kornia; execution false.
