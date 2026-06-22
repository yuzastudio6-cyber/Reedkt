# canvas_scene Canonicalization QA

Decision: `ai_graphics_tool_capability_study_canonical_agent_routing_canonicalization_qa_passed_with_warnings`.

- Capability ID: `canvas_scene`
- Canonical status accepted: true
- Source approval accepted: true
- Source QA accepted: true
- Source owner review accepted: true
- Source owner approval accepted: true
- Source owner approval QA accepted: true
- Source canonicalization review accepted: true
- Preferred planning tools QA accepted: `pixi_js`, `konva`
- Conditional planning tools QA accepted: none
- Fallback planning tools QA accepted: `svgdotjs_svg_js for static 2D plan`
- Eliminated tools QA accepted: `sam2`, `real_esrgan`, `vega_lite unless the scene is a chart`
- Current execution allowed: false
- Blocked runtime reasons QA accepted: `planning_metadata_only`, `runtime_approval_missing`, `artifact_policy_missing`
- Next proof milestone QA accepted: Browser/canvas sandbox approval before any canvas runtime.

This QA record uses product-facing capability routing only. Internal owner labels are evidence/exclusion context only and are not capability categories.
