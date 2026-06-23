# Canvas Scene Agent Selection

Decision: `ai_graphics_canonical_agent_selection_review_passed_with_warnings`.

Capability: `canvas_scene`.

- Input intent: 2D canvas scene planning
- Input media type: scene_manifest, canvas_layout
- Desired output type: planning_metadata, canvas_scene_plan
- Visual intent: plan 2D canvas or sprite scene structure
- Candidate tools: `pixi_js`, `konva`
- Preferred planning tools: `pixi_js`, `konva`
- Conditional planning tools: none
- Fallback planning tools: `konva`
- Eliminated tools: `sam2`, `real_esrgan`
- Required proof before execution: browser/canvas sandbox approval
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
