# chart_overlay Canonicalization QA

Decision: `ai_graphics_tool_capability_study_canonical_agent_routing_canonicalization_qa_passed_with_warnings`.

- Capability ID: `chart_overlay`
- Canonical status accepted: true
- Source approval accepted: true
- Source QA accepted: true
- Source owner review accepted: true
- Source owner approval accepted: true
- Source owner approval QA accepted: true
- Source canonicalization review accepted: true
- Preferred planning tools QA accepted: `vega_lite`, `d3`
- Conditional planning tools QA accepted: `echarts`
- Fallback planning tools QA accepted: `vega`
- Eliminated tools QA accepted: `sam2`, `real_esrgan`, `three_js unless 3D chart is explicitly requested`
- Current execution allowed: false
- Blocked runtime reasons QA accepted: `planning_metadata_only`, `runtime_approval_missing`, `artifact_policy_missing`
- Next proof milestone QA accepted: Future chart overlay spec/runtime approval before execution.

This QA record uses product-facing capability routing only. Internal owner labels are evidence/exclusion context only and are not capability categories.
