# tensor_image_ops Canonicalization

Decision: `ai_graphics_tool_capability_study_canonical_agent_routing_canonicalization_review_passed_with_warnings`.

- Capability ID: `tensor_image_ops`
- Canonicalization status: `canonicalized_with_warnings_for_planning_metadata_only`
- Preferred planning tools: `kornia`
- Conditional planning tools: `torch_torchvision`
- Fallback planning tools: `blocked manual planning until import proof`
- Eliminated tools: `vega_lite`, `lottie_web`, `viz_js`
- Blocked runtime reasons: `planning_metadata_only`, `runtime_approval_missing`, `artifact_policy_missing`
- Required proof before execution: CPU import and tensor/image operation contract proof before execution.
- Current execution allowed: false
- Next proof milestone: CPU import and tensor/image operation contract proof before execution.

This is product-facing capability routing. Internal owner labels are evidence/exclusion context only and are not capability categories.
