# Canonical Agent Routing Capability Map QA

## chart_overlay

- preferredPlanningToolsAccepted: `vega_lite`, `d3`
- conditionalPlanningToolsAccepted: `echarts`
- fallbackPlanningToolsAccepted: `vega`
- eliminatedToolsAccepted: `sam2`, `real_esrgan`, `three_js unless 3D chart is explicitly requested`
- currentExecutionAllowed: false
- nextProofMilestoneAccepted: Future chart overlay spec/runtime approval before execution.

## data_visualization

- preferredPlanningToolsAccepted: `vega_lite`, `vega`, `d3`
- conditionalPlanningToolsAccepted: `echarts`
- fallbackPlanningToolsAccepted: `svgdotjs_svg_js`
- eliminatedToolsAccepted: `sam2`, `real_esrgan`, `lottie_web unless animation is explicitly requested`
- currentExecutionAllowed: false
- nextProofMilestoneAccepted: Future structured data visualization execution approval after source data and runtime review.

## svg_graphics

- preferredPlanningToolsAccepted: `svgdotjs_svg_js`, `satori`
- conditionalPlanningToolsAccepted: `d3`
- fallbackPlanningToolsAccepted: `viz_js for graph-shaped SVG`
- eliminatedToolsAccepted: `sam2`, `real_esrgan`, `transformers`
- currentExecutionAllowed: false
- nextProofMilestoneAccepted: Future SVG contract execution approval with private artifact policy.

## diagram_graphics

- preferredPlanningToolsAccepted: `viz_js`
- conditionalPlanningToolsAccepted: `svgdotjs_svg_js`
- fallbackPlanningToolsAccepted: `d3`
- eliminatedToolsAccepted: `vega_lite unless the request is a chart`, `sam2`, `real_esrgan`
- currentExecutionAllowed: false
- nextProofMilestoneAccepted: Future diagram metadata execution approval before DOT/SVG artifact creation.

## animation_overlay

- preferredPlanningToolsAccepted: `lottie_web`, `animejs`
- conditionalPlanningToolsAccepted: `none`
- fallbackPlanningToolsAccepted: `satori for static fallback planning`
- eliminatedToolsAccepted: `sam2`, `real_esrgan`, `vega_lite unless the request is chart animation`
- currentExecutionAllowed: false
- nextProofMilestoneAccepted: Animation manifest/runtime approval before player or timeline execution.

## canvas_scene

- preferredPlanningToolsAccepted: `pixi_js`, `konva`
- conditionalPlanningToolsAccepted: `none`
- fallbackPlanningToolsAccepted: `svgdotjs_svg_js for static 2D plan`
- eliminatedToolsAccepted: `sam2`, `real_esrgan`, `vega_lite unless the scene is a chart`
- currentExecutionAllowed: false
- nextProofMilestoneAccepted: Browser/canvas sandbox approval before any canvas runtime.

## webgl_3d_scene

- preferredPlanningToolsAccepted: `three_js`, `babylonjs`
- conditionalPlanningToolsAccepted: `none`
- fallbackPlanningToolsAccepted: `pixi_js for 2D fallback`, `d3 for non-3D chart fallback`
- eliminatedToolsAccepted: `vega_lite unless 3D chart is explicitly requested`, `sam2`, `real_esrgan`
- currentExecutionAllowed: false
- nextProofMilestoneAccepted: Browser/WebGL sandbox approval before any scene runtime.

## background_removal

- preferredPlanningToolsAccepted: `sam2`, `birefnet`
- conditionalPlanningToolsAccepted: `rembg`, `transparent_background`
- fallbackPlanningToolsAccepted: `manual mask planning after model proof`
- eliminatedToolsAccepted: `vega_lite`, `d3`, `three_js`
- currentExecutionAllowed: false
- nextProofMilestoneAccepted: CPU import, model provenance, model-weight, and GPU policy proof before execution.

## subject_segmentation

- preferredPlanningToolsAccepted: `sam2`, `birefnet`
- conditionalPlanningToolsAccepted: `kornia`
- fallbackPlanningToolsAccepted: `manual review path`
- eliminatedToolsAccepted: `vega_lite`, `viz_js`, `lottie_web`
- currentExecutionAllowed: false
- nextProofMilestoneAccepted: Model provenance and segmentation boundary proof before execution.

## upscaling

- preferredPlanningToolsAccepted: `real_esrgan`
- conditionalPlanningToolsAccepted: `none`
- fallbackPlanningToolsAccepted: `source replacement or lower-resolution layout plan`
- eliminatedToolsAccepted: `vega_lite`, `d3`, `sam2 unless segmentation is also requested`
- currentExecutionAllowed: false
- nextProofMilestoneAccepted: Model/GPU/provenance proof before upscaling execution.

## tensor_image_ops

- preferredPlanningToolsAccepted: `kornia`
- conditionalPlanningToolsAccepted: `torch_torchvision`
- fallbackPlanningToolsAccepted: `blocked manual planning until import proof`
- eliminatedToolsAccepted: `vega_lite`, `lottie_web`, `viz_js`
- currentExecutionAllowed: false
- nextProofMilestoneAccepted: CPU import and tensor/image operation contract proof before execution.

## model_runtime_foundation

- preferredPlanningToolsAccepted: `torch_torchvision`, `transformers`
- conditionalPlanningToolsAccepted: `kornia`
- fallbackPlanningToolsAccepted: `defer until model-boundary proof`
- eliminatedToolsAccepted: `d3`, `vega_lite`, `svgdotjs_svg_js`
- currentExecutionAllowed: false
- nextProofMilestoneAccepted: CPU/GPU model-runtime foundation proof, model-weight provenance, and boundary review before execution.
