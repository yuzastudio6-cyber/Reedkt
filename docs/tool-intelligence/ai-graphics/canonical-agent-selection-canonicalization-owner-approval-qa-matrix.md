# Canonical Agent Selection Canonicalization Owner Approval QA Matrix

Decision: `ai_graphics_canonical_agent_selection_canonicalization_owner_approval_qa_passed_with_warnings`

QA matrix for all product-facing capabilities.

## chart_overlay
- Preferred planning tools owner-approval-QA accepted: `vega_lite`, `d3`
- Conditional planning tools owner-approval-QA accepted: `echarts`
- Fallback planning tools owner-approval-QA accepted: `vega`
- Eliminated tools owner-approval-QA accepted: `three_js`, `sam2`, `real_esrgan`
- Current execution allowed: false
- Missing-proof rules owner-approval-QA accepted: true

## data_visualization
- Preferred planning tools owner-approval-QA accepted: `vega_lite`, `vega`, `d3`
- Conditional planning tools owner-approval-QA accepted: `echarts`
- Fallback planning tools owner-approval-QA accepted: `svgdotjs_svg_js`
- Eliminated tools owner-approval-QA accepted: `sam2`, `real_esrgan`, `lottie_web`
- Current execution allowed: false
- Missing-proof rules owner-approval-QA accepted: true

## svg_graphics
- Preferred planning tools owner-approval-QA accepted: `svgdotjs_svg_js`, `satori`
- Conditional planning tools owner-approval-QA accepted: `d3`
- Fallback planning tools owner-approval-QA accepted: `viz_js`
- Eliminated tools owner-approval-QA accepted: `sam2`, `real_esrgan`
- Current execution allowed: false
- Missing-proof rules owner-approval-QA accepted: true

## diagram_graphics
- Preferred planning tools owner-approval-QA accepted: `viz_js`
- Conditional planning tools owner-approval-QA accepted: `svgdotjs_svg_js`
- Fallback planning tools owner-approval-QA accepted: `d3`
- Eliminated tools owner-approval-QA accepted: `vega_lite`
- Current execution allowed: false
- Missing-proof rules owner-approval-QA accepted: true

## animation_overlay
- Preferred planning tools owner-approval-QA accepted: `lottie_web`, `animejs`
- Conditional planning tools owner-approval-QA accepted: none
- Fallback planning tools owner-approval-QA accepted: `satori`
- Eliminated tools owner-approval-QA accepted: `real_esrgan`, `sam2`
- Current execution allowed: false
- Missing-proof rules owner-approval-QA accepted: true

## canvas_scene
- Preferred planning tools owner-approval-QA accepted: `pixi_js`, `konva`
- Conditional planning tools owner-approval-QA accepted: none
- Fallback planning tools owner-approval-QA accepted: `svgdotjs_svg_js`
- Eliminated tools owner-approval-QA accepted: `torch_torchvision`, `transformers`
- Current execution allowed: false
- Missing-proof rules owner-approval-QA accepted: true

## webgl_3d_scene
- Preferred planning tools owner-approval-QA accepted: `three_js`, `babylonjs`
- Conditional planning tools owner-approval-QA accepted: none
- Fallback planning tools owner-approval-QA accepted: `pixi_js`
- Eliminated tools owner-approval-QA accepted: `vega_lite`, `d3`
- Current execution allowed: false
- Missing-proof rules owner-approval-QA accepted: true

## background_removal
- Preferred planning tools owner-approval-QA accepted: `sam2`, `birefnet`
- Conditional planning tools owner-approval-QA accepted: `rembg`, `transparent_background`
- Fallback planning tools owner-approval-QA accepted: `kornia`
- Eliminated tools owner-approval-QA accepted: `vega_lite`, `d3`
- Current execution allowed: false
- Missing-proof rules owner-approval-QA accepted: true

## subject_segmentation
- Preferred planning tools owner-approval-QA accepted: `sam2`, `birefnet`
- Conditional planning tools owner-approval-QA accepted: `kornia`
- Fallback planning tools owner-approval-QA accepted: `rembg`
- Eliminated tools owner-approval-QA accepted: `echarts`, `vega`
- Current execution allowed: false
- Missing-proof rules owner-approval-QA accepted: true

## upscaling
- Preferred planning tools owner-approval-QA accepted: `real_esrgan`
- Conditional planning tools owner-approval-QA accepted: none
- Fallback planning tools owner-approval-QA accepted: `kornia`
- Eliminated tools owner-approval-QA accepted: `d3`, `satori`
- Current execution allowed: false
- Missing-proof rules owner-approval-QA accepted: true

## tensor_image_ops
- Preferred planning tools owner-approval-QA accepted: `kornia`
- Conditional planning tools owner-approval-QA accepted: `torch_torchvision`
- Fallback planning tools owner-approval-QA accepted: `transformers`
- Eliminated tools owner-approval-QA accepted: `echarts`, `viz_js`
- Current execution allowed: false
- Missing-proof rules owner-approval-QA accepted: true

## model_runtime_foundation
- Preferred planning tools owner-approval-QA accepted: `torch_torchvision`, `transformers`
- Conditional planning tools owner-approval-QA accepted: none
- Fallback planning tools owner-approval-QA accepted: `kornia`
- Eliminated tools owner-approval-QA accepted: `vega_lite`, `lottie_web`
- Current execution allowed: false
- Missing-proof rules owner-approval-QA accepted: true
