# Canonical Agent Selection Canonicalization Owner Approval Matrix

Decision: `ai_graphics_canonical_agent_selection_canonicalization_owner_approved_with_warnings`

Owner-approval matrix for all product-facing capabilities.

## chart_overlay
- Preferred planning tools owner-approved: `vega_lite`, `d3`
- Conditional planning tools owner-approved: `echarts`
- Fallback planning tools owner-approved: `vega`
- Eliminated tools owner-approved: `three_js`, `sam2`, `real_esrgan`
- Current execution allowed: false
- Missing-proof rules owner-approved: true

## data_visualization
- Preferred planning tools owner-approved: `vega_lite`, `vega`, `d3`
- Conditional planning tools owner-approved: `echarts`
- Fallback planning tools owner-approved: `svgdotjs_svg_js`
- Eliminated tools owner-approved: `sam2`, `real_esrgan`, `lottie_web`
- Current execution allowed: false
- Missing-proof rules owner-approved: true

## svg_graphics
- Preferred planning tools owner-approved: `svgdotjs_svg_js`, `satori`
- Conditional planning tools owner-approved: `d3`
- Fallback planning tools owner-approved: `viz_js`
- Eliminated tools owner-approved: `sam2`, `real_esrgan`
- Current execution allowed: false
- Missing-proof rules owner-approved: true

## diagram_graphics
- Preferred planning tools owner-approved: `viz_js`
- Conditional planning tools owner-approved: `svgdotjs_svg_js`
- Fallback planning tools owner-approved: `d3`
- Eliminated tools owner-approved: `vega_lite`
- Current execution allowed: false
- Missing-proof rules owner-approved: true

## animation_overlay
- Preferred planning tools owner-approved: `lottie_web`, `animejs`
- Conditional planning tools owner-approved: none
- Fallback planning tools owner-approved: `satori`
- Eliminated tools owner-approved: `real_esrgan`, `sam2`
- Current execution allowed: false
- Missing-proof rules owner-approved: true

## canvas_scene
- Preferred planning tools owner-approved: `pixi_js`, `konva`
- Conditional planning tools owner-approved: none
- Fallback planning tools owner-approved: `svgdotjs_svg_js`
- Eliminated tools owner-approved: `torch_torchvision`, `transformers`
- Current execution allowed: false
- Missing-proof rules owner-approved: true

## webgl_3d_scene
- Preferred planning tools owner-approved: `three_js`, `babylonjs`
- Conditional planning tools owner-approved: none
- Fallback planning tools owner-approved: `pixi_js`
- Eliminated tools owner-approved: `vega_lite`, `d3`
- Current execution allowed: false
- Missing-proof rules owner-approved: true

## background_removal
- Preferred planning tools owner-approved: `sam2`, `birefnet`
- Conditional planning tools owner-approved: `rembg`, `transparent_background`
- Fallback planning tools owner-approved: `kornia`
- Eliminated tools owner-approved: `vega_lite`, `d3`
- Current execution allowed: false
- Missing-proof rules owner-approved: true

## subject_segmentation
- Preferred planning tools owner-approved: `sam2`, `birefnet`
- Conditional planning tools owner-approved: `kornia`
- Fallback planning tools owner-approved: `rembg`
- Eliminated tools owner-approved: `echarts`, `vega`
- Current execution allowed: false
- Missing-proof rules owner-approved: true

## upscaling
- Preferred planning tools owner-approved: `real_esrgan`
- Conditional planning tools owner-approved: none
- Fallback planning tools owner-approved: `kornia`
- Eliminated tools owner-approved: `d3`, `satori`
- Current execution allowed: false
- Missing-proof rules owner-approved: true

## tensor_image_ops
- Preferred planning tools owner-approved: `kornia`
- Conditional planning tools owner-approved: `torch_torchvision`
- Fallback planning tools owner-approved: `transformers`
- Eliminated tools owner-approved: `echarts`, `viz_js`
- Current execution allowed: false
- Missing-proof rules owner-approved: true

## model_runtime_foundation
- Preferred planning tools owner-approved: `torch_torchvision`, `transformers`
- Conditional planning tools owner-approved: none
- Fallback planning tools owner-approved: `kornia`
- Eliminated tools owner-approved: `vega_lite`, `lottie_web`
- Current execution allowed: false
- Missing-proof rules owner-approved: true
