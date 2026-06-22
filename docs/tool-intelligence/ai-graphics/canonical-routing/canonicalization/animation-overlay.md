# animation_overlay Canonicalization

Decision: `ai_graphics_tool_capability_study_canonical_agent_routing_canonicalization_review_passed_with_warnings`.

- Capability ID: `animation_overlay`
- Canonicalization status: `canonicalized_with_warnings_for_planning_metadata_only`
- Preferred planning tools: `lottie_web`, `animejs`
- Conditional planning tools: none
- Fallback planning tools: `satori for static fallback planning`
- Eliminated tools: `sam2`, `real_esrgan`, `vega_lite unless the request is chart animation`
- Blocked runtime reasons: `planning_metadata_only`, `runtime_approval_missing`, `artifact_policy_missing`
- Required proof before execution: Animation manifest/runtime approval before player or timeline execution.
- Current execution allowed: false
- Next proof milestone: Animation manifest/runtime approval before player or timeline execution.

This is product-facing capability routing. Internal owner labels are evidence/exclusion context only and are not capability categories.
