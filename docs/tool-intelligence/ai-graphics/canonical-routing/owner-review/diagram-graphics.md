# diagram_graphics Owner Review

- capabilityId: `diagram_graphics`
- sourceApprovalAccepted: true
- sourceQaAccepted: true
- preferredPlanningToolsOwnerAccepted: `viz_js`
- conditionalPlanningToolsOwnerAccepted: `svgdotjs_svg_js`
- fallbackPlanningToolsOwnerAccepted: `d3`
- eliminatedToolsOwnerAccepted: `vega_lite unless the request is a chart`, `sam2`, `real_esrgan`
- requiredProofLevelForExecutionOwnerAccepted: Future diagram metadata execution approval before DOT/SVG artifact creation.
- currentExecutionAllowed: false
- blockedRuntimeReasonsOwnerAccepted: planning_metadata_only, runtime_approval_missing, artifact_policy_missing
- nextProofMilestoneOwnerAccepted: Future diagram metadata execution approval before DOT/SVG artifact creation.

Owner accepts this route for planning/study metadata only.
