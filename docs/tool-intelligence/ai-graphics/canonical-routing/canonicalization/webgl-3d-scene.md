# webgl_3d_scene Canonicalization

Decision: `ai_graphics_tool_capability_study_canonical_agent_routing_canonicalization_review_passed_with_warnings`.

- Capability ID: `webgl_3d_scene`
- Canonicalization status: `canonicalized_with_warnings_for_planning_metadata_only`
- Preferred planning tools: `three_js`, `babylonjs`
- Conditional planning tools: none
- Fallback planning tools: `pixi_js for 2D fallback`, `d3 for non-3D chart fallback`
- Eliminated tools: `vega_lite unless 3D chart is explicitly requested`, `sam2`, `real_esrgan`
- Blocked runtime reasons: `planning_metadata_only`, `runtime_approval_missing`, `artifact_policy_missing`
- Required proof before execution: Browser/WebGL sandbox approval before any scene runtime.
- Current execution allowed: false
- Next proof milestone: Browser/WebGL sandbox approval before any scene runtime.

This is product-facing capability routing. Internal owner labels are evidence/exclusion context only and are not capability categories.
