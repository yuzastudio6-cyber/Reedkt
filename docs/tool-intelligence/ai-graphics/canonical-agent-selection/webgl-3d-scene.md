# Webgl 3d Scene Agent Selection

Decision: `ai_graphics_canonical_agent_selection_review_passed_with_warnings`.

Capability: `webgl_3d_scene`.

- Input intent: 3D/WebGL scene planning
- Input media type: scene_manifest, 3d_scene_spec
- Desired output type: planning_metadata, webgl_scene_plan
- Visual intent: plan 3D scene or game-like WebGL structure
- Candidate tools: `three_js`, `babylonjs`
- Preferred planning tools: `three_js`, `babylonjs`
- Conditional planning tools: none
- Fallback planning tools: `babylonjs`
- Eliminated tools: `vega_lite`, `sam2`
- Required proof before execution: browser/WebGL sandbox approval
- Execution allowed now: false
- Route execution allowed now: false
- Worker execution allowed now: false
- Browser/WebGL/canvas allowed now: false
- GPU/model runtime allowed now: false
- Public artifact allowed now: false
- Signed URL allowed now: false
- Runtime ready now: false
- Internal beta ready now: false
- Production ready now: false
