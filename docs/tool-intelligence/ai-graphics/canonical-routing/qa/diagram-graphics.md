# diagram_graphics QA

- capabilityId: `diagram_graphics`
- preferredPlanningToolsAccepted: `viz_js`
- conditionalPlanningToolsAccepted: `svgdotjs_svg_js`
- fallbackPlanningToolsAccepted: `d3`
- eliminatedToolsAccepted: `vega_lite unless the request is a chart`, `sam2`, `real_esrgan`
- requiredProofLevelForExecutionAccepted: Future diagram metadata execution approval before DOT/SVG artifact creation.
- currentExecutionAllowed: false
- blockedRuntimeReasonsAccepted: planning_metadata_only, runtime_approval_missing, artifact_policy_missing
- nextProofMilestoneAccepted: Future diagram metadata execution approval before DOT/SVG artifact creation.

QA accepts this route for planning/study metadata only.
