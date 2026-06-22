# diagram_graphics Canonicalization QA

Decision: `ai_graphics_tool_capability_study_canonical_agent_routing_canonicalization_qa_passed_with_warnings`.

- Capability ID: `diagram_graphics`
- Canonical status accepted: true
- Source approval accepted: true
- Source QA accepted: true
- Source owner review accepted: true
- Source owner approval accepted: true
- Source owner approval QA accepted: true
- Source canonicalization review accepted: true
- Preferred planning tools QA accepted: `viz_js`
- Conditional planning tools QA accepted: `svgdotjs_svg_js`
- Fallback planning tools QA accepted: `d3`
- Eliminated tools QA accepted: `vega_lite unless the request is a chart`, `sam2`, `real_esrgan`
- Current execution allowed: false
- Blocked runtime reasons QA accepted: `planning_metadata_only`, `runtime_approval_missing`, `artifact_policy_missing`
- Next proof milestone QA accepted: Future diagram metadata execution approval before DOT/SVG artifact creation.

This QA record uses product-facing capability routing only. Internal owner labels are evidence/exclusion context only and are not capability categories.
