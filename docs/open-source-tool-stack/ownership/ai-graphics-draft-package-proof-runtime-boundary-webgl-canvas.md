# AI Graphics WebGL/Canvas Runtime Boundary

Decision: `ai_graphics_draft_package_proof_runtime_boundary_review_passed_with_warnings`

Future lane: `browser_webgl_canvas_sandbox_later`.

Tools:

- `three_js`
- `pixi_js`
- `konva`
- `babylonjs`

Current status: canonical package/import/static-fixture proof only. Browser/WebGL/canvas runtime is not approved now. Future approval must define sandbox execution, GPU/WebGL constraints, deterministic fixture policy, capture/output restrictions, and no public artifact behavior before any runtime proof.

Current booleans: `webglCanvasRuntimeApprovedNow=false`, `browserWebglCanvasRuntimePerformed=false`, `gpuRuntimePerformed=false`, `agentExecutionAllowedNow=false`, `publicArtifactCreated=false`.
