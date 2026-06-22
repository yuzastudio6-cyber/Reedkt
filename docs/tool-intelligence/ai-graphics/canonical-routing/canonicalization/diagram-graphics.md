# diagram_graphics Canonicalization

Decision: `ai_graphics_tool_capability_study_canonical_agent_routing_canonicalization_review_passed_with_warnings`.

- Capability ID: `diagram_graphics`
- Canonicalization status: `canonicalized_with_warnings_for_planning_metadata_only`
- Preferred planning tools: `viz_js`
- Conditional planning tools: `svgdotjs_svg_js`
- Fallback planning tools: `d3`
- Eliminated tools: `vega_lite unless the request is a chart`, `sam2`, `real_esrgan`
- Blocked runtime reasons: `planning_metadata_only`, `runtime_approval_missing`, `artifact_policy_missing`
- Required proof before execution: Future diagram metadata execution approval before DOT/SVG artifact creation.
- Current execution allowed: false
- Next proof milestone: Future diagram metadata execution approval before DOT/SVG artifact creation.

This is product-facing capability routing. Internal owner labels are evidence/exclusion context only and are not capability categories.
