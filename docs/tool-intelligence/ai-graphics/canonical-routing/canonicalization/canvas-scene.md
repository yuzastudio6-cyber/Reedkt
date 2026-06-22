# canvas_scene Canonicalization

Decision: `ai_graphics_tool_capability_study_canonical_agent_routing_canonicalization_review_passed_with_warnings`.

- Capability ID: `canvas_scene`
- Canonicalization status: `canonicalized_with_warnings_for_planning_metadata_only`
- Preferred planning tools: `pixi_js`, `konva`
- Conditional planning tools: none
- Fallback planning tools: `svgdotjs_svg_js for static 2D plan`
- Eliminated tools: `sam2`, `real_esrgan`, `vega_lite unless the scene is a chart`
- Blocked runtime reasons: `planning_metadata_only`, `runtime_approval_missing`, `artifact_policy_missing`
- Required proof before execution: Browser/canvas sandbox approval before any canvas runtime.
- Current execution allowed: false
- Next proof milestone: Browser/canvas sandbox approval before any canvas runtime.

This is product-facing capability routing. Internal owner labels are evidence/exclusion context only and are not capability categories.
